import {DeployFunction} from "hardhat-deploy/types";
import {CHAIN_ID_ZKSYNC_TESTNET} from "../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {

    const {deploy} = deployments;
    const {owner} = await getNamedAccounts();

    let chainId = await getChainId();
    if (CHAIN_ID_ZKSYNC_TESTNET == chainId) return;
    console.log(">> deploying zkdxlv1 ...");

    await deploy("ZKDXLV1", {
        from: owner,
        args: [10000],
        log: true,
    });

};
export default func;
func.tags = ["lv1"];
