import {ethers, getChainId} from "hardhat";
import {parseEther} from "ethers/lib/utils";
import {getContracts, getUpdateDataTestnet, toUsd} from "../helpers/utils";
import {FEED_ID_ETH_TEST} from "../helpers/constants";
import chalk from 'chalk';

async function main() {

    let {orderBook, owner, positionManager, weth} = await getContracts();

    let chainId = await getChainId();
    // ===================== Estimate Gas - Open Position  ================================
    let {updateData, fee} = await getUpdateDataTestnet([FEED_ID_ETH_TEST], chainId);
    let params = [
        [weth.address], // _path
        weth.address, // _indexToken
        0, // _minOut
        toUsd(100), // _sizeDelta
        true, // _isLong
        toUsd(3000), // _acceptablePrice
        updateData,
    ]
    let transaction = await positionManager.populateTransaction.increasePositionETH(...params, {value: fee.add(parseEther("0.01"))});
    const gasLimit = await ethers.provider.estimateGas(transaction);
    console.log(">> estimate increasePosition gas limit now:", gasLimit.toNumber()); // executable: below 10,000,000
    console.log(">> expected gas < 10,000,000 ==> ORDERBOOK OPR");
    if (gasLimit.toNumber() > 10000000) {
        console.log("RESULT: ", chalk.redBright("STOP"));
    } else {
        console.log("RESULT: ", chalk.greenBright("RESTART"));
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
