// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "../storage/VaultStorage.sol";

abstract contract VaultSettings is VaultStorage {

    function _onlyGov() internal view {
        _validate(msg.sender == gov, 53);
    }

    function setVaultUtils(IVaultUtils _vaultUtils) external override {
        _onlyGov();
        vaultUtils = _vaultUtils;
    }

    function setErrorController(address _errorController) external {
        _onlyGov();
        errorController = _errorController;
    }

    function setError(uint256 _errorCode, string calldata _error) external override {
        require(msg.sender == errorController, Errors.VAULT_INVALID_ERRORCONTROLLER);
        errors[_errorCode] = _error;
    }

    function setManager(address _manager, bool _isManager) external override {
        _onlyGov();
        isManager[_manager] = _isManager;
    }

    function setInPrivateLiquidationMode(bool _inPrivateLiquidationMode) external override {
        _onlyGov();
        inPrivateLiquidationMode = _inPrivateLiquidationMode;
    }

    function setLiquidator(address _liquidator, bool _isActive) external override {
        _onlyGov();
        isLiquidator[_liquidator] = _isActive;
    }

    function setIsSwapEnabled(bool _isSwapEnabled) external override {
        _onlyGov();
        isSwapEnabled = _isSwapEnabled;
    }

    function setIsLeverageEnabled(bool _isLeverageEnabled) external override {
        _onlyGov();
        isLeverageEnabled = _isLeverageEnabled;
    }

    function setGov(address _gov) external {
        _onlyGov();
        pendingGov = _gov;
    }

    function acceptGov() external {
        require(msg.sender == pendingGov, "Vault: not pendingGov");
        gov = pendingGov;
        delete pendingGov;
    }

    function setPriceFeed(address _priceFeed) external override {
        _onlyGov();
        priceFeed = _priceFeed;
    }

    function setMaxLeverage(uint256 _maxLeverage) external override {
        _onlyGov();
        _validate(_maxLeverage > Constants.MIN_LEVERAGE, 2);
        maxLeverage = _maxLeverage;
    }

    function setBufferAmount(address _token, uint256 _amount) external override {
        _onlyGov();
        bufferAmounts[_token] = _amount;
    }

    function setMaxGlobalShortSize(address _token, uint256 _amount) external override {
        _onlyGov();
        maxGlobalShortSizes[_token] = _amount;
    }

    function setFees(
        uint256 _taxBasisPoints,
        uint256 _stableTaxBasisPoints,
        uint256 _mintBurnFeeBasisPoints,
        uint256 _swapFeeBasisPoints,
        uint256 _stableSwapFeeBasisPoints,
        uint256 _marginFeeBasisPoints,
        uint256 _liquidationFeeUsd,
        uint256 _minProfitTime,
        bool _hasDynamicFees
    ) external override {

        _onlyGov();
        _validate(_taxBasisPoints <= Constants.MAX_FEE_BASIS_POINTS, 3);
        _validate(_stableTaxBasisPoints <= Constants.MAX_FEE_BASIS_POINTS, 4);
        _validate(_mintBurnFeeBasisPoints <= Constants.MAX_FEE_BASIS_POINTS, 5);
        _validate(_swapFeeBasisPoints <= Constants.MAX_FEE_BASIS_POINTS, 6);
        _validate(_stableSwapFeeBasisPoints <= Constants.MAX_FEE_BASIS_POINTS, 7);
        _validate(_marginFeeBasisPoints <= Constants.MAX_FEE_BASIS_POINTS, 8);
        _validate(_liquidationFeeUsd <= Constants.MAX_LIQUIDATION_FEE_USD, 9);
        taxBasisPoints = _taxBasisPoints;
        stableTaxBasisPoints = _stableTaxBasisPoints;
        mintBurnFeeBasisPoints = _mintBurnFeeBasisPoints;
        swapFeeBasisPoints = _swapFeeBasisPoints;
        stableSwapFeeBasisPoints = _stableSwapFeeBasisPoints;
        marginFeeBasisPoints = _marginFeeBasisPoints;
        liquidationFeeUsd = _liquidationFeeUsd;
        minProfitTime = _minProfitTime;
        hasDynamicFees = _hasDynamicFees;
    }

    function setFundingRate(uint256 _fundingInterval, uint256 _fundingRateFactor, uint256 _stableFundingRateFactor) external override {
        _onlyGov();
        fundingInterval = _fundingInterval;
        fundingRateFactor = _fundingRateFactor;
        stableFundingRateFactor = _stableFundingRateFactor;
    }

    function setTokenConfig(
        address _token,
        uint256 _tokenDecimals,
        uint256 _tokenWeight,
        uint256 _minProfitBps,
        uint256 _maxZkusdAmount,
        bool _isStable,
        bool _isShortable,
        bool _isEquity
    ) external override {
        _onlyGov();
        require(whitelistedTokenCount < MAX_WHITELISTED_TOKENS, "Vault: Max whitelisted tokens reached");
        if (!whitelistedTokens[_token]) {
            whitelistedTokenCount = whitelistedTokenCount.add(1);
            allWhitelistedTokens.push(_token);
        }
        uint256 _totalTokenWeights = totalTokenWeights;
        _totalTokenWeights = _totalTokenWeights.sub(tokenWeights[_token]);

        whitelistedTokens[_token] = true;
        tokenDecimals[_token] = _tokenDecimals;
        tokenWeights[_token] = _tokenWeight;
        minProfitBasisPoints[_token] = _minProfitBps;
        maxZkusdAmounts[_token] = _maxZkusdAmount;
        stableTokens[_token] = _isStable;
        shortableTokens[_token] = _isShortable;
        equityTokens[_token] = _isEquity;
        totalTokenWeights = _totalTokenWeights.add(_tokenWeight);
    }

    function setMinProfitTime(uint256 _minProfitTime) external override {
        _onlyGov();
        minProfitTime = _minProfitTime;
    }

    function setZkusdAmount(address _token, uint256 _amount) external override {
        _onlyGov();
        uint256 zkusdAmount = zkusdAmounts[_token];
        if (_amount > zkusdAmount) {
            _increaseZkusdAmount(_token, _amount.sub(zkusdAmount));
            return;
        }
        _decreaseZkusdAmount(_token, zkusdAmount.sub(_amount));
    }

    function setAllowStableEquity(bool _allowStaleEquityPrice) external override {
        _onlyGov();
        allowStaleEquityPrice = _allowStaleEquityPrice;
    }

    function _validate(bool _condition, uint256 _errorCode) internal view {
        require(_condition, errors[_errorCode]);
    }

    function _increaseZkusdAmount(address _token, uint256 _amount) internal {
        zkusdAmounts[_token] = zkusdAmounts[_token].add(_amount);
        uint256 maxZkusdAmount = maxZkusdAmounts[_token];
        if (maxZkusdAmount != 0) {
            _validate(zkusdAmounts[_token] <= maxZkusdAmount, 51);
        }
        emit Events.IncreaseZkusdAmount(_token, _amount);
    }

    function _decreaseZkusdAmount(address _token, uint256 _amount) internal {
        uint256 value = zkusdAmounts[_token];
        if (value <= _amount) {
            zkusdAmounts[_token] = 0;
            emit Events.DecreaseZkusdAmount(_token, value);
            return;
        }
        zkusdAmounts[_token] = value.sub(_amount);
        emit Events.DecreaseZkusdAmount(_token, _amount);
    }
}
