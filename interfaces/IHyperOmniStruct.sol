// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IHyperOmniStruct{

    struct V2CrossSwapParams{
        uint8 way;
        uint16 srcSlipSpot;
        uint24 gasLimit;
        uint64 gasPrice;
        uint64 destChainId;
        uint256 amount;
        address[] path;
        address targetToken;
        address receiver;
        address destContract;
        address bestRouter;
        address vipNft;
    }

    struct V3CrossSwapParams{
        uint16 srcSlipSpot;
        uint24 gasLimit;
        uint24 fee;
        uint32 destinationDomain;
        uint64 gasPrice;
        uint64 destChainId;
        uint256 amount;
        uint160 sqrtPriceLimitX96;
        address sourceToken;
        address targetToken;
        address receiver;
        address destContract;
        address bestRouter;
    }

    struct CrossUSDCSwapInfo{
        uint8 way;
        uint16 srcSlipSpot;
        uint32 destinationDomain;
        uint256 amount;
        address[] path;
        address receiver;
        address bestRouter;
        address vipNft;
    }

    struct CrossMessage{
        uint8 way;
        uint16 srcSlipSpot;
        address receiver;
        address targetToken;
        uint256 srcOutput;
    }

    struct CrossArbitrageInfo{
        uint64 usdcNonce;
        uint64 recordBlock;  // before send usdc input current block Number 
        uint256 currentChainId;
        uint256 totalRaised;
        uint256 arbitrageSum;
    }

    struct UserSupplyInfo{
        uint64 supplyTime;
        uint64 pledgeAmount;
    }

    struct L2WithdrawAndCrossUSDCParams{
        uint8 receiver;
        uint32 destinationDomain;
        uint64 _block;
        address l2Pool;
        address ausdc;
        address usdc;
        bytes32 encodeMessage;
        uint256 aUSDCAmount;
    }

    struct ETHWithdrawAndCrossUSDCParams{
        uint8 receiver;
        uint32 destinationDomain;
        uint64 _block;
        address usdcPool;
        address ausdc;
        address usdc;
        uint256 aUSDCAmount;
    }

    
    struct ReceiveUSDCAndETHSupplyParams{
        address messageTransmitter;
        bytes message;
        bytes attestation;
        address usdcPool;
        address usdc;
    }
    
    struct ReceiveUSDCAndL2SupplyParams{
        address messageTransmitter;
        bytes message;
        bytes attestation;
        address usdcPool;
        address usdc;
        address l2Pool;
        bytes32 encodeMessage;
        uint256 amount;
    }


}