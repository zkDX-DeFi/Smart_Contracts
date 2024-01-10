// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract MultiTransfer {

    function multiTransfer20(address tokenAddress, address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length == amounts.length, "params length mismatch");
        IERC20 token = IERC20(tokenAddress);
        for (uint256 i = 0; i < recipients.length; i++)
            token.transferFrom(msg.sender, recipients[i], amounts[i]);
    }

    function multiTransfer721(address tokenAddress, address[] memory recipients, uint256[] memory tokenIds) external {
        require(recipients.length == tokenIds.length, "params length mismatch");
        IERC721 token = IERC721(tokenAddress);
        for (uint256 i = 0; i < recipients.length; i++)
            token.transferFrom(msg.sender, recipients[i], tokenIds[i]);
    }
}

