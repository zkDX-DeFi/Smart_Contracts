// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./BasePositionManager.sol";
import "./BasePriceConsumer.sol";
import "./settings/PositionManagerSettings.sol";

contract PositionManager is BasePositionManager, BasePriceConsumer, PositionManagerSettings {

    constructor(
        address _vault,
        address _router,
        address _shortsTracker,
        address _weth,
        uint256 _depositFee,
        address _orderBook
    ) public BasePositionManager(_vault, _router, _shortsTracker, _weth, _depositFee) BasePriceConsumer(_vault) {
        orderBook = _orderBook;
    }

    /**
        * @param _path path to swap
        * @param _indexToken index token
        * @param _amountIn amount of tokens to swap
        * @param _minOut minimum amount of tokens to receive
        * @param _sizeDelta size delta
        * @param _isLong is long if true, short if false
        * @param _price price of the index token
        * @param _updateData data to update
    */
    function increasePosition(
        address[] memory _path,
        address _indexToken,
        uint256 _amountIn,
        uint256 _minOut,
        uint256 _sizeDelta,
        bool _isLong,
        uint256 _price,
        bytes[] calldata _updateData
    ) external payable nonReentrant onlyPartnersOrOpened {
        require(_path[0] == zusd, "PositionManager: invalid path");
        uint256 _fee = _update(_updateData);
        _preChargeFee(msg.sender, _path[_path.length - 1], _indexToken, _isLong, _fee);

        require(_path.length == 1 || _path.length == 2, Errors.POSITIONMANAGER_INVALID_PATH_LENGTH);

        if (_amountIn > 0) {
            if (_path.length == 1) {
                IRouter(router).pluginTransfer(_path[0], msg.sender, address(this), _amountIn);
            } else {
                IRouter(router).pluginTransfer(_path[0], msg.sender, vault, _amountIn);
                _amountIn = _swap(_path, _minOut, address(this));
            }
            uint256 afterFeeAmount = _collectFees(msg.sender, _path, _amountIn, _indexToken, _isLong, _sizeDelta);
            IERC20(_path[_path.length - 1]).safeTransfer(vault, afterFeeAmount);
        }
        _increasePosition(msg.sender, _path[_path.length - 1], _indexToken, _sizeDelta, _isLong, _price);
    }

    /**
        * @param _path path to swap, one of the tokens must be the index token
        * @param _indexToken index token which is being sold
        * @param _collateralDelta collateral delta which is being withdrawn
        * @param _sizeDelta size delta which is being withdrawn
        * @param _isLong is long if true, short if false
        * @param _receiver receiver of the tokens
        * @param _price price of the index token
        * @param _minOut minimum amount of tokens to receive
        * @param _withdrawETH withdraw ETH if true, otherwise withdraw ERC20
        * @param _updateData data to update
    */
    function decreasePosition(
        address[] memory _path,
        address _indexToken,
        uint256 _collateralDelta,
        uint256 _sizeDelta,
        bool _isLong,
        address _receiver,
        uint256 _price,
        uint256 _minOut,
        bool _withdrawETH,
        bytes[] calldata _updateData
    ) external payable nonReentrant onlyPartnersOrOpened {
        require(_path.length == 1 || _path.length == 2, Errors.POSITIONMANAGER_INVALID_PATH_LENGTH);
        require(!_withdrawETH, "PositionManager: withdraw ETH not supported for now");
        require(_path[_path.length - 1] == zusd, "PositionManager: invalid path");
        _update(_updateData);
        // if (_withdrawETH) require(_path[_path.length - 1] == weth, Errors.POSITIONMANAGER_INVALID_PATH);

        uint256 amountOut = _decreasePosition(msg.sender, _path[0], _indexToken, _collateralDelta, _sizeDelta, _isLong, address(this), _price);
        _transferOut(amountOut, _path, _receiver, _minOut, _withdrawETH);
    }

    function _transferOut(
        uint256 amountOut,
        address[] memory _path,
        address _receiver,
        uint256 _minOut,
        bool _withdrawETH
    ) private {
        if (amountOut > 0) {
            if (_path.length > 1) {
                IERC20(_path[0]).safeTransfer(vault, amountOut);
                amountOut = _swap(_path, _minOut, address(this));
            }
            if (_withdrawETH) {
                _transferOutETH(amountOut, payable(_receiver));
            } else {
                IERC20(_path[_path.length - 1]).safeTransfer(_receiver, amountOut);
            }
        }
    }

    /**
        * @param _account account to liquidate
        * @param _collateralToken collateral token
        * @param _indexToken index token
        * @param _isLong is long if true, short if false
        * @param _feeReceiver receiver of the fee
        * @param _updateData data to update
    */
    function liquidatePosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        address payable _feeReceiver,
        bytes[] calldata _updateData
    ) external payable nonReentrant {
        require(isLiquidator[msg.sender] || msg.sender == _account, Errors.POSITIONMANAGER_FORBIDDEN);
        _update(_updateData);
        address _vault = vault;
        address timelock = IVault(_vault).gov();
        (uint256 size, , , , , , ,) = IVault(vault).getPosition(_account, _collateralToken, _indexToken, _isLong);
        uint256 markPrice = _isLong ? IVault(_vault).getMinPrice(_indexToken) : IVault(_vault).getMaxPrice(_indexToken);

        IShortsTracker(shortsTracker).updateGlobalShortData(_account, _collateralToken, _indexToken, _isLong, size, markPrice, false);
        ITimelock(timelock).enableLeverage(_vault);
        uint256 _amount = IVault(_vault).liquidatePosition(_account, _collateralToken, _indexToken, _isLong, _feeReceiver);
        // liq zusd out
        if (_collateralToken == zusd) {
            IERC20(_collateralToken).safeTransfer(_account, _amount);
        } else {
            IERC20(_collateralToken).safeTransfer(vault, _amount);
            address[] memory _path = new address[](2);
            _path[0] = _collateralToken;
            _path[1] = zusd;
            _swap(_path, 0, _account);
        }
        ITimelock(timelock).disableLeverage(_vault);
        _payLiquidator(_account, _collateralToken, _indexToken, _isLong, _feeReceiver);
    }

    /**
        * @param _account account to liquidate
        * @param _orderIndex order index which is being liquidated
        * @param _feeReceiver receiver of the fee
        * @param _updateData data to update which is being liquidated
    */
    function executeIncreaseOrder(
        address _account,
        uint256 _orderIndex,
        address payable _feeReceiver,
        bytes[] calldata _updateData
    ) external payable onlyOrderKeeper {
        _update(_updateData);
        _validateIncreaseOrder(_account, _orderIndex);

        address _vault = vault;
        address timelock = IVault(_vault).gov();

        (
        /*address purchaseToken*/,
        /*uint256 purchaseTokenAmount*/,
            address collateralToken,
            address indexToken,
            uint256 sizeDelta,
            bool isLong,
        /*uint256 triggerPrice*/,
        /*bool triggerAboveThreshold*/,
        /*uint256 executionFee*/
        ) = IOrderBook(orderBook).getIncreaseOrder(_account, _orderIndex);

        uint256 markPrice = isLong ? IVault(_vault).getMaxPrice(indexToken) : IVault(_vault).getMinPrice(indexToken);
        IShortsTracker(shortsTracker).updateGlobalShortData(_account, collateralToken, indexToken, isLong, sizeDelta, markPrice, true);

        ITimelock(timelock).enableLeverage(_vault);
        IOrderBook(orderBook).executeIncreaseOrder(_account, _orderIndex, _feeReceiver);
        ITimelock(timelock).disableLeverage(_vault);

    }

    /**
        * @param _account account to liquidate
        * @param _orderIndex order index which is being liquidated
        * @param _feeReceiver receiver of the fee
        * @param _updateData data to update which is being liquidated
    */
    function executeDecreaseOrder(
        address _account,
        uint256 _orderIndex,
        address payable _feeReceiver,
        bytes[] calldata _updateData
    ) external payable onlyOrderKeeper {
        _update(_updateData);
        address _vault = vault;
        address timelock = IVault(_vault).gov();

        (
            address collateralToken,
        /*uint256 collateralDelta*/,
            address indexToken,
            uint256 sizeDelta,
            bool isLong,
        /*uint256 triggerPrice*/,
        /*bool triggerAboveThreshold*/,
        /*uint256 executionFee*/
        ) = IOrderBook(orderBook).getDecreaseOrder(_account, _orderIndex);

        uint256 markPrice = isLong ? IVault(_vault).getMinPrice(indexToken) : IVault(_vault).getMaxPrice(indexToken);
        IShortsTracker(shortsTracker).updateGlobalShortData(_account, collateralToken, indexToken, isLong, sizeDelta, markPrice, false);

        ITimelock(timelock).enableLeverage(_vault);
        IOrderBook(orderBook).executeDecreaseOrder(_account, _orderIndex, _feeReceiver);
        ITimelock(timelock).disableLeverage(_vault);

    }

    function _validateIncreaseOrder(address _account, uint256 _orderIndex) internal view {
        (
            address _purchaseToken,
            uint256 _purchaseTokenAmount,
            address _collateralToken,
            address _indexToken,
            uint256 _sizeDelta,
            bool _isLong,
            , // triggerPrice
            , // triggerAboveThreshold
        // executionFee
        ) = IOrderBook(orderBook).getIncreaseOrder(_account, _orderIndex);

        _validateMaxGlobalSize(_indexToken, _isLong, _sizeDelta);

        if (!shouldValidateIncreaseOrder) {return;}

        // shorts are okay
        if (!_isLong) {return;}

        // if the position size is not increasing, this is a collateral deposit
        require(_sizeDelta > 0, "PositionManager: long deposit");

        IVault _vault = IVault(vault);
        (uint256 size, uint256 collateral, , , , , ,) = _vault.getPosition(_account, _collateralToken, _indexToken, _isLong);

        // if there is no existing position, do not charge a fee
        if (size == 0) {return;}

        uint256 nextSize = size.add(_sizeDelta);
        uint256 collateralDelta = _vault.tokenToUsdMin(_purchaseToken, _purchaseTokenAmount);
        uint256 nextCollateral = collateral.add(collateralDelta);

        uint256 prevLeverage = size.mul(BASIS_POINTS_DIVISOR).div(collateral);
        // allow for a maximum of a increasePositionBufferBps decrease since there might be some swap fees taken from the collateral
        uint256 nextLeverageWithBuffer = nextSize.mul(BASIS_POINTS_DIVISOR + increasePositionBufferBps).div(nextCollateral);

        require(nextLeverageWithBuffer >= prevLeverage, "PositionManager: long leverage decrease");
    }
}
