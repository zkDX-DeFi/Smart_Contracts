import {DeployFunction} from "hardhat-deploy/types";
import {AddressZero} from "../helpers/utils";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {minExecutionFee} from "../helpers/params";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {
    const {deploy, execute, get} = deployments;
    const {owner} = await getNamedAccounts();
    const Vault = await get("Vault");
    const Router = await get("Router");
    const WNative = await get("WNative");
    const ZKUSD = await get("ZKUSD");

    console.log(">> deploying manager...");
    /* deploying */
    const ShortsTracker = await deploy("ShortsTracker", {
        from: owner,
        args: [Vault.address],
        log: true,
    });
    const OrderBook = await deploy("OrderBook", {
        from: owner,
        args: [Router.address, Vault.address, WNative.address, ZKUSD.address, minExecutionFee],
        log: true,
    });
    const PositionManager = await deploy("PositionManager", {
        from: owner,
        args: [Vault.address, Router.address, ShortsTracker.address, WNative.address, 50, OrderBook.address],
        log: true,
    });
    await deploy("OrderBookReader", {
        from: owner,
        args: [],
        log: true,
    });

    /* settings*/
    await execute("ShortsTracker", {from: owner}, "setIsGlobalShortDataReady", true);
    await execute("ShortsTracker", {from: owner}, "setHandler", PositionManager.address, true);
    await execute("Router", {from: owner}, "addPlugin", PositionManager.address);
    await execute("Timelock", {from: owner}, "setContractHandler", PositionManager.address, true);
    await execute("Timelock", {from: owner}, "setShouldToggleIsLeverageEnabled", true);
    await execute("Router", {from: owner}, "addPlugin", OrderBook.address);
};
export default func;
func.tags = ["manager"];
