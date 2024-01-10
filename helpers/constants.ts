import {parseUnits,parseEther} from "ethers/lib/utils";
import {EvmPriceServiceConnection} from "@pythnetwork/pyth-evm-js";

export const DEFAULT_WITHIN = 10000;
export const MEDIUM_WITHIN = 1000000000;
export const MAX_WITHIN = 0x1ffffffffffffe; // 0.009e18

// decimals
export const BASIS_POINTS_DIVISOR = 10000;
export const FUNDING_RATE_PRECISION = 1000000;

// fees
export const MARGIN_FEE_BASIS_POINTS = 10;
export const LIQUIDATION_FEE = parseUnits("5", 30); // $

// system
export const MAX_LEVERAGE = 100 * BASIS_POINTS_DIVISOR;

// chain ids
// testnet
export const CHAIN_ID_LOCAL = "31337";
export const CHAIN_ID_MUMBAI = "80001";
export const CHAIN_ID_ZKSYNC_TESTNET = "280";
export const CHAIN_ID_ARBITRUM_GOERLI = "421613";
export const CHAIN_ID_FUJI = "43113";
export const CHAIN_ID_GOERLI = "5";

export const CHAIN_ID_OPTIMISM_GOERLI = "420";
export const CHAIN_ID_CONFLUX_TEST = "71";
export const CHAIN_ID_LINEA_TESTNET = "59140";
export const CHAIN_ID_CELO_TEST = "44787";
export const CHAIN_ID_MANTLE_TEST = "5001";

export const CHAIN_ID_BASE_TEST = "84531";
export const CHAIN_ID_BASE_MAIN = "8453";
export const CHAIN_ID_BSC_TESTNET = "97";
export const CHAIN_ID_SCROLL_SEPOLIA = "534351";
export const CHAIN_ID_METIS_TESTNET = "599";

// mainnet
export const CHAIN_ID_OPTIMISM = "10"; //not used
export const CHAIN_ID_ZKSYNC_MAINNET = "324";
export const CHAIN_ID_LINEA_MAINNET = "59144";
export const CHAIN_ID_BASE_MAINNET = "8453";
export const CHAIN_ID_SCROLL_MAINNET = "534352";
export const CHAIN_ID_MANTLE_MAINNET = "5000";

// define chain names
// testnet
export const CHAIN_NAME_LOCAL = "Local";
export const CHAIN_NAME_MUMBAI = "Mumbai";
export const CHAIN_NAME_ZKSYNC_TESTNET = "ZKSync Testnet";
export const CHAIN_NAME_ARBITRUM_GOERLI = "Arbitrum Goerli";
export const CHAIN_NAME_FUJI = "Fuji";

export const CHAIN_NAME_OPTIMISM_GOERLI = "Optimism Goerli";
export const CHAIN_NAME_CONFLUX_TEST = "Conflux Test";
export const CHAIN_NAME_LINEA_TESTNET = "Linea Testnet";
export const CHAIN_NAME_CELO_TEST = "Celo Test";
export const CHAIN_NAME_MANTLE_TEST = "Mantle Test";

export const CHAIN_NAME_BASE_TEST = "Base Test";
export const CHAIN_NAME_BSC_TESTNET = "BSC Test";
export const CHAIN_NAME_SCROLL_SEPOLIA = "Scroll Sepolia";
export const CHAIN_NAME_METIS_TESTNET = "Metis Test";

// mainnet
export const CHAIN_NAME_OPTIMISM = "Optimism"; // not used
export const CHAIN_NAME_ZKSYNC_MAINNET = "ZKSync Mainnet";
export const CHAIN_NAME_LINEA_MAINNET = "Linea Mainet";
export const CHAIN_NAME_BASE_MAINNET = "Base Mainnet";
export const CHAIN_NAME_SCROLL_MAINNET = "Scroll Mainnet";
export const CHAIN_NAME_MANTLE_MAINNET = "Mantle Mainnet";

// feed ids - testnet
export const FEED_ID_BTC_TEST = "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b";
export const FEED_ID_ETH_TEST = "0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6";
export const FEED_ID_DAI_TEST = "0x87a67534df591d2dd5ec577ab3c75668a8e3d35e92e27bf29d9e2e52df8de412";
export const FEED_ID_USDC_TEST = "0x41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722";
export const FEED_ID_DOGE_TEST = "0x31775e1d6897129e8a84eeba975778fb50015b88039e9bc140bbd839694ac0ae";
export const FEED_ID_LTC_TEST = "0x997e0bf451cb36b4aea096e6b5c254d700922211dd933d9d17c467f0d6f34321";
export const FEED_ID_ARB_TEST = "0x37f40d2898159e8f2e52b93cb78f47cc3829a31e525ab975c49cc5c5d9176378";
export const FEED_ID_FIL_TEST = "0xb5622d32f36dc820af288aab779133ef1205d3123bbe256603849b820de48b87";
export const FEED_ID_MSFT_TEST = "0x4e10201a9ad79892f1b4e9a468908f061f330272c7987ddc6506a254f77becd7";
export const FEED_ID_TSLA_TEST = "0x7dac7cafc583cc4e1ce5c6772c444b8cd7addeecd5bedb341dfa037c770ae71e";
export const FEED_ID_ORDI_TEST = "0x2b4c2ab4993d0472b73b29f6598cb716d2be452389a9964f8db6cbec1bea3899";

// feed ids - mainnet
export const FEED_ID_BTC_MAIN = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
export const FEED_ID_ETH_MAIN = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
export const FEED_ID_USDC_MAIN = "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";
export const FEED_ID_DOGE_MAIN = "0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c";
export const FEED_ID_LTC_MAIN = "0x6e3f3fa8253588df9326580180233eb791e03b443a3ba7a1d892e73874e19a54";
export const FEED_ID_ARB_MAIN = "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5";
export const FEED_ID_FIL_MAIN = "0x150ac9b959aee0051e4091f0ef5216d941f590e1c5e7f91cf7635b5c11628c0e";
export const FEED_ID_MSFT_MAIN = "0xd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1";
export const FEED_ID_TSLA_MAIN = "0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1";
export const FEED_ID_ORDI_MAIN = "0x193c739db502aadcef37c2589738b1e37bdb257d58cf1ab3c7ebc8e6df4e3ec0";

// pyth - testnet
export const PYTH_CONTRACT_ZKSYNC_TESTNET = "0xC38B1dd611889Abc95d4E0a472A667c3671c08DE";
export const PYTH_CONTRACT_MUMBAI_TESTNET = "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C";
export const PYTH_CONTRACT_ARBITRUM_TESTNET = "0x939C0e902FF5B3F7BA666Cc8F6aC75EE76d3f900";
export const PYTH_CONTRACT_FUJI_TESTNET = "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C";
export const PYTH_CONTRACT_OPTIMISM_TESTNET = "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C";
export const PYTH_CONTRACT_CONFLUX_TESTNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
export const PYTH_CONTRACT_CELO_TESTNET = "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C";
export const PYTH_CONTRACT_LINEA_TESTNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
export const PYTH_CONTRACT_FANTOM_TESTNET = "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C";
export const PYTH_CONTRACT_MANTLE_TESTNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
export const PYTH_CONTRACT_BASE_TESTNET = "0x5955C1478F0dAD753C7E2B4dD1b4bC530C64749f";
export const PYTH_CONTRACT_BSC_TESTNET = "0xd7308b14BF4008e7C7196eC35610B1427C5702EA";
export const PYTH_CONTRACT_SCROLL_SEPOLIA = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
export const PYTH_CONTRACT_METIS_TESTNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
// pyth - mainnet
export const PYTH_CONTRACT_ZKSYNC_MAINNET = "0xf087c864AEccFb6A2Bf1Af6A0382B0d0f6c5D834";
export const PYTH_CONTRACT_LINEA_MAINNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
export const PYTH_CONTRACT_BASE_MAINNET = "0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a";
export const PYTB_CONTRACT_SCROLL_MAINNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
export const PYTH_CONTRACT_MANTLE_MAINNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";

// lz endpoints - testnet
export const ENDPOINT_MUMBAI = "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8";
export const ENDPOINT_ARBITRUM_GOERLI = "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab";
export const ENDPOINT_OPTIMISM_GOERLI = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
export const ENDPOINT_GOERLI = "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23";
export const ENDPOINT_FUJI = "0x93f54D755A063cE7bB9e6Ac47Eccc8e33411d706";
export const ENDPOINT_BSC_TESTNET = "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1";
export const ENDPOINT_LINEA_TESTNET = "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab";
export const ENDPOINT_BASE_TESTNET = "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab";
export const ENDPOINT_ZKSYNC_TESTNET = "0x093D2CF57f764f09C3c2Ac58a42A2601B8C79281";

// lz endpoints - mainnet
export const ENDPOINT_LINEA_MAINNET = "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7";
export const ENDPOINT_BASE_MAINNET = "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7";
export const ENDPOINT_ZKSYNC_MAINNET = "0x9b896c0e23220469C7AE69cb4BbAE391eAa4C8da";

// stg routers
export const STG_ROUTER_MUMBAI = "0x817436a076060D158204d955E5403b6Ed0A5fac0";
export const STG_ROUTER_ARBITRUM_GOERLI = "0xb850873f4c993Ac2405A1AdD71F6ca5D4d4d6b4f";
export const STG_ROUTER_OPTIMISM_GOERLI = "0x95461eF0e0ecabC049a5c4a6B98Ca7B335FAF068";
export const STG_ROUTER_OPTIMISM = "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b";
export const STG_ROUTER_LINEA_TESTNET = "0x631774c0B3FDB9502b3093a22aD91FA83fEc493e";
export const STG_ROUTER_GOERLI = "0x7612aE2a34E5A363E137De748801FB4c86499152";
export const STG_ROUTER_FUJI = "0x13093E05Eb890dfA6DacecBdE51d24DabAb2Faa1";
export const STG_ROUTER_BSC_TESTNET = "0xbB0f1be1E9CE9cB27EA5b0c3a85B7cc3381d8176";
export const STG_ROUTER_BASE_TESTNET = "0x631774c0B3FDB9502b3093a22aD91FA83fEc493e";

// stg routers eth
export const STG_ROUTER_ETH_GOERLI = "0xb1b2eeF380f21747944f46d28f683cD1FBB4d03c";
export const STG_ROUTER_ETH_OPTIMISM_GOERLI = "0xb1b2eeF380f21747944f46d28f683cD1FBB4d03c";
export const STG_ROUTER_ETH_LINEA_MAINNET = "0x8731d54E9D02c286767d56ac03e8037C07e01e98";
export const STG_ROUTER_ETH_BASE_MAINNET = "0x50B6EbC2103BFEc165949CC946d739d5650d7ae4";

// stg usdc
export const STG_USDC_MUMBAI = "0x742DfA5Aa70a8212857966D491D67B09Ce7D6ec7";
export const STG_USDC_ARBITRUM_GOERLI = "0x6aAd876244E7A1Ad44Ec4824Ce813729E5B6C291";
export const STG_USDC_OPTIMISM_GOERLI = "0x0CEDBAF2D0bFF895C861c5422544090EEdC653Bf";
export const STG_USDC_FUJI = "0x4A0D1092E9df255cf95D72834Ea9255132782318";
export const STG_USDC_GOERLI = "0xDf0360Ad8C5ccf25095Aa97ee5F2785c8d848620";
export const STG_USDC_LINEA_TESTNET = "0x78136C68561996d36a3B053C99c7ADC62B673644";
export const STG_USDC_BASE_TESTNET = "0x5C8ef0FA2b094276520D25dEf4725F93467227bC";

// omni networks
// export const OMNI_PRIMARY_NETWORK = "goerli";
// export const OMNI_SECONDARY_NETWORK = "optimism_goerli";
export const OMNI_PRIMARY_NETWORK = "linea_mainnet";
export const OMNI_SECONDARY_NETWORK = "base_mainnet";

// pool ids
export const STG_POOL_ID_USDC = 1;
export const STG_POOL_ID_ETH = 13;

// deploy params
export const WETH_ZKSYNC_MAINNET = "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91";
export const USDC_ZKSYNC_MAINNET = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4";
export const WETH_LINEA_MAINNET = "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f";
export const USDC_LINEA_MAINNET = "0x176211869cA2b568f2A7D4EE941E073a821EE1ff";

export const GAS_LIMIT = 14000000;
export const GAS_PRICE = parseUnits("5", "gwei"); // 3G : mainnet
export const WBTC_DECIMALS = 8;


export const ANOTHER_USER_ADDRESS = '0xafc183BE937367B219F9283916d352f2C03ff512';
// export const ANOTHER_USER_ADDRESS = '0x4A8C673bdBC78132D46d5Abd9191debc9c10eBB6';

export const MAX_USDM_AMOUNTS = parseEther("3000000000"); // 3B
export const MAX_USDM_AMOUNTS_EQUITY = parseEther("1500000000"); // 1.5B
export const MAX_USDM_AMOUNTS_TOKEN = parseEther("1500000000"); // 1.5B
export const MAX_USDM_AMOUNTS_WBTC = parseEther("1500000000"); // 1.5B
export const MAX_USDM_AMOUNTS_WETH = parseEther("1500000000"); // 1.5B
export const MAX_USDM_AMOUNTS_WMATIC = parseEther("1500000000"); // 1.5B
export const SINGLE_MINT_USDC_AMOUNTS = parseEther("50000000"); // 50M

export const LONG_SIZE_AMOUNTS = parseUnits("200", 30);
export const SHORT_SIZE_AMOUNTS = parseUnits("200", 30);

export const ARB_MINT_AMOUNT = parseEther("600000000"); //600M
export const FILE_MINT_AMOUNT = parseEther("100000000"); //100M
export const LTC_MINT_AMOUNT = parseEther("6000000"); //6M
export const MSFT_MINT_AMOUNT = parseEther("600000"); //600K
export const TSLA_MINT_AMOUNT = parseEther("600000"); //600K
export const USDC_MINT_AMOUNT = parseEther("10000");

export const WBTC_MINT_AMOUNT = parseUnits("0.1", WBTC_DECIMALS);
export const WETH_MINT_AMOUNT = parseEther("1");
export const ZUSD_MINT_AMOUNT = parseEther("10000");
export const DOGE_MINT_AMOUNT = parseEther("10000");
export const ORDI_MINT_AMOUNT = parseEther("200");

export const LTC_DEFAULT_AMOUNT = parseEther("100000000"); //100M
export const FIL_DEFAULT_AMOUNT = parseEther("100000000"); //100M
export const ARB_DEFAULT_AMOUNT = parseEther("100000000"); //100M
export const DOGE_DEFAULT_AMOUNT = parseEther("100000000"); //100M
export const MSFT_DEFAULT_AMOUNT = parseEther("100000000"); //100M
export const TSLA_DEFAULT_AMOUNT = parseEther("100000000"); //100M
export const WBTC_DEFAULT_AMOUNT = parseUnits("10000", 8); //10K
export const WETH_DEFAULT_AMOUNT = parseEther("100000"); //100K
export const VAULT_INIT_LIQUIDATION_FEE_USD = parseUnits("5", 30)
export const USDC_DEFAULT_AMOUNT = parseEther("10000000000"); //10B
export const USDC_FAUCT_AMOUNT = parseEther("100000"); //100K
export const USDC_FAUCET_INTERVAL = 86400; // 1 day = 86400s
export const VAULTPRICEFEED_VALIDTIME = 45; // 45s
export const TIMELOCK_MINPROFITTIME = 60 * 60; // 1 hour = 3600s

export const DEFAULT_ESZKDX_AMOUNT = parseEther("50000000"); // 50M
export const STAKING_ETH_PERIOD = 86400 * 30; // 30 days = 2592000s
export const STAKING_USDC_PERIOD = 86400 * 30; // 30 days = 2592000s

export const STAKING_TRANSFER_AMOUNT = parseEther("25000000"); // 25M
export const STAKING_REWARD_AMOUNT = parseEther("5000000"); // 5M

export const connection = new EvmPriceServiceConnection("https://hermes-beta.pyth.network");
export const connectionMain = new EvmPriceServiceConnection("https://hermes.pyth.network");
export const DEPOSIT_FEE = 50; // 0.5%

// DEPLOY TASK
export const IS_DEPLOY_STAKING = false;
export const IS_TOKEN_MINT = true;
export const IS_TOKEN_BUY_IN = true;
export const IS_PYTH_PRE_DEPLOYED = true;
export const WAIT_TX_IN_MS = 500; // 0.5s
export const WAIT_SCRIPT_IN_MS = 500; // 0.5s
export const TIMEOUT_IN_MS = 300000; // 5 min
export const VERY_SHORT_INTERVAL_MULTIPLIER = 3;
export const SHORT_INTERVAL_MULTIPLIER = 6;
export const MEDIUM_INTERVAL_MULTIPLIER = 12;
export const LONG_INTERVAL_MULTIPLIER = 24;
