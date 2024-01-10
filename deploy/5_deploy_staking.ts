import {DeployFunction} from "hardhat-deploy/types";
import {parseEther} from "ethers/lib/utils";
import {
    getDeployByChainIdAndName
} from "../helpers/chains";
import {
    CHAIN_ID_LOCAL,
    CHAIN_ID_ZKSYNC_MAINNET,
    CHAIN_ID_ZKSYNC_TESTNET,
    USDC_ZKSYNC_MAINNET,
    WETH_ZKSYNC_MAINNET
} from "../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {
    const {deploy, get, execute} = deployments;
    const {owner} = await getNamedAccounts();
    const chainId = await getChainId();
    console.log(">> deploying staking ...");
    const esZKDX = await deploy("esZKDX", {
        from: owner,
        args: [parseEther("50000000")],
        log: true,
    });

    let wethAddress, usdcAddress;
    if (CHAIN_ID_ZKSYNC_MAINNET == chainId) {
        wethAddress = WETH_ZKSYNC_MAINNET;
        usdcAddress = USDC_ZKSYNC_MAINNET;
    } else if (CHAIN_ID_ZKSYNC_TESTNET == chainId) {
        const trueWETH = await getDeployByChainIdAndName(chainId, "trueWETH", "Token", ["trueWETH", 18, parseEther("100000000"), parseEther("100000"), 0]);
        const trueUSDC = await getDeployByChainIdAndName(chainId, "trueUSDC", "Token", ["trueUSDC", 6, parseEther("100000000"), parseEther("100000"), 0]);
        wethAddress = trueWETH.address;
        usdcAddress = trueUSDC.address;
    } else {
        const WETH = await get("WNative");
        const USDC = await getDeployByChainIdAndName(chainId, "trueUSDC", "Token", ["trueUSDC", 6, parseEther("100000000"), parseEther("100000"), 0]);
        wethAddress = WETH.address;
        usdcAddress = USDC.address;
    }

    const ZkdxStakingETH = await deploy("ZkdxStakingETH", {
        from: owner,
        contract: "ZkdxStakingETH",
        args: [wethAddress, esZKDX.address, 86400 * 30],
        log: true,
    });
    const ZkdxStakingUSDC = await deploy("ZkdxStakingUSDC", {
        from: owner,
        contract: "ZkdxStaking",
        args: [usdcAddress, esZKDX.address, 86400 * 30],
        log: true,
    });

    if (CHAIN_ID_LOCAL != chainId) {
        let transferAmount = parseEther("25000000");
        let rewardAmount = parseEther("5000000");
        console.log(">> notifyRewardAmount stakingETH ...");
        await execute("esZKDX", {from: owner}, "transfer", ZkdxStakingETH.address, transferAmount);
        await execute("ZkdxStakingETH", {from: owner}, "notifyRewardAmount", rewardAmount);
        console.log(">> notifyRewardAmount stakingUSDC ...");
        await execute("esZKDX", {from: owner}, "transfer", ZkdxStakingUSDC.address, transferAmount);
        await execute("ZkdxStakingUSDC", {from: owner}, "notifyRewardAmount", rewardAmount);
    }
};
export default func;
func.tags = ["staking"];
