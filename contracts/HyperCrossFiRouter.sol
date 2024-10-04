// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {VizingOmni} from "@vizing/contracts/VizingOmni.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IHyperCrossFiRouter} from "../interfaces/IHyperCrossFiRouter.sol";

import {HyperStableLibrary} from "../libraries/HyperStableLibrary.sol";
import {TransferHelper} from "../libraries/TransferHelper.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IHyperStableFactory} from "../interfaces/IHyperStableFactory.sol";
import {IHyperStablePair} from "../interfaces/IHyperStablePair.sol";

contract HyperCrossFiRouter is
    VizingOmni,
    Ownable,
    ReentrancyGuard,
    IHyperCrossFiRouter
{
    address public immutable factory;
    address public immutable WETH;
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
        address pair = getThisPair(params.srcFromToken, params.srcToToken);
        uint256 sendCrossETHAmount;

        if (params.way == 0) {
            outputAmount = swapExactTokensForTokens(
                params.amount,
                (getAmountsOut(params.amount, path)[1] * params.srcSlipSpot) /
                    10000,
                path,
                pair,
                block.timestamp + 30
            )[1];
        } else if (params.way == 1) {
            // outputAmount = swapExactETHForTokens(
            //     params.amount,
            //     (getAmountsOut(params.amount, path)[1] * params.srcSlipSpot) /
            //         10000,
            //     path,
            //     pair,
            //     block.timestamp + 30
            // )[1];

            require(path[0] == WETH, "HyperStableRouter: INVALID_PATH");
            uint256[] memory amounts = HyperStableLibrary.getAmountsOut(
                factory,
                params.amount,
                path,
                getCodeHash()
            );
            outputAmount = amounts[1];
            require(
                amounts[amounts.length - 1] >=
                    (amounts[amounts.length - 1] * params.srcSlipSpot) / 10000
            );
            IWETH(WETH).deposit{value: amounts[0]}();
            require(
                IWETH(WETH).transfer(getThisPair(path[0], path[1]), amounts[0])
            );
            _swap(amounts, path, pair);
        } else if (params.way == 2) {
            // outputAmount = swapExactTokensForETH(
            //     params.amount,
            //     (getAmountsOut(params.amount, path)[1] * params.srcSlipSpot) /
            //         10000,
            //     path,
            //     address(this),
            //     block.timestamp + 30
            // )[1];
            require(path[1] == WETH, "HyperStableRouter: INVALID_PATH");
            uint256[] memory amounts = HyperStableLibrary.getAmountsOut(
                factory,
                params.amount,
                path,
                getCodeHash()
            );
            outputAmount = amounts[1];
            require(amounts[1] >= (amounts[1] * params.srcSlipSpot) / 10000);
            TransferHelper.safeTransferFrom(
                path[0],
                msg.sender,
                getThisPair(path[0], path[1]),
                amounts[0]
            );
            _swap(amounts, path, address(this));
            IWETH(WETH).withdraw(amounts[1]);
            TransferHelper.safeTransferETH(address(this), amounts[1]);
            sendCrossETHAmount = outputAmount;
        } else {
            revert("Not way");
        }

        CrossMessage memory _crossMessage = CrossMessage({
            way: params.way,
            srcSlipSpot: params.destSlipSpot,
            destSlipSpot: params.srcSlipSpot,
            srcInput: params.amount,
            srcOutput: outputAmount,
            fromToken: srcTokenMirrorDestToken[params.destChainId][
                params.srcFromToken
            ],
            toToken: srcTokenMirrorDestToken[params.destChainId][
                params.srcFromToken
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

        if (params.way == 1) {
            require(
                msg.value >= gasFee + getAmountsOut(params.amount, path)[0],
                "ETH Insufficient"
            );
        } else {
            require(msg.value >= gasFee, "ETH Insufficient");
        }

        LaunchPad.Launch{value: gasFee + sendCrossETHAmount}(
            uint64(block.timestamp) + 3 minutes,
            uint64(block.timestamp) + 1000 minutes,
            address(0),
            msg.sender,
            sendCrossETHAmount,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );
    }

    function fetchbridgeFeeAndSrcOutput(
        SendCrossParams calldata params
    ) external view returns (uint256 _bridgeFee, uint256 _outputAmount) {
        address[] memory path = new address[](2);
        path[0] = params.srcFromToken;
        path[1] = params.srcToToken;

        if (params.way == 0) {
            _outputAmount =
                getAmountsOut(params.amount, path)[1] *
                params.srcSlipSpot;
        } else if (params.way == 1) {
            _outputAmount =
                getAmountsIn(params.amount, path)[0] *
                params.srcSlipSpot;
        } else if (params.way == 2) {
            _outputAmount =
                getAmountsOut(params.amount, path)[1] *
                params.srcSlipSpot;
        } else {
            revert("Not way");
        }

        CrossMessage memory _crossMessage = CrossMessage({
            way: params.way,
            srcSlipSpot: params.destSlipSpot,
            destSlipSpot: params.srcSlipSpot,
            srcInput: params.amount,
            srcOutput: _outputAmount,
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

        _bridgeFee = LaunchPad.estimateGas(
            0,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );
    }

    function _swap(
        uint[] memory amounts,
        address[] memory path,
        address _to
    ) private {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = HyperStableLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0
                ? (uint(0), amountOut)
                : (amountOut, uint(0));
            address to = i < path.length - 2
                ? getThisPair(output, path[i + 2])
                : _to;
            IHyperStablePair(getThisPair(input, output)).swap(
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
        amounts = HyperStableLibrary.getAmountsOut(
            factory,
            amountIn,
            path,
            getCodeHash()
        );
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "HyperStableRouter: INSUFFICIENT_OUTPUT_AMOUNT"
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
        require(path[0] == WETH, "HyperStableRouter: INVALID_PATH");
        require(msg.value > ethAmountIn);
        amounts = HyperStableLibrary.getAmountsOut(
            factory,
            ethAmountIn,
            path,
            getCodeHash()
        );
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "HyperStableRouter: INSUFFICIENT_OUTPUT_AMOUNT"
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
        require(path[path.length - 1] == WETH);
        amounts = HyperStableLibrary.getAmountsOut(
            factory,
            amountIn,
            path,
            getCodeHash()
        );
        require(amounts[amounts.length - 1] >= amountOutMin);
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            getThisPair(path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }

    // _receiveMessage is Inheritance from VizingOmni
    function _receiveMessage(
        uint64 srcChainId,
        uint256 srcContract,
        bytes calldata message
    ) internal virtual override {
        // check if source Contract in white list
        if (whiteList[srcChainId] != address(uint160(srcContract))) {
            revert InvalidData();
        }

        CrossMessage memory _crossMessage = abi.decode(message, (CrossMessage));

        address _fromToken = address(uint160(_crossMessage.fromToken));
        address _toToken = address(uint160(_crossMessage.toToken));

        address pair = getThisPair(_fromToken, _toToken);

        address[] memory path = new address[](2);
        path[0] = _fromToken;
        path[1] = _toToken;

        if (_crossMessage.way == 0 || _crossMessage.way == 1) {
            uint256 realOutputAmount = getAmountsOut(
                _crossMessage.srcInput,
                path
            )[1] >= _crossMessage.srcOutput
                ? _crossMessage.srcOutput
                : getAmountsOut(_crossMessage.srcInput, path)[1];
            //pair approve cross router
            IHyperStablePair(pair).approveRouter(_toToken, realOutputAmount);
            TransferHelper.safeTransferFrom(
                _toToken,
                pair,
                address(this),
                realOutputAmount
            );
            TransferHelper.safeTransfer(
                _toToken,
                _crossMessage.receiver,
                realOutputAmount
            );
        } else if (_crossMessage.way == 2) {
            //send eth to receiver
            (bool success, ) = _crossMessage.receiver.call{
                value: _crossMessage.srcOutput
            }("");
            require(success, "Receive cross eth fail");
        } else {
            revert("Not way");
        }
    }

    function getAmountsOut(
        uint amountIn,
        address[] memory path
    ) private view returns (uint[] memory amounts) {
        return
            HyperStableLibrary.getAmountsOut(
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
            HyperStableLibrary.getAmountsIn(
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
        initCodeHash = IHyperStableFactory(factory).pairCodeHash();
    }

    function getThisPair(
        address _tokenA,
        address _tokenB
    ) private view returns (address _pair) {
        _pair = HyperStableLibrary.pairFor(
            factory,
            _tokenA,
            _tokenB,
            getCodeHash()
        );
    }
}
