import {getLzEndPointByChainId} from "../../helpers/chains";
import {ethers, getChainId} from "hardhat";
import {getLzChainIdByNetworkName} from "../../helpers/lzUtils";
import {solidityPack} from "ethers/lib/utils";
import {getDeploymentAddresses} from "../../helpers/readStatic";
import {HASH_256_ZERO} from "../../helpers/utils";

async function main() {

    let chainId = await getChainId();
    let lzEndpointAddr = await getLzEndPointByChainId(chainId);
    let lzEndpoint = await ethers.getContractAt("LZEndpoint", lzEndpointAddr);

    let srcChainId = getLzChainIdByNetworkName("zksync_mainnet");
    let esZKDX = await ethers.getContract("esZKDXOmni");
    let localAddress = esZKDX.address;
    let remoteAddress = getDeploymentAddresses("zksync_mainnet")["esZKDXOmni"];
    let path = solidityPack(['address', 'address'], [remoteAddress, localAddress])

    let hash = "0x8d608e8e02cb05268d13f0ee50fcf5571b435e0fb92a2c2fff4e69804a41fd95";
    let has = await lzEndpoint.hasStoredPayload(srcChainId, path);
    console.log("hasStoredPayload:", has);
    if(has){
        let receipt = await ethers.provider.getTransactionReceipt(hash)
        // console.log("receipt:", receipt);
        let PayloadStoredEvent = lzEndpoint.interface.parseLog(receipt.logs[1]);
        // console.log("PayloadStoredEvent1:", PayloadStoredEvent);
        let payload = PayloadStoredEvent["args"]["payload"];
        let tx = await lzEndpoint.retryPayload(srcChainId, path, payload);
        console.log("hash:", tx.hash);
    }


    let inboundNonce = await lzEndpoint.getInboundNonce(srcChainId, path);
    console.log("inboundNonce:", inboundNonce.toNumber());
    let failedMsg = await esZKDX.failedMessages(srcChainId, path, 1);
    console.log("failedMsg:", failedMsg);

    if(failedMsg != HASH_256_ZERO){
        let receipt = await ethers.provider.getTransactionReceipt(hash)
        console.log("receipt:", receipt);
        let PayloadStoredEvent = esZKDX.interface.parseLog(receipt.logs[3]);
        console.log("PayloadStoredEvent2:", PayloadStoredEvent);
        let payload = PayloadStoredEvent["args"]["_payload"];
        console.log("payload:", payload);
        // await esZKDX.retryMessage(srcChainId, path, 1, payload);
    }
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
