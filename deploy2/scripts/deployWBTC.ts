import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {getWbtcConfig} from "../../helpers/params";
import {WBTC_DEFAULT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployWBTC.ts"));

    // Vault.setTokenConfig(WBTC)
    const chainId = await getChainId();
    let tokens = [], feedIds = [];
    const WBTC = await getDeployByChainIdAndName(chainId, "WBTC", "Token2", ["WBTC", 8, 0, 0, 0]);
    const Vault_setTokenConfig =  await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getWbtcConfig(WBTC));
    await waitContractDeployed(Vault_setTokenConfig, ">> Vault.setTokenConfig(WBTC)");

    // VaultPriceFeed.setFeedIds(WBTC)
    tokens.push(WBTC.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "WBTC"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, ">> VaultPriceFeed.setFeedIds(WBTC)");
};
export default func;
func.tags = ["staging", "WBTC"];
