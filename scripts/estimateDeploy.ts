import {Wallet} from "zksync-web3";
import {Deployer} from "@matterlabs/hardhat-zksync-deploy";
import {deployments, ethers} from "hardhat";
import {formatUnits} from "ethers/lib/utils";
import {AddressZero} from "../helpers/utils";

const hre = require("hardhat");

const secret = require("../secret.json");

// An example of a deploy script that will deploy and call a simple contract.
async function main() {

    const {get} = deployments;

    // Initialize the wallet.
    const wallet = new Wallet(secret.key_prd);
    // const wallet = new Wallet(secret.key_prd);

    // Create deployer object and load the artifact of the contract you want to deploy.
    const deployer = new Deployer(hre, wallet);

    const Vault = await get("Vault");
    const Router = await get("Router");
    const WNative = await get("WNative");
    const ShortsTracker = await get("ShortsTracker");

    // const artifact = await deployer.loadArtifact("PositionManager");
    // let params = [Vault.address, Router.address, ShortsTracker.address, WNative.address, 50, AddressZero];

    // const artifact = await deployer.loadArtifact("ShortsTracker");
    // let params = [Vault.address];

    const artifact = await deployer.loadArtifact("ZkdxStaking");
    let params = [AddressZero, AddressZero, 86400 * 365];

    const gasPrice = await ethers.provider.getGasPrice();
    console.log(`The current gas price is ${formatUnits(gasPrice, 'gwei')} Gwei`);

    const deployGasLimit = await deployer.estimateDeployGas(artifact, params);
    console.log(`The deployment is estimated to cost ${deployGasLimit.toString()} gas`);

    // ShortsTracker: 169959232 // 14594141 // 11
    // PositionManager: 536955054 // 219618709

    // Staking Estimated:
    // The deployment is estimated to cost 68646674 gas
    // The deployment is estimated to cost 0.01707064275 ETH

    // Estimate contract deployment fee
    const deploymentFee = await deployer.estimateDeployFee(artifact, params);
    console.log(`The deployment is estimated to cost ${ethers.utils.formatEther(deploymentFee.toString())} ETH`);

    // ========================== True Gas ================================
    // let hash = "0xc381b03f2cd0753fa335e6defd69e0118e85bc3ebb8c63c4a741afde3bdd887a"; // 2382976
    // let receipt = await ethers.provider.getTransactionReceipt(hash);
    // console.log("gasUsed:", receipt.gasUsed.toString());

    // ========================== Other ================================
    // OPTIONAL: Deposit funds to L2
    // Comment this block if you already have funds on zkSync.
    // const depositHandle = await deployer.zkWallet.deposit({
    //     to: deployer.zkWallet.address,
    //     token: utils.ETH_ADDRESS,
    //     amount: deploymentFee.mul(2),
    // });
    // // Wait until the deposit is processed on zkSync
    // await depositHandle.wait();
    //
    // // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // // `greeting` is an argument for contract constructor.
    // const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
    // console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

    // const greeterContract = await deployer.deploy(artifact, params);
    // //obtain the Constructor Arguments
    // console.log("constructor args:" + greeterContract.interface.encodeDeploy([]));
    //
    // // Show the contract info.
    // const contractAddress = greeterContract.address;
    // console.log(`${artifact.contractName} was deployed to ${contractAddress}`);
}

main()
