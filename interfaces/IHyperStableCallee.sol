// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IHyperStableCallee {
    function HyperStableCall(address sender, uint amount0, uint amount1, bytes calldata data) external;
}