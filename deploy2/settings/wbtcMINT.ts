import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatUnits} from "ethers/lib/utils";
import {ANOTHER_USER_ADDRESS, WBTC_DECIMALS, WBTC_MINT_AMOUNT} from "../../helpers/constants";
import {ethers} from "hardhat";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: wbtcMINT.ts"));
    const wbtc = await ethers.getContract("WBTC");
    const wbtcAmountIn = WBTC_MINT_AMOUNT;
    const chainId = await getChainId();

    // wbtc mint

    const wbtc_mint = await wbtc.mint(ANOTHER_USER_ADDRESS, wbtcAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(wbtc_mint, "wbtc_mint");

    console.log(chalk.greenBright(`wbtc minted: ${formatUnits(await wbtc.totalSupply(),WBTC_DECIMALS)}`));
};
export default func;
func.tags = ["staging", "wbtcMINT"];
