import {
    ApproveAmount, forwardTime,
    setupFixture,
    toUsd,
} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {
    MAX_WITHIN
} from "../../../helpers/constants";
import {constants} from "ethers";
import {ethers, network} from "hardhat";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {minExecutionFee} from "../../../helpers/params";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("check PM TEST SCENARIO_0524", async () => {
    let
        weth                : any,
        wbtc                : any,
        dai                 : any,
        usdc                : any,
        tsla                : any,
        zkdlp               : any,
        dlp                 : any,
        zkusd               : any,
        zkdx                : any,
        zkdxlv1             : any,

        /* users */
        owner               : any,
        user0               : any,
        user1               : any,
        user2               : any,
        miner               : any,
        feeTo               : any,
        receiver            : any,
        /* contracts */
        timelock            : any,
        t                   : any,
        vault               : any,
        v                   : any,
        feed                : any,
        vaultUtils          : any,
        vu                  : any,
        vec                 : any,
        pythContract        : any,

        pm                  : any,
        dlpManager          : any,
        dm                  : any,
        router              : any,
        shortsTracker       : any,
        ss                  : any,
        o                   : any,
        rewardRouter        : any,
        rr                  : any,
        reader              : any,
        obr                 : any,
        /* Staking */
        stakingUSDC         : any,
        esZKDX              : any,
        rewardToken         : any,
        stakingToken        : any,
        stakingETH          : any;

    beforeEach(async () => {
        let fixture = await setupFixture();

        /* tokens */
        weth                = fixture.weth;
        wbtc                = fixture.wbtc;
        dai                 = fixture.dai;
        usdc                = fixture.usdc;
        tsla                = fixture.tsla;
        zkdlp               = fixture.zkdlp;
        dlp                 = zkdlp;
        zkusd               = fixture.ZKUSD;
        zkdx                = fixture.ZKDX;
        zkdxlv1             = fixture.zkdxlv1;

        /* users */
        owner               = fixture.owner;
        user0               = fixture.user0;
        user1               = fixture.user1;
        user2               = fixture.user2;
        miner               = fixture.miner;
        feeTo               = fixture.feeTo;
        receiver            = fixture.receiver;
        /* contracts */
        timelock            = fixture.timelock;
        t                   = timelock;
        vault               = fixture.vault;
        v                   = vault;
        feed                = fixture.vaultPriceFeed;
        vaultUtils          = fixture.VaultUtils;
        vu                  = vaultUtils;
        vec                 = fixture.vaultErrorController;
        pythContract        = fixture.pythContract;

        pm                  = fixture.positionManager;
        dlpManager          = fixture.zkdlpManager;
        dm                  = dlpManager;
        router              = fixture.router;
        shortsTracker       = fixture.shortsTracker;
        ss                  = shortsTracker;
        o                   = fixture.orderBook;
        rewardRouter        = fixture.rewardRouter;
        rr                  = rewardRouter;
        reader              = fixture.reader;
        obr                 = fixture.orderBookReader;
        /* Staking */
        stakingUSDC         = fixture.stakingUSDC;
        stakingETH          = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;
        rewardToken         = esZKDX;
        stakingToken        = usdc;

        await feed.setValidTime(120);
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
    async function orderPrepareV2(user: any) {
        await wbtc.mint(user.address, parseEther("10000"));
        await weth.mint(user.address, parseEther("10000"));
        await dai.mint(user.address, parseEther("10000"));
        await tsla.mint(user.address, parseEther("10000"));
        await wbtc.connect(user).approve(router.address, ApproveAmount);
        await weth.connect(user).approve(router.address, ApproveAmount);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await tsla.connect(user).approve(router.address, ApproveAmount);
    }
    async function createIO_LONG_TOKEN(_token: any, _tokenAmountIn: any, _user: any, _triggerPrice: any) {
        await o.connect(_user).createIncreaseOrder(
            _token.address, // purchaseToken
            _tokenAmountIn, // amountIn
            _token.address, // indexToken
            toUsd(100000), // sizeDelta
            _token.address, // collateralToken
            true, // isLong
            toUsd(_triggerPrice), // triggerPrice
            false, // triggerAboveThreshold
            parseEther("0.005"), // executionFee
            false, // shouldWrap
            {value: parseEther("0.005")}
        );
    };
    async function stakingPrepare(_staking: any, _amountIn: any = parseEther("25000000")) {
        await esZKDX.mint(owner.address, _amountIn);
        await esZKDX.approve(_staking.address, _amountIn);
        await esZKDX.transfer(_staking.address, _amountIn);
        await _staking.notifyRewardAmount(_amountIn);
    }
    async function stakingStake(_staking: any, _user: any = owner, _amountIn: any = parseEther("100")) {
        await stakingToken.mint(_user.address, _amountIn);
        await stakingToken.connect(_user).approve(_staking.address, _amountIn);
        await _staking.connect(_user).stake(_amountIn);
    }
    async function stakingETHStake(_staking: any, _user: any = owner, _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).stake({value: _amountIn});
    }
    async function withdrawStaking(_staking: any, _user: any = owner, _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).withdraw(_amountIn);
    }
    async function getRewardStaking(_staking: any, _user: any = owner) {
        await _staking.connect(_user).getReward();
    }

    async function OP_BASE_MLP() {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("123456"), user2);

        await sellMLPWithTokenV2(parseEther("99100"), weth, owner);
        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);
        await sellMLPWithTokenV2(parseEther("79160"), wbtc, user1);
        await sellMLPWithTokenV2(parseEther("23085"), dai, user2);

        await buyMLPWithETHV2(parseEther("200"), owner);
        await sellMLPWithETHV2(parseEther("99100"), owner);
        /* added for new TSLA TEST*/
        await buyMLPWithTokenV2(tsla, parseEther("100"), user0);
        await sellMLPWithTokenV2(parseEther("100"), tsla, user0);
    }
    async function OP_BASE_LONG_SHORT() {
        await longOperationA();
        await shortOperationA();
        await closePositionV2(owner, 300, 400);
    }
    async function OP_ORDER_PREPARE() {
        await orderPrepareV2(owner);
        await orderPrepareV2(user0);
        await orderPrepareV2(user1);
        await orderPrepareV2(user2);
    }
    async function OP_IO_LONG() {
        await createIO_LONG_TOKEN(wbtc, parseUnits("1", 8), user0, 25000);
        await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
        await createIO_LONG_TOKEN(dai, parseEther("100"), user0, 0.99);
        await createIO_LONG_TOKEN(tsla, parseEther("100"), user0, 1);
    }
    async function OP_STAKING() {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC);
    }
    async function OP_STAKING_ETH() {
        await stakingPrepare(stakingETH);
        await stakingETHStake(stakingETH);
    }
    it("check pm.parameters => ", async() => {
        expect(await pm.BASIS_POINTS_DIVISOR()).to.equal(10000);
        expect(await pm.depositFee()).to.equal(50);
        expect(await pm.increasePositionBufferBps()).to.equal(100);
        expect(await pm.admin()).to.eq(owner.address);

        expect(await pm.vault()).to.eq(v.address);
        expect(await pm.shortsTracker()).to.eq(shortsTracker.address);
        expect(await pm.router()).to.eq(router.address);
        expect(await pm.weth()).to.eq(weth.address);
        // expect(await pm.referralStorage()).to.eq(constants.AddressZero);
    });
    it("check pm.parameters => maxGlobalLongSizes", async() => {
        expect(await pm.maxGlobalLongSizes(weth.address)).to.equal(0);
        expect(await pm.maxGlobalLongSizes(wbtc.address)).to.equal(0);
        expect(await pm.maxGlobalLongSizes(dai.address)).to.equal(0);
        expect(await pm.maxGlobalLongSizes(tsla.address)).to.equal(0);
        expect(await pm.maxGlobalLongSizes(usdc.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(weth.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(wbtc.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(dai.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(tsla.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(usdc.address)).to.equal(0);

        await pm.setMaxGlobalSizes(
            [weth.address, dai.address,],
            [toUsd(100), toUsd(200), ],
            [toUsd(300), toUsd(400), ],
        );

        expect(await pm.maxGlobalLongSizes(weth.address)).to.equal(toUsd(100));
        expect(await pm.maxGlobalLongSizes(wbtc.address)).to.equal(0);
        expect(await pm.maxGlobalLongSizes(dai.address)).to.equal(toUsd(200));
        expect(await pm.maxGlobalLongSizes(tsla.address)).to.equal(0);
        expect(await pm.maxGlobalLongSizes(usdc.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(weth.address)).to.equal(toUsd(300));
        expect(await pm.maxGlobalShortSizes(wbtc.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(dai.address)).to.equal(toUsd(400));
        expect(await pm.maxGlobalShortSizes(tsla.address)).to.equal(0);
        expect(await pm.maxGlobalShortSizes(usdc.address)).to.equal(0);
    });
    // it("check pm.param => feeReserves", async() => {
    //     expect(await pm.feeReserves(weth.address)).to.equal(0);
    //     expect(await pm.feeReserves(wbtc.address)).to.equal(0);
    //     expect(await pm.feeReserves(dai.address)).to.equal(0);
    //     expect(await pm.feeReserves(tsla.address)).to.equal(0);
    //     expect(await pm.feeReserves(usdc.address)).to.equal(0);
    //
    //     await OP_BASE_MLP();
    //     await OP_BASE_LONG_SHORT();
    //     await OP_ORDER_PREPARE();
    //     await OP_IO_LONG();
    //     await OP_STAKING();
    //     await OP_STAKING_ETH();
    //     await longOperationTwice();
    //
    //     expect(await pm.feeReserves(weth.address)).to.closeTo(parseEther("0.002991"), MAX_WITHIN);
    //     expect(await pm.feeReserves(wbtc.address)).to.eq(0);
    //     expect(await pm.feeReserves(dai.address)).to.eq(0);
    //     expect(await pm.feeReserves(tsla.address)).to.eq(0);
    //     expect(await pm.feeReserves(usdc.address)).to.eq(0);
    // });
    // it("check v.param => feeReserves", async() => {
    //     expect(await v.feeReserves(weth.address)).to.equal(0);
    //     expect(await v.feeReserves(wbtc.address)).to.equal(0);
    //     expect(await v.feeReserves(dai.address)).to.equal(0);
    //     expect(await v.feeReserves(tsla.address)).to.equal(0);
    //     expect(await v.feeReserves(usdc.address)).to.equal(0);
    //
    //     await OP_BASE_MLP();
    //
    //
    //     await OP_BASE_LONG_SHORT();
    //     await OP_ORDER_PREPARE();
    //     await OP_IO_LONG();
    //     await OP_STAKING();
    //     await OP_STAKING_ETH();
    //     await longOperationTwice();
    //
    //     expect(await v.feeReserves(weth.address)).to.gt(0);
    //     expect(await v.feeReserves(wbtc.address)).to.eq(0);
    //     expect(await v.feeReserves(dai.address)).to.gt(0);
    //     expect(await v.feeReserves(tsla.address)).to.eq(0);
    //     expect(await v.feeReserves(usdc.address)).to.eq(0);
    // });
    it("check pm.params => opened", async() => {
        expect(await pm.opened()).to.true;
        expect(await pm.shouldValidateIncreaseOrder()).to.true;
        expect(await pm.orderBook()).to.eq(o.address);

        await pm.setOpened(false);
        await pm.setShouldValidateIncreaseOrder(false);
        await pm.setOrderBook(constants.AddressZero);
        expect(await pm.opened()).to.false;
        expect(await pm.shouldValidateIncreaseOrder()).to.false;
        expect(await pm.orderBook()).to.eq(constants.AddressZero);
    });
    it("check pm.params => isOrderKeeper", async() => {
        expect(await pm.isOrderKeeper(miner.address)).to.false;
        expect(await pm.isPartner(miner.address)).to.false;
        expect(await pm.isLiquidator(miner.address)).to.false;

        await pm.setOrderKeeper(miner.address, true);
        await pm.setPartner(miner.address, true);
        await pm.setLiquidator(miner.address, true);
        expect(await pm.isOrderKeeper(miner.address)).to.true;
        expect(await pm.isPartner(miner.address)).to.true;
        expect(await pm.isLiquidator(miner.address)).to.true;
    });
    it("check bpm.settings => setAdmin", async() => {
        expect(await pm.admin()).to.eq(owner.address);
        expect(await pm.depositFee()).to.equal(50);
        expect(await pm.increasePositionBufferBps()).to.equal(100);
        // expect(await pm.referralStorage()).to.eq(constants.AddressZero);

        await pm.setAdmin(owner.address);
        await pm.setDepositFee(100);
        await pm.setIncreasePositionBufferBps(200);
        // await pm.setReferralStorage(miner.address);

        expect(await pm.admin()).to.eq(owner.address);
        expect(await pm.depositFee()).to.equal(100);
        expect(await pm.increasePositionBufferBps()).to.equal(200);
        // expect(await pm.referralStorage()).to.eq(miner.address);

        await pm.withdrawFees(weth.address, feeTo.address);
        await pm.approve(weth.address, miner.address, parseEther("1"));
    });
    it("check bpm.func => withdrawFees", async() => {
        expect(await pm.feeReserves(weth.address)).to.eq(0);
        await longOperationTwice();
        expect(await pm.feeReserves(weth.address)).to.gt(0);

        expect(await weth.balanceOf(feeTo.address)).to.eq(0);
        await pm.withdrawFees(weth.address, feeTo.address);
        expect(await weth.balanceOf(feeTo.address)).to.gt(0);

        await pm.approve(weth.address, miner.address, parseEther("1"));
    });
    it("check pm.func => constructor", async() => {
        expect(await pm.vault()).to.eq(v.address);
        expect(await pm.router()).to.eq(router.address);
        expect(await pm.weth()).to.eq(weth.address);
        expect(await pm.depositFee()).to.eq(50);
        expect(await pm.shortsTracker()).to.eq(shortsTracker.address);
        expect(await pm.admin()).to.eq(owner.address);
        expect(await pm.orderBook()).to.eq(o.address);
    });

    it("check o.params => router", async() => {
         expect(await o.router()).to.eq(router.address);
         expect(await o.vault()).to.eq(v.address);
         expect(await o.weth()).to.eq(weth.address);
         expect(await o.zkusd()).to.eq(zkusd.address);
         expect(await o.minExecutionFee()).to.eq(minExecutionFee);
         expect(await o.gov()).to.eq(owner.address);

         await o.setGov(miner.address)
         expect(await o.gov()).to.eq(miner.address);
         await o.connect(miner).setGov(owner.address);
         expect(await o.gov()).to.eq(owner.address);

         await o.setMinExecutionFee(parseEther("0.01"));
         expect(await o.minExecutionFee()).to.eq(parseEther("0.01"));
    });
    // it("check o.params => increaseOrders + increaseOrdersIndex", async() => {
    //     console.log(`${await o.increaseOrders(user0.address,0)}`);
    //     expect(await o.increaseOrdersIndex(user0.address)).to.eq(0);
    //     expect(await o.decreaseOrdersIndex(user0.address)).to.eq(0);
    //
    //     await OP_ORDER_PREPARE();
    //     await OP_IO_LONG();
    //
    //     console.log(`${await o.increaseOrders(user0.address,0)}`);
    //     expect(await o.increaseOrdersIndex(user0.address)).to.eq(4);
    //     expect(await o.decreaseOrdersIndex(user0.address)).to.eq(0);
    // });
    // it("check o.func => getIncreaseOrder", async() => {
    //     await OP_ORDER_PREPARE();
    //     await OP_IO_LONG();
    //
    //     let io = await o.getIncreaseOrder(user0.address, 0);
    //     expect(io.purchaseToken).to.eq(wbtc.address);
    //     let decreaseOrder = await o.getDecreaseOrder(user0.address, 0);
    //     expect(decreaseOrder.collateralToken).to.eq(constants.AddressZero);
    // });

    it("check router.params => ", async() => {
        expect(await router.gov()).to.eq(owner.address);
        expect(await router.weth()).to.eq(weth.address);
        expect(await router.zkusd()).to.eq(zkusd.address);
        expect(await router.vault()).to.eq(v.address);
        expect(await router.plugins(pm.address)).to.true;
        expect(await router.plugins(o.address)).to.true;

        // constructor
        expect(await router.vault()).to.eq(v.address);
        expect(await router.zkusd()).to.eq(zkusd.address);
        expect(await router.weth()).to.eq(weth.address);
        expect(await router.gov()).to.eq(owner.address);

        await router.setGov(miner.address);
        expect(await router.gov()).to.eq(miner.address);
    });
    it("check router.func => addPlugin + removePlugins", async() => {
        expect(await router.plugins(pm.address)).to.true;
        expect(await router.plugins(o.address)).to.true;
        await router.removePlugin(pm.address);
        await router.removePlugin(o.address);
        expect(await router.plugins(pm.address)).to.false;
        expect(await router.plugins(o.address)).to.false;

        await router.addPlugin(pm.address);
        await router.addPlugin(o.address);
        expect(await router.plugins(pm.address)).to.true;
        expect(await router.plugins(o.address)).to.true;
    });
    it("check shortsTracker.params => ", async() => {
        let s = shortsTracker;
        expect(await s.vault()).to.eq(v.address);
        expect(await s.isHandler(pm.address)).to.true;
        expect(await s.globalShortAveragePrices(weth.address)).to.eq(0);
        expect(await s.globalShortAveragePrices(wbtc.address)).to.eq(0);
        expect(await s.isGlobalShortDataReady()).to.true;

        await s.setHandler(pm.address, false); // setHandler
        expect(await s.isHandler(pm.address)).to.false;
        expect(await s.isHandler(o.address)).to.false;

        await s.setIsGlobalShortDataReady(false); //setIsGlobalShortDataReady
        expect(await s.isGlobalShortDataReady()).to.false;
        await s.setIsGlobalShortDataReady(true);
        expect(await s.isGlobalShortDataReady()).to.true;

        await s.setIsGlobalShortDataReady(false);
        await s.setInitData([dai.address],[0]);
        expect(await s.gov()).to.eq(owner.address);
    });
    it("check dlpManager => DLPMANAGER STORAGE", async() => {
        let d = dlpManager;
        expect(await d.gov()).to.eq(owner.address);
        expect(await d.vault()).to.eq(v.address);
        expect(await d.zkUsd()).to.eq(zkusd.address);
        expect(await d.zkdlp()).to.eq(dlp.address);
        expect(await d.shortsTracker()).to.eq(shortsTracker.address);
        expect(await d.inPrivateMode()).to.true;
        expect(await d.shortsTrackerAveragePriceWeight()).to.eq(10000);

        expect(await d.isHandler(pm.address)).to.false;
        expect(await d.isHandler(rr.address)).to.true;
        expect(await d.cooldownDuration()).to.eq(0);
        expect(await d.aumAddition()).to.eq(0);
        expect(await d.aumDeduction()).to.eq(0);

        expect(await d.lastAddedAt(owner.address)).to.eq(0);
        expect(await d.lastAddedAt(user0.address)).to.eq(0);
        await OP_BASE_MLP();
        expect(await d.lastAddedAt(owner.address)).to.gt(0);
        expect(await d.lastAddedAt(user0.address)).to.gt(0);

        expect(await d.gov()).to.eq(owner.address);
    });
    it("check dlpManager => DLPMANAGER SETTINGS", async() => {
        let d = dlpManager;
        expect(await d.inPrivateMode()).to.true;
        await d.setInPrivateMode(false);
        expect(await d.inPrivateMode()).to.false;

        expect(await d.shortsTrackerAveragePriceWeight()).to.eq(10000);
        await d.setShortsTrackerAveragePriceWeight(5000);
        expect(await d.shortsTrackerAveragePriceWeight()).to.eq(5000);

        expect(await d.isHandler(rr.address)).to.true;
        await d.setHandler(rr.address, false);
        expect(await d.isHandler(rr.address)).to.false;

        expect(await d.cooldownDuration()).to.eq(0);
        await d.setCooldownDuration(100);
        expect(await d.cooldownDuration()).to.eq(100);

        expect(await d.aumAddition()).to.eq(0);
        expect(await d.aumDeduction()).to.eq(0);
        await d.setAumAdjustment(100,200);
        expect(await d.aumAddition()).to.eq(100);
        expect(await d.aumDeduction()).to.eq(200);
    });
    it("check dlpManager => DLPMANAGER", async() => {
        let d = dlpManager;
        expect(await d.gov()).to.eq(owner.address);
        expect(await d.vault()).to.eq(v.address);
        expect(await d.zkUsd()).to.eq(zkusd.address);
        expect(await d.zkdlp()).to.eq(dlp.address);
        expect(await d.shortsTracker()).to.eq(ss.address);
        expect(await d.cooldownDuration()).to.eq(0);

        await OP_BASE_MLP();
        expect(await d.getPrice(true)).to.gt(0);

        let [aum1,aum2] = await d.getAums();
        console.log(`${formatUnits(aum1,30)}`);
        console.log(`${formatUnits(aum2,30)}`);
        console.log(`${formatUnits(await d.getAumInZkusd(true),18) }`);
        console.log(`${formatUnits(await d.getAum(true,true),30)}`);
    });
    it("check vault => VAULT STORAGE", async() => {
        expect(await v.gov()).to.eq(t.address);
        expect(await v.isInitialized()).to.true;
        expect(await v.router()).to.eq(router.address);
        expect(await v.zkusd()).to.eq(zkusd.address);
        expect(await v.priceFeed()).to.eq(feed.address);

        expect(await v.liquidationFeeUsd()).to.eq(parseUnits("0",30));
        expect(await v.fundingRateFactor()).to.eq(100);
        expect(await v.stableFundingRateFactor()).to.eq(100);

        expect(await v.maxLeverage()).to.eq(100 * 10000);
        expect(await v.taxBasisPoints()).to.eq(0);
        expect(await v.stableTaxBasisPoints()).to.eq(0);
        expect(await v.mintBurnFeeBasisPoints()).to.eq(0);
        expect(await v.stableSwapFeeBasisPoints()).to.eq(0);
        expect(await v.marginFeeBasisPoints()).to.eq(500);
        expect(await v.fundingInterval()).to.eq(3600);

        expect(await v.whitelistedTokenCount()).to.eq(5);
        expect(await v.minProfitTime()).to.eq(3600);

        expect(await v.isSwapEnabled()).to.true;
        expect(await v.isLeverageEnabled()).to.false;
        expect(await v.hasDynamicFees()).to.false;
        expect(await v.inPrivateLiquidationMode()).to.true;
        expect(await v.vaultUtils()).to.eq(vu.address);
        expect(await v.errorController()).to.eq(vec.address);
    });
    it("check vault => VAULT SETTINGS", async() => {
        await t.signalSetGov(v.address, owner.address);
        await forwardTime(86400 * 7);
        expect(await v.gov()).to.eq(t.address);
        await t.setGov(v.address, owner.address);
        await v.acceptGov();
        expect(await v.gov()).to.eq(owner.address);


        expect(await v.vaultUtils()).to.eq(vu.address);
        await v.setVaultUtils(user0.address);
        expect(await v.vaultUtils()).to.eq(user0.address);

        expect(await v.errorController()).to.eq(vec.address);
        await v.setErrorController(user0.address);
        expect(await v.errorController()).to.eq(user0.address);

        expect(await v.errors(10)).to.eq("Vault: invalid _fundingInterval");
        await expect(v.setError(10,"hello error")).to.reverted;

        expect(await v.isManager(pm.address)).to.false;
        await v.setManager(pm.address, true);
        expect(await v.isManager(pm.address)).to.true;

        expect(await v.inPrivateLiquidationMode()).to.true;
        await v.setInPrivateLiquidationMode(false);
        expect(await v.inPrivateLiquidationMode()).to.false;

        expect(await v.isLiquidator(pm.address)).to.true;
        await v.setLiquidator(pm.address, false);
        expect(await v.isLiquidator(pm.address)).to.false;

        expect(await v.isSwapEnabled()).to.true;
        await v.setIsSwapEnabled(false);
        expect(await v.isSwapEnabled()).to.false;

        expect(await v.isLeverageEnabled()).to.false;
        await v.setIsLeverageEnabled(false);
        expect(await v.isLeverageEnabled()).to.false;

        expect(await v.gov()).to.eq(owner.address);
        await v.setGov(user0.address);
        await v.connect(user0).acceptGov();
        expect(await v.gov()).to.eq(user0.address);
        await v.connect(user0).setGov(owner.address);
        await v.acceptGov();
        expect(await v.gov()).to.eq(owner.address);

        expect(await v.priceFeed()).to.eq(feed.address);
        await v.setPriceFeed(user0.address);
        expect(await v.priceFeed()).to.eq(user0.address);

        expect(await v.maxLeverage()).to.eq(1000000);
        await v.setMaxLeverage(1500000);
        expect(await v.maxLeverage()).to.eq(1500000);

        expect(await v.bufferAmounts(weth.address)).to.eq(0);
        await v.setBufferAmount(weth.address, 100);
        expect(await v.bufferAmounts(weth.address)).to.eq(100);

        expect(await v.maxGlobalShortSizes(weth.address)).to.eq(0);
        await v.setMaxGlobalShortSize(weth.address, 100);
        expect(await v.maxGlobalShortSizes(weth.address)).to.eq(100);

        await v.setFees(0,0,0,0,0,0,0,0,true);
        expect(await v.fundingInterval()).to.eq(3600);
        expect(await v.fundingRateFactor()).to.eq(100);
        expect(await v.stableFundingRateFactor()).to.eq(100);
        await v.setFundingRate(1,2,3);
        expect(await v.fundingInterval()).to.eq(1);
        expect(await v.fundingRateFactor()).to.eq(2);
        expect(await v.stableFundingRateFactor()).to.eq(3);

        await v.setTokenConfig(weth.address, 18, 0, 0, 0, true, true, true);

        expect(await v.minProfitTime()).to.eq(0);
        expect(await v.setMinProfitTime(100));
        expect(await v.minProfitTime()).to.eq(100);

        expect(await v.zkusdAmounts(weth.address)).to.eq(0);
        expect(await v.zkusdAmounts(dai.address)).to.eq(0);
        await v.setZkusdAmount(weth.address,parseEther("100"));
        await v.setZkusdAmount(dai.address,parseEther("200"));
        expect(await v.zkusdAmounts(weth.address)).to.eq(parseEther("100"));
        expect(await v.zkusdAmounts(dai.address)).to.eq(parseEther("200"));

        expect(await v.allowStaleEquityPrice()).to.true;
        await v.setAllowStableEquity(false);
        expect(await v.allowStaleEquityPrice()).to.false;
    });
    it("check vault => VAULT STORAGE V2", async() => {
        await t.signalSetGov(v.address, owner.address);
        await forwardTime(86400 * 7);
        await t.setGov(v.address, owner.address);

        expect(await v.stableTokens(weth.address)).to.false;
        expect(await v.stableTokens(dai.address)).to.true;

        expect(await v.shortableTokens(weth.address)).to.true;
        expect(await v.shortableTokens(wbtc.address)).to.true;
        expect(await v.shortableTokens(tsla.address)).to.true;
        expect(await v.shortableTokens(dai.address)).to.false;
        expect(await v.shortableTokens(usdc.address)).to.false;

        expect(await v.equityTokens(weth.address)).to.false;
        expect(await v.equityTokens(dai.address)).to.false;
        expect(await v.equityTokens(usdc.address)).to.false;
        expect(await v.equityTokens(wbtc.address)).to.false;
        expect(await v.equityTokens(tsla.address)).to.true;


        expect(await v.cumulativeFundingRates(weth.address)).to.eq(0);
        expect(await v.cumulativeFundingRates(dai.address)).to.eq(0);
        expect(await v.lastFundingTimes(weth.address)).to.eq(0);
        expect(await v.lastFundingTimes(dai.address)).to.eq(0);

        expect(await v.feeReserves(weth.address)).to.eq(0);
        expect(await v.feeReserves(dai.address)).to.eq(0);
        expect(await v.globalShortSizes(weth.address)).to.eq(0);
        expect(await v.globalShortSizes(dai.address)).to.eq(0);
        expect(await v.globalShortAveragePrices(weth.address)).to.eq(0);
        expect(await v.globalShortAveragePrices(dai.address)).to.eq(0);
        expect(await v.maxGlobalShortSizes(weth.address)).to.eq(0);
        expect(await v.maxGlobalShortSizes(dai.address)).to.eq(0);
        expect(await v.errors(10)).to.eq("Vault: invalid _fundingInterval");
        expect(await v.tokenDecimals(weth.address)).to.eq(18);
        expect(await v.tokenDecimals(dai.address)).to.eq(18);

        await OP_BASE_MLP();
        expect(await v.tokenBalances(weth.address)).to.gt(0);
        expect(await v.tokenBalances(dai.address)).to.gt(0);
        expect(await v.tokenWeights(weth.address)).to.eq(10000);
        expect(await v.tokenWeights(dai.address)).to.eq(10000);
        expect(await v.totalTokenWeights()).to.eq(50000);

        expect(await v.allWhitelistedTokens(3)).to.not.eq(constants.AddressZero);
        expect(await v.whitelistedTokens(weth.address)).to.true;
        expect(await v.whitelistedTokens(dai.address)).to.true;
        expect(await v.whitelistedTokens(usdc.address)).to.false;
        expect(await v.whitelistedTokens(wbtc.address)).to.true;
        expect(await v.whitelistedTokens(tsla.address)).to.true;

        expect(await v.zkusdAmounts(weth.address)).to.gt(0);
        expect(await v.zkusdAmounts(dai.address)).to.gt(0);
        expect(await v.maxZkusdAmounts(weth.address)).to.gt(0);
        expect(await v.maxZkusdAmounts(wbtc.address)).to.gt(0);
        expect(await v.maxZkusdAmounts(tsla.address)).to.gt(0);
        expect(await v.maxZkusdAmounts(dai.address)).to.eq(0);
        expect(await v.allowStaleEquityPrice()).to.true;

        expect(await v.approvedRouters(owner.address, pm.address)).to.false;
        await v.addRouter(pm.address);
        expect(await v.approvedRouters(owner.address, pm.address)).to.true;
        await v.removeRouter(pm.address);
        expect(await v.approvedRouters(owner.address, pm.address)).to.false;
        expect(await v.allWhitelistedTokensLength()).to.eq(5);

        expect(await v.getPositionFee(owner.address, weth.address, weth.address, true, 1000000)).to.eq(50000);
        let n1 = await v.adjustForDecimals(100, weth.address,weth.address);
        let n2 = await v.adjustForDecimals(200, wbtc.address,wbtc.address);
        expect(n1).to.eq(100);
        expect(n2).to.eq(200);

        let n3 = await v.usdToToken(weth.address, parseEther("1500"), parseEther("1500"));
        expect(n3).to.eq(parseEther("1.0"));
        let n4 = await v.tokenToUsdMin(weth.address, parseEther("1.0"));
        expect(n4).to.eq(parseUnits("1500", 30));

        expect(await v.getMinPrice(weth.address)).to.eq(parseUnits("1500", 30));
        expect(await v.getMaxPrice(weth.address)).to.eq(parseUnits("1500", 30));
    });
    it("check StakingETH => Parameters", async () => {
        let s = stakingUSDC;
        await OP_STAKING()
        await withdrawStaking(s);
        await getRewardStaking(s);
        expect(await s.stakingToken()).to.eq(usdc.address);
        expect(await s.rewardsToken()).to.eq(esZKDX.address);
        expect(await s.duration()).to.eq(86400 * 30);
        expect(await s.finishAt()).to.gt(0);
        expect(await s.updatedAt()).to.gt(0);
        expect(await s.rewardRate()).to.gt(0);
        expect(await s.rewardPerTokenStored()).to.gt(0);

        expect(await s.userRewardPerTokenPaid(owner.address)).to.gt(0);
        expect(await s.userRewardPerTokenPaid(user0.address)).to.eq(0);
        expect(await s.rewards(owner.address)).to.eq(0);
        expect(await s.rewards(user0.address)).to.eq(0);
        expect(await s.totalSupply()).eq(0);
        expect(await s.balanceOf(owner.address)).eq(0);
        expect(await s.balanceOf(user0.address)).eq(0);

        expect(await s.duration()).to.eq(86400 * 30);
        await s.setRewardsDuration(0);
        expect(await s.duration()).to.eq(0);
        expect(await s.owner()).to.eq(owner.address);

        expect(await s.paused()).to.false;
        await s.setPaused(true);
        expect(await s.paused()).to.true;

        expect(await s.lastTimeRewardApplicable()).to.gt(0);
        expect(await s.rewardPerToken()).to.gt(0);
        expect(await s.earned(owner.address)).to.eq(0);
        expect(await s.earned(user0.address)).to.eq(0);
    });
    it("check StakingUSDC => REWARDS v2", async () => {
        let s = stakingUSDC;
        let rewardAmount = parseEther("5000000"); // 5m
        await OP_STAKING();
        await s.notifyRewardAmount(rewardAmount);

        await forwardTime(86400 * 3);
        console.log(`${formatEther(await s.earned(owner.address))}`);
        await forwardTime(86400 * 3);
        console.log(`${formatEther(await s.earned(owner.address))}`);

        await s.notifyRewardAmount(parseEther("10000000")); //10M
        await forwardTime(86400 * 3);
        console.log(`${formatEther(await s.earned(owner.address))}`);

        await forwardTime(86400 * 30);
        console.log(`${formatEther(await s.earned(owner.address))}`);

        await forwardTime(86400 * 120);
        console.log(`${formatEther(await s.earned(owner.address))}`);
    });
    it("check StakingETH => REWARDS", async () => {
        let s = stakingETH;
        let rewardAmount = parseEther("5000000"); // 5m
        await OP_STAKING_ETH();
        await s.notifyRewardAmount(rewardAmount);

        await forwardTime(86400 * 3);
        console.log(`${formatEther(await s.earned(owner.address))}`);
        await forwardTime(86400 * 3);
        console.log(`${formatEther(await s.earned(owner.address))}`);

        await s.notifyRewardAmount(parseEther("15000000")); //15M
        await forwardTime(86400 * 3);
        console.log(`${formatEther(await s.earned(owner.address))}`);

        await forwardTime(86400 * 30);
        console.log(`${formatEther(await s.earned(owner.address))}`);
        await getRewardStaking(s);
        console.log(`${formatEther(await esZKDX.balanceOf(s.address))}`);


        await forwardTime(86400 * 120);
        await getRewardStaking(s);
        console.log(`${formatEther(await s.earned(owner.address))}`);
        console.log(`${formatEther(await esZKDX.balanceOf(s.address))}`);
    });
    it("check Timelock.Params", async () => {
        expect(await t.admin()).to.eq(owner.address);
        expect(await t.buffer()).eq(60);
        expect(await t.tokenManager()).to.eq(constants.AddressZero);
        expect(await t.mintReceiver()).eq(owner.address);
        expect(await t.zkdlpManager()).eq(owner.address);
        expect(await t.maxTokenSupply()).eq(parseEther("1000.0"));
        expect(await t.marginFeeBasisPoints()).eq(10);
        expect(await t.maxMarginFeeBasisPoints()).eq(500);

        await t.setAdmin(user0.address);
        expect(await t.admin()).to.eq(user0.address);
        await t.connect(user0).setAdmin(owner.address);
        expect(await t.admin()).to.eq(owner.address);

        expect(await t.isHandler(pm.address)).to.true;
        expect(await t.isHandler(router.address)).to.false;
        expect(await t.isHandler(user0.address)).to.false;
        expect(await t.isHandler(rewardRouter.address)).to.false;
        await t.setContractHandler(router.address, true);
        expect(await t.isHandler(router.address)).to.true;
        await t.setContractHandler(router.address, false);
        expect(await t.isHandler(router.address)).to.false;

        expect(await t.isKeeper(pm.address)).to.false;
        await t.setKeeper(pm.address, true);
        expect(await t.isKeeper(pm.address)).to.true;
        await t.setKeeper(pm.address, false);
        expect(await t.isKeeper(pm.address)).to.false;

        expect(await t.buffer()).to.eq(60);
        await t.setBuffer(61);
        expect(await t.buffer()).to.eq(61);
        await t.setBuffer(70);
        expect(await t.buffer()).to.eq(70);

        expect(await v.maxLeverage()).eq(1000000)
        await t.setMaxLeverage(v.address, 1500000);
        expect(await v.maxLeverage()).eq(1500000);
        await t.setMaxLeverage(v.address, 1000000);
        expect(await v.maxLeverage()).eq(1000000);

        expect(await v.maxGlobalShortSizes(weth.address)).eq(0);
        expect(await v.maxGlobalShortSizes(wbtc.address)).eq(0);
        expect(await v.maxGlobalShortSizes(dai.address)).eq(0);
        expect(await v.maxGlobalShortSizes(tsla.address)).eq(0);
        await t.setMaxGlobalShortSize(v.address, weth.address, parseEther("1000"));
        expect(await v.maxGlobalShortSizes(weth.address)).eq(parseEther("1000"));
        expect(await v.maxGlobalShortSizes(wbtc.address)).eq(0);
        expect(await v.maxGlobalShortSizes(dai.address)).eq(0);
        expect(await v.maxGlobalShortSizes(tsla.address)).eq(0);

        expect(await v.vaultUtils()).eq(vu.address);
        await t.setVaultUtils(v.address, user0.address);
        expect(await v.vaultUtils()).eq(user0.address);
        await t.setVaultUtils(v.address, vu.address);
        expect(await v.vaultUtils()).eq(vu.address);

        // t.setInPrivateLiquidationMode
        expect(await v.inPrivateLiquidationMode()).true;
        await t.setInPrivateLiquidationMode(v.address, false);
        expect(await v.inPrivateLiquidationMode()).false;
        await t.setInPrivateLiquidationMode(v.address, true);
        expect(await v.inPrivateLiquidationMode()).true;
        // t.setLiquidator
        expect(await v.isLiquidator(pm.address)).true;
        expect(await v.isLiquidator(router.address)).false;
        expect(await v.isLiquidator(user0.address)).false;
        expect(await v.isLiquidator(rewardRouter.address)).false;
        expect(await v.isLiquidator(owner.address)).false;
        expect(await v.isLiquidator(rewardRouter.address)).false;
        await t.setLiquidator(v.address, pm.address, false);
        expect(await v.isLiquidator(pm.address)).false;
        await t.setLiquidator(v.address, pm.address, true);
        expect(await v.isLiquidator(pm.address)).true;

        // t.setInPrivateTransferMode
        expect(await dlp.inPrivateTransferMode()).false;
        expect(await zkdx.inPrivateTransferMode()).false;
        await dlp.setGov(t.address);
        await zkdx.setGov(t.address);
        await t.setInPrivateTransferMode(dlp.address, true);
        await t.setInPrivateTransferMode(zkdx.address, true);
        expect(await dlp.inPrivateTransferMode()).true;
        expect(await zkdx.inPrivateTransferMode()).true;
        await t.setInPrivateTransferMode(dlp.address, false);
        await t.setInPrivateTransferMode(zkdx.address, false);
        expect(await dlp.inPrivateTransferMode()).false;
        expect(await zkdx.inPrivateTransferMode()).false;

        // t.signalSetGov + t.setGov
        expect(await dlp.gov()).eq(t.address);
        expect(await zkdx.gov()).eq(t.address);
        await t.signalSetGov(dlp.address, owner.address);
        await t.signalSetGov(zkdx.address, owner.address);
        await forwardTime(86400 * 7);
        await t.setGov(dlp.address, owner.address);
        await t.setGov(zkdx.address, owner.address);
        expect(await dlp.gov()).eq(owner.address);
        expect(await zkdx.gov()).eq(owner.address);
    });
    it("check Timelock.Func => setHandler", async () => {
        let dm = dlpManager;
        await rr.setGov(t.address);
        await dm.setGov(t.address);
        // t.signalSetHandler + t.setHandler => rr + pm
        expect(await dm.isHandler(rr.address)).true;
        expect(await dm.isHandler(pm.address)).false;
        await t.signalSetHandler(dm.address, rr.address, false);
        await t.signalSetHandler(dm.address, pm.address, true);
        await forwardTime(86400 * 7);
        await t.setHandler(dm.address, rr.address, false);
        await t.setHandler(dm.address, pm.address, true);
        expect(await dm.isHandler(rr.address)).false;
        expect(await dm.isHandler(pm.address)).true;

        // t.signalSetHandler + t.setHandler => dlp + zkdx
        await dlp.setGov(t.address);
        await zkdx.setGov(t.address);
        expect(await dlp.isHandler(rr.address)).false;
        expect(await zkdx.isHandler(rr.address)).false;
        await t.signalSetHandler(dlp.address, rr.address, true);
        await t.signalSetHandler(zkdx.address, rr.address, true);
        await forwardTime(86400 * 7);
        await t.setHandler(dlp.address, rr.address, true);
        await t.setHandler(zkdx.address, rr.address, true);
        expect(await dlp.isHandler(rr.address)).true;
        expect(await zkdx.isHandler(rr.address)).true;

        // t.setHandler => shortsTracker
        let s = shortsTracker;
        await s.setGov(t.address);
        expect(await s.isHandler(rr.address)).false;
        await t.signalSetHandler(s.address, rr.address, true);
        await forwardTime(86400 * 7);
        await t.setHandler(s.address, rr.address, true);
        expect(await s.isHandler(rr.address)).true;
    });
    it("check Timelock.Func => setPriceFeed", async () => {
        // t.setPriceFeed + t.signalSetPriceFeed => v
        expect(await v.priceFeed()).eq(feed.address);
        await t.signalSetPriceFeed(v.address, weth.address);
        await forwardTime(86400 * 7);
        await t.setPriceFeed(v.address, weth.address);
        expect(await v.priceFeed()).eq(weth.address);
        // t.removeAdmin
        expect(await zkusd.admins(owner.address)).true;
        await zkusd.setGov(t.address);
        await t.removeAdmin(zkusd.address, owner.address);
        expect(await zkusd.admins(owner.address)).false;
    });
    it("check Timelock.Func => withdrawFees", async () => {
        // t.withdrawFees
        await OP_BASE_MLP();
        expect(await v.feeReserves(weth.address)).eq(0);
        expect(await v.feeReserves(dai.address)).eq(0);
        expect(await v.feeReserves(wbtc.address)).eq(0);
        expect(await v.feeReserves(usdc.address)).eq(0);
        expect(await v.feeReserves(tsla.address)).eq(0);

        expect(await weth.balanceOf(feeTo.address)).eq(0);
        expect(await dai.balanceOf(feeTo.address)).eq(0);
        expect(await wbtc.balanceOf(feeTo.address)).eq(0);
        expect(await usdc.balanceOf(feeTo.address)).eq(0);
        expect(await tsla.balanceOf(feeTo.address)).eq(0);

        await t.withdrawFees(v.address, weth.address, feeTo.address);
        await t.withdrawFees(v.address, dai.address, feeTo.address);
        await t.withdrawFees(v.address, wbtc.address, feeTo.address);
        await t.withdrawFees(v.address, usdc.address, feeTo.address);
        await t.withdrawFees(v.address, tsla.address, feeTo.address);

        expect(await weth.balanceOf(feeTo.address)).eq(0);
        expect(await dai.balanceOf(feeTo.address)).eq(0);
        expect(await wbtc.balanceOf(feeTo.address)).eq(0);
        expect(await usdc.balanceOf(feeTo.address)).eq(0);
        expect(await tsla.balanceOf(feeTo.address)).eq(0);

        expect(await v.feeReserves(weth.address)).eq(0);
        expect(await v.feeReserves(dai.address)).eq(0);
        expect(await v.feeReserves(wbtc.address)).eq(0);
        expect(await v.feeReserves(usdc.address)).eq(0);
        expect(await v.feeReserves(tsla.address)).eq(0);

        expect(await t.admin()).eq(owner.address);
        await t.setAdmin(user0.address);
        expect(await t.admin()).eq(user0.address);
    });
    it("check Timelock.Func => transferIn", async () => {
        expect(await zkusd.gov()).eq(owner.address);
        await zkusd.addVault(owner.address);
        await zkusd.mint(user0.address, parseEther("1234"));

        await zkusd.connect(user0).approve(t.address, parseEther("1234"));
        expect(await zkusd.balanceOf(user0.address)).eq(parseEther("1234"));
        await t.transferIn(user0.address, zkusd.address, parseEther("1234"));
        expect(await zkusd.balanceOf(user0.address)).eq(0);
        expect(await zkusd.balanceOf(t.address)).eq(parseEther("1234"));

        await zkusd.setGov(t.address);
        await t.signalApprove(zkusd.address, user0.address, parseEther("1234"));
        await forwardTime(86400 * 7);
        await t.approve(zkusd.address, user0.address, parseEther("1234"));
    });
    it("check Timelock.Func => mint", async () => {
        // t.signalMint
        await zkdx.setMinter(t.address,true);
        await t.signalMint(zkdx.address, receiver.address, parseEther("123"));
        await forwardTime(86400 * 7);
        await t.processMint(zkdx.address, receiver.address, parseEther("123"));
        expect(await zkdx.balanceOf(receiver.address)).eq(parseEther("123"));
        // t.signalSetGov
        await zkdx.setGov(t.address);
        expect(await zkdx.gov()).eq(t.address);
        await t.signalSetGov(zkdx.address, owner.address);
        await forwardTime(86400 * 7);
        await t.setGov(zkdx.address, owner.address);
        expect(await zkdx.gov()).eq(owner.address);
    });
    it("check Timelock.func => signalRedeemZkusd + redeemZkusd", async() => {
        await OP_BASE_MLP();
        await expect(t.connect(user0).signalRedeemZkusd(v.address,dai.address, parseEther("100"))).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await t.signalRedeemZkusd(v.address,dai.address, parseEther("1000"));
        await zkusd.setGov(t.address);
        await forwardTime(86400 * 2);
        await updateMarkPrice(['weth', 'dai', 'wbtc','tsla']);

        expect(await dai.balanceOf(v.address)).to.be.gt(parseEther("100000"));
        await t.redeemZkusd(v.address,dai.address, parseEther("1000"));
        expect(await dai.balanceOf(v.address)).to.be.gt(parseEther("99000.2549"));
    });
    it("check Timelock.Func => setSwapFees", async () => {
        // t.setFees
        expect(await v.taxBasisPoints()).eq(0);
        expect(await v.stableTaxBasisPoints()).eq(0);
        expect(await v.mintBurnFeeBasisPoints()).eq(0);
        expect(await v.swapFeeBasisPoints()).eq(0);
        expect(await v.stableSwapFeeBasisPoints()).eq(0);
        expect(await v.marginFeeBasisPoints()).eq(500);
        expect(await v.liquidationFeeUsd()).eq(parseUnits("0",30));
        expect(await v.minProfitTime()).eq(3600);
        expect(await v.hasDynamicFees()).false;

        await t.setSwapFees(v.address,
            100, 100, 100, 100, 100);

        expect(await v.taxBasisPoints()).eq(100);
        expect(await v.stableTaxBasisPoints()).eq(100);
        expect(await v.mintBurnFeeBasisPoints()).eq(100);
        expect(await v.swapFeeBasisPoints()).eq(100);
        expect(await v.stableSwapFeeBasisPoints()).eq(100);
        expect(await v.marginFeeBasisPoints()).eq(500);
        expect(await v.liquidationFeeUsd()).eq(parseUnits("0",30));
        expect(await v.minProfitTime()).eq(3600);
        expect(await v.hasDynamicFees()).false;
    });
    it("check Timelock.Func => setFees", async () => {
        // t.setFundingRate
        expect(await v.fundingInterval()).eq(3600);
        expect(await v.fundingRateFactor()).eq(100);
        expect(await v.stableFundingRateFactor()).eq(100);
        await t.setFundingRate(v.address, 7200, 200, 200);
        expect(await v.fundingInterval()).eq(7200);
        expect(await v.fundingRateFactor()).eq(200);
        expect(await v.stableFundingRateFactor()).eq(200);

        // t.setFees
        expect(await v.taxBasisPoints()).eq(0);
        expect(await v.stableTaxBasisPoints()).eq(0);
        expect(await v.mintBurnFeeBasisPoints()).eq(0);
        expect(await v.swapFeeBasisPoints()).eq(0);
        expect(await v.stableSwapFeeBasisPoints()).eq(0);
        expect(await v.marginFeeBasisPoints()).eq(500);
        expect(await v.liquidationFeeUsd()).eq(parseUnits("0",30));
        expect(await v.minProfitTime()).eq(3600);
        expect(await v.hasDynamicFees()).false;

        await t.setFees(v.address, 100, 100, 100, 100, 100, 100, parseUnits("10.0",30), 100, true);

        expect(await v.taxBasisPoints()).eq(100);
        expect(await v.stableTaxBasisPoints()).eq(100);
        expect(await v.mintBurnFeeBasisPoints()).eq(100);
        expect(await v.swapFeeBasisPoints()).eq(100);
        expect(await v.stableSwapFeeBasisPoints()).eq(100);
        expect(await v.marginFeeBasisPoints()).eq(500);
        expect(await v.liquidationFeeUsd()).eq(parseUnits("10.0",30));
        expect(await v.minProfitTime()).eq(100);
        expect(await v.hasDynamicFees()).true;

        // t.setMinProfitTime
        expect(await v.minProfitTime()).eq(100);
        await t.setMinProfitTime(v.address, 0);
        expect(await v.minProfitTime()).eq(0);

        // t.setTokenConfig
        await t.setTokenConfig(v.address, dai.address,
            100, 100, 100, 100, false,false,false);

        // t.setAllowStableEquity
        expect(await v.allowStaleEquityPrice()).true;
        await t.setAllowStableEquity(v.address, false);
        expect(await v.allowStaleEquityPrice()).false;
        await t.setAllowStableEquity(v.address, true);
        expect(await v.allowStaleEquityPrice()).true;

        // t.setBufferAmounts
        expect(await v.bufferAmounts(weth.address)).eq(0);
        expect(await v.bufferAmounts(dai.address)).eq(0);
        expect(await v.bufferAmounts(wbtc.address)).eq(0);
        expect(await v.bufferAmounts(tsla.address)).eq(0);
        await t.setBufferAmounts(v.address,
            [weth.address,dai.address, wbtc.address, tsla.address],
            [parseEther("0.1"),parseEther("0.2"),parseEther("0.3"),parseEther("0.4")]);

        expect(await v.bufferAmounts(weth.address)).eq(parseEther("0.1"));
        expect(await v.bufferAmounts(dai.address)).eq(parseEther("0.2"));
        expect(await v.bufferAmounts(wbtc.address)).eq(parseEther("0.3"));
        expect(await v.bufferAmounts(tsla.address)).eq(parseEther("0.4"));

        // t.setZkusdAmounts
        expect(await v.zkusdAmounts(weth.address)).eq(0);
        expect(await v.zkusdAmounts(dai.address)).eq(0);
        await t.setZkusdAmounts(v.address, [weth.address], [parseEther("1000")]);
        expect(await v.zkusdAmounts(weth.address)).eq(parseEther("1000"));
        expect(await v.zkusdAmounts(dai.address)).eq(0);

        // t.setIsSwapEnabled
        expect(await v.isSwapEnabled()).true;
        await t.setIsSwapEnabled(v.address, false);
        expect(await v.isSwapEnabled()).false;
        await t.setIsSwapEnabled(v.address, true);
        expect(await v.isSwapEnabled()).true;
    });
    it("check Timelock.Func => updateZkusdSupply", async () => {
        // t.updateZkusdSupply
        expect(await t.zkdlpManager()).eq(owner.address);
        await t.setZkdlpManager(dlpManager.address)
        expect(await t.zkdlpManager()).eq(dlpManager.address);
        await zkusd.setGov(t.address);
        console.log(`${formatEther(await zkusd.totalSupply())}`);
        await t.updateZkusdSupply(parseEther("1"));
        console.log(`${formatEther(await zkusd.totalSupply())}`);
        await OP_BASE_MLP();
        console.log(`${formatEther(await zkusd.totalSupply())}`);
        await t.updateZkusdSupply(parseEther("1"));
        console.log(`${formatEther(await zkusd.totalSupply())}`);
        // t.batchWithdrawFees
        await OP_BASE_MLP();
        await t.batchWithdrawFees(
            v.address,
            [weth.address,dai.address,wbtc.address,tsla.address]);

    });
    it("check Timelock.Func => set", async () => {
        // t.setShouldToggleIsLeverageEnabled
        expect(await t.shouldToggleIsLeverageEnabled()).true;
        await t.setShouldToggleIsLeverageEnabled(false);
        expect(await t.shouldToggleIsLeverageEnabled()).false;
        await t.setShouldToggleIsLeverageEnabled(true);
        expect(await t.shouldToggleIsLeverageEnabled()).true;
        // t.setMarginFeeBasisPoints
        expect(await t.marginFeeBasisPoints()).eq(10);
        expect(await t.maxMarginFeeBasisPoints()).eq(500);
        await t.setMarginFeeBasisPoints(0,0);
        expect(await t.marginFeeBasisPoints()).eq(0);
        expect(await t.maxMarginFeeBasisPoints()).eq(0);
        // t.setIsLeverageEnabled
        expect(await v.isLeverageEnabled()).false;
        await t.setIsLeverageEnabled(v.address, false);
        expect(await v.isLeverageEnabled()).false;
        await t.setIsLeverageEnabled(v.address, true);
        expect(await v.isLeverageEnabled()).true;

        // t.enableLeverage
        await t.enableLeverage(v.address);
        await t.disableLeverage(v.address);
    });
    it("check RR.func => initialize", async () => {
        // rr.initialize
        expect(await rr.isInitialized()).true;
        expect(await rr.weth()).eq(weth.address);
        expect(await rr.zkdx()).eq(zkdx.address);
        expect(await rr.zkdlp()).eq(dlp.address);
        expect(await rr.zkdlpManager()).eq(dm.address);
        // rr.func => mintAndStakeZkdlpETH
        let amountIn = parseEther("1.0");
        let {updateData, fee} = await getUpdateData(['weth','dai','wbtc']);
        await rr.connect(receiver).mintAndStakeZkdlpETH(0,0,updateData, {value: amountIn});
        expect(await dlp.balanceOf(receiver.address)).gt(0);
        // rr.func => unstakeAndRedeemZkdlpETH
        let amountIn2 = await dlp.balanceOf(receiver.address);
        await rr.connect(receiver).unstakeAndRedeemZkdlpETH(
            amountIn2,
            0, receiver.address, updateData, {value: fee});
        expect(await dlp.balanceOf(receiver.address)).eq(0);
    });
    it("check RR.func => mintAndStakeZkdlp + unstakeAndRedeemZkdlp", async () => {
        await weth.mint(receiver.address, parseEther("1.0"));
        await weth.connect(receiver).approve(dm.address, parseEther("1.0"));
        // rr.func => mintAndStakeZkdlp()
        let {updateData: data, fee} = await getUpdateData(['weth','dai','wbtc']);
        await rr.connect(receiver).mintAndStakeZkdlp(
           weth.address, parseEther("1.0"), 0, 0,data,{value: fee});
        expect(await dlp.balanceOf(receiver.address)).gt(0);
        // rr.func => unstakeAndRedeemZkdlp
        let amountIn2 = await dlp.balanceOf(receiver.address);
        await rr.connect(receiver).unstakeAndRedeemZkdlp(
            weth.address, amountIn2,
            0, receiver.address, data, {value: fee});
        expect(await dlp.balanceOf(receiver.address)).eq(0);
    });
    it("check esZKDX => ", async() => {
        // esZKDX.initialize
        expect(await esZKDX.tax()).eq(0);
        expect(await esZKDX.taxReceiver()).eq(owner.address);
        expect(await esZKDX.whitelist(owner.address)).false;
        expect(await esZKDX.whitelist(receiver.address)).false;
        expect(await esZKDX.whitelist(feeTo.address)).false;
        expect(await esZKDX.whitelist(miner.address)).false;
        expect(await esZKDX.owner()).eq(owner.address);
        // esZKDX.func => mint
        expect(await esZKDX.balanceOf(receiver.address)).eq(0);
        await esZKDX.mint(receiver.address, parseEther("1.0"));
        expect(await esZKDX.balanceOf(receiver.address)).eq(parseEther("1.0"));
        // esZKDX.func => transfer
        await esZKDX.connect(receiver).transfer(user0.address, parseEther("1.0"));
        expect(await esZKDX.balanceOf(receiver.address)).eq(0);
        expect(await esZKDX.balanceOf(user0.address)).eq(parseEther("1.0"));
        // esZKDX.func => setTax
        expect(await esZKDX.tax()).eq(0);
        await esZKDX.setTax(100);
        expect(await esZKDX.tax()).eq(100);
        await esZKDX.setTax(0);
        expect(await esZKDX.tax()).eq(0);
        // esZKDX.func => setTaxReceiver
        expect(await esZKDX.taxReceiver()).eq(owner.address);
        await esZKDX.setTaxReceiver(user0.address);
        expect(await esZKDX.taxReceiver()).eq(user0.address);
        await esZKDX.setTaxReceiver(owner.address);
        expect(await esZKDX.taxReceiver()).eq(owner.address);
        // esZKDX.func => setWhitelist
        expect(await esZKDX.whitelist(owner.address)).false;
        expect(await esZKDX.whitelist(user0.address)).false;
        await esZKDX.setWhitelist([owner.address,user0.address], [true,true]);
        expect(await esZKDX.whitelist(owner.address)).true;
        expect(await esZKDX.whitelist(user0.address)).true;
    })
    it("check ZKDXLV1 => ", async() => {
        let z = zkdxlv1;
        // z.func => initialize
        expect(await z.endTime()).eq(0);
        expect(await z.burnableAddress()).eq(constants.AddressZero);
        expect(await z.totalSupply()).eq(10000);
        expect(await z.name()).eq("ZKDXLV1");
        expect(await z.symbol()).eq("ZKDXLV1");
        expect(await z.decimals()).eq(0);
        expect(await z.owner()).eq(owner.address);
        // z.func => _transfer
        await z.transfer(receiver.address, 3000);
        expect(await z.balanceOf(receiver.address)).eq(3000);
        expect(await z.balanceOf(owner.address)).eq(7000);
        // z.func => mint
        await z.mint(receiver.address, 1000);
        expect(await z.balanceOf(receiver.address)).eq(4000);
        expect(await z.balanceOf(owner.address)).eq(7000);
        expect(await z.totalSupply()).eq(11000);
        // z.func => setBurnableAddress
        expect(await z.burnableAddress()).eq(constants.AddressZero);
        await z.setBurnableAddress(owner.address);
        expect(await z.burnableAddress()).eq(owner.address);
        // z.func => burn
        await z.burn(receiver.address, 1000);
        expect(await z.balanceOf(receiver.address)).eq(3000);
        expect(await z.balanceOf(owner.address)).eq(7000);
        expect(await z.totalSupply()).eq(10000);
        // z.func => setEndTime
        expect(await z.endTime()).eq(0);
        await z.setEndTime(100);
        expect(await z.endTime()).eq(100);
        await z.setEndTime(0);
        expect(await z.endTime()).eq(0);
        // z.func => multiTransfer
        await z.mint(z.address, 100);
        await z.connect(owner).multiTransfer([receiver.address, user0.address], [10, 90]);
        expect(await z.balanceOf(receiver.address)).eq(3010);
        expect(await z.balanceOf(user0.address)).eq(90);
        expect(await z.balanceOf(owner.address)).eq(6900);
    });
    it("check zkdlp => ", async() => {
        let z = dlp;
        // z.func => initialize
        expect(await z.id()).eq("ZKDLP");
        expect(await z.name()).eq("ZKDLP");
        expect(await z.symbol()).eq("ZKDLP");
        expect(await z.decimals()).eq(18);
        expect(await z.totalSupply()).eq(0);
        expect(await z.gov()).eq(owner.address);
        // z.func => setMinter
        expect(await z.isMinter(owner.address)).false;
        await z.setMinter(owner.address, true);
        expect(await z.isMinter(owner.address)).true;
        // z.func => mint
        await z.mint(receiver.address, parseEther("1.0"));
        expect(await z.balanceOf(receiver.address)).eq(parseEther("1.0"));
        expect(await z.totalSupply()).eq(parseEther("1.0"));
        // z.func => burn
        await z.burn(receiver.address, parseEther("1.0"));
        expect(await z.balanceOf(receiver.address)).eq(0);
        expect(await z.totalSupply()).eq(0);
        // z.func => Parameters
        expect(await z.name()).eq("ZKDLP");
        expect(await z.symbol()).eq("ZKDLP");
        expect(await z.decimals()).eq(18);
        expect(await z.totalSupply()).eq(0);
        expect(await z.nonStakingSupply()).eq(0);
        expect(await z.gov()).eq(owner.address);
        // z.params => balances
        expect(await z.balances(receiver.address)).eq(0);
        await z.mint(receiver.address, parseEther("1.0"));
        expect(await z.balances(receiver.address)).eq(parseEther("1.0"));
        // z.func => addNonStakingAccount
        await z.addAdmin(owner.address);
        expect(await z.nonStakingAccounts(receiver.address)).false;
        await z.addNonStakingAccount(receiver.address);
        expect(await z.nonStakingAccounts(receiver.address)).true;

    });
    it("check zkdlp => v2", async() => {
        let z = dlp;
        // z.func => setGov
        expect(await z.gov()).eq(owner.address);
        await z.setGov(user0.address);
        expect(await z.gov()).eq(user0.address);
        await z.connect(user0).setGov(owner.address);
        expect(await z.gov()).eq(owner.address);

        // z.func => setInfo
        expect(await z.name()).eq("ZKDLP");
        expect(await z.symbol()).eq("ZKDLP");
        await z.setInfo("ZKDLPToken", "ZKDLPToken");
        expect(await z.name()).eq("ZKDLPToken");
        expect(await z.symbol()).eq("ZKDLPToken");

        // z.func => setYieldTrackers
        await z.setYieldTrackers([constants.AddressZero]);
        expect(await z.yieldTrackers(0)).eq(constants.AddressZero);
        await z.setYieldTrackers([user0.address]);
        expect(await z.yieldTrackers(0)).eq(user0.address);

        // z.func => addAdmin
        expect(await z.admins(owner.address)).false;
        await z.addAdmin(owner.address);
        expect(await z.admins(owner.address)).true;
        await z.removeAdmin(owner.address);
        expect(await z.admins(owner.address)).false;
        await z.addAdmin(owner.address);

        // z.func => setInPrivateTransferMode
        expect(await z.inPrivateTransferMode()).false;
        await z.setInPrivateTransferMode(true);
        expect(await z.inPrivateTransferMode()).true;
        await z.setInPrivateTransferMode(false);
        expect(await z.inPrivateTransferMode()).false;

        // z.func => setHandler
        expect(await z.isHandler(pm.address)).false;
        await z.setHandler(pm.address, true);
        expect(await z.isHandler(pm.address)).true;
        await z.setHandler(pm.address, false);
        expect(await z.isHandler(pm.address)).false;
    });
    it("check zkdlp => v3", async() => {
        let z = dlp;
        await z.addAdmin(owner.address);
        // z.func => addNonStakingAccount
        expect(await z.nonStakingAccounts(receiver.address)).false;
        await z.addNonStakingAccount(receiver.address);
        expect(await z.nonStakingAccounts(receiver.address)).true;
        await z.removeNonStakingAccount(receiver.address);
        expect(await z.nonStakingAccounts(receiver.address)).false;

        // z.func => recoverClaim
        await z.recoverClaim(receiver.address, receiver.address);
        await z.claim(receiver.address);

        // z.func + totalStaked();
        expect(await z.totalStaked()).eq(0);
        expect(await z.balanceOf(receiver.address)).eq(0);
        expect(await z.stakedBalance(receiver.address)).eq(0);
        await z.setMinter(owner.address, true);
        await z.mint(receiver.address, parseEther("1.0"));
        await z.connect(receiver).transfer(feeTo.address, parseEther("1.0"));
        await z.approve(pm.address, parseEther("1.2345"));
        expect(await z.allowance(owner.address, pm.address)).eq(parseEther("1.2345"));
        // z.func => transferFrom
        await z.mint(pm.address, parseEther("1.2345"));
    });
    it("check zkdx => v3", async() => {
        let z = zkdx;
        await z.addAdmin(owner.address);
        // z.func => addNonStakingAccount
        expect(await z.nonStakingAccounts(receiver.address)).false;
        await z.addNonStakingAccount(receiver.address);
        expect(await z.nonStakingAccounts(receiver.address)).true;
        await z.removeNonStakingAccount(receiver.address);
        expect(await z.nonStakingAccounts(receiver.address)).false;

        // z.func => recoverClaim
        await z.recoverClaim(receiver.address, receiver.address);
        await z.claim(receiver.address);

        // z.func + totalStaked();
        expect(await z.totalStaked()).eq(0);
        expect(await z.balanceOf(receiver.address)).eq(0);
        expect(await z.stakedBalance(receiver.address)).eq(0);
        await z.setMinter(owner.address, true);
        await z.mint(receiver.address, parseEther("1.0"));
        await z.connect(receiver).transfer(feeTo.address, parseEther("1.0"));
        await z.approve(pm.address, parseEther("1.2345"));
        expect(await z.allowance(owner.address, pm.address)).eq(parseEther("1.2345"));
        // z.func => transferFrom
        await z.mint(pm.address, parseEther("1.2345"));
    });
    it("check zkusd", async() => {
        let z = zkusd;
        expect(await z.gov()).eq(owner.address);
        expect(await z.vaults(owner.address)).false;
        await z.addVault(owner.address);
        expect(await z.vaults(owner.address)).true;
        await z.removeVault(owner.address);
        expect(await z.vaults(owner.address)).false;
        await z.addVault(owner.address);

        expect(await z.balanceOf(receiver.address)).eq(0);
        await z.mint(receiver.address, parseEther("1.0"));
        expect(await z.balanceOf(receiver.address)).eq(parseEther("1.0"));
        await z.burn(receiver.address, parseEther("1.0"));
        expect(await z.balanceOf(receiver.address)).eq(0);
        expect(await z.totalSupply()).eq(0);
        // z.func => constructor
        expect(await z.name()).eq('ZKUSD');
        expect(await z.symbol()).eq('ZKUSD');
        expect(await z.gov()).eq(owner.address);
        expect(await z.admins(owner.address)).true;
        // z.func => addAdmin + removeAdmin
        expect(await z.admins(user0.address)).false;
        await z.addAdmin(user0.address);
        expect(await z.admins(user0.address)).true;
        await z.removeAdmin(user0.address);
        expect(await z.admins(user0.address)).false;
        // z.func => addNonStakingAccount + removeNonStakingAccount
        expect(await z.nonStakingAccounts(user0.address)).false;
        await z.addNonStakingAccount(user0.address);
        expect(await z.nonStakingAccounts(user0.address)).true;
        await z.removeNonStakingAccount(user0.address);
        expect(await z.nonStakingAccounts(user0.address)).false;

        // z.func => setGov
        expect(await z.gov()).eq(owner.address);
        await z.setGov(user0.address);
        expect(await z.gov()).eq(user0.address);
        await z.connect(user0).setGov(owner.address);
        expect(await z.gov()).eq(owner.address);

        // z.func => setInWhitelistMode
        expect(await z.inWhitelistMode()).false;
        await z.setInWhitelistMode(true);
        expect(await z.inWhitelistMode()).true;
        await z.setInWhitelistMode(false);
        expect(await z.inWhitelistMode()).false;

        // z.func => setWhitelistedHandler
        expect(await z.whitelistedHandlers(user0.address)).false;
        await z.setWhitelistedHandler(user0.address, true);
        expect(await z.whitelistedHandlers(user0.address)).true;
        await z.setWhitelistedHandler(user0.address, false);
        expect(await z.whitelistedHandlers(user0.address)).false;

        // z.func => totalStaked
        expect(await z.totalStaked()).eq(0);
        expect(await z.balanceOf(user0.address)).eq(0);
        expect(await z.stakedBalance(user0.address)).eq(0);
        await z.mint(user0.address, parseEther("1.0"));
        await z.connect(user0).transfer(feeTo.address, parseEther("1.0"));
        expect(await z.balanceOf(user0.address)).eq(0);
        expect(await z.balanceOf(feeTo.address)).eq(parseEther("1.0"));

        await z.connect(owner).approve(pm.address, parseEther("1.2345"));
        expect(await z.allowance(owner.address, pm.address)).eq(parseEther("1.2345"));

        // z.func => setYieldTrackers
        await z.setYieldTrackers([user0.address, user1.address]);
        expect(await z.yieldTrackers(0)).eq(user0.address);
        expect(await z.yieldTrackers(1)).eq(user1.address);
        await z.setYieldTrackers([receiver.address]);
        expect(await z.yieldTrackers(0)).eq(receiver.address);
    });
});
