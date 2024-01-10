import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {parseEther} from "ethers/lib/utils";
import {getTokenConfig} from "../../helpers/params";
import {waitContractDeployed} from "../../helpers/utils";
import {DOGE_DEFAULT_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployDOGE.ts"));
    const chainId = await getChainId();
    let tokens = [], feedIds = [];

    // Vault.setTokenConfig(DOGE)
    const DOGE = await getDeployByChainIdAndName(chainId, "DOGE", "Token2", ["DOGE", 18, 0, parseEther("0"), 0]);
    const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getTokenConfig(DOGE));
    await waitContractDeployed(Vault_setTokenConfig, "Vault.setTokenConfig(DOGE)");

    // VaultPriceFeed.setFeedIds(DOGE)
    tokens.push(DOGE.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "DOGE"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.setFeedIds(DOGE)");
};
export default func;
func.tags = ["staging", "DOGE"];
