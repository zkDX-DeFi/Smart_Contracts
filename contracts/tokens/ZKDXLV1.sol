// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZKDXLV1 is ERC20, Ownable {

    uint256 public endTime;
    address public burnableAddress;

    constructor(uint256 _mintAmount) ERC20("ZKDXLV1", "ZKDXLV1") {
        _mint(msg.sender, _mintAmount);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        if (endTime > 0) require(block.timestamp < endTime, "Can not transfer now.");
        super._transfer(from, to, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == burnableAddress, "Only burnable address!");
        _burn(from, amount);
    }

    function setBurnableAddress(address _address) external onlyOwner {
        burnableAddress = _address;
    }

    function setEndTime(uint256 _endTime) external onlyOwner {
        endTime = _endTime;
    }

    function multiTransfer(address[] calldata users, uint256[] calldata amounts) external {
        require(users.length > 0, "Invalid params!");
        require(users.length == amounts.length, "Invalid length!");

        for (uint256 i = 0; i < users.length; i++)
            transfer(users[i], amounts[i]);
    }
}
