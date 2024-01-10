// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./settings/ZkdlpManagerSettings.sol";

contract ZkdlpManager is ZkdlpManagerSettings {
    constructor(
        address _vault, address _zkusd,
        address _zkdlp, address _shortsTracker, uint256 _cooldownDuration) public {
        gov = msg.sender;
        vault = IVault(_vault);
        zkUsd = _zkusd;
        zkdlp = _zkdlp;
        shortsTracker = IShortsTracker(_shortsTracker);
        cooldownDuration = _cooldownDuration;
    }
//    function addLiquidity(address _token, uint256 _amount, uint256 _minZkusd, uint256 _minZkdlp) external override nonReentrant returns (uint256) {
//        if (inPrivateMode) {revert(Errors.ZKDLPMANAGER_ACTION_NOT_ENABLED);}
//        return _addLiquidity(msg.sender, msg.sender, _token, _amount, _minZkusd, _minZkdlp);
//    }

    /**
        * @param _fundingAccount The account that will fund the liquidity
        * @param _account The account that will receive the zkDLP tokens
        * @param _token The token to add liquidity for
        * @param _amount The amount of tokens to add liquidity for
        * @param _minZkusd The minimum amount of zkUSD to receive
        * @param _minZkdlp The minimum amount of zkDLP to receive
        * @return The amount of zkDLP tokens minted
    */
    function addLiquidityForAccount(
        address _fundingAccount, address _account,
        address _token, uint256 _amount,
        uint256 _minZkusd, uint256 _minZkdlp)
    external override nonReentrant returns (uint256) {
        _validateHandler();
        return _addLiquidity(_fundingAccount, _account, _token, _amount, _minZkusd, _minZkdlp);
    }

//    function removeLiquidity(
//        address _tokenOut, uint256 _zkdlpAmount,
//        uint256 _minOut, address _receiver)
//    external override nonReentrant returns (uint256) {
//        if (inPrivateMode) {revert(Errors.ZKDLPMANAGER_ACTION_NOT_ENABLED);}
//        return _removeLiquidity(msg.sender, _tokenOut, _zkdlpAmount, _minOut, _receiver);
//    }

    /**
        * @param _account The account that will receive the liquidity
        * @param _tokenOut The token to remove liquidity for
        * @param _zkdlpAmount The amount of zkDLP tokens to remove liquidity for
        * @param _minOut The minimum amount of tokens to receive
        * @param _receiver The account that will receive the tokens
        * @return The amount of tokens received
    */
    function removeLiquidityForAccount(
        address _account, address _tokenOut,
        uint256 _zkdlpAmount, uint256 _minOut, address _receiver)
    external override nonReentrant returns (uint256) {
        _validateHandler();
        return _removeLiquidity(_account, _tokenOut, _zkdlpAmount, _minOut, _receiver);
    }

    function _addLiquidity(
        address _fundingAccount, address _account,
        address _token, uint256 _amount,
        uint256 _minZkusd, uint256 _minZkdlp)
    internal returns (uint256) {
        require(_amount > 0, Errors.ZKDLPMANAGER_INVALID_AMOUNT);
        uint256 aumInZkusd = getAumInZkusd(true);
        uint256 zkdlpSupply = IERC20(zkdlp).totalSupply();
        IERC20(_token).safeTransferFrom(_fundingAccount, address(vault), _amount);
        uint256 zkusdAmount = vault.buyZKUSD(_token, address(this));
        require(zkusdAmount >= _minZkusd, Errors.ZKDLPMANAGER_INSUFFICIENT_ZKUSD_OUTPUT);
        uint256 mintAmount = aumInZkusd == 0 || zkdlpSupply == 0 ? zkusdAmount : zkusdAmount.mul(zkdlpSupply).div(aumInZkusd);
        require(mintAmount >= _minZkdlp, Errors.ZKDLPMANAGER_INSUFFICIENT_ZKDLP_OUTPUT);
        IMintable(zkdlp).mint(_account, mintAmount);
        lastAddedAt[_account] = block.timestamp;
        emit Events.AddLiquidity(_account, _token, _amount, aumInZkusd, zkdlpSupply, zkusdAmount, mintAmount);
        return mintAmount;
    }

    function _removeLiquidity(
        address _account, address _tokenOut,
        uint256 _zkdlpAmount, uint256 _minOut,
        address _receiver)
    internal returns (uint256) {
        require(_zkdlpAmount > 0, Errors.ZKDLPMANAGER_INVALID_ZKDLPAMOUNT);
        require(lastAddedAt[_account].add(cooldownDuration) <= block.timestamp, Errors.ZKDLPMANAGER_COOLDOWN_DURATION_NOT_YET_PASSED);
        uint256 aumInZkusd = getAumInZkusd(false);
        uint256 zkdlpSupply = IERC20(zkdlp).totalSupply();
        uint256 zkusdAmount = _zkdlpAmount.mul(aumInZkusd).div(zkdlpSupply);
        uint256 zkusdBalance = IERC20(zkUsd).balanceOf(address(this));
        if (zkusdAmount > zkusdBalance) {
            IZKUSD(zkUsd).mint(address(this), zkusdAmount.sub(zkusdBalance));
        }
        IMintable(zkdlp).burn(_account, _zkdlpAmount);
        IERC20(zkUsd).transfer(address(vault), zkusdAmount);
        uint256 amountOut = vault.sellZKUSD(_tokenOut, _receiver);
        require(amountOut >= _minOut, Errors.ZKDLPMANAGER_INSUFFICIENT_OUTPUT);
        emit Events.RemoveLiquidity(_account, _tokenOut, _zkdlpAmount, aumInZkusd, zkdlpSupply, zkusdAmount, amountOut);
        return amountOut;
    }

    function _validateHandler() internal view {
        require(isHandler[msg.sender], Errors.ZKDLPMANAGER_FORBIDDEN);
    }

    function getPrice(bool _maximise) external view returns (uint256) {
        uint256 supply = IERC20(zkdlp).totalSupply();
        if (supply == 0) return Constants.PRICE_PRECISION;

        uint256 aum = getAum(_maximise, false);
        return aum.mul(Constants.ZKDLP_PRECISION).div(supply);
    }

    function getAums() public view returns (uint256[] memory) {
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = getAum(true, false);
        amounts[1] = getAum(false, false);
        return amounts;
    }

    function getAumInZkusd(bool maximise) public override view returns (uint256) {
        uint256 aum = getAum(maximise, true);
        return aum.mul(10 ** Constants.ZKUSD_DECIMALS).div(Constants.PRICE_PRECISION);
    }

    function getAum(bool maximise, bool fresh) public view returns (uint256) {
        uint256 length = vault.allWhitelistedTokensLength();
        uint256 aum = aumAddition;
        uint256 shortProfits = 0;

        IVault _vault = vault;
        IVaultPriceFeed _priceFeed = IVaultPriceFeed(vault.priceFeed());

        for (uint256 i = 0; i < length; i++) {
            address token = vault.allWhitelistedTokens(i);
            if (!vault.whitelistedTokens(token))
                continue;

            uint256 price;
            if (vault.equityTokens(token) || vault.stableTokens(token))
                price = _priceFeed.getPrice(token, true, maximise, false);
            else
                price = _priceFeed.getPrice(token, true, maximise, fresh);

            uint256 poolAmount = _vault.poolAmounts(token);
            uint256 decimals = _vault.tokenDecimals(token);
            if (_vault.stableTokens(token)) {
                aum = aum.add(poolAmount.mul(price).div(10 ** decimals));
            } else {
                uint256 size = _vault.globalShortSizes(token);
                if (size > 0) {
                    (uint256 delta, bool hasProfit) = getGlobalShortDelta(token, price, size);
                    if (!hasProfit) {
                        aum = aum.add(delta);
                    } else {
                        shortProfits = shortProfits.add(delta);
                    }
                }
                aum = aum.add(_vault.guaranteedUsd(token));
                uint256 reservedAmount = _vault.reservedAmounts(token);
                aum = aum.add(poolAmount.sub(reservedAmount).mul(price).div(10 ** decimals));
            }
        }
        aum = shortProfits > aum ? 0 : aum.sub(shortProfits);
        return aumDeduction > aum ? 0 : aum.sub(aumDeduction);
    }

    function getGlobalShortDelta(address _token, uint256 _price, uint256 _size) public view returns (uint256, bool) {
        uint256 averagePrice = getGlobalShortAveragePrice(_token);
        uint256 priceDelta = averagePrice > _price ? averagePrice.sub(_price) : _price.sub(averagePrice);
        uint256 delta = _size.mul(priceDelta).div(averagePrice);
        return (delta, averagePrice > _price);
    }

    function getGlobalShortAveragePrice(address _token) public view returns (uint256) {
        IShortsTracker _shortsTracker = shortsTracker;
        if (address(_shortsTracker) == address(0) || !_shortsTracker.isGlobalShortDataReady()) {
            return vault.globalShortAveragePrices(_token);
        }
        uint256 _shortsTrackerAveragePriceWeight = shortsTrackerAveragePriceWeight;
        if (_shortsTrackerAveragePriceWeight == 0) {
            return vault.globalShortAveragePrices(_token);
        } else if (_shortsTrackerAveragePriceWeight == Constants.BASIS_POINTS_DIVISOR) {
            return _shortsTracker.globalShortAveragePrices(_token);
        }
        uint256 vaultAveragePrice = vault.globalShortAveragePrices(_token);
        uint256 shortsTrackerAveragePrice = _shortsTracker.globalShortAveragePrices(_token);
        return vaultAveragePrice.mul(Constants.BASIS_POINTS_DIVISOR.sub(_shortsTrackerAveragePriceWeight)).add(shortsTrackerAveragePrice.mul(_shortsTrackerAveragePriceWeight)).div(Constants.BASIS_POINTS_DIVISOR);
    }
}
