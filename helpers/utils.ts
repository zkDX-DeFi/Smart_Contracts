import {deployments, ethers, getChainId, network} from "hardhat";
import chalk from "chalk";
import {
    LPool,
    OrderBook,
    OrderBookReader,
    PositionManager,
    PythContract,
    Reader,
    RewardRouterV2,
    Router,
    ShortsTracker,
    Timelock,
    Token,
    Vault,
    VaultErrorController,
    VaultPriceFeed,
    VaultUtils,
    ZKDLP,
    ZkdlpManager,
    ZKDXLV1,
    ZkdxStaking, ZKHLP, ZKLP,
    ZUSD,
    ZUSDPool
} from "../typechain";
import {formatEther, parseUnits} from "ethers/lib/utils";
import {BigNumber, BigNumberish, ContractTransaction} from "ethers";
import {
    CHAIN_ID_ARBITRUM_GOERLI,
    CHAIN_ID_BASE_TEST,
    CHAIN_ID_BSC_TESTNET,
    CHAIN_ID_CELO_TEST,
    CHAIN_ID_CONFLUX_TEST,
    CHAIN_ID_FUJI,
    CHAIN_ID_LINEA_TESTNET,
    CHAIN_ID_MANTLE_MAINNET,
    CHAIN_ID_MANTLE_TEST,
    CHAIN_ID_MUMBAI,
    CHAIN_ID_OPTIMISM_GOERLI,
    CHAIN_ID_SCROLL_MAINNET,
    CHAIN_ID_SCROLL_SEPOLIA,
    CHAIN_ID_ZKSYNC_TESTNET,
    connection,
    connectionMain,
    FEED_ID_BTC_MAIN,
    FEED_ID_BTC_TEST,
    FEED_ID_DOGE_MAIN,
    FEED_ID_DOGE_TEST,
    FEED_ID_ETH_MAIN,
    FEED_ID_ETH_TEST,
    FEED_ID_ORDI_MAIN,
    FEED_ID_ORDI_TEST,
    LONG_INTERVAL_MULTIPLIER,
    MEDIUM_INTERVAL_MULTIPLIER,
    SHORT_INTERVAL_MULTIPLIER,
    USDC_FAUCET_INTERVAL,
    VERY_SHORT_INTERVAL_MULTIPLIER,
    WAIT_TX_IN_MS,
    WETH_DEFAULT_AMOUNT
} from "./constants";
import {
    DISTINCT_CHAIN_IDS,
    getDeployByChainIdAndName,
    isChainIdMainnet,
    isChainIdTestnet,
    PYTH_CONTRACT_BY_CHAIN_ID
} from "./chains";

export const {AddressZero, MaxInt256: ApproveAmount} = ethers.constants
export const AddressOne = "0x0000000000000000000000000000000000000001";
export const HASH_256_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
export const setupFixture = deployments.createFixture(async () => {
    await deployments.fixture();
    return getContracts();
});

export async function getContracts() {
    const chainId = await getChainId();
    const contracts: any = {
        vault: await ethers.getContract<Vault>("Vault"),
        router: await ethers.getContract<Router>("Router"),
        vaultPriceFeed: await ethers.getContract<VaultPriceFeed>("VaultPriceFeed"),
        wnative: await ethers.getContract<Token>("WNative"),
        wbtc: await ethers.getContract<Token>("WBTC"),
        usdm: await ethers.getContract<Token>("ZKUSD"),
        ZKUSD: await ethers.getContract<Token>("ZKUSD"),
        timelock: await ethers.getContract<Timelock>("Timelock"),
        positionManager: await ethers.getContract<PositionManager>("PositionManager"),
        reader: await ethers.getContract<Reader>("Reader"),
        vaultUtils: await ethers.getContract<VaultUtils>("VaultUtils"),
        vaultErrorController: await ethers.getContract<VaultErrorController>("VaultErrorController"),
        rewardRouter: await ethers.getContract<RewardRouterV2>("RewardRouter"),
        zkdlp: await ethers.getContract<ZKDLP>("ZKDLP"),
        zkdlpManager: await ethers.getContract<ZkdlpManager>("ZkdlpManager"),
        shortsTracker: await ethers.getContract<ShortsTracker>("ShortsTracker"),
        ZKDX: await ethers.getContract<Token>("ZKDX"),
        stakingETH: await ethers.getContract<ZkdxStaking>("ZkdxStakingETH"),
        stakingUSDC: await ethers.getContract<ZkdxStaking>("ZkdxStakingUSDC"),
        VaultUtils: await ethers.getContract<VaultUtils>("VaultUtils"),
        pythContract: await ethers.getContract<PythContract>("PythContract"),
        weth: await ethers.getContract<Token>("WNative"),
        dai: await ethers.getContract<Token>("ZUSD"),
        orderBook: await ethers.getContract<OrderBook>("OrderBook"),
        tsla: await ethers.getContract<Token>("TSLA"),
        esZKDX: await ethers.getContract<Token>("esZKDX"),
        usdc: await ethers.getContract<Token>("trueUSDC"),
        zkdxlv1: await ethers.getContract<ZKDXLV1>("ZKDXLV1"),
        orderBookReader: await ethers.getContract<OrderBookReader>("OrderBookReader"),
        zusd: await ethers.getContract<ZUSD>("ZUSD"),
        zusdPool: await ethers.getContract<ZUSDPool>("ZUSDPool"),
        zklp: await ethers.getContract<ZKLP>("ZKLP"),
        zkhlp: await ethers.getContract<ZKHLP>("ZKHLP"),
        lpool: await ethers.getContract<LPool>("LPool"),
        hlpool: await ethers.getContract<LPool>("HLPool"),
    };
    let users: any = {
        owner: await ethers.getNamedSigner("owner"),
        user0: await ethers.getNamedSigner("user0"),
        user1: await ethers.getNamedSigner("user1"),
        user2: await ethers.getNamedSigner("user2"),
        user3: await ethers.getNamedSigner("user3"),
        user4: await ethers.getNamedSigner("user4"),
        positionKeeper: await ethers.getNamedSigner("positionKeeper"),
        tokenManager: await ethers.getNamedSigner("tokenManager"),
        mintReceiver: await ethers.getNamedSigner("mintReceiver"),
        miner: await ethers.getNamedSigner("miner"),
        feeTo: await ethers.getNamedSigner("feeTo"),
        receiver: await ethers.getNamedSigner("receiver"),
    }
    return {...contracts, ...users};
}

export function newWallet() {
    return ethers.Wallet.createRandom()
}

export function bigNumberify(n: BigNumberish) {
    try {
        return BigNumber.from(n);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error("bigNumberify error", e);
        return undefined;
    }
}

export function expandDecimals(n: number, decimals: number) {
    // @ts-ignore
    return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
}

export function toUsd(value: number) {
    return ethers.utils.parseUnits(value.toString(), 30);
}

export function toChainlinkPrice(value: number) {
    return parseUnits(value.toString(), 8)
}

// CHAIN UTILS
export async function reportGasUsed(tx: any, label: any) {
    const {gasUsed} = await ethers.provider.getTransactionReceipt(tx.hash)
    console.info(label, gasUsed.toString())
    return gasUsed
}

export async function getGasUsedAndGasPrice(_tx: any, _label: any) {
    const {gasUsed} = await ethers.provider.getTransactionReceipt(_tx.transactionHash)
    const gasPrice = await ethers.provider.getGasPrice();
    const gasFee = gasUsed.mul(gasPrice);
    console.info(chalk.greenBright("gasFee", formatEther(gasFee.toString())));
    return {gasUsed, gasPrice, gasFee}
}

export const mineBlocks = async (blockNumber: number) => {
    while (blockNumber > 0) {
        blockNumber--;
        await network.provider.send("evm_mine");
    }
}

export async function getBlockTime(provider: any) {
    const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    return block.timestamp
}

export async function getGasFee(tx: ContractTransaction) {
    let gas = (await ethers.provider.getTransactionReceipt(tx.hash)).gasUsed;
    let gasPrice = await ethers.provider.getGasPrice();
    return gas.mul(gasPrice);
}

export const forwardTime = async (seconds: number) => {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
}


//PYTH NETWORK
export async function getUpdateDataTestnet(feedIds: string[], _chainId: string) {
    if (isChainIdTestnet(_chainId)) {
        const pythContractAddress = PYTH_CONTRACT_BY_CHAIN_ID[_chainId];
        const pythContract = await ethers.getContractAt<PythContract>("PythContract", pythContractAddress);
        const updateData = await connection.getPriceFeedsUpdateData(feedIds);
        const fee = await pythContract.getUpdateFee(updateData);
        return {updateData, fee};
    }
}

export async function getUpdateDataMainnet(feedIds: string[], chainId: string) {
    if (isChainIdMainnet(chainId)) {
        let pythContractAddress = PYTH_CONTRACT_BY_CHAIN_ID[chainId];

        let updateData = await connectionMain.getPriceFeedsUpdateData(feedIds);
        let pythContract = await ethers.getContractAt<PythContract>("PythContract", pythContractAddress);
        let fee = await pythContract.getUpdateFee(updateData);
        console.log("fee", fee.toString());
        return {updateData, fee};
    }
}

export async function getUpdateDataTestnetAll(chainId: string) {
    // return getUpdateDataTestnet([FEED_ID_ETH_TEST, FEED_ID_BTC_TEST, FEED_ID_LTC_TEST, FEED_ID_ARB_TEST, FEED_ID_DOGE_TEST, FEED_ID_FIL_TEST,FEED_ID_MSFT_TEST, FEED_ID_TSLA_TEST, FEED_ID_USDC_TEST],chainId);
    return getUpdateDataTestnet([FEED_ID_ETH_TEST, FEED_ID_BTC_TEST, FEED_ID_DOGE_TEST, FEED_ID_ORDI_TEST], chainId);
}

export async function getUpdateDataMainnetAll(chainId: string) {
    // return getUpdateDataMainnet([FEED_ID_ETH_MAIN, FEED_ID_BTC_MAIN, FEED_ID_LTC_MAIN, FEED_ID_ARB_MAIN, FEED_ID_DOGE_MAIN, FEED_ID_FIL_MAIN, FEED_ID_MSFT_MAIN, FEED_ID_TSLA_MAIN, FEED_ID_USDC_MAIN],chainId);
    return getUpdateDataMainnet([FEED_ID_ETH_MAIN, FEED_ID_BTC_MAIN, FEED_ID_DOGE_MAIN, FEED_ID_ORDI_MAIN], chainId);
}

export async function getUpdateDataAllByChainId(chainId: string) {
    if (isChainIdTestnet(chainId)) {
        return await getUpdateDataTestnetAll(chainId);
    } else {
        return await getUpdateDataMainnetAll(chainId);
    }
}

// DEPLOYMENTS
export async function waitContractDeployed(_contract: any, _contractName: string) {
    await new Promise(resolve => setTimeout(resolve, WAIT_TX_IN_MS));
    let transactionHash = _contract.transactionHash;
    let address = _contract.address;
    // Check if the contract has been newly deployed or if it's a transaction object
    if (_contract.newlyDeployed || transactionHash) {
        // Wait for the transaction to be confirmed on the blockchain
        const receipt = await ethers.provider.waitForTransaction(transactionHash);
        // Handle the case where the address is not available
        if (!address) {
            console.log(`${_contractName} transaction ${transactionHash} confirmed with ${receipt.gasUsed.toString()} gas used`);
        } else {
            console.log(`${_contractName} deployed at ${address} by transaction ${transactionHash} with ${receipt.gasUsed.toString()} gas used`);
        }
        await getGasUsedAndGasPrice(_contract, _contractName);
    }

}

export function getGasLimit(_chainId: string): number {
    switch (_chainId) {
        case CHAIN_ID_ARBITRUM_GOERLI:
            return 7000000; // 7M
        case CHAIN_ID_BASE_TEST:
            return 7000000; // 7M
        case CHAIN_ID_MANTLE_TEST:
            return 7000000; // 7M
        case CHAIN_ID_ZKSYNC_TESTNET:
            return 7000000; // 7M
        case CHAIN_ID_CONFLUX_TEST:
            return 14000000; // 14M
        case CHAIN_ID_ZKSYNC_TESTNET:
            return 40000000; // 40M
        default: // Default GAS_LIMIT for other networks
            return 7000000; // 7M
    }
}

export function getGasPrice(_chainId: string): BigNumber {
    switch (_chainId) {
        case CHAIN_ID_ARBITRUM_GOERLI:
            return parseUnits("3", "gwei"); // 5G => ARB_GOERLI
        case CHAIN_ID_BASE_TEST:
            return parseUnits("2", "gwei"); // 3G => BASE_TEST
        case CHAIN_ID_MANTLE_TEST:
            return parseUnits("20", "gwei"); // 1WEI => MANTLE_TEST
        case CHAIN_ID_ZKSYNC_TESTNET:
            return parseUnits("3", "gwei"); // 3 Gwei => ZK_TEST
        case CHAIN_ID_CELO_TEST:
            return parseUnits("20", "gwei"); // 20G => CELO_TEST
        case CHAIN_ID_CONFLUX_TEST:
            return parseUnits("30", "gwei"); // 30G => CONFLUX_TEST
        case CHAIN_ID_OPTIMISM_GOERLI:
            return parseUnits("3", "gwei"); // 3 Gwei => OPT_TEST
        case CHAIN_ID_FUJI:
            return parseUnits("30", "gwei"); // 30 Gwei => FUJI
        case CHAIN_ID_BSC_TESTNET:
            return parseUnits("10", "gwei"); // 10 Gwei => BSC_TEST
        case CHAIN_ID_LINEA_TESTNET:
            return parseUnits("2", "gwei"); // 10 Gwei => LINEA_TEST
        case CHAIN_ID_SCROLL_SEPOLIA:
            return parseUnits("1.2", "gwei"); // 2 Gwei => SCROLL_TEST
        case CHAIN_ID_SCROLL_MAINNET:
            return parseUnits("0.5", "gwei"); // 0.5 Gwei => SCROLL_MAINNET
        case CHAIN_ID_MANTLE_MAINNET:
            return parseUnits("3", "gwei"); // 3G => MANTLE_MAINNET

        default: // Default GAS_PRICE for other networks
            return parseUnits("2", "gwei"); // 3 Gwei
    }
}

export function getUSDCInterval(_chainId: string): number {
    if (isChainIdMainnet(_chainId)) {
        return USDC_FAUCET_INTERVAL;
    } else if (isChainIdTestnet(_chainId)) {
        return 0;
    }
    ;
}

export function getInterval(_chainId: string): number {
    switch (_chainId) {

        case CHAIN_ID_BASE_TEST:
            return WAIT_TX_IN_MS * SHORT_INTERVAL_MULTIPLIER;
        case CHAIN_ID_MANTLE_TEST:
            return WAIT_TX_IN_MS * MEDIUM_INTERVAL_MULTIPLIER;
        case CHAIN_ID_CELO_TEST:
            return WAIT_TX_IN_MS * SHORT_INTERVAL_MULTIPLIER;

        case CHAIN_ID_CONFLUX_TEST:
            return WAIT_TX_IN_MS * SHORT_INTERVAL_MULTIPLIER;
        case CHAIN_ID_OPTIMISM_GOERLI:
            return WAIT_TX_IN_MS * VERY_SHORT_INTERVAL_MULTIPLIER;
        case CHAIN_ID_FUJI:
            return WAIT_TX_IN_MS * SHORT_INTERVAL_MULTIPLIER;
        case CHAIN_ID_ARBITRUM_GOERLI:
            return WAIT_TX_IN_MS * SHORT_INTERVAL_MULTIPLIER;
        case CHAIN_ID_MUMBAI:
            return WAIT_TX_IN_MS * MEDIUM_INTERVAL_MULTIPLIER;
        case CHAIN_ID_SCROLL_SEPOLIA:
            return WAIT_TX_IN_MS * MEDIUM_INTERVAL_MULTIPLIER;
        default:
            return WAIT_TX_IN_MS * SHORT_INTERVAL_MULTIPLIER;
    }
}

export function getLongInterval(_chainId: string): number {
    switch (_chainId) {
        default:
            return WAIT_TX_IN_MS * LONG_INTERVAL_MULTIPLIER;
    }
}

export function isAddressZero(_address: string): boolean {
    return _address === ethers.constants.AddressZero;
}

export async function getWETHOrDeployWETH(chainId) {
    if (DISTINCT_CHAIN_IDS.includes(chainId)) {
        return await getDeployByChainIdAndName(chainId, "WETH", "Token", ["WETH", 18, WETH_DEFAULT_AMOUNT, 0, 0]);
    } else {
        return await deployments.get("WNative"); //OTHER LAYER2
    }
}

export async function getWETHContract(chainId) {
    if (DISTINCT_CHAIN_IDS.includes(chainId)) {
        return await ethers.getContract("WETH"); //mumbai + bsc
    } else {
        return await ethers.getContract("WNative"); //other chain
    }
}

export async function getStableToken(chainId) {
    if (isChainIdTestnet(chainId) || isChainIdMainnet(chainId)) {
        return await ethers.getContract("USDC");
    }
}

export function checkAddresses(addressList: string[]) {
    let invalids = [];
    for (let i = 0; i < addressList.length; i++) {
        let addr = addressList[i]
        if (!ethers.utils.isAddress(addr))
            invalids.push(addr);
    }
    if (invalids.length > 0)
        throw new Error("!! invalid addresses: " + invalids);
    return true;
}
