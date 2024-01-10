import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken, isChainIdMainnet, isChainIdTestnet} from "../../helpers/chains";
import {getUSDCInterval, waitContractDeployed} from "../../helpers/utils";
import {parseEther} from "ethers/lib/utils";
import {getDaiConfig, getUsdcConfig} from "../../helpers/params";
import {FEED_ID_DAI_TEST, USDC_DEFAULT_AMOUNT, USDC_FAUCT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployStableToken.ts"));
    const chainId = await getChainId();
    let tokens = [], feedIds = [];

    if (isChainIdTestnet(chainId) || isChainIdMainnet(chainId)) {
        // USDC
        const usdcInterval = getUSDCInterval(chainId);
        // if (isChainIdTestnet(chainId)) usdcInterval = 0;
        const USDC = await getDeployByChainIdAndName(chainId, "USDC", "Token", ["USDC", 18, USDC_DEFAULT_AMOUNT, USDC_FAUCT_AMOUNT, usdcInterval]);

        const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getUsdcConfig(USDC));
        await waitContractDeployed(Vault_setTokenConfig, ">> Vault.setTokenConfig");
        tokens.push(USDC.address);
        feedIds.push(getFeedIdByChainAndToken(chainId, "USDC"));
    } else {
        // DAI
        const DAI = await getDeployByChainIdAndName(chainId, "DAI", "Token", ["DAI", 18, parseEther("100000000"), parseEther("10000"), 0]);
        await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getDaiConfig(DAI));
        tokens.push(DAI.address);
        feedIds.push(FEED_ID_DAI_TEST);
    }

    // VaultPriceFeed.setFeedIds
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, ">> VaultPriceFeed.setFeedIds");
};
export default func;
func.tags = ["staging", "StableToken"];
