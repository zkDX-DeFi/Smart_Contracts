// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZKHLP is ERC20, Ownable {

    mapping(address => bool) public isManager;

    constructor() ERC20("ZKHLP", "ZKHLP"){}

    function mint(address to, uint256 amount) external {
        require(isManager[msg.sender], "ZKHLP: not manager");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(isManager[msg.sender], "ZKHLP: not manager");
        _burn(from, amount);
    }

    function setManager(address manager, bool enabled) external onlyOwner {
        isManager[manager] = enabled;
    }
}