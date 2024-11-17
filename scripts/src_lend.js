const hre = require("hardhat");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const AAVEERC20ABI=require("../json/AAVEUSDC.json");
const AUSDCABI=require("../json/AUSDC.json");
const HyperOmniLendFactoryABI=require("../artifacts/contracts/HyperOmniLendFactory.sol/HyperOmniLendFactory.json");
const HyperOmniDividendTokenABI=require("../artifacts/contracts/HyperOmniDividendToken.sol/HyperOmniDividendToken.json");
const HyperOmniInl2LendABI=require("../artifacts/contracts/HyperOmniInl2Lend.sol/HyperOmniInl2Lend.json");

//base sepolia
// HyperOmniLendFactory Address: 0x2e2FAa63d130Ba00947e94b8c4F42d1383e4F17a
// lendMarket: 0x2d894C0B8B674813Cb1DfaD5E1963440f090C25f
async function main() {
    const [owner] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    const provider = ethers.provider;
    const manager="0xE95CC1a820F2152D1d928772bBf88E2c4A8EcED9";
    const feeReceiver=owner.address;

    const sepoliaTokenMessage="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const sepoliaMessageTransmitter="0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

    const opTokenMessage="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const opMessageTransmitter="0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

    const baseTokenMessage="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const baseMessageTransmitter="0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

    //aave base
    const basePool="0xbE781D7Bdf469f3d94a62Cdcc407aCe106AEcA74";
    const baseProxyAUSDC="0xfE45Bf4dEF7223Ab1Bf83cA17a4462Ef1647F7FF";
    const baseAUSDC="0xA9E3fFb25C369e44862DD3e87Be4420abb879965";
    const baseL2Encode="0x0ffE481FBF0AE2282A5E1f701fab266aF487A97D";

    const hyperOmniLendFactory = await ethers.getContractFactory("HyperOmniLendFactory");
    const HyperOmniLendFactory = await hyperOmniLendFactory.deploy();
    const HyperOmniLendFactoryAddress=HyperOmniLendFactory.target;
    console.log("HyperOmniLendFactory Address:",HyperOmniLendFactoryAddress);

    // const HyperOmniLendFactoryAddress="0x2e2FAa63d130Ba00947e94b8c4F42d1383e4F17a";
    // const HyperOmniLendFactory=new ethers.Contract(HyperOmniLendFactoryAddress,HyperOmniLendFactoryABI.abi,owner);

    const TargetContracts=[
      "0x06Ed503C333Fb8aadB8Da9A3A9ABEe5ECe4e9557",   //op sepolia
      "0x477947011E5EE59C0e2432c95cbB22034B0c5054"    //sepolia
    ];

    const createLendMarket=await HyperOmniLendFactory.createLendMarket(
      owner.address
    );
    await createLendMarket.wait();
    console.log("createLendMarket success");

    const lendMarket=await HyperOmniLendFactory.getIdToLendMarket(0);
    console.log("lendMarket:",lendMarket);

    const HyperOmniLend=new ethers.Contract(lendMarket,HyperOmniInl2LendABI.abi,owner);

    const initialize=await HyperOmniLend.initialize(
      manager,
      baseTokenMessage,
      feeReceiver,
      TargetContracts
    )
    await initialize.wait();
    console.log("initialize success");

    // const hyperOmniLend = await ethers.getContractFactory("HyperOmniLend");
    // const HyperOmniLend = await hyperOmniLend.deploy(owner.address);
    // const HyperOmniLendAddress=HyperOmniLend.target;
    // console.log("HyperOmniLendAddress:",HyperOmniLendAddress);

    // const HyperOmniLendAddress="0x53e4f08D70227d424C9976D77C16CD58dd52F7f4";
    // const HyperOmniLend=new ethers.Contract(HyperOmniLendAddress,HyperOmniLendABI.abi,owner);

    const sepoliaPool="0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
    const sepoliaPoolProvider="0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A";
    const test_usdc="0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
    const proxtAusdc="0x16dA4541aD1807f4443d92D26044C1147406EB80";
    const ausdc="0x48424f2779be0f03cDF6F02E17A591A9BF7AF89f";
    const TestUSDC=new ethers.Contract(test_usdc,AAVEERC20ABI,owner);
    const AUSDC=new ethers.Contract(ausdc,AUSDCABI,owner);

    //balance
    // const TestUSDCBalance=await TestUSDC.balanceOf(owner.address);
    // console.log("TestUSDCBalance:",TestUSDCBalance);
        
    // //approve
    // const allowance1=await TestUSDC.allowance(owner.address, HyperOmniLendAddress);
    // console.log("allowance1:",allowance1);
    // if(allowance1 <= 100000n){
    //   const usdcApprove=await TestUSDC.approve(HyperOmniLendAddress, ethers.parseEther("100"));
    //   await usdcApprove.wait();
    //   console.log("TestUSDC approve success");
    // }
    // const allowance2=await AUSDC.allowance( owner.address, HyperOmniLendAddress);
    // console.log("allowance2:",allowance2);
    // if(allowance2 <= 100000n){
    //   const ausdcApprove=await AUSDC.approve(HyperOmniLendAddress, ethers.parseEther("100"));
    //   await ausdcApprove.wait();
    //   console.log("AUSDC approve success");
    // }

    // //deposite
    // const usdcDecimals=await TestUSDC.decimals();
    // console.log("usdcDecimals:",usdcDecimals);
    // const amountIn=1000000n;
    // const deposite=await HyperOmniLend.deposite(test_usdc, sepoliaPool, amountIn);
    // const depositeTx=await deposite.wait();
    // console.log("deposite success:");

    // //crossUSDC
    // const destinationDomain=3; //arbitrum
    // const currentBlockNumber=await provider.getBlockNumber();
    // const crossUSDC=await HyperOmniLend.crossUSDC(
    //   destinationDomain,
    //   currentBlockNumber,
    //   test_usdc,
    //   arbContract
    // );
    // const crossUSDCTx=await crossUSDC.wait();
    // console.log("crossUSDC success:",crossUSDCTx);



    // const HyperOmniDividendTokenBalance=await HyperOmniLend.balanceOf(owner.address);
    // console.log("HyperOmniDividendTokenBalance:",HyperOmniDividendTokenBalance);

    // const TestUSDCBalance2=await TestUSDC.balanceOf(owner.address);
    // console.log("TestUSDCBalance2:",TestUSDCBalance2);
    // const TestUSDCBalance3=await TestUSDC.balanceOf(HyperOmniLendAddress);
    // console.log("TestUSDCBalance3:",TestUSDCBalance3);

    //crossWithdraw
    // const withdrawAmount=10000n;
    // const crossWithdraw=await HyperOmniLend.crossWithdraw(sepoliaPool, ausdc, test_usdc, withdrawAmount);
    // const crossWithdrawTx=await crossWithdraw.wait();
    // console.log("crossWithdraw success:");

    // const TestUSDCBalance4=await TestUSDC.balanceOf(owner.address);
    // console.log("TestUSDCBalance4:",TestUSDCBalance4);
    // const TestUSDCBalance5=await TestUSDC.balanceOf(HyperOmniLendAddress);
    // console.log("TestUSDCBalance5:",TestUSDCBalance5);

    //crossSupply
    // const crossSupply=await HyperOmniLend.crossSupply(sepoliaPool, test_usdc, TestUSDCBalance5 / 5n);
    // const crossSupplyTx=await crossSupply.wait();
    // console.log("crossSupply success");

    // const TestUSDCBalance6=await TestUSDC.balanceOf(HyperOmniLendAddress);
    // console.log("TestUSDCBalance6:",TestUSDCBalance6);

    // const totalSupply=await HyperOmniLend.totalSupply();
    // console.log('totalSupply:',totalSupply);

    // const HyperBalance=await HyperOmniLend.balanceOf(owner.address);
    // console.log("HyperBalance:",HyperBalance);

    // const getFee=await HyperOmniLend.getFee(HyperBalance,test_usdc);
    // console.log("getFee:",getFee);

    // const getUserFinallyAmount=await HyperOmniLend.getUserFinallyAmount(HyperBalance,test_usdc);
    // console.log("getUserFinallyAmount:",getUserFinallyAmount);

    //withdraw
    // const withdraw=await HyperOmniLend.withdraw(test_usdc);
    // const withdrawTx=await withdraw.wait();
    // console.log("withdraw success:",withdrawTx);

    // const TestUSDCBalance7=await TestUSDC.balanceOf(owner.address);
    // console.log("TestUSDCBalance7:",TestUSDCBalance7);



}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});