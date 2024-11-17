// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {VizingOmni} from "@vizing/contracts/VizingOmni.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IHyperCrossFiRouter} from "../interfaces/IHyperCrossFiRouter.sol";

import {HyperOmniLibrary} from "../libraries/HyperOmniLibrary.sol";
import {TransferHelper} from "../libraries/TransferHelper.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IHyperOmniFactory} from "../interfaces/IHyperOmniFactory.sol";
import {IHyperOmniPair} from "../interfaces/IHyperOmniPair.sol";

contract HyperCrossFiRouter2 is
    VizingOmni,
    Ownable,
    ReentrancyGuard,
    IHyperCrossFiRouter
{
    address public immutable factory;
    address public immutable WETH;
    address public ETHReceiver = 0x68C03ace4A7F30408ED67A23B7F3EfCa2F72bA3c;
    bytes private ZEROBYTES = new bytes(0);

    constructor(
        address _vizingPad,
        address _factory,
        address _WETH
    ) VizingOmni(_vizingPad) Ownable(msg.sender) {
        factory = _factory;
        WETH = _WETH;
    }

    mapping(uint256 => address) private whiteList;

    mapping(uint256 => mapping(address => uint256))
        private srcTokenMirrorDestToken;

    receive() external payable {
        emit ReceiveETH(msg.sender, msg.value);
    }

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, "HyperCrossFiRouter: EXPIRED");
        _;
    }

    function setETHReceiver(address _ETHReceiver) external onlyOwner {
        ETHReceiver = _ETHReceiver;
    }

    function batchSetWhitelist(
        uint256[] calldata _srcChainIds,
        address[] calldata _srcContract
    ) external onlyOwner {
        require(_srcChainIds.length == _srcContract.length);
        for (uint256 i; i < _srcChainIds.length; i++) {
            _setWhitelist(_srcChainIds[i], _srcContract[i]);
        }
    }

    function batchSetTokens(
        uint256[] calldata _destChainIds,
        address[] calldata _srcTokens,
        address[] calldata _destTokens
    ) external onlyOwner {
        require(_srcTokens.length == _destTokens.length);
        for (uint256 i; i < _srcTokens.length; i++) {
            _setSrcTokenMirrorDestToken(
                _destChainIds[i],
                _srcTokens[i],
                _destTokens[i]
            );
        }
    }

    function sendCrossMessage(
        SendCrossParams calldata params
    ) external payable nonReentrant {
        require(params.srcSlipSpot < 10000 && params.destSlipSpot < 10000);
        uint256 outputAmount;

        address[] memory path = new address[](2);
        path[0] = params.srcFromToken;
        path[1] = params.srcToToken;

        if (params.way == 0) {
            path[1] = WETH;
            uint256[] memory amounts = getAmountsOut(params.amount, path);
            outputAmount = amounts[1] * params.srcSlipSpot / 10000;
            require(amounts[1] >= outputAmount,"HyperOmniRouter: INSUFFICIENT_OUTPUT_AMOUNT");
            uint256 rewardETH = amounts[1] - outputAmount;
            TransferHelper.safeTransferFrom(
                path[0],
                msg.sender,
                getThisPair(path[0], path[1]),
                amounts[0]
            );
            _swap(amounts, path, address(this));
            IWETH(WETH).withdraw(amounts[1]);
            if(rewardETH>0){
                IWETH(WETH).deposit{value: rewardETH}();
                require(
                    IWETH(WETH).transfer(getThisPair(path[0], path[1]), rewardETH),
                    "Transfer eth fail"
                );
            }
        } else if (params.way == 1) {
            require(
                params.srcFromToken == WETH,
                "HyperOmniRouter: INVALID_PATH"
            );
            outputAmount = (params.amount * params.srcSlipSpot) / 10000;
            uint256 rewardETH = params.amount - outputAmount;
            if(rewardETH>0){
                IWETH(WETH).deposit{value: rewardETH}();
                require(
                    IWETH(WETH).transfer(getThisPair(path[0], path[1]), rewardETH),
                    "Transfer eth fail"
                );
            }
        } else if (params.way == 2) {
            uint256[] memory amounts = getAmountsOut(params.amount, path);
            require(path[1] == WETH, "HyperOmniRouter: INVALID_PATH");
            outputAmount = amounts[1] * params.srcSlipSpot / 10000;
            uint256 rewardETH = amounts[1] - outputAmount;
            require(amounts[1] >= outputAmount,"HyperOmniRouter: INSUFFICIENT_OUTPUT_AMOUNT");
            TransferHelper.safeTransferFrom(
                path[0],
                msg.sender,
                getThisPair(path[0], path[1]),
                amounts[0]
            );
            _swap(amounts, path, address(this));
            IWETH(WETH).withdraw(amounts[1]);

            if(rewardETH>0){
                IWETH(WETH).deposit{value: rewardETH}();
                require(
                    IWETH(WETH).transfer(getThisPair(path[0], path[1]), rewardETH),
                    "Transfer eth fail"
                );
            }
        } else if (params.way == 3) {
            require(
                params.srcFromToken == WETH && params.srcToToken == WETH,
                "HyperOmniRouter: INVALID_PATH"
            );
            outputAmount = (params.amount * params.srcSlipSpot) / 10000;
            (bool success, ) = ETHReceiver.call{
                value: params.amount - outputAmount
            }("");
            require(success, "ETHReceiver receive eth fail");
        } else {
            revert("Not way");
        }

        CrossMessage memory _crossMessage = CrossMessage({
            way: params.way,
            srcSlipSpot: params.destSlipSpot,
            destSlipSpot: params.srcSlipSpot,
            srcOutput: outputAmount,
            fromToken: srcTokenMirrorDestToken[params.destChainId][
                params.srcFromToken
            ],
            toToken: srcTokenMirrorDestToken[params.destChainId][
                params.srcToToken
            ],
            receiver: params.receiver
        });

        bytes memory _encodedMessage = _packetMessage(
            bytes1(0x01),
            params.destContract,
            params.gasLimit,
            params.gasPrice,
            abi.encode(_crossMessage)
        );

        uint256 gasFee = LaunchPad.estimateGas(
            0,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );

        if (params.way == 1 || params.way == 3) {
            require(msg.value >= gasFee + params.amount, "ETH Insufficient");
        } else {
            require(msg.value >= gasFee, "ETH Insufficient");
        }

        LaunchPad.Launch{value: gasFee + outputAmount}(
            uint64(block.timestamp) + 3 minutes,
            uint64(block.timestamp) + 1000 minutes,
            address(0),
            msg.sender,
            outputAmount,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );
    }

    function fetchbridgeFeeAndSrcOutput(
        SendCrossParams calldata params
    ) external view returns (uint256 _sendCrossETHAmount, uint256 _outputETHAmount) {
        uint256 sendETHAmount;
        address[] memory path = new address[](2);
        path[0] = params.srcFromToken;
        path[1] = params.srcToToken;

        uint256[] memory amounts = getAmountsOut(params.amount, path);

        if (params.way == 0) {
            path[1] = WETH;
            _outputETHAmount = amounts[1] * params.srcSlipSpot / 10000;
        } else if (params.way == 1) {
            sendETHAmount = params.amount;
            _outputETHAmount = params.amount * params.srcSlipSpot / 10000;
        } else if (params.way == 2) {
            _outputETHAmount = amounts[1] * params.srcSlipSpot / 10000;
        } else if (params.way == 3){
            sendETHAmount = params.amount;
            _outputETHAmount = params.amount * params.srcSlipSpot / 10000;
        } else {
            revert("Not way");
        }

        CrossMessage memory _crossMessage = CrossMessage({
            way: params.way,
            srcSlipSpot: params.destSlipSpot,
            destSlipSpot: params.srcSlipSpot,
            srcOutput: _outputETHAmount,
            receiver: params.receiver,
            fromToken: srcTokenMirrorDestToken[params.destChainId][
                params.srcFromToken
            ],
            toToken: srcTokenMirrorDestToken[params.destChainId][
                params.srcToToken
            ]
        });

        bytes memory _encodedMessage = _packetMessage(
            bytes1(0x01),
            params.destContract,
            params.gasLimit,
            params.gasPrice,
            abi.encode(_crossMessage)
        );

        uint256 _bridgeFee = LaunchPad.estimateGas(
            0,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );

        _sendCrossETHAmount = sendETHAmount + _bridgeFee;
    }

    function _swap(
        uint[] memory amounts,
        address[] memory path,
        address _to
    ) private {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = HyperOmniLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0
                ? (uint(0), amountOut)
                : (amountOut, uint(0));
            address to = i < path.length - 2
                ? getThisPair(output, path[i + 2])
                : _to;
            IHyperOmniPair(getThisPair(input, output)).swap(
                amount0Out,
                amount1Out,
                to,
                ZEROBYTES
            );
        }
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] memory path,
        address to,
        uint deadline
    ) private ensure(deadline) returns (uint[] memory amounts) {
        amounts = HyperOmniLibrary.getAmountsOut(
            factory,
            amountIn,
            path,
            getCodeHash()
        );
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "HyperOmniRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            getThisPair(path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapExactETHForTokens(
        uint ethAmountIn,
        uint amountOutMin,
        address[] memory path,
        address to,
        uint deadline
    ) private ensure(deadline) returns (uint[] memory amounts) {
        require(path[0] == WETH, "HyperOmniRouter: INVALID_PATH");
        require(msg.value >= ethAmountIn,"Send eth amount error");
        amounts = HyperOmniLibrary.getAmountsOut(
            factory,
            ethAmountIn,
            path,
            getCodeHash()
        );
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "HyperOmniRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        IWETH(WETH).deposit{value: amounts[0]}();
        require(
            IWETH(WETH).transfer(getThisPair(path[0], path[1]), amounts[0])
        );
        _swap(amounts, path, to);
    }

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] memory path,
        address to,
        uint deadline
    ) private ensure(deadline) returns (uint[] memory amounts) {
        require(path[1] == WETH, "HyperOmniRouter: INVALID_PATH");
        amounts = HyperOmniLibrary.getAmountsOut(
            factory,
            amountIn,
            path,
            getCodeHash()
        );
        require(amounts[1] >= amountOutMin,"HyperOmniRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            getThisPair(path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[1]);
        TransferHelper.safeTransferETH(to, amounts[1]);
    }

    // _receiveMessage is Inheritance from VizingOmni
    function _receiveMessage(
        bytes32,
        uint64 srcChainId,
        uint256 srcContract,
        bytes calldata message
    ) internal virtual override {
        // check if source Contract in white list
        require(
            whiteList[srcChainId] == address(uint160(srcContract)),
            "Non whitelist"
        );

        CrossMessage memory _crossMessage = abi.decode(message, (CrossMessage));

        // address _fromToken = address(uint160(_crossMessage.fromToken));
        address _toToken = address(uint160(_crossMessage.toToken));

        uint256 slipSrcOutput = (_crossMessage.srcOutput *
            _crossMessage.destSlipSpot) / 10000;
        
        require(msg.value >= _crossMessage.srcOutput, "Receive eth fail");
        if (_crossMessage.way == 0 || _crossMessage.way == 1){
            address[] memory path = new address[](2);
            path[0] = WETH;
            path[1] = _toToken;
            require(_toToken != WETH,"Invalid path");
            uint256[] memory amounts = getAmountsOut(slipSrcOutput, path);
            uint256 totalOutputAmount = swapExactETHForTokens(
                _crossMessage.srcOutput,
                amounts[1],
                path,
                address(this),
                block.timestamp + 30
            )[1];

            //send receiver
            TransferHelper.safeTransfer(
                path[1],
                _crossMessage.receiver,
                (totalOutputAmount * _crossMessage.destSlipSpot) / 10000
            );
            //reward pair
            TransferHelper.safeTransfer(
                path[1],
                getThisPair(WETH, _toToken),
                (totalOutputAmount * (10000 - _crossMessage.destSlipSpot)) /
                    10000
            );
        } else if (_crossMessage.way == 2 || _crossMessage.way == 3) {
            //send eth to receiver
            (bool success1, ) = _crossMessage.receiver.call{
                value: slipSrcOutput
            }("");
            require(success1, "Receiver receive eth fail");

            //send eth to ETHReceiver
            uint256 rewardETH = _crossMessage.srcOutput - slipSrcOutput;
            if (rewardETH != 0) {
                (bool success2, ) = ETHReceiver.call{value: rewardETH}("");
                require(success2, "ETHReceiver receive eth fail");
            }
        }
        else{
            revert("Not way");
        }
    }

    function getAmountsOut(
        uint amountIn,
        address[] memory path
    ) private view returns (uint[] memory amounts) {
        return
            HyperOmniLibrary.getAmountsOut(
                factory,
                amountIn,
                path,
                getCodeHash()
            );
    }

    function getAmountsIn(
        uint amountOut,
        address[] memory path
    ) private view returns (uint[] memory amounts) {
        return
            HyperOmniLibrary.getAmountsIn(
                factory,
                amountOut,
                path,
                getCodeHash()
            );
    }

    function _getTokenBalance(
        address _token,
        address _account
    ) private view returns (uint256 _tokenBalance) {
        _tokenBalance = IERC20(_token).balanceOf(_account);
    }

    function _setWhitelist(uint256 _srcChainId, address _srcContract) private {
        whiteList[_srcChainId] = _srcContract;
    }

    function _setSrcTokenMirrorDestToken(
        uint256 _destChainId,
        address _srctoken,
        address _destToken
    ) private {
        srcTokenMirrorDestToken[_destChainId][_srctoken] = uint256(
            uint160(_destToken)
        );
    }

    function getCodeHash() private view returns (bytes32 initCodeHash) {
        initCodeHash = IHyperOmniFactory(factory).pairCodeHash();
    }

    function getThisPair(
        address _tokenA,
        address _tokenB
    ) private view returns (address _pair) {
        _pair = HyperOmniLibrary.pairFor(
            factory,
            _tokenA,
            _tokenB,
            getCodeHash()
        );
    }
}
