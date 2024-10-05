const hre = require("hardhat");
const PairABI=require("../artifacts/contracts/HyperStablePair.sol/HyperStablePair.json");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const WETHABI=require("../artifacts/contracts/WETH.sol/WETH9.json");
const HyperStableRouter02ABI=require("../artifacts/contracts/HyperStableRouter02.sol/HyperStableRouter02.json");
const HyperCrossFiRouterABI=require("../artifacts/contracts/HyperCrossFiRouter.sol/HyperCrossFiRouter.json");
const HyperStableFactoryABI=require("../artifacts/contracts/HyperStableFactory.sol/HyperStableFactory.json");

/**
  WETH Address: 0x36163d480435975C62cA32b01b367403DE755DEB
  USDC Address: 0xa83b368365F47BB6c1458dBe64FffC8C9a8b4d89
  USDT Address: 0xB7649fC7Ed7f4D2f96EaEd2864712991e637B5CD
  HyperStableFactory Address: 0xEd41774cd861C8eb47D13E7e210bb150c3c1aD8a
  HyperStableRouter Address: 0xf14b60b9CD4D3C5440796dB3a4C1506d6D8f87b4
  HyperCrossFiRouter address: 0xBdb68c1a3143b7A2b9E8487cBc84496DF063161C
 * 
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    const provider = ethers.provider;

    // const hyperStableFactory = await ethers.getContractFactory("HyperStableFactory");
    // const HyperStableFactory = await hyperStableFactory.deploy(owner.address);
    // const HyperStableFactoryAddress = await HyperStableFactory.target;
    // console.log("HyperStableFactory Address:",HyperStableFactoryAddress);
  
    // const wETH9 = await ethers.getContractFactory("WETH9");
    // const WETH = await wETH9.deploy();
    // const WETHAddress = await WETH.target;
    // console.log("WETH Address:",WETHAddress);
  
    // const usdc = await ethers.getContractFactory("TestToken");
    // const USDC = await usdc.deploy("USDC Token", "USDC", 6);
    // const USDCAddress = await USDC.target;
    // console.log("USDC Address:",USDCAddress);
  
    // const usdt = await ethers.getContractFactory("TestToken");
    // const USDT = await usdt.deploy("USDT Token", "USDT", 8);
    // const USDTAddress = await USDT.target;
    // console.log("USDT Address:",USDTAddress);

    const USDTAddress="0xB7649fC7Ed7f4D2f96EaEd2864712991e637B5CD";
    const USDCAddress="0xa83b368365F47BB6c1458dBe64FffC8C9a8b4d89";
    const WETHAddress="0x36163d480435975C62cA32b01b367403DE755DEB";
    
    const USDT=new ethers.Contract(USDTAddress,ERC20ABI.abi,owner);
    const USDC=new ethers.Contract(USDCAddress,ERC20ABI.abi,owner);
    const WETH=new ethers.Contract(WETHAddress,WETHABI.abi,owner);
  
    // const hyperStableRouter02 = await ethers.getContractFactory("HyperStableRouter02");
    // const HyperStableRouter = await hyperStableRouter02.deploy(HyperStableFactoryAddress, WETHAddress);
    // const HyperStableRouterAddress = await HyperStableRouter.target;
    // console.log("HyperStableRouter Address:",HyperStableRouterAddress);
    
    const HyperStableFactoryAddress="0xEd41774cd861C8eb47D13E7e210bb150c3c1aD8a";
    const HyperStableRouterAddress="0xf14b60b9CD4D3C5440796dB3a4C1506d6D8f87b4";
    const HyperCrossFiRouterAddress="0xBdb68c1a3143b7A2b9E8487cBc84496DF063161C";

    const HyperStableRouter=new ethers.Contract(HyperStableRouterAddress,HyperStableRouter02ABI.abi,owner);
    const HyperStableFactory=new ethers.Contract(HyperStableFactoryAddress,HyperStableFactoryABI.abi,owner);
    const HyperCrossFiRouter=new ethers.Contract(HyperCrossFiRouterAddress,HyperCrossFiRouterABI.abi,owner);

    const destHyperCrossFiRouterAddress="0x807e0DC5419F4697Aa88B78A11f034c7d5Da8BD7";
    const arbVizingPad="0x0B5a8E5494DDE7039781af500A49E7971AE07a6b";
    const opChainId=11155420;
    // const hyperCrossFiRouter = await ethers.getContractFactory("HyperCrossFiRouter");
    // const HyperCrossFiRouter = await hyperCrossFiRouter.deploy(arbVizingPad, HyperStableFactoryAddress, WETHAddress);
    // const HyperCrossFiRouterAddress =await HyperCrossFiRouter.target;
    // console.log("HyperCrossFiRouter address:",HyperCrossFiRouterAddress);

    //init cross
    // const initCrossRouter=await HyperStableFactory.initCrossRouter(HyperCrossFiRouterAddress);
    // await initCrossRouter.wait();
    // console.log("Successful initialization");

    // //approve
    // const approveAmount=ethers.parseEther("10000000");
    // await USDC.approve(HyperStableRouterAddress, approveAmount);
    // await USDT.approve(HyperStableRouterAddress, approveAmount);
    // console.log("Approve success🥳🥳🥳");

    // const block = await provider.getBlock("latest");
    // const currentTimestamp = block.timestamp + 100;
    // console.log("Current Timestamp:", currentTimestamp);

    // const liquidityParams={
    //   tokenA: USDCAddress,
    //   tokenB: USDTAddress,
    //   amountADesired: ethers.parseEther("100000"),
    //   amountBDesired: ethers.parseEther("99990"),
    //   amountAMin: 0,
    //   amountBMin: 0,
    //   to: owner.address,
    //   deadline: currentTimestamp
    // };

    // await HyperStableRouter.addLiquidity(
    //   liquidityParams.tokenA,
    //   liquidityParams.tokenB,
    //   liquidityParams.amountADesired,
    //   liquidityParams.amountBDesired,
    //   liquidityParams.amountAMin,
    //   liquidityParams.amountBMin,
    //   liquidityParams.to,
    //   liquidityParams.deadline
    // );
    // console.log("AddLiquidity success 🎉🎉🎉");

    

    /** 
    //Get pair
    // const pairAddress=await HyperStableFactory.getPair(liquidityParams.tokenA,liquidityParams.tokenB);
    // console.log("pair:",pairAddress);

    //init pair
    const PairContract1=new ethers.Contract(pairAddress, PairABI.abi, owner);

    //Get liquidity amount
    const liquidityAmount=await PairContract1.balanceOf(owner);
    console.log("pair balance:",liquidityAmount);

    //pair approve
    const pair1Approve=await PairContract1.approve(HyperStableRouterAddress, liquidityAmount);
    await pair1Approve.wait();
    console.log("Pair approve router success🌈🌈🌈");

    //Remove liquidity
    await HyperStableRouter.removeLiquidity(
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

    //add weth-usdc 
    // const wethApprove=await WETH.approve(HyperStableRouterAddress, approveAmount);
    // await wethApprove.wait()
    // console.log("Weth approve success");

    // const liquidityParams2={
    //   tokenA: USDCAddress,
    //   tokenB: WETHAddress,
    //   amountADesired: ethers.parseEther("0.2365"),
    //   amountBDesired: ethers.parseEther("0.0001"),
    //   amountAMin: 0,
    //   amountBMin: 0,
    //   to: owner.address,
    //   deadline: currentTimestamp
    // };
    // const depositETH=await WETH.deposit({value: liquidityParams2.amountBDesired});
    // await depositETH.wait();
    // console.log("Deposite eth success");

    // await HyperStableRouter.addLiquidity(
    //   liquidityParams2.tokenA,
    //   liquidityParams2.tokenB,
    //   liquidityParams2.amountADesired,
    //   liquidityParams2.amountBDesired,
    //   liquidityParams2.amountAMin,
    //   liquidityParams2.amountBMin,
    //   liquidityParams2.to,
    //   liquidityParams2.deadline
    // );
    // console.log("Add weth-usdc liquidity success 🎉🎉🎉");

    //setWhitelist
    const destChainIds=[opChainId];
    const destChainContracts=[destHyperCrossFiRouterAddress];
    const batchSetWhitelist=await HyperCrossFiRouter.batchSetWhitelist(destChainIds, destChainContracts);
    await batchSetWhitelist.wait();
    console.log("batchSetWhitelist success");

    // setSrcTokenMirrorDestToken
    const srcUSDC="0xa83b368365F47BB6c1458dBe64FffC8C9a8b4d89";
    const srcUSDT="0xB7649fC7Ed7f4D2f96EaEd2864712991e637B5CD";
    const srcWETH="0x36163d480435975C62cA32b01b367403DE755DEB";
    const destUSDC="0x7C4b5B71363Def9178453553C9D7A8789cD60908";
    const destUSDT="0x0a572426cBd8e9495b9543bE87CCaBfd7a85993C";
    const destWETH="0x4805B6E921465EE0766d359c03B9A478cb2A6bbc";
    const chainIds=[opChainId,opChainId,opChainId];
    const srcTokens=[srcUSDC,srcUSDT,srcWETH];
    const destTokens=[destUSDC,destUSDT,destWETH];

    const batchSetTokens=await HyperCrossFiRouter.batchSetTokens(chainIds, srcTokens,destTokens);
    await batchSetTokens.wait();
    console.log("batchSetTokens success");

    

    //send cross message
    const approveAmount2=ethers.parseEther("10000000");
    await USDC.approve(HyperCrossFiRouterAddress, approveAmount2);
    await USDT.approve(HyperCrossFiRouterAddress, approveAmount2);
    console.log("Approve success🥳🥳🥳");

    const wethApprove2=await WETH.approve(HyperCrossFiRouterAddress, approveAmount2);
    await wethApprove2.wait()
    console.log("Weth approve success");

    const SendCrossParams={
      way: 0,
      srcSlipSpot: 9990,
      destSlipSpot: 9990,
      gasLimit: 500000,
      gasPrice: 1_500_000_000,
      destChainId: opChainId,
      amount: 1000000000n,
      srcFromToken: USDCAddress,
      srcToToken: USDTAddress,  //
      receiver: owner.address,
      destContract: destHyperCrossFiRouterAddress
    };

    const getSendAmount=await HyperCrossFiRouter.fetchbridgeFeeAndSrcOutput(SendCrossParams);
    let totalSendETHAmount;
    if(SendCrossParams.way==1){
      totalSendETHAmount = getSendAmount[0] + SendCrossParams.amount;
    }else{
      totalSendETHAmount = getSendAmount[0];
    }
    console.log("getSendAmount:",totalSendETHAmount);
    const sendCrossMessage=await HyperCrossFiRouter.sendCrossMessage(SendCrossParams,{value: totalSendETHAmount});
    const sendCrossMessageTx=await sendCrossMessage.wait();
    console.log("sendCrossMessageTx:",sendCrossMessageTx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});