// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;
import {IPool} from "../interfaces/aaveV3/IPool.sol";
import {IMessageTransmitter} from "../interfaces/cctp/IMessageTransmitter.sol";
import {ITokenMessenger} from "../interfaces/cctp/ITokenMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IHyperOmniStruct} from "../interfaces/IHyperOmniStruct.sol";
import {IHyperOmniEvent} from "../interfaces/IHyperOmniEvent.sol";
import {HyperOmniDividendToken} from "./HyperOmniDividendToken.sol";

contract HyperOmniInETHLend is
    HyperOmniDividendToken,
    ReentrancyGuard,
    IHyperOmniStruct,
    IHyperOmniEvent
{
    using SafeERC20 for IERC20;
    address public owner;
    address public manager;
    address private tokenMessager;
    bool public INITSTATE;

    uint16 private referralCode;
    uint64 private depositeTotalAmount;

    constructor(address _owner) {
        owner = _owner;
    }

    mapping(address => CrossArbitrageInfo) private _CrossArbitrageInfo;

    mapping(address => UserSupplyInfo) private _UserSupplyInfo;

    mapping(bytes => bytes1) private validAttsetation;

    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    address[] public receiverContract;

    function initialize(
        address _manager,
        address _tokenMessager,
        address[] calldata validReceiveGroup
    ) external onlyOwner {
        require(INITSTATE == false,"Already initialize");
        manager = _manager;
        tokenMessager = _tokenMessager;
        for (uint256 i = 0; i < validReceiveGroup.length; i++) {
            receiverContract.push(validReceiveGroup[i]);
        }
        INITSTATE = true;
    }

    function transferOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function inEthSupply(
        address usdcPool,
        address usdc,
        uint256 amount
    ) public onlyManager {
        bytes1 state = _aaveSupply(usdcPool, usdc, amount);
        require(state == 0x01, "Supply fail");
    }

    function inEthWithdraw(
        address usdcPool,
        address ausdc,
        address usdc,
        uint256 amount
    ) external onlyManager {
        bytes1 state = _aaveWithdraw(usdcPool, ausdc, usdc, amount);
        require(state == 0x01, "Withdraw fail");
    }

    function crossUSDC(
        uint8 receiver,
        uint32 destinationDomain,
        uint64 _block,
        address usdc
    ) public onlyManager {
        bytes1 crossState = _crossUSDC(
            receiver,
            destinationDomain,
            _block,
            usdc
        );
        require(crossState == 0x01, "Cross USDC fail");
    }

    function receiveUSDC(
        address messageTransmitter,
        bytes calldata message,
        bytes calldata attestation
    ) external {
        require(_receiveUSDC(messageTransmitter, message, attestation));
    }

    function reStart(
        bytes calldata originalMessage,
        bytes calldata originalAttestation,
        bytes32 newDestinationCaller,
        uint8 newMintRecipient
    ) external onlyManager {
        address _receiveContract = receiverContract[newMintRecipient];
        ITokenMessenger(tokenMessager).replaceDepositForBurn(
            originalMessage,
            originalAttestation,
            newDestinationCaller,
            addressToBytes32(_receiveContract)
        );
    }

    function receiveUSDCAndETHSupply(
        IHyperOmniStruct.ReceiveUSDCAndETHSupplyParams calldata params
    ) external onlyManager {
        bool receiveState = _receiveUSDC(
            params.messageTransmitter,
            params.message,
            params.attestation
        );
        require(receiveState, "Receive USDC fail");
        uint256 balance = _tokenBalance(params.usdc, address(this));
        require(balance > 0, "Zero");
        bytes1 supplyState = _aaveSupply(params.usdcPool, params.usdc, balance);
        require(supplyState == 0x01, "Supply fail");
    }

    function ethWithdrawAndCrossUSDC(
        IHyperOmniStruct.ETHWithdrawAndCrossUSDCParams calldata params
    ) external onlyManager {
        bytes1 state = _aaveWithdraw(
            params.usdcPool,
            params.ausdc,
            params.usdc,
            params.aUSDCAmount
        );
        require(state == 0x01, "Withdraw fail");
        bytes1 crossState = _crossUSDC(
            params.receiver,
            params.destinationDomain,
            params._block,
            params.usdc
        );
        require(crossState == 0x01, "Cross USDC fail");
    }

    function _crossUSDC(
        uint8 indexReceiver,
        uint32 destinationDomain,
        uint64 _block,
        address usdc
    ) private returns(bytes1){
        address _receiveContract = receiverContract[indexReceiver];
        uint256 _amount = _tokenBalance(usdc, address(this));
        require(_amount > 0, "Zero");
        IERC20(usdc).approve(tokenMessager, _amount);
        uint64 _nonce = ITokenMessenger(tokenMessager).depositForBurn(
            _amount,
            destinationDomain,
            addressToBytes32(_receiveContract),
            usdc
        );
        _CrossArbitrageInfo[address(this)] = CrossArbitrageInfo({
            usdcNonce: _nonce,
            recordBlock: _block,
            currentChainId: block.chainid,
            totalRaised: _amount,
            arbitrageSum: _amount
        });
        emit LendCrossUSDC(_receiveContract, destinationDomain, _amount);
        return 0x01;
    }

    function _receiveUSDC(
        address messageTransmitter,
        bytes calldata message,
        bytes calldata attestation
    ) private returns (bool _receiveState) {
        _receiveState = IMessageTransmitter(messageTransmitter).receiveMessage(
            message,
            attestation
        );
        validAttsetation[attestation] = 0x01;
    }

    function _aaveSupply(
        address usdcPool,
        address usdc,
        uint256 amount
    ) private returns (bytes1 state) {
        IERC20(usdc).approve(usdcPool, amount);
        IPool(usdcPool).supply(usdc, amount, address(this), referralCode);
        state = 0x01;
    }

    function _aaveWithdraw(
        address usdcPool,
        address ausdc,
        address usdc,
        uint256 amount
    ) private returns (bytes1 state) {
        IERC20(ausdc).safeIncreaseAllowance(usdcPool, amount);
        IPool(usdcPool).withdraw(usdc, amount, address(this));
        state = 0x01;
    }

    function getvalidAttsetation(
        bytes calldata _attsetation
    ) external view returns (bytes1 state) {
        state = validAttsetation[_attsetation];
    }

    function getTokenBalance(
        address token,
        address user
    ) external view returns (uint256 _thisTokenBalance) {
        _thisTokenBalance = _tokenBalance(token, user);
    }

    function getCrossArbitrageInfo()
        external
        view
        returns (CrossArbitrageInfo memory _getCrossArbitrageInfo)
    {
        _getCrossArbitrageInfo = _CrossArbitrageInfo[address(this)];
    }

    function _tokenBalance(
        address token,
        address user
    ) private view returns (uint256 _thisTokenBalance) {
        _thisTokenBalance = IERC20(token).balanceOf(user);
    }

    function addressToBytes32(address _address) private pure returns (bytes32) {
        return bytes32(uint256(uint160(_address)));
    }
}
