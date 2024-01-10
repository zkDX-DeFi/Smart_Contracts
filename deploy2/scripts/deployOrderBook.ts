import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {minExecutionFee} from "../../helpers/params";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployOrderBook.ts"));
    const Vault = await deployments.get("Vault");
    const Router = await deployments.get("Router");
    const WNative = await deployments.get("WNative");
    const ZKUSD = await deployments.get("ZKUSD");
    const chainId = await getChainId();

    // OrderBook.deployed
    const OrderBook = await deploy("OrderBook", await DefaultParams2(chainId, {
        args: [Router.address, Vault.address, WNative.address, ZKUSD.address, minExecutionFee],
    }));
    await waitContractDeployed(OrderBook, "OrderBook.deployed");
};
export default func;
func.tags = ["staging", "orderBook"];
