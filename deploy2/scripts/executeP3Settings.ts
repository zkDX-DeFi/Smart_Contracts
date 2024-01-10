import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: executeP3Settings.ts"));
    const ZkdlpManager = await deployments.get("ZkdlpManager");
    const ZKDX = await deployments.get("ZKDX");
    const ZKDLP = await deployments.get("ZKDLP");
    const RewardRouter = await deployments.get("RewardRouter");
    const WNative = await deployments.get("WNative");
    const chainId = await getChainId();

    // settings
    const ZKDLP_setMinter = await execute("ZKDLP", await DefaultParams2(chainId),
        "setMinter", ZkdlpManager.address, true);
    await waitContractDeployed(ZKDLP_setMinter, "ZKDLP_setMinter");

    const RewardRouter_initialize = await execute("RewardRouter", await DefaultParams2(chainId),
        "initialize", WNative.address, ZKDX.address, ZKDLP.address, ZkdlpManager.address);
    await waitContractDeployed(RewardRouter_initialize, "RewardRouter_initialize");

    const ZkdlpManager_setHandler =
        await execute("ZkdlpManager", await DefaultParams2(chainId), "setHandler", RewardRouter.address, true);
    await waitContractDeployed(ZkdlpManager_setHandler, "ZkdlpManager_setHandler");

    const ZkdlpManager_setShortsTrackerAveragePriceWeight = await execute("ZkdlpManager",
        await DefaultParams2(chainId), "setShortsTrackerAveragePriceWeight", 10000);
    await waitContractDeployed(ZkdlpManager_setShortsTrackerAveragePriceWeight, "ZkdlpManager_setShortsTrackerAveragePriceWeight");

    const ZKUSD_addVault = await execute("ZKUSD", await DefaultParams2(chainId),
        "addVault", ZkdlpManager.address);
    await waitContractDeployed(ZKUSD_addVault, "ZKUSD_addVault");
};
export default func;
func.tags = ["staging", "executeP3Settings"];
