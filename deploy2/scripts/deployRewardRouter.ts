import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {waitContractDeployed} from "../../helpers/utils";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    console.log(chalk.greenBright(">> scripts: deployRewardRouter.ts"));
    const chainId = await getChainId();
    const Vault = await deployments.get("Vault");

    // RewardRouter.deployed
    const RewardRouter = await deploy("RewardRouter", await DefaultParams2(chainId,
        {
            contract: "RewardRouterV2",
            args: [Vault.address],
        }));
    await waitContractDeployed(RewardRouter, "RewardRouter.deployed");
};
export default func;
func.tags = ["staging", "RewardRouter"];
