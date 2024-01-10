import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {AddressZero, waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";
import {DEPOSIT_FEE} from "../../helpers/constants";
import {deployments, getNamedAccounts} from "hardhat";
import {minLiquidationFee} from "../../helpers/params";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy, execute} = deployments;
    const {owner} = await getNamedAccounts();
    console.log(chalk.greenBright(">> scripts: deployPositionManager.ts"));
    const chainId = await getChainId();
    const Vault = await deployments.get("Vault");
    const Router = await deployments.get("Router");
    const ShortsTracker = await deployments.get("ShortsTracker");
    const WNative = await deployments.get("WNative");
    // const OrderBook = await deployments.get("OrderBook");

    // PositionManager.deployed
    const PositionManager = await deploy("PositionManager", await DefaultParams2(chainId, {
        args: [Vault.address,
                Router.address,
                ShortsTracker.address,
                WNative.address,
                DEPOSIT_FEE, AddressZero],
    }));
    await waitContractDeployed(PositionManager, "PositionManager.deployed");
    await execute("PositionManager", {
        from: owner,
        log: true,
        waitConfirmations: 1
    }, "setMinLiquidationFee", minLiquidationFee);
};
export default func;
func.tags = ["staging", "positionManager"];
