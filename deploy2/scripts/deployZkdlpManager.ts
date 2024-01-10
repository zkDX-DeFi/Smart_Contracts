import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployZkdlpManager.ts"));
    const chainId = await getChainId();
    const Vault = await deployments.get("Vault");
    const ZKUSD = await deployments.get("ZKUSD");
    const ZKDLP = await deployments.get("ZKDLP");
    const ShortsTracker = await deployments.get("ShortsTracker");


    // ZkdlpManager.deployed
    const ZkdlpManager = await deploy("ZkdlpManager", await DefaultParams2(chainId,
        {
            args: [
                Vault.address,
                ZKUSD.address,
                ZKDLP.address,
                ShortsTracker.address,
                0]
        }));
    await waitContractDeployed(ZkdlpManager, "ZkdlpManager.deployed");
};
export default func;
func.tags = ["staging", "ZkdlpManager"];
