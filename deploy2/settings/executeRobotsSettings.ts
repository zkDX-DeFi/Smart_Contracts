import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2, isChainIdMainnet, isChainIdTestnet} from "../../helpers/chains";
import {ethers} from "hardhat";
import {getInterval, waitContractDeployed} from "../../helpers/utils";
import {sleep} from "../../helpers/utils2";
import {SHORT_INTERVAL_MULTIPLIER, WAIT_TX_IN_MS} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: executeRobotsSettings.ts"));
    const positionManager = await ethers.getContract("PositionManager");
    let chainId = await getChainId();
    // get Robots
    let robots = [];
    if (isChainIdTestnet(chainId)) {
        robots = [
            "0x3aaa18176100dd870903d465134d0522457aa70d",
            // "0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2",
            // "0x104b5cda666a504da51220035f930a77b22b8124",
        ]
    } else if (isChainIdMainnet(chainId)) {
        robots = [
            "0xe118d2e27cdbb2cf1e67000a22b9d6b57e06eb3a"
        ]
    }
    // pm.settings
    for (let i = 0; i < robots.length; i++) {
        await sleep(getInterval(chainId));
        const setLiquidator = await positionManager.setLiquidator(robots[i], true, await DefaultExecuteParams2(chainId));
        await waitContractDeployed(setLiquidator,"setLiquidator");

        await sleep(getInterval(chainId));
        const setOrderKeeper = await positionManager.setOrderKeeper(robots[i], true, await DefaultExecuteParams2(chainId));
        await waitContractDeployed(setOrderKeeper,"setOrderKeeper");
    }
};
export default func;
func.tags = ["staging", "executeRobotsSettings"];
