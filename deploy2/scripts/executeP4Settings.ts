import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute, get} = deployments;
    const {owner} = await getNamedAccounts();
    console.log(chalk.greenBright(">> scripts: executeP4Settings.ts"));
    const Vault = await get("Vault");
    const PositionManager = await get("PositionManager");
    const chainId = await getChainId();

    // setGov
    const Timelock = await get("Timelock");
    await execute("Vault", await DefaultParams2(chainId), "setGov", Timelock.address);

    // Timelock.setLiquidator
    const Timelock_setLiquidator = await execute("Timelock", await DefaultParams2(chainId), "setLiquidator", Vault.address, PositionManager.address, true);
    await waitContractDeployed(Timelock_setLiquidator, "Timelock.setLiquidator");

    // setFees
    await execute("Timelock", await DefaultParams2(chainId), "setFees",
        Vault.address,
        0, // _taxBasisPoints - no use - for DynamicFee
        0, // _stableTaxBasisPoints - no use - for DynamicFee
        0, // _mintBurnFeeBasisPoints - no use - for LP
        0, // _swapFeeBasisPoints - for zusd swap to BTC / ETH
        0, // _stableSwapFeeBasisPoints - no use
        20, // _marginFeeBasisPoints // 0.2% - for OPEN / CLOSE
        0, // _liquidationFeeUsd - no use
        3600, // _minProfitTime
        false // _hasDynamicFees
    );
};
export default func;
func.tags = ["staging", "executeP4Settings"];
