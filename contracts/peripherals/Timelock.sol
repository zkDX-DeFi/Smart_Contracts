// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../core/storage/TimelockStorage.sol";

contract Timelock is TimelockStorage {

    constructor(address _admin, uint256 _buffer, address _tokenManager, address _mintReceiver, address _zkdlpManager, uint256 _maxTokenSupply, uint256 _marginFeeBasisPoints, uint256 _maxMarginFeeBasisPoints) public {
        require(_buffer <= MAX_BUFFER, Errors.TIMELOCK_INVALID_BUFFER);
        admin = _admin;
        buffer = _buffer;
        tokenManager = _tokenManager;
        mintReceiver = _mintReceiver;
        zkdlpManager = _zkdlpManager;
        maxTokenSupply = _maxTokenSupply;

        marginFeeBasisPoints = _marginFeeBasisPoints;
        maxMarginFeeBasisPoints = _maxMarginFeeBasisPoints;
    }
    /* onlyAdmin */
    function setAdmin(address _admin) external override onlyAdmin {
        admin = _admin;
    }

    function setZkdlpManager(address _zkdlpManager) external onlyAdmin{
        zkdlpManager = _zkdlpManager;
    }

    /* admin */
    function setExternalAdmin(address _target, address _admin) external onlyAdmin {
        require(_target != address(this), Errors.Timelock_Invalid_Target);
        IAdmin(_target).setAdmin(_admin);
    }

    function setContractHandler(address _handler, bool _isActive) external onlyAdmin {
        isHandler[_handler] = _isActive;
    }

    function setKeeper(address _keeper, bool _isActive) external onlyAdmin {
        isKeeper[_keeper] = _isActive;
    }

    function setBuffer(uint256 _buffer) external onlyAdmin {
        require(_buffer <= MAX_BUFFER, Errors.Timelock_Invalid_Buffer);
        require(_buffer > buffer, Errors.Timelock_Buffer_Cannot_Be_Decreased);
        buffer = _buffer;
    }

    function setMaxLeverage(address _vault, uint256 _maxLeverage) external onlyAdmin {
        IVault(_vault).setMaxLeverage(_maxLeverage);
    }

    function setMaxGlobalShortSize(address _vault, address _token, uint256 _amount) external onlyAdmin {
        IVault(_vault).setMaxGlobalShortSize(_token, _amount);
    }

    function setVaultUtils(address _vault, IVaultUtils _vaultUtils) external onlyAdmin {
        IVault(_vault).setVaultUtils(_vaultUtils);
    }

    function setMaxGasPrice(address _vault, uint256 _maxGasPrice) external onlyAdmin {
        require(_maxGasPrice > 5000000000, Errors.TIMELOCK_INVALID_MAXGASPRICE);
        IVault(_vault).setMaxGasPrice(_maxGasPrice);
    }

    function setInPrivateLiquidationMode(address _vault, bool _inPrivateLiquidationMode) external onlyAdmin {
        IVault(_vault).setInPrivateLiquidationMode(_inPrivateLiquidationMode);
    }

    function setLiquidator(address _vault, address _liquidator, bool _isActive) external onlyAdmin {
        IVault(_vault).setLiquidator(_liquidator, _isActive);
    }

    function setInPrivateTransferMode(address _token, bool _inPrivateTransferMode) external onlyAdmin {
        IBaseToken(_token).setInPrivateTransferMode(_inPrivateTransferMode);
    }

    function setGov(address _target, address _gov) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("setGov", _target, _gov));
        _validateAction(action);
        _clearAction(action);
        ITimelockTarget(_target).setGov(_gov);
    }

    function setHandler(address _target, address _handler, bool _isActive) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("setHandler", _target, _handler, _isActive));
        _validateAction(action);
        _clearAction(action);
        IHandlerTarget(_target).setHandler(_handler, _isActive);
    }

    function setPriceFeed(address _vault, address _priceFeed) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("setPriceFeed", _vault, _priceFeed));
        _validateAction(action);
        _clearAction(action);
        IVault(_vault).setPriceFeed(_priceFeed);
    }

    function removeAdmin(address _token, address _account) external onlyAdmin {
        IYieldToken(_token).removeAdmin(_account);
    }

    function withdrawFees(address _vault, address _token, address _receiver) external onlyAdmin {
        IVault(_vault).withdrawFees(_token, _receiver);
    }

    function transferIn(address _sender, address _token, uint256 _amount) external onlyAdmin {
        IERC20(_token).transferFrom(_sender, address(this), _amount);
    }

    function signalApprove(address _token, address _spender, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("approve", _token, _spender, _amount));
        _setPendingAction(action);
        emit Events.SignalApprove(_token, _spender, _amount, action);
    }

    function approve(address _token, address _spender, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("approve", _token, _spender, _amount));
        _validateAction(action);
        _clearAction(action);
        IERC20(_token).approve(_spender, _amount);
    }

    function signalWithdrawToken(address _target, address _token, address _receiver, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("withdrawToken", _target, _token, _receiver, _amount));
        _setPendingAction(action);
        emit Events.SignalWithdrawToken(_target, _token, _receiver, _amount, action);
    }

    function withdrawToken(address _target, address _token, address _receiver, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("withdrawToken", _target, _token, _receiver, _amount));
        _validateAction(action);
        _clearAction(action);
        IBaseToken(_target).withdrawToken(_token, _receiver, _amount);
    }

    function signalMint(address _token, address _receiver, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("mint", _token, _receiver, _amount));
        _setPendingAction(action);
        emit Events.SignalMint(_token, _receiver, _amount, action);
    }

    function processMint(address _token, address _receiver, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("mint", _token, _receiver, _amount));
        _validateAction(action);
        _clearAction(action);
        _mint(_token, _receiver, _amount);
    }

    function signalSetGov(address _target, address _gov) external override onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("setGov", _target, _gov));
        _setPendingAction(action);
        emit Events.SignalSetGov(_target, _gov, action);
    }

    function signalSetHandler(address _target, address _handler, bool _isActive) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("setHandler", _target, _handler, _isActive));
        _setPendingAction(action);
        emit Events.SignalSetHandler(_target, _handler, _isActive, action);
    }

    function signalSetPriceFeed(address _vault, address _priceFeed) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("setPriceFeed", _vault, _priceFeed));
        _setPendingAction(action);
        emit Events.SignalSetPriceFeed(_vault, _priceFeed, action);
    }

    function signalRedeemZkusd(address _vault, address _token, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("redeemZkusd", _vault, _token, _amount));
        _setPendingAction(action);
        emit Events.SignalRedeemZkusd(_vault, _token, _amount);
    }

    function redeemZkusd(address _vault, address _token, uint256 _amount) external onlyAdmin {
        bytes32 action = keccak256(abi.encodePacked("redeemZkusd", _vault, _token, _amount));
        _validateAction(action);
        _clearAction(action);
        address zkusd = IVault(_vault).zkusd();
        IVault(_vault).setManager(address(this), true);
        IZKUSD(zkusd).addVault(address(this));
        IZKUSD(zkusd).mint(address(this), _amount);
        IERC20(zkusd).transfer(address(_vault), _amount);
        IVault(_vault).sellZKUSD(_token, mintReceiver);
        IVault(_vault).setManager(address(this), false);
        IZKUSD(zkusd).removeVault(address(this));
    }

    function cancelAction(bytes32 _action) external onlyAdmin {
        _clearAction(_action);
    }

    /* onlyKeeperAndAbove */
    function setFundingRate(address _vault, uint256 _fundingInterval, uint256 _fundingRateFactor, uint256 _stableFundingRateFactor) external onlyKeeperAndAbove {
        require(_fundingRateFactor <= MAX_FUNDING_RATE_FACTOR, Errors.Timelock_invalid_fundingRateFactor);
        require(_stableFundingRateFactor <= MAX_FUNDING_RATE_FACTOR, Errors.Timelock_invalid_stableFundingRateFactor);
        IVault(_vault).setFundingRate(_fundingInterval, _fundingRateFactor, _stableFundingRateFactor);
    }

    function setSwapFees(
        address _vault, uint256 _taxBasisPoints, uint256 _stableTaxBasisPoints, uint256 _mintBurnFeeBasisPoints,
        uint256 _swapFeeBasisPoints, uint256 _stableSwapFeeBasisPoints) external onlyKeeperAndAbove {
        IVault vault = IVault(_vault);
        vault.setFees(
            _taxBasisPoints,
            _stableTaxBasisPoints,
            _mintBurnFeeBasisPoints,
            _swapFeeBasisPoints,
            _stableSwapFeeBasisPoints,
            maxMarginFeeBasisPoints,
            vault.liquidationFeeUsd(),
            vault.minProfitTime(),
            vault.hasDynamicFees()
        );
    }

    function setFees(
        address _vault, uint256 _taxBasisPoints, uint256 _stableTaxBasisPoints,
        uint256 _mintBurnFeeBasisPoints, uint256 _swapFeeBasisPoints, uint256 _stableSwapFeeBasisPoints,
        uint256 _marginFeeBasisPoints, uint256 _liquidationFeeUsd, uint256 _minProfitTime, bool _hasDynamicFees) external onlyKeeperAndAbove {
        marginFeeBasisPoints = _marginFeeBasisPoints;
        IVault(_vault).setFees(
            _taxBasisPoints,
            _stableTaxBasisPoints,
            _mintBurnFeeBasisPoints,
            _swapFeeBasisPoints,
            _stableSwapFeeBasisPoints,
            maxMarginFeeBasisPoints,
            _liquidationFeeUsd,
            _minProfitTime,
            _hasDynamicFees
        );
    }

    function setMinProfitTime(address _vault, uint256 _minProfitTime) external onlyKeeperAndAbove {
        IVault(_vault).setMinProfitTime(_minProfitTime);
    }

    function setTokenConfig(
        address _vault,
        address _token,
        uint256 _tokenDecimals,
        uint256 _tokenWeight,
        uint256 _minProfitBps,
        uint256 _maxZkusdAmount,
        bool _isStable,
        bool _isShortable,
        bool _isEquity
    ) external onlyKeeperAndAbove {
        IVault(_vault).setTokenConfig(
            _token,
            _tokenDecimals,
            _tokenWeight,
            _minProfitBps,
            _maxZkusdAmount,
            _isStable,
            _isShortable,
            _isEquity
        );
    }

    function setAllowStableEquity(address _vault, bool _allowStaleEquityPrice) external onlyKeeperAndAbove {
        IVault(_vault).setAllowStableEquity(_allowStaleEquityPrice);
    }

    function setBufferAmounts(address _vault, address[] memory _tokens, uint256[] memory _bufferAmounts) external onlyKeeperAndAbove {
        for (uint256 i = 0; i < _tokens.length; i++) {
            IVault(_vault).setBufferAmount(_tokens[i], _bufferAmounts[i]);
        }
    }

    function setZkusdAmounts(address _vault, address[] memory _tokens, uint256[] memory _zkusdAmounts) external onlyKeeperAndAbove {
        for (uint256 i = 0; i < _tokens.length; i++) {
            IVault(_vault).setZkusdAmount(_tokens[i], _zkusdAmounts[i]);
        }
    }

    function setIsSwapEnabled(address _vault, bool _isSwapEnabled) external onlyKeeperAndAbove {
        IVault(_vault).setIsSwapEnabled(_isSwapEnabled);
    }

    function updateZkusdSupply(uint256 zkusdAmount) external onlyKeeperAndAbove {
        address zkusd = IZkdlpManager(zkdlpManager).zkUsd();
        uint256 balance = IERC20(zkusd).balanceOf(zkdlpManager);
        IZKUSD(zkusd).addVault(address(this));
        if (zkusdAmount > balance) {
            uint256 mintAmount = zkusdAmount.sub(balance);
            IZKUSD(zkusd).mint(zkdlpManager, mintAmount);
        } else {
            uint256 burnAmount = balance.sub(zkusdAmount);
            IZKUSD(zkusd).burn(zkdlpManager, burnAmount);
        }
        IZKUSD(zkusd).removeVault(address(this));
    }



    function batchWithdrawFees(address _vault, address[] memory _tokens) external onlyKeeperAndAbove {
        for (uint256 i = 0; i < _tokens.length; i++) {
            IVault(_vault).withdrawFees(_tokens[i], admin);
        }
    }

//    function batchSetBonusRewards(address _vester, address[] memory _accounts, uint256[] memory _amounts) external onlyKeeperAndAbove {
//        require(_accounts.length == _amounts.length, Errors.TIMELOCK_INVALID_LENGTHS);
//        if (!IHandlerTarget(_vester).isHandler(address(this))) {
//            IHandlerTarget(_vester).setHandler(address(this), true);
//        }
//        for (uint256 i = 0; i < _accounts.length; i++) {
//            address account = _accounts[i];
//            uint256 amount = _amounts[i];
//            IVester(_vester).setBonusRewards(account, amount);
//        }
//    }

    /* onlyHandlerAndAbove */
    function setShouldToggleIsLeverageEnabled(bool _shouldToggleIsLeverageEnabled) external onlyHandlerAndAbove {
        shouldToggleIsLeverageEnabled = _shouldToggleIsLeverageEnabled;
    }

    function setMarginFeeBasisPoints(uint256 _marginFeeBasisPoints, uint256 _maxMarginFeeBasisPoints) external onlyHandlerAndAbove {
        marginFeeBasisPoints = _marginFeeBasisPoints;
        maxMarginFeeBasisPoints = _maxMarginFeeBasisPoints;
    }

    function setIsLeverageEnabled(address _vault, bool _isLeverageEnabled) external override onlyHandlerAndAbove {
        IVault(_vault).setIsLeverageEnabled(_isLeverageEnabled);
    }

    function setManager(address _vault, address _manager, bool _isManager) external onlyHandlerAndAbove {
        IVault(_vault).setManager(_manager, _isManager);
    }

    function setZusd(address _vault, address _zusd) external onlyHandlerAndAbove {
        IVault(_vault).setZusd(_zusd);
    }

    function enableLeverage(address _vault) external override onlyHandlerAndAbove {
        IVault vault = IVault(_vault);
        if (shouldToggleIsLeverageEnabled) {
            vault.setIsLeverageEnabled(true);
        }
        vault.setFees(
            vault.taxBasisPoints(),
            vault.stableTaxBasisPoints(),
            vault.mintBurnFeeBasisPoints(),
            vault.swapFeeBasisPoints(),
            vault.stableSwapFeeBasisPoints(),
            marginFeeBasisPoints,
            vault.liquidationFeeUsd(),
            vault.minProfitTime(),
            vault.hasDynamicFees()
        );
    }

    function disableLeverage(address _vault) external override onlyHandlerAndAbove {
        IVault vault = IVault(_vault);
        if (shouldToggleIsLeverageEnabled) {
            vault.setIsLeverageEnabled(false);
        }
        vault.setFees(
            vault.taxBasisPoints(),
            vault.stableTaxBasisPoints(),
            vault.mintBurnFeeBasisPoints(),
            vault.swapFeeBasisPoints(),
            vault.stableSwapFeeBasisPoints(),
            maxMarginFeeBasisPoints, // marginFeeBasisPoints
            vault.liquidationFeeUsd(),
            vault.minProfitTime(),
            vault.hasDynamicFees()
        );
    }


    /* private */
    function _mint(address _token, address _receiver, uint256 _amount) private {
        IMintable mintable = IMintable(_token);
        if (!mintable.isMinter(address(this))) {
            mintable.setMinter(address(this), true);
        }
        mintable.mint(_receiver, _amount);
        require(IERC20(_token).totalSupply() <= maxTokenSupply, Errors.TIMELOCK_MAXTOKENSUPPLY_EXCEEDED);
    }

    function _setPendingAction(bytes32 _action) private {
        require(pendingActions[_action] == 0, Errors.TIMELOCK_ACTION_ALREADY_SIGNALLED);
        pendingActions[_action] = block.timestamp.add(buffer);
        emit Events.SignalPendingAction(_action);
    }

    function _validateAction(bytes32 _action) private view {
        require(pendingActions[_action] != 0, Errors.TIMELOCK_ACTION_NOT_SIGNALLED);
        require(pendingActions[_action] < block.timestamp, Errors.TIMELOCK_ACTION_TIME_NOT_YET_PASSED);
    }

    function _clearAction(bytes32 _action) private {
        require(pendingActions[_action] != 0, Errors.TIMELOCK_INVALID_ACTION);
        delete pendingActions[_action];
        emit Events.ClearAction(_action);
    }
}
