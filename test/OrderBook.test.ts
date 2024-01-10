import {
    ApproveAmount,
    newWallet,
    setupFixture,
    toUsd
} from "../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {ethers} from "hardhat";
import {DEFAULT_WITHIN, MAX_WITHIN} from "../helpers/constants";
import {minExecutionFee} from "../helpers/params";
import {getLiqPriceForPosition, getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";

describe("OrderBook", async () => {

    let vault: any,
        vaultPriceFeed: any,
        router: any,
        timelock: any,
        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        positionManager: any,
        orderBook: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        vaultPriceFeed = fixture.vaultPriceFeed;
        router = fixture.router;
        timelock = fixture.timelock;
        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = fixture.dai;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        positionManager = fixture.positionManager;
        orderBook = fixture.orderBook;

        await weth.mint(vault.address, parseEther("100"));
        await dai.mint(vault.address, parseEther("200000"));
        await wbtc.mint(vault.address, parseUnits("10", 8));

        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(weth.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(dai.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(wbtc.address, user1.address);
    })

    // it("check increase order - Long BTC", async () => {
    //
    //     let amountIn = parseUnits("1", 8);
    //     await wbtc.mint(user0.address, amountIn);
    //     await wbtc.connect(user0).approve(router.address, ApproveAmount);
    //
    //     await orderBook.connect(user0).createIncreaseOrder(
    //         wbtc.address, // purchaseToken
    //         amountIn, // amountIn
    //         wbtc.address, // indexToken
    //         toUsd(100000), // sizeDelta
    //         wbtc.address, // collateralToken
    //         true, // isLong
    //         toUsd(25000), // triggerPrice
    //         false, // triggerAboveThreshold
    //         minExecutionFee, // executionFee
    //         false, // shouldWrap
    //         {value: minExecutionFee}
    //     );
    //     expect(await orderBook.increaseOrdersIndex(user0.address)).to.equal(1);
    //     let order = await orderBook.increaseOrders(user0.address, 0);
    //     expect(order['account']).to.eq(user0.address);
    //     expect(order['sizeDelta']).to.eq(toUsd(100000));
    //     expect(order['executionFee']).to.eq(minExecutionFee);
    //
    //     // execute
    //     await positionManager.setOrderKeeper(owner.address, true);
    //     let feeReceiver = await newWallet();
    //     let {updateData, fee} = await getUpdateData(['wbtc'], ['24999']);
    //     await positionManager.executeIncreaseOrder(user0.address, 0, feeReceiver.address, updateData, {value: fee});
    //     expect(await ethers.provider.getBalance(feeReceiver.address)).to.eq(minExecutionFee);
    //
    //     // check position opened
    //     let key = await vault.getPositionKey(user0.address, wbtc.address, wbtc.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("100000", 30));
    //     await expect(await position.averagePrice).to.eq(parseUnits("24999", 30));
    // });

    // it("check increase order - Short BTC", async () => {
    //
    //     let amountIn = parseEther("10000");
    //     await dai.mint(user0.address, amountIn);
    //     await dai.connect(user0).approve(router.address, ApproveAmount);
    //
    //     // create increase order
    //     await orderBook.connect(user0).createIncreaseOrder(
    //         dai.address, // purchaseToken
    //         amountIn, // amountIn
    //         wbtc.address, // indexToken
    //         toUsd(100000), // sizeDelta
    //         dai.address, // collateralToken
    //         false, // isLong
    //         toUsd(30000), // triggerPrice
    //         true, // triggerAboveThreshold
    //         minExecutionFee, // executionFee
    //         false, // shouldWrap
    //         {value: minExecutionFee}
    //     );
    //     expect(await orderBook.increaseOrdersIndex(user0.address)).to.equal(1);
    //     let order = await orderBook.increaseOrders(user0.address, 0);
    //     expect(order['account']).to.eq(user0.address);
    //
    //     // execute
    //     await positionManager.setOrderKeeper(owner.address, true);
    //     let feeReceiver = await newWallet();
    //     let {updateData, fee} = await getUpdateData(['wbtc', 'dai'], ['30001']);
    //     await positionManager.executeIncreaseOrder(user0.address, 0, feeReceiver.address, updateData, {value: fee});
    //     expect(await ethers.provider.getBalance(feeReceiver.address)).to.eq(minExecutionFee);
    //
    //     // check position opened
    //     let key = await vault.getPositionKey(user0.address, dai.address, wbtc.address, false);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("100000", 30));
    //     await expect(await position.averagePrice).to.eq(parseUnits("30001", 30));
    // });

    // it("check decrease order - Take Profit", async () => {
    //
    //     // open long position
    //     let {updateData, fee} = await getUpdateData(['wbtc', 'dai']);
    //     let daiAmountIn = parseEther("5000");
    //     let params = [
    //         [dai.address, wbtc.address], // _path
    //         wbtc.address, // _indexTokends
    //         daiAmountIn,
    //         0, // _minOut
    //         toUsd(100000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(28000), // _acceptablePrice
    //         updateData
    //     ]
    //
    //     await dai.mint(user0.address, daiAmountIn);
    //     await dai.connect(user0).approve(router.address, ApproveAmount);
    //     await positionManager.connect(user0).increasePosition(...params, {value: fee});
    //
    //     let executionFee = parseEther("0.005");
    //
    //     // create decrease order
    //     await orderBook.connect(user0).createDecreaseOrder(
    //         wbtc.address, // indexToken
    //         toUsd(100000), // sizeDelta
    //         wbtc.address, // collateralToken
    //         0, // _collateralDelta
    //         true, // isLong
    //         toUsd(30000), // triggerPrice
    //         true, // triggerAboveThreshold
    //         {value: executionFee}
    //     );
    //     expect(await orderBook.decreaseOrdersIndex(user0.address)).to.equal(1);
    //     let order = await orderBook.decreaseOrders(user0.address, 0);
    //     expect(order['account']).to.eq(user0.address);
    //     expect(order['sizeDelta']).to.eq(toUsd(100000));
    //     expect(order['executionFee']).to.eq(executionFee);
    //
    //     // execute
    //     await positionManager.setOrderKeeper(owner.address, true);
    //     let feeReceiver = await newWallet();
    //     ({updateData, fee} = await getUpdateData(['wbtc'], ['30001']));
    //     await positionManager.executeDecreaseOrder(user0.address, 0, feeReceiver.address, updateData, {value: fee});
    //     expect(await ethers.provider.getBalance(feeReceiver.address)).to.eq(executionFee);
    //
    //     // check position closed
    //     let key = await vault.getPositionKey(user0.address, wbtc.address, wbtc.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    //
    //     // check profit
    //     // ((30001 - 28000) / 28000.0 * 100000 + 5000 * 0.997 - 200) / 30001 = 0.3977
    //     expect(await wbtc.balanceOf(user0.address)).to.be.closeTo(parseUnits("0.398201", 8), DEFAULT_WITHIN);
    // });

    // it("check decrease order - Stop Loss", async () => {
    //
    //     // open long position
    //     let {updateData, fee} = await getUpdateData(['wbtc', 'dai']);
    //     let daiAmountIn = parseEther("5000");
    //     let params = [
    //         [dai.address, wbtc.address], // _path
    //         wbtc.address, // _indexTokends
    //         daiAmountIn,
    //         0, // _minOut
    //         toUsd(100000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(28000), // _acceptablePrice
    //         updateData
    //     ]
    //
    //     await dai.mint(user0.address, daiAmountIn);
    //     await dai.connect(user0).approve(router.address, ApproveAmount);
    //     await positionManager.connect(user0).increasePosition(...params, {value: fee});
    //
    //     let executionFee = parseEther("0.005");
    //
    //     // create decrease order
    //     await orderBook.connect(user0).createDecreaseOrder(
    //         wbtc.address, // indexToken
    //         toUsd(100000), // sizeDelta
    //         wbtc.address, // collateralToken
    //         0, // _collateralDelta
    //         true, // isLong
    //         toUsd(27000), // triggerPrice
    //         false, // triggerAboveThreshold
    //         {value: executionFee}
    //     );
    //     expect(await orderBook.decreaseOrdersIndex(user0.address)).to.equal(1);
    //     let order = await orderBook.decreaseOrders(user0.address, 0);
    //     expect(order['account']).to.eq(user0.address);
    //     expect(order['sizeDelta']).to.eq(toUsd(100000));
    //     expect(order['executionFee']).to.eq(executionFee);
    //
    //     // let liqPrice = await getLiqPriceForPosition(user0.address, wbtc.address, wbtc.address, true);
    //     // console.log("liqPrice", formatUnits(liqPrice, 30));
    //
    //     // execute
    //     await positionManager.setOrderKeeper(owner.address, true);
    //     let feeReceiver = await newWallet();
    //     ({updateData, fee} = await getUpdateData(['wbtc'], ['26999']));
    //     await positionManager.executeDecreaseOrder(user0.address, 0, feeReceiver.address, updateData, {value: fee});
    //     expect(await ethers.provider.getBalance(feeReceiver.address)).to.eq(executionFee);
    //
    //     // check position closed
    //     let key = await vault.getPositionKey(user0.address, wbtc.address, wbtc.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    //
    //     // check stop loss
    //     // (5000 * 0.997 - 200 - (28000 -26999) / 28000.0 * 100000) / 26999 = 0.0448
    //     expect(await wbtc.balanceOf(user0.address)).to.be.closeTo(parseUnits("0.04537204", 8), DEFAULT_WITHIN);
    // });

    // it("check cancel multiple orders", async () => {
    //
    //     let amountIn = parseUnits("1", 8);
    //     await wbtc.mint(user0.address, parseUnits("2", 8));
    //     await wbtc.connect(user0).approve(router.address, ApproveAmount);
    //
    //     // create increase orders
    //     let increaseParams = [
    //         wbtc.address, // purchaseToken
    //         amountIn, // amountIn
    //         wbtc.address, // indexToken
    //         toUsd(100000), // sizeDelta
    //         wbtc.address, // collateralToken
    //         true, // isLong
    //         toUsd(25000), // triggerPrice
    //         false, // triggerAboveThreshold
    //         minExecutionFee, // executionFee
    //         false // shouldWrap
    //     ]
    //     await orderBook.connect(user0).createIncreaseOrder(...increaseParams, {value: minExecutionFee});
    //     increaseParams[3] = toUsd(50000);
    //     await orderBook.connect(user0).createIncreaseOrder(...increaseParams, {value: minExecutionFee});
    //     expect(await orderBook.increaseOrdersIndex(user0.address)).to.equal(2);
    //     let increaseOrder0 = await orderBook.increaseOrders(user0.address, 0);
    //     expect(increaseOrder0['sizeDelta']).to.eq(toUsd(100000));
    //     let increaseOrder1 = await orderBook.increaseOrders(user0.address, 1);
    //     expect(increaseOrder1['sizeDelta']).to.eq(toUsd(50000));
    //
    //     // create decrease order
    //     let decreaseParams = [
    //         wbtc.address, // indexToken
    //         toUsd(100000), // sizeDelta
    //         wbtc.address, // collateralToken
    //         0, // _collateralDelta
    //         true, // isLong
    //         toUsd(30000), // triggerPrice
    //         true, // triggerAboveThreshold
    //     ]
    //     await orderBook.connect(user0).createDecreaseOrder(...decreaseParams, {value: minExecutionFee});
    //     decreaseParams[1] = toUsd(50000);
    //     await orderBook.connect(user0).createDecreaseOrder(...decreaseParams, {value: minExecutionFee});
    //     expect(await orderBook.decreaseOrdersIndex(user0.address)).to.equal(2);
    //     let decreaseOrder0 = await orderBook.decreaseOrders(user0.address, 0);
    //     expect(decreaseOrder0['sizeDelta']).to.eq(toUsd(100000));
    //     let decreaseOrder1 = await orderBook.decreaseOrders(user0.address, 1);
    //     expect(decreaseOrder1['sizeDelta']).to.eq(toUsd(50000));
    //
    //     // cancel multiple
    //     await expect(orderBook.connect(user0).cancelMultiple([0, 1], [0, 1, 2])).to.be.revertedWith("OrderBook: non-existent order'");
    //     await orderBook.connect(user0).cancelMultiple([0, 1], [0, 1]);
    //
    //     increaseOrder0 = await orderBook.increaseOrders(user0.address, 0);
    //     expect(increaseOrder0['sizeDelta']).to.eq(toUsd(0));
    //     increaseOrder1 = await orderBook.increaseOrders(user0.address, 1);
    //     expect(increaseOrder1['sizeDelta']).to.eq(toUsd(0));
    //     decreaseOrder0 = await orderBook.decreaseOrders(user0.address, 0);
    //     expect(decreaseOrder0['sizeDelta']).to.eq(toUsd(0));
    //     decreaseOrder1 = await orderBook.decreaseOrders(user0.address, 1);
    //     expect(decreaseOrder1['sizeDelta']).to.eq(toUsd(0));
    // });

    // it("revert long leverage decreases", async () => {
    //     await dai.mint(owner.address, parseEther("2000"));
    //     await dai.approve(router.address, ApproveAmount);
    //     console.log("dai balance", formatUnits(await dai.balanceOf(owner.address), 18));
    //     let {updateData, fee} = await getUpdateData(['weth', 'dai'], ['1660']);
    //     let params = [
    //         [dai.address, weth.address], // _path
    //         weth.address, // _indexTokends
    //         parseEther("1000"),
    //         0, // _minOut
    //         toUsd(20120.63), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1700), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.increasePosition(...params, {value: fee});
    //
    //     await orderBook.createIncreaseOrder(
    //         dai.address, // purchaseToken
    //         parseEther("1000"), // amountIn
    //         weth.address, // indexToken
    //         toUsd(20117.81), // sizeDelta
    //         weth.address, // collateralToken
    //         true, // isLong
    //         toUsd(1653.34), // triggerPrice
    //         false, // triggerAboveThreshold
    //         minExecutionFee, // executionFee
    //         false, // shouldWrap
    //         {value: minExecutionFee}
    //     );
    //
    //     await positionManager.setOrderKeeper(user0.address, true);
    //     ({updateData, fee} = await getUpdateData(['weth', 'dai'], ['1640.84']));
    //     await expect(positionManager.connect(user0).executeIncreaseOrder(
    //         owner.address,
    //         0,
    //         user0.address,
    //         updateData,
    //         {value: fee}
    //     )).to.be.revertedWith("PositionManager: long leverage decrease");
    //
    // });
});
