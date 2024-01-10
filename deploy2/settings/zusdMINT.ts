import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {getStableToken, waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ANOTHER_USER_ADDRESS, ZUSD_MINT_AMOUNT} from "../../helpers/constants";
import {ethers} from "hardhat";

// @ts-ignore
const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: zusdMINT.ts"));
    const chainId = await getChainId();
    const zusdAmountIn = ZUSD_MINT_AMOUNT;
    const zusd = await ethers.getContract("ZUSD");
    if (!zusd) throw new Error("zusd not found");
    // zusd_mint

    const zusd_mint = await zusd.mint(ANOTHER_USER_ADDRESS, zusdAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(zusd_mint, "zusd_mint");
    console.log(chalk.greenBright(`zusd minted: ${formatEther(await zusd.totalSupply())}`));
};
export default func;
func.tags = ["staging", "zusdMINT"];
