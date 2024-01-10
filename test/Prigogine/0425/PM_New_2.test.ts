import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("PM_New_2 Test", async () => {
    let vault: any,
        router: any,
        pm: any,
        shortsTracker: any,

        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        miner: any,
        feeTo: any,
        receiver: any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v: any,
        dlpManager: any,
        zkdx: any,
        orderBook: any,
        feed: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        pm = fixture.positionManager;
        shortsTracker = fixture.shortsTracker;

        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = fixture.dai;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        miner = fixture.miner;
        feeTo = fixture.feeTo;
        receiver = fixture.receiver;

        zkdlp = fixture.zkdlp;
        timelock = fixture.timelock;
        rewardRouter = fixture.rewardRouter;
        zkusd = fixture.ZKUSD;
        v = fixture.vault;
        dlpManager = fixture.zkdlpManager;
        zkdx = fixture.ZKDX;
        feed = fixture.vaultPriceFeed;
        orderBook = fixture.orderBook;
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
    async function baseOperationB() {
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

    it("pm.scripts => deploy => 2_deploy_manager.ts", async () => {
        expect(pm.address).to.not.eq(constants.AddressZero);
        expect(await pm.vault()).to.eq(vault.address);
        expect(await pm.router()).to.be.eq(router.address);
        expect(await pm.shortsTracker()).to.be.eq(shortsTracker.address);
        expect(await pm.weth()).to.be.eq(weth.address);
        expect(await pm.depositFee()).to.be.eq(50);
        expect(await pm.orderBook()).to.be.eq(orderBook.address);
        expect(await pm.admin()).to.be.eq(owner.address);
        expect(await pm.gov()).to.be.eq(owner.address);
    });
    it("pm.scripts => deploy => 2_deploy_manager.ts", async () => {
        let s = shortsTracker;
        expect(await s.isHandler(pm.address)).to.be.true;
        expect(await s.isGlobalShortDataReady()).to.be.true;
        expect(await s.vault()).to.be.eq(v.address);
    });
    it("pm.scripts => deploy => 2_deploy_manager.ts => setOpened", async () => {
        expect(await pm.opened()).to.be.true;
        await (expect(pm.connect(user0).setOpened(false))).to.be.reverted;

        await pm.setOpened(false);
        expect(await pm.opened()).to.be.false;
        await pm.setOpened(true);
        expect(await pm.opened()).to.be.true;
    });
    it("pm.scripts => deploy => 2_deploy_manager.ts => Router.addPlugin()", async () => {
        expect(await router.plugins(pm.address)).to.be.true;
        expect(await router.plugins(timelock.address)).to.be.false;

        expect(await timelock.isHandler(pm.address)).to.be.true;
        expect(await timelock.isHandler(router.address)).to.be.false;
        expect(await timelock.shouldToggleIsLeverageEnabled()).to.be.true;
    });
    it("pm.scripts => deploy => 4_deploy_tokens.ts", async () => {
        expect(await vault.isLiquidator(pm.address)).to.be.true;
        expect(await vault.isLiquidator(timelock.address)).to.be.false;
        expect(await vault.isLiquidator(router.address)).to.be.false;
        expect(await vault.isLiquidator(owner.address)).to.be.false;
        expect(await vault.isLiquidator(user0.address)).to.be.false;
    });
    it("bpm.settings => setAdmin()", async () => {
        expect(await pm.admin()).to.be.eq(owner.address);
        expect(await pm.gov()).to.be.eq(owner.address);
        await (expect(pm.connect(user0).setAdmin(user0.address))).to.be.reverted;

        await pm.setAdmin(user0.address);
        expect(await pm.admin()).to.be.eq(user0.address);
        await pm.setAdmin(owner.address);
        expect(await pm.admin()).to.be.eq(owner.address);
    });
    it("bpm.settings => setDepositFee()", async () => {
        expect(await pm.admin()).to.be.eq(owner.address);
        expect(await pm.gov()).to.be.eq(owner.address);
        expect(await pm.depositFee()).to.be.eq(50);
        await (expect(pm.connect(user0).setDepositFee(100))).to.be.reverted;

        await pm.setDepositFee(100);
        expect(await pm.depositFee()).to.be.eq(100);
        await pm.setDepositFee(50);
        expect(await pm.depositFee()).to.be.eq(50);
    });
    it("bpm.settings => setIncreasePositionBufferBps()", async () => {
        expect(await pm.increasePositionBufferBps()).to.be.eq(100);
        await (expect(pm.connect(user0).setIncreasePositionBufferBps(300))).to.be.reverted;

        await pm.setIncreasePositionBufferBps(300);
        expect(await pm.increasePositionBufferBps()).to.be.eq(300);
        await pm.setIncreasePositionBufferBps(100);
        expect(await pm.increasePositionBufferBps()).to.be.eq(100);
    });
    // it("bpm.settings => setReferralStorage()", async () => {
    //     expect(await pm.referralStorage()).to.be.eq(constants.AddressZero);
    //     await (expect(pm.connect(user0).setReferralStorage(user0.address))).to.be.reverted;
    //
    //     await pm.setReferralStorage(user0.address);
    //     expect(await pm.referralStorage()).to.be.eq(user0.address);
    //     await pm.setReferralStorage(constants.AddressZero);
    //     expect(await pm.referralStorage()).to.be.eq(constants.AddressZero);
    // });
    // it("bpm.settings => setReferralStorage() v2", async () => {
    //     await buyMLPWithETHV2(parseEther("20"), owner);
    //     await pm.setReferralStorage(user0.address);
    //     await expect(longWETH_DAIAmountInV2(owner, parseEther("2000"), 4000)).to.be.reverted;
    //
    //     await pm.setReferralStorage(constants.AddressZero);
    //     await longWETH_DAIAmountInV2(owner, parseEther("2000"), 4000);
    //     expect(await dai.balanceOf(vault.address)).to.be.eq(parseEther("2000"));
    // });
    it("bpm.settings => setMaxGlobalSizes()", async () => {
        await pm.setMaxGlobalSizes(
            [weth.address],
            [parseUnits("1500", 30)],
            [parseUnits("1500", 30)]);

        await buyMLPWithETHV2(parseEther("20"), owner);
        await expect(longWETH_DAIAmountInV2(owner, parseEther("2000"), 4000)).to.be.reverted;
        await longWETH_DAIAmountInV2(owner, parseEther("800"), 1499);
    });
    it("bpm.settings => setMaxGlobalSizes() v2", async () => {
        await pm.setMaxGlobalSizes(
            [weth.address],
            [parseUnits("1500", 30)],
            [parseUnits("1500", 30)]);

        expect(await pm.maxGlobalLongSizes(weth.address)).to.be.eq(parseUnits("1500", 30));
        expect(await pm.maxGlobalShortSizes(weth.address)).to.be.eq(parseUnits("1500", 30));
        expect(await pm.maxGlobalLongSizes(dai.address)).to.be.eq(0);
        expect(await pm.maxGlobalShortSizes(dai.address)).to.be.eq(0);
        expect(await pm.maxGlobalLongSizes(wbtc.address)).to.be.eq(0);
        expect(await pm.maxGlobalShortSizes(wbtc.address)).to.be.eq(0);
    });
    it("bpm.settings => setMaxGlobalSizes() + buyMLPWithETHV2", async () => {
        let key, position;
        await pm.setMaxGlobalSizes(
            [weth.address],
            [parseUnits("1500", 30)],
            [parseUnits("0", 30)]);
        await buyMLPWithETHV2(parseEther("20"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("800"), 1400);
        key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
        position = await vault.positions(key);
        console.log(`1. position size: ${formatUnits(position.size, 30)}`);

        await closePositionV2(owner, 300, 400);
        key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
        position = await vault.positions(key);
        console.log(`2. position size: ${formatUnits(position.size, 30)}`);


        await longWETH_DAIAmountInV2(owner, parseEther("200"), 900);
        key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
        position = await vault.positions(key);
        console.log(`3.position size: ${formatUnits(position.size, 30)}`);


        await longWETH_DAIAmountInV2(owner, parseEther("50"), 200);
        key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
        position = await vault.positions(key);
        console.log(`position size: ${formatUnits(position.size, 30)}`);
    });
    it("bpm.func => short + close", async () => {
        await baseOperationB();
    });
    it("bpm.parameters => depositFee()", async () => {
        await longOperationA();
        expect(await pm.depositFee()).to.be.eq(50);
        expect(await pm.feeReserves(weth.address)).to.be.eq(0);
        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);
    });
    it("bpm.parameters => depositFee v2", async () => {
        await longOperationA();

        expect(await pm.depositFee()).to.be.eq(50);
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 0);

        expect(await pm.feeReserves(weth.address)).to.be.gt(parseEther("0.00033"));
        expect(await pm.feeReserves(weth.address)).to.be.lt(parseEther("0.00034"));
        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);
    });
    it("bpm.parameters => depositFee v3", async () => {
        await pm.setDepositFee(150);
        await longOperationA();

        expect(await pm.depositFee()).to.be.eq(150);
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
        expect(await pm.feeReserves(weth.address)).to.be.eq(parseEther("0.001"));


        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);

        await longWETH_DAIAmountInV2(owner, parseEther("100"), 300);
        expect(await pm.feeReserves(weth.address)).to.be.eq(parseEther("0.001"));
        expect(await pm.feeReserves(dai.address)).to.be.eq(parseEther("0"));
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(parseEther("0"));
    });
    it("bpm.settings => setIncreasePositionBufferBps()", async () => {
        expect(await pm.increasePositionBufferBps()).to.be.eq(100);
        await expect(pm.connect(user0).setIncreasePositionBufferBps(200)).to.be.reverted;

        await pm.setIncreasePositionBufferBps(200);
        expect(await pm.increasePositionBufferBps()).to.be.eq(200);
        await pm.setIncreasePositionBufferBps(100);
        expect(await pm.increasePositionBufferBps()).to.be.eq(100);
    });
    it("bpm.parameters => increasePositionBufferBps() v2 => increasePositionBufferBps = 100", async () => {
        expect(await pm.increasePositionBufferBps()).to.be.eq(100);

        await longOperationA();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
        expect(await pm.feeReserves(weth.address)).to.be.gt(parseEther("0.00033"));
        expect(await pm.feeReserves(weth.address)).to.be.lt(parseEther("0.00034"));
        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);
    });
    it("bpm.parameters => increasePositionBufferBps() v3 => IncreasePositionBufferBps = 60000", async () => {
        await pm.setIncreasePositionBufferBps(60000);
        expect(await pm.increasePositionBufferBps()).to.be.eq(60000);

        await longOperationA();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
        expect(await pm.feeReserves(weth.address)).to.be.eq(0);
        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);
    });
    it("bpm.parameters => admin + gov", async () => {
        expect(await pm.admin()).to.be.eq(owner.address);
        expect(await pm.gov()).to.be.eq(owner.address);
    });
    it("bpm.parameters => vault + shortsTracker + router + weth", async () => {
        expect(await pm.vault()).to.be.eq(vault.address);
        expect(await pm.shortsTracker()).to.be.eq(shortsTracker.address);
        expect(await pm.router()).to.be.eq(router.address);
        expect(await pm.weth()).to.be.eq(weth.address);
        // expect(await pm.referralStorage()).to.be.eq(constants.AddressZero);
    });
    it("bpm.settings => setAdmin()", async () => {
        expect(await pm.admin()).to.be.eq(owner.address);
        await expect(pm.connect(user0).setAdmin(user0.address)).to.be.reverted;

        await pm.setAdmin(user0.address);
        expect(await pm.admin()).to.be.eq(user0.address);
        await pm.setAdmin(owner.address);
        expect(await pm.admin()).to.be.eq(owner.address);
    });
    it("bpm.parameters => maxGlobalLongSizes + maxGlobalShortSizes", async () => {
        await pm.setIncreasePositionBufferBps(60000);
        await baseOperationB();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);

        expect(await pm.maxGlobalLongSizes(weth.address)).to.be.eq(0);
        expect(await pm.maxGlobalShortSizes(weth.address)).to.be.eq(0);
        expect(await pm.maxGlobalLongSizes(dai.address)).to.be.eq(0);
        expect(await pm.maxGlobalShortSizes(dai.address)).to.be.eq(0);
        expect(await pm.maxGlobalLongSizes(wbtc.address)).to.be.eq(0);
        expect(await pm.maxGlobalShortSizes(wbtc.address)).to.be.eq(0);
    });
    it("bpm.parameters => feeReserves", async () => {
        await baseOperationB();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);

        expect(await pm.feeReserves(weth.address)).to.be.gt(0);
        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);
    });
});

describe("PM->BasePositionManager Test", async () => {
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
        bpm                 : any;

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
        bpm                 = pm;
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

    it("bpm.func => feeReserves()", async () => {
        await longOperationTwice();
        expect(await pm.feeReserves(weth.address))      .to.be.gt(0);
        expect(await pm.feeReserves(dai.address))       .to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address))      .to.be.eq(0);
    });
    it("bpm.func => withdrawFees()", async () => {
        await longOperationTwice();
        await pm.withdrawFees(weth.address, owner.address);

        expect(await pm.feeReserves(weth.address))      .to.be.eq(0);
        expect(await pm.feeReserves(dai.address))       .to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address))      .to.be.eq(0);
    });
    it("bpm.func => constructor()", async () => {
        let bpm = pm;
        await longOperationTwice();
        expect(await bpm.vault())                       .to.be.eq(vault.address);
        expect(await bpm.router())                      .to.be.eq(router.address);
        expect(await bpm.weth())                        .to.be.eq(weth.address);
        expect(await bpm.depositFee())                  .to.be.eq(50);
        expect(await bpm.shortsTracker())               .to.be.eq(shortsTracker.address);
        expect(await bpm.admin())                       .to.be.eq(owner.address);
        expect(await bpm.gov())                         .to.be.eq(owner.address);
    });
    it("bpm.func => setDepositFee() => 9999 is ok", async () => {
        await bpm.setDepositFee(9999);
        await longOperationTwice();

        expect(await pm.feeReserves(weth.address))      .to.be.gt(0);
        expect(await pm.feeReserves(dai.address))       .to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address))      .to.be.eq(0);
    });
    it("bpm.func => setDepositFee() => 2000 is ok", async () => {
        await bpm.setDepositFee(2000);
        await longOperationTwice();

        expect(await pm.feeReserves(weth.address))      .to.be.closeTo(parseEther("0.013293"), MAX_WITHIN);
        expect(await pm.feeReserves(dai.address))       .to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address))      .to.be.eq(0);
    });
    it("bpm.func => setMaxGlobalSizes() => WETH_long:1500 + WETH_Short: 1500", async () => {
        let maxGlobalLongSize = parseUnits("1500", 30);
        let maxGlobalShortSize = parseUnits("1234", 30);

        await bpm.setMaxGlobalSizes([weth.address], [maxGlobalLongSize], [maxGlobalShortSize]);
        expect(await bpm.maxGlobalLongSizes(weth.address)).to.be.eq(maxGlobalLongSize);
        expect(await bpm.maxGlobalShortSizes(weth.address)).to.be.eq(maxGlobalShortSize);
        expect(await bpm.maxGlobalLongSizes(dai.address)).to.be.eq(0);
        expect(await bpm.maxGlobalShortSizes(dai.address)).to.be.eq(0);
        expect(await bpm.maxGlobalLongSizes(wbtc.address)).to.be.eq(0);
        expect(await bpm.maxGlobalShortSizes(wbtc.address)).to.be.eq(0);

        await longOperationA();
        await expect(longWETH_DAIAmountInV2(owner, parseEther("1000"), 2000)).to.be.reverted;
    });
    it("bpm.func => setMaxGlobalSizes() => ALL: 1500", async () => {
        let maxGlobalSize = parseUnits("1501", 30);
        await bpm.setMaxGlobalSizes(
            [weth.address,dai.address, wbtc.address],
            [maxGlobalSize, maxGlobalSize, maxGlobalSize],
            [maxGlobalSize, maxGlobalSize, maxGlobalSize]);
        expect(await bpm.maxGlobalLongSizes(weth.address)).to.be.eq(maxGlobalSize);
        expect(await bpm.maxGlobalShortSizes(weth.address)).to.be.eq(maxGlobalSize);
        expect(await bpm.maxGlobalLongSizes(dai.address)).to.be.eq(maxGlobalSize);
        expect(await bpm.maxGlobalShortSizes(dai.address)).to.be.eq(maxGlobalSize);
        expect(await bpm.maxGlobalLongSizes(wbtc.address)).to.be.eq(maxGlobalSize);
        expect(await bpm.maxGlobalShortSizes(wbtc.address)).to.be.eq(maxGlobalSize);

        await longOperationA();
        await expect(longWETH_DAIAmountInV2(owner, parseEther("1000"), 2000)).to.be.reverted;
    });
});
