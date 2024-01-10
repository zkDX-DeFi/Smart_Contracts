// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/settings/RewardRouterV2Settings.sol";
import "../core/BasePriceConsumer.sol";
contract RewardRouterV2 is RewardRouterV2Settings, BasePriceConsumer {

    constructor(address _vault) public BasePriceConsumer(_vault) {}

    receive() external payable {
        require(msg.sender == weth, Errors.ROUTER_INVALID_SENDER);
    }

    /**
        * @param _token address of the token to be staked
        * @param _amount amount of the token to be staked
        * @param _minZkUSD minimum amount of zkUSD to be minted
        * @param _minZkdlp minimum amount of zkdlp to be minted
        * @param _updateData array of bytes containing the data to be passed to the update function
        * @return zkdlpAmount amount of zkdlp minted
    */
    function mintAndStakeZkdlp(
        address _token,
        uint256 _amount,
        uint256 _minZkUSD,
        uint256 _minZkdlp,
        bytes[] calldata _updateData
    ) external payable nonReentrant returns (uint256 zkdlpAmount) {
        _update(_updateData);
        require(_amount > 0, Errors.REWARDROUTER_INVALID_AMOUNT);
        zkdlpAmount = IZkdlpManager(zkdlpManager).addLiquidityForAccount(msg.sender, msg.sender, _token, _amount, _minZkUSD, _minZkdlp);
    }

    /**
        * @param _minZkusd minimum amount of zkUSD to be minted
        * @param _minZkdlp minimum amount of zkdlp to be minted
        * @param _updateData array of bytes containing the data to be passed to the update function
        * @return zkdlpAmount amount of zkdlp minted
    */
    function mintAndStakeZkdlpETH(
        uint256 _minZkusd,
        uint256 _minZkdlp,
        bytes[] calldata _updateData
    ) external payable nonReentrant returns (uint256 zkdlpAmount) {
        uint256 _fee = _update(_updateData);
        uint256 _amountIn = msg.value.sub(_fee);
        require(_amountIn > 0, Errors.REWARDROUTER_INVALID_MSG_VALUE);

        IWETH(weth).deposit{value : _amountIn}();
        IERC20(weth).approve(zkdlpManager, _amountIn);

        zkdlpAmount = IZkdlpManager(zkdlpManager).addLiquidityForAccount(address(this), msg.sender, weth, _amountIn, _minZkusd, _minZkdlp);
    }

    /**
        * @param _tokenOut address of the token to be unstaked
        * @param _zkdlpAmount amount of zkdlp to be unstaked
        * @param _minOut minimum amount of token to be received
        * @param _receiver address of the receiver
        * @param _updateData array of bytes containing the data to be passed to the update function
        * @return amountOut amount of token received
    */
    function unstakeAndRedeemZkdlp(
        address _tokenOut,
        uint256 _zkdlpAmount,
        uint256 _minOut,
        address _receiver,
        bytes[] calldata _updateData
    ) external payable nonReentrant returns (uint256 amountOut) {
        _update(_updateData);
        require(_zkdlpAmount > 0, Errors.REWARDROUTER_INVALID_ZKUSDAMOUNT);

        amountOut = IZkdlpManager(zkdlpManager).removeLiquidityForAccount(msg.sender, _tokenOut, _zkdlpAmount, _minOut, _receiver);
        emit Events.UnstakeZkdlp(msg.sender, _zkdlpAmount);
    }

    /**
        * @param _zkdlpAmount amount of zkdlp to be unstaked
        * @param _minOut minimum amount of ETH to be received
        * @param _receiver address of the receiver
        * @param _updateData array of bytes containing the data to be passed to the update function
        * @return amountOut amount of ETH received
    */
    function unstakeAndRedeemZkdlpETH(
        uint256 _zkdlpAmount,
        uint256 _minOut,
        address payable _receiver,
        bytes[] calldata _updateData
    ) external payable nonReentrant returns (uint256 amountOut) {
        _update(_updateData);
        require(_zkdlpAmount > 0, Errors.REWARDROUTER_INVALID_ZKUSDAMOUNT);

        amountOut = IZkdlpManager(zkdlpManager).removeLiquidityForAccount(msg.sender, weth, _zkdlpAmount, _minOut, address(this));
        IWETH(weth).withdraw(amountOut);
        _receiver.sendValue(amountOut);
        emit Events.UnstakeZkdlp(msg.sender, _zkdlpAmount);
    }
}
