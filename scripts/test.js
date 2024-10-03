const hre = require("hardhat");
const PairABI=require("../artifacts/contracts/HyperStablePair.sol/HyperStablePair.json");
async function main() {
    const [owner] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    const provider = ethers.provider;

    const hyperStableFactory = await ethers.getContractFactory("HyperStableFactory");
    const HyperStableFactory = await hyperStableFactory.deploy(owner.address);
    const HyperStableFactoryAddress = await HyperStableFactory.target;
    console.log("HyperStableFactory Address:",HyperStableFactoryAddress);
  
    const wETH9 = await ethers.getContractFactory("WETH9");
    const WETH = await wETH9.deploy();
    const WETHAddress = await WETH.target;
    console.log("WETH Address:",WETHAddress);
  
    const usdc = await ethers.getContractFactory("TestToken");
    const USDC = await usdc.deploy("USDC Token", "USDC", 6);
    const USDCAddress = await USDC.target;
    console.log("USDC Address:",USDCAddress);
  
    const usdt = await ethers.getContractFactory("TestToken");
    const USDT = await usdt.deploy("USDT Token", "USDT", 8);
    const USDTAddress = await USDT.target;
    console.log("USDT Address:",USDTAddress);
  
    const hyperStableRouter02 = await ethers.getContractFactory("HyperStableRouter02");
    const HyperStableRouter = await hyperStableRouter02.deploy(HyperStableFactoryAddress, WETHAddress);
    const HyperStableRouterAddress = await HyperStableRouter.target;
    console.log("HyperStableRouter Address:",HyperStableRouterAddress);

    //approve
    const approveAmount=ethers.parseEther("10000000");
    await USDC.approve(HyperStableRouterAddress, approveAmount);
    await USDT.approve(HyperStableRouterAddress, approveAmount);
    console.log("Approve success🥳🥳🥳");

    const block = await provider.getBlock("latest");
    const currentTimestamp = block.timestamp + 100;
    console.log("Current Timestamp:", currentTimestamp);

    const liquidityParams={
      tokenA: USDCAddress,
      tokenB: USDTAddress,
      amountADesired: ethers.parseEther("100000"),
      amountBDesired: ethers.parseEther("99990"),
      amountAMin: 0,
      amountBMin: 0,
      to: owner.address,
      deadline: currentTimestamp
    };

    await HyperStableRouter.addLiquidity(
      liquidityParams.tokenA,
      liquidityParams.tokenB,
      liquidityParams.amountADesired,
      liquidityParams.amountBDesired,
      liquidityParams.amountAMin,
      liquidityParams.amountBMin,
      liquidityParams.to,
      liquidityParams.deadline
    );
    console.log("AddLiquidity success 🎉🎉🎉");

    //Get pair
    const pairAddress=await HyperStableFactory.getPair(liquidityParams.tokenA,liquidityParams.tokenB);
    console.log("pair:",pairAddress);

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

    //do swap
    const swapParams={
        amountIn: hre.ethers.parseEther("0.0000000001"),  //usdc
        amountOutMin: hre.ethers.parseEther("0.000000000099"),  //99%
        path: [liquidityParams.tokenA, liquidityParams.tokenB],
        to: owner.address,
        deadline: liquidityParams.deadline
    }
    const ownerUsdcBeforeBalance=await USDC.balanceOf(owner.address);
    const ownerUsdtBeforeBalance=await USDT.balanceOf(owner.address);
    const swap1=await HyperStableRouter.swapExactTokensForTokens(
        swapParams.amountIn,
        swapParams.amountOutMin,
        swapParams.path,
        swapParams.to,
        swapParams.deadline
    );
    await swap1.wait();
    const ownerUsdcAfterBalance=await USDC.balanceOf(owner.address);
    const ownerUsdtAfterBalance=await USDT.balanceOf(owner.address);
    const ownerDifferUsdc=ownerUsdcBeforeBalance-ownerUsdcAfterBalance;
    const ownerDifferUsdt=ownerUsdtAfterBalance-ownerUsdtBeforeBalance;
    console.log("ownerDifferUsdc:",ownerDifferUsdc);
    console.log("ownerDifferUsdt:",ownerDifferUsdt);
    console.log("First swap success 🎉🎉🎉");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});