import {ethers} from 'hardhat';

import chalk from "chalk";

async function main() {
    console.log(chalk.greenBright(">> update VaultPriceFeed validTime ..."));

    let vaultPriceFeed = await ethers.getContract("VaultPriceFeed");
    await vaultPriceFeed.setValidTime(86400);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
