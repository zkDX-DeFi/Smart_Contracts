// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "./AIPC.sol";
abstract contract HedgeManagerSettings {
    struct Hedge {
        uint256 policyId;
        uint256 lastIncreasedTime;
    }
    mapping(bytes32 => Hedge) public hedges;
    AIPC public aipc;
}
