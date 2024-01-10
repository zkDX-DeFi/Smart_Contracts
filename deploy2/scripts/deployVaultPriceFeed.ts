import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getPythAddressByChainId} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: deployVaultPriceFeed.ts"));
    const chainId = await getChainId();
    const pythContractAddr = await getPythAddressByChainId(chainId);

    // VaultPriceFeed.deployed
    const VaultPriceFeed = await deployments.deploy("VaultPriceFeed", await DefaultParams2(chainId,
        {
            args: [
                pythContractAddr
            ]
        }));
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.deployed");
};
export default func;
func.tags = ["staging", "vaultPriceFeed"];
