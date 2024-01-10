import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {ethers} from "hardhat";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {getStableToken, getWETHContract} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: executeTokenSettings.ts"));
    const chainId = await getChainId();

    const weth = await getWETHContract(chainId);
    const wbtc = await ethers.getContract("WBTC");
    const ltc = await ethers.getContract("LTC");
    const doge = await ethers.getContract("DOGE");
    const arb = await ethers.getContract("ARB");
    const fil = await ethers.getContract("FIL");
    const msft = await ethers.getContract("MSFT");
    const tsla = await ethers.getContract("TSLA");
    const usdc = await getStableToken(chainId);

    await wbtc.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await weth.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await usdc.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await ltc.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await doge.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await arb.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await fil.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await msft.setOpenMint(false, await DefaultExecuteParams2(chainId));
    await tsla.setOpenMint(false, await DefaultExecuteParams2(chainId));
};
export default func;
func.tags = ["staging", "executeTokenSettings"];
