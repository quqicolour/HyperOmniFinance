// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {VizingOmni} from "@vizing/contracts/VizingOmni.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {TransferHelper} from "../libraries/TransferHelper.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IUniswapV2Router02} from "../interfaces/uniswapV2/IUniswapV2Router02.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

//cctp
import {ITokenMessenger} from "../interfaces/cctp/ITokenMessenger.sol";

import {IHyperOmniEvent} from "../interfaces/IHyperOmniEvent.sol";
import {IHyperOmniStruct} from "../interfaces/IHyperOmniStruct.sol";

import {IUniSwapV3Router} from "../interfaces/uniswapV3/IUniSwapV3Router.sol";
import {IUniswapV3Factory} from "../interfaces/uniswapV3/IUniswapV3Factory.sol";

contract HyperAssembleRouter is
    VizingOmni,
    Ownable,
    ReentrancyGuard,
    IHyperOmniEvent,
    IHyperOmniStruct
{
    uint256 private orderId;
    address private tokenMessager;
    address private USDC;
    address private WETH;
    address private feeReceiver;
    address[] private routers;
    bytes private ZEROBYTES = new bytes(0);

    constructor(
        address _USDC,
        address _WETH,
        address _vizingPad,
        address _tokenMessager
    ) VizingOmni(_vizingPad) Ownable(msg.sender) {
        USDC = _USDC;
        WETH = _WETH;
        feeReceiver = msg.sender;
        tokenMessager = _tokenMessager;
    }

    mapping(address => bytes1) private validRouter;
    mapping(address => bytes1) private validVipNft;

    mapping(uint256 => address) private whiteList;

    mapping(uint256 => CrossMessage) private _CrossMessage;

    receive() external payable{}

    function addRouter(address _router)external onlyOwner{
        routers.push(_router);
    }

    function batchSetWhitelist(
        uint256[] calldata _srcChainIds,
        address[] calldata _srcContract
    ) external onlyOwner {
        for (uint256 i; i < _srcChainIds.length; i++) {
            _setWhitelist(_srcChainIds[i], _srcContract[i]);
        }
    }

    function batchSetValidRouters(
        address[] calldata _routers,
        bytes1[] calldata _states
    ) external onlyOwner {
        for (uint256 i; i < _routers.length; i++) {
            validRouter[_routers[i]] = _states[i];
        }
    }

    function batchSetValidNfts(
        address[] calldata _nfts,
        bytes1[] calldata _states
    ) external onlyOwner {
        for (uint256 i; i < _nfts.length; i++) {
            validVipNft[_nfts[i]] = _states[i];
        }
    }

    function changeFeeReceiver(address _newFeeReceiver) external onlyOwner {
        feeReceiver = _newFeeReceiver;
    }

    // 0 eth=>eth, 1 token=>eth, 2 token=>eth=>token
    function v2SwapCross(
        V2CrossSwapParams calldata params
    ) external payable nonReentrant {
        require(params.srcSlipSpot < 10000);
        uint256 outputAmount;
        uint256 fee = _getFee(params.amount, params.srcSlipSpot, params.vipNft);

        if (params.way == 0) {
            if (fee != 0) {
                (bool success, ) = feeReceiver.call{value: fee}("");
                require(success, "Receive fee fail");
            }
            outputAmount = params.amount - fee;
        } else if (params.way == 1 || params.way == 2) {
            IERC20(params.path[0]).transferFrom(
                msg.sender,
                address(this),
                params.amount
            );
            uint256 actualAmount = params.amount - fee;
            uint256 amountOutMin = _getBestOutput(
                params.bestRouter,
                actualAmount,
                params.path
            );
            if (fee != 0) {
                IERC20(params.path[0]).transfer(feeReceiver, fee);
            }
            IERC20(params.path[0]).approve(params.bestRouter, actualAmount);
            outputAmount = IUniswapV2Router02(params.bestRouter)
                .swapExactTokensForETH(
                    actualAmount,
                    amountOutMin,
                    params.path,
                    address(this),
                    block.timestamp + 30
                )[1];
        } else {
            revert("Not way");
        }

        CrossMessage memory _crossMessage = CrossMessage({
            way: params.way,
            srcSlipSpot: params.srcSlipSpot,
            receiver: params.receiver,
            targetToken: params.targetToken,
            srcOutput: outputAmount
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

        if (params.way == 0) {
            require(msg.value >= gasFee + params.amount, "ETH Insufficient");
        } else {
            require(msg.value >= gasFee, "ETH Insufficient");
        }

        LaunchPad.Launch{value: gasFee + outputAmount}(
            uint64(block.timestamp) + 200,
            uint64(block.timestamp) + 1000 minutes,
            address(0),
            msg.sender,
            outputAmount,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );
    }

    function v2SwapWithUSDC(CrossUSDCSwapInfo calldata params) external payable{
        uint256 crossUsdcAmount;
        uint256 fee = _getFee(params.amount, params.srcSlipSpot, params.vipNft);
        //usdc=>usdc
        if (params.way == 0) {
            IERC20(USDC).transferFrom(msg.sender, address(this), params.amount);
            if(fee!=0){
                IERC20(USDC).transfer(feeReceiver, fee);
            }
            crossUsdcAmount = params.amount - fee;
            //token=>usdc=>usdc
        } else if (params.way == 1) {
            require(
                params.path[params.path.length - 1] == USDC,
                "Final token non usdc"
            );
            if(fee!=0){
                (bool success,)=feeReceiver.call{value: fee}("");
                require(success, "Fee receive fail");
            }
            uint256 amountOutMin = _getBestOutput(
                params.bestRouter,
                params.amount - fee,
                params.path
            );
            crossUsdcAmount = IUniswapV2Router02(params.bestRouter).swapExactETHForTokens{value: params.amount - fee}(
                    amountOutMin,
                    params.path,
                    address(this),
                    block.timestamp + 30
                )[1];
        } else {
            revert("Not way");
        }

        bytes1 state = _transferCCTPUSDC(
            msg.sender,
            params.receiver,
            crossUsdcAmount,
            params.destinationDomain
        );
        require(state == 0x01);
    }

    function reStartCCTPUSDC(
        bytes calldata originalMessage,
        bytes calldata originalAttestation,
        bytes32 newDestinationCaller,
        bytes32 newMintRecipient
    ) external {
        ITokenMessenger(tokenMessager).replaceDepositForBurn(
            originalMessage,
            originalAttestation,
            newDestinationCaller,
            newMintRecipient
        );
    }

    function _receiveMessage(
        bytes32 messageId,
        uint64 srcChainId,
        uint256 srcContract,
        bytes calldata message
    ) internal virtual override {
        require(
            whiteList[srcChainId] == address(uint160(srcContract)),
            "Non whitelist"
        );
        uint256 outputAmount;

        CrossMessage memory _crossMessage = abi.decode(message, (CrossMessage));

        if (_crossMessage.way == 0 || _crossMessage.way == 1) {
            outputAmount = _crossMessage.srcOutput;
            (bool success, ) = _crossMessage.receiver.call{
                value: outputAmount
            }("");
            require(success, "Receive eth fail");
        } else if (_crossMessage.way == 2) {
            address[] memory path = new address[](2); 
            path[0] = WETH; 
            path[1] = _crossMessage.targetToken; 
            address _bestRouter = getBestRouterAddress(
                _crossMessage.srcOutput,
                path
            );
            uint256 amountOutMin = _getBestOutput(
                _bestRouter,
                _crossMessage.srcOutput,
                path
            );
            outputAmount = IUniswapV2Router02(_bestRouter).swapExactETHForTokens{value: _crossMessage.srcOutput}(
                amountOutMin,
                path,
                _crossMessage.receiver,
                block.timestamp + 30
            )[1];
        } else {
            revert("Not way");
        }
        emit ReceiveMessage(_crossMessage.receiver, _crossMessage.targetToken, outputAmount);
    }

    function _transferCCTPUSDC(
        address _sender,
        address _receiver,
        uint256 _amount,
        uint32 _destinationDomain
    ) private returns (bytes1 _state) {
        IERC20(USDC).approve(tokenMessager, _amount);
        ITokenMessenger(tokenMessager).depositForBurn(
            _amount,
            _destinationDomain,
            addressToBytes32(_receiver),
            USDC
        );
        emit CrossUSDC(_sender, _receiver, _amount);
        _state = 0x01;
    }

    function _doBestV2Swap(
        address _bestV2Router,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] memory _path
    ) private returns (uint256 _bestAmountOut) {
        _bestAmountOut = IUniswapV2Router02(_bestV2Router)
            .swapExactTokensForTokens(
                _amountIn,
                _amountOutMin,
                _path,
                address(this),
                block.timestamp + 30
            )[1];
    }

    function _setWhitelist(uint256 _srcChainId, address _srcContract) private {
        whiteList[_srcChainId] = _srcContract;
    }

    function _getBestOutput(
        address _bestRouter,
        uint256 _amountIn,
        address[] memory _path
    ) private view returns (uint256 _output) {
        _output = IUniswapV2Router02(_bestRouter).getAmountsOut(
            _amountIn,
            _path
        )[1];
    }

    function _getFee(
        uint256 amountIn,
        uint16 _srcSlipShot,
        address _validNft
    ) private view returns (uint256 _fee) {
        require(validVipNft[_validNft] == 0x01, "Invalid nft");
        uint256 vipBalance = IERC721(_validNft).balanceOf(msg.sender);
        if (vipBalance > 0) {
            _fee = 0;
        } else {
            _fee = (amountIn * (10000 - _srcSlipShot)) / 10000;
        }
    }

    function getProtocolFee() external view returns (uint256 _fee) {}

    function getRouters()external view returns(address[] memory){
        return routers;
    }

    function getBestRouterAddress(
        uint256 amountIn,
        address[] memory path
    ) public view returns (address) {
        uint256 uniV2_Output;
        uint256 pancakeV2_Output;
        uint256 sushiV2_Output;
        if (routers[0] != address(0)) {
            uniV2_Output=_getBestOutput(routers[0], amountIn, path);
        }
        if (routers[1] != address(0)) {
            uniV2_Output=_getBestOutput(routers[1], amountIn, path);
        }
        if (routers[2] != address(0)) {
            uniV2_Output=_getBestOutput(routers[2], amountIn, path);
        }

        if (
            uniV2_Output == pancakeV2_Output &&
            uniV2_Output == sushiV2_Output &&
            uniV2_Output == 0
        ) {
            return address(0);
        } else {
            if (uniV2_Output >= pancakeV2_Output) {
                if (uniV2_Output >= sushiV2_Output) {
                    return routers[0];
                } else {
                    return routers[2];
                }
            } else {
                if (pancakeV2_Output >= sushiV2_Output) {
                    return routers[1];
                } else {
                    return routers[2];
                }
            }
        }
    }

    function getBestV2RouterOutput(
        uint256 amountIn,
        address[] calldata _routers,
        address[] calldata path
    ) public view returns (uint256) {
        uint256 uniV2_Output;
        uint256 pancakeV2_Output;
        uint256 sushiV2_Output;
        if (_routers[0] != address(0)) {
            uniV2_Output = IUniswapV2Router02(_routers[0]).getAmountsOut(
                amountIn,
                path
            )[1];
        }
        if (_routers[1] != address(0)) {
            pancakeV2_Output = IUniswapV2Router02(_routers[1]).getAmountsOut(
                amountIn,
                path
            )[1];
        }
        if (_routers[2] != address(0)) {
            sushiV2_Output = IUniswapV2Router02(_routers[2]).getAmountsOut(
                amountIn,
                path
            )[1];
        }
        if (
            uniV2_Output == pancakeV2_Output &&
            uniV2_Output == sushiV2_Output &&
            uniV2_Output == 0
        ) {
            return 0;
        } else {
            uint256 compare1 = uniV2_Output >= pancakeV2_Output
                ? uniV2_Output
                : pancakeV2_Output;
            uint256 compare2 = compare1 >= sushiV2_Output
                ? compare1
                : sushiV2_Output;

            return compare2;
        }
    }

    function addressToBytes32(address _addr) private pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function addressToUint(address _address) public pure returns (uint256) {
        return uint256(uint160(_address));
    }

    function uintToAddress(uint256 _value) public pure returns (address) {
        return address(uint160(_value));
    }
}
