// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract esZKDX is ERC20, Ownable {
    uint256 public tax;
    address public taxReceiver;
    mapping(address => bool) public whitelist;
    constructor(uint256 _mintAmount) ERC20("esZKDX", "esZKDX") {
        taxReceiver = msg.sender;
        _mint(msg.sender, _mintAmount);
    }
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    function _transfer(address from, address to, uint256 amount) internal override {
        if (whitelist[from] || whitelist[to] || tax == 0) {
            super._transfer(from, to, amount);
        } else {
            uint256 taxAmount = amount * tax / 1e6;
            super._transfer(from, taxReceiver, taxAmount);
            super._transfer(from, to, amount - taxAmount);
        }
    }
    function setTax(uint256 _tax) external onlyOwner {
        tax = _tax;
    }
    function setTaxReceiver(address _taxReceiver) external onlyOwner {
        taxReceiver = _taxReceiver;
    }
    function setWhitelist(address[] calldata _address, bool[] calldata _status) external onlyOwner {
        require(_address.length == _status.length, "esZKDX: params wrong.");
        for (uint256 i = 0; i < _address.length; i++)
            whitelist[_address[i]] = _status[i];
    }
}