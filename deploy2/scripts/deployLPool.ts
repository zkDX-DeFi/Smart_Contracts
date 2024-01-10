import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {getZusdConfig} from "../../helpers/params";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {DefaultParams2} from "../../helpers/chains";
import {CHAIN_ID_LINEA_MAINNET, USDC_LINEA_MAINNET} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute, deploy, get} = deployments;
    const {owner} = await getNamedAccounts();
    console.log(chalk.greenBright(">> scripts: deployLPool.ts"));

    const ZKLP = await deploy("ZKLP", {
        from: owner,
        args: [],
        log: true,
    });

    const ZKHLP = await deploy("ZKHLP", {
        from: owner,
        args: [],
        log: true,
    });

    const LPool = await deploy("LPool", {
        from: owner,
        contract: "LPool",
        args: [ZKLP.address],
        log: true,
    });

    const HLPool = await deploy("HLPool", {
        from: owner,
        contract: "LPool",
        args: [ZKHLP.address],
        log: true,
    });

    const USDC = await get("USDC");
    await execute("ZKLP", {from: owner}, "setManager", LPool.address, true);
    await execute("ZKHLP", {from: owner}, "setManager", HLPool.address, true);
    await execute("LPool", {from: owner}, "setWhitelistToken", USDC.address, true);
    await execute("LPool", {from: owner}, "setCap", parseEther("10000"));
    await execute("HLPool", {from: owner}, "setWhitelistToken", USDC.address, true);
    await execute("HLPool", {from: owner}, "setCap", parseEther("10000"));


};
export default func;
func.tags = ["staging", "LPool"];
