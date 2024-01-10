// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
interface IRouter {
    function addPlugin(address _plugin) external;
    function pluginTransfer(address _token, address _account, address _receiver, uint256 _amount) external;
    function pluginIncreasePosition(
        address _account, address _collateralToken,
        address _indexToken, uint256 _sizeDelta, bool _isLong) external;
    function pluginDecreasePosition(
        address _account, address _collateralToken,
        address _indexToken, uint256 _collateralDelta,
        uint256 _sizeDelta, bool _isLong, address _receiver) external returns (uint256);
}
