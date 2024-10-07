const hre = require("hardhat");
const PairABI=require("../artifacts/contracts/HyperStablePair.sol/HyperStablePair.json");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const WETHABI=require("../artifacts/contracts/WETH.sol/WETH9.json");
const HyperStableRouter02ABI=require("../artifacts/contracts/HyperStableRouter02.sol/HyperStableRouter02.json");
const HyperCrossFiRouterABI=require("../artifacts/contracts/HyperCrossFiRouter.sol/HyperCrossFiRouter.json");
const HyperStableFactoryABI=require("../artifacts/contracts/HyperStableFactory.sol/HyperStableFactory.json");
/**
    WETH Address: 0x4805B6E921465EE0766d359c03B9A478cb2A6bbc
    USDC Address: 0x7C4b5B71363Def9178453553C9D7A8789cD60908
    USDT Address: 0x0a572426cBd8e9495b9543bE87CCaBfd7a85993C
    HyperStableFactory Address: 0x1c987fFa0f80f38d8BD59B96d5903Cf9E7D1df15
HyperStableRouter Address: 0x5793e20336Cd597e7D2AC55557df1384A673a7BA
HyperCrossFiRouter address: 0x47B2a77fFb95282C67A2F746d0C2330213ce26AD
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
    
    const USDTAddress="0x0a572426cBd8e9495b9543bE87CCaBfd7a85993C";
    const USDCAddress="0x7C4b5B71363Def9178453553C9D7A8789cD60908";
    const WETHAddress="0x4805B6E921465EE0766d359c03B9A478cb2A6bbc";

    const USDT=new ethers.Contract(USDTAddress,ERC20ABI.abi,owner);
    const USDC=new ethers.Contract(USDCAddress,ERC20ABI.abi,owner);
    const WETH=new ethers.Contract(WETHAddress,WETHABI.abi,owner);
  
    // const hyperStableRouter02 = await ethers.getContractFactory("HyperStableRouter02");
    // const HyperStableRouter = await hyperStableRouter02.deploy(HyperStableFactoryAddress, WETHAddress);
    // const HyperStableRouterAddress = await HyperStableRouter.target;
    // console.log("HyperStableRouter Address:",HyperStableRouterAddress);

    const HyperStableFactoryAddress="0x1c987fFa0f80f38d8BD59B96d5903Cf9E7D1df15";
    const HyperStableRouterAddress="0x5793e20336Cd597e7D2AC55557df1384A673a7BA";
    const HyperCrossFiRouterAddress="0x47B2a77fFb95282C67A2F746d0C2330213ce26AD";
  
    const HyperStableRouter=new ethers.Contract(HyperStableRouterAddress,HyperStableRouter02ABI.abi,owner);
    const HyperStableFactory=new ethers.Contract(HyperStableFactoryAddress,HyperStableFactoryABI.abi,owner);
    const HyperCrossFiRouter=new ethers.Contract(HyperCrossFiRouterAddress,HyperCrossFiRouterABI.abi,owner);

    const opVizingPad="0x4577A9D09AE42913fC7c4e0fFD87E3C60CE3bb1b";
    const arbChainId=421614;
    // const hyperCrossFiRouter = await ethers.getContractFactory("HyperCrossFiRouter");
    // const HyperCrossFiRouter = await hyperCrossFiRouter.deploy(opVizingPad,HyperStableFactoryAddress, WETHAddress);
    // const HyperCrossFiRouterAddress =await HyperCrossFiRouter.target;
    // console.log("HyperCrossFiRouter address:",HyperCrossFiRouterAddress);


    //approve
    // const approveAmount=ethers.parseEther("10000000");
    // await USDC.approve(HyperStableRouterAddress, approveAmount);
    // await USDT.approve(HyperStableRouterAddress, approveAmount);
    // console.log("Approve success🥳🥳🥳");

    // const block = await provider.getBlock("latest");
    // const currentTimestamp = block.timestamp + 150;
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

    // //add weth-usdc 
    // const wethApprove=await WETH.approve(HyperStableRouterAddress, approveAmount);
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

    //add weth-usdt
    // const wethApprove=await WETH.approve(HyperStableRouterAddress, approveAmount);
    // await wethApprove.wait()
    // console.log("Weth approve success");

    // const liquidityParams2={
    //   tokenA: USDTAddress,
    //   tokenB: WETHAddress,
    //   amountADesired: ethers.parseEther("0.02365"),
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
    // const destHyperCrossFiRouterAddress="0x6A83B4F84716302Ee3b6b8Dd20Dac536Bbb9f931";
    // const destChainIds=[arbChainId];
    // const destChainContracts=[destHyperCrossFiRouterAddress];
    // const batchSetWhitelist=await HyperCrossFiRouter.batchSetWhitelist(destChainIds, destChainContracts);
    // await batchSetWhitelist.wait();
    // console.log("batchSetWhitelist success");

    // // setSrcTokenMirrorDestToken

    // const srcUSDC="0x7C4b5B71363Def9178453553C9D7A8789cD60908";
    // const srcUSDT="0x0a572426cBd8e9495b9543bE87CCaBfd7a85993C";
    // const srcWETH="0x4805B6E921465EE0766d359c03B9A478cb2A6bbc";
    // const destUSDC="0xa83b368365F47BB6c1458dBe64FffC8C9a8b4d89";
    // const destUSDT="0xB7649fC7Ed7f4D2f96EaEd2864712991e637B5CD";
    // const destWETH="0x36163d480435975C62cA32b01b367403DE755DEB";
    // const chainIds=[arbChainId,arbChainId,arbChainId];
    // const srcTokens=[srcUSDC,srcUSDT,srcWETH];
    // const destTokens=[destUSDC,destUSDT,destWETH];

    // const batchSetTokens=await HyperCrossFiRouter.batchSetTokens(chainIds, srcTokens,destTokens);
    // await batchSetTokens.wait();
    // console.log("batchSetTokens success");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});