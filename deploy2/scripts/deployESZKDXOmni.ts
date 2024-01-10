import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {getLzEndPointByChainId} from "../../helpers/chains";
import {CHAIN_ID_ZKSYNC_MAINNET, CHAIN_ID_ZKSYNC_TESTNET} from "../../helpers/constants";
import {parseEther} from "ethers/lib/utils";
import { Deployment } from "hardhat-deploy/dist/types";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    console.log(chalk.greenBright(">> scripts: deployESZKDXOmni.ts"));
    const {deploy, get} = deployments;
    const chainId = await getChainId();
    const {owner, user0: sameNonceDeployer} = await getNamedAccounts();

    const lzEndpoint = getLzEndPointByChainId(chainId);

    if (chainId != CHAIN_ID_ZKSYNC_TESTNET && chainId != CHAIN_ID_ZKSYNC_MAINNET) {
        // mainnet es nonce = 0
        // testnet es nonce = 1
        await deploy("esZKDXOmni", {
            from: sameNonceDeployer,
            args: [lzEndpoint, owner],
            log: true,
            waitConfirmations: 1
        });
    } else {
        let esZKDX;
        try {
            esZKDX = await get("esZKDX");
        } catch (e) {
            esZKDX = await deploy("esZKDX", {
                from: owner,
                args: [parseEther("52655000")],
                log: true,
                waitConfirmations: 1
            });
        }
        await deploy("esZKDXOmni", {
            contract: "esZKDXOmniEra",
            from: owner,
            args: [lzEndpoint, esZKDX.address],
            log: true,
            waitConfirmations: 1
        });
    }
};
export default func;
func.tags = ["staging", "esZKDXOmni"];
