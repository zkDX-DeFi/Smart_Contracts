import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployVault.ts"));
    const chainId = await getChainId();
    // Vault.deployed
    const Vault = await deploy("Vault", await DefaultParams2(chainId));
    await waitContractDeployed(Vault, ">> Vault.deployed");
};
export default func;
func.tags = ["staging", "deployVault"];
