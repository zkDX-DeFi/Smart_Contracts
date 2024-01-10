import {createClient} from '@layerzerolabs/scan-client';

// Initialize a client with the desired environment
const client = createClient('testnet');

async function main() {
    let hash = "0x857bf1ebb5544f4e1cd0cf7994cfe9afb48be360ec97a18a3ab9106d4e92b776";
    const {messages} = await client.getMessagesBySrcTxHash(hash);
    console.log(messages)

    // let srcChainId = getLzChainIdByNetworkName("arbitrum_goerli");
    // waitForMessageReceived(srcChainId, hash)
    //     .then((message) => {
    //         console.log("message received: ", message);
    //     })
    //     .finally(() => {
    //         console.log("done");
    //     });
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
