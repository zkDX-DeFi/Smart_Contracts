import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {ethers} from "hardhat";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {LONG_SIZE_AMOUNTS, SHORT_SIZE_AMOUNTS} from "../../helpers/constants";
import {getInterval, getWETHContract, waitContractDeployed} from "../../helpers/utils";
import {sleep} from "../../helpers/utils2";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: executePMSetMaxGlobalSizes2.ts"));
    const positionManager = await ethers.getContract("PositionManager");
    const chainId = await getChainId();

    // get Tokens
    const weth = await getWETHContract(chainId);
    const wbtc = await ethers.getContract("WBTC");
    const doge = await ethers.getContract("DOGE");

    // pm.setMaxGlobalSizes
    await sleep(getInterval(chainId));
    const setMaxGlobalSizes = await positionManager.setMaxGlobalSizes(
        [weth.address, wbtc.address, doge.address],
        [LONG_SIZE_AMOUNTS, LONG_SIZE_AMOUNTS, LONG_SIZE_AMOUNTS],
        [SHORT_SIZE_AMOUNTS, SHORT_SIZE_AMOUNTS, SHORT_SIZE_AMOUNTS],
        await DefaultExecuteParams2(chainId)
    );

    await waitContractDeployed(setMaxGlobalSizes, "pm.setMaxGlobalSizes");
};
export default func;
func.tags = ["staging", "executePMSetMaxGlobalSizes2"];
