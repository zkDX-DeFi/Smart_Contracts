import {deployments, getChainId} from 'hardhat';

import chalk from "chalk";
import {DefaultExecuteParams2, getChainNameFromId} from "../helpers/chains";
import {ANOTHER_USER_ADDRESS, SINGLE_MINT_USDC_AMOUNTS} from "../helpers/constants";
import {getStableToken} from "../helpers/utils";

async function main() {
    console.log(chalk.greenBright(">> runs testnet_Prigo..."));
    const chainId = await getChainId();
    const usdc = await getStableToken(chainId);

    let _user = ANOTHER_USER_ADDRESS;
    let _amount;
    _amount = SINGLE_MINT_USDC_AMOUNTS;
    await usdc.mint(_user, _amount, await DefaultExecuteParams2(chainId));
    console.log(chalk.greenBright(`chainId: ${chainId}, chainName: ${getChainNameFromId(chainId)}`));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
