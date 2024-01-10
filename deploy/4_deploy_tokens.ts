import {DeployFunction} from "hardhat-deploy/types";
import {
    DISTINCT_CHAIN_IDS,
    getDeployByChainIdAndName,
    getFeedIdByChainAndToken
} from "../helpers/chains";
import {
    getDaiConfig,
    getEquityConfig,
    getTokenConfig,
    getUsdcConfig,
    getWbtcConfig,
    getWethConfig,
    getWNativeConfigByChainId
} from "../helpers/params";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {CHAIN_ID_LOCAL, CHAIN_ID_ZKSYNC_MAINNET, CHAIN_ID_ZKSYNC_TESTNET, FEED_ID_DAI_TEST} from "../helpers/constants";
import {updateMarkPrice} from "../helpers/utilsForTest";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {
    const {execute, get} = deployments;
    const {owner} = await getNamedAccounts();
    const chainId = await getChainId();

    console.log(">> deploying tokens...");

    let tokens = [], feedIds = [];

    // WETH
    let WETH;
    if (DISTINCT_CHAIN_IDS.includes(chainId)) {
        // WNative
        const WNative = await get("WNative");
        await execute("Vault", {from: owner}, "setTokenConfig", ...getWNativeConfigByChainId(WNative, chainId));
        WETH = await getDeployByChainIdAndName(chainId, "WETH", "Token", ["WETH", 18, parseEther("100000"), parseEther("0"), 0]);
    } else {
        WETH = await get("WNative");
    }
    await execute("Vault", {from: owner}, "setTokenConfig", ...getWethConfig(WETH));
    tokens.push(WETH.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "WETH"));

    // WBTC
    const WBTC = await getDeployByChainIdAndName(chainId, "WBTC", "Token", ["WBTC", 8, parseUnits("10000", 8), parseUnits("0", 8), 0]);
    await execute("Vault", {from: owner}, "setTokenConfig", ...getWbtcConfig(WBTC));
    tokens.push(WBTC.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "WBTC"));

    if (CHAIN_ID_ZKSYNC_TESTNET == chainId || CHAIN_ID_ZKSYNC_MAINNET == chainId) {
        // USDC
        let usdcInterval = 86400;
        if (CHAIN_ID_ZKSYNC_TESTNET == chainId)
            usdcInterval = 0;
        const USDC = await getDeployByChainIdAndName(chainId, "USDC", "Token", ["USDC", 18, parseEther("10000000000"), parseEther("100000"), usdcInterval]);
        await execute("Vault", {from: owner}, "setTokenConfig", ...getUsdcConfig(USDC));
        tokens.push(USDC.address);
        feedIds.push(getFeedIdByChainAndToken(chainId, "USDC"));
    } else {
        // DAI
        const DAI = await getDeployByChainIdAndName(chainId, "DAI", "Token", ["DAI", 18, parseEther("100000000"), parseEther("10000"), 0]);
        await execute("Vault", {from: owner}, "setTokenConfig", ...getDaiConfig(DAI));
        tokens.push(DAI.address);
        feedIds.push(FEED_ID_DAI_TEST);
    }

    if (CHAIN_ID_ZKSYNC_TESTNET == chainId || CHAIN_ID_ZKSYNC_MAINNET == chainId) {
        console.log(">> deploying more tokens...");
        const DOGE = await getDeployByChainIdAndName(chainId, "DOGE", "Token", ["DOGE", 18, parseEther("100000000"), parseEther("0"), 0]);
        await execute("Vault", {from: owner}, "setTokenConfig", ...getTokenConfig(DOGE));
        tokens.push(DOGE.address);
        feedIds.push(getFeedIdByChainAndToken(chainId, "DOGE"));

        const LTC = await getDeployByChainIdAndName(chainId, "LTC", "Token", ["LTC", 18, parseEther("100000000"), parseEther("0"), 0]);
        await execute("Vault", {from: owner}, "setTokenConfig", ...getTokenConfig(LTC));
        tokens.push(LTC.address);
        feedIds.push(getFeedIdByChainAndToken(chainId, "LTC"));

        const ARB = await getDeployByChainIdAndName(chainId, "ARB", "Token", ["ARB", 18, parseEther("100000000"), parseEther("0"), 0]);
        await execute("Vault", {from: owner}, "setTokenConfig", ...getTokenConfig(ARB));
        tokens.push(ARB.address);
        feedIds.push(getFeedIdByChainAndToken(chainId, "ARB"));

        const FIL = await getDeployByChainIdAndName(chainId, "FIL", "Token", ["FIL", 18, parseEther("100000000"), parseEther("0"), 0]);
        await execute("Vault", {from: owner}, "setTokenConfig", ...getTokenConfig(FIL));
        tokens.push(FIL.address);
        feedIds.push(getFeedIdByChainAndToken(chainId, "FIL"));

        const MSFT = await getDeployByChainIdAndName(chainId, "MSFT", "Token", ["MSFT", 18, parseEther("100000000"), parseEther("0"), 0]);
        await execute("Vault", {from: owner}, "setTokenConfig", ...getEquityConfig(MSFT));
        tokens.push(MSFT.address);
        feedIds.push(getFeedIdByChainAndToken(chainId, "MSFT"));
    }

    const TSLA = await getDeployByChainIdAndName(chainId, "TSLA", "Token", ["TSLA", 18, parseEther("100000000"), parseEther("0"), 0]);
    await execute("Vault", {from: owner}, "setTokenConfig", ...getEquityConfig(TSLA));
    tokens.push(TSLA.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "TSLA"));

    // set feedIds
    await execute("VaultPriceFeed", {from: owner}, "setFeedIds", tokens, feedIds);
    if (CHAIN_ID_LOCAL == chainId) await updateMarkPrice(['TSLA']);

};
export default func;
func.tags = ["tokens"];
