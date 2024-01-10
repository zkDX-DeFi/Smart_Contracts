import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {getTokenConfig} from "../../helpers/params";
import {LTC_DEFAULT_AMOUNT} from "../../helpers/constants";
import {waitContractDeployed} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployLTC.ts"));
    const chainId = await getChainId();
    let tokens = [], feedIds = [];

    // Vault.Vault.setTokenConfig(LTC)
    const LTC = await getDeployByChainIdAndName(chainId, "LTC", "Token", ["LTC", 18, LTC_DEFAULT_AMOUNT, 0, 0]);
    const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getTokenConfig(LTC));
    await waitContractDeployed(Vault_setTokenConfig, "Vault.setTokenConfig(LTC)");

    // VaultPriceFeed.setFeedIds(LTC)
    tokens.push(LTC.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "LTC"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.setFeedIds");
};
export default func;
func.tags = ["staging", "LTC"];
