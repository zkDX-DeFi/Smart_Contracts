import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployShortsTracker.ts"));
    const Vault = await deployments.get("Vault");
    const chainId = await getChainId();

    // ShortsTracker.deployed
    const ShortsTracker = await deploy("ShortsTracker", await DefaultParams2(chainId, {args: [Vault.address]}));
    await waitContractDeployed(ShortsTracker, "ShortsTracker.deployed");
};
export default func;
func.tags = ["staging", "shortsTracker"];
