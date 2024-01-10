import {DeployFunction} from "hardhat-deploy/types";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {
    const {deploy, get, execute} = deployments;
    const {owner} = await getNamedAccounts();
    const Vault = await get("Vault");
    const ZKUSD = await get("ZKUSD");
    const WNative = await get("WNative");
    const ShortsTracker = await get("ShortsTracker");

    console.log(">> deploying zkdlp...");
    const ZKDLP = await deploy("ZKDLP", {
        from: owner,
        args: [],
        log: true,
    });
    const ZkdlpManager = await deploy("ZkdlpManager", {
        from: owner,
        args: [Vault.address, ZKUSD.address, ZKDLP.address, ShortsTracker.address, 0],
        log: true,
    });
    const ZKDX = await deploy("ZKDX", {
        from: owner,
        args: [],
        log: true,
    });
    const RewardRouter = await deploy("RewardRouter", {
        contract: "RewardRouterV2",
        from: owner,
        args: [Vault.address],
        log: true,
    });

    await deploy("Reader", {
        from: owner,
        args: [],
        log: true,
    });

    await execute("ZKDLP", {from: owner}, "setMinter", ZkdlpManager.address, true);
    await execute("RewardRouter", {from: owner}, "initialize", WNative.address, ZKDX.address, ZKDLP.address, ZkdlpManager.address);
    await execute("ZkdlpManager", {from: owner}, "setHandler", RewardRouter.address, true);
    await execute("ZkdlpManager", {from: owner}, "setShortsTrackerAveragePriceWeight", 10000);
    await execute("ZKUSD", {from: owner}, "addVault", ZkdlpManager.address);
};
export default func;
func.tags = ["zkdlp"];
