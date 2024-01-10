import {task} from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import '@nomiclabs/hardhat-ethers';
import 'hardhat-deploy';
import '@typechain/hardhat';
import {HardhatUserConfig} from 'hardhat/types';
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";

const secret = require("./secret.json");

// tasks
import "./task/deployScripts";
import "./task/setupRemote";
import "./scripts/omni/setupStaking";
import {GAS_PRICE, TIMEOUT_IN_MS} from "./helpers/constants";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.17", // 19 will fail compile zk
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100
                    }
                }
            },
            {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100
                    }
                }
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100
                    }
                }
            }
        ]

    },
    zksolc: {
        version: "1.3.5",
        compilerSource: "binary",
        settings: {},
    },
    namedAccounts: {
        owner: 0,
        user0: 1,
        user1: 2,
        user2: 3,
        user3: 4,
        user4: 5,
        positionKeeper: 6,
        tokenManager: 7,
        mintReceiver: 8,
        miner: 9,
        feeTo: 10,
        receiver: 11,

        deployer: {
            default: 0,
            1: 0,
            4: '0xA296a3d5F026953e17F472B497eC29a5631FB51B',
            "goerli": '0x84b9514E013710b9dD0811c9Fe46b837a4A0d8E0',
        },
        feeCollector: {
            default: 1,
            1: '0xa5610E1f289DbDe94F3428A9df22E8B518f65751',
            4: '0xa250ac77360d4e837a13628bC828a2aDf7BabfB3',
        },
        lpManager: {
            default: 2,
            1: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            280: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        }
    },
    networks: {
        zksync_mainnet: {
            zksync: true,
            url: secret.url_zksync_mainnet,
            ethNetwork: "ethereum",
            accounts: [secret.key_prd, secret.key_same_nonce],
            timeout: 30000,
            verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
            deploy: ['deploy/', 'deploy2/'],
        },
        zksync_testnet: {
            zksync: true,
            url: secret.url_zksync_testnet,
            ethNetwork: "goerli",
            accounts: [
                secret.key_dev,
                secret.key_same_nonce,
                secret.key_dev0,
                secret.key_dev1,
            ],
            timeout: 30000,
            verifyURL: "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
            saveDeployments: true,
            deploy: ['deploy/', 'deploy2/'],
        },
        mumbai: {
            url: secret.url_mumbai,
            accounts: [secret.key_dev],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        polygon: {
            url: secret.url_polygon,
            accounts: [secret.key_dev],
            timeout: 30000,
            deploy: ['deploy/', 'deploy2/'],
        },
        arbitrum_goerli: {
            url: secret.url_arbitrum_goerli,
            accounts: [secret.key_dev],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        fuji: {
            url: secret.url_fuji,
            accounts: [secret.key_dev],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        optimism_goerli: {
            url: secret.url_optimism_goerli,
            accounts: [secret.key_dev, secret.key_same_nonce],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        conflux_test: {
            url: secret.url_conflux_test,
            accounts: [secret.key_dev],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        celo_test: {
            url: secret.url_celo_test,
            accounts: [secret.key_dev],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        optimism: {
            url: secret.url_optimism,
            accounts: [secret.key_dev],
            timeout: 30000,
        },
        mantle_testnet: {
            url: secret.url_mantle_test,
            accounts: [secret.key_prd],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
            saveDeployments: true
        },
        linea_mainnet: {
            url: secret.url_linea_mainnet,
            accounts: [secret.key_prd, secret.key_same_nonce],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        linea_testnet: {
            url: secret.url_linea_testnet,
            accounts: [secret.key_dev, secret.key_same_nonce],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        base_mainnet: {
            url: secret.url_base_mainnet,
            accounts: [secret.key_prd, secret.key_same_nonce],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        base_testnet: {
            url: secret.url_base_testnet,
            accounts: [secret.key_dev, secret.key_same_nonce],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        goerli: {
            url: secret.url_goerli,
            accounts: [secret.key_dev, secret.key_same_nonce],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        bsc_testnet: {
            url: secret.url_bsc_testnet,
            accounts: [secret.key_dev],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        scroll_sepolia: {
            url: secret.url_scroll_sepolia,
            accounts: [secret.key_prd],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        scroll_mainnet: {
            url: secret.url_scroll_mainnet,
            accounts: [secret.key_prd],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
            saveDeployments: true
        },
        mantle_mainnet: {
            url: secret.url_mantle_mainnet,
            accounts: [secret.key_prd],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
            saveDeployments: true
        },
        metis_tesnet: {
            url: secret.url_metis_testnet,
            accounts: [secret.key_prd],
            timeout: TIMEOUT_IN_MS,
            deploy: ['deploy/', 'deploy2/'],
        },
        hardhat: {}
    },
    etherscan: {
        apiKey: {
            linea_mainnet: secret.api_key_linea,
            optimism_goerli: secret.api_key_optimism,
            georli: secret.api_key_eth,
        },
        customChains: [
            {
                network: "linea_mainnet",
                chainId: 59144,
                urls: {
                    apiURL: "https://api.lineascan.build",
                    browserURL: "https://lineascan.build/"
                }
            },
            {
                network: "base",
                chainId: 8453,
                urls: {
                    apiURL: "https://api.basescan.org",
                    browserURL: "https://basescan.org"
                }
            }
        ]
    },
    mocha: {
        timeout: 60000,
    },
}
export default config;

