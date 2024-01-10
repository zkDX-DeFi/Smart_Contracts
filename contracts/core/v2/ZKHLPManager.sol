// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "./ZKHLPManagerSettings.sol";

contract ZKHLPManager is ZKHLPManagerSettings{
    constructor (address _vault, address _zkhlp, address _zkusd, uint256 _cooldownDuration) public {
        gov = msg.sender;
        vault = IVault(_vault);
        zkhlp = _zkhlp;
        zkusd = _zkusd;
        cooldownDuration = _cooldownDuration;
    }

    function addLiquidityForAccount(
        address _fundingAccount, address _account,
        address _token, uint256 _amount)
    external returns (uint256) {
        _validateHandler();
        return _addLiquidity(_fundingAccount, _account, _token, _amount);
    }

    function removeLiquidityForAccount(
        address _account, address _tokenOut, uint256 _zkhlpAmount, address _receiver
    ) external returns (uint256){
        _validateHandler();
        return _removeLiquidity(_account, _tokenOut, _zkhlpAmount, _receiver);
    }

    function _validateHandler() internal view {
        require(isHandler[msg.sender], Errors.ZKDLPMANAGER_FORBIDDEN);
    }

    function _addLiquidity(
        address _fundingAccount, address _account,
        address _token, uint256 _amount)
    internal returns(uint256) {
        require(_amount > 0, Errors.ZKDLPMANAGER_INVALID_AMOUNT);

        IERC20(_token).safeTransferFrom(_fundingAccount, address(vault), _amount);
        uint256 mintAmount = vault.buyZKUSD(_token, address(this));

        IMintable(zkhlp).mint(_account, mintAmount);
        return mintAmount;
    }

    function _removeLiquidity(
        address _account, address _tokenOut,
        uint256 _zkhlpAmount, address _receiver
    ) internal returns(uint256) {
        require(_zkhlpAmount > 0, Errors.ZKDLPMANAGER_INVALID_ZKDLPAMOUNT);

        IMintable(zkhlp).burn(_account, _zkhlpAmount);
        IERC20(zkusd).transfer(address(vault), _zkhlpAmount);
        uint256 amountOut = vault.sellZKUSD(_tokenOut, _receiver);
        return amountOut;
    }
}
