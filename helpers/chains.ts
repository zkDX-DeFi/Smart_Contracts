import {deployments, ethers, getNamedAccounts} from "hardhat";
import {parseEther} from "ethers/lib/utils";
import {
    CHAIN_ID_ARBITRUM_GOERLI,
    CHAIN_ID_BASE_MAINNET,
    CHAIN_ID_BASE_TEST,
    CHAIN_ID_BSC_TESTNET,
    CHAIN_ID_CELO_TEST,
    CHAIN_ID_CONFLUX_TEST,
    CHAIN_ID_FUJI,
    CHAIN_ID_GOERLI,
    CHAIN_ID_LINEA_MAINNET,
    CHAIN_ID_LINEA_TESTNET,
    CHAIN_ID_LOCAL, CHAIN_ID_MANTLE_MAINNET,
    CHAIN_ID_MANTLE_TEST, CHAIN_ID_METIS_TESTNET,
    CHAIN_ID_MUMBAI,
    CHAIN_ID_OPTIMISM,
    CHAIN_ID_OPTIMISM_GOERLI, CHAIN_ID_SCROLL_MAINNET,
    CHAIN_ID_SCROLL_SEPOLIA,
    CHAIN_ID_ZKSYNC_MAINNET,
    CHAIN_ID_ZKSYNC_TESTNET,
    CHAIN_NAME_ARBITRUM_GOERLI,
    CHAIN_NAME_BASE_MAINNET,
    CHAIN_NAME_BASE_TEST,
    CHAIN_NAME_BSC_TESTNET,
    CHAIN_NAME_CELO_TEST,
    CHAIN_NAME_CONFLUX_TEST,
    CHAIN_NAME_FUJI,
    CHAIN_NAME_LINEA_MAINNET,
    CHAIN_NAME_LINEA_TESTNET,
    CHAIN_NAME_LOCAL, CHAIN_NAME_MANTLE_MAINNET,
    CHAIN_NAME_MANTLE_TEST, CHAIN_NAME_METIS_TESTNET,
    CHAIN_NAME_MUMBAI,
    CHAIN_NAME_OPTIMISM,
    CHAIN_NAME_OPTIMISM_GOERLI, CHAIN_NAME_SCROLL_MAINNET,
    CHAIN_NAME_SCROLL_SEPOLIA,
    CHAIN_NAME_ZKSYNC_MAINNET,
    CHAIN_NAME_ZKSYNC_TESTNET,
    ENDPOINT_ARBITRUM_GOERLI,
    ENDPOINT_BASE_MAINNET,
    ENDPOINT_BASE_TESTNET,
    ENDPOINT_BSC_TESTNET,
    ENDPOINT_FUJI,
    ENDPOINT_GOERLI,
    ENDPOINT_LINEA_MAINNET,
    ENDPOINT_LINEA_TESTNET,
    ENDPOINT_MUMBAI,
    ENDPOINT_OPTIMISM_GOERLI, ENDPOINT_ZKSYNC_MAINNET, ENDPOINT_ZKSYNC_TESTNET,
    FEED_ID_ARB_MAIN,
    FEED_ID_ARB_TEST,
    FEED_ID_BTC_MAIN,
    FEED_ID_BTC_TEST,
    FEED_ID_DOGE_MAIN,
    FEED_ID_DOGE_TEST,
    FEED_ID_ETH_MAIN,
    FEED_ID_ETH_TEST,
    FEED_ID_FIL_MAIN,
    FEED_ID_FIL_TEST,
    FEED_ID_LTC_MAIN,
    FEED_ID_LTC_TEST,
    FEED_ID_MSFT_MAIN,
    FEED_ID_MSFT_TEST, FEED_ID_ORDI_MAIN, FEED_ID_ORDI_TEST,
    FEED_ID_TSLA_MAIN,
    FEED_ID_TSLA_TEST,
    FEED_ID_USDC_MAIN,
    FEED_ID_USDC_TEST, PYTB_CONTRACT_SCROLL_MAINNET,
    PYTH_CONTRACT_ARBITRUM_TESTNET,
    PYTH_CONTRACT_BASE_MAINNET,
    PYTH_CONTRACT_BASE_TESTNET,
    PYTH_CONTRACT_BSC_TESTNET,
    PYTH_CONTRACT_CELO_TESTNET,
    PYTH_CONTRACT_CONFLUX_TESTNET,
    PYTH_CONTRACT_FUJI_TESTNET,
    PYTH_CONTRACT_LINEA_MAINNET,
    PYTH_CONTRACT_LINEA_TESTNET, PYTH_CONTRACT_MANTLE_MAINNET,
    PYTH_CONTRACT_MANTLE_TESTNET, PYTH_CONTRACT_METIS_TESTNET,
    PYTH_CONTRACT_MUMBAI_TESTNET,
    PYTH_CONTRACT_OPTIMISM_TESTNET,
    PYTH_CONTRACT_SCROLL_SEPOLIA,
    PYTH_CONTRACT_ZKSYNC_MAINNET,
    PYTH_CONTRACT_ZKSYNC_TESTNET,
    STG_ROUTER_ARBITRUM_GOERLI,
    STG_ROUTER_BASE_TESTNET,
    STG_ROUTER_BSC_TESTNET,
    STG_ROUTER_ETH_BASE_MAINNET,
    STG_ROUTER_ETH_GOERLI,
    STG_ROUTER_ETH_LINEA_MAINNET,
    STG_ROUTER_ETH_OPTIMISM_GOERLI,
    STG_ROUTER_FUJI,
    STG_ROUTER_GOERLI,
    STG_ROUTER_LINEA_TESTNET,
    STG_ROUTER_MUMBAI,
    STG_ROUTER_OPTIMISM,
    STG_ROUTER_OPTIMISM_GOERLI,
    STG_USDC_ARBITRUM_GOERLI,
    STG_USDC_BASE_TESTNET,
    STG_USDC_FUJI,
    STG_USDC_GOERLI,
    STG_USDC_LINEA_TESTNET,
    STG_USDC_MUMBAI,
    STG_USDC_OPTIMISM_GOERLI, USDC_LINEA_MAINNET,
    USDC_ZKSYNC_MAINNET, WETH_LINEA_MAINNET,
    WETH_ZKSYNC_MAINNET
} from "./constants";
import {AddressZero, getGasLimit, getGasPrice, waitContractDeployed} from "./utils";

const {deploy, execute, get} = deployments;

export const getNativeNameByChainId = (chainId: string) => {
    if (chainId == CHAIN_ID_MUMBAI)
        return "WMatic";
    else
        return "WETH";
}
export const getDeployByChainIdAndName = async (chainId: string, deployName: string, contractName: string, args: any[]) => {
    const {owner, deployer} = await getNamedAccounts();
    let result;

    try {
        let deployed = await get(deployName);
        if (deployed != null) {
            console.log(">>> reusing contract:", deployName);
            result = await ethers.getContractAt(contractName, deployed.address);
            return result;
        }
    } catch (e) {
    }

    if (chainId == CHAIN_ID_LOCAL) {
        const deployed = await deploy(deployName, {
            contract: contractName,
            from: owner,
            args: args,
            log: true,
        });
        result = await ethers.getContractAt(contractName, deployed.address);
        if (deployName == "WNative") {
            const {miner} = await getNamedAccounts();
            await execute("WNative", {from: miner, value: parseEther("100")}, "deposit"); // deposit eth in case withdraw
        }
    } else {
        // const deployed = await deploy(deployName, {
        //     contract: contractName,
        //     from: deployer,
        //     args: args,
        //     log: true,
        //     gasLimit: GAS_LIMIT,
        //     gasPrice: GAS_PRICE
        // });

        const deployed = await deploy(deployName, await DefaultParams2(chainId,
            {
                contract: contractName,
                args: args
            }));

        await waitContractDeployed(deployed, deployName)
        result = await ethers.getContractAt(contractName, deployed.address);
    }

    if (!result)
        throw new Error("getDeployByChainIdAndName Wrong!");
    return result;
};
export const getPythAddressByChainId = async (chainId: string) => {
    if (isChainIdTestnet(chainId) || isChainIdMainnet(chainId)) {
        // return getPythContractByChainId(chainId);
        return PYTH_CONTRACT_BY_CHAIN_ID[chainId];
    } else {
        const {owner} = await getNamedAccounts();
        const PythContract = await deploy("PythContract", {
            from: owner,
            args: [],
            log: true,
        });
        return PythContract.address;
    }
}
export const getFeedIdByChainAndToken = (chainId: string, token: string) => {
    token = token.toUpperCase();
    if (isChainIdMainnet(chainId)) {
        switch (token) {
            case "WBTC":
                return FEED_ID_BTC_MAIN;
            case "WETH":
                return FEED_ID_ETH_MAIN;
            case "WNATIVE":
                return FEED_ID_ETH_MAIN;
            case "USDC":
                return FEED_ID_USDC_MAIN;
            case "DOGE":
                return FEED_ID_DOGE_MAIN;
            case "LTC":
                return FEED_ID_LTC_MAIN;
            case "ARB":
                return FEED_ID_ARB_MAIN;
            case "FIL":
                return FEED_ID_FIL_MAIN;
            case "MSFT":
                return FEED_ID_MSFT_MAIN;
            case "TSLA":
                return FEED_ID_TSLA_MAIN;
            case "ORDI":
                return FEED_ID_ORDI_MAIN;
        }
    } else {
        switch (token) {
            case "WBTC":
                return FEED_ID_BTC_TEST;
            case "WETH":
                return FEED_ID_ETH_TEST;
            case "WNATIVE":
                return FEED_ID_ETH_TEST;
            case "USDC":
                return FEED_ID_USDC_TEST;
            case "DOGE":
                return FEED_ID_DOGE_TEST;
            case "LTC":
                return FEED_ID_LTC_TEST;
            case "ARB":
                return FEED_ID_ARB_TEST;
            case "FIL":
                return FEED_ID_FIL_TEST;
            case "MSFT":
                return FEED_ID_MSFT_TEST;
            case "TSLA":
                return FEED_ID_TSLA_TEST;
            case "ORDI":
                return FEED_ID_ORDI_TEST;
        }
    }
}
export const getRobotsByChainId = (chainId: string) => {
    let robots = [];
    if (CHAIN_ID_ZKSYNC_TESTNET == chainId) {
        robots = [
            "0x3aaa18176100dd870903d465134d0522457aa70d",
            "0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2",
            "0x104b5cda666a504da51220035f930a77b22b8124",
        ]
    } else if (CHAIN_ID_ZKSYNC_MAINNET == chainId) {
        robots = [
            "0xe118d2e27cdbb2cf1e67000a22b9d6b57e06eb3a"
        ]
    }
    return robots;
}
export const getWethAndUSDCByChainIdAndName = async (chainId: string) => {
    let wethAddress, usdcAddress;
    if (CHAIN_ID_ZKSYNC_MAINNET == chainId) {
        wethAddress = WETH_ZKSYNC_MAINNET;
        usdcAddress = USDC_ZKSYNC_MAINNET;
    } else if (CHAIN_ID_LINEA_MAINNET == chainId) {
        wethAddress = WETH_LINEA_MAINNET;
        usdcAddress = USDC_LINEA_MAINNET;
    } else if (isChainIdTestnet(chainId)) {
        const trueWETH = await getDeployByChainIdAndName(chainId, "trueWETH", "Token", ["trueWETH", 18, parseEther("100000000"), parseEther("100000"), 0]);
        const trueUSDC = await getDeployByChainIdAndName(chainId, "trueUSDC", "Token", ["trueUSDC", 6, parseEther("100000000"), parseEther("100000"), 0]);
        wethAddress = trueWETH.address;
        usdcAddress = trueUSDC.address;
    } else {
        const WETH = await get("WNative");
        const USDC = await getDeployByChainIdAndName(chainId, "trueUSDC", "Token", ["trueUSDC", 6, parseEther("100000000"), parseEther("100000"), 0]);
        wethAddress = WETH.address;
        usdcAddress = USDC.address;
    }
    return {wethAddress, usdcAddress};
}

// deployments
export const DISTINCT_CHAIN_IDS = [CHAIN_ID_MUMBAI, CHAIN_ID_BSC_TESTNET];
export const CHAIN_NAME_BY_ID = {
    // TESTNETS
    [CHAIN_ID_LOCAL]: CHAIN_NAME_LOCAL,
    [CHAIN_ID_MUMBAI]: CHAIN_NAME_MUMBAI,
    [CHAIN_ID_ZKSYNC_TESTNET]: CHAIN_NAME_ZKSYNC_TESTNET,
    [CHAIN_ID_ARBITRUM_GOERLI]: CHAIN_NAME_ARBITRUM_GOERLI,
    [CHAIN_ID_FUJI]: CHAIN_NAME_FUJI,

    [CHAIN_ID_OPTIMISM_GOERLI]: CHAIN_NAME_OPTIMISM_GOERLI,
    [CHAIN_ID_CONFLUX_TEST]: CHAIN_NAME_CONFLUX_TEST,
    [CHAIN_ID_LINEA_TESTNET]: CHAIN_NAME_LINEA_TESTNET,
    [CHAIN_ID_CELO_TEST]: CHAIN_NAME_CELO_TEST,
    [CHAIN_ID_MANTLE_TEST]: CHAIN_NAME_MANTLE_TEST,

    [CHAIN_ID_BASE_TEST]: CHAIN_NAME_BASE_TEST,
    [CHAIN_ID_BSC_TESTNET]: CHAIN_NAME_BSC_TESTNET,
    [CHAIN_ID_SCROLL_SEPOLIA]: CHAIN_NAME_SCROLL_SEPOLIA,
    [CHAIN_ID_METIS_TESTNET]: CHAIN_NAME_METIS_TESTNET,
    //MAINNETS
    [CHAIN_ID_OPTIMISM]: CHAIN_NAME_OPTIMISM,
    [CHAIN_ID_ZKSYNC_MAINNET]: CHAIN_NAME_ZKSYNC_MAINNET,
    [CHAIN_ID_LINEA_MAINNET]: CHAIN_NAME_LINEA_MAINNET,
    [CHAIN_ID_BASE_MAINNET]: CHAIN_NAME_BASE_MAINNET,
    [CHAIN_ID_SCROLL_MAINNET]: CHAIN_NAME_SCROLL_MAINNET,
    [CHAIN_ID_MANTLE_MAINNET]: CHAIN_NAME_MANTLE_MAINNET
};
export const PYTH_CONTRACT_BY_CHAIN_ID: { [key: string]: string } = {
    [CHAIN_ID_MUMBAI]: PYTH_CONTRACT_MUMBAI_TESTNET,
    [CHAIN_ID_ZKSYNC_TESTNET]: PYTH_CONTRACT_ZKSYNC_TESTNET,
    [CHAIN_ID_ARBITRUM_GOERLI]: PYTH_CONTRACT_ARBITRUM_TESTNET,
    [CHAIN_ID_FUJI]: PYTH_CONTRACT_FUJI_TESTNET,

    [CHAIN_ID_OPTIMISM_GOERLI]: PYTH_CONTRACT_OPTIMISM_TESTNET,
    [CHAIN_ID_CONFLUX_TEST]: PYTH_CONTRACT_CONFLUX_TESTNET,
    [CHAIN_ID_LINEA_TESTNET]: PYTH_CONTRACT_LINEA_TESTNET,
    [CHAIN_ID_CELO_TEST]: PYTH_CONTRACT_CELO_TESTNET,
    [CHAIN_ID_MANTLE_TEST]: PYTH_CONTRACT_MANTLE_TESTNET,

    [CHAIN_ID_BASE_TEST]: PYTH_CONTRACT_BASE_TESTNET,
    [CHAIN_ID_BSC_TESTNET]: PYTH_CONTRACT_BSC_TESTNET,
    [CHAIN_ID_SCROLL_SEPOLIA]: PYTH_CONTRACT_SCROLL_SEPOLIA,
    [CHAIN_ID_METIS_TESTNET]: PYTH_CONTRACT_METIS_TESTNET,

    /*MAINNET*/
    [CHAIN_ID_ZKSYNC_MAINNET]: PYTH_CONTRACT_ZKSYNC_MAINNET,
    [CHAIN_ID_LINEA_MAINNET]: PYTH_CONTRACT_LINEA_MAINNET,
    [CHAIN_ID_BASE_MAINNET]: PYTH_CONTRACT_BASE_MAINNET,
    [CHAIN_ID_SCROLL_MAINNET]: PYTB_CONTRACT_SCROLL_MAINNET,
    [CHAIN_ID_MANTLE_MAINNET]: PYTH_CONTRACT_MANTLE_MAINNET
};


export const CHAIN_IDS: string[] = [
    CHAIN_ID_MUMBAI,
    CHAIN_ID_ZKSYNC_TESTNET,
    CHAIN_ID_ARBITRUM_GOERLI,
    CHAIN_ID_FUJI,

    CHAIN_ID_OPTIMISM_GOERLI,
    CHAIN_ID_CONFLUX_TEST,
    CHAIN_ID_LINEA_TESTNET,
    CHAIN_ID_CELO_TEST,
    CHAIN_ID_MANTLE_TEST,

    CHAIN_ID_BASE_TEST,
    CHAIN_ID_BSC_TESTNET,
    CHAIN_ID_SCROLL_SEPOLIA,
    CHAIN_ID_METIS_TESTNET
];
export const CHAIN_MAINNET_IDS: string[] = [
    CHAIN_ID_ZKSYNC_MAINNET,
    CHAIN_ID_LINEA_MAINNET,
    CHAIN_ID_BASE_MAINNET,
    CHAIN_ID_SCROLL_MAINNET,
    CHAIN_ID_MANTLE_MAINNET
];

export function isChainIdTestnet(chainId) {
    console.log(`chainId: ${chainId}, chainName: ${getChainNameFromId(chainId)}`);
    getALLChainIdAndNames();
    const result = CHAIN_IDS.includes(chainId);
    return result;
}

export function isChainIdMainnet(chainId) {
    console.log(`chainId: ${chainId}, chainName: ${getChainNameFromId(chainId)}`);
    const result = CHAIN_MAINNET_IDS.includes(chainId);
    return result;
}

export function getChainNameFromId(chainId) {
    return CHAIN_NAME_BY_ID[chainId];
}

export function getALLChainIdAndNames() {
    // use the function to get the chain names corresponding to the chain ids
    let chainIdAndNames = CHAIN_IDS.map(chainId => `${chainId}: ${getChainNameFromId(chainId)}`);
    console.log("CHAIN_ID_AND_NAMES: " + chainIdAndNames.join(','));
}

// export function getPythContractByChainId(chainId) {
//
//         switch(chainId) {
//             // TESETNET
//             case CHAIN_ID_ZKSYNC_TESTNET:
//                 return PYTH_CONTRACT_ZKSYNC_TESTNET;
//             case CHAIN_ID_MUMBAI:
//                 return PYTH_CONTRACT_MUMBAI_TESTNET;
//             case CHAIN_ID_ARBITRUM_GOERLI:
//                 return PYTH_CONTRACT_ARBITRUM_TESTNET;
//             case CHAIN_ID_FUJI:
//                 return PYTH_CONTRACT_FUJI_TESTNET;
//             case CHAIN_ID_OPTIMISM_GOERLI:
//                 return PYTH_CONTRACT_OPTIMISM_TESTNET;
//             case CHAIN_ID_CONFLUX_TEST:
//                 return PYTH_CONTRACT_CONFLUX_TESTNET;
//             case CHAIN_ID_CELO_TEST:
//                 return PYTH_CONTRACT_CELO_TESTNET;
//             case CHAIN_ID_LINEA_TESTNET:
//                 return PYTH_CONTRACT_LINEA_TESTNET;
//             case CHAIN_ID_MANTLE_TEST:
//                 return PYTH_CONTRACT_MANTLE_TESTNET;
//             case CHAIN_ID_BASE_TEST:
//                 return PYTH_CONTRACT_BASE_TESTNET;
//             case CHAIN_ID_BSC_TESTNET:
//                 return PYTH_CONTRACT_BSC_TESTNET;
//             //     MAINNET
//             case CHAIN_ID_ZKSYNC_MAINNET:
//                 return PYTH_CONTRACT_ZKSYNC_MAINNET;
//             case CHAIN_ID_LINEA_MAINNET:
//                 return PYTH_CONTRACT_LINEA_MAINNET;
//             case CHAIN_ID_BASE_MAINNET:
//                 return PYTH_CONTRACT_BASE_MAINNET;
//
//             default:
//                 throw new Error("Invalid chainId");
//         }
// }
export async function DefaultParams2(_chainId: string, extraParams = {}) {
    const {deployer} = await getNamedAccounts();
    let nonce = await ethers.provider.getTransactionCount(deployer, 'pending');
    console.log("nonce: " + nonce)
    return {
        from: deployer,
        log: true,
        // gasLimit: getGasLimit(_chainId),
        // gasPrice: getGasPrice(_chainId),
        // nonce: nonce,
        waitConfirmations: 1,
        ...extraParams  // Spread syntax to combine extraParams with the default params
    };
}

export async function DefaultExecuteParams2(_chainId: string, extraParams = {}) {
    const {deployer} = await getNamedAccounts();
    let nonce = await ethers.provider.getTransactionCount(deployer, 'pending');
    return {
        from: deployer,
        // gasLimit: getGasLimit(_chainId),
        // gasPrice: getGasPrice(_chainId),
        nonce: nonce,
        ...extraParams  // Spread syntax to combine extraParams with the default params
    };
}

// omni chain
export const getStgUsdcByChainId = (chainId: string) => {
    switch (chainId) {
        case CHAIN_ID_MUMBAI:
            return STG_USDC_MUMBAI;
        case CHAIN_ID_ARBITRUM_GOERLI:
            return STG_USDC_ARBITRUM_GOERLI;
        case CHAIN_ID_OPTIMISM_GOERLI:
            return STG_USDC_OPTIMISM_GOERLI;
        case CHAIN_ID_FUJI:
            return STG_USDC_FUJI;
        case CHAIN_ID_GOERLI:
            return STG_USDC_GOERLI;
        case CHAIN_ID_LINEA_TESTNET:
            return STG_USDC_LINEA_TESTNET;
        case CHAIN_ID_BASE_TEST:
            return STG_USDC_BASE_TESTNET;
        default:
            throw new Error("usdc not found on chainId: " + chainId);
    }
}

export const getStgRouterByChainId = (chainId: string) => {
    switch (chainId) {
        case CHAIN_ID_MUMBAI:
            return STG_ROUTER_MUMBAI;
        case CHAIN_ID_ARBITRUM_GOERLI:
            return STG_ROUTER_ARBITRUM_GOERLI;
        case CHAIN_ID_OPTIMISM_GOERLI:
            return STG_ROUTER_OPTIMISM_GOERLI;
        case CHAIN_ID_OPTIMISM:
            return STG_ROUTER_OPTIMISM;
        case CHAIN_ID_LINEA_TESTNET:
            return STG_ROUTER_LINEA_TESTNET;
        case CHAIN_ID_GOERLI:
            return STG_ROUTER_GOERLI;
        case CHAIN_ID_BSC_TESTNET:
            return STG_ROUTER_BSC_TESTNET;
        case CHAIN_ID_FUJI:
            return STG_ROUTER_FUJI;
        case CHAIN_ID_BASE_TEST:
            return STG_ROUTER_BASE_TESTNET;
        default:
            throw new Error("stg router not found on chainId: " + chainId);
    }
}

export const getStgRouterEthByChainId = (chainId: string) => {
    switch (chainId) {
        case CHAIN_ID_OPTIMISM_GOERLI:
            return STG_ROUTER_ETH_OPTIMISM_GOERLI;
        case CHAIN_ID_GOERLI:
            return STG_ROUTER_ETH_GOERLI;
        case CHAIN_ID_LINEA_MAINNET:
            return STG_ROUTER_ETH_LINEA_MAINNET;
        case CHAIN_ID_BASE_MAINNET:
            return STG_ROUTER_ETH_BASE_MAINNET;
        default:
            throw new Error("stg router eth not found on chainId: " + chainId);
    }
}

export const getLzEndPointByChainId = (chainId: string) => {
    switch (chainId) {
        case CHAIN_ID_MUMBAI:
            return ENDPOINT_MUMBAI;
        case CHAIN_ID_ARBITRUM_GOERLI:
            return ENDPOINT_ARBITRUM_GOERLI;
        case CHAIN_ID_OPTIMISM_GOERLI:
            return ENDPOINT_OPTIMISM_GOERLI;
        case CHAIN_ID_GOERLI:
            return ENDPOINT_GOERLI;
        case CHAIN_ID_BSC_TESTNET:
            return ENDPOINT_BSC_TESTNET;
        case CHAIN_ID_FUJI:
            return ENDPOINT_FUJI;
        case CHAIN_ID_LINEA_TESTNET:
            return ENDPOINT_LINEA_TESTNET;
        case CHAIN_ID_BASE_TEST:
            return ENDPOINT_BASE_TESTNET;
        case CHAIN_ID_ZKSYNC_TESTNET:
            return ENDPOINT_ZKSYNC_TESTNET;
        case CHAIN_ID_LINEA_MAINNET:
            return ENDPOINT_LINEA_MAINNET;
        case CHAIN_ID_BASE_MAINNET:
            return ENDPOINT_BASE_MAINNET;
        case CHAIN_ID_ZKSYNC_MAINNET:
            return ENDPOINT_ZKSYNC_MAINNET;
        default:
            throw new Error("lz endpoint not found on chainId: " + chainId);
    }
}
