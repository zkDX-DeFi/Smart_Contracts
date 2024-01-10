import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {CHAIN_ID_LOCAL, STAKING_REWARD_AMOUNT, STAKING_TRANSFER_AMOUNT} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: executeP5Settings.ts"));
    const {execute, get} = deployments;
    const ZkdxStakingETH = await get("ZkdxStakingETH");
    const ZkdxStakingUSDC = await get("ZkdxStakingUSDC");
    const chainId = await getChainId();

    // Staking Reward
    if (CHAIN_ID_LOCAL != chainId) {
        let transferAmount = STAKING_TRANSFER_AMOUNT;
        let rewardAmount = STAKING_REWARD_AMOUNT;
        const esZKDX_transfer = await execute("esZKDX", await DefaultParams2(chainId), "transfer", ZkdxStakingETH.address, transferAmount);
        await waitContractDeployed(esZKDX_transfer, "esZKDX_transfer");

        const ZkdxStakingETH_notifyRewardAmount = await execute("ZkdxStakingETH", await DefaultParams2(chainId), "notifyRewardAmount", rewardAmount);
        await waitContractDeployed(ZkdxStakingETH_notifyRewardAmount, "ZkdxStakingETH_notifyRewardAmount");

        const esZKDX_transfer2 = await execute("esZKDX", await DefaultParams2(chainId), "transfer", ZkdxStakingUSDC.address, transferAmount);
        await waitContractDeployed(esZKDX_transfer2, "esZKDX_transfer2");

        const ZkdxStakingUSDC_notifyRewardAmount = await execute("ZkdxStakingUSDC", await DefaultParams2(chainId), "notifyRewardAmount", rewardAmount);
        await waitContractDeployed(ZkdxStakingUSDC_notifyRewardAmount, "ZkdxStakingUSDC_notifyRewardAmount");
    }
};
export default func;
func.tags = ["staging", "executeP5Settings"];
