import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployOrderBookReader.ts"));
    const chainId = await getChainId();
    // OrderBookReader.deployed
    const OrderBookReader = await deploy("OrderBookReader", await DefaultParams2(chainId));
    await waitContractDeployed(OrderBookReader, 'OrderBookReader.deployed');
};
export default func;
func.tags = ["staging", "orderBookReader"];
