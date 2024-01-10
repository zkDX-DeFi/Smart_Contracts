// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./RewardRouterV2Aggregator.sol";

abstract contract RewardRouterV2Storage is RewardRouterV2Aggregator {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Address for address payable;
    bool public isInitialized;
    address public weth;
    address public zkdx;
    address public zkdlp;
    address public zkdlpManager;
//    mapping(address => address) public pendingReceivers;
}
