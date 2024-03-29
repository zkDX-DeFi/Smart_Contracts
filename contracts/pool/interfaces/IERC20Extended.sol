// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Extended is IERC20 {

    function mint(address _account, uint256 _amount) external;
    function burn(address _account, uint256 _amount) external;
}
