import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployReader.ts"));
    const chainId = await getChainId();

    // Reader.deployed
    const Reader = await deploy("Reader", await DefaultParams2(chainId));
    await waitContractDeployed(Reader, "Reader.deployed");
};
export default func;
func.tags = ["staging", "Reader"];
