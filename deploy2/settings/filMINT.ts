import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, FILE_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: filMINT.ts"));
    const fil = await ethers.getContract("FIL");
    const filAmountIn = FILE_MINT_AMOUNT;
    const chainId = await getChainId();

    // fil_mint
    const fil_mint = await fil.mint(ANOTHER_USER_ADDRESS, filAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(fil_mint, "fil_mint");
    console.log(chalk.greenBright(`fil minted: ${formatEther(await fil.totalSupply())}`));
};
export default func;
func.tags = ["staging", "filMINT"];
