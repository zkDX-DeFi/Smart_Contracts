import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, LTC_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: ltcMINT.ts"));
    const ltc = await ethers.getContract("LTC");
    const ltcAmountIn = LTC_MINT_AMOUNT;
    const chainId = await getChainId();

    // ltc_mint
    const ltc_mint = await ltc.mint(ANOTHER_USER_ADDRESS, ltcAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(ltc_mint, "ltc_mint");
    console.log(chalk.greenBright(`ltc minted: ${formatEther(await ltc.totalSupply())}`));
};
export default func;
func.tags = ["staging", "ltcMINT"];
