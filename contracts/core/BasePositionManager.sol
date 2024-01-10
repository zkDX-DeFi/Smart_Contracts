// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./settings/BasePositionManagerSettings.sol";

contract BasePositionManager is BasePositionManagerSettings {

    constructor(address _vault, address _router, address _shortsTracker, address _weth, uint256 _depositFee) public {
        vault = _vault;
        router = _router;
        weth = _weth;
        depositFee = _depositFee;
        shortsTracker = _shortsTracker;
        admin = msg.sender;
    }

    function withdrawFees(address _token, address _receiver) external onlyAdmin {
        uint256 amount = feeReserves[_token];
        if (amount == 0) {return;}
        feeReserves[_token] = 0;
        IERC20(_token).safeTransfer(_receiver, amount);
        emit Events.WithdrawFees(_token, _receiver, amount);
    }

    function approve(address _token, address _spender, uint256 _amount) external onlyGov {
        IERC20(_token).approve(_spender, _amount);
    }

    function sendValue(address payable _receiver, uint256 _amount) external onlyGov {
        _receiver.sendValue(_amount);
    }

    function _preChargeFee(address _account, address _collateralToken, address _indexToken, bool _isLong, uint256 _paid) internal {
        if (minLiquidationFee == 0)
            return;
        (bool exist, bytes32 key) = IVault(vault).isPositionExist(_account, _collateralToken, _indexToken, _isLong);
        if (!exist) {
            uint256 liqFee = msg.value - _paid;
            require(liqFee >= minLiquidationFee, Errors.POSITIONMANAGER_INSUFFICIENT_FEE);
            liquidationFees[key] = liqFee;
            _transferInETH(liqFee);
        }
    }

    function _payLiquidator(address _account, address _collateralToken, address _indexToken, bool _isLong, address payable _feeReceiver) internal {
        (bool exist, bytes32 key) = IVault(vault).isPositionExist(_account, _collateralToken, _indexToken, _isLong);
        uint256 _payAmount = liquidationFees[key];
        if (!exist && _payAmount > 0) {
            liquidationFees[key] = 0;
            _transferOutETH(_payAmount, _feeReceiver);
        }
    }
}
