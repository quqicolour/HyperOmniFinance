const hre = require("hardhat");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const WETHABI=require("../artifacts/contracts/WETH.sol/WETH9.json");
const HyperOmniRouter02ABI=require("../artifacts/contracts/HyperOmniRouter02.sol/HyperOmniRouter02.json");
const HyperOmniFactoryABI=require("../artifacts/contracts/HyperOmniFactory.sol/HyperOmniFactory.json");
const HyperAssembleRouterABI=require("../artifacts/contracts/HyperAssembleRouter.sol/HyperAssembleRouter.json");
const messageTransmitterABI=require("../json/MessageTransmitter.json");
const axios = require('axios');

/**
HyperOmniFactory Address: 0xe590a5C6d85daA950aa1D1e9466134CE8853817E
WETH Address: 0x32f72a0A2Ae5B632F873A8B502A5aE576aaEaE5e
VipNft Address: 0xbe6bA502Fb3694833380aae014138243792dd12d
USDT Address: 0xFd31886862746C36d5ab3d8B87C81892dCE9EE86
HyperOmniRouter Address: 0x424f0A9Abb7D5bA0EF743e48f5E879C02f6ca803
HyperAssembleRouter address: 0x1bd29549b80A77b2E89C2FbEC5B5A9d7Bca0b20D
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    const provider = ethers.provider;
    const ZeroAddress = "0x0000000000000000000000000000000000000000";
    const arbChainId=421614;

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

    const VipNftAddress="0xbe6bA502Fb3694833380aae014138243792dd12d";
    //op usdc
    const USDCAddress="0x5fd84259d66Cd46123540766Be93DFE6D43130D7";
    const tokenMessager="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const op_sepolia=2n;

    const USDTAddress="0xFd31886862746C36d5ab3d8B87C81892dCE9EE86";
    const WETHAddress="0x32f72a0A2Ae5B632F873A8B502A5aE576aaEaE5e";
    
    const USDC=new ethers.Contract(USDCAddress,ERC20ABI.abi,owner);
    const USDT=new ethers.Contract(USDTAddress,ERC20ABI.abi,owner);
    const WETH=new ethers.Contract(WETHAddress,WETHABI.abi,owner);
  
    // const hyperOmniRouter02 = await ethers.getContractFactory("HyperOmniRouter02");
    // const HyperOmniRouter = await hyperOmniRouter02.deploy(HyperOmniFactoryAddress, WETHAddress);
    // const HyperOmniRouterAddress = await HyperOmniRouter.target;
    // console.log("HyperOmniRouter Address:",HyperOmniRouterAddress);

    const HyperOmniFactoryAddress="0xe590a5C6d85daA950aa1D1e9466134CE8853817E";
    const HyperOmniRouterAddress="0x424f0A9Abb7D5bA0EF743e48f5E879C02f6ca803";
   
    const HyperOmniFactory=new ethers.Contract(HyperOmniFactoryAddress,HyperOmniFactoryABI.abi,owner);
    const HyperOmniRouter=new ethers.Contract(HyperOmniRouterAddress,HyperOmniRouter02ABI.abi,owner);

    const destHyperAssembleRouterAddress="0x6a34a98c183A3Fe6E66Dbb743cF28f0873B29f54";
    const opVizingPad="0x4577A9D09AE42913fC7c4e0fFD87E3C60CE3bb1b";
    const opChainId=11155420;
    const hyperAssembleRouter = await ethers.getContractFactory("HyperAssembleRouter");
    const HyperAssembleRouter = await hyperAssembleRouter.deploy(USDCAddress, WETHAddress, opVizingPad, tokenMessager);
    const HyperAssembleRouterAddress =await HyperAssembleRouter.target;
    console.log("HyperAssembleRouter address:",HyperAssembleRouterAddress);

    // const HyperAssembleRouterAddress="0x1bd29549b80A77b2E89C2FbEC5B5A9d7Bca0b20D";
    // const HyperAssembleRouter=new ethers.Contract(HyperAssembleRouterAddress,HyperAssembleRouterABI.abi,owner);

    //usdc balance
    const usdcBalance=await USDC.balanceOf(owner.address);
    console.log("Usdc balance:",usdcBalance);

    // approve
    // const approveAmount=ethers.parseEther("10000000");
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
      tokenA: WETHAddress,
      tokenB: USDTAddress,
      amountADesired: ethers.parseEther("0.002"),
      amountBDesired: 236500000000n,
      amountAMin: 0,
      amountBMin: 0,
      to: owner.address,
      deadline: currentTimestamp
    };
    // const depositETH2=await WETH.deposit({value: liquidityParams3.amountADesired});
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
    const validState="0x01";
    const invalidState="0x00";
    const routers=[HyperOmniRouterAddress];
    const states=[validState];
    const batchSetValidRouters=await HyperAssembleRouter.batchSetValidRouters(routers,states);
    await batchSetValidRouters.wait();
    console.log("batchSetValidRouters success");

    //addRouter
    for(let i=0;i<3;i++){
      const addRouter=await HyperAssembleRouter.addRouter(HyperOmniRouterAddress);
      await addRouter.wait();
    }
    console.log("addRouter success");

    //batchSetValidNfts
    const nfts=[VipNftAddress];
    const nftStates=[validState];
    const batchSetValidNfts=await HyperAssembleRouter.batchSetValidNfts(nfts,nftStates);
    await batchSetValidNfts.wait();
    console.log("batchSetValidNfts success");

    //setWhitelist
    const destChainIds=[arbChainId];
    const destChainContracts=[destHyperAssembleRouterAddress];
    const batchSetWhitelist=await HyperAssembleRouter.batchSetWhitelist(destChainIds, destChainContracts);
    await batchSetWhitelist.wait();
    console.log("batchSetWhitelist success");

    //usdc
    const messageTransmitter="0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";
    const MessageTransmitter=new ethers.Contract(messageTransmitter,messageTransmitterABI,owner);
    const messageHash="0x0f3a4af0e0740be2ce2710613d8b1de0abe2d3e6bc1c52ba58229d821935617d";
    
    // async function fetchAttestationData() {
    //     const url = `https://iris-api-sandbox.circle.com/attestations/${messageHash}`;
    //     try {
    //         const response = await axios.get(url); 
    //         const data = response.data;
    //         console.log(data); 
    //         return data; 
    //     } catch (error) {
    //         console.error('Error fetching attestation data:', error);
    //     }
    // }
    // // await fetchAttestationData();

    // const ownerBeforeUsdcBalance=await USDC.balanceOf(owner.address);
    // console.log("ownerBeforeUsdcBalance:",ownerBeforeUsdcBalance);

    // const message="0x000000000000000300000002000000000001a9ea0000000000000000000000009f3b8679c73c2fef8b59b4f3444d4e156fb70aa50000000000000000000000009f3b8679c73c2fef8b59b4f3444d4e156fb70aa500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000075faf114eafb1bdbe2f0316df893fd58ce46aa4d00000000000000000000000068f0e14430a6697d379928e37f1fb186ea4e7644000000000000000000000000000000000000000000000000000000000000005300000000000000000000000091cb475d484bf14923de41311e4a374f00211b13";
    // const attestation="0x2dc639dc738322fd62b23449c2093b1f4794fff22200d535599a806e53d558a131774931d84b815224d035f17e391f6e98d963f885fff38edc8e65ddff5b23541ccbf95288e075ae65a4899e2ec1bc0f6b5fb03d4235ab093b8f806a4a7fac3ac80973060e630299928ab76ce0753039fc40bc67f69acdcc2de9c1ab3d550e2e641c";

    // const receiveMessage=await MessageTransmitter.receiveMessage(message, attestation);
    // await receiveMessage.wait();
    // console.log("receiveMessage success");

    // const ownerAfterUsdcBalance=await USDC.balanceOf(owner.address);
    // console.log("ownerAfterUsdcBalance:",ownerAfterUsdcBalance);






}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});