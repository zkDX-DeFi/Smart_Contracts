import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: executeP2Settings.ts"));
    const PositionManager = await deployments.get("PositionManager");
    // const OrderBook = await deployments.get("OrderBook");
    const chainId = await getChainId();

    /* settings*/
    const ShortsTracker_setIsGlobalShortDataReady = await execute("ShortsTracker", await DefaultParams2(chainId)
        , "setIsGlobalShortDataReady", true);
    await waitContractDeployed(ShortsTracker_setIsGlobalShortDataReady,"ShortsTracker_setIsGlobalShortDataReady");

    const ShortsTracker_setHandler = await execute("ShortsTracker", await DefaultParams2(chainId),
        "setHandler", PositionManager.address, true);
    await waitContractDeployed(ShortsTracker_setHandler,"ShortsTracker_setHandler");

    const Router_addPlugin = await execute("Router",await DefaultParams2(chainId),
        "addPlugin", PositionManager.address);
    await waitContractDeployed(Router_addPlugin,"Router_addPlugin");

    const Timelock_setContractHandler = await execute("Timelock", await DefaultParams2(chainId),
        "setContractHandler", PositionManager.address, true);
    await waitContractDeployed(Timelock_setContractHandler,"Timelock_setContractHandler");

    const Timelock_setShouldToggleIsLeverageEnabled = await execute("Timelock", await DefaultParams2(chainId),
        "setShouldToggleIsLeverageEnabled", true);
    await waitContractDeployed(Timelock_setShouldToggleIsLeverageEnabled,"Timelock_setShouldToggleIsLeverageEnabled");

    // const Router_addPlugin2 = await execute("Router", await DefaultParams2(chainId),
    //     "addPlugin", OrderBook.address);
    // await waitContractDeployed(Router_addPlugin2,"Router_addPlugin2");
};
export default func;
func.tags = ["staging", "executeP2Settings"];
