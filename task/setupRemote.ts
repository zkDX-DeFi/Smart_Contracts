import {task} from "hardhat/config";
import {getDeploymentAddresses} from "../helpers/readStatic";
import {getLzChainIdByNetworkName} from "../helpers/lzUtils";
import {CHAIN_ID_BASE_TEST} from "../helpers/constants";

task("setupRemote").addParam("targetContract").addParam("targetNetworks").setAction(async function (taskArgs, hre) {

    let targetContract = taskArgs.targetContract;
    let targetNetworks = taskArgs.targetNetworks;
    let networks = targetNetworks.split(",");

    // @ts-ignore
    let contract = await hre.ethers.getContract(targetContract);
    let chainIds = [], paths = [];
    for (let i = 0; i < networks.length; i++) {
        chainIds.push(getLzChainIdByNetworkName(networks[i]));
        let remoteAddress = getDeploymentAddresses(networks[i])[targetContract];
        // @ts-ignore
        let path = hre.ethers.utils.solidityPack(['address', 'address'], [remoteAddress, contract.address])
        paths.push(path);
    }

    for (let i = 0; i < chainIds.length; i++) {
        let chainId = chainIds[i];
        let path = paths[i];
        let isTrustedRemoteSet = await contract.isTrustedRemote(chainId, path);
        if (!isTrustedRemoteSet) {
            let gasPrice = chainId == CHAIN_ID_BASE_TEST ? hre.ethers.utils.parseUnits("2", "gwei")
                : await hre.ethers.provider.getGasPrice();
            let tx = await (await contract.setTrustedRemote(chainId, path, {gasPrice: gasPrice})).wait(); // set trusted remote
            console.log(`✅ [${hre.network.name}] setTrustedRemote(${chainId}, ${path})`)
            console.log(`tx: ${tx.transactionHash}`)
        } else {
            console.log("*source already set*")
        }
    }
});

