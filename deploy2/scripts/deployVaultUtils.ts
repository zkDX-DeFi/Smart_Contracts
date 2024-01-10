import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployVaultUtils.ts"));
    const Vault = await deployments.get("Vault");
    const chainId = await getChainId();

    // VaultUtils.deployed
    const VaultUtils = await deploy("VaultUtils", await DefaultParams2(chainId,
        {
            args: [
                Vault.address
            ]
        }));
    await waitContractDeployed(VaultUtils, "VaultUtils.deploy");
};
export default func;
func.tags = ["staging", "vaultUtils"];
