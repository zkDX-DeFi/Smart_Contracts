let lzChainIds = {
    "ethereum": 101,
    "bsc": 102,
    "avalanche": 106,
    "polygon": 109,
    "arbitrum": 110,
    "optimism": 111,
    "fantom": 112,
    "linea_mainnet": 183,
    "base_mainnet": 184,
    "zksync_mainnet": 165,

    "goerli": 10121,
    "bsc_testnet": 10102,
    "fuji": 10106,
    "mumbai": 10109,
    "arbitrum_goerli": 10143,
    "optimism_goerli": 10132,
    "fantom_testnet": 10112,
    "meter_testnet": 10156,
    "linea_testnet": 10157,
    "base_testnet": 10160,
    "zksync_testnet": 10165,
}

export function getLzChainIdByNetworkName(networkName: string) {
    let id = lzChainIds[networkName];
    if (id == null || id == 0)
        throw new Error("chainId not found on chain " + networkName);
    return id;
}