import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, TSLA_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: tslaMINT.ts"));
    const tsla = await ethers.getContract("TSLA");
    const tslaAmountIn = TSLA_MINT_AMOUNT;
    const chainId = await getChainId();

    // tsla_mint
    const tsla_mint = await tsla.mint(ANOTHER_USER_ADDRESS, tslaAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(tsla_mint, "tsla_mint");
    console.log(chalk.greenBright(`tsla minted: ${formatEther(await tsla.totalSupply())}`));
};
export default func;
func.tags = ["staging", "tslaMINT"];
