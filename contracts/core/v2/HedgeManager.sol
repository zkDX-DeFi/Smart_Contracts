// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
import "./HedgeManagerSettings.sol";
contract HedgeManager is HedgeManagerSettings{
    constructor (address _aipcAddress) public {
        aipc = AIPC(_aipcAddress);
    }
    function createHedgePolicy(
        bytes32 _key,
        uint _policyId
    ) public {
        hedges[_key].policyId = _policyId;
        hedges[_key].lastIncreasedTime = block.timestamp;
    }

    function getPolicyFromKey(bytes32 _key) external view returns(Hedge memory) {
        return hedges[_key];
    }

    function getPolicyMessageById(uint256 _policyId) external view returns(string memory) {
        return aipc.getPolicy(_policyId);
    }

    function getPolicyFromAIPC(
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        uint256 _sizeDelta,
        uint256 _collateralDelta
    ) external view returns (uint256, string memory) {
        return aipc.getAIPCPolicy(
            _collateralToken,
            _indexToken,
            _isLong,
            _sizeDelta,
            _collateralDelta);
    }
}
