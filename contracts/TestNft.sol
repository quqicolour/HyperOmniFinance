// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestNft is ERC721 {
    constructor()
        ERC721("Hyper Super Vip Token", "HSVIP")
    {
        _safeMint(msg.sender, 0);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }
}