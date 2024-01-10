import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployZKDLP.ts"));
    const chainId = await getChainId();

    // ZKDLP.deployed
    const ZKDLP = await deploy("ZKDLP", await DefaultParams2(chainId));
    await waitContractDeployed(ZKDLP,"ZKDLP.deployed");
};
export default func;
func.tags = ["staging", "deployZKDLP"];
