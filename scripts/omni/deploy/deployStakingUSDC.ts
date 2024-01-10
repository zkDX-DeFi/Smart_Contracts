import {getLzEndPointByChainId, getStgRouterByChainId, getStgUsdcByChainId} from "../../../helpers/chains";
import {getLzChainIdByNetworkName} from "../../../helpers/lzUtils";
import assert from "assert";
import {ethers} from "hardhat";
import {
    CHAIN_ID_OPTIMISM_GOERLI, OMNI_PRIMARY_NETWORK, OMNI_SECONDARY_NETWORK,
    STG_POOL_ID_USDC
} from "../../../helpers/constants";
import {parseUnits} from "ethers/lib/utils";

module.exports = async function ({deployments, getNamedAccounts, network, getChainId}) {

    const {deploy, execute} = deployments;
    const {owner} = await getNamedAccounts();

    const chainId = await getChainId();
    const lzChainId = getLzChainIdByNetworkName(network.name);
    console.log(`>> deploying omni staking on chainId: ${chainId}, network: ${network.name}, lzChainId: ${lzChainId}`);

    let lzEndpoint = getLzEndPointByChainId(chainId);
    let usdc = getStgUsdcByChainId(chainId);
    let stgRouter = getStgRouterByChainId(chainId);
    assert(lzEndpoint, "lzEndpoint is empty");
    assert(usdc, "usdc is empty");
    assert(stgRouter, "stgRouter is empty");

    const primaryLzChainId = getLzChainIdByNetworkName(OMNI_PRIMARY_NETWORK);
    const secondaryLzChainId = getLzChainIdByNetworkName(OMNI_SECONDARY_NETWORK);
    assert(primaryLzChainId, "primaryLzChainId is empty");
    assert(secondaryLzChainId, "secondaryLzChainId is empty");

    let gasPrice = await ethers.provider.getGasPrice();
    if (chainId == CHAIN_ID_OPTIMISM_GOERLI)
        gasPrice = parseUnits("1", "gwei");

    // deploy omniZKDX
    const omniZKDX = await deploy("omniZKDX", {
        from: owner,
        args: [lzEndpoint, 0],
        log: true,
        gasPrice: gasPrice
    });

    // deploy omniStaking
    await deploy("OmniStakingUSDC", {
        contract: "OmniZkdxStakingERC20",
        from: owner,
        args: [usdc, omniZKDX.address, 86400, stgRouter, lzEndpoint, lzChainId],
        log: true,
        gasPrice: gasPrice
    });

    // staking settings
    console.log(`>> running settings...`)
    await execute("OmniStakingUSDC", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setGasLookup", [1, 3], [300000, 300000]);

    await execute("OmniStakingUSDC", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setRewardChainId", primaryLzChainId, true);

    await execute("OmniStakingUSDC", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setPoolIds", [primaryLzChainId, secondaryLzChainId], [STG_POOL_ID_USDC, STG_POOL_ID_USDC]);

};

module.exports.tags = ["omni-staking-usdc"];