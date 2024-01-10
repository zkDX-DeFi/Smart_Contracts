import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2} from "../../helpers/chains";
import {parseEther} from "ethers/lib/utils";

// @ts-ignore
const func: DeployFunction = async function ({deployments, network, getChainId, }) {
    console.log(chalk.greenBright(">> scripts: executeRewarding.ts"));

    const {execute, get} = deployments;
    const ZkdxStakingETH = await get("ZkdxStakingETH");
    const ZkdxStakingUSDC = await get("ZkdxStakingUSDC");
    const chainId = await getChainId();

    let mintAmount = parseEther("1000000"); // 1M
    let rewardAmount = parseEther("500000"); // 0.5M

    await execute("esZKDX", await DefaultParams2(chainId, {waitConfirmations: 1}), "mint", ZkdxStakingETH.address, mintAmount);
    await execute("ZkdxStakingETH", await DefaultParams2(chainId, {waitConfirmations: 1}), "notifyRewardAmount", rewardAmount);

    await execute("esZKDX", await DefaultParams2(chainId, {waitConfirmations: 1}), "mint", ZkdxStakingUSDC.address, mintAmount);
    await execute("ZkdxStakingUSDC", await DefaultParams2(chainId, {waitConfirmations: 1}), "notifyRewardAmount", rewardAmount);

};
export default func;
func.tags = ["staging", "executeRewarding"];
