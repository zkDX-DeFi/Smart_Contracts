// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../../libraries/math/SafeMath.sol";
import "../../libraries/token/IERC20.sol";
import "../../libraries/token/SafeERC20.sol";
import "../../libraries/Events.sol";
import "../../libraries/Errors.sol";
import "../../libraries/Constants.sol";
import "../../libraries/utils/ReentrancyGuard.sol";
import "../interfaces/IVault.sol";
import "../interfaces/IShortsTracker.sol";
import "../interfaces/IZkdlpManager.sol";
import "../interfaces/IVaultPriceFeed.sol";
import "../../tokens/interfaces/IZKUSD.sol";
import "../../tokens/interfaces/IMintable.sol";
import "../../access/Governable.sol";

abstract contract ZKdlpManagerAggregators is IZkdlpManager, ReentrancyGuard, Governable {
}
