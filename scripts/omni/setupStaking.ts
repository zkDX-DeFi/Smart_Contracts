import {task} from "hardhat/config";
import {getDeploymentAddresses} from "../../helpers/readStatic";
import {CHAIN_ID_OPTIMISM_GOERLI, OMNI_PRIMARY_NETWORK} from "../../helpers/constants";
import {getLzChainIdByNetworkName} from "../../helpers/lzUtils";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {getCurrentTimestamp} from "hardhat/internal/hardhat-network/provider/utils/getCurrentTimestamp";

task("setupOmni").addParam("targetContract").addParam("targetNetwork").setAction(async function (taskArgs, hre) {

    let targetContract = taskArgs.targetContract;
    let targetNetwork = taskArgs.targetNetwork;

    // set trusted remote
    let contract = "esZKDXOmni";
    const omniZKDX = await hre.ethers.getContract(contract);
    const remoteAddress = getDeploymentAddresses(targetNetwork)[contract]

    let remoteChainId = getLzChainIdByNetworkName(targetNetwork);
    let remoteAndLocal = hre.ethers.utils.solidityPack(['address', 'address'], [remoteAddress, omniZKDX.address])
    let isTrustedRemoteSet = await omniZKDX.isTrustedRemote(remoteChainId, remoteAndLocal);

    let gasPrice = await hre.ethers.provider.getGasPrice();
    let chainId = await hre.getChainId();
    if (chainId == CHAIN_ID_OPTIMISM_GOERLI)
        gasPrice = parseUnits("1", "gwei");

    if (!isTrustedRemoteSet) {
        try {
            let tx = await (await omniZKDX.setTrustedRemote(remoteChainId, remoteAndLocal, {gasPrice: gasPrice})).wait()
            console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
            console.log(` tx: ${tx.transactionHash}`)
        } catch (e) {
            if (e.error.message.includes("The chainId + address is already trusted")) {
                console.log("*source already set*")
            } else {
                console.log(`❌ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
            }
        }
    } else {
        console.log("*source already set*")
    }

    // staking setups
    if (hre.network.name == OMNI_PRIMARY_NETWORK) { // primary network
        console.log(`>> init staking reward...`)
        let rewardAmount = parseEther("50000");
        let staking = await hre.ethers.getContract(targetContract);
        let finishAt = await staking.finishAt();
        if (finishAt < getCurrentTimestamp()) {
            let tx = await omniZKDX.mint(staking.address, rewardAmount, {gasPrice: gasPrice});
            await tx.wait();
            await staking.notifyRewardAmount(rewardAmount, {gasPrice: gasPrice});
        }
    } else {
        console.log(`>> setting remote stakings...`)
        let remoteChainId = getLzChainIdByNetworkName(targetNetwork);
        let remoteStaking = getDeploymentAddresses(targetNetwork)[targetContract];
        let staking = await hre.ethers.getContract(targetContract);
        await staking.setRemoteStakings([remoteChainId], [remoteStaking], {gasPrice: gasPrice});
    }

    // linea 0.02e / base 0.012e
});

