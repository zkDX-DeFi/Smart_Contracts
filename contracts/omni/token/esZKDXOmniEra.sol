// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract esZKDXOmniEra is OFTV2 {

    IERC20 public previousToken;

    constructor(address _layerZeroEndpoint, address _oldToken) OFTV2("esZKDX", "esZKDX", 6, _layerZeroEndpoint) {
        previousToken = IERC20(_oldToken);
    }

    function upgrade() external {
        uint256 _amount = previousToken.balanceOf(msg.sender);
        require(_amount > 0, "no balance or already upgraded");
        previousToken.transferFrom(msg.sender, address(0x1), _amount); // burn previous token
        _mint(msg.sender, _amount);
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

}