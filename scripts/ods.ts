import {ApproveAmount, getContracts, getUpdateDataTestnet, toUsd} from "../helpers/utils";
import {formatEther, parseEther, parseUnits} from "ethers/lib/utils";
import {FEED_ID_BTC_TEST, FEED_ID_ETH_TEST, FEED_ID_USDC_TEST} from "../helpers/constants";
import {expect} from "chai";
import {minExecutionFee} from "../helpers/params";

async function main() {

    const {owner, positionManager, wnative, weth, usdc, timelock, vault, wbtc, router,
        rewardRouter, doge, ltc, orderBook} = await getContracts();

    // ===================== Execution Fee ================================
    // await orderBook.setMinExecutionFee(minExecutionFee);
    // let minExFee = await orderBook.minExecutionFee();
    // console.log("minExFee:", formatEther(minExFee));

    // ===================== Create Increase Order Long BTC ================================
    // let amountIn = parseEther("1000");
    // await wbtc.mint(owner.address, amountIn);
    // await wbtc.connect(owner).approve(router.address, ApproveAmount);
    //
    // // create increase order
    // await orderBook.createIncreaseOrder(
    //     usdc.address, // purchaseToken
    //     amountIn, // amountIn
    //     wbtc.address, // indexToken
    //     toUsd(20000), // sizeDelta
    //     wbtc.address, // collateralToken
    //     true, // isLong
    //     toUsd(26500), // triggerPrice
    //     false, // triggerAboveThreshold
    //     minExecutionFee, // executionFee
    //     false, // shouldWrap
    //     {value: minExecutionFee}
    // );
    // expect(await orderBook.increaseOrdersIndex(owner.address)).to.equal(2);
    // let order = await orderBook.increaseOrders(owner.address, 0);
    // expect(order['account']).to.eq(owner.address);

    // ===================== Create Increase Order Long ETH ================================
    // create increase order
    // let tx = await orderBook.createIncreaseOrder(
    //     usdc.address, // purchaseToken
    //     parseEther("1000"), // amountIn
    //     weth.address, // indexToken
    //     toUsd(30000), // sizeDelta
    //     weth.address, // collateralToken
    //     true, // isLong
    //     toUsd(1700), // triggerPrice
    //     false, // triggerAboveThreshold
    //     minExecutionFee, // executionFee
    //     false, // shouldWrap
    //     {value: minExecutionFee}
    // );
    // console.log("Create Increase Order Long ETH:", tx.hash);

    // // ===================== Create Decrease Order Long BTC ================================
    // await orderBook.createDecreaseOrder(
    //     wbtc.address, // indexToken
    //     toUsd(120000), // sizeDelta
    //     wbtc.address, // collateralToken
    //     0, // _collateralDelta
    //     true, // isLong
    //     toUsd(29000), // triggerPrice
    //     true, // triggerAboveThreshold
    //     {value: executionFee}
    // );
    // expect(await orderBook.decreaseOrdersIndex(owner.address)).to.equal(1);
    // let order2 = await orderBook.decreaseOrders(owner.address, 0);
    // expect(order2['account']).to.eq(owner.address);

    // ===================== Create Decrease Order Long BTC ================================
    // let tx = await orderBook.createDecreaseOrder(
    //     weth.address, // indexToken
    //     toUsd(3000), // sizeDelta
    //     weth.address, // collateralToken
    //     0, // _collateralDelta
    //     true, // isLong
    //     toUsd(1500), // triggerPrice
    //     true, // triggerAboveThreshold
    //     {value: minExecutionFee}
    // );
    // console.log("Create Decrease Order Long ETH:", tx.hash);


    // ===================== Create Increase Order Long LTC ================================
    // create increase order
    let tx = await orderBook.createIncreaseOrder(
        usdc.address, // purchaseToken
        parseEther("1700000"), // amountIn
        ltc.address, // indexToken
        toUsd(48000000), // sizeDelta
        ltc.address, // collateralToken
        true, // isLong
        toUsd(91), // triggerPrice
        false, // triggerAboveThreshold
        parseEther("0.0014"), // executionFee
        false, // shouldWrap
        {value: parseEther("0.0014")}
    );
    console.log("Create Increase Order Long LTC:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
