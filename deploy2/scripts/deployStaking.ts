import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {DefaultParams2, getWethAndUSDCByChainIdAndName} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";
import {CHAIN_ID_LINEA_MAINNET, STAKING_ETH_PERIOD, STAKING_USDC_PERIOD} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: deployStaking.ts"));
    const {deploy, get, execute} = deployments;
    const {owner} = await getNamedAccounts();
    const chainId = await getChainId();

    let esZKDX = chainId == CHAIN_ID_LINEA_MAINNET ? await get("esZKDXOmni") : await get("esZKDX");

    let {wethAddress, usdcAddress} = await getWethAndUSDCByChainIdAndName(chainId);
    const ZkdxStakingETH = await deploy("ZkdxStakingETH",
        await DefaultParams2(chainId, {
            contract: "ZkdxStakingETH",
            args: [wethAddress, esZKDX.address, STAKING_ETH_PERIOD]
        }));
    await waitContractDeployed(ZkdxStakingETH, "ZkdxStakingETH.deployed");

    await deploy("ZkdxStakingUSDC", {
        from: owner,
        contract: "ZkdxStaking",
        args: [usdcAddress, esZKDX.address, STAKING_USDC_PERIOD],
        log: true,
        waitConfirmations: 1
    });

    if (chainId == CHAIN_ID_LINEA_MAINNET) {
        await execute("ZkdxStakingETH", {from: owner, log: true, waitConfirmations: 1}, "setPaused", true);
        await execute("ZkdxStakingUSDC", {from: owner, log: true, waitConfirmations: 1}, "setPaused", true);
    }
};
export default func;
func.tags = ["staging", "deployStaking"];
