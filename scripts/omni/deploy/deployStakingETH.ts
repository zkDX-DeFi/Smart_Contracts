import {getLzEndPointByChainId, getStgRouterEthByChainId} from "../../../helpers/chains";
import {getLzChainIdByNetworkName} from "../../../helpers/lzUtils";
import assert from "assert";
import {ethers} from "hardhat";
import {
    CHAIN_ID_OPTIMISM_GOERLI,
    OMNI_PRIMARY_NETWORK,
    OMNI_SECONDARY_NETWORK,
    STG_POOL_ID_ETH
} from "../../../helpers/constants";
import {parseUnits} from "ethers/lib/utils";

module.exports = async function ({deployments, getNamedAccounts, network, getChainId}) {

    const {deploy, execute} = deployments;
    const {owner} = await getNamedAccounts();
    let sameNonceDeployer = (await ethers.getSigners())[1].address;

    const chainId = await getChainId();
    const lzChainId = getLzChainIdByNetworkName(network.name);
    console.log(`>> deploying omni staking on chainId: ${chainId}, network: ${network.name}, lzChainId: ${lzChainId}`);

    let lzEndpoint = getLzEndPointByChainId(chainId);
    let stgRouterEth = getStgRouterEthByChainId(chainId);
    assert(lzEndpoint, "lzEndpoint is empty");
    assert(stgRouterEth, "stgRouterEth is empty");

    const primaryLzChainId = getLzChainIdByNetworkName(OMNI_PRIMARY_NETWORK);
    const secondaryLzChainId = getLzChainIdByNetworkName(OMNI_SECONDARY_NETWORK);
    assert(primaryLzChainId, "primaryLzChainId is empty");
    assert(secondaryLzChainId, "secondaryLzChainId is empty");

    let gasPrice = await ethers.provider.getGasPrice();
    if (chainId == CHAIN_ID_OPTIMISM_GOERLI)
        gasPrice = parseUnits("1", "gwei");

    // deploy esZKDXOmni
    const esZKDXOmni = await deploy("esZKDXOmni", {
        from: sameNonceDeployer,
        args: [lzEndpoint, owner],
        log: true,
        gasPrice: gasPrice
    });

    // deploy omniStaking
    await deploy("OmniStakingETH", {
        contract: "OmniZkdxStakingETH",
        from: sameNonceDeployer,
        args: [esZKDXOmni.address, 86400 * 30, stgRouterEth, lzEndpoint, lzChainId, owner],
        log: true,
        gasPrice: gasPrice
    });

    // staking settings
    console.log(`>> running settings...`)
    await execute("OmniStakingETH", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setGasLookup", [1, 3], [300000, 300000]);

    await execute("OmniStakingETH", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setRewardChainId", primaryLzChainId, true);

    await execute("OmniStakingETH", {
        from: owner,
        log: true,
        gasPrice: gasPrice
    }, "setPoolIds", [primaryLzChainId, secondaryLzChainId], [STG_POOL_ID_ETH, STG_POOL_ID_ETH]);

};

module.exports.tags = ["omni-staking-eth"];