const hre = require("hardhat");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const AAVEERC20ABI=require("../json/AAVEUSDC.json");
const AUSDCABI=require("../json/AUSDC.json");
const HyperOmniLendFactoryABI=require("../artifacts/contracts/HyperOmniLendFactory.sol/HyperOmniLendFactory.json");
const HyperOmniDividendTokenABI=require("../artifacts/contracts/HyperOmniDividendToken.sol/HyperOmniDividendToken.json");
const HyperOmniInl2LendABI=require("../artifacts/contracts/HyperOmniInl2Lend.sol/HyperOmniInl2Lend.json");

//op sepolia
// HyperOmniLendFactory Address: 0x4130593A00331Fa080a3585B94662A538e98BC12
// lendMarket: 0x06Ed503C333Fb8aadB8Da9A3A9ABEe5ECe4e9557
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

    //aave op
    const opPool="0xb50201558B00496A145fE76f7424749556E326D8";
    const opProxyAUSDC="0xa818F1B57c201E092C4A2017A91815034326Efd1";
    const opAUSDC="0x6c23bAF050ec192afc0B967a93b83e6c5405df43";
    const opL2Encode="0xBeC519531F0E78BcDdB295242fA4EC5251B38574";

    // const hyperOmniLendFactory = await ethers.getContractFactory("HyperOmniLendFactory");
    // const HyperOmniLendFactory = await hyperOmniLendFactory.deploy();
    // const HyperOmniLendFactoryAddress=HyperOmniLendFactory.target;
    // console.log("HyperOmniLendFactory Address:",HyperOmniLendFactoryAddress);

    const HyperOmniLendFactoryAddress="0x4130593A00331Fa080a3585B94662A538e98BC12";
    const HyperOmniLendFactory=new ethers.Contract(HyperOmniLendFactoryAddress,HyperOmniLendFactoryABI.abi,owner);

    const TargetContracts=[
      "0x7541830CDB1B57B3C34FC40D9a69F58C34260789",   //base sepolia
      "0xfF7fb1416Bca20b9311cb0a395695834992F3ab4"    //eth sepolia
    ]

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


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});