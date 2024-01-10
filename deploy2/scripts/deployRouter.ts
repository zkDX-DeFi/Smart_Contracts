import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: deployRouter.ts"));
    const chainId = await getChainId();
    const Vault = await deployments.get("Vault");
    const ZKUSD = await deployments.get("ZKUSD");
    const WNative = await deployments.get("WNative");

    // Router.deployed
    const Router = await deployments.deploy("Router", await DefaultParams2(chainId,
        {
            args: [
                Vault.address,
                ZKUSD.address,
                WNative.address
            ]
        }));
    await waitContractDeployed(Router, "Router.deployed");
};
export default func;
func.tags = ["staging", "router"];
