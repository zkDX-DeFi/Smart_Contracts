// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "./IVaultUtils.sol";
interface IVault {
    function withdrawFees(address _token, address _receiver) external returns (uint256);
    function buyZKUSD(address _token, address _receiver) external returns (uint256);
    function sellZKUSD(address _token, address _receiver) external returns (uint256);
    function swap(address _tokenIn, address _tokenOut, address _receiver) external returns (uint256);
    function increasePosition(
        address _account, address _collateralToken,
        address _indexToken, uint256 _sizeDelta, bool _isLong) external;
    function decreasePosition(
        address _account, address _collateralToken,
        address _indexToken, uint256 _collateralDelta,
        uint256 _sizeDelta, bool _isLong, address _receiver) external returns (uint256);
    function validateLiquidation(
        address _account, address _collateralToken,
        address _indexToken, bool _isLong, bool _raise) external view returns (uint256, uint256);
    function liquidatePosition(
        address _account, address _collateralToken,
        address _indexToken, bool _isLong, address _feeReceiver) external returns (uint256);

    function tokenToUsdMin(address _token, uint256 _tokenAmount) external view returns (uint256);
    function priceFeed() external view returns (address);
    function fundingRateFactor() external view returns (uint256);
    function stableFundingRateFactor() external view returns (uint256);
    function cumulativeFundingRates(address _token) external view returns (uint256);
    function getNextFundingRate(address _token) external view returns (uint256);
    function getFeeBasisPoints(
        address _token, uint256 _zkusdDelta,
        uint256 _feeBasisPoints, uint256 _taxBasisPoints, bool _increment) external view returns (uint256);
    function liquidationFeeUsd() external view returns (uint256);
    function taxBasisPoints() external view returns (uint256);
    function stableTaxBasisPoints() external view returns (uint256);
    function mintBurnFeeBasisPoints() external view returns (uint256);
    function swapFeeBasisPoints() external view returns (uint256);
    function stableSwapFeeBasisPoints() external view returns (uint256);
    function marginFeeBasisPoints() external view returns (uint256);
    function allWhitelistedTokensLength() external view returns (uint256);
    function allWhitelistedTokens(uint256) external view returns (address);
    function whitelistedTokens(address _token) external view returns (bool);
    function stableTokens(address _token) external view returns (bool);
    function shortableTokens(address _token) external view returns (bool);
    function equityTokens(address _token) external view returns (bool);
    function feeReserves(address _token) external view returns (uint256);
    function globalShortSizes(address _token) external view returns (uint256);
    function globalShortAveragePrices(address _token) external view returns (uint256);
    function maxGlobalShortSizes(address _token) external view returns (uint256);
    function tokenDecimals(address _token) external view returns (uint256);
    function tokenWeights(address _token) external view returns (uint256);
    function guaranteedUsd(address _token) external view returns (uint256);
    function poolAmounts(address _token) external view returns (uint256);
    function bufferAmounts(address _token) external view returns (uint256);
    function reservedAmounts(address _token) external view returns (uint256);
    function zkusdAmounts(address _token) external view returns (uint256);
    function maxZkusdAmounts(address _token) external view returns (uint256);
    function getRedemptionAmount(address _token, uint256 _zkusdAmount) external view returns (uint256);
    function getMaxPrice(address _token) external view returns (uint256);
    function getMinPrice(address _token) external view returns (uint256);
    function getDelta(
        address _indexToken, uint256 _size,
        uint256 _averagePrice, bool _isLong, uint256 _lastIncreasedTime) external view returns (bool, uint256);
    function getPosition(
        address _account, address _collateralToken,
        address _indexToken, bool _isLong) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256);
    function isPositionExist(address _account, address _collateralToken, address _indexToken, bool _isLong) external view returns (bool, bytes32);
    function isInitialized() external view returns (bool);
    function isSwapEnabled() external view returns (bool);
    function isLeverageEnabled() external view returns (bool);
    function router() external view returns (address);
    function zkusd() external view returns (address);
    function gov() external view returns (address);
    function pendingGov() external view returns (address);
    function whitelistedTokenCount() external view returns (uint256);
    function maxLeverage() external view returns (uint256);
    function minProfitTime() external view returns (uint256);
    function hasDynamicFees() external view returns (bool);
    function fundingInterval() external view returns (uint256);
    function totalTokenWeights() external view returns (uint256);
    function getTargetZkusdAmount(address _token) external view returns (uint256);
    function inPrivateLiquidationMode() external view returns (bool);
    function approvedRouters(address _account, address _router) external view returns (bool);
    function isLiquidator(address _account) external view returns (bool);
    function isManager(address _account) external view returns (bool);
    function minProfitBasisPoints(address _token) external view returns (uint256);
    function tokenBalances(address _token) external view returns (uint256);
    function lastFundingTimes(address _token) external view returns (uint256);

    function setMaxLeverage(uint256 _maxLeverage) external;
    function setManager(address _manager, bool _isManager) external;
    function setIsSwapEnabled(bool _isSwapEnabled) external;
    function setIsLeverageEnabled(bool _isLeverageEnabled) external;
    function setZkusdAmount(address _token, uint256 _amount) external;
    function setBufferAmount(address _token, uint256 _amount) external;
    function setMaxGlobalShortSize(address _token, uint256 _amount) external;
    function setInPrivateLiquidationMode(bool _inPrivateLiquidationMode) external;
    function setLiquidator(address _liquidator, bool _isActive) external;
    function setFundingRate(
        uint256 _fundingInterval, uint256 _fundingRateFactor,
        uint256 _stableFundingRateFactor) external;
    function setFees(
        uint256 _taxBasisPoints, uint256 _stableTaxBasisPoints,
        uint256 _mintBurnFeeBasisPoints, uint256 _swapFeeBasisPoints,
        uint256 _stableSwapFeeBasisPoints, uint256 _marginFeeBasisPoints,
        uint256 _liquidationFeeUsd, uint256 _minProfitTime, bool _hasDynamicFees) external;

    function setTokenConfig(
        address _token, uint256 _tokenDecimals,
        uint256 _redemptionBps, uint256 _minProfitBps,
        uint256 _maxZkusdAmount, bool _isStable,
        bool _isShortable, bool _isEquity) external;
    function clearTokenConfig(address _token) external;
    function setMinProfitTime(uint256 _minProfitTime) external;
    function setPriceFeed(address _priceFeed) external;
    function setVaultUtils(IVaultUtils _vaultUtils) external;
    function setError(uint256 _errorCode, string calldata _error) external;
    function setAllowStableEquity(bool _allowStaleEquityPrice) external;
}
