import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {DEFAULT_ESZKDX_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: deployESZKDX.ts"));
    const {deploy} = deployments;
    const chainId = await getChainId();

    // esZKDX.deployed
    const esZKDX = await deploy("esZKDX", await DefaultParams2(chainId,{args: [DEFAULT_ESZKDX_AMOUNT]}));
    await waitContractDeployed(esZKDX, "esZKDX.deployed");
};
export default func;
func.tags = ["staging", "ESZKDX"];
