import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {ethers} from "hardhat";
import {DefaultExecuteParams2} from "../../helpers/chains";
import {getInterval, waitContractDeployed} from "../../helpers/utils";
import {TIMELOCK_MINPROFITTIME, VAULTPRICEFEED_VALIDTIME,} from "../../helpers/constants";
import {sleep} from "../../helpers/utils2";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: executeTimelockSettings.ts"));
    const vaultPriceFeed = await ethers.getContract("VaultPriceFeed");
    const timelock = await ethers.getContract("Timelock");
    const vault = await ethers.getContract("Vault");
    const chainId = await getChainId();
    // settings
    await sleep(getInterval(chainId));

    const setValidTime = await vaultPriceFeed.setValidTime(VAULTPRICEFEED_VALIDTIME,await DefaultExecuteParams2(chainId));
    await waitContractDeployed(setValidTime, "vaultPriceFeed_setValidTime");
    await sleep(getInterval(chainId));

    const setMinProfitTime = await timelock.setMinProfitTime(vault.address, TIMELOCK_MINPROFITTIME, await DefaultExecuteParams2(chainId)); // 1h
    await waitContractDeployed(setMinProfitTime, "timelock_setMinProfitTime");
    await sleep(getInterval(chainId));
};
export default func;
func.tags = ["staging", "executeTimelockSettings"];
