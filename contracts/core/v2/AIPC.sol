// SPDX-License-Identifier: MIT
import "../../access/Governable.sol";
pragma solidity ^0.6.0;
contract AIPC is Governable {
    constructor () public {
        gov = msg.sender;
        policies[0] = "Put Option";
        policies[1] = "Call Option";
        policies[2] = "American Option";
        policies[3] = "European Option";
        policies[4] = "Asian Option";
        policies[5] = "Barrier Option";
        policies[6] = "Binary Option";
        policies[7] = "Compound Option";
        policies[8] = "Rainbow Option";
        policies[9] = "Lookback Option";
        policies[10] = "Forward Start Option";
        policies[11] = "Chooser Option";
        policies[12] = "Exchange Option";
        policies[13] = "Quanto Option";
        policies[14] = "Basket Option";
        policies[15] = "Spread Option";

    }
    mapping (uint => string) public policies;
    function getAIPCPolicy(
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        uint256 _sizeDelta,
        uint256 _collateralDelta
    ) external view returns (uint256, string memory) {
        if (_isLong) {
            return (0, policies[0]);
        } else {
            return (1, policies[1]);
        }
    }

    function setPolicy(uint _policyId, string memory _policy) external onlyGov {
        policies[_policyId] = _policy;
    }

    function getPolicy(uint _policyId) external view returns (string memory) {
        return policies[_policyId];
    }
}
