// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IHyperOmniLend {
    function initialize(
        address _manager,
        address _tokenMessager,
        address _feeReceiver,
        address[] calldata validReceiveGroup
    ) external;
}