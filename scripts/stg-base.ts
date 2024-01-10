import {deployments, ethers, getChainId, getNamedAccounts} from "hardhat";
import {formatEther, parseEther} from "ethers/lib/utils";
import {getLzChainIdByNetworkName} from "../helpers/lzUtils";
import {getStgRouterByChainId} from "../helpers/chains";


async function main() {

    const {execute, read, get} = deployments;
    const {owner} = await getNamedAccounts();

    let srcChainId = getLzChainIdByNetworkName("base_mainnet");
    let dstChainId = getLzChainIdByNetworkName("linea_mainnet");

    // ======================== Cached Swap ============================
    let router = await ethers.getContractAt("StargateComposer", "0xecc19e177d24551aa7ed6bc6fe566eca726cc8a9");
    let _srcAddress = ethers.utils.solidityPack(
        ['address', 'address'],
        ["0xaf54be5b6eec24d6bfacf1cce4eaf680a8239398", "0x45f1a95a4d3f3836523f5c83673c797f4d4d263b"]
    )
    let cachedSwap = await router.payloadHashes(srcChainId, _srcAddress, 75097);
    console.log("cachedSwap:", cachedSwap);

    // ======================== Stake ============================
    // let fee = await read("OmniStakingETH", "quoteLayerZeroFee", dstChainId, 1);
    // console.log("fee:", formatEther(fee[0]));
    // let value = parseEther("0.005").add(fee[0]).add(parseEther("0.0001"));
    // console.log("value:", formatEther(value));
    //
    // await execute("OmniStakingETH",
    //     {from: owner, log: true, value: value},
    //     "stake",
    //     dstChainId,
    //     parseEther("0.005")
    // )
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
