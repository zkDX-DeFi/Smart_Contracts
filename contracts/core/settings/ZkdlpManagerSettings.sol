// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "../storage/ZkdlpManagerStorage.sol";
abstract contract ZkdlpManagerSettings is ZkdlpManagerStorage {
    function setInPrivateMode(bool _inPrivateMode) external onlyGov {
        inPrivateMode = _inPrivateMode;
    }
    function setShortsTrackerAveragePriceWeight(uint256 _shortsTrackerAveragePriceWeight) external onlyGov {
        require(_shortsTrackerAveragePriceWeight <= Constants.BASIS_POINTS_DIVISOR, Errors.ZKDLPMANAGER_INVALID_WEIGHT);
        shortsTrackerAveragePriceWeight = _shortsTrackerAveragePriceWeight;
    }
    function setHandler(address _handler, bool _isActive) external onlyGov {
        isHandler[_handler] = _isActive;
    }
    function setCooldownDuration(uint256 _cooldownDuration) external onlyGov {
        require(_cooldownDuration <= Constants.MAX_COOLDOWN_DURATION, Errors.ZKDLPMANAGER_INVALID_COOLDOWNDURATION);
        cooldownDuration = _cooldownDuration;
    }
    function setAumAdjustment(uint256 _aumAddition, uint256 _aumDeduction) external onlyGov {
        aumAddition = _aumAddition;
        aumDeduction = _aumDeduction;
    }
}
