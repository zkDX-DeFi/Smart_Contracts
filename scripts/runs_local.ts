import {deployments} from 'hardhat';
import {ApproveAmount, getContracts, toUsd} from "../helpers/utils";
import {formatEther, formatUnits, parseEther} from "ethers/lib/utils";

const {execute, read} = deployments;

async function main() {

    const {vault, weth, dai, router, user0, positionManager, zkdlpManager, usdm} = await getContracts();

    // let amount = await vault.poolAmounts(dai.address)
    // console.log("amount:", formatEther(amount));
    
    // let getAum = await zkdlpManager.getAum(true);
    // console.log("getAum:", formatUnits(getAum, 30));
    
    // let getAum = await zkdlpManager.getAumInUsdm(false);
    // console.log("getAum:", formatUnits(getAum, 30));
    
    // let cooldownDuration = await zkdlpManager.cooldownDuration();
    // console.log("cooldownDuration:", cooldownDuration);

    // await usdm.addVault(zkdlpManager.address);
    
    // await zkdlpManager.setCooldownDuration(300);

    // open
    // let params = [
    //     [weth.address], // _path
    //     weth.address, // _indexToken
    //     0, // _minOut
    //     toUsd(15000), // _sizeDelta
    //     true, // _isLong
    //     toUsd(1504), // _acceptablePrice
    // ]
    // // @ts-ignore user0: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    // await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1")});
    // let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    // console.log("long key:", key); 
    // // 0x67591a889e867179c36d8d3807a6588ee0933ff1e003e262db148162ea777bf3
    // // position.collateral = 1499 - 15000 / 1000 = 1484
    //
    //
    // // short
    // let daiAmountIn = parseEther("1500");
    // await dai.mint(user0.address, daiAmountIn);
    // await dai.connect(user0).approve(router.address, ApproveAmount);
    // let params2 = [
    //     [dai.address], // _path
    //     weth.address, // _indexTokends
    //     daiAmountIn,
    //     0, // _minOut
    //     toUsd(15000), // _sizeDelta
    //     false, // _isLong
    //     toUsd(1499), // _acceptablePrice
    // ]
    // // @ts-ignore
    // await positionManager.connect(user0).increasePosition(...params2);
    // let shortKey = await vault.getPositionKey(user0.address, dai.address, weth.address, false);
    // console.log("short key:", shortKey); 
    // // 0xfb360ee20225d8fea6d77bd19404f1eaa702dc8c5a93eb46ada02c5a09257ff0

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
