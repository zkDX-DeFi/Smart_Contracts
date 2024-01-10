import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {getTokenConfig} from "../../helpers/params";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute, get} = deployments;
    console.log(chalk.greenBright(">> scripts: deployORDI.ts"));
    const chainId = await getChainId();
    const Vault = await get("Vault");
    let tokens = [], feedIds = [];

    // Vault.setTokenConfig(ORDI)
    const ORDI = await getDeployByChainIdAndName(chainId, "ORDI", "Token", ["ORDI", 18, 0, 0, 0]);
    const Vault_setTokenConfig = await execute("Timelock", await DefaultParams2(chainId), "setTokenConfig", Vault.address, ...getTokenConfig(ORDI));
    await waitContractDeployed(Vault_setTokenConfig, "Vault.setTokenConfig(ORDI)");

    // VaultPriceFeed.setFeedIds(ORDI)
    tokens.push(ORDI.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "ORDI"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.setFeedIds(ORDI)");
};
export default func;
func.tags = ["staging", "ORDI"];
