import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {getStableToken, waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, USDC_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: usdcMINT.ts"));
    const chainId = await getChainId();
    const usdcAmountIn = USDC_MINT_AMOUNT;
    const usdc = await getStableToken(chainId);
    if (!usdc) throw new Error("usdc not found");
    // usdc_mint

    const usdc_mint = await usdc.mint(ANOTHER_USER_ADDRESS, usdcAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(usdc_mint, "usdc_mint");
    console.log(chalk.greenBright(`usdc minted: ${formatEther(await usdc.totalSupply())}`));
};
export default func;
func.tags = ["staging", "usdcMINT"];
