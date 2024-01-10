import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultExecuteParams2, isChainIdMainnet, isChainIdTestnet} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {formatEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {ANOTHER_USER_ADDRESS, WETH_MINT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: wethMINT.ts"));
    const chainId = await getChainId();

    let weth;
    if (isChainIdTestnet(chainId) || isChainIdMainnet(chainId)) {
        weth = await ethers.getContract("WNative");
    }
    const wethAmountIn = WETH_MINT_AMOUNT;

    // weth_mint
    const weth_mint = await weth.mint(ANOTHER_USER_ADDRESS, wethAmountIn, await DefaultExecuteParams2(chainId));
    await waitContractDeployed(weth_mint, "weth_mint");
    console.log(chalk.greenBright(`weth minted: ${formatEther(await weth.totalSupply())}`));
};
export default func;
func.tags = ["staging", "wethMINT"];
