import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployZKDX.ts"));
    const chainId = await getChainId();

    // ZKDX.DEPLOYED
    const ZKDX = await deploy("ZKDX", await DefaultParams2(chainId));
    await waitContractDeployed(ZKDX, "ZKDX.DEPLOYED");
};
export default func;
func.tags = ["staging", "ZKDX"];
