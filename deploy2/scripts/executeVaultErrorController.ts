import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {errors} from "../../helpers/errors";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: executeVaultErrorController.ts"));
    const chainId = await getChainId();
    const Vault = await deployments.get("Vault");

    // VaultErrorController.setErrors
    const vec = await execute("VaultErrorController", await DefaultParams2(chainId),
        "setErrors", Vault.address, errors);
    await waitContractDeployed(vec, "VaultErrorController.setErrors");
};
export default func;
func.tags = ["staging", "executeVEC"];
