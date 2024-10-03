// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IHyperCrossFiRouter {
    error InvalidData();

    event ReceiveETH(address indexed _user, uint256 indexed _amount);

    struct SendCrossParams{
        uint8 way;
        uint16 srcSlipSpot;
        uint16 destSlipSpot;
        uint24 gasLimit;
        uint64 gasPrice;
        uint64 destChainId;
        uint256 amount;
        address fromToken;
        address toToken;
        address receiver;
        address destContract;

    }

    struct CrossMessage{
        uint8 way;
        uint16 srcSlipSpot;
        uint16 destSlipSpot;
        uint256 srcInput;
        uint256 srcOutput;
        address receiver;
        address fromToken;
        address toToken;
    }
}