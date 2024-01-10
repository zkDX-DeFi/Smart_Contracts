### HIGH-1
#### Governance can withdraw deposit tokens.

`BasePositionManager.sol`: `withdrawFees` function
The governance account can withdraw deposit tokens from the contract.
As a result, incase the private key of the governance account is exposed, the funds can be stolen.
That's why it is recommended to validate that the provided token is a deposit token.
If the provided token is not a deposit token, the transaction should revert.

#### Recommendation:
Validate that the provided token is a deposit token.

#### Suggestions:
```solidity
    function withdrawFees(address _token, address _receiver) external override returns (uint256) {
        _onlyGov();
        require(_isDepositToken(_token), Errors.POSITIONMANAGER_INVALID_TOKEN);
        uint256 amount = feeReserves[_token];
        if (amount == 0) {return 0;}
        feeReserves[_token] = 0;
        _transferOut(_token, amount, _receiver);
        return amount;
    }
```

### HIGH-2
#### Handlers can unstake, claim rewards, and transfer rewards to the handler contract.

`ZkdlpManager.sol`: `removeLiquidityForAccount` function

Accounts that have the `handler` role can unstake, claim rewards, and transfer rewards to the handler contract.
As a result, if the handler account is compromised, the funds can be stolen.

#### Recommendation:
Add the validateHandler modifier to the `removeLiquidityForAccount` function.

#### Suggestions:
```solidity
    function removeLiquidityForAccount(
        address _account, address _tokenOut,
        uint256 _zkdlpAmount, uint256 _minOut, address _receiver)
    external override nonReentrant returns (uint256) {
        _validateHandler();
        return _removeLiquidity(_account, _tokenOut, _zkdlpAmount, _minOut, _receiver);
    }
```

### HIGH-3
#### ETH might get stuck on the contract
`BasePositionManagerSettings.sol`: `_transferOutETH` function

The `_transferOutETH` function is used to transfer ETH from the contract.
ETH is transferred to a `msg.sender`musing the `.send()` function. 
However, the usage of the `.send()` function is not recommended since it does not revert in case the transfer fails.
Thus, it is recommended to use the `.call()` function instead and custom gas units value which is enough to perform the transfer.
And check the result of the transfer to ensure that the transfer was successful.
If the transfer was not successful, the transaction should revert.

#### Recommendation:
Use the `.call()` function instead of the `.send()` function.

#### Suggestions:
```solidity
    function _transferOutETH(uint256 _amount, address _receiver) internal {
        (bool success, ) = _receiver.call{value: _amount, gas: 2300}("");
        require(success, Errors.POSITIONMANAGER_ETH_TRANSFER_FAILED);
    }
```

#### Post-audit
`.send()` function was replaced with `.call()` function without gas limit.
And the state of the contract is reverted in case the transfer fails.
We also use the `nonReentrant` modifier to prevent reentrancy attacks, thus, the usage of the `.call` is protected.





### MEDIUM-1
#### Users cannot unstake tokens that are no longer deposit tokens

`ZkdlpManager.sol`: `removeLiquidityForAccount` function
In case a certain token is no longer a deposit token, users cannot `removeLiquidityForAccount` the tokens.
This means that the funds will be blocked until the token is marked as a deposit token again.
The issue is marked as medium since the token can be marked as a deposit token again.

#### Recommendation:
Allow users to `removeLiquidityForAccount` tokens that are no longer deposit tokens.

```solidity
    function removeLiquidityForAccount(
        address _account, address _tokenOut,
        uint256 _zkdlpAmount, uint256 _minOut, address _receiver)
    external override nonReentrant returns (uint256) {
        _validateHandler();
        return _removeLiquidity(_account, _tokenOut, _zkdlpAmount, _minOut, _receiver);
    }
```



### MEDIUM-2
#### Transferred Reward tokens might not be `unstakeAndRedeemZkdlp`

`RewardRouterV2.sol`: `unstakeAndRedeemZkdlp` function

When Reward Router tokens are transferred to the Reward Router contract, the `unstakeAndRedeemZkdlp` function is called.
As a result, when the user tries to `unstakeAndRedeemZkdlp` the token, they will either have an insufficient balance or the transaction will revert.
Either way, the funds will be blocked until the user transfers the tokens to the Reward Router contract again.

#### Recommendation:
Update the `unstakeAndRedeemZkdlp` function to check if the user has enough tokens to `unstakeAndRedeemZkdlp`.

```solidity
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
```



### MEDIUM-3
Governance can withdraw tokens from the vault without a timelock

`Vault.sol`: `withdrawFees` function
Governance can transfer all the funds from the vault to the receiver without a timelock.
Thus, in case the governance account is compromised, the funds can be stolen.

### Recommendation:
Add a timelock to the `withdrawFees` function.

### Post-audit
The issue was fixed in the `Vault.sol` contract.

```solidity
    function withdrawFees(address _token, address _receiver) external override returns (uint256) {
        _onlyGov();
        uint256 amount = feeReserves[_token];
        if (amount == 0) {return 0;}
        feeReserves[_token] = 0;
        _transferOut(_token, amount, _receiver);
        return amount;
    }
```



### MEDIUM-4
#### Transfer is not validated

`ZkdlpManager.sol`: `_removeLiquidity`

The transfer of `zkUsd` is performed with a regular `transfer` function from the OpenZeppelin IERC20 interface
without checking if the transfer was successful. 
In order to ensure the security of the transfer, it is necessary to check if the transfer was successful.
Thus, it is recommended to use the `safeTransfer` function from the OpenZeppelin SafeERC20 interface.

#### Recommendation:
Use SafeERC20 to transfer tokens.

```solidity
    function _removeLiquidity(
        address _account, address _tokenOut,
        uint256 _zkdlpAmount, uint256 _minOut,
        address _receiver)
    internal returns (uint256) {
```



### MEDIUM-5
#### Outdated Solidity version.

Currently, the latest version of Solidity is 0.8.15 and the protocol uses Solidity version 0.6.12,
though the general recommendation is to use the latest version of Solidity.
The latest version of solidity includes many security improvements and new features that can be used to improve the protocol.
It is recommended to integrate the same version on all contracts.

#### Recommendation:
Update the Solidity version to the latest one.

#### Post-audit.
The ZKDX team has responded that `^0.6.0` will be used.
The team has assured that they will take care of the security of the contracts, such as overflow and underflow checks.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
```

### MEDIUM-6
#### Wrong variable check.
`ZkdlpManagerSettings.sol`: `setAumAdjustment` function

The `setAumAdjustment` function checks if the `_aumAdjustment` variable is valid.
In this case, when an invalid value is passed, the transaction will revert.
The issue is marked as medium since this variable is used in essential calculations.

#### Recommendation:
Check the function variables before assigning them to the storage variables.

```solidity
function setAumAdjustment(uint256 _aumAddition, uint256 _aumDeduction) external onlyGov {
        aumAddition = _aumAddition;
        aumDeduction = _aumDeduction;
    }
```




### LOW-1
#### Parameters lack validation.

Some functions do not validate the parameters passed to them.
The address that receives funds should be validated in contracts. 
Checking on zero addresses is necessary to avoid burn transfers.

- `Vault.sol`: `initialize` function should check if the `__router`, `_zkusd`, `_priceFeed` address is not zero.
- `Vault.sol`: `clearTokenConfig` function should check if the `token` address is not zero.
- `Vault.sol`: `withdrawFees` function should check if the `_token` and `_receiver` address is not zero.
- `Vault.sol`: `buyZKUSD` function should check if the `_receiver` address is not zero.
- `BasePositionManager.sol`: `constructor` function should check if the `_router` address is not zero.
- `BasePositionManager.sol`: `withdrawFees` function should check if the `_receiver` address is not zero.

#### `Vault.sol`

```solidity
function initialize(address _router, address _zkusd, address _priceFeed, uint256 _liquidationFeeUsd, uint256 _fundingRateFactor, uint256 _stableFundingRateFactor) external {
```

```solidity
function clearTokenConfig(address _token) external override {
```

```solidity
function withdrawFees(address _token, address _receiver) external override returns (uint256) {
```

```solidity
function buyZKUSD(address _token, address _receiver) external override nonReentrant returns (uint256) {
```

#### `BasePositionManager.sol`

```solidity
constructor(address _vault, address _router, address _shortsTracker, address _weth, uint256 _depositFee) public {
```

```solidity
function withdrawFees(address _token, address _receiver) external onlyAdmin {
```



### LOW-2
#### Decimals of Deposit tokens are not converted to common decimals in `ZkdlpManager.sol`

When tokens are staked, the amount is added to the `zkdlpSupply` variable.
The `zkdlpSupply` variable is used to calculate the amount of zkDLp tokens that should be minted.
Thus, these values are summable only if the decimals of the tokens are the same.
However, since deposit tokens have different decimals, the amount of zkDLp tokens that should be minted is not calculated correctly.
For example, user1 who has 1000 DAI and user2 who has 1000 USDC stake their tokens. 
If the contract do not convert the decimals of the tokens to common decimals, the amount of zkDLp tokens that should be minted is 2000.

##### Recommendation.
Convert the decimals of the deposit tokens to common decimals before calculating the amount of zkDLp tokens that should be minted.

#### `ZkdlpManager.sol`

```solidity
uint256 zkdlpSupply = IERC20(zkdlp).totalSupply();
```



### INFO-1

#### Gas optimization suggestion
1) OrderBook.sol:
- `_update` function should be marked as calldata instead of memory since the array is not modified.
- `_createDecreaseOrder` function should be marked as calldata instead of memory since the array is not modified.
- `_createIncreaseOrder` function should be marked as calldata instead of memory since the array is not modified.
- `cancelDecreaseOrder` function should be marked as calldata instead of memory since the array is not modified.
- `executeDecreaseOrder` function should be marked as calldata instead of memory since the array is not modified.
- `_swap` function should be marked as calldata instead of memory since the array is not modified.

2) Vault.sol
- `VaultStorage.sol`: `hasDynamicFees` and `inPrivateLiquidationMode`
Assigning a value to a storage variable costs 20k gas. It is recommended to initialize the variables in the constructor.

### INFO-2
#### Lack of events

Setters should emit events to notify the user about the changes in the state of the contract.
The following functions should emit events:
1) `VaultSettings.sol`:
   - `setVaultUtils()`, 
   - `setErrorController`, 
   - `setError`, 
   - `setInManagerMode`, 
   - `setManager`, 
   - `setInPrivateLiquidationMode`.
2) `ZkdlpManagerSettings.sol`: 
   - `setInPrivateMode`
   - `setShortsTrackerAveragePriceWeight`
   - `setHandler`
   - `setCooldownDuration`
   - `setAumAdjustment`

3) `ShortsTrackerSettings.sol`
   - `setHandler`
   - `setIsGlobalShortDataReady`
   - `setInitData`

##### Recommendation.
Emit event in setters.



### INFO-3

##### Contracts look like they are upgradable but they are not

`vault.sol` , `RewardRouterV2Settings.sol` 

The contracts have both the `initialize` and `constructor()` functions.
The `initialize` function is used by the proxy to initialize the contract state.
The `constructor()` function is used to initialize the contract state when the contract is deployed directly.

However, based on the deploy scripts, the contracts are not upgradable, which is why the `initialize` function is not needed.

##### Recommendation.
Verify if the contracts should not be upgradable

### INFO-4
##### Execution of the increase/decrease order might revert

`OrderBook.sol`: `executeDecreaseOrder` and `executeIncreaseOrder` functions

The `executeDecreaseOrder` and `executeIncreaseOrder` functions call the `_transferOutETH` function, which might revert if the order is not valid.
It is necessary to check if the order is valid before calling the `_transferOutETH` function. 

Thus, it is recommended to add the following check before calling the `_transferOutETH` function:

##### Recommendation.
Add the following check before calling the `_transferOutETH` function:

### INFO-5
##### Contracts are not compiling

`ZkdlpManager.sol`: `addLiquidity` and `removeLiquidity` functions should be removed from the contract since they are not used.
`IZkdlpManager.sol`: `addLiquidity` and `removeLiquidity` functions should be removed from the interface since they are not used.

# CODE COVERAGE AND TEST RESULTS FOR ALL FILES
### Test written by Zokyo Security

As a part of our work assisting ZKDX in verifying the correctness of their contract code, 
our team was tasked with writing tests for the contracts using the Hardhat testing framework.

The tests were written in Solidity and JavaScript, and can be found in the `test` directory of this repository, 
as well as a review of the ZKDX contract requirements for details about issuance amounts and how the system handles them.




Version
=======
> solidity-coverage: v0.8.5

Instrumenting for coverage...
=============================

> access/Governable.sol
> access/interfaces/IAdmin.sol
> core/BasePositionManager.sol
> core/BasePriceConsumer.sol
> core/interfaces/IBasePositionManager.sol
> core/interfaces/IOrderBook.sol
> core/interfaces/IPositionRouter.sol
> core/interfaces/IPositionRouterCallbackReceiver.sol
> core/interfaces/IRouter.sol
> core/interfaces/IShortsTracker.sol
> core/interfaces/IVault.sol
> core/interfaces/IVaultPriceFeed.sol
> core/interfaces/IVaultUtils.sol
> core/interfaces/IZkdlpManager.sol
> core/OrderBook.sol
> core/PositionManager.sol
> core/Router.sol
> core/settings/BasePositionManagerAggregator.sol
> core/settings/BasePositionManagerSettings.sol
> core/settings/OrderBookSettings.sol
> core/settings/PositionManagerAggregator.sol
> core/settings/PositionManagerSettings.sol
> core/settings/RewardRouterV2Settings.sol
> core/settings/RouterSettings.sol
> core/settings/ShortsTrackerSettings.sol
> core/settings/VaultInternal.sol
> core/settings/VaultSettings.sol
> core/settings/ZkdlpManagerSettings.sol
> core/ShortsTracker.sol
> core/storage/BasePositionManagerStorage.sol
> core/storage/OrderBookAggregators.sol
> core/storage/OrderBookStorage.sol
> core/storage/PositionManagerStorage.sol
> core/storage/ReaderStorage.sol
> core/storage/RewardRouterV2Aggregator.sol
> core/storage/RewardRouterV2Storage.sol
> core/storage/RouterStorage.sol
> core/storage/ShortsTrackerAggregator.sol
> core/storage/ShortsTrackerStorage.sol
> core/storage/TimelockStorage.sol
> core/storage/VaultAggregators.sol
> core/storage/VaultStorage.sol
> core/storage/VaultUtilsStorage.sol
> core/storage/YieldTokenStorage.sol
> core/storage/ZkdlpManagerAggregators.sol
> core/storage/ZkdlpManagerStorage.sol
> core/v2/AIPC.sol
> core/v2/HedgeManager.sol
> core/v2/HedgeManagerSettings.sol
> core/v2/VaultV2.sol
> core/Vault.sol
> core/VaultErrorController.sol
> core/VaultPriceFeed.sol
> core/VaultUtils.sol
> core/ZkdlpManager.sol
> libraries/Constants.sol
> libraries/DataTypes.sol
> libraries/Errors.sol
> libraries/Events.sol
> libraries/NewDataTypes.sol
> libraries/token/IERC20.sol
> libraries/utils/ReentrancyGuard.sol
> omni/interfaces/IStargateRouterETH.sol
> omni/token/esZKDXOmni.sol
> peripherals/interfaces/IHandlerTarget.sol
> peripherals/interfaces/ITimelock.sol
> peripherals/interfaces/ITimelockTarget.sol
> peripherals/MultiTransfer.sol
> peripherals/OrderBookReader.sol
> staking/interfaces/IRewardTracker.sol
> staking/interfaces/IVester.sol
> staking/RewardRouterV2.sol
> staking/ZkdxStaking.sol
> staking/ZkdxStakingETH.sol
> tokens/base/BaseToken.sol
> tokens/base/MintableBaseToken.sol
> tokens/base/YieldToken.sol
> tokens/esZKDX.sol
> tokens/interfaces/IBaseToken.sol
> tokens/interfaces/IMintable.sol
> tokens/interfaces/IWETH.sol
> tokens/interfaces/IYieldToken.sol
> tokens/interfaces/IYieldTracker.sol
> tokens/interfaces/IZKUSD.sol
> tokens/nft/ZKDXNFT.sol
> tokens/ZKDLP.sol
> tokens/ZKDX.sol
> tokens/ZKDXLV1.sol
> tokens/ZKUSD.sol

Compilation:
============

Compiling 34 Solidity files
Compiling 87 Solidity files
Compiling 65 Solidity files
Generating typings for: 189 artifacts in dir: typechain for target: ethers-v5
Successfully generated 309 typings!
Successfully compiled 182 Solidity files

Network Info
============
> HardhatEVM: v2.17.1
> network:    hardhat

No need to generate any newer typings.


  OmniZkdxStaking
>> starting deploying on chainId: 31337
>> owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
>> deploying vault...
>> nativeName: WETH
>> WNative: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
>> chainId: 31337, chainName: Local
>> CHAIN_ID_AND_NAMES: 80001: Mumbai,280: ZKSync Testnet,421613: Arbitrum Goerli,43113: Fuji,420: Optimism Goerli,71: Conflux Test,59140: Linea Testnet,44787: Celo Test,5001: Mantle Test,84531: Base Test,97: BSC Test,534351: Scroll Sepolia
>> chainId: 31337, chainName: Local
>> deploying manager...
>> deploying zkdlp...
>> deploying tokens...
>> chainId: 31337, chainName: Local
>> chainId: 31337, chainName: Local
>> chainId: 31337, chainName: Local
>> deploying staking ...
>> deploying zkdxlv1 ...
>> deploying vaultV2 ...
>> deploying ZKHLP ...
>> deploying AIPC && HedgeManager ...
>> chainId: 31337, chainName: Local
>> CHAIN_ID_AND_NAMES: 80001: Mumbai,280: ZKSync Testnet,421613: Arbitrum Goerli,43113: Fuji,420: Optimism Goerli,71: Conflux Test,59140: Linea Testnet,44787: Celo Test,5001: Mantle Test,84531: Base Test,97: BSC Test,534351: Scroll Sepolia
>> chainId: 31337, chainName: Local
>> ✔ check mint suc
>> ✔ check swap USDC remote suc (92ms)
>> ✔ check swap ETH remote suc (89ms)
>> stake gasLimit: 128786
>> ✔ check stake USDC local suc (47ms)
>> stakeFee: 0.018707436
>> ✔ check stake USDC remote suc (334ms)
>> stake ETH gasLimit: 88218
>> ✔ check stake ETH local suc (68ms)
>> stakeFee: 0.018707436
>> ✔ check stake ETH remote suc (112ms)
>> ✔ check withdraw USDC local suc (104ms)
>> withdrawFee: 0.016507084
>> ✔ check withdraw USDC remote suc (111ms)
>> ✔ check withdraw ETH local suc
>> withdrawFee: 0.016507084
>> ✔ check withdraw ETH remote suc (100ms)
>> ✔ claim local suc (41ms)
>> claimFee: 0.013201551
>> ✔ claim remote suc (68ms)
>> ✔ check end rewards suc (42ms)

  OrderBook
    ✔ check increase order - Long BTC (178ms)
    ✔ check increase order - Short BTC (180ms)
    ✔ check decrease order - Take Profit (323ms)
    ✔ check decrease order - Stop Loss (322ms)
    ✔ check cancel multiple orders (146ms)
dai balance 2000.0
    ✔ revert long leverage decreases (243ms)

  PositionManager
    ✔ check long position - Open (134ms)
    ✔ check long position - Open, with price spread (123ms)
increase (updateData) 573242
increase (no updateData) 426025
updateData gas diff:  147217
    ✔ check long position updateData gas diffs (243ms)
    ✔ check long position - Close with profit (232ms)
    ✔ check long position - Close with loss (232ms)
    ✔ check long position - Liquidate (254ms)
    ✔ close revert below 0, can be close after add collateral (437ms)
    ✔ liquidate below 0 by user self (294ms)
    ✔ check long position - Liquidate Max leverage on small price slippage (245ms)
    ✔ check long position - Decrease (372ms)
    ✔ check short position - Close with profit (254ms)
    ✔ check short position - Liquidate (308ms)
    ✔ check liquidate price for fees (395ms)
    ✔ check long position with wbtc (177ms)
    ✔ check short position with wbtc (133ms)
    ✔ check 1% close - no minProfit limit (290ms)
    ✔ check 1% close - with minProfit limit (296ms)
    ✔ setGov() - Prigogine
    ✔ setAdmin() - Prigogine
    ✔ setDepositFee() - Prigogine
    ✔ pm.setOrderKeeper() - Prigogine
    ✔ bpm.approve() - Prigogine
Step0: userBalanceBefore: 10000.0
Step1: userBalanceBefore: 9994.999999999999426769
Step1b: userBalanceBefore: 9994.999999999999426769
StepX: userBalanceBefore: 10000.293749999999040574
    ✔ check long position - Close with profit 2 (236ms)
Step0: v.poolAmounts(weth): 99.7
Step1: v.poolAmounts(weth): 104.69
Step1b: v.poolAmounts(weth): 104.69
Step X: v.poolAmounts(weth): 99.386875
    ✔ check long position - Close with profit 3 (239ms)
    ✔ long position && close with profit ==> BASE (221ms)
step0: position: 0,0,0,0,0,0,0
step1: position: 15000000000000000000000000000000000,7485000000000000000000000000000000,1500000000000000000000000000000000,0,10000000000000000000,0,1698297408
stepX: position: 0,0,0,0,0,0,0
    ✔ long position && close with profit ==> position (233ms)
    ✔ long+profit ==> v.poolAmounts (225ms)
    ✔ long+profit ==> v.reservedAmounts (223ms)
    ✔ long+profit ==> v.allWhitelistedTokens (228ms)
    ✔ buyZKUSD ==> v.zkusdAmounts (51ms)
    ✔ longWithProfit ==> v.maxUsdmAmounts (224ms)
    ✔ longWithProfit ==> v.tokenDecimals (367ms)
    ✔ longWithProfit ==> v.tokenBalances (225ms)
v.tokenWeights(weth): 10000
v.tokenWeights(dai): 10000
v.totalTokenWeights: 40000
v.tokenWeights(weth): 10000
v.tokenWeights(dai): 10000
v.totalTokenWeights: 40000
    ✔ longWithProfit ==> v.tokenWeights (234ms)

  PositionManager_equity
    ✔ check long position tsla (129ms)
    ✔ check short position tsla (136ms)
    ✔ check open position pre charge (486ms)

  PM Test
    ✔ PM.func => gov()
    ✔ PM.func => increasePosition() (240ms)

  Reader Test
    ✔ reader.func => gov()
after tokenInfos(weth): 997000000000000000,0,1495500000000000000000,10000,0,1500000000000000000000000000,0,0,0,0,100,0
after tokenInfos(dai): 0,0,0,10000,0,0,0,0,0,0,80,0
after tokenInfos(wbtc): 0,0,0,10000,0,1500000000000000000000000000,0,0,0,0,100,0
    ✔ reader.func => getVaultTokenInfo() (157ms)
after tokenInfos(weth,dai,wbtc): 997000000000000000,0,1495500000000000000000,10000,0,1500000000000000000000000000,0,0,0,0,100,0,0,0,0,10000,0,0,0,0,0,0,80,0,0,0,0,10000,0,1500000000000000000000000000,0,0,0,0,100,0
    ✔ reader.func => getVaultTokenInfo() v2 (148ms)
    ✔ reader.func => getFees() (122ms)
    ✔ reader.func => getFeeBasisPoints() (148ms)
    ✔ reader.func => getTotalStaked() (117ms)
    ✔ reader.func => getStakingInfo() (117ms)
    ✔ reader.func => getFundingRates() (121ms)

  RewardRouter Test V2
    ✔ RewardRouter.func => gov()
    ✔ RewardRouter.func => mintAndStakeZkdlpETH() v3_0_1 (116ms)
    ✔ RewardRouter.func => mintAndStakeZkdlpETH() v3_0_1 (115ms)

  RewardRouter Test V3
    ✔ RewardRouter.func => gov()
updateData: 0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a600000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000000000000000000000000000000000000000000000000006539f63e00000000000000000000000000000000000000000000000000000022ecb25c000000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000000000000000000000000000000000000000000000000006539f63e,0x87a67534df591d2dd5ec577ab3c75668a8e3d35e92e27bf29d9e2e52df8de4120000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000000000000000000000000000000000000000000000000006539f63e0000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000000000000000000000000000000000000000000000000006539f63e,0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b0000000000000000000000000000000000000000000000000000028bed0160000000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000000000000000000000000000000000000000000000000006539f63e0000000000000000000000000000000000000000000000000000028bed0160000000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8000000000000000000000000000000000000000000000000000000006539f63e
feed.getMinPrice: 1500000000000000000000000000000000
    ✔ RewardRouter.func => mintAndStakeZkdlpETH() v3_0_1 (122ms)
    ✔ RewardRouter.func => mintAndStakeZkdlpETH() v3_0_1 (120ms)
    ✔ RewardRouter.func => mintAndStakeZkdlpETH() + unstakeAndRedeemZkdlpETH() (135ms)
weth.balacneOf(owner): 1.0
    ✔ RewardRouter.func => mintAndStakeZkdlp()

  RewardRouter Test V4
    ✔ rewardRouter.func => buyMLPWithETH + sellMLPWithETH (246ms)
    ✔ rewardRouter.func => mintAndStakeZkdlp + unstakeAndRedeemZkdlp (243ms)
    ✔ rewardRouter.func => buyMLPWithToken => v2 (490ms)
    ✔ rewardRouter.func => buyMLPWithTokenV2 (488ms)
zkdlp.balanceOf(owner.address) = 299100.0
zkdlp.balanceOf(user0.address) = 149550.0
zkdlp.balanceOf(user1.address) = 279160.0
zkdlp.balanceOf(user2.address) = 123085.632
zkdlp.totalSupply() = 850895.632
weth.balanceOf(owner.address) = 0.0
--------------------------------------- line ---------------------------------------
zkdlp.balanceOf(owner.address) = 200000.0
zkdlp.balanceOf(user0.address) = 100000.0
zkdlp.balanceOf(user1.address) = 200000.0
zkdlp.balanceOf(user2.address) = 100000.632
zkdlp.totalSupply() = 600000.632
weth.balanceOf(owner.address) = 65.868466666666666666
weth.balanceOf(user0.address) = 32.934233333333333333
wbtc.balanceOf(user1.address) = 2.81866142
dai.balanceOf(user2.address) = 23015.745007387666740539
    ✔ rewardRouter.func => buyMLPWithTokenV2 => sellMLPWithTokenV2 (1125ms)
r.address = 0x7a2088a1bFc9d81c55368AE168C2C02570cB814F
    ✔ check RewardRouterV2.func => mintAndStakeZKdlp() (129ms)

  Router Test V1
feed.address: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
    ✔ router.func => constructor()
    ✔ router.func => addPlugin() in 2_deploy_manager.ts
    ✔ router.func => setGov()
    ✔ router.func.internal => pluginTransfer()
    ✔ router.func.internal => pluginTransfer()
    ✔ router.func => removePlugin + addPlugin 

  Router Test V2
    ✔ router.func => pluginIncreasePosition() (846ms)
    ✔ router.func => pluginDecreasePosition() v2 (351ms)
weth.balanceOf(owner): 1.129333333333333333
dai.balanceOf: 0.0
eth.balanceOf(owner): 9999.999999999884404606
position.size: 4000.0
    ✔ router.func => longWETH + closePosition() (435ms)
    ✔ router.func => longWETH + close() v2 (427ms)
    ✔ router.func => longWETH + close() v3 (465ms)
    ✔ router.func => longWETH + close() v4 (467ms)

  ShortsTracker Test V2
    ✔ shortsTracker.scripts => deploy => 3_deploy_zkdlp.ts
    ✔ shortsTracker.scripts => deploy => 2_deploy_manager.ts
    ✔ shortsTracker.scripts => deploy => 2_deploy_manager.ts v2
    ✔ shortsTracker.settings => setGov
    ✔ shortsTracker.settings => setHandler
    ✔ shortsTracker.settings => setHandler v2
    ✔ shortsTracker.settings => setIsGlobalShortDataReady()
    ✔ shortsTracker.settings => setInitData()
    ✔ shortsTracker.settings => setInitData() v2
    ✔ shortsTracker.Parameters => vault
s.globalShortAveragePrices(dai): 0.0
s.globalShortAveragePrices(weth): 0.0
s.globalShortAveragePrices(wbtc): 0.0
    ✔ shortsTracker.func => updateGlobalShortData() (301ms)

  VaultPriceFeed Test
    ✔ feed.func => gov()
    ✔ feed.func => setValidTime()
    ✔ feed.func => parameters()
feed.feedIds: 0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6
feed.feedIds: 0x87a67534df591d2dd5ec577ab3c75668a8e3d35e92e27bf29d9e2e52df8de412
feed.feedIds: 0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b
    ✔ feed.func => parameters() => feedIds
    ✔ feed.func => latestTime()
    ✔ feed.func => pyth()
feed.getPrice: 1500000000000000000000000000000000
    ✔ feed.func => getPrice() (126ms)
feed.getMinPrice: 1500000000000000000000000000000000
    ✔ feed.getMinPrice => getPrice() v2 (120ms)
feed.latestTime: 1
feed.latestTime: 1
feed.latestTime: 1
    ✔ feed.getMinPrice => latestTime() (138ms)
    ✔ feed.func => getUpdateFee() (118ms)
    ✔ feed.func => setGov()

  VaultUtils Test
    ✔ VaultUtils.func => gov()
    ✔ rewardRouter.func => buyMLPWithETH() (215ms)
    ✔ rewardRouter.func => buyMLPWithETH() + unstakeAndRedeemZkdlpETH() (243ms)
    ✔ VaultUtils.func => vault() 
    ✔ VaultUtils.func => setGov

  VaultUtils Test v2
    ✔ VaultUtils.func => gov()
    ✔ PM.func => increasePosition() (365ms)
    ✔ VaultUtils.func => vault()
vu.getEntryFundingRate() 0
vault.cumulativeFundingRates: 0
vault.cumulativeFundingRates: 0
vault.cumulativeFundingRates: 0
vault.cumulativeFundingRates: 0
vault.cumulativeFundingRates: 0
    ✔ VaultUtils.func => getEntryFundingRate()
    ✔ VaultUtils.func => getBuyZkusdFeeBasisPoints()

  Vault Test
    ✔ vault.func => gov()
    ✔ vault.parameters => stableTokens() (197ms)
    ✔ vault.func => setInManagerMode()
    ✔ vault.func => gov()
    ✔ vault.func => setVaultUtils()

  DlpManager Test V1
    ✔ rewardRouter.func => buyMLPWithTokenV2 => sellMLPWithTokenV2 (1313ms)
    ✔ rewardRouter.func => buyMLPWithETHV2 (245ms)
    ✔ zkdlpManager.parameters => vault => buyMLPWithETHV2 (245ms)
    ✔ zkdlpManager.parameters =>  v2 => buyMLPWithTokenV2 (252ms)
    ✔ zkdlpManager.parameters =>  lastAddedAt() => buyMLPWithTokenV2() (252ms)
    ✔ zkdlpManager.func => getPrice() => buyMLPWithTokenV2() (345ms)
aum: 1372.05
aum2: 1372.05
aumInZkUsd: 1.0
aumInZkUsd2: 1.0
    ✔ zkdlpManager.func => getAums() => buyMLPWithTokenV2() (441ms)
    ✔ zkdlpManager.func => getAums() => buyMLPWithTokenV2() (811ms)
    ✔ zkdlpManager.func => getAumInZkusd() => buyMLPWithTokenV2() (342ms)
    ✔ zkdlpManager.func => getAum() => buyMLPWithTokenV2() (438ms)
    ✔ zkdlpManager.func => getPrice() => buyMLPWithTokenV2() (344ms)
    ✔ feed.func => getPrice(weth) => buyMLPWithTokenV2() (140ms)
    ✔ feed.func => getPrice(wbtc) => buyMLPWithTokenV2() (137ms)
price: 1.3
price: 1002.0
price: 25678.0
    ✔ feed.func => mintAndStakeZkdlp() => updateMarkPrice() (136ms)
    ✔ feed.func => getPrice(dai) => updateMarkPrice() (90ms)

  DlpManager Test V2
    ✔ zkdlpManager.func => buyMLP + sellMLP (484ms)
    ✔ dlpManager.func => isHandler
    ✔ dlpManager.settings => setInPrivateMode()
    ✔ dlpManager.settings => setGov()
    ✔ dlpManager.func => getGlobalShortAveragePrice() (528ms)
    ✔ dlpManager.settings => setShortsTrackerAveragePriceWeight()
    ✔ dlpManager.settings => setHandler()
    ✔ dlpManager.func => setHandler() => buyMLPWithETHV2() (234ms)
    ✔ dlpManager.settings => setCooldownDuration() (300ms)
    ✔ dlpManager.settings => setCooldownDuration() V2
    ✔ dlpManager.settings => setAumAdjustment()
dlpManager.getAum() => 1495.5
dlpManager.getAum() => 2495.4999999999999999999999999999
dlpManager.getAum() => 0.0
dlpManager.getGlobalShortAveragePrice(weth.address) => 
            0.0
dlpManager.getGlobalShortAveragePrice(dai.address) =>
            0.0
dlpManager.getGlobalShortAveragePrice(wbtc.address) =>
            0.0
    ✔ dlpManager.settings => setAumAdjustment() v2 (478ms)
    ✔ dlpManager.Parameters => v1
    ✔ dlpManager.Parameters => v1 (496ms)

  ZkDLPManager -> ZkdlpManagerStorage Test
    ✔ ZkdlpManagerStorage.parameters => vault() (499ms)
    ✔ ZkdlpManagerStorage.parameters => zkusd()
    ✔ zkdlpManagerStorage.parameters => inPrivateMode()
    ✔ m.parameters => cooldownDuration()
    ✔ m.parameters => aumAddition()

  ZkDLPManager -> ZkdlpManagerSettings Test
    ✔ ZkdlpManagerSettings.func => setInPrivateMode() (242ms)
    ✔ ZkdlpManagerSettings.func => setInPrivateMode() v2 (243ms)
    ✔ zkdlpManagerSettings.parameters => isHandler()
    ✔ dlpManager.func => setHandler() v1 (326ms)
    ✔ dlpManager.func => setInPrivateMode()
    ✔ dlpManager.settings => setShortsTrackerAveragePriceWeight()
    ✔ dlpManager.settings => setHandler()
    ✔ dlpManager.settings => setCooldownDuration()
    ✔ dlpManager.settings => setAumAdjustment()

  ZkDLPManager -> ZkdlpManager Test
    ✔ ZkdlpManager.func => constructor()

  DLP -> DLP Test
    ✔ dlp.func => constructor
    ✔ dlp.func => isMinter()
    ✔ dlp.func => setMinter()
    ✔ dlp.func => mint()
    ✔ dlp.func => burn()

  DLP -> BaseToken Test
    ✔ dlp.parameters => name
    ✔ dlp.parameters => balances (1206ms)
    ✔ dlp.parameters => admins (1214ms)
    ✔ dlp.func => setGov()
    ✔ dlp.func => setInfo()
    ✔ dlp.func => setYieldTrackers()
    ✔ dlp.func => addAdmin()
    ✔ dlp.func => removeAdmin()
    ✔ dlp.func => setInPrivateTransferMode()
    ✔ dlp.func => setHandler
    ✔ dlp.func => addNonStakingAccount() (1237ms)
    ✔ dlp.func => removeNonStakingAccount() (1352ms)
    ✔ dlp.func => recoverClaim()
    ✔ dlp.func => claim()
    ✔ dlp.func => totalStaked() + balanceOf (1224ms)
    ✔ dlp.func => stakedBalance() (1227ms)
    ✔ dlp.func => transfer() (1220ms)
    ✔ dlp.func => allowance() (1213ms)
    ✔ dlp.func => transferFrom() (1214ms)
    ✔ dlp.func => transferFrom() + isHandler (1348ms)

  PM_New_2 Test
    ✔ pm.scripts => deploy => 2_deploy_manager.ts
    ✔ pm.scripts => deploy => 2_deploy_manager.ts
    ✔ pm.scripts => deploy => 2_deploy_manager.ts => setOpened
    ✔ pm.scripts => deploy => 2_deploy_manager.ts => Router.addPlugin()
    ✔ pm.scripts => deploy => 4_deploy_tokens.ts
    ✔ bpm.settings => setAdmin()
    ✔ bpm.settings => setDepositFee()
    ✔ bpm.settings => setIncreasePositionBufferBps()
    ✔ bpm.settings => setMaxGlobalSizes() (401ms)
    ✔ bpm.settings => setMaxGlobalSizes() v2
1. position size: 1400.0
2. position size: 1000.0
   3.position size: 1900.0
   position size: 2100.0
    ✔ bpm.settings => setMaxGlobalSizes() + buyMLPWithETHV2 (871ms)
    ✔ bpm.func => short + close (720ms)
    ✔ bpm.parameters => depositFee() (303ms)
    ✔ bpm.parameters => depositFee v2 (461ms)
    ✔ bpm.parameters => depositFee v3 (690ms)
    ✔ bpm.settings => setIncreasePositionBufferBps()
    ✔ bpm.parameters => increasePositionBufferBps() v2 => increasePositionBufferBps = 100 (496ms)
    ✔ bpm.parameters => increasePositionBufferBps() v3 => IncreasePositionBufferBps = 60000 (505ms)
    ✔ bpm.parameters => admin + gov
    ✔ bpm.parameters => vault + shortsTracker + router + weth
    ✔ bpm.settings => setAdmin()
    ✔ bpm.parameters => maxGlobalLongSizes + maxGlobalShortSizes (975ms)
    ✔ bpm.parameters => feeReserves (1000ms)

  PM->BasePositionManager Test
    ✔ bpm.func => feeReserves() (493ms)
    ✔ bpm.func => withdrawFees() (496ms)
    ✔ bpm.func => constructor() (494ms)
    ✔ bpm.func => setDepositFee() => 9999 is ok (495ms)
    ✔ bpm.func => setDepositFee() => 2000 is ok (504ms)
    ✔ bpm.func => setMaxGlobalSizes() => WETH_long:1500 + WETH_Short: 1500 (412ms)
    ✔ bpm.func => setMaxGlobalSizes() => ALL: 1500 (408ms)

  PM->PositionManagerStorage Test
    ✔ PositionManagerStorage.func => opened + shouldValidateIncreaseOrder
    ✔ PositionManagerStorage.func => orderBook
    ✔ pms.parameters => isOrderBook
    ✔ pms.parameters => isPartner
    ✔ pms.parameters => isLiquidator
    ✔ pms.settings => setOrderKeeper
    ✔ pms.settings => setLiquidator
    ✔ pms.settings => setPartner
    ✔ pms.settings => setOpened
    ✔ pms.settings => setShouldValidateIncreaseOrder

  PM->PositionManager Test
    ✔ pm.func => constructor
    ✔ pm.func => increasePosition (298ms)
    ✔ pm.func => increasePositionETH() (256ms)
    ✔ pm.func => liquidatePosition()
vault.gov: 0x0165878A594ca255338adfa4d48449f69242Eb8F
timelock.address: 0x0165878A594ca255338adfa4d48449f69242Eb8F
    ✔ vault.parameters => admin()
    ✔ liquidate long position (383ms)

  Router->RouterStorage Test
    ✔ RouterStorage.Parameters => gov()
    ✔ RouterStorage.Parameters => plugins()
    ✔ RouterSettings.func => setGov()

  Router->Router Test
    ✔ Router.func => constructor()
    ✔ router.func => addPlugin() + removePlugin
    ✔ router.func => plugins()
    ✔ router.func => pluginTransfer()
    ✔ vault.parameters => whitelistedTokens()
    ✔ router.func => directPoolDeposit()

  VaultPriceFeed -> VaultPriceFeed Test
feed.pyth: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
    ✔ feed.func => constructor
    ✔ feed.func => getPrice() (1230ms)
    ✔ feed.func => getPrice() => dai (1367ms)
    ✔ feed.func => latestTime() (1219ms)
    ✔ feed.func => getUpdateFee() (1250ms)
    ✔ feed.func => setPyth()
    ✔ feed.func => setValidTime()
    ✔ feed.func => setFeedIds()
    ✔ feed.func => setGov()
    ✔ feed.params => feedIds()

  VaultUtils -> VaultUtilsStorage Test
    ✔ vu.Parameters => vault
    ✔ vu.parameters => gov

  VaultUtils -> VaultUtils Test
    ✔ vu.func => constructor
    ✔ vu.func => getEntryFundingRate() (1236ms)
    ✔ vault.func => getEntryFundingRate() (1233ms)
    ✔ vu.func => getPositionFee() (2103ms)
    ✔ vu.func => getFundingFee() (1965ms)
    ✔ vu.func => getBuyZkusdFeeBasisPoints() (376ms)
    ✔ vu.func => getBuyZkusdFeeBasisPoints() v2 (405ms)
    ✔ vu.func => getSellZkusdFeeBasisPoints()  (390ms)
    ✔ vu.func => getSwapFeeBasisPoints()  (400ms)
    ✔ vu.func => getSwapFeeBasisPoints() v2 (403ms)

  Vault -> VaultStorage Test
    ✔ VaultStorage.Parameters => gov + isInitialized (723ms)
    ✔ VaultStorage.Parameters => liquidationFeeUsd (1989ms)
v.poolAmounts: 0.0
v.poolAmounts: 0.0
v.poolAmounts: 0.0
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
------------------------------PRINTVAULT_POOL_RESERVED------------------------------
v.poolAmounts: 333.333333312127045379
v.poolAmounts: 100000.631992590103570171
v.poolAmounts: 7.14285715
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
------------------------------PRINTVAULT_POOL_RESERVED------------------------------
    ✔ VaultStorage.Parameters => liquidationFeeUsd (1355ms)
v.poolAmounts: 0.0
v.poolAmounts: 0.0
v.poolAmounts: 0.0
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
------------------------------PRINTVAULT_POOL_RESERVED------------------------------
v.poolAmounts: 19.9372
v.poolAmounts: 20440.4000000000000005
v.poolAmounts: 0.0
v.reservedAmounts: 0.666666666666666667
v.reservedAmounts: 1400.0
v.reservedAmounts: 0.0
------------------------------PRINTVAULT_POOL_RESERVED------------------------------
    ✔ VaultStorage.Parameters => poolAmounts + reservedAmounts v2 (743ms)
    ✔ vs.parameters => maxLeverage
    ✔ vs.parameters => whitelistedTokenCount
    ✔ vs.parameters => maxGasPrice
    ✔ vs.parameters => vaultUtils + errorController
    ✔ vs.parameters => tokenDecimals
    ✔ vs.parameters => tokenBalances (737ms)
    ✔ vs.Parameters => tokenBalances V2 (1227ms)
    ✔ vs.Parameters => tokenWeights  (1223ms)
    ✔ vs.Parameters => allWhitelistedTokens
    ✔ vs.Parameters => zkusdAmounts (1220ms)
zkusdAmounts(weth) = 499999.999968190568065949
zkusdAmounts(dai) = 100000.631992590103570171
zkusdAmounts(wbtc) = 199999.999999999999999831
    ✔ vs.Parameters => zkusdAmounts v2 (1358ms)
    ✔ vs.parameters => maxZkusdAmounts (1244ms)

  Vault -> VaultSettings Test
    ✔ v.Parameters => gov
    ✔ v.func => setVaultUtils
    ✔ v.func => setErrorController
    ✔ v.func => setError
    ✔ v.func => setInManagerMode
    ✔ v.func => setManager
    ✔ v.func => setInPrivateLiquidationMode
    ✔ v.func => setLiquidator
    ✔ v.func => setIsSwapEnabled
    ✔ v.func => setIsLeverageEnabled
    ✔ v.func => setMaxGasPrice
    ✔ v.func => setGov
    ✔ v.func => setPriceFeed
    ✔ v.func => setMaxLeverage
------------------------------setBufferAmounts------------------------------
    ✔ v.func => setBufferAmounts (1236ms)
------------------------------setMaxGlobalShortSize------------------------------
    ✔ v.func => setMaxGlobalShortSize
------------------------------setFees------------------------------
v.taxBasisPoints: 100
v.stableTaxBasisPoints: 100
v.mintBurnFeeBasisPoints: 100
v.swapFeeBasisPoints: 100
v.stableSwapFeeBasisPoints: 100
v.marginFeeBasisPoints: 500
v.liquidationFeeUsd: 10.0
v.minProfitTime: 100
v.hasDynamicFees: true
    ✔ v.func => setFees
    ✔ v.func => setFundingRate
v.whitelistedTokenCount(): 4
v.whiteListedTokens: true
v.tokenDecimals: 18
v.tokenWeights: 10000
v.minProfitBasisPoints: 100
v.maxZkusdAmounts: 1500000000.0
v.stableTokens: false
v.shortableTokens: true
    ✔ v.func => setTokenConfig() => weth
v.whitelistedTokenCount(): 4
v.whiteListedTokens: true
v.tokenDecimals: 18
v.tokenWeights: 10000
v.minProfitBasisPoints: 80
v.maxZkusdAmounts: 0.0
v.stableTokens: true
v.shortableTokens: false
    ✔ v.func => setTokenConfig() => dai
v.whitelistedTokenCount(): 4
v.whiteListedTokens: true
v.tokenDecimals: 8
v.tokenWeights: 10000
v.minProfitBasisPoints: 100
v.maxZkusdAmounts: 1500000000.0
v.stableTokens: false
v.shortableTokens: true
    ✔ v.func => setTokenConfig() => wbtc
    ✔ v.func => setTokenConfig() => weth v2
    ✔ v.func => setMinProfitTime() => 1 day
    ✔ v.func => setZkusdAmount() (1224ms)
    ✔ v.func => setZkusdAmount() => 1000 v2 (1271ms)
    ✔ v.func => setVaultUtils()
    ✔ v.func => setErrorController()

  Vault -> VaultInternal Test
    ✔ v.func => getMaxPrice() (1262ms)
    ✔ v.func => getMinPrice() (1380ms)
    ✔ v.func => usdToTokenMax() (143ms)
    ✔ v.func => usdToTokenMin() (162ms)
    ✔ v.func => tokenToUsdMin() (145ms)
    ✔ v.func => usdToToken() (152ms)
    ✔ v.params => tokenDecimals()
    ✔ v.func => adjustForDecimals()
    ✔ v.func => getRedemptionAmount() (148ms)
    ✔ v.func => allWhitelistedTokensLength()
    ✔ v.func => getPositionFee() (1988ms)
    ✔ v.func => addRouter() => owner + user0
    ✔ tsla
v.getPositionKey: 0x1142692f2d2f091b2c4960d9abcc01fcd82bfa3d5196308f4a7795e4dc8d5ae1
v.getPositionKey: 0xf441063c7d7b17ae03545c0ff96740aff3cf795215809a3b27b910648f19a426
v.getPositionKey: 0x772ba64ea398383c218810577a87e81e81daa9668a0948115c304210cfb1e4e2
v.getPositionKey: 0xba17c8fae6e734a57b457e3a6063bc7086c421554a91cb585f95766371c5e400
v.getPositionKey: 0x67591a889e867179c36d8d3807a6588ee0933ff1e003e262db148162ea777bf3
v.getPositionKey: 0x84d65180903832949cca191f27dd484832abc118c882cdec9c31e621fa213eef
v.getPositionKey: 0xf9ae1a8662118b22b7cb1d6dba5e8fbc914a25d7b0a98226f789c56e4e48fd64
v.getPositionKey: 0xeed0c68600dd4a306d7ce6642c89d280576a5a5f7513f4f66ac3187c63c147f3
    ✔ v.func => getPositionKey()
    ✔ v.func => getPosition() (1971ms)
    ✔ v.func => getPositionDelta() (1993ms)
    ✔ v.func => getTargetZkusdAmount() (1408ms)
    ✔ v.func => getEntryFundingRate() (1974ms)
    ✔ v.func => getNextFundingRate() (1241ms)

  Vault -> Vault Test
    ✔ v.func => constructor()
    ✔ v.func => allWhitelistedTokens()
    ✔ v.func => clearTokenConfig()
weth balance: 1.995500000063618864
dai balance: 439.62300002222968929
wbtc balance: 0.03848143
weth balance: 2.058300000063618863
dai balance: 501.921800022229689289
wbtc balance: 0.03848143
    ✔ v.func => withdrawFees() (1994ms)

  BPM -> BasePositionManager test
    ✔ bpm.Paramter => vault (718ms)
    ✔ bpm.Paramter => withdrawFees (859ms)
    ✔ bpm.func => approve()
Account balance:, 9999.99999999988692505
Account balance:, 9998.99999999988690405
    ✔ bpm.func => sendValue()

  Reader -> ReaderStorage Test
    ✔ reader.parameters => name
    ✔ reader.parameters => gov()
    ✔ reader.func => setConfig

  ShortsTracker -> ShortsTracker test
    ✔ ss.Paramter => vault
    ✔ ss.func => setHandler() => owner
    ✔ ss.func => setHandler() => timelock
    ✔ ss.func => setIsGlobalShortDataReady()
    ✔ ss.func => setGov() => timelock
    ✔ ss.func => updateGlobalShortData()
ss.getNextGlobalShortData() : 1000000000000000000000000000000000,1500000000000000000000000000000000
ss.getRealisedPnl(): 0
    ✔ ss.func => getRealisedPnl()

  Timelock -> Timelock Test => PART I
    ✔ Timelock.parameters => PRICE_PRECISION
    ✔ Timelock.func => constructor
    ✔ Timelock.func => setContractHandler
    ✔ t.func => setKeeper()
    ✔ t.func => setBuffer()
    ✔ t.func => setMaxLeverage()
    ✔ t.func => setMaxGlobalShortSize()
    ✔ t.func => setVaultUtils
    ✔ t.func => setMaxGasPrice
    ✔ t.func => setInPrivateLiquidationMode
    ✔ t.func => setLiquidator
    ✔ t.func => setInPrivateTransferMode
    ✔ t.func => setGov
    ✔ t.func => setHandler
    ✔ t.func => setPriceFeed
    ✔ t.func => removeAdmin
    ✔ t.func => withdrawFees (1542ms)

  Timelock -> Timelock Test => PART II
    ✔ t.func => transferIn
    ✔ t.func => signalApprove() + approve()
    ✔ t.func => signalApprove() + PM
    ✔ t.func => signalWithdrawToken + withdrawToken => V1 zkusd
    ✔ t.func => signalWithdrawToken + withdrawToken => V2 zkdlp
    ✔ t.func => signalMint + processMint => V1 zkdlp
    ✔ t.func => signalRedeemZkusd + redeemZkusd (1580ms)
bytes32: 0x68656c6c6f20776f726c64000000000000000000000000000000000000000000
    ✔ t.func => cancelAction
    ✔ t.func => setFundingRate
    ✔ t.func => onlyKeeperAndAbove
    ✔ t.func => setSwapFees
    ✔ t.func => setFees
    ✔ t.func => setMinProfitTime
v.whitelistedTokenCount: 4
v.whitelistedTokens: true
v.tokenDecimals: 18
v.tokenWeights: 10000
v.minProfitBasisPoints: 80
v.maxZkusdAmounts: 0
v.stableTokens: true
v.shortableTokens: false
v.equityTokens: false
v.totalTokenWeights: 40000
------------------------------after setTokenConfig------------------------------
v.whitelistedTokenCount: 4
v.whitelistedTokens: true
v.tokenDecimals: 1
v.tokenWeights: 1
v.minProfitBasisPoints: 1
v.maxZkusdAmounts: 1
v.stableTokens: true
v.shortableTokens: true
v.equityTokens: true
v.totalTokenWeights: 30001
    ✔ t.func => setTokenConfig (47ms)
    ✔ t.func => setAllowStableEquity

  Timelock -> TimelockStorage
    ✔ t.Paramter => PRICE_PRECISION
    ✔ t.func => setBufferAmounts
    ✔ t.func => setBufferAmounts => v2
    ✔ t.func => setZkusdAmounts
    ✔ t.func => setIsSwapEnabled()
t.zkdlpManager: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
dlpManager: 0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f
    ✔ t.func => updateZkusdSupply()
    ✔ t.func => batchWithdrawFees() (1641ms)
t.shouldToggleIsLeverageEnabled: true
    ✔ t.setShouldToggleIsLeverageEnabled
    ✔ t.func => setMarginFeeBasisPoints
    ✔ t.func => setIsLeverageEnabled
    ✔ t.func => enableLeverage()
    ✔ t.func => disableLeverage()

  ZKUSD -> YieldToken Test
    ✔ zkusd.func => constructor
    ✔ zkusd.func => addAdmin()
    ✔ zkusd.func => removeAdmin()
    ✔ zkusd.func => withdrawToken()
    ✔ zkusd.func => addNonStakingAccount
    ✔ zkusd.func => addNonStakingAccount V2 (1259ms)
    ✔ zkusd.func => removeNonStakingAccount()
    ✔ zkusd.func => recoverClaim
    ✔ zkusd.func => claim
    ✔ zkusd.func => setGov
    ✔ zkusd.func => setInfo
    ✔ zkusd.func => setYieldTrackers
    ✔ zkusd.func => setInWhitelistMode
    ✔ zkusd.func => setWhitelistedHandler
    ✔ zkusd.func => totalStaked (1242ms)
    ✔ zkusd.func => balanceOf (1256ms)
    ✔ zkusd.func => stakedBalance (1253ms)
    ✔ zkusd.func => stakedBalance => v2 (1390ms)
    ✔ zkusd.func => transfer
    ✔ zkusd.func => approve + allowance
    ✔ zkusd.func => transferFrom

  ZKUSD -> YieldTokenStorage Test
    ✔ zkusd.parameters => name
    ✔ zkusd.parameters => nonStakingSupply
    ✔ zkusd.parameters => balances (1247ms)
    ✔ zkusd.parameters => nonStakingAccounts
    ✔ zkusd.parameters => admins
    ✔ zkusd.parameters => whitelist

  OrderBook -> OrderBookStorage test
    ✔ o.Paramter => PRICE_PRECISION
    ✔ check increase order - Long BTC (360ms)
    ✔ o.func => createIncreaseOrder - new (1550ms)
    ✔ OrderBookStorage.paramters => increaseOrdersIndex (1547ms)
    ✔ OrderBookStorage.paramters => increaseOrdersIndex V2 (1760ms)
order.purchaseToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
order.purchaseTokenAmount: 100000000000000000000
order.collateralToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
order.indexToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
order.sizeDelta: 100000000000000000000000000000000000
order.isLong: true
order.triggerPrice: 1400000000000000000000000000000000
order.triggerAboveThreshold: false
order.executionFee: 5000000000000000
    ✔ OrderBookStorage.paramters => increaseOrders => order0 (1671ms)
order.purchaseToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
order.purchaseTokenAmount: 100000000000000000000
order.collateralToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
order.indexToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
order.sizeDelta: 100000000000000000000000000000000000
order.isLong: true
order.triggerPrice: 1399000000000000000000000000000000
order.triggerAboveThreshold: false
order.executionFee: 5000000000000000
    ✔ OrderBookStorage.paramters => increaseOrders => order1 (1632ms)
order.purchaseToken: 0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9
order.purchaseTokenAmount: 100000000000000000000
order.collateralToken: 0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9
order.indexToken: 0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9
order.sizeDelta: 100000000000000000000000000000000000
order.isLong: true
order.triggerPrice: 1398000000000000000000000000000000
order.triggerAboveThreshold: false
order.executionFee: 5000000000000000
    ✔ OrderBookStorage.paramters => increaseOrders => order2 (1612ms)
order.purchaseToken: 0x851356ae760d987E095750cCeb3bC6014560891C
order.purchaseTokenAmount: 100000000000000000000
order.collateralToken: 0x851356ae760d987E095750cCeb3bC6014560891C
order.indexToken: 0x851356ae760d987E095750cCeb3bC6014560891C
order.sizeDelta: 100000000000000000000000000000000000
order.isLong: true
order.triggerPrice: 1397000000000000000000000000000000
order.triggerAboveThreshold: false
order.executionFee: 5000000000000000
    ✔ OrderBookStorage.paramters => increaseOrders => order3 (1618ms)
order.purchaseToken: 0x95401dc811bb5740090279Ba06cfA8fcF6113778
order.purchaseTokenAmount: 100000000000000000000
order.collateralToken: 0x95401dc811bb5740090279Ba06cfA8fcF6113778
order.indexToken: 0x95401dc811bb5740090279Ba06cfA8fcF6113778
order.sizeDelta: 100000000000000000000000000000000000
order.isLong: true
order.triggerPrice: 1396000000000000000000000000000000
order.triggerAboveThreshold: false
order.executionFee: 5000000000000000
    ✔ OrderBookStorage.paramters => increaseOrders => order4 (1743ms)
    ✔ OrderBookStorage.paramters => increaseOrdersIndex => v3 (1628ms)

  OrderBookReader -> OrderBookReader test
or.getIncreaseOrders: 100000000000000000000,100000000000000000000000000000000000,1,1400000000000000000000000000000000,0,100000000000000000000,100000000000000000000000000000000000,1,1399000000000000000000000000000000,0,100000000000000000000,100000000000000000000000000000000000,1,1398000000000000000000000000000000,0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9
    ✔ OrderR.paramters => getIncreaseOrders (1620ms)
or.getDecreaseOrders: 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000
    ✔ OrderR.paramters => getDecreaseOrders (1615ms)

  check deploy scripts =>  1_deploy -> x_deploy
    ✔ check BASE OPERATION (2479ms)
    ✔ check deploy scripts => 1_deploy
    ✔ check deploy scripts => 1_deploy v2
    ✔ check deploy scripts => 1_deploy v3
    ✔ check deploy scripts => 2_deploy
    ✔ check deploy scripts => 2_deploy v2 => settings
    ✔ check deploy scripts => 3_deply
    ✔ check deploy scripts => 3_deply v2 => settings
    ✔ check deploy scripts => 4_deploy => settings
    ✔ check deploy scripts => 5_deploy_staking
    ✔ check deploy scripts => x_add_order
    ✔ check deploy scripts => x_deploy_zkdxlv1

  check run scripts => 
    ✔ check BASE OPERATION (2420ms)
    ✔ check run scripts => calc.ts
balance1: 10000
balance2: 0
balance3: 0
balance4: 0
balance5: 0
balance6: 0
balance1: 10000
balance2: 3
balance3: 0
balance4: 0
balance5: 0
balance6: 0
    ✔ check run scripts => lv1.ts
scripts/ods.ts
scripts/ops.ts
    ✔ check run scripts => ods.ts + ops.ts
scripts/pyth.ts
    ✔ check run scripts => pyth.ts
NEWWETH: 0.0
    ✔ check helpers => helpers/chains.ts
    - check helpers => helpers/chains.ts v2
chainId: 31337, chainName: Local
chainId: 80001, chainName: Mumbai
chainId: 280, chainName: ZKSync Testnet
chainId: 280, chainName: ZKSync Testnet
chainId: 280, chainName: ZKSync Testnet
chainId: 324, chainName: ZKSync Mainnet
chainId: 324, chainName: ZKSync Mainnet
chainId: 324, chainName: ZKSync Mainnet
    ✔ check chains.ts => getFeedIdByChainAndToken

  check helpers scripts => 
    ✔ check constants.ts => 
------------------------------getWethConfig------------------------------
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,18,10000,100,1500000000000000000000000000,false,true,false
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,18,10000,100,1500000000000000000000000000,false,true,false
0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,8,10000,100,1500000000000000000000000000,false,true,false
0x851356ae760d987E095750cCeb3bC6014560891C,18,10000,80,0,true,false,false
0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00,18,10000,80,0,true,false,false
------------------------------getTokenConfig------------------------------
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,18,10000,80,1500000000000000000000000000,false,true,false
0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,18,10000,80,1500000000000000000000000000,false,true,false
0x851356ae760d987E095750cCeb3bC6014560891C,18,10000,80,1500000000000000000000000000,false,true,false
0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00,18,10000,80,1500000000000000000000000000,false,true,false
0x95401dc811bb5740090279Ba06cfA8fcF6113778,18,10000,80,1500000000000000000000000000,false,true,false
------------------------------getEquityConfig------------------------------
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,18,10000,80,1500000000000000000000000000,false,true,true
0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,18,10000,80,1500000000000000000000000000,false,true,true
0x851356ae760d987E095750cCeb3bC6014560891C,18,10000,80,1500000000000000000000000000,false,true,true
0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00,18,10000,80,1500000000000000000000000000,false,true,true
0x95401dc811bb5740090279Ba06cfA8fcF6113778,18,10000,80,1500000000000000000000000000,false,true,true
    ✔ check helpers/params.ts => getWNativeConfigByChainId
    ✔ check helpers/utils.ts => getContracts()
    ✔ check helpers/utils.ts => newWallet()
weth.mint 55896
blockTime: 1698297569
gas2: 0.000038796
    ✔ check helpers/utils.ts => reportGasUsed()
positionFee: 15.0
fundingFee: 0.0
liqPriceForFees: 1353.5
    ✔ check helpers/utils.ts => getLiqPriceForPosition() + getLiqPrice() (257ms)
sleep
wake up
------------------------------ SPLITTER ------------------------------
------------------------------hello world------------------------------
v.poolAmounts: 0.0
v.poolAmounts: 0.0
v.poolAmounts: 0.0
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
v.reservedAmounts: 0.0
------------------------------PRINTVAULT_POOL_RESERVED------------------------------
chainId: 31337
    ✔ check helpers/utils.ts => getNetworkCurrentTimestamp() (115ms)

  OrderBookSettings -> OrderBookSettings test
    ✔ Order.func => setMinExecutionFee (1626ms)
    ✔ order.func => setGov()
o.getIncreaseOrder(user0): 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,100000000000000000000,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,100000000000000000000000000000000000,true,1400000000000000000000000000000000,false,5000000000000000
o.getIncreaseOrder(user0): 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,100000000000000000000,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0,100000000000000000000000000000000000,true,1399000000000000000000000000000000,false,5000000000000000
o.getIncreaseOrder(user0): 0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,100000000000000000000,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,100000000000000000000000000000000000,true,1398000000000000000000000000000000,false,5000000000000000
o.getIncreaseOrder(user1): 0x851356ae760d987E095750cCeb3bC6014560891C,100000000000000000000,0x851356ae760d987E095750cCeb3bC6014560891C,0x851356ae760d987E095750cCeb3bC6014560891C,100000000000000000000000000000000000,true,1397000000000000000000000000000000,false,5000000000000000
o.getIncreaseOrder(owner): 0x95401dc811bb5740090279Ba06cfA8fcF6113778,100000000000000000000,0x95401dc811bb5740090279Ba06cfA8fcF6113778,0x95401dc811bb5740090279Ba06cfA8fcF6113778,100000000000000000000000000000000000,true,1396000000000000000000000000000000,false,5000000000000000
o.getIncreaseOrder(user0): 0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0,false,0,false,0
    ✔ order.func => getIncreaseOrder() (1737ms)
o.getDecreaseOrder(user0): 0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0,false,0,false,0
o.getDecreaseOrder(user0): 0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0,false,0,false,0
o.getDecreaseOrder(user0): 0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0,false,0,false,0
o.getDecreaseOrder(user1): 0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0,false,0,false,0
o.getDecreaseOrder(owner): 0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0,false,0,false,0
o.getDecreaseOrder(user0): 0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0,false,0,false,0
    ✔ order.func => getDecreaseOrder() (1639ms)

  OrderBook -> OrderBook test
    ✔ Order.func => createIncreaseOrder (1624ms)
    ✔ Order.func => cancelIncreaseOrder (1646ms)
    ✔ Order.func => executeIncreaseOrder (1768ms)

  OrderBook -> OrderBook test V2
    ✔ Order.func => executeIncreaseOrder => weth (107ms)
    ✔ Order.func => executeIncreaseOrder => weth v2 (108ms)
    ✔ Order.func => executeIncreaseOrder => wbtc (111ms)
    ✔ Order.func => executeIncreaseOrder => dai (49ms)
    ✔ Order.func => executeIncreaseOrder => tsla (107ms)
false
    ✔ Order.func => executeIncreaseOrder => weth (116ms)

  OrderBook -> OrderBook test V3 => DecreaseOrder
    ✔ Order.func => executeIncreaseOrder => tsla (108ms)
    ✔ Order.func => createDecreaseOrder + executeDecreaseOrder => weth (231ms)
    ✔ Order.func => updateDecreaseOrder => weth (153ms)
    ✔ Order.func => cancelDecreaseOrder => weth (141ms)

  PM -> PMSettings test
    ✔ PM.func => setOrderKeeper
    ✔ PM.func => setLiquidator
    ✔ PM.func => setPartner
    ✔ PM.func => setOpened
    ✔ PM.func => setShouldValidateIncreaseOrder
    ✔ PM.func => setOrderBook

  ZKDXLV1 -> ZKDXLV1 test
    ✔ zkdxlv1.func => constructor
    ✔ zkdxlv1.func => mint
    ✔ zkdxlv1.func => setBurnableAddress
    ✔ zkdxlv1.func => setEndTime
    ✔ zkdxlv1.func => burn
    ✔ zkdxlv1.func => multiTransfer

  ZKDX -> ZKDX test
    ✔ zkdx.func => constructor
    ✔ zkdx.params => isMinter
    ✔ zkdx.func => mint
    ✔ zkdx.func => burn

  ZkdxStaking -> ZkdxStaking + zkDX test
    ✔ esZkdxStaking.func => constructor
    ✔ esZkdxStaking.func => lastTimeRewardApplicable() (41ms)
    ✔ esZkdxStaking.func => rewardPerToken() (40ms)
    ✔ esZkdxStaking.parameters => totalSupply() (42ms)
    ✔ esZkdxStaking.Params => withdraw() (64ms)
    ✔ zkdxStaking.Params => earned() (57ms)
    ✔ zkdxStaking.Params => earned() v2 (65ms)
    ✔ zkdxStaking.Params => getReward() (66ms)
    ✔ zkdxStaking.func => setRewardsDuration() (49ms)
    ✔ zkdxStaking.func => setPaused()

  esZKDX -> esZKDX test
    ✔ esZKDX.func => constructor
    ✔ esZKDX.func => mint
    ✔ esZKDX.func => transfer
    ✔ esZKDX.parameters => whitelist
    ✔ esZKDX.parameters => setTax
    ✔ esZKDX.parameters => setTaxReceiver
    ✔ esZKDX.parameters => owner

  ZkdxStaking -> zkdxStaking + esZKDX test
    ✔ stakingETH.func => constructor
    ✔ stakingETH.func => stake
    ✔ stakingETH.func => stake => v2
    ✔ stakingETH.func => stake => v3
    ✔ stakingETH.func => stake + withdraw  (73ms)
    ✔ stakingETH.func => stake + withdraw + setLockPeriod (42ms)
    ✔ stakingETH.func => stake + withdraw + getReward
    ✔ stakingETH.func => stake + getReward => v2 (47ms)
_reward: 0.0
_reward: 11666685.9567901234563122
_reward: 11666705.2469135802464356
_reward: 11666705.2469135802464356
rewardToken: 38333294.7530864197535644
    ✔ stakingETH.func => stake + getReward => v3 (60ms)
rewardToken: 38333294.7530864197535644
earned: 0.0
earned: 0.0
earned: 0.0
rewardToken: 38333294.7530864197535644
earned: 0.0
earned: 0.0
earned: 0.0
rewardToken: 38333294.7530864197535644
earned: 0.0
earned: 0.0
earned: 0.0
    ✔ stakingETH.func => stake + getReward => v3 (100ms)
    ✔ stakingETH.func => stake + getReward => v4 (53ms)
stakingETH.lastTimeRewardApplicable: 1700889488
stakingETH.finishAt: 1700889488
stakingETH.updatedAt: 1698297491
    ✔ stakingETH.func => lastTimeRewardApplicable + finishAt
stakingETH.rewardPerTokenStored: 0.0
stakingETH.rewardRate: 19.290123456790123456
stakingETH.rewardPerToken: 499999.421296296296275816
    ✔ stakingETH.func => stake + getReward => v5

  ZkdxStaking -> zkdxStaking + esZKDX test
    ✔ stakingWETH.func => stake + getReward => v1
    ✔ stakingWETH.func => stake => v2 (46ms)
    ✔ stakingWETH.func => stake + withdraw  (69ms)
    ✔ stakingWETH.func => stake + withdraw => paused (73ms)
    ✔ stakingWETH.func => stake + withdraw => unPaused (72ms)

  ZkdxStakingETH -> ZkdxStakingETH + esZKDX test
    ✔ stakingETH.func => 
    ✔ stakingETH.func => stake
    ✔ stakingETH.params => weth
    ✔ stakingETH.params => stake + withdraw (75ms)
esZKDX.balanceOf(user0): 
            0.0
esZKDX.balanceOf(user0): 3888924.2541152263372891
esZKDX.balanceOf(user1): 3888911.3940329218105401
esZKDX.balanceOf(owner): 53888908.1790123456788528
stakingETH.earned(user0): 12777752.0576131687237562
stakingETH.earned(user1): 12777745.6275720164603818
stakingETH.earned(owner): 12777739.1975308641970074
    ✔ stakingETH.params => stake + getReward (76ms)

  ZkdxStaking -> ZkdxStakingUSDC + esZKDX test
    ✔ stakingETH.func => 
    ✔ stakingETH.func => stake
    ✔ stakingETH.params => weth
    ✔ stakingETH.params => stake + withdraw (97ms)
esZKDX.balanceOf(user0): 0.0
esZKDX.balanceOf(user0): 3888982.1244855967076594
esZKDX.balanceOf(user1): 3888930.6841563786006635
esZKDX.balanceOf(owner): 53888908.1790123456788528
stakingETH.earned(user0): 12777713.4773662551435093
stakingETH.earned(user1): 12777707.0473251028801349
stakingETH.earned(owner): 12777700.6172839506167605
    ✔ stakingETH.params => stake + getReward (98ms)
    ✔ stakingUSDC.func => setRewardsDuration()
    ✔ stakingUSDC.func => setPaused()
stakingUSDC.lastTimeRewardApplicable: 1698297498
stakingUSDC.rewardPerToken(): 0.868055555555555554
stakingUSDC.earned(user0): 86.8055555555555554
stakingUSDC.earned(user1): 28.9351851851851851
stakingUSDC.earned(owner): 0.0
    ✔ stakingUSDC.views => lastTimeRewardApplicable() (155ms)

  ZkdxStaking -> ZkdxStakingUSDC + ZkdxStakingETH test
    ✔ test Scenario =>  (2412ms)
    ✔ stakingUSDC.func => 
    ✔ stakingUSDC.params => totalSupply (43ms)
    ✔ stakingUSDC.params + stakingETH.Params
    ✔ stakingUSDC + stakingETH => stake (53ms)
    ✔ stakingUSDC + stakingETH => withdraw (76ms)
    ✔ stakingUSDC + stakingETH => getReward (81ms)
    ✔ stakingUSDC + stakingETH => parameters (45ms)
    ✔ stakingUSDC + stakingETH => parameters v2 (46ms)
    ✔ stakingETH.func => setRewardsDuration (48ms)
    ✔ stakingETH.func => setPaused (53ms)
    ✔ stakingETH.func => lastTimeRewardApplicable (45ms)
    ✔ stakingUSDC.parameters => v1 (56ms)
    ✔ stakingUSDC.func => setRewardsDuration (51ms)
    ✔ stakingUSDC.func => setPaused (58ms)
    ✔ stakingUSDC.func => setPaused (53ms)

  check PM TEST SCENARIO
    ✔ check dm => v1 (659ms)
0,false
averagePrice: 1500.0
    ✔ check dm => v2 (2410ms)
    ✔ check dm => vault.func => buyZKUSD (1931ms)
    ✔ check dm => vault.func => sellZKUSD (278ms)
    ✔ check router => vault.func => swap (302ms)
    ✔ check router => vault.func => swap v2 (243ms)
    ✔ check router => vault.func => directPoolDeposit (108ms)
    ✔ check router => vault.func => directPoolDeposit v2 (73ms)
    ✔ check router.func => swapETHToTokens + swapTokensToETH (145ms)
    ✔ check router => 
    ✔ check rr.func => mintAndStakeZkdlp (257ms)
    ✔ check vaultFeed.func  => ALL (268ms)


    ✔ check vaultUtils.func => ALL (401ms)
    ✔ check vault.func => ALL (605ms)
    ✔ check vault.func => ALL => v2 (483ms)
    ✔ check vault.func => all => v3 (514ms)
    ✔ check PM.func => all (142ms)
100900.000000000000002, 100900.000000000000002
1.00000000000000000001982160555, 1.00000000000000000001982160555
    ✔ check TEST SCENARIO => rr (711ms)
    ✔ check TEST SCENARIO => rr v2 (611ms)
    ✔ check TEST Scenario => PM (376ms)
    ✔ check TEST Scenario => PM => IPE (1895ms)
18000000000000000000000000000000000,1982000000000000000000000000000000,2000000000000000000000000000000000,0,9000000000000000000,0,true,1698297529
    ✔ check TEST Scenario => PM V3 (1777ms)
    ✔ check TEST Scenario => PM V4 (1745ms)
    ✔ check TEST Scenario => PM_LONG V5 (2280ms)
    ✔ check TEST Scenario => PM_SHORT V5 (2508ms)
size: 100000.0, collateral: 4400.0
size: 100000.0, collateral: 41900.0
size: 6000.0, collateral: 154.0
size: 99000.0, collateral: 3400.0
size: 99000.0, collateral: 40900.0
size: 5990.0, collateral: 144.0
    ✔ check scenario => PM_DP_LONG (3565ms)
    ✔ check scenario => PM_DP_LONG + PM_DP_SHORT (4142ms)

  check PM TEST SCENARIO => P2
    ✔ check scenario => OP_IP + OP_DP => liquidatePosition (3990ms)
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
1.0
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
100000.0
true
2000.0
false
0.005
------------------------------ SPLITTER ------------------------------
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
    ✔ check scenario => OP_IP + OP_DP  (4129ms)
size: 99000.0, 
                collateral: 3400.0,  
                averagePrice: 1500.0
0.666
size: 98900.0, 
                collateral: 3300.0,  
                averagePrice: 1500.0
0.7326
    ✔ check OP_IP + OP_DP => TRIGGER (4272ms)
    ✔ check OP_IP + OP_DP => TRIGGER (4748ms)
    ✔ check OP_IP + OP_DP => TRIGGER => v2 (5374ms)
    ✔ check OP_IP + OP_DP => TRIGGER => v3 (4760ms)
    ✔ check OP_IP + OP_DP => TRIGGER => v4 (3943ms)
    ✔ check OP_IP + OP_DP => TRIGGER => createDO_SHORT_ABOVE + createDO_SHORT_BELOW (4072ms)
    ✔ check OP_IP + OP_DP => TRIGGER => createDO_LONG_ABOVE (3929ms)
    ✔ check OP_IP + OP_DP => TRIGGER => createDO_LONG_BELOW (4047ms)
    ✔ createDO_LONG_BELOW + execute (4087ms)

  check PM TEST SCENARIO
    ✔ check pm.parameters => 
    ✔ check pm.parameters => maxGlobalLongSizes
    ✔ check pm.param => feeReserves (3070ms)
    ✔ check v.param => feeReserves (2889ms)
    ✔ check pm.params => opened
    ✔ check pm.params => isOrderKeeper
    ✔ check bpm.settings => setAdmin
    ✔ check bpm.func => withdrawFees (505ms)
    ✔ check pm.func => constructor
    ✔ check o.params => router
0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0,false,0,false,0
0x70997970C51812dc3A010C7d01b50e0d17dc79C8,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,100000000,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9,100000000000000000000000000000000000,true,25000000000000000000000000000000000,false,5000000000000000
    ✔ check o.params => increaseOrders + increaseOrdersIndex (147ms)
    ✔ check o.func => getIncreaseOrder (139ms)
    ✔ check router.params => 
    ✔ check router.func => addPlugin + removePlugins
    ✔ check shortsTracker.params => 
    ✔ check dlpManager => DLPMANAGER STORAGE (1614ms)
    ✔ check dlpManager => DLPMANAGER SETTINGS
815852.632160748573322031
815852.632160748573322031
815852.632160748573322031
815852.632160748573322031
    ✔ check dlpManager => DLPMANAGER (1728ms)
    ✔ check vault => VAULT STORAGE
    ✔ check vault => VAULT SETTINGS (139ms)
    ✔ check vault => VAULT STORAGE V2 (1563ms)
    ✔ check StakingETH => Parameters (72ms)
500009.6450617283948857
1000009.6450617283947097
2000011.5740740740736292
11000011.574074074072794
11000011.574074074072794
    ✔ check StakingUSDC => REWARDS v2 (54ms)
500009.6450617283948857
1000009.6450617283947097
2500011.5740740740737124
16000011.574074074073626
8999988.425925925926374
0.0
8999988.425925925926374
    ✔ check StakingETH => REWARDS (63ms)
    ✔ check Timelock.Params (154ms)
    ✔ check Timelock.Func => setHandler (62ms)
    ✔ check Timelock.Func => setPriceFeed
    ✔ check Timelock.Func => withdrawFees (1519ms)
    ✔ check Timelock.Func => transferIn
    ✔ check Timelock.Func => mint
    ✔ check Timelock.func => signalRedeemZkusd + redeemZkusd (1686ms)
    ✔ check Timelock.Func => setSwapFees
    ✔ check Timelock.Func => setFees (99ms)
0.0
1.0
815853.631960748573319166
1.0
    ✔ check Timelock.Func => updateZkusdSupply (2972ms)
    ✔ check Timelock.Func => set (51ms)
    ✔ check RR.func => initialize (226ms)
    ✔ check RR.func => mintAndStakeZkdlp + unstakeAndRedeemZkdlp (221ms)
    ✔ check esZKDX =>  (42ms)
    ✔ check ZKDXLV1 =>  (48ms)
    ✔ check zkdlp =>  (43ms)
    ✔ check zkdlp => v2 (55ms)
    ✔ check zkdlp => v3 (41ms)
    ✔ check zkdx => v3 (41ms)
    ✔ check zkusd (102ms)

  check Test VaultV2 => P1
    ✔ check AAPL => params
    ✔ check VaultV2 => 
    ✔ check VaultV2.func => IP => v1 (69ms)
size: 1000.0
col : 100.0
rsv : 6.25
------------------------------ SPLITTER ------------------------------
size: 2000.0
col : 200.0
rsv : 12.5
------------------------------ SPLITTER ------------------------------
size: 3000.0
col : 300.0
rsv : 18.75
------------------------------ SPLITTER ------------------------------
    ✔ check VaultV2.func => IP => v1 (82ms)
0,0
    ✔ check VaultV2.func => getLSPS => v1

  check Test VaultV2 => P1
    ✔ check VAULT.func (1505ms)
    ✔ check vault.func (86ms)
    ✔ check vault.func => buyZKUSD => wbtc + dai + tsla (338ms)
    ✔ check vault.func => sellZKUSD => weth (144ms)
    ✔ check vault.func => swap => dai 2 weth (340ms)
    ✔ check vault.func => swap => weth 2 dai (410ms)
    ✔ check HLP => params (66ms)
    ✔ check HLP => params (107ms)
    ✔ check aipc => params
    ✔ check hedge => params (2275ms)
    ✔ check orderBook => params (131ms)
    ✔ check orderBook => params v2 (1500ms)
0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0,false,0,false,0
    ✔ check orderBook => params v3 (1525ms)

  OmniZkdxStaking - Prigogine
1000.0
1000.0
    ✔ check mint suc
    ✔ check og1 => parameters
    ✔ check og1 => parameters v2 (42ms)

  BaseToken
    ✔ check bt.func => withdrawToken
    ✔ check bt.func => addNonStakingAccount
    ✔ check bt.func => _mint (69ms)
false
true
true
false
false
true
    ✔ check bt.func => _mint (93ms)
false
false
true
false
true
    ✔ check YieldToken.func => _mint (154ms)
    ✔ check YieldToken.func => withdrawToken (50ms)
    ✔ check esZKDX.func => _transfer (52ms)
    ✔ check esZKDX.func => _transfer v2 (41ms)
    ✔ check zkUSD.func => addVault (38ms)
0
3
    ✔ check zkdxLv1.func => _transfer (48ms)
    ✔ check MultiTransfer.func => multiTransfer
    ✔ check esZKDXOmni.func => mint
    ✔ check AIPC.FUNC => setPolicy (42ms)
false
true
false
true
    ✔ check Timelock.func => v1
[object Object]
    ✔ check PM.func => v1 (451ms)

  Readers
    ✔ check getVaultTokenInfo (62ms)
rate-0: 99
rate-1: 993
rate-2: 0
rate-3: 0
    ✔ check getFundingRates (246ms)

  Router
    ✔ r.func => setGov()
    ✔ r.func => addPlugin()
    ✔ r.func => pluginTransfer()
    ✔ r.func => pluginTransfer()
    ✔ r.func => pluginTransfer(owner,pm)
    ✔ check long position - Decrease (176ms)
    ✔ check swap, dai => weth (136ms)
    ✔ check swapETHToTokens, eth => dai (131ms)
    ✔ check swapTokensToETH, dai => eth (140ms)
    ✔ check swap under buffer amounts (144ms)

  Router By Prigogine
    ✔ Router.Parameters -- Part A
    ✔ Router.Funcs => setGov()
    ✔ Router.Parameters => gov
    ✔ Router.Funcs => addPlugin()

  ShortTracker
s.address: 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
    ✔ ShortTracker.func => setHandler
s.getNextGlobalShortData: 100,1000000000000000000
s.getRealisedPnl: 0
    ✔ ShortTracker.func => setHandler

  Vault
    ✔ Vault.func => setMaxLeverage (50ms)
    ✔ Vault.func => setMaxLeverage (45ms)
v.gov:: 0x0165878A594ca255338adfa4d48449f69242Eb8F
timelock.address: 0x0165878A594ca255338adfa4d48449f69242Eb8F
v.gov:: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
timelock.address: 0x0165878A594ca255338adfa4d48449f69242Eb8F
    ✔ Vault.func => setMaxLeverage
    ✔ Vault.func => setVaultUtils (61ms)
v.allWhitelistedTokensLength: 4
v.getNextFundingRate: 0
v.adjustForDecimals: 1234500000000000000
v.allWhitelistedTokensLength: 4
v.getPositionFee: 1
v.getPositionKey: 0xbb7a1d781560358701377753dd6178b49d9129346c81f95ea15a683d1682d4c3
v.getPosition: 0,0,0,0,0,0,true,0
    ✔ Vault.func => allWhitelistedTokensLength
v.getTargetZkusdAmount: 0
v.getEntryFundingRate: 0
v.getNextFundingRate: 0
    ✔ Vault.func => getTargetZkusdAmount
    ✔ Vault.func => clearTokenConfig (39ms)
    ✔ Vault.func => clearTokenConfig directly

  VaultPriceFeed.test
    ✔ check get price (63ms)

  ZKDLP
    ✔ check mint exceed max revert (245ms)
    ✔ check mint & redeem zkdlp with ether (258ms)
    ✔ check mint & redeem zkdlp with token (389ms)
    ✔ check get price & get aums (338ms)
    ✔ check buy zkdlp and open position (443ms)
    ✔ check guaranteedUsd hedge long positions' PnL in AUM (506ms)
    ✔ RewardRouterV2.func => mintAndStakeZkdlpETH() (118ms)
    ✔ ZkdlpManager.func => setInPrivateMode()
mm.getAumInZkusd: 0
mm.getAumInZkusd: 0
mm.getAum: 0
mm.getAum: 0
mm.getGlobalShortAveragePrice: 0
mm.getGlobalShortAveragePrice: 0
    ✔ ZkdlpManager.func => removeLiquidity(dai) 2 (242ms)

  ZKDXNFT
    ✔ check metadata
    ✔ check mint (117ms)
    ✔ check multi transfer erc20
    ✔ check multi transfer erc721 (52ms)
    ✔ check nft.func => setBaseURI() + setBaseExtension()
    ✔ check nft.func => setStartTime()
    ✔ check nft.func => setIsSimpleURI()
    ✔ check nft.func => setBalances()
true
ipfs://bafkreibjw5pxgc3k4owd5drdoaxanil4zcu2nul3et5oxqczgjiypctkly
ipfs://bafkreibjw5pxgc3k4owd5drdoaxanil4zcu2nul3et5oxqczgjiypctkly
ipfs://bafkreibjw5pxgc3k4owd5drdoaxanil4zcu2nul3et5oxqczgjiypctkly1

ipfs://bafkreibjw5pxgc3k4owd5drdoaxanil4zcu2nul3et5oxqczgjiypctkly

    ✔ check nft.func => tokenURI() (48ms)
    ✔ check nft.func => mint() (40ms)

  ZkdxStaking
    ✔ check stake & withdraw - USDC (46ms)
    ✔ check stake & withdraw - ETH (41ms)
    ✔ check raise reward rate (83ms)
    ✔ check lower reward rate (81ms)
    ✔ check lower reward rate (81ms)
    ✔ check StakingETH.func => setPaused (80ms)
    ✔ check StakingETH.func => _transferOutETH


  734 passing (5m)
  1 pending

--------------------------------------|----------|----------|----------|----------|----------------|
| File                                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
| ----------------------------------- | ------- | -------- | ------- | ------- | --------------- |
| access/                             | 100     | 100      | 100     | 100     |                 |
| Governable.sol                      | 100     | 100      | 100     | 100     |                 |
| access/interfaces/                  | 100     | 100      | 100     | 100     |                 |
| IAdmin.sol                          | 100     | 100      | 100     | 100     |                 |
| core/                               | 92.59   | 70.59    | 96.04   | 92.77   |                 |
| BasePositionManager.sol             | 94.44   | 87.5     | 83.33   | 96.15   | 30              |
| BasePriceConsumer.sol               | 100     | 100      | 100     | 100     |                 |
| OrderBook.sol                       | 72.73   | 43.55    | 82.35   | 75.73   | ... 267,270,271 |
| PositionManager.sol                 | 98.75   | 75.71    | 100     | 100     |                 |
| Router.sol                          | 100     | 70       | 100     | 100     |                 |
| ShortsTracker.sol                   | 92.11   | 75       | 100     | 80.39   | ... 81,84,87,88 |
| Vault.sol                           | 97.67   | 78.33    | 100     | 98.12   | 208,209,212,222 |
| VaultErrorController.sol            | 100     | 50       | 100     | 100     |                 |
| VaultPriceFeed.sol                  | 100     | 90       | 100     | 100     |                 |
| VaultUtils.sol                      | 89.06   | 75       | 100     | 95.45   | 30,31,76        |
| ZkdlpManager.sol                    | 93.15   | 67.31    | 100     | 92.13   | ... 172,173,174 |
| core/interfaces/                    | 100     | 100      | 100     | 100     |                 |
| IBasePositionManager.sol            | 100     | 100      | 100     | 100     |                 |
| IOrderBook.sol                      | 100     | 100      | 100     | 100     |                 |
| IPositionRouter.sol                 | 100     | 100      | 100     | 100     |                 |
| IPositionRouterCallbackReceiver.sol | 100     | 100      | 100     | 100     |                 |
| IRouter.sol                         | 100     | 100      | 100     | 100     |                 |
| IShortsTracker.sol                  | 100     | 100      | 100     | 100     |                 |
| IVault.sol                          | 100     | 100      | 100     | 100     |                 |
| IVaultPriceFeed.sol                 | 100     | 100      | 100     | 100     |                 |
| IVaultUtils.sol                     | 100     | 100      | 100     | 100     |                 |
| IZkdlpManager.sol                   | 100     | 100      | 100     | 100     |                 |
| core/settings/                      | 94.59   | 82.69    | 100     | 95.89   |                 |
| BasePositionManagerAggregator.sol   | 100     | 100      | 100     | 100     |                 |
| BasePositionManagerSettings.sol     | 97.1    | 81.25    | 100     | 97.26   | 48,89           |
| OrderBookSettings.sol               | 100     | 83.33    | 100     | 100     |                 |
| PositionManagerAggregator.sol       | 100     | 100      | 100     | 100     |                 |
| PositionManagerSettings.sol         | 100     | 100      | 100     | 100     |                 |
| RewardRouterV2Settings.sol          | 100     | 50       | 100     | 100     |                 |
| RouterSettings.sol                  | 72.22   | 57.14    | 100     | 66.67   | ... 25,27,33,35 |
| ShortsTrackerSettings.sol           | 100     | 90       | 100     | 100     |                 |
| VaultInternal.sol                   | 93.63   | 80.49    | 100     | 95.65   | ... 161,162,170 |
| VaultSettings.sol                   | 100     | 100      | 100     | 100     |                 |
| ZkdlpManagerSettings.sol            | 100     | 100      | 100     | 100     |                 |
| core/storage/                       | 91.67   | 91.18    | 91.67   | 92      |                 |
| BasePositionManagerStorage.sol      | 100     | 75       | 100     | 100     |                 |
| OrderBookAggregators.sol            | 100     | 100      | 100     | 100     |                 |
| OrderBookStorage.sol                | 100     | 100      | 100     | 100     |                 |
| PositionManagerStorage.sol          | 100     | 100      | 100     | 100     |                 |
| ReaderStorage.sol                   | 100     | 100      | 100     | 100     |                 |
| RewardRouterV2Aggregator.sol        | 100     | 100      | 100     | 100     |                 |
| RewardRouterV2Storage.sol           | 100     | 100      | 100     | 100     |                 |
| RouterStorage.sol                   | 100     | 100      | 100     | 100     |                 |
| ShortsTrackerAggregator.sol         | 100     | 100      | 100     | 100     |                 |
| ShortsTrackerStorage.sol            | 100     | 100      | 100     | 100     |                 |
| TimelockStorage.sol                 | 75      | 85.71    | 75      | 75      | 51,52           |
| VaultAggregators.sol                | 100     | 100      | 100     | 100     |                 |
| VaultStorage.sol                    | 100     | 100      | 100     | 100     |                 |
| VaultUtilsStorage.sol               | 100     | 100      | 100     | 100     |                 |
| YieldTokenStorage.sol               | 100     | 100      | 100     | 100     |                 |
| ZkdlpManagerAggregators.sol         | 100     | 100      | 100     | 100     |                 |
| ZkdlpManagerStorage.sol             | 100     | 100      | 100     | 100     |                 |
| core/v2/                            | 100     | 100      | 100     | 100     |                 |
| AIPC.sol                            | 100     | 100      | 100     | 100     |                 |
| HedgeManager.sol                    | 100     | 100      | 100     | 100     |                 |
| HedgeManagerSettings.sol            | 100     | 100      | 100     | 100     |                 |
| VaultV2.sol                         | 100     | 100      | 100     | 100     |                 |
| libraries/                          | 100     | 100      | 100     | 100     |                 |
| Constants.sol                       | 100     | 100      | 100     | 100     |                 |
| DataTypes.sol                       | 100     | 100      | 100     | 100     |                 |
| Errors.sol                          | 100     | 100      | 100     | 100     |                 |
| Events.sol                          | 100     | 100      | 100     | 100     |                 |
| NewDataTypes.sol                    | 100     | 100      | 100     | 100     |                 |
| libraries/token/                    | 100     | 100      | 100     | 100     |                 |
| IERC20.sol                          | 100     | 100      | 100     | 100     |                 |
| libraries/utils/                    | 100     | 50       | 100     | 100     |                 |
| ReentrancyGuard.sol                 | 100     | 50       | 100     | 100     |                 |
| omni/interfaces/                    | 100     | 100      | 100     | 100     |                 |
| IStargateRouterETH.sol              | 100     | 100      | 100     | 100     |                 |
| omni/token/                         | 100     | 100      | 100     | 100     |                 |
| esZKDXOmni.sol                      | 100     | 100      | 100     | 100     |                 |
| peripherals/                        | 100     | 100      | 100     | 100     |                 |
| MultiTransfer.sol                   | 100     | 100      | 100     | 100     |                 |
| OrderBookReader.sol                 | 100     | 100      | 100     | 100     |                 |
| peripherals/interfaces/             | 100     | 100      | 100     | 100     |                 |
| IHandlerTarget.sol                  | 100     | 100      | 100     | 100     |                 |
| ITimelock.sol                       | 100     | 100      | 100     | 100     |                 |
| ITimelockTarget.sol                 | 100     | 100      | 100     | 100     |                 |
| staking/                            | 100     | 80.91    | 100     | 100     |                 |
| RewardRouterV2.sol                  | 100     | 72.22    | 100     | 100     |                 |
| ZkdxStaking.sol                     | 100     | 84.09    | 100     | 100     |                 |
| ZkdxStakingETH.sol                  | 100     | 81.25    | 100     | 100     |                 |
| staking/interfaces/                 | 100     | 100      | 100     | 100     |                 |
| IRewardTracker.sol                  | 100     | 100      | 100     | 100     |                 |
| IVester.sol                         | 100     | 100      | 100     | 100     |                 |
| tokens/                             | 100     | 100      | 100     | 100     |                 |
| ZKDLP.sol                           | 100     | 100      | 100     | 100     |                 |
| ZKDX.sol                            | 100     | 100      | 100     | 100     |                 |
| ZKDXLV1.sol                         | 100     | 100      | 100     | 100     |                 |
| ZKUSD.sol                           | 100     | 100      | 100     | 100     |                 |
| esZKDX.sol                          | 100     | 100      | 100     | 100     |                 |
| tokens/base/                        | 100     | 99.15    | 100     | 100     |                 |
| BaseToken.sol                       | 100     | 100      | 100     | 100     |                 |
| MintableBaseToken.sol               | 100     | 100      | 100     | 100     |                 |
| YieldToken.sol                      | 100     | 98.08    | 100     | 100     |                 |
| tokens/interfaces/                  | 100     | 100      | 100     | 100     |                 |
| IBaseToken.sol                      | 100     | 100      | 100     | 100     |                 |
| IMintable.sol                       | 100     | 100      | 100     | 100     |                 |
| IWETH.sol                           | 100     | 100      | 100     | 100     |                 |
| IYieldToken.sol                     | 100     | 100      | 100     | 100     |                 |
| IYieldTracker.sol                   | 100     | 100      | 100     | 100     |                 |
| IZKUSD.sol                          | 100     | 100      | 100     | 100     |                 |
| tokens/nft/                         | 100     | 100      | 100     | 100     |                 |
| ZKDXNFT.sol                         | 100     | 100      | 100     | 100     |                 |
| All files  | 					94.75 | 		81.66 | 	98.66 | 95.56 	|      |





