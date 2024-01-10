import {getLzEndPointByChainId, getStgRouterByChainId} from "../../helpers/chains";
import {ethers, getChainId} from "hardhat";
import {getLzChainIdByNetworkName} from "../../helpers/lzUtils";
import {solidityPack} from "ethers/lib/utils";

const abi = require("./abi/LzEndPointTestnet.json");

async function main() {

    let chainId = await getChainId();
    let endPointAddr = await getLzEndPointByChainId(chainId);
    let endPoint = await ethers.getContractAt(abi, endPointAddr);
    console.log("endPoint:", endPoint.address);

    // let receipt = await ethers.provider.getTransactionReceipt("0x46344655a668b01ca292408e0d2e05882a5e29ee228895aa42559fb562e91d0b")
    // console.log("receipt:", receipt);
    // let PayloadStoredEvent = endPoint.interface.parseLog(receipt.logs[1]);
    // console.log("PayloadStoredEvent:", PayloadStoredEvent);
    // let payload = PayloadStoredEvent["args"]["payload"];
    // console.log("payload:", payload);

    // blocked 136
    // https://testnet.layerzeroscan.com/10143/address/0xd43cbcc7642c1df8e986255228174c2cca58d65b/message/10132/address/0x5a7465e1a68f430e7a696adbc5c107528c1cc9d0/nonce/136

    // stored 105
    // https://testnet.layerzeroscan.com/10143/address/0xd43cbcc7642c1df8e986255228174c2cca58d65b/message/10132/address/0x5a7465e1a68f430e7a696adbc5c107528c1cc9d0/nonce/105

    let srcChainId = getLzChainIdByNetworkName("arbitrum_goerli");
    // let trustedRemote = solidityPack(['address', 'address'], ["0xa1E105511416aEc3200CcE7069548cF332c6DCA2", "0x29fBC4E4092Db862218c62a888a00F9521619230"])
    let trustedRemote = solidityPack(['address', 'address'], ["0xd43cbCC7642C1Df8e986255228174C2cca58d65b", "0x5A7465e1a68F430E7A696aDBC5C107528C1cC9d0"])

    let has = await endPoint.hasStoredPayload(srcChainId, trustedRemote);
    console.log("hasStoredPayload:", has);
    let inboundNonce = await endPoint.getInboundNonce(srcChainId, trustedRemote);
    console.log("inboundNonce:", inboundNonce.toNumber());

    // let tx = await endPoint.forceResumeReceive(srcChainId, trustedRemote);
    // console.log("tx:", tx);
    // let routerAddr = getStgRouterByChainId(chainId);
    // let router = await ethers.getContractAt("StgRouter", routerAddr);
    // let cachedSwap = await router.cachedSwapLookup(srcChainId, trustedRemote, inboundNonce);
    // console.log("cachedSwap:", cachedSwap);
    // let tx = await endPoint.retryPayload(srcChainId, trustedRemote, payload);
    // console.log("tx:", tx);


}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
