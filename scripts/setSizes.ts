import {deployments, ethers} from 'hardhat';
import {getContracts} from "../helpers/utils";
import {formatUnits, parseUnits} from "ethers/lib/utils";

const {execute, read, deploy, get} = deployments;

async function main() {

    console.log(">> run sizes ...");

    const doge = await ethers.getContract("DOGE")
    const wbtc = await ethers.getContract("WBTC")
    const wnative = await ethers.getContract("WNative")
    const positionManager = await ethers.getContract("PositionManager");
    const zusd = await ethers.getContract("ZUSD");
    const vault = await ethers.getContract("Vault");
    const ordi = await ethers.getContract("ORDI");

    // let poolAmount = await vault.poolAmounts(zusd.address);
    // console.log("usdc poolAmount: ", formatUnits(poolAmount, 18));
    // let shortBtc = await vault.globalShortSizes(wbtc.address);
    // console.log("btc short size: ", formatUnits(shortBtc, 30));
    // let shortEth = await vault.globalShortSizes(zusd.address);
    // console.log("eth short size: ", formatUnits(shortEth, 30));
    // let shortDoge = await vault.globalShortSizes(doge.address);
    // console.log("doge short size: ", formatUnits(shortDoge, 30));

    // let longSizeBtc = await positionManager.maxGlobalLongSizes(wbtc.address);
    // console.log("longSizeBtc: ", formatUnits(longSizeBtc, 30));
    // let longSizeEth = await positionManager.maxGlobalLongSizes(wnative.address);
    // console.log("longSizeEth: ", formatUnits(longSizeEth, 30));
    // let longSizeDoge = await positionManager.maxGlobalLongSizes(doge.address);
    // console.log("longSizeDoge: ", formatUnits(longSizeDoge, 30));
    // let guaranteedUsd = await vault.guaranteedUsd(doge.address);
    // console.log("guaranteedUsd: ", formatUnits(guaranteedUsd, 30));

    // await positionManager.setMaxGlobalSizes(
    //     [wbtc.address, wnative.address, doge.address],
    //     [parseUnits("950", 30), parseUnits("1050", 30), parseUnits("700", 30)],
    //     [parseUnits("950", 30), parseUnits("1050", 30), parseUnits("700", 30)]
    // );

    await positionManager.setMaxGlobalSizes(
        [ordi.address],
        [parseUnits("500", 30)],
        [parseUnits("500", 30)]
    );

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
