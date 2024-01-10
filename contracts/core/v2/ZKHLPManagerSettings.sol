// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "../interfaces/IVault.sol";
import "../../libraries/token/SafeERC20.sol";
import "../../libraries/Errors.sol";
import "../../access/Governable.sol";
import "../../tokens/interfaces/IMintable.sol";

abstract contract ZKHLPManagerSettings is Governable{
    // constructor
    IVault public vault;
    address public zkhlp;
    address public zkusd;
    uint256 public cooldownDuration;

    mapping (address => bool) public isHandler;

    /* misc */
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    function setHandler(address _handler, bool _isActive) external onlyGov {
        isHandler[_handler] = _isActive;
    }
}
