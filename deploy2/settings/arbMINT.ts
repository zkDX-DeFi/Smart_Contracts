import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, ARB_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: arbMINT.ts"));
    const arb = await ethers.getContract("ARB");
    const arbAmountIn = ARB_MINT_AMOUNT;
    const chainId = await getChainId();

    // arb_mint
    const arb_mint = await arb.mint(ANOTHER_USER_ADDRESS, arbAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(arb_mint, "arb_mint");
    console.log(chalk.greenBright(`arb minted: ${formatEther(await arb.totalSupply())}`));
};
export default func;
func.tags = ["staging", "arbMINT"];
