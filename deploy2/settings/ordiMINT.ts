import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, ORDI_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: ordiMINT.ts"));
    const ordi = await ethers.getContract("ORDI");
    const ordiAmountIn = ORDI_MINT_AMOUNT;
    const chainId = await getChainId();

    // ordi_mint
    const ordi_mint = await ordi.mint(ANOTHER_USER_ADDRESS, ordiAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(ordi_mint, "ordi_mint");
    console.log(chalk.greenBright(`ordi minted: ${formatEther(await ordi.totalSupply())}`));
};
export default func;
func.tags = ["staging", "ordiMINT"];
