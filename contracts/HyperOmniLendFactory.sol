// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {HyperOmniInl2Lend} from "./HyperOmniInl2Lend.sol";
import {IHyperOmniLend} from "../interfaces/IHyperOmniLend.sol";

contract HyperOmniLendFactory  {

    uint256 public lastId;

    mapping(uint256=>address)private idToLendMarket;

    function createLendMarket(
        address _owner
    ) external {
        address newLendMarket=address(
            new HyperOmniInl2Lend{salt:keccak256(abi.encodePacked(lastId,block.chainid,_owner))}(_owner)
        );
        idToLendMarket[lastId]=newLendMarket;
        lastId++;
    }

    function getIdToLendMarket(uint256 _id)external view returns(address _lendMarket){
        _lendMarket = idToLendMarket[_id];
    }
}