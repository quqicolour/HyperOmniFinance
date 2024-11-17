const hre = require("hardhat");
const USDCABI = require("../json/USDC.json");
const messageTransmitterABI = require("../json/MessageTransmitter.json");
const { getAttestation } = require("./attestationservice");
const HyperOmniLendABI=require("../artifacts/contracts/HyperOmniLend.sol/HyperOmniLend.json");

const { Wallet } = require("ethers");

require("dotenv").config();
async function main() {
    const [owner] = await hre.ethers.getSigners();
    console.log("deployer:", owner.address);
    const AttestationStatus = {
        COMPLETE: 'complete',
        PENDING_CONFIRMATIONS: 'pending_confirmations',
    };

    //sepolia
    const provider = ethers.provider;
    const sepoliaHyperOmniLendAddress="0x680B5A206864903cf092f3f2EE20b2dE213e50a1";
    const HyperOmniLendSepolia=new ethers.Contract(HyperOmniLendAddress,HyperOmniLendABI.abi,owner);


    //arb sepolia
    const usdcAddress = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
    const tokenMessager = "0x9f3b8679c73c2fef8b59b4f3444d4e156fb70aa5";
    const messageTransmitter = "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872";

    //provider
    const arbUsdcAddress = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
    const arbTokenMessager = "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const arbMessageTransmitter = "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872";

    const HyperOmniLendAddress="0x680B5A206864903cf092f3f2EE20b2dE213e50a1";
    const HyperOmniLend=new ethers.Contract(HyperOmniLendAddress,HyperOmniLendABI.abi,owner);

    const arbProvider = new ethers.JsonRpcProvider(process.env.ArbitrumTestnetAPIKEY);
    const arbSigner = new ethers.Wallet(
        process.env.PRIVATE_KEY,
        arbProvider
    );
    const ARBMessageTransmitter = new ethers.Contract(arbMessageTransmitter, messageTransmitterABI, arbSigner);

    const validState="0x01";
    const invalidState="0x00";
    async function fetchPastEvents() {
        try {
            const getCrossArbitrageInfo=await HyperOmniLendSepolia.getCrossArbitrageInfo();
            console.log("getCrossArbitrageInfo:",getCrossArbitrageInfo);

            const startBlock = getCrossArbitrageInfo.recordBlock;
            console.log("Trade before Block Number:", startBlock);
            
            const currentBlockNumber=await provider.getBlockNumber();
            const endBlock = currentBlockNumber;
            console.log("Trade after Block Number:", endBlock);
            const resultMessage = await ARBMessageTransmitter.queryFilter('MessageSent', startBlock, endBlock);

            const message = resultMessage[0].args[0];
            console.log("message result:", message);

            const messageHash = ethers.keccak256(message);
            console.log('messageHash:', messageHash);
            // const intervalId = setInterval(async () => {
            const attestationResponse = await getAttestation(messageHash);
            if (attestationResponse && attestationResponse.status === AttestationStatus.COMPLETE) {
                try{
                    let attestation=attestationResponse.message;
                    console.log("attestation:",attestation);
                    const getvalidAttsetation=await HyperOmniLend.getvalidAttsetation(attestation);
                    console.log("getvalidAttsetation:",getvalidAttsetation);
                    if(getvalidAttsetation != validState){
                        console.log("Executive reception...");
                        const receiveUSDC = await HyperOmniLend.receiveUSDC(messageTransmitter, message, attestation);
                        await receiveUSDC.wait();
                        console.log("Receive USDC success🥳🥳🥳");
                    }else{
                        console.log("Already claim");
                    }
                }catch(e){
                    console.log("Attestation generate error:",e);
                }
            }else{
                console.log("Attestation generate...");
            }
        }catch(e){
            console.log("Error:", e);
        }
    }
    
    setInterval(async () => {
        await fetchPastEvents();
    }, 25000);

    

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});