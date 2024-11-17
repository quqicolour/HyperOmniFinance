// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IHyperOmniFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    
    function setFeeTo(address) external;
    function setFeeToSetter(address) external;

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function indexPair(uint256 index) external view returns(address _pair);
    function getPair(address _tokenA, address _tokenB) external view returns (address _pair);
    function pairCodeHash() external view returns (bytes32);
}