const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const PairABI=require("../artifacts/contracts/HyperStablePair.sol/HyperStablePair.json");
  
  describe("HyperStable", function () {
    async function deployHyperStableFactory() {
      const [owner, otherAccount] = await ethers.getSigners();
      const hyperStableFactory = await ethers.getContractFactory("HyperStableFactory");
      const HyperStableFactory = await hyperStableFactory.deploy(owner);
      return { HyperStableFactory };
    }

    async function deployWETH() {
      const [owner, otherAccount] = await ethers.getSigners();
      const wETH9 = await ethers.getContractFactory("WETH9");
      const WETH = await wETH9.deploy();
      return { WETH };
    }

    async function deployUsdc() {
      const [owner, otherAccount] = await ethers.getSigners();
      const usdc = await ethers.getContractFactory("TestToken");
      const USDC = await usdc.deploy("USDC Token", "USDC", 6);
      return { USDC };
    }

    async function deployUsdt() {
      const [owner, otherAccount] = await ethers.getSigners();
      const usdt = await ethers.getContractFactory("TestToken");
      const USDT = await usdt.deploy("USDT Token", "USDT", 8);
      return { USDT };
    }

    async function deployHyperStableRouter02(_HyperStableFactory, _WETH) {
      const [owner, otherAccount] = await ethers.getSigners();
      const hyperStableRouter02 = await ethers.getContractFactory("HyperStableRouter02");
      const HyperStableRouter = await hyperStableRouter02.deploy(_HyperStableFactory, _WETH);
      return { HyperStableRouter };
    }
  
    describe("Deployment", function () {
      it("Add liquidity and usdc swap to usdt", async function () {
        const provider = ethers.provider;
        const { HyperStableFactory } = await loadFixture(deployHyperStableFactory);
        const { WETH } = await loadFixture(deployWETH);
        const { USDC } = await loadFixture(deployUsdc);
        const { USDT } = await loadFixture(deployUsdt);
        const { HyperStableRouter } = await deployHyperStableRouter02(HyperStableFactory, WETH);
        console.log("Deploy success");
        const [owner, otherAccount] = await ethers.getSigners();

        //approve
        const approveAmount=ethers.parseEther("10000000");
        await USDC.approve(HyperStableRouter, approveAmount);
        await USDT.approve(HyperStableRouter, approveAmount);
        console.log("Approve success🥳🥳🥳");

        const block = await provider.getBlock("latest");
        const currentTimestamp = block.timestamp + 1000;
        console.log("Current Timestamp:", currentTimestamp);

        const liquidityParams={
          tokenA: USDC,
          tokenB: USDT,
          amountADesired: ethers.parseEther("100000"),
          amountBDesired: ethers.parseEther("99990"),
          amountAMin: 0,
          amountBMin: 0,
          to: owner,
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
        const pair1Approve=await PairContract1.approve(HyperStableRouter, liquidityAmount);
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
        console.log("Remove liquidityr success😗😗😗");

        //swapExactTokensForTokens
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
        console.log("swapExactTokensForTokens success 🎉🎉🎉");

        //swapTokensForExactTokens
        const newSwapParams1={
          amountOut: hre.ethers.parseEther("0.000000000099"),  //99%
          amountInMax: hre.ethers.parseEther("0.0000000001"),  //usdt
          path: [liquidityParams.tokenB, liquidityParams.tokenA],
          to: owner.address,
          deadline: liquidityParams.deadline
      }
        const getAmountsIn=await HyperStableRouter.getAmountsIn(newSwapParams1.amountOut,newSwapParams1.path);
        console.log("getAmountsIn:",getAmountsIn);
        const swap2=await HyperStableRouter.swapTokensForExactTokens(
          newSwapParams1.amountOut,
          getAmountsIn[0],
          newSwapParams1.path,
          newSwapParams1.to,
          newSwapParams1.deadline
        );
        await swap2.wait();
        console.log("swapTokensForExactTokens success 🎉🎉🎉");

        const newLiquidityParams={
          tokenA: USDC,
          tokenB: WETH,
          amountADesired: ethers.parseEther("2388"),
          amountBDesired: ethers.parseEther("1"),
          amountAMin: 0,
          amountBMin: 0,
          to: owner,
          deadline: currentTimestamp
        };
        await WETH.deposit({value: ethers.parseEther("1")});
        console.log("Deposite eth success");

        await WETH.approve(HyperStableRouter, ethers.parseEther("1"));

        await HyperStableRouter.addLiquidity(
          newLiquidityParams.tokenA,
          newLiquidityParams.tokenB,
          newLiquidityParams.amountADesired,
          newLiquidityParams.amountBDesired,
          newLiquidityParams.amountAMin,
          newLiquidityParams.amountBMin,
          newLiquidityParams.to,
          newLiquidityParams.deadline
        );
        console.log("AddLiquidity success 🎉🎉🎉");

        //swapETHForExactTokens
        const newSwapParams2={
          amountOut: hre.ethers.parseEther("0.0000000001"),
          path:[WETH,USDC],
          to: owner,
          deadline: currentTimestamp
        }

        const getAmountsIn2=await HyperStableRouter.getAmountsIn(newSwapParams2.amountOut,newSwapParams2.path);
        console.log("getAmountsIn2 eth:",getAmountsIn2);
        await HyperStableRouter.swapETHForExactTokens(
          newSwapParams2.amountOut,
          newSwapParams2.path,
          newSwapParams2.to,
          newSwapParams2.deadline
        ,{value: getAmountsIn2[0]});
        console.log("swapETHForExactTokens success 🎉🎉🎉");

        //swapExactETHForTokens
        const newSwapParams3={
          ethAmountIn: hre.ethers.parseEther("0.001"),
          path:[WETH,USDC],
          to: owner,
          deadline: currentTimestamp
        }

        const amountOutMin=await HyperStableRouter.getAmountsOut(newSwapParams3.ethAmountIn,newSwapParams3.path);
        console.log("amountOutMin:",amountOutMin);
        await HyperStableRouter.swapExactETHForTokens(
          amountOutMin[1],
          newSwapParams3.path,
          newSwapParams3.to,
          newSwapParams3.deadline
        ,{value: newSwapParams3.ethAmountIn});
        console.log("swapExactETHForTokens success 🎉🎉🎉");
        
        //swapExactTokensForETH
        const newSwapParams4={
          amountIn: hre.ethers.parseEther("0.01"),
          amountOutMin: hre.ethers.parseEther("0.000000000099"),
          path:[USDC,WETH],
          to: owner,
          deadline: currentTimestamp
        }
        const getAmountsOut=await HyperStableRouter.getAmountsOut(newSwapParams4.amountIn,newSwapParams4.path);
        console.log("getAmountsOut:",getAmountsOut);
        await HyperStableRouter.swapExactTokensForETH(
          newSwapParams4.amountIn,
          getAmountsOut[1],
          newSwapParams4.path,
          newSwapParams4.to,
          newSwapParams4.deadline
        );
        console.log("swapExactTokensForETH success 🎉🎉🎉");
  
      });
  
    });

  });
  