import assert from "assert";
import {ethers} from "hardhat";
import {parseUnits} from "ethers/lib/utils";
import {getLzChainIdByNetworkName} from "../../../../helpers/lzUtils";
import {getLzEndPointByChainId, getStgRouterByChainId, getStgUsdcByChainId} from "../../../../helpers/chains";
import {CHAIN_ID_OPTIMISM_GOERLI} from "../../../../helpers/constants";

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

    const primaryLzChainId = getLzChainIdByNetworkName("optimism_goerli");
    const secondaryLzChainId1 = getLzChainIdByNetworkName("goerli");
    const secondaryLzChainId2 = getLzChainIdByNetworkName("mumbai");
    assert(primaryLzChainId, "primaryLzChainId is empty");
    assert(secondaryLzChainId1, "secondaryLzChainId1 is empty");
    assert(secondaryLzChainId2, "secondaryLzChainId2 is empty");

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
    await deploy("OmniZkdxStaking", {
        from: owner,
        args: [usdc, omniZKDX.address, 86400, stgRouter, lzEndpoint, lzChainId],
        log: true,
        gasPrice: gasPrice
    });

    // staking settings
    console.log(`>> running settings...`)
    await execute("OmniZkdxStaking", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setGasLookup", [1, 3], [300000, 300000]);

    await execute("OmniZkdxStaking", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setRewardChainId", primaryLzChainId, true);

    await execute("OmniZkdxStaking", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setPoolIds", [primaryLzChainId, secondaryLzChainId1, secondaryLzChainId2], [1, 1, 1]);

};

module.exports.tags = ["omni-staking-multi-secondary"];