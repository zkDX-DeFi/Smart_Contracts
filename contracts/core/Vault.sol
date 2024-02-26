// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "./settings/VaultInternal.sol";

contract Vault is VaultInternal {

    modifier onlyManager() {
        _validate(isManager[msg.sender], 54);
        _;
    }

    constructor() public {
        gov = msg.sender;
    }

    function initialize(address _router, address _zkusd, address _priceFeed, uint256 _liquidationFeeUsd, uint256 _fundingRateFactor, uint256 _stableFundingRateFactor) external {
        _onlyGov();
        _validate(!isInitialized, 1);
        isInitialized = true;
        router = _router;
        zkusd = _zkusd;
        priceFeed = _priceFeed;
        liquidationFeeUsd = _liquidationFeeUsd;
        fundingRateFactor = _fundingRateFactor;
        stableFundingRateFactor = _stableFundingRateFactor;
    }

    function withdrawFees(address _token, address _receiver) external override returns (uint256) {
        _onlyGov();
        uint256 amount = feeReserves[_token];
        if (amount == 0) {return 0;}
        feeReserves[_token] = 0;
        _transferOut(_token, amount, _receiver);
        emit Events.WithdrawFees(_token, _receiver, amount);
        return amount;
    }

    function directPoolDeposit(address _token) external override nonReentrant {
        _validate(whitelistedTokens[_token], 14);
        uint256 tokenAmount = _transferIn(_token);
        _validate(tokenAmount > 0, 15);
        _increasePoolAmount(_token, tokenAmount);
        emit Events.DirectPoolDeposit(_token, tokenAmount);
    }

    /**
        * @param _token token to buy zkUSD with
        * @param _receiver receiver of zkUSD
        * @return mintAmount amount of zkUSD minted
    */
    function buyZKUSD(address _token, address _receiver) external override nonReentrant onlyManager returns (uint256) { // only called by manager contracts
        require(_receiver != address(0), "Vault: Receiver cannot be the zero address");
        _validate(whitelistedTokens[_token], 16);
        uint256 tokenAmount = _transferIn(_token);
        _validate(tokenAmount > 0, 17);
        updateCumulativeFundingRate(_token, _token);
        uint256 price = getMinPrice(_token);
        uint256 zkusdAmount = tokenAmount.mul(price).div(Constants.PRICE_PRECISION);
        zkusdAmount = adjustForDecimals(zkusdAmount, _token, zkusd);
        _validate(zkusdAmount > 0, 18);
        uint256 feeBasisPoints = vaultUtils.getBuyZkusdFeeBasisPoints(_token, zkusdAmount);
        uint256 amountAfterFees = _collectSwapFees(_token, tokenAmount, feeBasisPoints);
        uint256 mintAmount = amountAfterFees.mul(price).div(Constants.PRICE_PRECISION);
        mintAmount = adjustForDecimals(mintAmount, _token, zkusd);
        _increaseZkusdAmount(_token, mintAmount);
        _increasePoolAmount(_token, amountAfterFees);
        IZKUSD(zkusd).mint(_receiver, mintAmount);
        emit Events.BuyZKUSD(_receiver, _token, tokenAmount, mintAmount, feeBasisPoints);
        return mintAmount;
    }

    /**
        * @param _token token to sell zkUSD for
        * @param _receiver receiver of token
        * @return amountOut amount of token received
    */

    function sellZKUSD(address _token, address _receiver) external override nonReentrant onlyManager returns (uint256) {
        require(_receiver != address(0), "Vault: Receiver cannot be the zero address");
        _validate(whitelistedTokens[_token], 19);
        uint256 zkusdAmount = _transferIn(zkusd);
        _validate(zkusdAmount > 0, 20);
        updateCumulativeFundingRate(_token, _token);
        uint256 redemptionAmount = getRedemptionAmount(_token, zkusdAmount);
        _validate(redemptionAmount > 0, 21);
        _decreaseZkusdAmount(_token, zkusdAmount);
        _decreasePoolAmount(_token, redemptionAmount);
        IZKUSD(zkusd).burn(address(this), zkusdAmount);
        _updateTokenBalance(zkusd);

        uint256 feeBasisPoints = vaultUtils.getSellZkusdFeeBasisPoints(_token, zkusdAmount);
        uint256 amountOut = _collectSwapFees(_token, redemptionAmount, feeBasisPoints);
        _validate(amountOut > 0, 22);
        _transferOut(_token, amountOut, _receiver);
        emit Events.SellZKUSD(_receiver, _token, zkusdAmount, amountOut, feeBasisPoints);
        return amountOut;
    }

    /**
        * @param _tokenIn token to swap from
        * @param _tokenOut token to swap to
        * @param _receiver receiver of token
        * @return amountOut amount of token received
    */
    function swap(address _tokenIn, address _tokenOut, address _receiver) external override nonReentrant returns (uint256) {
        require(_receiver != address(0), "Vault: Receiver cannot be the zero address");
        _validate(isSwapEnabled, 23);
        _validate(whitelistedTokens[_tokenIn], 24);
        _validate(whitelistedTokens[_tokenOut], 25);
        _validate(_tokenIn != _tokenOut, 26);
        updateCumulativeFundingRate(_tokenIn, _tokenIn);
        updateCumulativeFundingRate(_tokenOut, _tokenOut);
        uint256 amountIn = _transferIn(_tokenIn);
        _validate(amountIn > 0, 27);
        uint256 priceIn = getMinPrice(_tokenIn);
        uint256 priceOut = getMaxPrice(_tokenOut);
        uint256 amountOut = amountIn.mul(priceIn).div(priceOut);
        amountOut = adjustForDecimals(amountOut, _tokenIn, _tokenOut);
        uint256 zkusdAmount = amountIn.mul(priceIn).div(Constants.PRICE_PRECISION);
        zkusdAmount = adjustForDecimals(zkusdAmount, _tokenIn, zkusd);
        uint256 feeBasisPoints = vaultUtils.getSwapFeeBasisPoints(_tokenIn, _tokenOut, zkusdAmount);
        uint256 amountOutAfterFees = _collectSwapFees(_tokenOut, amountOut, feeBasisPoints);

        _increaseZkusdAmount(_tokenIn, zkusdAmount);
        _decreaseZkusdAmount(_tokenOut, zkusdAmount);
        _increasePoolAmount(_tokenIn, amountIn);
        _decreasePoolAmount(_tokenOut, amountOut);
        _validateBufferAmount(_tokenOut);
        _transferOut(_tokenOut, amountOutAfterFees, _receiver);
        emit Events.Swap(_receiver, _tokenIn, _tokenOut, amountIn, amountOut, amountOutAfterFees, feeBasisPoints);
        return amountOutAfterFees;
    }

    /**
        * @param _account account to increase position for
        * @param _collateralToken token to use as collateral
        * @param _indexToken token to use as index
        * @param _sizeDelta size to increase position by
        * @param _isLong true if long, false if short
    */
    function increasePosition(address _account, address _collateralToken, address _indexToken, uint256 _sizeDelta, bool _isLong) external override nonReentrant {
        require(_account != address(0), "Vault: Account cannot be the zero address");
        _validate(isLeverageEnabled, 28);
        _validateGasPrice();
        _validateRouter(_account);
        _validateTokens(_collateralToken, _indexToken, _isLong);
        vaultUtils.validateIncreasePosition(_account, _collateralToken, _indexToken, _sizeDelta, _isLong);
        updateCumulativeFundingRate(_collateralToken, _indexToken);
        bytes32 key = getPositionKey(_account, _collateralToken, _indexToken, _isLong);
        DataTypes.Position storage position = positions[key];
        uint256 price = _isLong ? getMaxPrice(_indexToken) : getMinPrice(_indexToken);
        if (position.size == 0) {
            position.averagePrice = price;
        }
        if (position.size > 0 && _sizeDelta > 0) {
            position.averagePrice = getNextAveragePrice(_indexToken, position.size, position.averagePrice, _isLong, price, _sizeDelta, position.lastIncreasedTime);
        }

        uint256 fee = _collectMarginFees(_account, _collateralToken, _indexToken, _isLong, _sizeDelta, position.size, position.entryFundingRate);
        uint256 collateralDelta = _transferIn(_collateralToken);
        uint256 collateralDeltaUsd = tokenToUsdMin(_collateralToken, collateralDelta);

        position.collateral = position.collateral.add(collateralDeltaUsd);
        _validate(position.collateral >= fee, 29);
        position.collateral = position.collateral.sub(fee);
        position.entryFundingRate = getEntryFundingRate(_collateralToken, _indexToken, _isLong);
        position.size = position.size.add(_sizeDelta);
        position.lastIncreasedTime = block.timestamp;

        _validate(position.size > 0, 30);
        _validatePosition(position.size, position.collateral);
        validateLiquidation(_account, _collateralToken, _indexToken, _isLong, true);

        uint256 reserveDelta = usdToTokenMax(_collateralToken, _sizeDelta);
        position.reserveAmount = position.reserveAmount.add(reserveDelta);
        _increaseReservedAmount(_collateralToken, reserveDelta);
        if (_isLong) {
            _increaseGuaranteedUsd(_collateralToken, _sizeDelta.add(fee));
            _decreaseGuaranteedUsd(_collateralToken, collateralDeltaUsd);
            _increasePoolAmount(_collateralToken, collateralDelta);
            _decreasePoolAmount(_collateralToken, usdToTokenMin(_collateralToken, fee));
        } else {
            if (globalShortSizes[_indexToken] == 0) {
                globalShortAveragePrices[_indexToken] = price;
            } else {
                globalShortAveragePrices[_indexToken] = getNextGlobalShortAveragePrice(_indexToken, price, _sizeDelta);
            }

            _increaseGlobalShortSize(_indexToken, _sizeDelta);
        }
        emit Events.IncreasePosition(key, _account, _collateralToken, _indexToken, collateralDeltaUsd, _sizeDelta, _isLong, price, fee);
        emit Events.UpdatePosition(key, position.size, position.collateral, position.averagePrice, position.entryFundingRate, position.reserveAmount, position.realisedPnl, price);
    }

    /**
        * @param _account account to decrease position for
        * @param _collateralToken token to use as collateral
        * @param _indexToken token to use as index
        * @param _collateralDelta amount of collateral to withdraw
        * @param _sizeDelta size to decrease position by
        * @param _isLong true if long, false if short
        * @param _receiver receiver of tokens
        * @return amountOut amount of tokens received
    */
    function decreasePosition(address _account, address _collateralToken, address _indexToken, uint256 _collateralDelta, uint256 _sizeDelta, bool _isLong, address _receiver) external override nonReentrant returns (uint256) {
        require(_account != address(0), "Vault: Account cannot be the zero address");
        _validateGasPrice();
        _validateRouter(_account);
        return _decreasePosition(_account, _collateralToken, _indexToken, _collateralDelta, _sizeDelta, _isLong, _receiver);
    }

    /**
        * @param _account account to close position for
        * @param _collateralToken token to use as collateral
        * @param _indexToken token to use as index
        * @param _isLong true if long, false if short
        * @param _feeReceiver receiver of tokens
    */
    function liquidatePosition(address _account, address _collateralToken, address _indexToken, bool _isLong, address _feeReceiver) external override nonReentrant returns (uint256) {
        if (inPrivateLiquidationMode) {
            _validate(isLiquidator[msg.sender], 34);
        }
        updateCumulativeFundingRate(_collateralToken, _indexToken);
        bytes32 key = getPositionKey(_account, _collateralToken, _indexToken, _isLong);
        DataTypes.Position memory position = positions[key];
        _validate(position.size > 0, 35);
        (uint256 liquidationState, uint256 marginFees) = validateLiquidation(_account, _collateralToken, _indexToken, _isLong, false);
        _validate(liquidationState != 0, 36);
        if (liquidationState == 2) {
            return _decreasePosition(_account, _collateralToken, _indexToken, 0, position.size, _isLong, msg.sender);  // liq
        }
        uint256 feeTokens = usdToTokenMin(_collateralToken, marginFees);
        feeReserves[_collateralToken] = feeReserves[_collateralToken].add(feeTokens);
        emit Events.CollectMarginFees(_collateralToken, marginFees, feeTokens);
        _decreaseReservedAmount(_collateralToken, position.reserveAmount);

        if (_isLong) {
            _decreaseGuaranteedUsd(_collateralToken, position.size.sub(position.collateral));
            _decreasePoolAmount(_collateralToken, usdToTokenMin(_collateralToken, marginFees));
        }
        uint256 markPrice = _isLong ? getMinPrice(_indexToken) : getMaxPrice(_indexToken);
        emit Events.LiquidatePosition(key, _account, _collateralToken, _indexToken, _isLong, position.size, position.collateral, position.reserveAmount, position.realisedPnl, markPrice);
        if (!_isLong && marginFees < position.collateral) {
            uint256 remainingCollateral = position.collateral.sub(marginFees);
            _increasePoolAmount(_collateralToken, usdToTokenMin(_collateralToken, remainingCollateral));
        }
        if (!_isLong) {
            _decreaseGlobalShortSize(_indexToken, position.size);
        }
        delete positions[key];
        _decreasePoolAmount(_collateralToken, usdToTokenMin(_collateralToken, liquidationFeeUsd));
        _transferOut(_collateralToken, usdToTokenMin(_collateralToken, liquidationFeeUsd), _feeReceiver);
        return 0;
    }

    function updateCumulativeFundingRate(address _collateralToken, address _indexToken) public {
        bool shouldUpdate = vaultUtils.updateCumulativeFundingRate(_collateralToken, _indexToken);
        if (!shouldUpdate) {
            return;
        }
        if (lastFundingTimes[_collateralToken] == 0) {
            lastFundingTimes[_collateralToken] = block.timestamp.div(fundingInterval).mul(fundingInterval);
            return;
        }
        if (lastFundingTimes[_collateralToken].add(fundingInterval) > block.timestamp) {
            return;
        }
        uint256 fundingRate = getNextFundingRate(_collateralToken);
        cumulativeFundingRates[_collateralToken] = cumulativeFundingRates[_collateralToken].add(fundingRate);
        lastFundingTimes[_collateralToken] = block.timestamp.div(fundingInterval).mul(fundingInterval);
        emit Events.UpdateFundingRate(_collateralToken, cumulativeFundingRates[_collateralToken]);
    }

    function _decreasePosition(address _account, address _collateralToken, address _indexToken, uint256 _collateralDelta, uint256 _sizeDelta, bool _isLong, address _receiver) internal returns (uint256) {
        vaultUtils.validateDecreasePosition(_account, _collateralToken, _indexToken, _collateralDelta, _sizeDelta, _isLong, _receiver);
        updateCumulativeFundingRate(_collateralToken, _indexToken);
        bytes32 key = getPositionKey(_account, _collateralToken, _indexToken, _isLong);
        DataTypes.Position storage position = positions[key];
        _validate(position.size > 0, 31);
        _validate(position.size >= _sizeDelta, 32);
        _validate(position.collateral >= _collateralDelta, 33);

        uint256 collateral = position.collateral;
        {
            uint256 reserveDelta = position.reserveAmount.mul(_sizeDelta).div(position.size);
            position.reserveAmount = position.reserveAmount.sub(reserveDelta);
            _decreaseReservedAmount(_collateralToken, reserveDelta);
        }
        (uint256 usdOut, uint256 usdOutAfterFee) = _reduceCollateral(_account, _collateralToken, _indexToken, _collateralDelta, _sizeDelta, _isLong);
        if (position.size != _sizeDelta) {
            position.entryFundingRate = getEntryFundingRate(_collateralToken, _indexToken, _isLong);
            position.size = position.size.sub(_sizeDelta);
            _validatePosition(position.size, position.collateral);
            validateLiquidation(_account, _collateralToken, _indexToken, _isLong, true);
            if (_isLong) {
                _increaseGuaranteedUsd(_collateralToken, collateral.sub(position.collateral));
                _decreaseGuaranteedUsd(_collateralToken, _sizeDelta);
            }
            uint256 price = _isLong ? getMinPrice(_indexToken) : getMaxPrice(_indexToken);
            emit Events.DecreasePosition(key, _account, _collateralToken, _indexToken, _collateralDelta, _sizeDelta, _isLong, price, usdOut.sub(usdOutAfterFee));
            emit Events.UpdatePosition(key, position.size, position.collateral, position.averagePrice, position.entryFundingRate, position.reserveAmount, position.realisedPnl, price);
        } else {
            if (_isLong) {
                _increaseGuaranteedUsd(_collateralToken, collateral);
                _decreaseGuaranteedUsd(_collateralToken, _sizeDelta);
            }
            uint256 price = _isLong ? getMinPrice(_indexToken) : getMaxPrice(_indexToken);
            emit Events.DecreasePosition(key, _account, _collateralToken, _indexToken, _collateralDelta, _sizeDelta, _isLong, price, usdOut.sub(usdOutAfterFee));
            emit Events.ClosePosition(key, position.size, position.collateral, position.averagePrice, position.entryFundingRate, position.reserveAmount, position.realisedPnl);
            tokenPnl[_indexToken] += position.realisedPnl;
            emit Events.UpdateTokenPnl(_indexToken, tokenPnl[_indexToken]);
            delete positions[key];
        }
        if (!_isLong) {
            _decreaseGlobalShortSize(_indexToken, _sizeDelta);
        }
        if (usdOut > 0) {
            if (_isLong) {
                _decreasePoolAmount(_collateralToken, usdToTokenMin(_collateralToken, usdOut));
            }
            uint256 amountOutAfterFees = usdToTokenMin(_collateralToken, usdOutAfterFee);
            _transferOut(_collateralToken, amountOutAfterFees, _receiver);
            return amountOutAfterFees;
        }
        return 0;
    }
}
