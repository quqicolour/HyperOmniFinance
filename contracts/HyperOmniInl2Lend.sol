// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;
import {IMessageTransmitter} from "../interfaces/cctp/IMessageTransmitter.sol";
import {ITokenMessenger} from "../interfaces/cctp/ITokenMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IHyperOmniStruct} from "../interfaces/IHyperOmniStruct.sol";
import {IHyperOmniEvent} from "../interfaces/IHyperOmniEvent.sol";
import {IHyperOmniDividendToken} from "../interfaces/IHyperOmniDividendToken.sol";
import {HyperOmniDividendToken} from "./HyperOmniDividendToken.sol";
import {IL2Pool} from "../interfaces/aaveV3/IL2Pool.sol";

contract HyperOmniInl2Lend is
    HyperOmniDividendToken,
    ReentrancyGuard,
    IHyperOmniStruct,
    IHyperOmniEvent
{
    using SafeERC20 for IERC20;
    address private owner;
    address private manager;
    address private feeReceiver;
    address private tokenMessager;

    uint16 private referralCode;
    uint16 private fee = 2500;
    uint64 private bufferTime;
    uint64 private endTime;
    uint64 private depositeTotalAmount;

    bool public INITSTATE;

    constructor(address _owner) {
        owner = _owner;
    }

    mapping(address => CrossArbitrageInfo) private _CrossArbitrageInfo;

    mapping(address => UserSupplyInfo) private _UserSupplyInfo;

    mapping(bytes => bytes1) private validAttsetation;

    mapping(address => bytes1) private validUSDCRecever;

    address[] public receiverContract;

    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function initialize(
        address _manager,
        address _tokenMessager,
        address _feeReceiver,
        address[] calldata validReceiveGroup
    ) external onlyOwner{
        require(INITSTATE == false,"Already initialize");
        manager = _manager;
        tokenMessager = _tokenMessager;
        feeReceiver = _feeReceiver;
        for (uint256 i = 0; i < validReceiveGroup.length; i++) {
            validUSDCRecever[validReceiveGroup[i]] = 0x01;
            receiverContract.push(validReceiveGroup[i]);
        }
        INITSTATE = true;
    }

    function initializeTime(
        uint64 _bufferTime,
        uint64 _arbitrageTime
    ) external onlyManager {
        bufferTime = _bufferTime;
        endTime = bufferTime + _arbitrageTime;
        emit UpdateTime(bufferTime, endTime);
    }

    function setFee(uint16 _newFee) external onlyManager {
        uint16 _oldFee = fee;
        fee = _newFee;
        emit UpdateFee(_oldFee, fee);
    }

    //user deposite usdc
    function deposite(
        address usdc,
        address l2Pool,
        uint64 amount,
        bytes32 encodeMessage
    ) external nonReentrant {
        require(block.timestamp < bufferTime, "End of pledge");
        address currentUser = msg.sender;
        IERC20(usdc).safeTransferFrom(currentUser, address(this), amount);
        bytes1 state = _l2Deposite(l2Pool, amount, usdc, encodeMessage);
        require(state == 0x01, "Supply fail");
        uint256 hyperOmniDividendTokenAmount = (endTime - block.timestamp) *
            amount;
        depositeTotalAmount += amount;
        _UserSupplyInfo[currentUser] = UserSupplyInfo({
            supplyTime: uint64(block.timestamp),
            pledgeAmount: amount
        });
        bytes1 state2 = depositeMint(currentUser, hyperOmniDividendTokenAmount);
        emit UserDeposite(currentUser, amount);
        require(state2 == 0x01, "Mint fail");
    }

    function withdraw(address usdc) external nonReentrant {
        require(block.timestamp > endTime + 1 hours,"No end time");
        address currentUser = msg.sender;
        uint256 userDividendTokenAmount = balanceOf(currentUser);
        uint256 usdcBalance = _tokenBalance(usdc, address(this));
        require(userDividendTokenAmount > 0 && usdcBalance > 0, "Zero");
        uint256 earnAmount = _getUserFinallyAmount(
            userDividendTokenAmount,
            usdc
        );
        IERC20(usdc).safeTransfer(currentUser, earnAmount);
        bytes1 state = withdrawBurn(currentUser, userDividendTokenAmount);
        emit UserWithdraw(currentUser, earnAmount);
        require(state == 0x01, "Burn fail");
    }

    function withdrawFee(address usdc) external onlyManager {
        require(block.timestamp > endTime + 1 hours,"No end time");
        uint256 usdcBalance = _tokenBalance(usdc, address(this));
        if (usdcBalance > depositeTotalAmount) {
            uint256 earnAmount = ((usdcBalance - depositeTotalAmount) * fee) /
                10000;
            IERC20(usdc).approve(feeReceiver, earnAmount);
            IERC20(usdc).safeTransferFrom(
                address(this),
                feeReceiver,
                earnAmount
            );
        }
    }

    function inL2Supply(
        address l2Pool,
        uint256 amount,
        address usdc,
        bytes32 encodeMessage
    ) external onlyManager {
        bytes1 state = _l2Deposite(l2Pool, amount, usdc, encodeMessage);
        require(state == 0x01, "Supply fail");
    }

    function inL2Withdraw(
        address l2Pool,
        address ausdc,
        bytes32 encodeMessage
    ) external onlyManager {
        uint256 ausdcBalance = _tokenBalance(ausdc, address(this));
        IERC20(ausdc).approve(l2Pool, ausdcBalance);
        IL2Pool(l2Pool).withdraw(encodeMessage);
    }

    function crossUSDC(
        uint8 indexReceiver,
        uint32 destinationDomain,
        uint64 _block,
        address usdc
    ) public onlyManager {
        address _receiveContract = receiverContract[indexReceiver];
        require(
            validUSDCRecever[_receiveContract] == 0x01,
            "Invalid receive contract"
        );
        uint256 _amount = _tokenBalance(usdc, address(this));
        require(_amount > 0);
        bytes1 crossUSDCState=_crossUSDC(indexReceiver, destinationDomain, _block, usdc);
        require(crossUSDCState == 0x01,"Cross USDC fail");
    }

    function receiveUSDC(
        address messageTransmitter,
        bytes calldata message,
        bytes calldata attestation
    ) external {
        require(_receiveUSDC(messageTransmitter, message, attestation),"Receive USDC fail");
    }

    function reStart(
        bytes calldata originalMessage,
        bytes calldata originalAttestation,
        bytes32 newDestinationCaller,
        uint8 newMintRecipient
    ) external onlyManager {
        address _receiveContract = receiverContract[newMintRecipient];
        require(
            validUSDCRecever[_receiveContract] == 0x01,
            "Invalid receive contract"
        );
        ITokenMessenger(tokenMessager).replaceDepositForBurn(
            originalMessage,
            originalAttestation,
            newDestinationCaller,
            addressToBytes32(_receiveContract)
        );
    }

    function receiveUSDCAndL2Supply(
        IHyperOmniStruct.ReceiveUSDCAndL2SupplyParams calldata params
    ) external onlyManager {
        bool receiveState = _receiveUSDC(
            params.messageTransmitter,
            params.message,
            params.attestation
        );
        require(receiveState, "Receive USDC fail");
        uint256 balance = _tokenBalance(params.usdc, address(this));
        require(balance > 0, "Zero");
        bytes1 depositeState = _l2Deposite(
            params.l2Pool,
            balance,
            params.usdc,
            params.encodeMessage
        );
        require(depositeState == 0x01, "Supply fail");
    }

    function l2WithdrawAndCrossUSDC(
        IHyperOmniStruct.L2WithdrawAndCrossUSDCParams calldata params
    ) external onlyManager {
        bytes1 l2withdrawState = _l2Withdraw(
            params.l2Pool,
            params.ausdc,
            params.aUSDCAmount,
            params.encodeMessage
        );
        require(l2withdrawState == 0x01, "L2withdraw fail");
        bytes1 crossUSDCState=_crossUSDC(
            params.receiver,
            params.destinationDomain,
            params._block,
            params.usdc
        );
        require(crossUSDCState == 0x01,"Cross USDC fail");
    }

    function _l2Deposite(
        address l2Pool,
        uint256 amount,
        address usdc,
        bytes32 encodeMessage
    ) private returns (bytes1) {
        IERC20(usdc).approve(l2Pool, amount);
        IL2Pool(l2Pool).supply(encodeMessage);
        emit L2Supply(amount);
        return 0x01;
    }

    function _l2Withdraw(
        address l2Pool,
        address ausdc,
        uint256 _ausdcBalance,
        bytes32 encodeMessage
    ) private returns (bytes1) {
        uint256 ausdcBalance = _tokenBalance(ausdc, address(this));
        require(_ausdcBalance <= ausdcBalance, "Overflow");
        IERC20(ausdc).approve(l2Pool, ausdcBalance);
        uint256 usdcAmount=IL2Pool(l2Pool).withdraw(encodeMessage);
        emit L2withdraw(usdcAmount, _ausdcBalance);
        return 0x01;
    }

    function _crossUSDC(
        uint8 indexReceiver,
        uint32 destinationDomain,
        uint64 _block,
        address usdc
    ) private returns(bytes1){
        address _receiveContract = receiverContract[indexReceiver];
        require(
            validUSDCRecever[_receiveContract] == 0x01,
            "Invalid receive contract"
        );
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

    function _tokenBalance(
        address token,
        address user
    ) private view returns (uint256 _thisTokenBalance) {
        _thisTokenBalance = IERC20(token).balanceOf(user);
    }

    function _getUserFinallyAmount(
        uint256 _personalAmount,
        address _usdc
    ) private view returns (uint256 _finallyAmount) {
        uint256 balance = _tokenBalance(_usdc, address(this));
        if (balance <= depositeTotalAmount) {
            _finallyAmount = (_personalAmount * balance) / totalSupply();
        } else {
            _finallyAmount =
                _UserSupplyInfo[msg.sender].pledgeAmount +
                (_personalAmount *
                    (balance - depositeTotalAmount) *
                    (10000 - fee)) /
                10000 /
                totalSupply();
        }
    }

    function getPoolEarnAmount(
        address usdc
    ) external view returns (uint256 _earnAmount, uint256 _badDebts) {
        uint256 _usdcBalance = _tokenBalance(usdc, address(this));
        if (_usdcBalance >= depositeTotalAmount) {
            _earnAmount = _usdcBalance - depositeTotalAmount;
        } else {
            _badDebts = depositeTotalAmount - _usdcBalance;
        }
    }

    function getFee(
        uint256 _personalAmount,
        address _usdc
    ) external view returns (uint256 _fee) {
        uint256 balance = _tokenBalance(_usdc, address(this));
        if (balance <= depositeTotalAmount) {
            _fee = 0;
        } else {
            _fee =
                ((((balance - depositeTotalAmount) * _personalAmount) /
                    totalSupply()) * fee) /
                10000;
        }
    }

    function getUserFinallyAmount(
        uint256 _personalAmount,
        address _usdc
    ) external view returns (uint256 _finallyAmount) {
        _finallyAmount = _getUserFinallyAmount(_personalAmount, _usdc);
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

    function addressToBytes32(address _address) public pure returns (bytes32) {
        return bytes32(uint256(uint160(_address)));
    }

    function bytes32ToAddress(
        bytes32 _mintReceiver
    ) public pure returns (address) {
        return address(uint160(uint256(_mintReceiver)));
    }
}
