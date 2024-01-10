import {
    ApproveAmount,
    forwardTime,
    getGasFee,
    newWallet,
    reportGasUsed,
    setupFixture,
    toUsd
} from "../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {MAX_WITHIN} from "../helpers/constants";
import {ethers} from "hardhat";
import {constants} from "ethers";
import {getLiqPrice, getLiqPriceForPosition, getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";

describe("PositionManager", async () => {

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
        positionKeeper: any,
        positionManager: any,
        pm: any,
        reader: any,
        v: any

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
        positionKeeper = fixture.positionKeeper;
        positionManager = fixture.positionManager;
        pm = fixture.positionManager;
        reader = fixture.reader;
        v = fixture.vault;

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

    async function longWithProfit(weth: any, positionManager: any, user0: any, _amountIn : any = parseEther("3000")) {
        await dai.mint(user0.address, _amountIn);
        await dai.connect(user0).approve(router.address, ApproveAmount);

        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            [dai.address, weth.address],
            weth.address,
            _amountIn,
            0,
            toUsd(9000),
            true,
            toUsd(1500),
            updateData
        ];
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
        let paramsDe = [
            [weth.address,dai.address],
            weth.address,
            toUsd(0),
            toUsd(9000),
            true,
            user0.address,
            toUsd(1550),
            toUsd(0),
            false,
            updateData
        ];
        await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    }

    // it("check long position - Open", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //
    //     // check position
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //     await expect(await position.reserveAmount).to.eq(parseEther("10"));
    // })

    // it("check long position - Open, with price spread", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth'], ['1500'], ['1']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1501), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //
    //     // check position
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1484", 30));
    //     await expect(await position.averagePrice).to.eq(parseUnits("1501", 30));
    //     await expect(await position.reserveAmount).to.gt(parseEther("10"));
    // })

    // it("check long position updateData gas diffs", async () => {
    //     // increase with updateData
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1501), // _acceptablePrice
    //         updateData
    //     ]
    //     let tx1 = await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let gasUsed1 = await reportGasUsed(tx1, "increase (updateData)")
    //
    //     // increase with no updateData
    //     params[6] = [];
    //     let tx2 = await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1")});
    //     let gasUsed2 = await reportGasUsed(tx2, "increase (no updateData)")
    //     console.log("updateData gas diff: ", gasUsed1.sub(gasUsed2).toString()); // 13w
    // })

    // it("check long position - Close with profit", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //
    //     let amountIn = parseEther("1").add(fee);
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: amountIn});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //     await expect(await position.reserveAmount).to.eq(parseEther("10"));
    //
    //     let userBalanceBefore = await ethers.provider.getBalance(user0.address);
    //
    //     // price up
    //     await updateMarkPrice(['weth'], ['1600']);
    //
    //     // close all
    //     let paramsDe = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         toUsd(0), // _collateralDelta
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         user0.address,  // _receiver
    //         toUsd(1550),  // _price
    //         toUsd(0), // _minOut
    //         true, // _withdrawETH
    //         []
    //     ]
    //     let tx = await positionManager.connect(user0).decreasePosition(...paramsDe);
    //     let gasFee = await getGasFee(tx);
    //     let userBalanceAfter = await ethers.provider.getBalance(user0.address);
    //     let profit = userBalanceAfter.add(gasFee).sub(userBalanceBefore).sub(amountIn);
    //     expect(profit).to.be.closeTo(parseEther("0.54375"), MAX_WITHIN); // (1500 - 30 + 1000) / 1600 - 1
    //
    //     // expect user position deleted
    //     position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    //     await expect(await position.collateral).to.eq(0);
    // })

    // it("check long position - Close with loss", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //
    //     let amountIn = parseEther("1").add(fee);
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: amountIn});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //     await expect(await position.reserveAmount).to.eq(parseEther("10"));
    //
    //     let userBalanceBefore = await ethers.provider.getBalance(user0.address);
    //
    //     // close all
    //     ({updateData, fee} = await getUpdateData(['weth'], ['1400']));
    //     let paramsDe = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         toUsd(0), // _collateralDelta
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         user0.address,  // _receiver
    //         toUsd(1400),  // _price
    //         toUsd(0), // _minOut
    //         true, // _withdrawETH
    //         updateData
    //     ]
    //     let tx = await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //     let gasFee = await getGasFee(tx);
    //     let userBalanceAfter = await ethers.provider.getBalance(user0.address);
    //     let loss = userBalanceAfter.add(gasFee).sub(userBalanceBefore).sub(amountIn);
    //     expect(loss).to.be.closeTo(parseEther("-0.66428"), MAX_WITHIN); // (1500 - 30 - 1000) / 1400 - 1
    //
    //     // expect user position deleted
    //     position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    //     await expect(await position.collateral).to.eq(0);
    // })

    // it("check long position - Liquidate", async () => {
    //
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30));
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //     await expect(await position.reserveAmount).to.eq(parseEther("10"));
    //
    //     let wethBalanceBefore = await weth.balanceOf(user0.address);
    //
    //     let cumulativeFundingRate = await vault.cumulativeFundingRates(weth.address);
    //     let liqPrice = getLiqPrice(position, cumulativeFundingRate, true);
    //
    //     // liquidate
    //     await positionManager.setLiquidator(user1.address, true);
    //     let changePrice = liqPrice.sub(parseUnits("0.1", 30));
    //     await updateMarkPrice(['weth'], [formatUnits(changePrice, 30)]);
    //     await positionManager.connect(user1).liquidatePosition(user0.address, weth.address, weth.address, true, user1.address, []);
    //
    //     let wethBalanceAfter = await weth.balanceOf(user0.address);
    //     let wethReceived = wethBalanceAfter.sub(wethBalanceBefore);
    //     // sendBack $ = 1485 - (1500-1366.4) / 1500 * 15000 = 149
    //     // amount = (149 - 15) / 1366.4 = 0.098067
    //     expect(wethReceived).to.be.closeTo(parseEther("0.098067"), MAX_WITHIN);
    //
    //     // expect user position deleted
    //     position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    //     await expect(await position.collateral).to.eq(0);
    // })

    // it("close revert below 0, can be close after add collateral", async () => {
    //
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //
    //     // let liqPrice = await getLiqPriceForPosition(user0.address,weth.address,weth.address,true);
    //     // console.log("liqPrice", formatUnits(liqPrice, 30));
    //
    //     // close
    //     ({updateData, fee} = await getUpdateData(['weth'], ['1300']));
    //     let paramsDe = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         toUsd(0), // _collateralDelta
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         user1.address,  // _receiver
    //         toUsd(100),  // _price
    //         toUsd(0), // _minOut
    //         true, // _withdrawETH
    //         updateData
    //     ]
    //     await expect(positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee}))
    //         .to.be.revertedWith("SafeMath: subtraction overflow");
    //
    //     // add collateral
    //     params[3] = 0;
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     // close again
    //     await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee})
    //     position = await vault.positions(key);
    //     expect(position.size).to.eq(0);
    // })

    // it("liquidate below 0 by user self", async () => {
    //
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //
    //     // close
    //     ({updateData, fee} = await getUpdateData(['weth'], ['1300']));
    //     let paramsDe = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         toUsd(0), // _collateralDelta
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         user1.address,  // _receiver
    //         toUsd(100),  // _price
    //         toUsd(0), // _minOut
    //         true, // _withdrawETH
    //         updateData
    //     ]
    //     await expect(positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee}))
    //         .to.be.revertedWith("SafeMath: subtraction overflow");
    //     await expect(positionManager.liquidatePosition(user0.address, weth.address, weth.address, true, user0.address,
    //         updateData, {value: fee})).to.be.revertedWith("PositionManager: forbidden");
    //
    //     // liquidate by user self
    //     await positionManager.connect(user0).liquidatePosition(user0.address, weth.address, weth.address, true, user0.address,
    //         updateData, {value: fee});
    //     position = await vault.positions(key);
    //     expect(position.size).to.eq(0);
    // })

    // it("check long position - Liquidate Max leverage on small price slippage", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(136363.63), // _sizeDelta, col - size * 0.001 > size * 0.01 => size < col / 0.011
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //
    //     // liquidate
    //     await positionManager.setLiquidator(user1.address, true);
    //     await updateMarkPrice(['weth'], ['1499.99']);
    //     await positionManager.connect(user1).liquidatePosition(user0.address, weth.address, weth.address, true, user1.address, []);
    //     // expect user position deleted
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    // })

    // it("check long position - Decrease", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //     await expect(await position.reserveAmount).to.eq(parseEther("10"));
    //
    //     // decrease, only size
    //     ({updateData, fee} = await getUpdateData(['weth']));
    //     let paramsDe = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         toUsd(0), // _collateralDelta
    //         toUsd(1000), // _sizeDelta
    //         true, // _isLong
    //         user1.address,  // _receiver
    //         toUsd(1500),  // _price
    //         toUsd(0), // _minOut
    //         true, // _withdrawETH
    //         updateData
    //     ]
    //     await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //
    //     // check position
    //     position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("14000", 30)); // size -
    //     await expect(await position.collateral).to.eq(parseUnits("1484", 30)); // positionFee - _sizeDelta * 0.1%
    //     await expect(await position.reserveAmount).to.be.closeTo(parseEther("9.3333"), MAX_WITHIN); // reserveAmount - 1000 / 1500
    //
    //     // decrease, size & col
    //     let colReceiver = await newWallet();
    //     paramsDe[2] = toUsd(100);
    //     paramsDe[5] = colReceiver.address; // default user0
    //     ({updateData, fee} = await getUpdateData(['weth']));
    //     paramsDe[9] = updateData;
    //     await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //
    //     // check position
    //     position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("13000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1384", 30));
    //     await expect(await position.reserveAmount).to.be.closeTo(parseEther("8.6666"), MAX_WITHIN);
    //
    //     let received = await ethers.provider.getBalance(colReceiver.address);
    //     // expect(received).to.eq(parseEther("0.066")); // _collateralDelta - positionFee
    //     expect(received).to.be.closeTo(parseEther("0.066"), MAX_WITHIN);
    // })

    it("check short position - Close with profit", async () => {
        // open
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        let daiAmountIn = parseEther("1500");
        let params = [
            [dai.address], // _path
            weth.address, // _indexTokends
            daiAmountIn,
            0, // _minOut
            toUsd(15000), // _sizeDelta
            false, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]

        await dai.mint(user0.address, daiAmountIn);
        await dai.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, dai.address, weth.address, false);
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("15000", 30));
        await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
        await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("15000"));

        // close all, price down
        ({updateData, fee} = await getUpdateData(['weth', 'dai'], ['1400']));
        let paramsDe = [
            [dai.address], // _path
            weth.address, // _indexToken
            toUsd(0), // _collateralDelta
            toUsd(15000), // _sizeDelta
            false, // _isLong
            user1.address,  // _receiver
            toUsd(1450),  // _price
            toUsd(0), // _minOut
            false, // _withdrawETH
            updateData
        ]
        await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
        let profit = await dai.balanceOf(user1.address);
        // expect(profit).to.be.closeTo(parseEther("2470"), MAX_WITHIN); // 1500 - 30 + 1000

        // expect user position deleted
        position = await vault.positions(key);
        await expect(await position.size).to.eq(0);
        await expect(await position.collateral).to.eq(0);
    })

    // it("check short position - Liquidate", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth', 'dai']);
    //     let params = [
    //         [weth.address, dai.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         false, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, dai.address, weth.address, false);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1480.5", 30)); // - marginFee, - swapFee
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //     await expect(await position.reserveAmount).to.eq(parseEther("15000"));
    //
    //     let daiBalanceBefore = await dai.balanceOf(user0.address);
    //
    //     let cumulativeFundingRate = await vault.cumulativeFundingRates(weth.address);
    //     let liqPrice = getLiqPrice(position, cumulativeFundingRate, false);
    //     let changePrice = liqPrice.add(parseUnits("0.1", 30));
    //
    //     // liquidate
    //     await positionManager.setLiquidator(user1.address, true);
    //     ({updateData, fee} = await getUpdateData(['weth'], [formatUnits(changePrice, 30)]));
    //     await positionManager.connect(user1).liquidatePosition(user0.address, dai.address, weth.address, false, user1.address, updateData, {value: fee});
    //
    //     let daiBalanceAfter = await dai.balanceOf(user0.address);
    //     let daiReceived = daiBalanceAfter.sub(daiBalanceBefore);
    //     // 1480.5 - (1633.15 - 1500) / 1500 * 15000 - 15 = 133.999
    //     expect(daiReceived).to.be.closeTo(parseEther("133.999"), MAX_WITHIN);
    //
    //     // expect user position deleted
    //     position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    //     await expect(await position.collateral).to.eq(0);
    // });

    // it("check liquidate price for fees", async () => {
    //     // open
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //
    //     // check position
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //     await expect(await position.reserveAmount).to.eq(parseEther("10"));
    //
    //     await forwardTime(100 * 24 * 60 * 60); // funding fee 100 days, higher liq price
    //     await vault.updateCumulativeFundingRate(weth.address, weth.address);
    //     let cumulativeFundingRate = await vault.cumulativeFundingRates(weth.address);
    //     // console.log("cumulativeFundingRate now:", cumulativeFundingRate.toNumber());
    //     // let liqPrice = getLiqPrice(position, cumulativeFundingRate, true);
    //
    //     // liquidate
    //     await positionManager.setLiquidator(user1.address, true);
    //     await updateMarkPrice(['weth'], ['1389.2524']) // funding fee 100 days, higher liq price 1389.2525
    //     await positionManager.connect(user1).liquidatePosition(user0.address, weth.address, weth.address, true, user1.address, []);
    // })

    it("check long position with wbtc", async () => {

        // open
        let {updateData, fee} = await getUpdateData(['wbtc', 'dai']);
        let daiAmountIn = parseEther("5000");
        let params = [
            [dai.address, wbtc.address], // _path
            wbtc.address, // _indexTokends
            daiAmountIn,
            0, // _minOut
            toUsd(100000), // _sizeDelta
            true, // _isLong
            toUsd(28000), // _acceptablePrice
            updateData
        ]

        await dai.mint(user0.address, daiAmountIn);
        await dai.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, wbtc.address, wbtc.address, true);
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("100000", 30));
        await expect(await position.averagePrice).to.eq(parseUnits("28000", 30));
        await expect(await position.reserveAmount).to.be.closeTo(parseUnits("3.571", 8), MAX_WITHIN);
    });

    it("check short position with wbtc", async () => {

        // open
        let {updateData, fee} = await getUpdateData(['wbtc', 'dai']);
        let daiAmountIn = parseEther("5000");
        let params = [
            [dai.address], // _path
            wbtc.address, // _indexTokends
            daiAmountIn,
            0, // _minOut
            toUsd(100000), // _sizeDelta
            false, // _isLong
            toUsd(28000), // _acceptablePrice
            updateData
        ]

        await dai.mint(user0.address, daiAmountIn);
        await dai.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, dai.address, wbtc.address, false);
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("100000", 30));
        await expect(await position.collateral).to.eq(parseUnits("4900", 30));
        await expect(await position.averagePrice).to.eq(parseUnits("28000", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("100000"));
    });

    // it("check 1% close - no minProfit limit", async () => {
    //
    //     // open with no limit
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //
    //     // check position
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30));
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //
    //     // price up 1%
    //     await updateMarkPrice(['weth', 'dai'], ['1515']);
    //     let res = await vault.getPositionDelta(user0.address, weth.address, weth.address, true);
    //     expect(res[0]).to.eq(true);
    //     expect(res[1]).to.eq(parseUnits("150", 30)); // profit
    //
    //     // close
    //     let receiver = newWallet();
    //     let paramsDe = [
    //         [weth.address, dai.address], // _path
    //         weth.address, // _indexToken
    //         toUsd(0), // _collateralDelta
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         receiver.address,  // _receiver
    //         toUsd(1515),  // _price
    //         toUsd(0), // _minOut
    //         false, // _withdrawETH
    //         []
    //     ]
    //     await positionManager.connect(user0).decreasePosition(...paramsDe);
    //
    //     // check profit
    //     let balance = await dai.balanceOf(receiver.address);
    //     expect(balance).to.gt(parseEther("1615"));
    // });

    // it("check 1% close - with minProfit limit", async () => {
    //
    //     // open with no limit
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [
    //         [weth.address], // _path
    //         weth.address, // _indexToken
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //
    //     // check position
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("15000", 30));
    //     await expect(await position.collateral).to.eq(parseUnits("1485", 30));
    //     await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
    //
    //     // set min profit time
    //     await timelock.setMinProfitTime(vault.address, 600);
    //
    //     // price up 1%
    //     await updateMarkPrice(['weth', 'dai'], ['1515']);
    //     let res = await vault.getPositionDelta(user0.address, weth.address, weth.address, true);
    //     expect(res[0]).to.eq(true);
    //     expect(res[1]).to.eq(0); // no profit
    //
    //     // close
    //     let receiver = newWallet();
    //     let paramsDe = [
    //         [weth.address, dai.address], // _path
    //         weth.address, // _indexToken
    //         toUsd(0), // _collateralDelta
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         receiver.address,  // _receiver
    //         toUsd(1515),  // _price
    //         toUsd(0), // _minOut
    //         false, // _withdrawETH
    //         []
    //     ]
    //     await positionManager.connect(user0).decreasePosition(...paramsDe);
    //
    //     // check profit
    //     let balance = await dai.balanceOf(receiver.address);
    //     expect(balance).to.lt(parseEther("1485"));
    //
    // });

//    added by prigogine @20230306
    it("setGov() - Prigogine", async () => {
        await expect(positionManager.connect(user0).setGov(constants.AddressZero)).to.be.reverted;
        await pm.setGov(constants.AddressZero);
    });
    it("setAdmin() - Prigogine", async () => {
        await expect(positionManager.connect(user0).setAdmin(constants.AddressZero)).to.be.reverted;
        await pm.setAdmin(constants.AddressZero);
    });
    it("setDepositFee() - Prigogine", async () => {
        await pm.setDepositFee(0);
        await pm.setIncreasePositionBufferBps(0);
        // await pm.setReferralStorage(constants.AddressZero);
    });

    it("pm.setOrderKeeper() - Prigogine", async () => {
        await pm.setOrderKeeper(user0.address, true);
        await expect(pm.connect(user0).setOrderKeeper(user0.address, true)).to.be.reverted;

        await pm.setLiquidator(user0.address, true);
        await expect(pm.connect(user0).setLiquidator(user0.address, true)).to.be.reverted;

        await pm.setOpened(true);
        await expect(pm.connect(user0).setOpened(true)).to.be.reverted;

        await pm.setShouldValidateIncreaseOrder(true);
        await expect(pm.connect(user0).setShouldValidateIncreaseOrder(true)).to.be.reverted;
    });

    it("bpm.approve() - Prigogine", async () => {
        await pm.approve(dai.address, user2.address, parseEther("1.2345"));
        await expect(pm.connect(user2).approve(dai.address, user0.address, parseEther("1.2345"))).to.be.reverted;

        await pm.withdrawFees(dai.address, user2.address);
        await expect(pm.connect(user2).withdrawFees(dai.address, user2.address)).to.be.reverted;
    });

    /* added by Prigogine @20230314 */
    // it("check long position - Close with profit 2", async () => {
    //     console.log(`Step0: userBalanceBefore: ${formatEther(await ethers.provider.getBalance(user0.address))}`);
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [[weth.address], weth.address, 0, toUsd(15000), true, toUsd(1500), updateData];
    //     let amountIn = parseEther("5").add(fee);
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: amountIn});
    //     console.log(`Step1: userBalanceBefore: ${formatEther(await ethers.provider.getBalance(user0.address))}`);
    //
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     let userBalanceBefore = await ethers.provider.getBalance(user0.address);
    //     console.log(`Step1b: userBalanceBefore: ${formatEther(await ethers.provider.getBalance(user0.address))}`);
    //
    //     ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
    //     let paramsDe = [[weth.address], weth.address, toUsd(0), toUsd(15000), true, user0.address, toUsd(1550), toUsd(0), true, updateData];
    //     let tx = await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //     let gasFee = await getGasFee(tx);
    //     let userBalanceAfter = await ethers.provider.getBalance(user0.address);
    //     let profit = userBalanceAfter.add(gasFee).sub(userBalanceBefore).sub(amountIn);
    //
    //
    //     console.log(`StepX: userBalanceBefore: ${formatEther(await ethers.provider.getBalance(user0.address))}`);
    // });

    // it("check long position - Close with profit 3", async () => {
    //     console.log(`Step0: v.poolAmounts(weth): ${formatEther(await v.poolAmounts(weth.address))}`);
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [[weth.address], weth.address, 0, toUsd(15000), true, toUsd(1500), updateData];
    //     let amountIn = parseEther("5").add(fee);
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: amountIn});
    //     console.log(`Step1: v.poolAmounts(weth): ${formatEther(await v.poolAmounts(weth.address))}`);
    //
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     let userBalanceBefore = await ethers.provider.getBalance(user0.address);
    //     console.log(`Step1b: v.poolAmounts(weth): ${formatEther(await v.poolAmounts(weth.address))}`);
    //
    //     ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
    //     let paramsDe = [[weth.address], weth.address, toUsd(0), toUsd(15000), true, user0.address, toUsd(1550), toUsd(0), true, updateData];
    //     let tx = await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //     let gasFee = await getGasFee(tx);
    //     let userBalanceAfter = await ethers.provider.getBalance(user0.address);
    //     let profit = userBalanceAfter.add(gasFee).sub(userBalanceBefore).sub(amountIn);
    //     console.log(`Step X: v.poolAmounts(weth): ${formatEther(await v.poolAmounts(weth.address))}`);
    // });

    // it("long position && close with profit ==> BASE", async () => {
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [[weth.address], weth.address, 0, toUsd(15000), true, toUsd(1500), updateData];
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("5").add(fee)});
    //
    //     ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
    //     let paramsDe = [[weth.address], weth.address, toUsd(0), toUsd(15000), true, user0.address, toUsd(1550), toUsd(0), true, updateData];
    //     await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    // });

    // it("long position && close with profit ==> position", async () => {
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     console.log(`step0: position: ${await vault.positions(key)}`);
    //
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [[weth.address], weth.address, 0, toUsd(15000), true, toUsd(1500), updateData];
    //     await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("5").add(fee)});
    //     console.log(`step1: position: ${await vault.positions(key)}`);
    //
    //     ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
    //     let paramsDe = [[weth.address], weth.address, toUsd(0), toUsd(15000), true, user0.address, toUsd(1550), toUsd(0), true, updateData];
    //     await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //
    //     console.log(`stepX: position: ${await vault.positions(key)}`);
    // });

    // it.only("long+profit ==> v.poolAmounts", async () => {
    //     expect(await v.poolAmounts(weth.address)).eq(parseEther("100"));
    //
    //     // let {updateData, fee} = await getUpdateData(['weth']);
    //     // let params = [[weth.address], weth.address, 0, toUsd(9000), true, toUsd(1500), updateData];
    //     // await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("2.3456789").add(fee)});
    //     // expect(await v.poolAmounts(weth.address)).gt(parseEther("100"));
    //     //
    //     // ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
    //     // let paramsDe = [[weth.address], weth.address, toUsd(0), toUsd(9000), true, user0.address, toUsd(1550), toUsd(0), true, updateData];
    //     // await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //     // expect(await v.poolAmounts(weth.address)).lt(parseEther("100"));
    // });

    // it("long+profit ==> v.reservedAmounts", async () => {
    //     expect(await v.reservedAmounts(weth.address)).eq(0);
    //
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [[weth.address], weth.address, 0, toUsd(9000), true, toUsd(1500), updateData];
    //     // await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("2.3456789").add(fee)});
    //     // expect(await v.reservedAmounts(weth.address)).gt(0);
    //     //
    //     // ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
    //     // let paramsDe = [[weth.address], weth.address, toUsd(0), toUsd(9000), true, user0.address, toUsd(1550), toUsd(0), true, updateData];
    //     // await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    //     // expect(await v.reservedAmounts(weth.address)).eq(0);
    // });

    // it("long+profit ==> v.allWhitelistedTokens", async () => {
    //     expect(await v.whitelistedTokens(dai.address)).eq(true);
    //     expect(await v.whitelistedTokens(weth.address)).eq(true);
    //     expect(await v.allWhitelistedTokensLength()).eq(5);
    //     expect(await v.allWhitelistedTokens(0)).not.eq(constants.AddressZero);
    //     expect(await v.allWhitelistedTokens(1)).not.eq(constants.AddressZero);
    //
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     let params = [[weth.address], weth.address, 0, toUsd(9000), true, toUsd(1500), updateData];
    //     // await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("2.3456789").add(fee)});
    //
    //     // ({updateData, fee} = await getUpdateData(['weth'], ['1600']));
    //     // let paramsDe = [[weth.address], weth.address, toUsd(0), toUsd(9000), true, user0.address, toUsd(1550), toUsd(0), true, updateData];
    //     // await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
    // });

    it("buyZKUSD ==> v.zkusdAmounts", async () => {
        let beforeValue = await v.zkusdAmounts(weth.address);
        await weth.mint(vault.address, parseEther("300"));
        await updateMarkPrice(['weth']);
        await vault.buyZKUSD(weth.address, user1.address);
        expect(await v.zkusdAmounts(weth.address)).gt(beforeValue);
    });

    it("longWithProfit ==> v.maxUsdmAmounts", async () => {
        await longWithProfit(weth, positionManager, user0);
    });

    it("longWithProfit ==> v.tokenDecimals", async () => {
        expect(await v.tokenDecimals(weth.address)).eq(18);
        expect(await v.tokenDecimals(dai.address)).eq(18);
        await longWithProfit(weth, positionManager, user0);
        expect(await v.tokenDecimals(weth.address)).eq(18);
        expect(await v.tokenDecimals(dai.address)).eq(18);
    });

    it("longWithProfit ==> v.tokenBalances", async () => {
        expect(await v.tokenBalances(weth.address)).eq(await weth.balanceOf(v.address));
        await longWithProfit(weth, positionManager, user0);
        expect(await v.tokenBalances(weth.address)).eq(await weth.balanceOf(v.address));
    });

    it("longWithProfit ==> v.tokenWeights", async () => {
        console.log(`v.tokenWeights(weth): ${await v.tokenWeights(weth.address)}`);
        console.log(`v.tokenWeights(dai): ${await v.tokenWeights(dai.address)}`);
        console.log(`v.totalTokenWeights: ${await v.totalTokenWeights()}`);
        await longWithProfit(weth, positionManager, user0);

        console.log(`v.tokenWeights(weth): ${await v.tokenWeights(weth.address)}`);
        console.log(`v.tokenWeights(dai): ${await v.tokenWeights(dai.address)}`);
        console.log(`v.totalTokenWeights: ${await v.totalTokenWeights()}`);
    });
});

