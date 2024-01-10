import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployVaultErrorController.ts"));
    const chainId = await getChainId();

    // VaultErrorController.deployed
    const VaultErrorController = await deploy("VaultErrorController", await DefaultParams2(chainId));
    await waitContractDeployed(VaultErrorController, "VaultErrorController.deployed");
};
export default func;
func.tags = ["staging", "vaultErrorController"];
