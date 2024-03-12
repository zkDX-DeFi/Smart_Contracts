import {DeployFunction} from "hardhat-deploy/types";
import {getZusdConfig} from "../helpers/params";
import {parseEther} from "ethers/lib/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {
    const {deploy, execute, get} = deployments;
    const {owner} = await getNamedAccounts();

    console.log(">> deploying exchange...");

    const DAI = await get("DAI");

    const ZUSD = await deploy("ZUSD", {
        from: owner,
        args: [],
        log: true,
    });

    const ZUSDPool = await deploy("ZUSDPool", {
        from: owner,
        args: [ZUSD.address],
        log: true,
    });

    await execute("Vault", {from: owner}, "setTokenConfig", ...getZusdConfig(ZUSD));
    await execute("ZUSD", {from: owner}, "setManager", owner, true);
    await execute("ZUSD", {from: owner}, "setManager", ZUSDPool.address, true);
    await execute("ZUSDPool", {from: owner}, "setWhitelistToken", DAI.address, true);
    await execute("ZUSDPool", {from: owner}, "setCap", parseEther("10000"));
    await execute("VaultPriceFeed", {from: owner}, "setStableToken", ZUSD.address, true);
    await execute("PositionManager", {from: owner}, "setZusd", ZUSD.address);

    // set gov
    const Timelock = await get("Timelock");
    const Vault = await get("Vault");
    await execute("Vault", {from: owner}, "setGov", Timelock.address);
    await execute("Timelock", {from: owner}, "acceptGov", Vault.address);

    // set liquidator
    const PositionManager = await get("PositionManager");
    await execute("Timelock", {from: owner}, "setLiquidator", Vault.address, PositionManager.address, true);
    await execute("Timelock", {from: owner}, "setAllowStableEquity", Vault.address, true);

    // setFees
    await execute("Timelock", {from: owner}, "setFees",
        Vault.address,
        0, // _taxBasisPoints - no use - for DynamicFee
        0, // _stableTaxBasisPoints - no use - for DynamicFee
        0, // _mintBurnFeeBasisPoints - no use - for LP
        0, // _swapFeeBasisPoints - for zusd swap to BTC / ETH
        0, // _stableSwapFeeBasisPoints - no use
        10, // _marginFeeBasisPoints // Y 0.1% - for OPEN / CLOSE
        0, // _liquidationFeeUsd // - no use parseUnits("5", 30)
        3600, // _minProfitTime // Y
        false // _hasDynamicFees
    );

    // setFundingRate
    // await execute("Timelock", {from: owner}, "setFundingRate",
    //     Vault.address,
    //     3600,
    //     100, // 0.01%
    //     100 // 0.01%
    // );
};
export default func;
func.tags = ["zusd"];
