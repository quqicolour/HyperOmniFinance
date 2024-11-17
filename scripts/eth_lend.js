const hre = require("hardhat");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const AAVEERC20ABI=require("../json/AAVEUSDC.json");
const AUSDCABI=require("../json/AUSDC.json");
const HyperOmniDividendTokenABI=require("../artifacts/contracts/HyperOmniDividendToken.sol/HyperOmniDividendToken.json");
const HyperOmniInETHLendABI=require("../artifacts/contracts/HyperOmniInETHLend.sol/HyperOmniInETHLend.json");

//op sepolia
// HyperOmniInETHLend Address: 0x477947011E5EE59C0e2432c95cbB22034B0c5054
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

    //aave eth sepolia
    const sepoliaPool="0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
    const sepoliaPoolProvider="0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A";
    const test_usdc="0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
    const proxtAusdc="0x16dA4541aD1807f4443d92D26044C1147406EB80";
    const ausdc="0x48424f2779be0f03cDF6F02E17A591A9BF7AF89f";

    // const hyperOmniInETHLend = await ethers.getContractFactory("HyperOmniInETHLend");
    // const HyperOmniInETHLend = await hyperOmniInETHLend.deploy(owner.address);
    // const HyperOmniInETHLendAddress=HyperOmniInETHLend.target;
    // console.log("HyperOmniInETHLendAddress:",HyperOmniInETHLendAddress);

    const HyperOmniInETHLendAddress="0xfF7fb1416Bca20b9311cb0a395695834992F3ab4";
    const HyperOmniInETHLend=new ethers.Contract(HyperOmniInETHLendAddress,HyperOmniInETHLendABI.abi,owner);

    const TargetContracts=[
        "0x7541830CDB1B57B3C34FC40D9a69F58C34260789",    //base sepolia
        "0x06Ed503C333Fb8aadB8Da9A3A9ABEe5ECe4e9557"   //op sepolia
      ]

    const initialize=await HyperOmniInETHLend.initialize(
        manager,
        sepoliaTokenMessage,
        TargetContracts
    );
    await initialize.wait();
    console.log("initialize success");
    





}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});