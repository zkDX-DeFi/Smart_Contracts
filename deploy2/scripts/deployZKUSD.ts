import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: ZKUSD.ts"));
    const chainId = await getChainId();
    const Vault = await deployments.get("Vault");

    // ZKUSD.deployed
    const ZKUSD = await deployments.deploy("ZKUSD", await DefaultParams2(chainId,
        {
            args: [
                Vault.address
            ]
        }));
    await waitContractDeployed(ZKUSD, "ZKUSD.deployed");
};
export default func;
func.tags = ["staging", "zkusd"];
