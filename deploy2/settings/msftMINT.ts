import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, MSFT_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: msftMINT.ts"));
    const msft = await ethers.getContract("MSFT");
    const msftAmountIn = MSFT_MINT_AMOUNT;
    const chainId = await getChainId();

    // msft_mint
    const msft_mint = await msft.mint(ANOTHER_USER_ADDRESS, msftAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(msft_mint, "msft_mint");
    console.log(chalk.greenBright(`msft minted: ${formatEther(await msft.totalSupply())}`));
};
export default func;
func.tags = ["staging", "msftMINT"];
