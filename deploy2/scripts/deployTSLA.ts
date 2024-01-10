import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {getEquityConfig} from "../../helpers/params";
import {CHAIN_ID_LOCAL, TSLA_DEFAULT_AMOUNT} from "../../helpers/constants";
import {updateMarkPrice} from "../../helpers/utilsForTest";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployTSLA.ts"));
    const chainId = await getChainId();
    let tokens = [], feedIds = [];

    // Vault.setTokenConfig(TSLA)
    const TSLA = await getDeployByChainIdAndName(chainId, "TSLA", "Token", ["TSLA", 18, TSLA_DEFAULT_AMOUNT, 0, 0]);
    const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getEquityConfig(TSLA));
    await waitContractDeployed(Vault_setTokenConfig, "Vault.setTokenConfig(TSLA)");

    // VaultPriceFeed.setFeedIds(TSLA)
    tokens.push(TSLA.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "TSLA"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, "VaultPriceFeed.setFeedIds(TSLA)");
    if (CHAIN_ID_LOCAL == chainId) await updateMarkPrice(['TSLA']);
};
export default func;
func.tags = ["staging", "TSLA"];
