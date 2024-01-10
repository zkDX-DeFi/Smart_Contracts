import {ethers} from "hardhat";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {getContracts, getUpdateDataTestnet, toUsd} from "../helpers/utils";
import {FEED_ID_ETH_TEST, FEED_ID_USDC_TEST} from "../helpers/constants";
import chalk from 'chalk';

async function main() {

    let {orderBook, owner, positionManager, weth} = await getContracts();

    // ===================== Limit ================================
    let limit = parseEther("0.005").div(parseUnits("0.25", "gwei"));
    console.log("limit:", limit.toString()); // mainnet 20000000

    // ===================== Testnet ================================
    // let failedHash = "0x6328faa9af217d7d1ad0c0779af35d7364f6f3c797fd4a17568662b9cc6f2b0b";
    // let failedReceipt = await ethers.provider.getTransactionReceipt(failedHash);
    // console.log("gasUsed:", failedReceipt.gasUsed.toString());
    // console.log("effectiveGasPrice:", formatUnits(failedReceipt.effectiveGasPrice, "gwei"));
    // console.log("value:", formatEther(failedReceipt.gasUsed.mul(failedReceipt.effectiveGasPrice)));
    //
    // let sucHash = "0x8e81227aadd866732e2a7ba8f1bb997cb99f89e6a0e09ac41896a1b4ac6756c1";
    // let sucReceipt = await ethers.provider.getTransactionReceipt(sucHash);
    // console.log("gasUsed:", sucReceipt.gasUsed.toString());
    // console.log("effectiveGasPrice:", formatUnits(sucReceipt.effectiveGasPrice, "gwei"));
    // console.log("value:", formatEther(sucReceipt.gasUsed.mul(sucReceipt.effectiveGasPrice)));

    // ===================== Estimate Gas - Execute Order  ================================
    // console.log("user0:", user0.address)
    // let {updateData, fee} = await getUpdateDataTestnet([FEED_ID_ETH_TEST, FEED_ID_USDC_TEST]);
    // let transaction = await positionManager.connect(user0).populateTransaction.executeIncreaseOrder("0x4e8730f175811c3079c411309db823e62a4f9598", 0, user0.address, updateData, {value: fee});
    // let transaction = await positionManager.connect(user0).populateTransaction.executeIncreaseOrder(owner.address, 3, user0.address, updateData, {value: fee});
    // let transaction = await positionManager.connect(user0).populateTransaction.executeDecreaseOrder(owner.address, 6, user0.address, updateData, {value: fee});
    // const gasLimit = await ethers.provider.estimateGas(transaction);
    // console.log("estimateGasLimit:", gasLimit.toNumber());

    // ===================== Gas Used - Testnet ================================
    // let txs = [
    // "0x331e7f306458ca801e0409dce1dd17e32d7fde1254c8b988988d280267ddcf5d", // exIn suc 2250677
    // "0x8e81227aadd866732e2a7ba8f1bb997cb99f89e6a0e09ac41896a1b4ac6756c1", // exDe suc 10060578
    // "0x6328faa9af217d7d1ad0c0779af35d7364f6f3c797fd4a17568662b9cc6f2b0b", // exIn fail 47751789
    // "0xb8813ed992e16eb05d273ca2edd7dd0cb6937f0c254362ef2e330abf2d562d9d", // exIn 379191
    // "0xd5f3973f3ccf18822aa86757a324c83a87be187a6ddb1cd6ac00c484c49899b8", // faucet suc 167149
    // "0xcb1111610343ddb83592dba37808959136ed83f3339ad9fb1ac408da0b946d40", // exIn fail 76214465
    // "0x01d07beec57f1b9e450d827d801741a6853375110ec2de3fbbd53995d895d831",  // exIn suc 2565016
    // "0x60c2356c50d0a2b76d56b54e30bcbddebe7d31b43b805393e454d62fa3704ad8" // exDe suc 2012948
    // ]

    // for (let i = 0; i < txs.length; i++) {
    //     let tx = txs[i];
    //     let receipt = await ethers.provider.getTransactionReceipt(tx);
    //     console.log(`gasUsed[${i}]: ${receipt.gasUsed.toString()}`);
    //     console.log(`effectiveGasPrice[${i}]: ${formatUnits(receipt.effectiveGasPrice, "gwei")}`);
    //     console.log(`value[${i}]: ${formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))}`);
    // }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
