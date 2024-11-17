// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "../interfaces/IHyperOmniFactory.sol";
import "./HyperOmniPair.sol";

contract HyperOmniFactory is IHyperOmniFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) private _getPair;
    address[] private allPairs;

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function pairCodeHash() external view returns (bytes32) {
        return keccak256(type(HyperOmniPair).creationCode);
    }

    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        require(tokenA != tokenB, "HyperOmniFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "HyperOmniFactory: ZERO_ADDRESS");
        require(
            _getPair[token0][token1] == address(0),
            "HyperOmniFactory: PAIR_EXISTS"
        ); // single check is sufficient
        bytes memory bytecode = type(HyperOmniPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IHyperOmniPair(pair).initialize(token0, token1);
        _getPair[token0][token1] = pair;
        _getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "HyperOmniFactory: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "HyperOmniFactory: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }

    function indexPair(uint256 index) external view returns (address _pair) {
        _pair = allPairs[index];
    }

    function getPair(
        address _tokenA,
        address _tokenB
    ) external view returns (address _pair) {
        _pair = _getPair[_tokenA][_tokenB];
    }
}
