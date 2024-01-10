// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";

contract esZKDXOmni is OFTV2 {

    constructor(address _layerZeroEndpoint, address _owner) OFTV2("esZKDX", "esZKDX", 6, _layerZeroEndpoint) {
        _transferOwnership(_owner);
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
}