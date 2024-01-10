// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./interfaces/IZKUSD.sol";
import "../libraries/Constants.sol";
import "../libraries/Errors.sol";
import "./base/YieldToken.sol";

contract ZKUSD is YieldToken, IZKUSD {
    mapping(address => bool) public vaults;
    modifier onlyVault() {
        require(vaults[msg.sender], Errors.ZKUSD_FORBIDDEN);
        _;
    }
    constructor(address _vault) public YieldToken(Constants.ZKUSD_TOKEN_NAME, Constants.ZKUSD_TOKEN_SYMBOL, 0) {
        vaults[_vault] = true;
    }
    function addVault(address _vault) external override onlyGov {
        vaults[_vault] = true;
    }

    function removeVault(address _vault) external override onlyGov {
        vaults[_vault] = false;
    }

    function mint(address _account, uint256 _amount) external override onlyVault {
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _amount) external override onlyVault {
        _burn(_account, _amount);
    }
}
