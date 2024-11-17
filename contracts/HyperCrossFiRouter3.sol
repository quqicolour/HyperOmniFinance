// SPDX-License-Identifier: GPL-3.0
/** 
pragma solidity ^0.8.23;

import {VizingOmni} from "@vizing/contracts/VizingOmni.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IUniswapV2Router02} from "../interfaces/uniswapV2/IUniswapV2Router02.sol";

import {HyperOmniLibrary} from "../libraries/HyperOmniLibrary.sol";
import {TransferHelper} from "../libraries/TransferHelper.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IWETH} from "../interfaces/IWETH.sol";

//cctp
import {IMessageTransmitter} from "../interfaces/cctp/IMessageTransmitter.sol";
import {ITokenMessenger} from "../interfaces/cctp/ITokenMessenger.sol";

import {IHyperOmniEvent} from "../interfaces/IHyperOmniEvent.sol";
import {IHyperOmniStruct} from "../interfaces/IHyperOmniStruct.sol";

contract HyperCrossFiRouter3 is
    VizingOmni,
    Ownable,
    ReentrancyGuard,
{
    uint256 private orderId;
    address private tokenMessager;
    address private messageTransmitter;
    address private usdc;
    address private uniswapV3Factory;
    address private feeReceiver;
    bytes private ZEROBYTES = new bytes(0);

    constructor(
        address _vizingPad
    ) VizingOmni(_vizingPad) Ownable(msg.sender) {
        feeReceiver = msg.sender;
    }

    mapping(address => bool) private validRouter;

    mapping(uint256 => OrderInfo) private _OrderInfo;

    mapping(uint256 => address) private whiteList;

    mapping(uint256 => mapping(address => uint256))private srcTokenMirrorDestToken;

    mapping(uint256 => CrossMessage) private _CrossMessage;

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

    function sendV2SwapCrossMessage(
        V2CrossSwapParams calldata params
    ) external payable nonReentrant {
        require(validRouter[params.bestRouter], "Invalid router");
        require(params.srcSlipSpot <= 10000 && params.destSlipSpot <= 10000);
        address[] memory path;
        path[0] = params.sourceToken;
        path[1] = usdc;
        // fee
        uint256 fee = params.amount / 10000 * (10000 - params.srcSlipSpot);
        IERC20(path[0]).transferFrom(msg.sender, feeReceiver, fee);
        
        IERC20(path[0]).transferFrom(msg.sender, address(this), params.amount - fee);
        IERC20(path[0]).approve(params.bestRouter, params.amount - fee);
        
        uint256 amountOutMin = IUniswapV2Router02(params.bestRouter)
            .getAmountsOut(params.amount - fee, path)[1];
        uint256 amountOut = _doBestV2Swap(
                params.bestRouter,
                params.amount - fee,
                amountOutMin,
                path
        );
        bytes1 state = _transferCCTPUSDC(
            address(this),
            params.destContract,
            amountOut,
            params.destinationDomain
        );
        require(state == 0x01, "Transfer Usdc fail");
        CrossMessage memory _crossMessage = CrossMessage({
            way: 0,
            srcSlipSpot: params.destSlipSpot,
            destSlipSpot: params.srcSlipSpot,
            orderId: orderId,
            srcOutput: amountOut,
            fromToken: srcTokenMirrorDestToken[params.destChainId][
                params.sourceToken
            ],
            toToken: srcTokenMirrorDestToken[params.destChainId][
                params.targetToken
            ],
            receiver: params.receiver
        });
        _CrossMessage[orderId] = _crossMessage;

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
        require(msg.value >= gasFee,"Eth Insufficient");

        LaunchPad.Launch{value: gasFee}(
            uint64(block.timestamp) + 3 minutes,
            uint64(block.timestamp) + 1000 minutes,
            address(0),
            msg.sender,
            0,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );

    }

    function sendV3SwapCrossMessage(V3CrossSwapParams calldata params)external payable nonReentrant{
        require(validRouter[params.bestRouter], "Invalid router");
        require(params.srcSlipSpot <= 10000 && params.destSlipSpot <= 10000);

        // fee
        uint256 fee = params.amount / 10000 * (10000 - params.srcSlipSpot);
        IERC20(params.sourceToken).transferFrom(msg.sender, feeReceiver, fee);
        
        IERC20(params.sourceToken).transferFrom(msg.sender, address(this), params.amount - fee);
        IERC20(params.sourceToken).approve(params.bestRouter, params.amount - fee);

        uint256 amountOut = IUniSwapV3Router(params.bestRouter).exactInputSingle(
            IUniSwapV3Router.ExactInputSingleParams({
                tokenIn: params.sourceToken,
                tokenOut: usdc,
                fee: params.fee,
                recipient: address(this),
                deadline: block.timestamp + 60,
                amountIn: params.amount - fee,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );

        bytes1 state = _transferCCTPUSDC(
            address(this),
            params.destContract,
            amountOut,
            params.destinationDomain
        );
        require(state == 0x01, "Transfer Usdc fail");

        CrossMessage memory _crossMessage = CrossMessage({
            way: 0,
            srcSlipSpot: params.destSlipSpot,
            destSlipSpot: params.srcSlipSpot,
            orderId: orderId,
            srcOutput: amountOut,
            fromToken: srcTokenMirrorDestToken[params.destChainId][
                params.sourceToken
            ],
            toToken: srcTokenMirrorDestToken[params.destChainId][
                params.targetToken
            ],
            receiver: params.receiver
        });
        _CrossMessage[orderId] = _crossMessage;

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
        require(msg.value >= gasFee,"Eth Insufficient");

        LaunchPad.Launch{value: gasFee}(
            uint64(block.timestamp) + 3 minutes,
            uint64(block.timestamp) + 1000 minutes,
            address(0),
            msg.sender,
            0,
            params.destChainId,
            ZEROBYTES,
            _encodedMessage
        );
    }

    function reStartCCTPUSDC(
        bytes calldata originalMessage,
        bytes calldata originalAttestation,
        bytes32 newDestinationCaller,
        uint256 _orderId
    ) external onlyOwner {
        require(_OrderInfo[_orderId].orderState == 0x01, "Invalid order");
        ITokenMessenger(tokenMessager).replaceDepositForBurn(
            originalMessage,
            originalAttestation,
            newDestinationCaller,
            _OrderInfo[_orderId].orderReceiver
        );
    }

    function reStartCrossMessage(
        uint24 _gasLimit,
        uint64 _gasPrice,
        uint64 _destChainId,
        address _destContract,
        uint256 _orderId
    ) external payable nonReentrant{
        CrossMessage memory _crossMessage = CrossMessage({
            way: 0,
            srcSlipSpot: _CrossMessage[_orderId].destSlipSpot,
            destSlipSpot: _CrossMessage[_orderId].srcSlipSpot,
            orderId: _orderId,
            srcOutput: _CrossMessage[_orderId].srcOutput,
            fromToken: srcTokenMirrorDestToken[_destChainId][
                address(uint160(_CrossMessage[_orderId].fromToken))
            ],
            toToken: srcTokenMirrorDestToken[_destChainId][
                address(uint160(_CrossMessage[_orderId].toToken))
            ],
            receiver: _CrossMessage[_orderId].receiver
        });

        bytes memory _encodedMessage = _packetMessage(
            bytes1(0x01),
            _destContract,
            _gasLimit,
            _gasPrice,
            abi.encode(_crossMessage)
        );

        uint256 gasFee = LaunchPad.estimateGas(
            0,
            _destChainId,
            ZEROBYTES,
            _encodedMessage
        );
        require(msg.value >= gasFee,"Eth Insufficient");

        LaunchPad.Launch{value: gasFee}(
            uint64(block.timestamp) + 3 minutes,
            uint64(block.timestamp) + 1000 minutes,
            address(0),
            msg.sender,
            0,
            _destChainId,
            ZEROBYTES,
            _encodedMessage
        );
    }

    function crossUSDC(uint256 _amount, uint32 _destinationDomain) external {
        IERC20(usdc).transferFrom(msg.sender, address(this), _amount);
        bytes1 state = _transferCCTPUSDC(
            msg.sender,
            msg.sender,
            _amount,
            _destinationDomain
        );
        require(state == 0x01);
    }

    function receiveDoV2Swap(uint256 _orderId,address _bestRouter) external {
        address[] memory path;
        path[0]=usdc;
        path[1]=address(uint160(_CrossMessage[_orderId].toToken));
        require(IERC20(path[0]).balanceOf(address(this)) >= _CrossMessage[_orderId].srcOutput,"Balance error");
        uint256 amountOutMin = IUniswapV2Router02(_bestRouter)
            .getAmountsOut(_CrossMessage[_orderId].srcOutput, path)[1];
        uint256 amountOut = _doBestV2Swap(
                _bestRouter,
                _CrossMessage[_orderId].srcOutput,
                amountOutMin,
                path
        );
    }

    function _receiveMessage(
        bytes32,
        uint64 srcChainId,
        uint256 srcContract,
        bytes calldata message
    ) internal virtual override {
        require(
            whiteList[srcChainId] == address(uint160(srcContract)),
            "Non whitelist"
        );

        CrossMessage memory _crossMessage=abi.decode(message,(CrossMessage));
        require(_CrossMessage[_crossMessage.orderId].receiver==address(0),"Already receive message");
        _CrossMessage[_crossMessage.orderId]=_crossMessage;

    }

    function _transferCCTPUSDC(
        address _sender,
        address _receiver,
        uint256 _amount,
        uint32 _destinationDomain
    ) private returns (bytes1 _state) {
        IERC20(usdc).approve(tokenMessager, _amount);
        ITokenMessenger(tokenMessager).depositForBurn(
            _amount,
            _destinationDomain,
            addressToBytes32(_receiver),
            usdc
        );
        _OrderInfo[orderId] = OrderInfo({
            orderState: 0x01,
            orderReceiver: addressToBytes32(_receiver),
            orderSender: _sender,
            orderId: orderId,
            orderAmount: _amount
        });
        orderId++;
        emit CrossUSDC(_sender, _receiver, _amount);
        _state = 0x01;
    }

    function _doBestV2Swap(
        address _bestV2Router, 
        uint256 _amountIn, 
        uint256 _amountOutMin, 
        address[] memory _path
    )private returns(uint256 _bestAmountOut){
        _bestAmountOut=IUniswapV2Router02(_bestV2Router)
            .swapExactTokensForTokens(
                _amountIn,
                _amountOutMin,
                _path,
                address(this),
                block.timestamp + 60
        )[1];
    }

    function _setWhitelist(uint256 _srcChainId, address _srcContract) private {
        whiteList[_srcChainId] = _srcContract;
    }

    function _receiveCCTPMessage(
        bytes calldata message,
        bytes calldata attestation
    ) private {
        IMessageTransmitter(messageTransmitter).receiveMessage(
            message,
            attestation
        );
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

    function getBestV3RouterOutput(
        uint256 amountIn,
        address[] calldata _routers,
        address[] calldata path
    ) public view returns (uint256) {

    }

    function getV3PoolAddress(address token0,address token1,uint24 _fee)public view returns(address thisPool){
        thisPool = IUniswapV3Factory(uniswapV3Factory).getPool(
            token0,
            token1,
            _fee
        );
        return thisPool;
    }

    function addressToBytes32(address _addr) private pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}

*/