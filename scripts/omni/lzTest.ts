import {getLzEndPointByChainId} from "../../helpers/chains";
import {ethers, getChainId} from "hardhat";

const abi = require("./abi/LzEndPointTestnet.json");

async function main() {

    // let arbBridge = "0xd43cbcc7642c1df8e986255228174c2cca58d65b";
    // let abi_bridge = [
    //     "function layerZeroEndpoint() view returns (address)",
    // ]
    // let bridge = await ethers.getContractAt(abi_bridge, arbBridge);
    // let layerZeroEndpoint = await bridge.layerZeroEndpoint();
    // console.log("layerZeroEndpoint:", layerZeroEndpoint);

    let chainId = await getChainId();
    let endPointAddr = await getLzEndPointByChainId(chainId);
    let endPoint = await ethers.getContractAt(abi, endPointAddr);

    let srcChainId = 10143;
    let dstChainId = 10121;
    let srcApp = "0xd43cbcc7642c1df8e986255228174c2cca58d65b";

    // console.log("endPoint:", endPoint.address);
    // let outboundNonce = await endPoint.getOutboundNonce(dstChainId, srcApp);
    // console.log("outboundNonce:", outboundNonce.toNumber()); // 365

    // let uaConfig = await endPoint.uaConfigLookup(srcApp);
    // console.log("uaConfig:", uaConfig);
    // uaConfig: [
    //   3,
    //   3,
    //   '0xCb78eEfd5fD0fA8DDB0C5e3FbC3bDcCba545Ae67',
    //   '0xCb78eEfd5fD0fA8DDB0C5e3FbC3bDcCba545Ae67',
    //   sendVersion: 3,
    //   receiveVersion: 3,
    //   receiveLibraryAddress: '0xCb78eEfd5fD0fA8DDB0C5e3FbC3bDcCba545Ae67',
    //   sendLibrary: '0xCb78eEfd5fD0fA8DDB0C5e3FbC3bDcCba545Ae67'
    // ]

    let srcApp2 = ethers.utils.solidityPack(['address', 'address'], ["0xd43cbcc7642c1df8e986255228174c2cca58d65b", "0xE6612eB143e4B350d55aA2E229c80b15CA336413"])
    let has = await endPoint.hasStoredPayload(srcChainId, srcApp2);
    console.log("hasStoredPayload:", has);

    let inboundNonce = await endPoint.getInboundNonce(srcChainId, srcApp2);
    console.log("inboundNonce:", inboundNonce.toNumber()); // 312
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
