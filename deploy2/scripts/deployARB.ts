import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {getTokenConfig} from "../../helpers/params";
import {ARB_DEFAULT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployARB.ts"));
    const chainId = await getChainId();
    let tokens = [], feedIds = [];

    // Vault.setTokenConfig(ARB)
    const ARB = await getDeployByChainIdAndName(chainId, "ARB", "Token", ["ARB", 18, ARB_DEFAULT_AMOUNT, 0, 0]);
    const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getTokenConfig(ARB));
    await waitContractDeployed(Vault_setTokenConfig, "Vault.setTokenConfig(ARB)");

    // VaultPriceFeed.setFeedIds(ARB)
    tokens.push(ARB.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "ARB"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.setFeedIds(ARB)");
};
export default func;
func.tags = ["staging", "ARB"];
