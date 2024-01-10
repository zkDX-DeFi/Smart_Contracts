import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";
import {VAULT_INIT_LIQUIDATION_FEE_USD} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: executeVaultInit.ts"));

    const Router = await deployments.get("Router");
    const ZKUSD = await deployments.get("ZKUSD");
    const VaultPriceFeed = await deployments.get("VaultPriceFeed");
    const VaultUtils = await deployments.get("VaultUtils");
    const VaultErrorController = await deployments.get("VaultErrorController");
    const chainId = await getChainId();

    /* VAULT INIT */
    const vault_initialize = await execute("Vault", await DefaultParams2(chainId), "initialize", Router.address, ZKUSD.address,
        VaultPriceFeed.address, VAULT_INIT_LIQUIDATION_FEE_USD, 10000, 10000);
    await waitContractDeployed(vault_initialize, "vault_initialize");
    const vault_setVU = await execute("Vault", await DefaultParams2(chainId), "setVaultUtils", VaultUtils.address);
    await waitContractDeployed(vault_setVU, "vault_setVU");
    const vault_setEC = await execute("Vault", await DefaultParams2(chainId), "setErrorController", VaultErrorController.address);
    await waitContractDeployed(vault_setEC, "vault_setEC");
};
export default func;
func.tags = ["staging", "executeVaultInit"];
