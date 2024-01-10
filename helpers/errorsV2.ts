// errorsV2.ts
export const ErrorsV2 = {
    OWNABLE_CALLER_IS_NOT_THE_OWNER : "Ownable: caller is not the owner",
    GOVERNABLE_FORBIDDEN        : "Governable: forbidden",
    YIELDTOKEN_FORBIDDEN        : "YieldToken: forbidden",
    BASEPOSITIONMANAGER_FORBIDDEN : "BasePositionManager: forbidden",


    Timelock_invalid_maxLeverage: "Timelock: invalid _maxLeverage",
    Timelock_Invalid_Target: "Timelock: invalid _target",
    Timelock_Invalid_Buffer: "Timelock: invalid _buffer",
    Timelock_Buffer_Cannot_Be_Decreased: "Timelock: buffer cannot be decreased",
    Timelock_invalid_fundingRateFactor: "Timelock: invalid _fundingRateFactor",
    Timelock_invalid_stableFundingRateFactor: "Timelock: invalid _stableFundingRateFactor",
    Timelock_invalid_minProfitBps: "Timelock: invalid _minProfitBps",
    Timelock_token_not_yet_whitelisted: "Timelock: token not yet whitelisted",
    TIMELOCK_INVALID_MAXGASPRICE: "Invalid _maxGasPrice",
    TIMELOCK_INVALID_LENGTHS: "Timelock: invalid lengths",
    TIMELOCK_MAXTOKENSUPPLY_EXCEEDED: "Timelock: maxTokenSupply exceeded",
    TIMELOCK_ACTION_ALREADY_SIGNALLED: "Timelock: action already signalled",
    TIMELOCK_ACTION_NOT_SIGNALLED: "Timelock: action not signalled",
    TIMELOCK_ACTION_TIME_NOT_YET_PASSED: "Timelock: action time not yet passed",
    TIMELOCK_INVALID_ACTION: "Timelock: invalid _action",
    TIMELOCK_INVALID_BUFFER: "Timelock: invalid _buffer",

    TIMELOCK_FORBIDDEN                      : "Timelock: forbidden",
    /* PriceFeed Error Message*/
    PriceFeed_forbidden: "PriceFeed: forbidden",
    /* ZKUSD.sol*/
    ZKUSD_FORBIDDEN: "ZKUSD: forbidden",
    /* BasePositionManagers.sol */
    BASEPOSITIONMANAGER_MARK_PRICE_LOWER_THAN_LIMIT: "BasePositionManager: mark price lower than limit",
    BASEPOSITIONMANAGER_MARK_PRICE_HIGHER_THAN_LIMIT: "BasePositionManager: mark price higher than limit",
    BASEPOSITIONMANAGER_INVALID_PATH_LENGTH: "BasePositionManager: invalid _path.length",
    BASEPOSITIONMANAGER_INSUFFICIENT_AMOUNTOUT: "BasePositionManager: insufficient amountOut",
    BASEPOSITIONMANAGER_MAX_GLOBAL_LONGS_EXCEEDED: "BasePositionManager: max global longs exceeded",
    BASEPOSITIONMANAGER_MAX_GLOBAL_SHORTS_EXCEEDED: "BasePositionManager: max global shorts exceeded",
    BASEPOSITIONMANAGER_INVALID_SENDER: "BasePositionManager: invalid sender",
    /* PositionManager.sol */
    POSITIONMANAGER_INVALID_PATH_LENGTH: "PositionManager: invalid _path.length",
    POSITIONMANAGER_INVALID_PATH: "PositionManager: invalid _path",
    POSITIONMANAGER_LONG_DEPOSIT: "PositionManager: long deposit",
    POSITIONMANAGER_LONG_LEVERAGE_DECREASE: "PositionManager: long leverage decrease",
    POSITIONMANAGER_FORBIDDEN: "PositionManager: forbidden",
    /* Router.sol*/
    ROUTER_FORBIDDEN: "Router: forbidden",
    /* ZkdlpManager.sol */
    ZKDLPMANAGER_ACTION_NOT_ENABLED: "ZkdlpManager: action not enabled",
    ZKDLPMANAGER_INVALID_WEIGHT: "ZkdlpManager: invalid weight",
    ZKDLPMANAGER_INVALID_COOLDOWNDURATION: "ZkdlpManager: invalid _cooldownDuration",
    ZKDLPMANAGER_INVALID_AMOUNT: "ZkdlpManager: invalid _amount",
    ZKDLPMANAGER_INSUFFICIENT_ZKUSD_OUTPUT: "ZkdlpManager: insufficient ZKUSD output",
    ZKDLPMANAGER_INSUFFICIENT_ZKDLP_OUTPUT: "ZkdlpManager: insufficient ZKDLP output",
    ZKDLPMANAGER_INVALID_ZKDLPAMOUNT: "ZkdlpManager: invalid _ZKDLPAmount",
    ZKDLPMANAGER_COOLDOWN_DURATION_NOT_YET_PASSED: "ZkdlpManager: cooldown duration not yet passed",
    ZKDLPMANAGER_INSUFFICIENT_OUTPUT: "ZkdlpManager: insufficient output",
    ZKDLPMANAGER_FORBIDDEN: "ZkdlpManager: forbidden",
    /* ShortsTrack.sol*/
    SHORTSTRACKER_FORBIDDEN: "ShortsTracker: forbidden",
    SHORTSTRACKER_INVALID_HANDLER: "ShortsTracker: invalid _handler",
    SHORTSTRACKER_ALREADY_MIGRATED: "ShortsTracker: already migrated",
    SHORTSTRACKER_OVERFLOW: "ShortsTracker: overflow",
    /* VaultUtils.sol*/
    VAULT_LOSSES_EXCEED_COLLATERAL: "Vault: losses exceed collateral",
    VAULT_FEES_EXCEED_COLLATERAL: "Vault: fees exceed collateral",
    VAULT_LIQUIDATION_FEES_EXCEED_COLLATERAL: "Vault: liquidation fees exceed collateral",
    VAULT_MAXLEVERAGE_EXCEEDED: "Vault: maxLeverage exceeded",
    /* VaultPriceFeed.sol*/
    VAULTPRICEFEED_FORBIDDEN: "VaultPriceFeed: forbidden",
    VAULTPRICEFEED_ADJUSTMENT_FREQUENCY_EXCEEDED: "VaultPriceFeed: adjustment frequency exceeded",
    VAULTPRICEFEED_INVALID_ADJUSTMENTBPS: "Vaultpricefeed: invalid _adjustmentBps",
    VAULTPRICEFEED_INVALID_SPREADBASISPOINTS: "VaultPriceFeed: invalid _spreadBasisPoints",
    VAULTPRICEFEED_INVALID_PRICESAMPLESPACE: "VaultPriceFeed: invalid _priceSampleSpace",


    VAULTPRICEFEED_INVALID_PRICE_FEED: "VaultPriceFeed: invalid price feed",
    VAULTPRICEFEED_INVALID_PRICE: "VaultPriceFeed: invalid price",
    CHAINLINK_FEEDS_ARE_NOT_BEING_UPDATED: "Chainlink feeds are not being updated",
    VAULTPRICEFEED_COULD_NOT_FETCH_PRICE: "VaultPriceFeed: could not fetch price",
    /* VaultInternal.sol*/
    VAULT_POOLAMOUNT_EXCEEDED: "Vault: poolAmount exceeded",
    VAULT_INSUFFICIENT_RESERVE: "Vault: insufficient reserve",
    VAULT_MAX_SHORTS_EXCEEDED: "Vault: max shorts exceeded",
    VAULT_POOLAMOUNT_BUFFER: "Vault: poolAmount < buffer",
    VAULT_INVALID_ERRORCONTROLLER: "Vault: invalid errorController",
    /* Router.sol */
    ROUTER_INVALID_SENDER: "Router: invalid sender",
    ROUTER_INVALID_PATH: "Router: invalid _path",
    ROUTER_MARK_PRICE_HIGHER_THAN_LIMIT: "Router: mark price higher than limit",
    ROUTER_MARK_PRICE_LOWER_THAN_LIMIT: "Router: mark price lower than limit",
    ROUTER_INVALID_PATH_LENGTH: "Router: invalid _path.length",
    ROUTER_INSUFFICIENT_AMOUNTOUT: "Router: insufficient amountOut",
    ROUTER_INVALID_PLUGIN: "Router: invalid plugin",
    ROUTER_PLUGIN_NOT_APPROVED: "Router: plugin not approved",
    /* OrderBook.sol*/
    ORDERBOOK_FORBIDDEN: "OrderBook: forbidden",
    ORDERBOOK_ALREADY_INITIALIZED: "OrderBook: already initialized",
    ORDERBOOK_INVALID_SENDER: "OrderBook: invalid sender",
    ORDERBOOK_INVALID_PATH_LENGTH: "OrderBook: invalid _path.length",
    ORDERBOOK_INVALID_PATH: "OrderBook: invalid _path",
    ORDERBOOK_INVALID_AMOUNTIN: "OrderBook: invalid _amountIn",
    ORDERBOOK_INSUFFICIENT_EXECUTION_FEE: "OrderBook: insufficient execution fee",
    ORDERBOOK_ONLY_WETH_COULD_BE_WRAPPED: "OrderBook: only weth could be wrapped",
    ORDERBOOK_INCORRECT_VALUE_TRANSFERRED: "OrderBook: incorrect value transferred",
    ORDERBOOK_INCORRECT_EXECUTION_FEE_TRANSFERRED: "OrderBook: incorrect execution fee transferred",
    ORDERBOOK_NON_EXISTENT_ORDER: "OrderBook: non-existent order",
    ORDERBOOK_INVALID_PRICE_FOR_EXECUTION: "OrderBook: invalid price for execution",
    ORDERBOOK_INSUFFICIENT_COLLATERAL: "OrderBook: insufficient collateral",
    ORDERBOOK_INSUFFICIENT_AMOUNTOUT: "OrderBook: insufficient amountOut",
    /* RewardRouterV2.sol */
    REWARDROUTER_INVALID_AMOUNT: "RewardRouter: invalid _amount",
    REWARDROUTER_INVALID_MSG_VALUE: "RewardRouter: invalid msg.value",
    REWARDROUTER_ALREADY_INITIALIZED: "RewardRouter: already initialized",
    REWARDROUTER_INVALID_ZKUSDAMOUNT: "RewardRouter: invalid _zkusdAmount",

    /* YieldToken.sol */
    YIELDTOKEN_ACCOUNT_ALREADY_MARKED: "YieldToken: _account already marked",
    YIELDTOKEN_ACCOUNT_NOT_MARKED: "YieldToken: _account not marked",
    YIELDTOKEN_TRANSFER_AMOUNT_EXCEEDS_ALLOWANCE: "YieldToken: transfer amount exceeds allowance",
    YIELDTOKEN_MINT_TO_THE_ZERO_ADDRESS: "YieldToken: mint to the zero address",
    YIELDTOKEN_BURN_FROM_THE_ZERO_ADDRESS: "YieldToken: burn from the zero address",
    YIELDTOKEN_BURN_AMOUNT_EXCEEDS_BALANCE: "YieldToken: burn amount exceeds balance",
    YIELDTOKEN_TRANSFER_FROM_THE_ZERO_ADDRESS: "YieldToken: transfer from the zero address",
    YIELDTOKEN_TRANSFER_TO_THE_ZERO_ADDRESS: "YieldToken: transfer to the zero address",
    YIELDTOKEN_MSG_SENDER_NOT_WHITELISTED: "YieldToken: msg.sender not whitelisted",
    YIELDTOKEN_TRANSFER_AMOUNT_EXCEEDS_BALANCE: "YieldToken: transfer amount exceeds balance",
    YIELDTOKEN_APPROVE_FROM_THE_ZERO_ADDRESS: "YieldToken: approve from the zero address",
    YIELDTOKEN_APPROVE_TO_THE_ZERO_ADDRESS: "YieldToken: approve to the zero address",

    MINTABLEBASETOKEN_FORBIDDEN: "MintableBaseToken: forbidden",
    BASETOKEN_FORBIDDEN: "BaseToken: forbidden",
    BASETOKEN_ACCOUNT_ALREADY_MARKED: "BaseToken: _account already marked",
    BASETOKEN_ACCOUNT_NOT_MARKED: "BaseToken: _account not marked",
    BASETOKEN_TRANSFER_AMOUNT_EXCEEDS_ALLOWANCE: "BaseToken: transfer amount exceeds allowance",
    BASETOKEN_MINT_TO_THE_ZERO_ADDRESS: "BaseToken: mint to the zero address",
    BASETOKEN_BURN_FROM_THE_ZERO_ADDRESS: "BaseToken: burn from the zero address",
    BASETOKEN_BURN_AMOUNT_EXCEEDS_BALANCE: "BaseToken: burn amount exceeds balance",
    BASETOKEN_TRANSFER_FROM_THE_ZERO_ADDRESS: "BaseToken: transfer from the zero address",
    BASETOKEN_TRANSFER_TO_THE_ZERO_ADDRESS: "BaseToken: transfer to the zero address",
    BASETOKEN_MSG_SENDER_NOT_WHITELISTED: "BaseToken: msg.sender not whitelisted",
    BASETOKEN_TRANSFER_AMOUNT_EXCEEDS_BALANCE: "BaseToken: transfer amount exceeds balance",
    BASETOKEN_APPROVE_FROM_THE_ZERO_ADDRESS: "BaseToken: approve from the zero address",
    BASETOKEN_APPROVE_TO_THE_ZERO_ADDRESS: "BaseToken: approve to the zero address",
};
