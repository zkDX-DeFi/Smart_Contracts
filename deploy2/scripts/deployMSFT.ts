import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {getEquityConfig,} from "../../helpers/params";
import {MSFT_DEFAULT_AMOUNT} from "../../helpers/constants";
import {waitContractDeployed} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployMSFT.ts"));
    const chainId = await getChainId();
    let tokens = [], feedIds = [];

    // Vault.setTokenConfig(MSFT)
    const MSFT = await getDeployByChainIdAndName(chainId, "MSFT", "Token", ["MSFT", 18, MSFT_DEFAULT_AMOUNT, 0, 0]);
    const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getEquityConfig(MSFT));
    await waitContractDeployed(Vault_setTokenConfig, "Vault.setTokenConfig(MSFT)");

    // VaultPriceFeed.setFeedIds(MSFT)
    tokens.push(MSFT.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "MSFT"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.setFeedIds(MSFT)");
};
export default func;
func.tags = ["staging", "MSFT"];
