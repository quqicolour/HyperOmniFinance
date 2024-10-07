// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IHyperCrossFiRouter {

    event ReceiveETH(address indexed _user, uint256 indexed _amount);

    struct SendCrossParams{
        uint8 way;
        uint16 srcSlipSpot;
        uint16 destSlipSpot;
        uint24 gasLimit;
        uint64 gasPrice;
        uint64 destChainId;
        uint256 amount;
        address srcFromToken;
        address srcToToken;
        address receiver;
        address destContract;
    }

    struct CrossMessage{
        uint8 way;
        uint16 srcSlipSpot;
        uint16 destSlipSpot;
        uint256 srcOutput;
        uint256 fromToken;
        uint256 toToken;
        address receiver;
    }
}