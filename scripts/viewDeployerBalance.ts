import hardhatConfig from "../hardhat.config";
import {ANOTHER_USER_ADDRESS, SHORT_INTERVAL_MULTIPLIER, WAIT_TX_IN_MS} from "../helpers/constants";
import {sleep} from "../helpers/utils2";

const ethers = require('ethers');


async function getBalance(networkName, address) {
    const networkConfig = hardhatConfig.networks[networkName];
    const provider = new ethers.providers.JsonRpcProvider(networkConfig);
    const balance = await provider.getBalance(address);
    console.log(`Balance on ${networkName}: ${ethers.utils.formatEther(balance)}`);
    await sleep(WAIT_TX_IN_MS * SHORT_INTERVAL_MULTIPLIER);
}

// Specify the networks and address
const networks = [
    // 'zksync_testnet',

    // 'mantle_testnet',
    // 'celo_test',
    // 'base_testnet',
    // 'conflux_test',
    // 'optimism_goerli',
    //
    // 'arbitrum_goerli',
    // 'fuji',
    // 'bsc_testnet',
    // 'linea_testnet',
    // 'mumbai',
    //
    'scroll_sepolia',
];
const address = ANOTHER_USER_ADDRESS;

// Updated to handle async function calls
Promise.all(networks.map(network => getBalance(network, address)))
    .catch(e => console.error(e)); // To handle any errors thrown by getBalance
