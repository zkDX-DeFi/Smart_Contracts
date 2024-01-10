import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, DOGE_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: dogeMINT.ts"));
    const doge = await ethers.getContract("DOGE");
    const dogeAmountIn = DOGE_MINT_AMOUNT;
    const chainId = await getChainId();

    // doge_mint
    const doge_mint = await doge.mint(ANOTHER_USER_ADDRESS, dogeAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(doge_mint, "doge_mint");
    console.log(chalk.greenBright(`doge minted: ${formatEther(await doge.totalSupply())}`));
};
export default func;
func.tags = ["staging", "dogeMINT"];
