// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../storage/RewardRouterV2Storage.sol";

abstract contract RewardRouterV2Settings is RewardRouterV2Storage {
    
    function initialize(
        address _weth,
        address _zkdx,
        address _zkdlp,
        address _zkdlpManager
    ) external onlyGov {
        require(!isInitialized, Errors.REWARDROUTER_ALREADY_INITIALIZED);
        isInitialized = true;
        weth = _weth;
        zkdx = _zkdx;
        zkdlp = _zkdlp;
        zkdlpManager = _zkdlpManager;
    }
}
