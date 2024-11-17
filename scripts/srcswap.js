const hre = require("hardhat");
const PairABI=require("../artifacts/contracts/HyperOmniPair.sol/HyperOmniPair.json");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const WETHABI=require("../artifacts/contracts/WETH.sol/WETH9.json");
const HyperOmniRouter02ABI=require("../artifacts/contracts/HyperOmniRouter02.sol/HyperOmniRouter02.json");
const HyperCrossFiRouterABI=require("../artifacts/contracts/HyperCrossFiRouter.sol/HyperCrossFiRouter.json");
const HyperOmniFactoryABI=require("../artifacts/contracts/HyperOmniFactory.sol/HyperOmniFactory.json");

/**
  WETH Address: 0x36163d480435975C62cA32b01b367403DE755DEB
  USDC Address: 0xa83b368365F47BB6c1458dBe64FffC8C9a8b4d89
  USDT Address: 0xB7649fC7Ed7f4D2f96EaEd2864712991e637B5CD
  HyperOmniFactory Address: 0x05B3E3bD5e059D4f0fdaf74A46cA33886725a90c
HyperOmniRouter Address: 0x693caC4c619A56D6d3ebD7A275D4c55A7602d6B0
 HyperCrossFiRouter address: 0x6A83B4F84716302Ee3b6b8Dd20Dac536Bbb9f931
 * 
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    const provider = ethers.provider;

    // const hyperOmniFactory = await ethers.getContractFactory("HyperOmniFactory");
    // const HyperOmniFactory = await hyperOmniFactory.deploy(owner.address);
    // const HyperOmniFactoryAddress = await HyperOmniFactory.target;
    // console.log("HyperOmniFactory Address:",HyperOmniFactoryAddress);
  
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
  
    // const hyperOmniRouter02 = await ethers.getContractFactory("HyperOmniRouter02");
    // const HyperOmniRouter = await hyperOmniRouter02.deploy(HyperOmniFactoryAddress, WETHAddress);
    // const HyperOmniRouterAddress = await HyperOmniRouter.target;
    // console.log("HyperOmniRouter Address:",HyperOmniRouterAddress);

    const HyperOmniFactoryAddress="0x05B3E3bD5e059D4f0fdaf74A46cA33886725a90c";
    const HyperOmniRouterAddress="0x693caC4c619A56D6d3ebD7A275D4c55A7602d6B0";
    const HyperCrossFiRouterAddress="0x6A83B4F84716302Ee3b6b8Dd20Dac536Bbb9f931";
   
    const HyperOmniRouter=new ethers.Contract(HyperOmniRouterAddress,HyperOmniRouter02ABI.abi,owner);
    const HyperOmniFactory=new ethers.Contract(HyperOmniFactoryAddress,HyperOmniFactoryABI.abi,owner);
    const HyperCrossFiRouter=new ethers.Contract(HyperCrossFiRouterAddress,HyperCrossFiRouterABI.abi,owner);

    const destHyperCrossFiRouterAddress="0x47B2a77fFb95282C67A2F746d0C2330213ce26AD";
    const arbVizingPad="0x0B5a8E5494DDE7039781af500A49E7971AE07a6b";
    const opChainId=11155420;
    // const hyperCrossFiRouter = await ethers.getContractFactory("HyperCrossFiRouter");
    // const HyperCrossFiRouter = await hyperCrossFiRouter.deploy(arbVizingPad, HyperOmniFactoryAddress, WETHAddress);
    // const HyperCrossFiRouterAddress =await HyperCrossFiRouter.target;
    // console.log("HyperCrossFiRouter address:",HyperCrossFiRouterAddress);

    // approve
    // const approveAmount=ethers.parseEther("10000000");
    // await USDC.approve(HyperOmniRouterAddress, approveAmount);
    // await USDT.approve(HyperOmniRouterAddress, approveAmount);
    // console.log("Approve success🥳🥳🥳");

    // const block = await provider.getBlock("latest");
    // const currentTimestamp = block.timestamp + 100;
    // console.log("Current Timestamp:", currentTimestamp);

    // const liquidityParams={
    //   tokenA: USDCAddress,
    //   tokenB: USDTAddress,
    //   amountADesired: ethers.parseEther("100000"),
    //   amountBDesired: ethers.parseEther("9999000"),
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
    // console.log("AddLiquidity success 🎉🎉🎉");

    

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
    // add weth-usdc 

    // const wethApprove=await WETH.approve(HyperOmniRouterAddress, approveAmount);
    // await wethApprove.wait()
    // console.log("Weth approve success");

    // const liquidityParams2={
    //   tokenA: USDCAddress,
    //   tokenB: WETHAddress,
    //   amountADesired: ethers.parseEther("0.0002365"),
    //   amountBDesired: ethers.parseEther("0.0001"),
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
    // console.log("Add weth-usdc liquidity success 🎉🎉🎉");

    //add weth-usdt
    // const wethApprove=await WETH.approve(HyperOmniRouterAddress, approveAmount);
    // await wethApprove.wait()
    // console.log("Weth approve success");

    // const liquidityParams3={
    //   tokenA: USDTAddress,
    //   tokenB: WETHAddress,
    //   amountADesired: ethers.parseEther("0.02365"),
    //   amountBDesired: ethers.parseEther("0.0001"),
    //   amountAMin: 0,
    //   amountBMin: 0,
    //   to: owner.address,
    //   deadline: currentTimestamp
    // };
    // const depositETH2=await WETH.deposit({value: liquidityParams3.amountBDesired});
    // await depositETH2.wait();
    // console.log("Deposite2 eth success");

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
    // console.log("Add weth-usdc liquidity success 🎉🎉🎉");

    //setWhitelist
    // const destChainIds=[opChainId];
    // const destChainContracts=[destHyperCrossFiRouterAddress];
    // const batchSetWhitelist=await HyperCrossFiRouter.batchSetWhitelist(destChainIds, destChainContracts);
    // await batchSetWhitelist.wait();
    // console.log("batchSetWhitelist success");

    // // setSrcTokenMirrorDestToken
    // const srcUSDC="0xa83b368365F47BB6c1458dBe64FffC8C9a8b4d89";
    // const srcUSDT="0xB7649fC7Ed7f4D2f96EaEd2864712991e637B5CD";
    // const srcWETH="0x36163d480435975C62cA32b01b367403DE755DEB";
    // const destUSDC="0x7C4b5B71363Def9178453553C9D7A8789cD60908";
    // const destUSDT="0x0a572426cBd8e9495b9543bE87CCaBfd7a85993C";
    // const destWETH="0x4805B6E921465EE0766d359c03B9A478cb2A6bbc";
    // const chainIds=[opChainId,opChainId,opChainId];
    // const srcTokens=[srcUSDC,srcUSDT,srcWETH];
    // const destTokens=[destUSDC,destUSDT,destWETH];

    // const batchSetTokens=await HyperCrossFiRouter.batchSetTokens(chainIds, srcTokens,destTokens);
    // await batchSetTokens.wait();
    // console.log("batchSetTokens success");

    

    // send cross message
    // const approveAmount2=ethers.parseEther("10000000");
    // await USDC.approve(HyperCrossFiRouterAddress, approveAmount2);
    // await USDT.approve(HyperCrossFiRouterAddress, approveAmount2);
    // console.log("Approve success🥳🥳🥳");

    // const wethApprove2=await WETH.approve(HyperCrossFiRouterAddress, approveAmount2);
    // await wethApprove2.wait()
    // console.log("Weth approve success");

    const SendCrossParams={
      way: 0,
      srcSlipSpot: 9990,
      destSlipSpot: 9990,
      gasLimit: 500000,
      gasPrice: 1_500_000_000,
      destChainId: opChainId,
      amount: 100000000n,
      srcFromToken: USDCAddress,
      srcToToken: USDTAddress,  //
      receiver: owner.address,
      destContract: destHyperCrossFiRouterAddress
    };

    const getSendAmount=await HyperCrossFiRouter.fetchbridgeFeeAndSrcOutput(SendCrossParams);
    console.log("getSendAmount:",getSendAmount);
    let totalSendETHAmount = getSendAmount[0];
    console.log("bridge :",totalSendETHAmount);
    const sendCrossMessage=await HyperCrossFiRouter.sendCrossMessage(SendCrossParams,{value: totalSendETHAmount});
    const sendCrossMessageTx=await sendCrossMessage.wait();
    console.log("sendCrossMessageTx:",sendCrossMessageTx);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});