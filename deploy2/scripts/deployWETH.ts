import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getFeedIdByChainAndToken} from "../../helpers/chains";
import {getInterval, getWETHOrDeployWETH, waitContractDeployed} from "../../helpers/utils";
import {getWethConfig} from "../../helpers/params";
import {sleep} from "../../helpers/utils2";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute} = deployments;
    console.log(chalk.greenBright(">> scripts: deployWETH.ts"));
    const chainId = await getChainId();
    const WETH = await getWETHOrDeployWETH(chainId);

    // Vault.setTokenConfig(WETH)
    let tokens = [], feedIds = [];
    await sleep(getInterval(chainId));
    const Vault_setTokenConfig = await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getWethConfig(WETH));
    await waitContractDeployed(Vault_setTokenConfig, ">> Vault.setTokenConfig(WETH)");

    //  VaultPriceFeed.setFeedIds(WETH)
    tokens.push(WETH.address);
    feedIds.push(getFeedIdByChainAndToken(chainId, "WETH"));
    const VaultPriceFeed = await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", tokens, feedIds);
    await waitContractDeployed(VaultPriceFeed, ">> VaultPriceFeed.setFeedIds");
};
export default func;
func.tags = ["staging", "WETH"];
