// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./VaultV2Settings.sol";
contract VaultV2 is VaultV2Settings{
    constructor () {
        gov = msg.sender;
    }
    function initialize(address _priceFeed, uint _fundingRate) public {
        _onlyGov();
        _validate(!isInitialized, 1);
        isInitialized = true;
        priceFeed = _priceFeed;
        fundingRate = _fundingRate;
    }
    function increasePosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        uint256 _positionType, //0: old, 1: new
        uint256 _sizeDelta
    ) external{
        _validateTokens(_collateralToken, _indexToken, _isLong, _positionType);
        bytes32 key = keccak256(abi.encodePacked(_account, _collateralToken, _indexToken, _isLong, _positionType));

        positions[key].size += _sizeDelta;
        positions[key].collateral += _transferIn(_collateralToken);
        positions[key].entryFundingRate += fundingRate;

        uint256 price = _isLong ? getMaxPrice(_indexToken) : getMinPrice(_indexToken);
        positions[key].reservedAmounts +=  _sizeDelta * 1e18 / price;
        positions[key].lastIncreasedTime = block.timestamp;
    }
}
