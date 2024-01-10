import {
    ApproveAmount,
    forwardTime,
    setupFixture,
    toUsd
} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {getLiqPrice, getLiqPriceForPosition, getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("PM->PositionManagerStorage Test", async () => {
    let vault               : any,
        router              : any,
        pm                  : any,
        shortsTracker       : any,

        weth                : any,
        wbtc                : any,
        dai                 : any,
        owner               : any,
        user0               : any,
        user1               : any,
        user2               : any,
        miner               : any,
        feeTo               : any,
        receiver            : any,

        zkdlp               : any,
        timelock            : any,
        rewardRouter        : any,
        zkusd               : any,
        v                   : any,
        dlpManager          : any,
        zkdx                : any,
        feed                : any,
        orderBook           : any,
        pms                 : any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault               = fixture.vault;
        router              = fixture.router;
        pm                  = fixture.positionManager;
        shortsTracker       = fixture.shortsTracker;

        weth                = fixture.weth;
        wbtc                = fixture.wbtc;
        dai                 = fixture.dai;
        owner               = fixture.owner;
        user0               = fixture.user0;
        user1               = fixture.user1;
        user2               = fixture.user2;
        miner               = fixture.miner;
        feeTo               = fixture.feeTo;
        receiver            = fixture.receiver;

        zkdlp               = fixture.zkdlp;
        timelock            = fixture.timelock;
        rewardRouter        = fixture.rewardRouter;
        zkusd               = fixture.ZKUSD;
        v                   = fixture.vault;
        dlpManager          = fixture.zkdlpManager;
        zkdx                = fixture.ZKDX;
        feed                = fixture.vaultPriceFeed;
        pms                 = pm;
        orderBook           = fixture.orderBook;
    });
    async function buyMLPWithTokenV2(token: any, amountIn: any, addressIn: any) {
        await token.mint(addressIn.address, amountIn);
        await token.connect(addressIn).approve(dlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
    }
    async function sellMLPWithTokenV2(zkdlpAmountIn: any, tokenOut: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmountIn);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn, 0, addressIn.address, updateData2, {value: fee2});
    }
    async function buyMLPWithETHV2(etherValue: any, addressIn: any) {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlpETH(0, 0, updateData, {value: etherValue.add(fee)});
    }
    async function sellMLPWithETHV2(zkdlpAmount: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmount);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlpETH(zkdlpAmount, 0, addressIn.address, updateData2, {value: fee2});
    }
    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
            updateData
        ];
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await pm.connect(user).increasePosition(...params, {value: fee});
    };
    async function closePositionV2(user: any, _usdAmountOut: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let paramsDe = [
            [weth.address, dai.address],
            weth.address,
            toUsd(_usdAmountOut),
            toUsd(_sizeDelta),
            true,
            user.address,
            toUsd(1500),
            toUsd(0),
            false,
            updateData];
        await pm.connect(user).decreasePosition(...paramsDe, {value: fee});
    }
    async function shortWETH_DAIAmountInV2(user: any, _daiAmountIn: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let params = [
            [dai.address], // _path
            weth.address, // _indexTokens
            _daiAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            false, // _isLong
            toUsd(1499.000001), // _acceptablePrice
            updateData
        ];
        await dai.mint(user.address, _daiAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await pm.connect(user).increasePosition(...params, {value: fee});
    };
    async function baseOperationA() {
        await longOperationA();
        await shortOperationA();
        await closePositionV2(owner, 300, 400);
    }
    async function longOperationA() {
        await buyMLPWithETHV2(parseEther("20"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("800"), 1400);
    }
    async function shortOperationA() {
        await buyMLPWithTokenV2(dai, parseEther("20000"), owner);
        await shortWETH_DAIAmountInV2(owner, parseEther("100"), 1400);
    }
    async function longOperationTwice() {
        await longOperationA();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
    }

    it("PositionManagerStorage.func => opened + shouldValidateIncreaseOrder", async () => {
        expect(await pms.opened()).to.equal(true);
        expect(await pms.shouldValidateIncreaseOrder()).to.equal(true);
    });
    it("PositionManagerStorage.func => orderBook", async () => {
        expect(await pms.orderBook()).to.be.eq(orderBook.address);
    });
    it("pms.parameters => isOrderBook", async () => {
        expect(await pms.admin()).to.be.eq(owner.address);
        expect(await pms.gov()).to.be.eq(owner.address);
        expect(await pms.isOrderKeeper(owner.address)).to.be.eq(false);

        await pms.setOrderKeeper(owner.address,true);
        expect(await pms.isOrderKeeper(owner.address)).to.be.eq(true);
    });

    it("pms.parameters => isPartner", async () => {
        expect(await pms.isPartner(owner.address)).to.be.eq(false);
        expect(await pms.isPartner(user1.address)).to.be.eq(false);
        expect(await pms.isPartner(user2.address)).to.be.eq(false);
    });

    it("pms.parameters => isLiquidator", async () => {
        expect(await vault.isLiquidator(pms.address)).to.be.eq(true);
        expect(await pms.isLiquidator(vault.address)).to.be.eq(false);
        expect(await pms.isLiquidator(owner.address)).to.be.eq(false);
        expect(await pms.isLiquidator(user1.address)).to.be.eq(false);
        expect(await pms.isLiquidator(user2.address)).to.be.eq(false);
    });

    it("pms.settings => setOrderKeeper", async () => {
        expect(await pms.admin()).to.be.eq(owner.address);
        expect(await pms.gov()).to.be.eq(owner.address);
        await expect(pms.connect(user0).setOrderKeeper(user1.address, true)).to.be.reverted;

        await pms.setOrderKeeper(user1.address, true);
        expect(await pms.isOrderKeeper(user1.address)).to.be.eq(true);
        await pms.setOrderKeeper(user1.address, false);
        expect(await pms.isOrderKeeper(user1.address)).to.be.eq(false);
    });

    it("pms.settings => setLiquidator", async () => {
        expect(await pms.admin()).to.be.eq(owner.address);
        expect(await pms.gov()).to.be.eq(owner.address);
        await expect(pms.connect(user0).setLiquidator(user1.address, true)).to.be.reverted;

        await pms.setLiquidator(user1.address, true);
        expect(await pms.isLiquidator(user1.address)).to.be.eq(true);
        await pms.setLiquidator(user1.address, false);
        expect(await pms.isLiquidator(user1.address)).to.be.eq(false);
    });

    it("pms.settings => setPartner", async () => {
        expect(await pms.admin()).to.be.eq(owner.address);
        expect(await pms.gov()).to.be.eq(owner.address);
        await expect(pms.connect(user0).setPartner(user1.address, true)).to.be.reverted;

        await pms.setPartner(user1.address, true);
        expect(await pms.isPartner(user1.address)).to.be.eq(true);
        await pms.setPartner(user1.address, false);
        expect(await pms.isPartner(user1.address)).to.be.eq(false);
    });

    it("pms.settings => setOpened", async () => {
        expect(await pms.admin()).to.be.eq(owner.address);
        expect(await pms.gov()).to.be.eq(owner.address);
        await expect(pms.connect(user0).setOpened(false)).to.be.reverted;


        expect(await pms.opened()).to.be.eq(true);
        await pms.setOpened(false);
        expect(await pms.opened()).to.be.eq(false);
        await pms.setOpened(true);
        expect(await pms.opened()).to.be.eq(true);
    });

    it("pms.settings => setShouldValidateIncreaseOrder", async () => {
        expect(await pms.admin()).to.be.eq(owner.address);
        expect(await pms.gov()).to.be.eq(owner.address);
        await expect(pms.connect(user0).setShouldValidateIncreaseOrder(false)).to.be.reverted;

        expect(await pms.shouldValidateIncreaseOrder()).to.be.eq(true);
        await pms.setShouldValidateIncreaseOrder(false);
        expect(await pms.shouldValidateIncreaseOrder()).to.be.eq(false);
        await pms.setShouldValidateIncreaseOrder(true);
        expect(await pms.shouldValidateIncreaseOrder()).to.be.eq(true);
    });
});

describe("PM->PositionManager Test", async () => {
    let vault               : any,
        router              : any,
        pm                  : any,
        shortsTracker       : any,

        weth                : any,
        wbtc                : any,
        dai                 : any,
        owner               : any,
        user0               : any,
        user1               : any,
        user2               : any,
        miner               : any,
        feeTo               : any,
        receiver            : any,

        zkdlp               : any,
        timelock            : any,
        rewardRouter        : any,
        zkusd               : any,
        v                   : any,
        dlpManager          : any,
        zkdx                : any,
        feed                : any,
        pms                 : any,
        orderBook           : any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault               = fixture.vault;
        router              = fixture.router;
        pm                  = fixture.positionManager;
        shortsTracker       = fixture.shortsTracker;

        weth                = fixture.weth;
        wbtc                = fixture.wbtc;
        dai                 = fixture.dai;
        owner               = fixture.owner;
        user0               = fixture.user0;
        user1               = fixture.user1;
        user2               = fixture.user2;
        miner               = fixture.miner;
        feeTo               = fixture.feeTo;
        receiver            = fixture.receiver;

        zkdlp               = fixture.zkdlp;
        timelock            = fixture.timelock;
        rewardRouter        = fixture.rewardRouter;
        zkusd               = fixture.ZKUSD;
        v                   = fixture.vault;
        dlpManager          = fixture.zkdlpManager;
        zkdx                = fixture.ZKDX;
        feed                = fixture.vaultPriceFeed;
        pms                 = pm;
        orderBook           = fixture.orderBook;
    });
    async function buyMLPWithTokenV2(token: any, amountIn: any, addressIn: any) {
        await token.mint(addressIn.address, amountIn);
        await token.connect(addressIn).approve(dlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
    }
    async function sellMLPWithTokenV2(zkdlpAmountIn: any, tokenOut: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmountIn);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn, 0, addressIn.address, updateData2, {value: fee2});
    }
    async function buyMLPWithETHV2(etherValue: any, addressIn: any) {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlpETH(0, 0, updateData, {value: etherValue.add(fee)});
    }
    async function sellMLPWithETHV2(zkdlpAmount: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmount);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlpETH(zkdlpAmount, 0, addressIn.address, updateData2, {value: fee2});
    }
    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
            updateData
        ];
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await pm.connect(user).increasePosition(...params, {value: fee});
    };
    async function closePositionV2(user: any, _usdAmountOut: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let paramsDe = [
            [weth.address, dai.address],
            weth.address,
            toUsd(_usdAmountOut),
            toUsd(_sizeDelta),
            true,
            user.address,
            toUsd(1500),
            toUsd(0),
            false,
            updateData];
        await pm.connect(user).decreasePosition(...paramsDe, {value: fee});
    }
    async function shortWETH_DAIAmountInV2(user: any, _daiAmountIn: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let params = [
            [dai.address], // _path
            weth.address, // _indexTokens
            _daiAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            false, // _isLong
            toUsd(1499.000001), // _acceptablePrice
            updateData
        ];
        await dai.mint(user.address, _daiAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await pm.connect(user).increasePosition(...params, {value: fee});
    };
    async function baseOperationA() {
        await longOperationA();
        await shortOperationA();
        await closePositionV2(owner, 300, 400);
    }
    async function longOperationA() {
        await buyMLPWithETHV2(parseEther("20"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("800"), 1400);
    }
    async function shortOperationA() {
        await buyMLPWithTokenV2(dai, parseEther("20000"), owner);
        await shortWETH_DAIAmountInV2(owner, parseEther("100"), 1400);
    }
    async function longOperationTwice() {
        await longOperationA();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
    }

    it("pm.func => constructor", async function() {
       expect(pm.address).not.to.be.eq(constants.AddressZero);

       expect(await pm.orderBook()).to.be.eq(orderBook.address);
       expect(await pm.vault()).to.be.eq(v.address);
       expect(await pm.router()).to.be.eq(router.address);
       expect(await pm.weth()).to.be.eq(weth.address);
       expect(await pm.depositFee()).to.be.eq(50);
       expect(await pm.shortsTracker()).to.be.eq(shortsTracker.address);
       expect(await pm.admin()).to.be.eq(owner.address);
       expect(await pm.gov()).to.be.eq(owner.address);
    });
    it("pm.func => increasePosition", async () => {
        await buyMLPWithETHV2(parseEther("20"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("800"), 1400);
    });

    // it("pm.func => increasePositionETH()", async () => {
    //     await buyMLPWithETHV2(parseEther("20"), owner);
    //     async function longWETH_ETHAmountIN(user: any, _amountIn: any, _sizeDelta: any) {
    //         let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
    //         let params = [
    //             [weth.address], // _path
    //             weth.address, // _indexTokens
    //             0, // _minOut
    //             toUsd(_sizeDelta), // _sizeDelta
    //             true, // _isLong
    //             toUsd(1500.000001), // _acceptablePrice
    //             updateData
    //         ];
    //         // await dai.mint(user.address, _amountIn);
    //         // await dai.connect(user).approve(router.address, ApproveAmount);
    //         await pm.connect(user).increasePositionETH(...params, {value: _amountIn.add(fee)});
    //     };
    //     await longWETH_ETHAmountIN(owner, parseEther("0.2"), 1400);
    // });
    it("pm.func => liquidatePosition()", async () => {
        await pm.setLiquidator(owner.address,true);
        expect(await pm.isLiquidator(owner.address)).to.be.true;
    });

    it("vault.parameters => admin()", async () => {
        console.log(`vault.gov: ${await v.gov()}`);
        console.log(`timelock.address: ${timelock.address}`);
        expect(await vault.gov()).to.be.eq(timelock.address);
    });

    // it.only("liquidate long position", async () => {
    //
    //     await buyMLPWithETHV2(parseEther("20"), owner);
    //
    //     // open long
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
    //     await pm.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
    //
    //     // update price lower than liquidation price
    //     let liqPrice = await getLiqPriceForPosition(user0.address, weth.address, weth.address, true);
    //     let changePrice = liqPrice.sub(parseUnits("0.1", 30)); // 1366.4
    //     let wethBalanceBefore = await weth.balanceOf(user0.address);
    //
    //     // liquidate
    //     await pm.setLiquidator(user1.address, true);
    //     await updateMarkPrice(['weth'], [formatUnits(changePrice, 30)]);
    //     await pm.connect(user1).liquidatePosition(
    //         user0.address, // _account
    //         weth.address, // _collateralToken
    //         weth.address, // _indexToken
    //         true, // _isLong
    //         user1.address, // _feeReceiver
    //         []
    //     );
    //
    //     let wethBalanceAfter = await weth.balanceOf(user0.address);
    //     let wethReceived = wethBalanceAfter.sub(wethBalanceBefore);
    //     // collateral send back to user
    //     // (1485 - (1500-1366.4) / 1500 * 15000 - 15) / 1366.4 = 0.098067
    //     expect(wethReceived).to.be.closeTo(parseEther("0.098067"), MAX_WITHIN);
    //
    //     // expect user position deleted
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(0);
    //     await expect(await position.collateral).to.eq(0);
    // })
});
