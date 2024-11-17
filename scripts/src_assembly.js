const hre = require("hardhat");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const WETHABI=require("../artifacts/contracts/WETH.sol/WETH9.json");
const HyperOmniRouter02ABI=require("../artifacts/contracts/HyperOmniRouter02.sol/HyperOmniRouter02.json");
const HyperOmniFactoryABI=require("../artifacts/contracts/HyperOmniFactory.sol/HyperOmniFactory.json");
const HyperAssembleRouterABI=require("../artifacts/contracts/HyperAssembleRouter.sol/HyperAssembleRouter.json");
const messageTransmitterABI=require("../json/MessageTransmitter.json");

/**
HyperOmniFactory Address: 0x88f57e6192784bC31bCF9C63F4bF59a0884Cffec
WETH Address: 0x6afD0961102B2A83A352f9905884E0c78fa36AE5
VipNft Address: 0x9e9c5A207C794687A71366F6e2194b8d5cB6b551
USDT Address: 0x589450e159E99125f89687B200bda87a401f3d87
HyperOmniRouter Address: 0xE8b7D7F3aD03B4effef630d97aEbf6f31eEca52e
HyperAssembleRouter address: 0x6a34a98c183A3Fe6E66Dbb743cF28f0873B29f54
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    const provider = ethers.provider;
    const ZeroAddress = "0x0000000000000000000000000000000000000000";

    // const hyperOmniFactory = await ethers.getContractFactory("HyperOmniFactory");
    // const HyperOmniFactory = await hyperOmniFactory.deploy(owner.address);
    // const HyperOmniFactoryAddress = await HyperOmniFactory.target;
    // console.log("HyperOmniFactory Address:",HyperOmniFactoryAddress);
  
    // const wETH9 = await ethers.getContractFactory("WETH9");
    // const WETH = await wETH9.deploy();
    // const WETHAddress = await WETH.target;
    // console.log("WETH Address:",WETHAddress);

    // const vipNft = await ethers.getContractFactory("TestNft");
    // const VipNft = await vipNft.deploy();
    // const VipNftAddress = await VipNft.target;
    // console.log("VipNft Address:",VipNftAddress);
  
    // const usdt = await ethers.getContractFactory("TestToken");
    // const USDT = await usdt.deploy("USDT Token", "USDT", 8);
    // const USDTAddress = await USDT.target;
    // console.log("USDT Address:",USDTAddress);

    const VipNftAddress="0x9e9c5A207C794687A71366F6e2194b8d5cB6b551";
    //arb usdc
    const USDCAddress="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
    const tokenMessager="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const arb_sepolia=3n;

    const USDTAddress="0x589450e159E99125f89687B200bda87a401f3d87";
    const WETHAddress="0x6afD0961102B2A83A352f9905884E0c78fa36AE5";
    
    const USDC=new ethers.Contract(USDCAddress,ERC20ABI.abi,owner);
    const USDT=new ethers.Contract(USDTAddress,ERC20ABI.abi,owner);
    const WETH=new ethers.Contract(WETHAddress,WETHABI.abi,owner);
  
    // const hyperOmniRouter02 = await ethers.getContractFactory("HyperOmniRouter02");
    // const HyperOmniRouter = await hyperOmniRouter02.deploy(HyperOmniFactoryAddress, WETHAddress);
    // const HyperOmniRouterAddress = await HyperOmniRouter.target;
    // console.log("HyperOmniRouter Address:",HyperOmniRouterAddress);

    const HyperOmniFactoryAddress="0x88f57e6192784bC31bCF9C63F4bF59a0884Cffec";
    const HyperOmniRouterAddress="0xE8b7D7F3aD03B4effef630d97aEbf6f31eEca52e";
   
    const HyperOmniFactory=new ethers.Contract(HyperOmniFactoryAddress,HyperOmniFactoryABI.abi,owner);
    const HyperOmniRouter=new ethers.Contract(HyperOmniRouterAddress,HyperOmniRouter02ABI.abi,owner);

    const destHyperAssembleRouterAddress="0x1bd29549b80A77b2E89C2FbEC5B5A9d7Bca0b20D";
    const arbVizingPad="0x0B5a8E5494DDE7039781af500A49E7971AE07a6b";
    const opChainId=11155420;
    // const hyperAssembleRouter = await ethers.getContractFactory("HyperAssembleRouter");
    // const HyperAssembleRouter = await hyperAssembleRouter.deploy(USDCAddress, WETHAddress, arbVizingPad, tokenMessager);
    // const HyperAssembleRouterAddress =await HyperAssembleRouter.target;
    // console.log("HyperAssembleRouter address:",HyperAssembleRouterAddress);

    const HyperAssembleRouterAddress="0x6a34a98c183A3Fe6E66Dbb743cF28f0873B29f54";
    const HyperAssembleRouter=new ethers.Contract(HyperAssembleRouterAddress,HyperAssembleRouterABI.abi,owner);

    //usdc balance
    const usdcBalance=await USDC.balanceOf(owner.address);
    console.log("Usdc balance:",usdcBalance);

    // approve
    const approveAmount=ethers.parseEther("10000000");
    // await USDC.approve(HyperOmniRouterAddress, approveAmount);
    // await USDT.approve(HyperOmniRouterAddress, approveAmount);
    // console.log("Approve success🥳🥳🥳");

    const block = await provider.getBlock("latest");
    const currentTimestamp = block.timestamp + 100;
    console.log("Current Timestamp:", currentTimestamp);

    // const liquidityParams={
    //   tokenA: USDCAddress,
    //   tokenB: USDTAddress,
    //   amountADesired: 20000,
    //   amountBDesired: 20000,
    //   amountAMin: 0,
    //   amountBMin: 0,
    //   to: owner.address,
    //   deadline: currentTimestamp
    // };

    // await HyperOmniRouter.addLiquidity(
    //   liquidityParams.tokenA,
    //   liquidityParams.tokenB,
    //   liquidityParams.amountADesired,
    //   liquidityParams.amountBDesired,
    //   liquidityParams.amountAMin,
    //   liquidityParams.amountBMin,
    //   liquidityParams.to,
    //   liquidityParams.deadline
    // );
    // console.log("Add USDC-USDT liquidity success 🎉🎉🎉");

    

    /** 
    //Get pair
    // const pairAddress=await HyperOmniFactory.getPair(liquidityParams.tokenA,liquidityParams.tokenB);
    // console.log("pair:",pairAddress);

    //init pair
    const PairContract1=new ethers.Contract(pairAddress, PairABI.abi, owner);

    //Get liquidity amount
    const liquidityAmount=await PairContract1.balanceOf(owner);
    console.log("pair balance:",liquidityAmount);

    //pair approve
    const pair1Approve=await PairContract1.approve(HyperOmniRouterAddress, liquidityAmount);
    await pair1Approve.wait();
    console.log("Pair approve router success🌈🌈🌈");

    //Remove liquidity
    await HyperOmniRouter.removeLiquidity(
      liquidityParams.tokenA,
      liquidityParams.tokenB,
      100,
      0,
      0,
      liquidityParams.to,
      liquidityParams.deadline
    );
    console.log("Remove liquidity success🌈🌈🌈");

    */
    // add USDC-WETH
    // const wethApprove=await WETH.approve(HyperOmniRouterAddress, approveAmount);
    // await wethApprove.wait()
    // console.log("Weth approve success");

    // const liquidityParams2={
    //   tokenA: USDCAddress,
    //   tokenB: WETHAddress,
    //   amountADesired: 20000,
    //   amountBDesired: ethers.parseEther("0.0002365"),
    //   amountAMin: 0,
    //   amountBMin: 0,
    //   to: owner.address,
    //   deadline: currentTimestamp
    // };
    // const depositETH=await WETH.deposit({value: liquidityParams2.amountBDesired});
    // await depositETH.wait();
    // console.log("Deposite eth success");

    // await HyperOmniRouter.addLiquidity(
    //   liquidityParams2.tokenA,
    //   liquidityParams2.tokenB,
    //   liquidityParams2.amountADesired,
    //   liquidityParams2.amountBDesired,
    //   liquidityParams2.amountAMin,
    //   liquidityParams2.amountBMin,
    //   liquidityParams2.to,
    //   liquidityParams2.deadline
    // );
    // console.log("Add USDC-WETH liquidity success 🎉🎉🎉");

    //add usdt-weth
    // const wethApprove=await WETH.approve(HyperOmniRouterAddress, approveAmount);
    // await wethApprove.wait()
    // console.log("Weth approve success");

    const USDTBalance=await USDT.balanceOf(owner.address);
    console.log("USDT Balance:",USDTBalance);

    const liquidityParams3={
      tokenA: USDTAddress,
      tokenB: WETHAddress,
      amountADesired: 2365000000n,
      amountBDesired: ethers.parseEther("0.001"),
      amountAMin: 0,
      amountBMin: 0,
      to: owner.address,
      deadline: currentTimestamp
    };
    // const depositETH2=await WETH.deposit({value: liquidityParams3.amountBDesired});
    // await depositETH2.wait();
    // console.log("Deposite2 eth success");
    // const WETHBalance=await WETH.balanceOf(owner.address);
    // console.log("WETH Balance:",WETHBalance);

    // await HyperOmniRouter.addLiquidity(
    //   liquidityParams3.tokenA,
    //   liquidityParams3.tokenB,
    //   liquidityParams3.amountADesired,
    //   liquidityParams3.amountBDesired,
    //   liquidityParams3.amountAMin,
    //   liquidityParams3.amountBMin,
    //   liquidityParams3.to,
    //   liquidityParams3.deadline
    // );
    // console.log("Add USDT-WETH liquidity success 🎉🎉🎉");

    //batchSetValidRouters
    // const validState="0x01";
    // const invalidState="0x00";
    // const routers=[HyperOmniRouterAddress, ZeroAddress, ZeroAddress];
    // const states=[validState,invalidState,invalidState];
    // const batchSetValidRouters=await HyperAssembleRouter.batchSetValidRouters(routers,states);
    // await batchSetValidRouters.wait();
    // console.log("batchSetValidRouters success");

    // //addRouter
    // const addRouter=await HyperAssembleRouter.addRouter(HyperOmniRouterAddress);
    // await addRouter.wait();
    // console.log("addRouter success");

    // //batchSetValidNfts
    // const nfts=[VipNftAddress];
    // const nftStates=[validState];
    // const batchSetValidNfts=await HyperAssembleRouter.batchSetValidNfts(nfts,nftStates);
    // await batchSetValidNfts.wait();
    // console.log("batchSetValidNfts success");

    // setWhitelist
    const destChainIds=[opChainId];
    const destChainContracts=[destHyperAssembleRouterAddress];
    const batchSetWhitelist=await HyperAssembleRouter.batchSetWhitelist(destChainIds, destChainContracts);
    await batchSetWhitelist.wait();
    console.log("batchSetWhitelist success");


    // send cross message
    // const approveAmount2=ethers.parseEther("10000000");
    // await USDC.approve(HyperAssembleRouterAddress, approveAmount2);
    // await USDT.approve(HyperAssembleRouterAddress, approveAmount2);
    // await WETH.approve(HyperAssembleRouterAddress, approveAmount2);
    // console.log("Approve success🥳🥳🥳");

    const op_usdt="0xFd31886862746C36d5ab3d8B87C81892dCE9EE86";
    const V2CrossSwapParams={
      way: 2,
      srcSlipSpot: 9990,
      gasLimit: 300000n,
      gasPrice: 1_300_000_000n,
      destChainId: opChainId,
      amount: ethers.parseEther("0.0001"),
      path: [USDTAddress, WETHAddress],
      targetToken: op_usdt,
      receiver: owner.address,
      destContract: destHyperAssembleRouterAddress,
      bestRouter: HyperOmniRouterAddress,
      vipNft: VipNftAddress,
    };
    let bridgeFee;
    if(V2CrossSwapParams.way == 0){
        bridgeFee = V2CrossSwapParams.gasLimit * V2CrossSwapParams.gasPrice + V2CrossSwapParams.amount;
    }else{
        bridgeFee = V2CrossSwapParams.gasLimit * V2CrossSwapParams.gasPrice;
    }
    console.log("bridgeFee:",bridgeFee);
    const v2SwapCross=await HyperAssembleRouter.v2SwapCross(
        V2CrossSwapParams,
        {value: bridgeFee}
    );
    let v2SwapCrossTx=await v2SwapCross.wait();
    console.log("V2SwapCross Tx🌈🌈🌈:",v2SwapCrossTx);
    

    
    //v2SwapWithUSDC
    const startBlock = await provider.getBlockNumber();
    console.log("Trade before Block Number:", startBlock);
    const usdcDestinationDomain=2;
    const CrossUSDCSwapInfo={
      way: 2,
      srcSlipSpot: 9990,
      destinationDomain: usdcDestinationDomain,
      amount: 1000000000000n,
      path: [WETHAddress, USDCAddress],
      receiver: owner.address,
      bestRouter: HyperOmniRouterAddress,
      vipNft: VipNftAddress
    };
    let tradeETH;
    if(CrossUSDCSwapInfo.way==1 && CrossUSDCSwapInfo.path[0]==WETHAddress){
      tradeETH=CrossUSDCSwapInfo.amount;
    }else{
      tradeETH=0;
    }
    // const v2SwapWithUSDC=await HyperAssembleRouter.v2SwapWithUSDC(CrossUSDCSwapInfo,{value: tradeETH});
    // let v2SwapWithUSDCTx=await v2SwapWithUSDC.wait();
    // console.log("v2SwapWithUSDC Tx🌈🌈🌈:",v2SwapWithUSDCTx);

    // const endBlock = await v2SwapWithUSDCTx.blockNumber;
    // console.log("Trade after Block Number:", endBlock);

    // const messageTransmitter="0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872";
    // const MessageTransmitter=new ethers.Contract(messageTransmitter,messageTransmitterABI,owner);
    // const _message = await MessageTransmitter.queryFilter('MessageSent', startBlock, endBlock);
    // const resultMessage = _message[0].args[0];
    // console.log("message result:",resultMessage);

    // const messageHash = await ethers.keccak256(resultMessage);
    // console.log('messageHash:', messageHash);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});