import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {getTokenConfig} from "../../helpers/params";
import {waitContractDeployed} from "../../helpers/utils";
import {FIL_DEFAULT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployFIL.ts"));
    const chainId = await getChainId();
    let tokens = [], feedIds = [];

    // Vault.setTokenConfig
    const FIL = await getDeployByChainIdAndName(chainId, "FIL", "Token", ["FIL", 18, FIL_DEFAULT_AMOUNT, 0, 0]);
    const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getTokenConfig(FIL));
    await waitContractDeployed(Vault_setTokenConfig, "Vault.setTokenConfig(FIL)");

    // VaultPriceFeed.setFeedIds
    tokens.push(FIL.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "FIL"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.setFeedIds");
};
export default func;
func.tags = ["staging", "FIL"];
