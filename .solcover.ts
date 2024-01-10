module.exports = {
    skipFiles: [
        '/peripherals/Reader.sol',
        'mock/',
        'core/v2/',
        'core/storage/OrderBookStorage.sol',
        'core/storage/PositionManagerStorage.sol',
        'core/OrderBook.sol',
        'core/settings/OrderBookSettings.sol',


        '/libraries/utils/Address.sol',
        '/libraries/token/SafeERC20.sol',
        '/libraries/math/SafeMath.sol',
        // '/core/OrderBook.sol',
        // '/core/settings/OrderBookSettings.sol',
        // '/core/storage/OrderBookStorage.sol',
        '/peripherals/Timelock.sol',
        '/tokens/tZKDX.sol',
        '/tokens/v2/',
        'omni/OmniZkdxStakingETH.sol',
        'omni/OmniZkdxStakingERC20.sol',
        '/core/v2/VaultV2Settings.sol',
        '/core/v2/ZKHLPManager.sol',
        '/core/v2/ZKHLPManagerSettings.sol',
    ],
    configureYulOptimizer: true,
};
