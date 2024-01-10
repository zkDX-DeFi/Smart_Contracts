import {
    ApproveAmount, forwardTime,
    setupFixture, toUsd,
} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {
    MAX_WITHIN
} from "../../../helpers/constants";
import {constants} from "ethers";
import {ethers, network} from "hardhat";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {parse} from "url";
import {OP_GET_UPDATEData, splitter} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("check PM TEST SCENARIO_0528", async () => {
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
        t                   : any, //timelock
        vault               : any,
        v                   : any, //vault
        feed                : any, //vaultFeed
        vaultUtils          : any,
        vu                  : any, //vaultUtils
        vec                 : any, //vaultErrorController
        pythContract        : any,

        pm                  : any, //positionManager
        dlpManager          : any,
        dm                  : any, //dlpManager
        router              : any,
        r                   : any, //router
        shortsTracker       : any,
        ss                  : any, //shortsTracker
        o                   : any, //orderBook
        rewardRouter        : any,
        rr                  : any, //rewardRouter
        reader              : any,
        obr                 : any, //orderBookReader
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
        r                   = router;
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

        await feed.setValidTime(300);
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
            _token.address,
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
    async function swapToken(_tokenIn: any = dai, _tokenOut: any = weth, _receiver: any = receiver, _amountIn: any = parseEther("1500")) {
        let {updateData, fee} = await getUpdateData(['weth', 'wbtc', 'tsla', 'dai']);
        await _tokenIn.mint(_receiver.address, _amountIn);
        await _tokenIn.connect(_receiver).approve(router.address, _amountIn);
        await router.connect(_receiver).swap(
            [_tokenIn.address, _tokenOut.address], // path
            _amountIn, // inAmount
            0, // minOut
            _receiver.address, updateData, {value: fee});
    }
    async function directDoolDeposit(_token: any = weth, _amountIn: any = parseEther("100"), _user: any = receiver) {
        await _token.mint(_user.address, _amountIn);
        await _token.connect(_user).approve(router.address, _amountIn);
        await router.connect(_user).directPoolDeposit(_token.address, _amountIn);
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

    async function PM_IP_TOKEN_LONG(_token: any = weth, _acceptablePrice: any = 2000.000001, _sizeDelta: any = 15000, _amountIn : any = parseEther("3000"), _user: any = receiver,) {
        // await _token.mint(_user.address, _amountIn);
        // await _token.connect(_user).approve(router.address, _amountIn);


        await dai.mint(_user.address, _amountIn);
        await dai.connect(_user).approve(router.address, _amountIn);

        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [dai.address,_token.address], // _path
            _token.address, // _indexTokens
            _amountIn, //_amountIn
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _long
            toUsd(_acceptablePrice), // _acceptablePrice
            updateData
        ];
        await pm.connect(_user).increasePosition(...params, {value: fee});
    }
    async function PM_IP_TOKEN_SHORT(_token: any = weth, _acceptablePrice: any = 1400.000001, _sizeDelta: any = 20000, _amountIn : any = parseEther("1000"), _user: any = receiver,) {
        await dai.mint(_user.address, _amountIn);
        await dai.connect(_user).approve(router.address, _amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [dai.address], // _path
            _token.address, // _indexTokens
            _amountIn, //_amountIn
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            false, // _long
            toUsd(_acceptablePrice), // _acceptablePrice
            updateData
        ];
        await pm.connect(_user).increasePosition(...params, {value: fee});
    }
    async function PM_DP_TOKEN_LONG(_token: any = weth, _acceptablePrice: any = 1400, _collateralDelta: any = 1000, _sizeDelta: any = 1000, _user: any = receiver) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [_token.address,dai.address], // _path
            _token.address, // _indexTokens
            toUsd(_collateralDelta), // _collateralDelta
            toUsd(_sizeDelta), // _sizeDelta
            true, // _long
            _user.address, // _receiver
            toUsd(_acceptablePrice), // _acceptablePrice
            0, //_minOut
            false, // _withdrawETH
            updateData
        ];
        await pm.connect(_user).decreasePosition(...params, {value: fee});
    }
    async function PM_DP_TOKEN_SHORT(_token : any = weth, _acceptablePrice : number = 1600, _collateralDelta : number = 1000, _sizeDelta : number = 1000, _user : any = receiver) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [dai.address], // _path
            _token.address, // _indexTokens
            toUsd(_collateralDelta), // _collateralDelta
            toUsd(_sizeDelta), // _sizeDelta
            false, // _long = false
            _user.address, // _receiver
            toUsd(_acceptablePrice), // _acceptablePrice
            0, //_minOut
            false, // _withdrawETH
            updateData
        ];
        await pm.connect(_user).decreasePosition(...params, {value: fee});
    }
    async function OP_DEFAULT() {
        await OP_BASE_MLP();
        await buyMLPWithTokenV2(dai, parseEther("12345678"), user2);

        await PM_IP_TOKEN_SHORT(weth, 1400);
        await PM_IP_TOKEN_SHORT(tsla, 100);
        await PM_IP_TOKEN_SHORT(wbtc, 20000);
        await PM_IP_TOKEN_SHORT(weth, 1400, 30000);
        await PM_IP_TOKEN_SHORT(weth, 1400, 50000);

        await PM_IP_TOKEN_LONG(weth, 2000, 20000);
        await PM_IP_TOKEN_LONG(tsla, 600, 6000);
        await PM_IP_TOKEN_LONG(wbtc, 40000, 100000);
        await PM_IP_TOKEN_LONG(weth, 2000, 20000);
        await PM_IP_TOKEN_LONG(weth, 1600, 60000);
    }
    async function OP_DEFAULT2() {
        await PM_DP_TOKEN_LONG(weth, 1000, 1000, 1000);
        await PM_DP_TOKEN_LONG(wbtc, 20000, 1000, 1000);
        await PM_DP_TOKEN_LONG(tsla, 100, 10, 10);
        await PM_DP_TOKEN_SHORT();
        await PM_DP_TOKEN_SHORT(wbtc, 30000, 100, 100);
        await PM_DP_TOKEN_SHORT(tsla, 300, 100, 100);
    }

    it("check dm => v1", async() => {
        // dm.setInPrivateMode()
        expect(await dm.inPrivateMode()).true;
        await dm.setInPrivateMode(false);
        expect(await dm.inPrivateMode()).false;
        await dm.setInPrivateMode(true);
        expect(await dm.inPrivateMode()).true;
        // dm.setShortsTrackerAveragePriceWeight
        expect(await dm.shortsTrackerAveragePriceWeight()).eq(10000);
        await dm.setShortsTrackerAveragePriceWeight(9000);
        expect(await dm.shortsTrackerAveragePriceWeight()).eq(9000);
        await dm.setShortsTrackerAveragePriceWeight(10000);
        expect(await dm.shortsTrackerAveragePriceWeight()).eq(10000);
        // dm.setHandler
        expect(await dm.isHandler(rr.address)).true;
        await dm.setHandler(rr.address, false);
        expect(await dm.isHandler(rr.address)).false;
        await dm.setHandler(rr.address, true);
        expect(await dm.isHandler(rr.address)).true;
        // dm.setCooldownDuration
        expect(await dm.cooldownDuration()).eq(0);
        await dm.setCooldownDuration(100);
        expect(await dm.cooldownDuration()).eq(100);
        await dm.setCooldownDuration(0);
        expect(await dm.cooldownDuration()).eq(0);
        // dm.setAumAdjustment
        expect(await dm.aumAddition()).eq(0);
        expect(await dm.aumDeduction()).eq(0);
        await dm.setAumAdjustment(100, 200);
        expect(await dm.aumAddition()).eq(100);
        expect(await dm.aumDeduction()).eq(200);
        await dm.setAumAdjustment(0, 0);
        expect(await dm.aumAddition()).eq(0);
        expect(await dm.aumDeduction()).eq(0);
        // dm.func => constructor
        expect(await dm.gov()).eq(owner.address);
        expect(await dm.vault()).eq(v.address);
        expect(await dm.zkUsd()).eq(zkusd.address);
        expect(await dm.zkdlp()).eq(dlp.address);
        expect(await dm.shortsTracker()).eq(ss.address);
        expect(await dm.cooldownDuration()).eq(0);

        let etherValue = parseEther("1");
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rr.mintAndStakeZkdlpETH(
            0, 0, updateData, {value: etherValue.add(fee)});
        await rr.unstakeAndRedeemZkdlpETH(
            parseEther("1000"), 0, receiver.address, updateData, {value: fee});
        // dm.getAums
        let [n1, n2] = await dm.getAums();
        expect(n1).gt(parseUnits("495.5",30));
        expect(n2).gt(parseUnits("495.5",30));
        // dm.getAumInZkusd
        let n3 = await dm.getAumInZkusd(true);
        let n4 = await dm.getAumInZkusd(false);
        expect(n3).gt(parseUnits("495.5",18));
        expect(n4).gt(parseUnits("495.5",18));
        // dm.getAum
        let n5 = await dm.getAum(true,true);
        let n6 = await dm.getAum(false,true);
        let n7 = await dm.getAum(true,false);
        let n8 = await dm.getAum(false,false);
        // console.log(`${formatUnits(n5,30)}, ${formatUnits(n6,30)}, ${formatUnits(n7,30)}, ${formatUnits(n8,30)}`);
        expect(n5).gt(parseUnits("495.5",30));
        expect(n6).gt(parseUnits("495.5",30));
        expect(n7).gt(parseUnits("495.5",30));
        expect(n8).gt(parseUnits("495.5",30));
    });
    it("check dm => v2", async() => {
        let etherValue = parseEther("1");
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc','tsla']);
        await rr.mintAndStakeZkdlpETH(
            0, 0, updateData, {value: etherValue.add(fee)});

        expect(await dm.getAum(true,true)).eq(parseUnits("1500.0",30));
        expect(await feed.getPrice(weth.address,true,true,true)).eq(parseUnits("1500",30));
        expect(await feed.getPrice(dai.address,true,true,true)).eq(parseUnits("1",30));
        expect(await feed.getPrice(wbtc.address,true,true,true)).eq(parseUnits("28000",30));
        expect(await feed.getPrice(tsla.address,true,true,true)).eq(parseUnits("160",30));

        expect(await v.equityTokens(weth.address)).false;
        expect(await v.equityTokens(dai.address)).false;
        expect(await v.equityTokens(wbtc.address)).false;
        expect(await v.equityTokens(tsla.address)).true;
        expect(await v.stableTokens(weth.address)).false;
        expect(await v.stableTokens(dai.address)).true;
        expect(await v.stableTokens(wbtc.address)).false;
        expect(await v.stableTokens(tsla.address)).false;



        expect(await dm.getGlobalShortAveragePrice(weth.address)).eq(0);
        expect(await dm.getGlobalShortAveragePrice(wbtc.address)).eq(0);
        expect(await dm.getGlobalShortAveragePrice(dai.address)).eq(0);
        expect(await dm.getGlobalShortAveragePrice(tsla.address)).eq(0);
        expect(await v.globalShortAveragePrices(weth.address)).eq(0);
        expect(await v.globalShortAveragePrices(wbtc.address)).eq(0);
        expect(await v.globalShortAveragePrices(dai.address)).eq(0);
        expect(await v.globalShortAveragePrices(tsla.address)).eq(0);
        expect(await v.globalShortSizes(weth.address)).eq(0);
        expect(await v.globalShortSizes(wbtc.address)).eq(0);
        expect(await v.globalShortSizes(dai.address)).eq(0);
        expect(await v.globalShortSizes(tsla.address)).eq(0);

        expect(await v.poolAmounts(weth.address)).eq(parseEther("1"));
        expect(await v.tokenDecimals(weth.address)).eq(18);

        await OP_BASE_MLP();
        await OP_BASE_LONG_SHORT();
        expect(await v.globalShortSizes(weth.address)).eq(parseUnits("1400",30));
        expect(await v.globalShortSizes(wbtc.address)).eq(0);
        expect(await v.globalShortSizes(dai.address)).eq(0);
        expect(await v.globalShortSizes(tsla.address)).eq(0);

        let size = parseUnits("140000",30);
        let price = await feed.getPrice(weth.address,true,true,true);
        expect(price).eq(parseUnits("1500",30));

        console.log(`${await dm.getGlobalShortDelta(weth.address, price,size)}`);
        console.log(`averagePrice: ${formatUnits(
            await dm.getGlobalShortAveragePrice(weth.address),30)}`);
    });
    it("check dm => vault.func => buyZKUSD", async() => {
        await updateMarkPrice(['weth', 'dai', 'wbtc','tsla']);
        expect(await dm.getAumInZkusd(true)).eq(0);
        expect(await dm.getAumInZkusd(false)).eq(0);
        expect(await dlp.totalSupply()).eq(0);
        expect(await dm.lastAddedAt(owner.address)).eq(0);

        await OP_BASE_MLP();

        expect(await dm.getAumInZkusd(true)).closeTo(parseEther("819361.0"),MAX_WITHIN);
        expect(await dm.getAumInZkusd(false)).closeTo(parseEther("819361.0"),MAX_WITHIN);
        expect(await dlp.totalSupply()).closeTo(parseEther("819361.0"),MAX_WITHIN);
        expect(await dm.lastAddedAt(owner.address)).gt(0);

        expect(await weth.balanceOf(v.address)).closeTo(parseEther("334.8333"),MAX_WITHIN);
        expect(await dai.balanceOf(v.address)).closeTo(parseEther("100370.9999"),MAX_WITHIN);
        expect(await wbtc.balanceOf(v.address)).eq(parseUnits("7.17285715",8));
        expect(await tsla.balanceOf(v.address)).closeTo(parseEther("99.37499"),MAX_WITHIN);
        expect(await weth.balanceOf(dm.address)).eq(0);
        expect(await dai.balanceOf(dm.address)).eq(0);
        expect(await wbtc.balanceOf(dm.address)).eq(0);
        expect(await tsla.balanceOf(dm.address)).eq(0);

        expect(await v.inManagerMode()).false;
        expect(await v.isManager(dm.address)).false;
        expect(await v.isManager(pm.address)).false;
        expect(await v.isManager(rr.address)).false;
        expect(await v.isManager(router.address)).false;
        expect(await v.isManager(owner.address)).false;
        expect(await v.isManager(user0.address)).false;
        expect(await v.whitelistedTokens(weth.address)).true;
        expect(await v.whitelistedTokens(dai.address)).true;
        expect(await v.whitelistedTokens(wbtc.address)).true;
        expect(await v.whitelistedTokens(tsla.address)).true;
        expect(await v.whitelistedTokens(usdc.address)).false;
        //
        expect(await v.lastFundingTimes(weth.address)).gt(0);
        expect(await v.lastFundingTimes(dai.address)).gt(0);
        expect(await v.lastFundingTimes(wbtc.address)).gt(0);
        expect(await v.lastFundingTimes(tsla.address)).gt(0);
        expect(await v.lastFundingTimes(usdc.address)).eq(0);
        expect(await v.getNextFundingRate(weth.address)).eq(0);
        expect(await v.getNextFundingRate(dai.address)).eq(0);
        expect(await v.getNextFundingRate(wbtc.address)).eq(0);
        expect(await v.getNextFundingRate(tsla.address)).eq(0);
        expect(await v.getNextFundingRate(usdc.address)).eq(0);
        expect(await v.cumulativeFundingRates(weth.address)).eq(0);
        expect(await v.cumulativeFundingRates(dai.address)).eq(0);
        expect(await v.cumulativeFundingRates(wbtc.address)).eq(0);
        expect(await v.cumulativeFundingRates(tsla.address)).eq(0);
        expect(await v.cumulativeFundingRates(usdc.address)).eq(0);
        expect(await v.getMinPrice(weth.address)).eq(parseUnits("1500",30));
        expect(await v.getMaxPrice(weth.address)).eq(parseUnits("1500",30));
        expect(await v.getMinPrice(dai.address)).eq(parseUnits("1",30));
        expect(await v.getMaxPrice(dai.address)).eq(parseUnits("1",30));
        expect(await v.getMinPrice(wbtc.address)).eq(parseUnits("28000",30));
        expect(await v.getMaxPrice(wbtc.address)).eq(parseUnits("28000",30));
        expect(await v.getMinPrice(tsla.address)).eq(parseUnits("160",30));
        expect(await v.getMaxPrice(tsla.address)).eq(parseUnits("160",30));

        let _zkusdAmount = parseEther("1.0");
        let _token = weth;
        expect(await v.adjustForDecimals(_zkusdAmount, _token.address, zkusd.address)).eq(parseUnits("1.0"));
        _zkusdAmount = parseUnits("1.0",8);
        _token = wbtc;
        expect(await v.adjustForDecimals(_zkusdAmount, _token.address, zkusd.address)).eq(parseEther("1.0"));
        expect(await vu.getBuyZkusdFeeBasisPoints(weth.address, parseEther("1.0"))).eq(0);

        expect(await v.zkusdAmounts(weth.address)).gt(parseEther("500000.99996"));
        expect(await v.zkusdAmounts(dai.address)).gt(parseEther("100000.631992"));
        expect(await v.zkusdAmounts(wbtc.address)).gt(parseEther("199999.99999"));
        expect(await v.zkusdAmounts(tsla.address)).gt(parseEther("15851.99999"));
        expect(await v.zkusdAmounts(usdc.address)).eq(0);

        expect(await v.maxZkusdAmounts(weth.address)).gt(0);
        expect(await v.maxZkusdAmounts(dai.address)).eq(0);
        expect(await v.maxZkusdAmounts(wbtc.address)).gt(0);
        expect(await v.maxZkusdAmounts(tsla.address)).gt(0);
        expect(await v.maxZkusdAmounts(usdc.address)).eq(0);

        expect(await v.poolAmounts(weth.address)).eq(await weth.balanceOf(v.address));
        expect(await v.poolAmounts(dai.address)).eq(await dai.balanceOf(v.address));
        expect(await v.poolAmounts(wbtc.address)).eq(await wbtc.balanceOf(v.address));
        expect(await v.poolAmounts(tsla.address)).eq(await tsla.balanceOf(v.address));
        expect(await v.poolAmounts(usdc.address)).eq(await usdc.balanceOf(v.address));

        expect(await zkusd.totalSupply()).gt(0);
        expect(await zkusd.totalSupply()).gt(parseEther("815852.63196074"));
    });
    it("check dm => vault.func => sellZKUSD", async() => {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        expect(await v.zkusdAmounts(weth.address)).eq(parseEther("300000.0"));
        expect(await v.poolAmounts(weth.address)).eq(parseEther("200.0"));
        expect(await v.reservedAmounts(weth.address)).eq(0);
        expect(await zkusd.totalSupply()).eq(parseEther("300000.0"));
        expect(await dlp.totalSupply()).eq(parseEther("300000.0"));
        expect(await v.tokenBalances(weth.address)).eq(parseEther("200.0"));
        expect(await v.tokenBalances(dai.address)).eq(0);
        expect(await v.tokenBalances(wbtc.address)).eq(0);
        expect(await v.tokenBalances(tsla.address)).eq(0);


        await sellMLPWithTokenV2(parseEther("99100"), weth, owner);
        expect(await v.zkusdAmounts(weth.address)).eq(parseEther("200900.0"));
        expect(await v.poolAmounts(weth.address)).closeTo(parseEther("133.933333"), MAX_WITHIN);
        expect(await v.reservedAmounts(weth.address)).eq(0);
        expect(await zkusd.totalSupply()).eq(parseEther("200900.0"));
        expect(await dlp.totalSupply()).eq(parseEther("200900.0"));
        expect(await v.tokenBalances(weth.address)).closeTo(parseEther("133.9315333"),MAX_WITHIN);
        expect(await v.tokenBalances(dai.address)).eq(0);
        expect(await v.tokenBalances(wbtc.address)).eq(0);
        expect(await v.tokenBalances(tsla.address)).eq(0);

        expect(await v.inManagerMode()).false;
        expect(await v.isManager(dm.address)).false;
        expect(await v.isManager(pm.address)).false;
        expect(await v.isManager(rr.address)).false;
        expect(await v.whitelistedTokens(weth.address)).true;
        expect(await v.whitelistedTokens(usdc.address)).false;

        let _token = weth;
        let _zkusdAmount = parseEther("99100");
        expect(await v.getRedemptionAmount(_token.address, _zkusdAmount)).closeTo(parseEther("66.066666"),MAX_WITHIN);

        expect(await vu.getSellZkusdFeeBasisPoints(_token.address, _zkusdAmount)).eq(0);
    });
    it("check router => vault.func => swap", async() => {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        await swapToken();

        expect(await weth.balanceOf(receiver.address)).eq(parseEther("1.0"))
        expect(await weth.balanceOf(owner.address)).eq(0);
        expect(await weth.balanceOf(user0.address)).eq(0);
        expect(await v.isSwapEnabled()).true;
        expect(await v.whitelistedTokens(dai.address)).true;
        expect(await v.whitelistedTokens(weth.address)).true;
        expect(await v.poolAmounts(weth.address)).eq(parseEther("199"));
        expect(await v.poolAmounts(dai.address)).eq(parseEther("1500.0"));
        expect(await v.poolAmounts(wbtc.address)).eq(0);
        expect(await v.poolAmounts(tsla.address)).eq(0);

        expect(await dai.balanceOf(receiver.address)).eq(0);
        await swapToken(weth,dai, receiver, parseEther("0.01"));
        expect(await dai.balanceOf(receiver.address)).eq(parseEther("15"));
    });
    it("check router => vault.func => swap v2", async() => {
        expect(await v.lastFundingTimes(weth.address)).eq(0);
        expect(await v.lastFundingTimes(dai.address)).eq(0);

        await buyMLPWithTokenV2(weth, parseEther("100"), owner);
        expect(await v.lastFundingTimes(weth.address)).gt(0);
        expect(await v.lastFundingTimes(dai.address)).eq(0);

        expect(await v.feeReserves(weth.address)).eq(parseEther("0.0"));
        await swapToken();
        expect(await v.feeReserves(weth.address)).eq(parseEther("0.0"));
        expect(await v.lastFundingTimes(weth.address)).gt(0);
        expect(await v.lastFundingTimes(dai.address)).gt(0);

        let _amountOut = parseEther("1");
        expect(await v.adjustForDecimals(_amountOut, dai.address, weth.address)).eq(parseEther("1.0"));
        expect(await vu.getSwapFeeBasisPoints(dai.address, weth.address, parseEther("1500"))).eq(0);
        expect(await v.zkusdAmounts(weth.address)).eq(parseEther("148500.0"));
        expect(await v.zkusdAmounts(dai.address)) .eq(parseEther("1500.0"));

        expect(await v.poolAmounts(weth.address)).eq(parseEther("99.0"));
        expect(await v.poolAmounts(dai.address)).eq(parseEther("1500.0"));
        expect(await v.poolAmounts(wbtc.address)).eq(0);
        expect(await v.poolAmounts(tsla.address)).eq(0);

        expect(await v.bufferAmounts(weth.address)).eq(0);
        expect(await v.bufferAmounts(dai.address)).eq(0);
        expect(await v.bufferAmounts(wbtc.address)).eq(0);
        expect(await v.bufferAmounts(tsla.address)).eq(0);
    });
    it("check router => vault.func => directPoolDeposit", async() => {
        await directDoolDeposit();

        expect(await v.poolAmounts(weth.address)).eq(parseEther("100.0"));
        expect(await v.poolAmounts(dai.address)).eq(0);
        await swapToken();
        expect(await v.poolAmounts(weth.address)).eq(parseEther("99.0"));
        expect(await v.poolAmounts(dai.address)).eq(parseEther("1500.0"));
    });
    it("check router => vault.func => directPoolDeposit v2", async() => {
        await directDoolDeposit();
        expect(await v.poolAmounts(weth.address)).eq(parseEther("100.0"));
        expect(await v.poolAmounts(dai .address)).eq(0);
        expect(await v.poolAmounts(wbtc.address)).eq(0);
        expect(await v.poolAmounts(tsla.address)).eq(0);

        await directDoolDeposit(wbtc, parseUnits("1",8));
        await directDoolDeposit(tsla, parseEther("100"));
        await directDoolDeposit(dai , parseEther("1000"));

        expect(await v.poolAmounts(weth.address)).eq(parseEther("100.0"));
        expect(await v.poolAmounts(dai.address)).eq(parseEther("1000"));
        expect(await v.poolAmounts(wbtc.address)).eq(parseUnits("1",8));
        expect(await v.poolAmounts(tsla.address)).eq(parseEther("100"));
    });
    it("check router.func => swapETHToTokens + swapTokensToETH", async() => {
        await directDoolDeposit(dai , parseEther("100000"));

        let _user = user0;
        let _amountIn = parseEther("1");
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);

        await router.connect(_user).swapETHToTokens([weth.address, dai.address], 0, _user.address,
            updateData, {value: _amountIn.add(fee)});
        expect(await dai.balanceOf(_user.address) ).eq(parseEther("1500"));

        _amountIn = parseEther("1000"); //1000 dai
        await dai.connect(_user).approve(router.address, _amountIn);
        await router.connect(_user).swapTokensToETH([dai.address, weth.address], _amountIn, 0, _user.address,
            updateData, {value: fee});
    });
    it("check router => ", async() => {
        expect(await r.plugins(pm.address)).true;
        await r.removePlugin(pm.address);
        expect(await r.plugins(pm.address)).false;
        await r.addPlugin(pm.address);
        expect(await r.plugins(pm.address)).true;

        let _user = owner;
        let _amount = parseEther("1.0");
        await dai.connect(_user).approve(r.address, _amount);
        await dai.mint(_user.address, _amount);
        await r.addPlugin(_user.address);

        expect(await dai.balanceOf(receiver.address)).eq(0);
        await r.connect(_user).pluginTransfer(dai.address, _user.address, receiver.address, _amount);
        expect(await dai.balanceOf(receiver.address)).eq(parseEther("1.0"));

        // router.func => constructor
        expect(await r.vault()).eq(v.address);
        expect(await r.zkusd()).eq(zkusd.address);
        expect(await r.weth()).eq(weth.address);
        expect(await r.gov()).eq(owner.address);
    });
    it("check rr.func => mintAndStakeZkdlp", async() => {
        await buyMLPWithTokenV2(weth, parseEther("200"), receiver);
        expect(await weth.balanceOf(receiver.address)).eq(0);
        expect(await dlp.balanceOf(receiver.address)).eq(parseEther("300000.0"));
        await sellMLPWithTokenV2(parseEther("99100"), weth, receiver);

        expect(await rr.isInitialized()).true;
        expect(await rr.weth()).eq(weth.address);
        expect(await rr.zkdx()).eq(zkdx.address);
        expect(await rr.zkdlp()).eq(dlp.address);
        expect(await rr.zkdlpManager()).eq(dm.address);
        expect(await weth.balanceOf(receiver.address)).closeTo(parseEther("66.0666"), MAX_WITHIN);
        expect(await dlp.balanceOf(receiver.address)).eq(parseEther("200900.0"));
    });
    it("check vaultFeed.func  => ALL", async() => {
        await buyMLPWithTokenV2(weth, parseEther("200"), receiver);
        expect(await feed.pyth()).not.eq(constants.AddressZero);
        expect(await feed.validTime()).eq(300);
        expect(await feed.feedIds(weth.address)).not.eq(constants.AddressZero);
        expect(await feed.feedIds(dai.address)).not.eq(constants.AddressZero);
        expect(await feed.feedIds(wbtc.address)).not.eq(constants.AddressZero);
        expect(await feed.feedIds(tsla.address)).not.eq(constants.AddressZero);
        expect(await feed.feedIds(usdc.address)).not.eq(constants.AddressZero);
        expect(await feed.gov()).eq(owner.address);

        expect(await feed.getPrice(weth.address,true,true,true)).eq(parseUnits("1500",30));
        expect(await feed.getPrice(weth.address,true,false,true)).eq(parseUnits("1500",30));
        expect(await feed.getPrice(weth.address,false,true,true)).eq(parseUnits("1500",30));
        expect(await feed.getPrice(weth.address,false,false,true)).eq(parseUnits("1500",30));

        expect(await feed.getPrice(dai.address,true,true,true)).eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address,true,false,true)).eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address,false,true,true)).eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address,false,false,true)).eq(parseUnits("1",30));

        expect(await feed.getPrice(wbtc.address,true,true,true)).eq(parseUnits("28000",30));
        expect(await feed.getPrice(wbtc.address,true,false,true)).eq(parseUnits("28000",30));
        expect(await feed.getPrice(wbtc.address,false,true,true)).eq(parseUnits("28000",30));
        expect(await feed.getPrice(wbtc.address,false,false,true)).eq(parseUnits("28000",30));

        expect(await feed.getPrice(tsla.address,true,true,true)).eq(parseUnits("160",30));
        expect(await feed.getPrice(tsla.address,true,false,true)).eq(parseUnits("160",30));
        expect(await feed.getPrice(tsla.address,false,true,true)).eq(parseUnits("160",30));
        expect(await feed.getPrice(tsla.address,false,false,true)).eq(parseUnits("160",30));
        await expect(feed.getPrice(usdc.address,true,true,true)).to.be.reverted;

        expect(await feed.latestTime(weth.address)).gt(0);
        await expect(feed.latestTime(dai.address)).to.be.reverted;
        expect(await feed.latestTime(wbtc.address)).gt(0);
        expect(await feed.latestTime(tsla.address)).gt(0);
        await expect(feed.latestTime(usdc.address)).to.be.reverted;

        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        expect(await feed.getUpdateFee(updateData)).eq(fee);
        expect(await feed.getUpdateFee(updateData)).eq(2);
        // feed.setPyth()
        expect(await feed.pyth()).not.eq(constants.AddressZero);
        await expect(feed.connect(user0).setPyth(constants.AddressZero)).to.be.reverted;
        await feed.setPyth(constants.AddressZero);
        // feed.setValidTime()
        expect(await feed.validTime()).eq(300);
        await expect(feed.connect(user0).setValidTime(0)).to.be.reverted;
        await feed.setValidTime(0);
        expect(await feed.validTime()).eq(0);
        // feed.setGov()


        expect(await feed.gov()).eq(owner.address);
        await expect(feed.connect(user0).setGov(user0.address)).to.be.reverted;
        await feed.setGov(user0.address);
        expect(await feed.gov()).eq(user0.address);
        await feed.connect(user0).setGov(owner.address);
        expect(await feed.gov()).eq(owner.address);
    });
    it("check vaultUtils.func => ALL", async () => {
        await longOperationA();
        expect(await vu.vault()).eq(v.address);
        let az = constants.AddressZero;
        console.log(`${await vu.validateIncreasePosition(az,az,az,0,true)}`);
        console.log(`${await vu.validateDecreasePosition(az,az,az,0,0,true,az)}`);
        let _account = owner.address;
        let _collateralToken = weth.address;
        let _indexToken = weth.address;
        // vu.validateLiquidation
        await updateMarkPrice(['weth'],['1800']);
        let x = await vu.validateLiquidation(_account, _collateralToken, _indexToken, true, false);
        expect(x[0]).eq(0);
        expect(x[1]).eq(parseUnits("70",30));
        // vu.getEntryFundingRate
        expect(await vu.getEntryFundingRate(weth.address, az,true)).eq(0);
        // vu.getPositionFee
        expect(await vu.getPositionFee(az,az,az,true, toUsd(1000))).eq(parseUnits("50.0",30));
        // vu.getFundingFee
        expect(await vu.getFundingFee(az,weth.address,az,true, toUsd(1000),0)).eq(0);
        // vu.getBuyZkusdFeeBasisPoints
        expect(await vu.getBuyZkusdFeeBasisPoints(weth.address,parseEther("1"))).eq(0);
        expect(await vu.getBuyZkusdFeeBasisPoints(dai.address,parseEther("2"))).eq(0);
        expect(await vu.getBuyZkusdFeeBasisPoints(wbtc.address,parseEther("3"))).eq(0);
        expect(await vu.getBuyZkusdFeeBasisPoints(tsla.address,parseEther("4"))).eq(0);
        // vu.getSellZkusdFeeBasisPoints
        expect(await vu.getSellZkusdFeeBasisPoints(weth.address,parseEther("1"))).eq(0);
        expect(await vu.getSellZkusdFeeBasisPoints(dai.address,parseEther("2"))).eq(0);
        expect(await vu.getSellZkusdFeeBasisPoints(wbtc.address,parseEther("3"))).eq(0);
        expect(await vu.getSellZkusdFeeBasisPoints(tsla.address,parseEther("4"))).eq(0);
        // vu.getSwapFeeBasisPoints
        expect(await vu.getSwapFeeBasisPoints(dai.address, weth.address, parseEther("1.0"))).eq(0);
        expect(await vu.getSwapFeeBasisPoints(weth.address, weth.address, parseEther("1.0"))).eq(0);
        expect(await vu.getSwapFeeBasisPoints(weth.address, dai.address, parseEther("1.0"))).eq(0);
        expect(await vu.getSwapFeeBasisPoints(dai.address, dai.address, parseEther("1.0"))).eq(0);
        // vu.getFeeBasisPoints
        expect(await vu.getFeeBasisPoints(weth.address, parseEther("1"), 40,50,true)).eq(40);
        expect(await vu.gov()).eq(owner.address);
    });
    it("check vault.func => ALL", async() => {
        await longOperationA();
        expect(await v.gov()).eq(t.address);
        await t.signalSetGov(v.address,owner.address);
        await forwardTime(86400*7);
        await t.setGov(v.address,owner.address);
        expect(await v.gov()).eq(owner.address);

        expect(await v.isInitialized()).true;
        expect(await v.router()).eq(r.address);
        expect(await v.zkusd()).eq(zkusd.address);
        expect(await v.priceFeed()).eq(feed.address);
        expect(await v.liquidationFeeUsd()).eq(parseUnits("0.0",30));
        expect(await v.fundingRateFactor()).eq(100);
        expect(await v.stableFundingRateFactor()).eq(100);

        // v.setVaultUtils
        expect(await v.vaultUtils()).eq(vu.address);
        await expect(v.connect(user0).setVaultUtils(constants.AddressZero)).to.be.reverted;
        await v.setVaultUtils(constants.AddressZero);
        expect(await v.vaultUtils()).eq(constants.AddressZero);
        await v.setVaultUtils(vu.address);
        expect(await v.vaultUtils()).eq(vu.address);
        // v.setErrorController
        expect(await v.errorController()).eq(vec.address);
        await expect(v.connect(user0).setErrorController(constants.AddressZero)).to.be.reverted;
        await v.setErrorController(constants.AddressZero);
        expect(await v.errorController()).eq(constants.AddressZero);
        await v.setErrorController(vec.address);
        expect(await v.errorController()).eq(vec.address);
        // v.setError
        await expect(v.setError(0,"hello world")).to.be.reverted;
        // v.setInManagerMode
        expect(await v.inManagerMode()).false;
        await expect(v.connect(user0).setInManagerMode(true)).to.be.reverted;
        await v.setInManagerMode(true);
        expect(await v.inManagerMode()).true;
        await v.setInManagerMode(false);
        expect(await v.inManagerMode()).false;
        // v.setManager
        expect(await v.isManager(pm.address)).false;
        await expect(v.connect(user0).setManager(pm.address,true)).to.be.reverted;
        await v.setManager(pm.address,true);
        expect(await v.isManager(pm.address)).true;
        await v.setManager(pm.address,false);
        expect(await v.isManager(pm.address)).false;
        // v.setInPrivateLiquidationMode
        expect(await v.inPrivateLiquidationMode()).true;
        await expect(v.connect(user0).setInPrivateLiquidationMode(false)).to.be.reverted;
        await v.setInPrivateLiquidationMode(false);
        expect(await v.inPrivateLiquidationMode()).false;
        await v.setInPrivateLiquidationMode(true);
        expect(await v.inPrivateLiquidationMode()).true;

        // v.setLiquidator
        expect(await v.isLiquidator(pm.address)).true;
        await expect(v.connect(user0).setLiquidator(pm.address,false)).to.be.reverted;
        await v.setLiquidator(pm.address,false);
        expect(await v.isLiquidator(pm.address)).false;
        await v.setLiquidator(pm.address,true);
        expect(await v.isLiquidator(pm.address)).true;
        expect(await v.isLiquidator(r.address)).false;
        expect(await v.isLiquidator(rr.address)).false;
        expect(await v.isLiquidator(dm.address)).false;
        expect(await v.isLiquidator(v.address)).false;
        expect(await v.isLiquidator(o.address)).false;
        expect(await v.isLiquidator(shortsTracker.address)).false;
        expect(await v.isLiquidator(stakingETH.address)).false;
        expect(await v.isLiquidator(stakingUSDC.address)).false;
        // v.setIsSwapEnabled
        expect(await v.isSwapEnabled()).true;
        await expect(v.connect(user0).setIsSwapEnabled(false)).to.be.reverted;
        await v.setIsSwapEnabled(false);
        expect(await v.isSwapEnabled()).false;
        await v.setIsSwapEnabled(true);
        expect(await v.isSwapEnabled()).true;
        // v.setIsLeverageEnabled
        expect(await v.isLeverageEnabled()).false;
        await expect(v.connect(user0).setIsLeverageEnabled(true)).to.be.reverted;
        await v.setIsLeverageEnabled(true);
        expect(await v.isLeverageEnabled()).true;
        await v.setIsLeverageEnabled(false);
        expect(await v.isLeverageEnabled()).false;
        // v.setMaxGasPrice
        expect(await v.maxGasPrice()).eq(0);
        await expect(v.connect(user0).setMaxGasPrice(1)).to.be.reverted;
        await v.setMaxGasPrice(1);
        expect(await v.maxGasPrice()).eq(1);
        await v.setMaxGasPrice(0);
        expect(await v.maxGasPrice()).eq(0);
        // v.setGov
        expect(await v.gov()).eq(owner.address);
        await expect(v.connect(user0).setGov(user0.address)).to.be.reverted;
        await v.setGov(user0.address);
        expect(await v.gov()).eq(user0.address);
        await v.connect(user0).setGov(owner.address);
        expect(await v.gov()).eq(owner.address);
        // v.setPriceFeed
        expect(await v.priceFeed()).eq(feed.address);
        await expect(v.connect(user0).setPriceFeed(user0.address)).to.be.reverted;
        await v.setPriceFeed(user0.address);
        expect(await v.priceFeed()).eq(user0.address);
        await v.setPriceFeed(feed.address);
        expect(await v.priceFeed()).eq(feed.address);
        // v.setMaxLeverage
        expect(await v.maxLeverage()).eq(1000000);
        await expect(v.connect(user0).setMaxLeverage(100)).to.be.reverted;
        await v.setMaxLeverage(1500000);
        expect(await v.maxLeverage()).eq(1500000);
        await v.setMaxLeverage(1000000);
        expect(await v.maxLeverage()).eq(1000000);
        // v.setBufferAmount
        expect(await v.bufferAmounts(weth.address)).eq(0);
        await expect(v.connect(user0).setBufferAmount(weth.address,1)).to.be.reverted;
        await v.setBufferAmount(weth.address,1);
        expect(await v.bufferAmounts(weth.address)).eq(1);
        await v.setBufferAmount(weth.address,0);
        expect(await v.bufferAmounts(weth.address)).eq(0);

        // v.setMaxGlobalShortSize
        expect(await v.maxGlobalShortSizes(weth.address)).eq(0);
        await expect(v.connect(user0).setMaxGlobalShortSize(weth.address,1)).to.be.reverted;
        await v.setMaxGlobalShortSize(weth.address,1);
        expect(await v.maxGlobalShortSizes(weth.address)).eq(1);
        await v.setMaxGlobalShortSize(weth.address,0);
        expect(await v.maxGlobalShortSizes(weth.address)).eq(0);

        // v.setFees
        await v.setFees(
            100, // uint256 _taxBasisPoints,
            100, // uint256 _stableTaxBasisPoints,
            100, // uint256 _mintBurnFeeBasisPoints,
            100, // uint256 _swapFeeBasisPoints,
            100, // uint256 _stableSwapFeeBasisPoints,
            100, // uint256 _marginFeeBasisPoints,
            parseUnits("10", 30), // uint256 _liquidationFeeUsd,
            100, // uint256 _minProfitTime,
            true // bool _hasDynamicFees
        );
        expect(await v.taxBasisPoints()).to.be.eq(100);
        expect(await v.stableTaxBasisPoints()).to.be.eq(100);
        expect(await v.mintBurnFeeBasisPoints()).to.be.eq(100);
        expect(await v.swapFeeBasisPoints()).to.be.eq(100);
        expect(await v.stableSwapFeeBasisPoints()).to.be.eq(100);
        expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("10", 30));
        expect(await v.minProfitTime()).to.be.eq(100);
        expect(await v.hasDynamicFees()).to.be.eq(true);
        // v.setFundingRate
        expect(await v.fundingInterval()).to.be.eq(3600);
        expect(await v.fundingRateFactor()).to.be.eq(100);
        expect(await v.stableFundingRateFactor()).to.be.eq(100);
        await expect(v.connect(user0).setFundingRate(1, 1, 1)).to.be.reverted;
        await v.setFundingRate(1, 1, 1);
        expect(await v.fundingInterval()).to.be.eq(1);
        expect(await v.fundingRateFactor()).to.be.eq(1);
        expect(await v.stableFundingRateFactor()).to.be.eq(1);
        await v.setFundingRate(3600, 100, 100);
        expect(await v.fundingInterval()).to.be.eq(3600);
        expect(await v.fundingRateFactor()).to.be.eq(100);
        expect(await v.stableFundingRateFactor()).to.be.eq(100);

        // v.setTokenConfig
        await expect(v.connect(user0).setTokenConfig(weth.address, 1, 1, 1, 1, true,true,true)).to.be.reverted;
        await v.setTokenConfig(weth.address, 0, 0, 0, 0, false,true,true);
        expect(await v.whitelistedTokens(weth.address)).true;
        expect(await v.tokenDecimals(weth.address)).eq(0);
        expect(await v.tokenWeights(weth.address)).eq(0);
        expect(await v.minProfitBasisPoints(weth.address)).eq(0);
        expect(await v.maxZkusdAmounts(weth.address)).eq(0);
        expect(await v.stableTokens(weth.address)).false;
        expect(await v.shortableTokens(weth.address)).true;
        expect(await v.equityTokens(weth.address)).true;
        expect(await v.totalTokenWeights()).eq(40000);
        // v.setMinProfitTime
        expect(await v.minProfitTime()).eq(100);
        await expect(v.connect(user0).setMinProfitTime(1)).to.be.reverted;
        await v.setMinProfitTime(1);
        expect(await v.minProfitTime()).eq(1);
        await v.setMinProfitTime(100);
        // v.setZkusdAmount
        await expect(v.connect(user0).setZkusdAmount(weth.address, 1)).to.be.reverted;
        await v.setZkusdAmount(weth.address, 1);
        expect(await v.zkusdAmounts(weth.address)).eq(1);
        await v.setZkusdAmount(weth.address, 0);
        expect(await v.zkusdAmounts(weth.address)).eq(0);
        // v.setAllowStableEquity
        expect(await v.allowStaleEquityPrice()).true;
        await expect(v.connect(user0).setAllowStableEquity(false)).to.be.reverted;
        await v.setAllowStableEquity(false);
        expect(await v.allowStaleEquityPrice()).false;
        await v.setAllowStableEquity(true);
        expect(await v.allowStaleEquityPrice()).true;
    });
    it("check vault.func => ALL => v2", async() => {
        await longOperationA();
        expect(await v.gov()).eq(t.address);
        await t.signalSetGov(v.address,owner.address);
        await forwardTime(86400*7);
        await t.setGov(v.address,owner.address);
        expect(await v.gov()).eq(owner.address);

        // v.getNextFundingRate
        // expect(await v.getNextFundingRate(weth.address)).eq(786);
        expect(await v.getNextFundingRate(wbtc.address)).eq(0);
        expect(await v.getNextFundingRate(tsla.address)).eq(0);
        expect(await v.getNextFundingRate(dai.address)).eq(0);
        // v.getEntryFundingRate
        expect(await v.getEntryFundingRate(weth.address, weth.address,true)).eq(0);
        expect(await v.getEntryFundingRate(weth.address, weth.address,false)).eq(0);
        // v.getTargetZkusdAmount
        expect(await v.getTargetZkusdAmount(weth.address)).eq(parseEther("6000"));
        // v.getRedemptionAmount
        await updateMarkPrice(['weth']);
        expect(await v.getRedemptionAmount(weth.address, parseEther("1"))).gt(0);
        // v.getPositionKey
        // expect(await v.getPositionKey(owner.address, weth.address, weth.address, true)).eq(
        //     '0x1142692f2d2f091b2c4960d9abcc01fcd82bfa3d5196308f4a7795e4dc8d5ae1');
        // v.getPosition
        let x = await v.getPosition(owner.address, weth.address, weth.address, true);
        // v.getPositionDelta
        x = await v.getPositionDelta(owner.address, weth.address, weth.address, true);
        expect(x[0]).eq(false);
        expect(x[1]).eq(0);
        await updateMarkPrice(['weth'], ['1888']);
        x = await v.getPositionDelta(owner.address, weth.address, weth.address, true);
        expect(x[0]).true;
        expect(x[1]).gt(parseUnits("362",30));
        expect(x[1]).lt(parseUnits("363",30));
        // v.getFundingFee + getMaxPrice + getMinPrice
        expect(await v.getFundingFee(owner.address, weth.address, weth.address, true, toUsd(1000), 0)).eq(0);
        expect(await v.getMaxPrice(weth.address)).eq(parseUnits("1888",30));
        expect(await v.getMinPrice(weth.address)).eq(parseUnits("1888",30));

        // v.getDelta
        x = await v.getDelta(weth.address, toUsd(123), toUsd(2300), true, 0);
        expect(await x[0]).eq(false);
        expect(await x[1]).gt(parseUnits("22",30));
        expect(await x[1]).lt(parseUnits("23",30));
        // v.usdToTokenMax + v.usdToTokenMin
        expect(await v.usdToTokenMax(weth.address, toUsd(1888))).eq(parseEther("1"));
        expect(await v.usdToTokenMin(weth.address, toUsd(1888))).eq(parseEther("1"));
        await updateMarkPrice(['wbtc'], ['28000']);
        expect(await v.usdToTokenMax(wbtc.address, toUsd(28000))).eq(parseUnits("1",8));
        expect(await v.usdToTokenMin(wbtc.address, toUsd(28000))).eq(parseUnits("1",8));
        // v.tokenToUsdMin
        expect(await v.tokenToUsdMin(weth.address, parseEther("1"))).eq(parseUnits("1888.0",30));
        // v.usdToToken
        expect(await v.usdToToken(weth.address, toUsd(1888), toUsd(1888))).eq(parseEther("1"));
        expect(await v.usdToToken(wbtc.address, toUsd(28000),toUsd(28000))).eq(parseUnits("1",8));
        // v.adjustForDecimals
        expect(await v.adjustForDecimals(parseEther("1"), zkusd.address, weth.address)).eq(parseEther("1"));
        // v.getPositionFee
        expect(await v.getPositionFee(owner.address, weth.address, weth.address, true, toUsd(1000))).eq(parseUnits("50",30));
        // v.allWhitelistedTokensLength
        expect(await v.allWhitelistedTokensLength()).eq(5);
        // v.addRouter
        await v.addRouter(r.address);
        await v.removeRouter(r.address);
    });
    it("check vault.func => all => v3", async() => {
        await longOperationA();
        await t.signalSetGov(v.address,owner.address);
        await forwardTime(86400*7);
        await t.setGov(v.address,owner.address);
        // v.initialize
        expect(await v.isInitialized()).true;
        expect(await v.router()).eq(r.address);
        expect(await v.zkusd()).eq(zkusd.address);
        expect(await v.priceFeed()).eq(feed.address);
        expect(await v.liquidationFeeUsd()).eq(parseUnits("0",30));
        expect(await v.fundingRateFactor()).eq(100);
        expect(await v.stableFundingRateFactor()).eq(100);
        // v.clearTokenConfig
        expect(await v.whitelistedTokenCount()).eq(5);
        await v.clearTokenConfig(tsla.address);
        expect(await v.whitelistedTokenCount()).eq(4);
        // v.withdrawFees
        expect(await v.feeReserves(weth.address)).gt(0);
        expect(await v.feeReserves(wbtc.address)).eq(0);
        expect(await v.feeReserves(tsla.address)).eq(0);
        expect(await v.feeReserves(dai.address)).eq(0);
        expect(await weth.balanceOf(feeTo.address)).eq(0);
        await v.withdrawFees(weth.address, feeTo.address);
        expect(await weth.balanceOf(feeTo.address)).gt(parseEther("0.00093"));
        expect(await weth.balanceOf(feeTo.address)).lt(parseEther("0.00094"));

        // v.directPoolDeposit
        await weth.mint(owner.address, parseEther("100"));
        await weth.transfer(v.address, parseEther("100"));
        await v.directPoolDeposit(weth.address);
        // v.buyZKUSD
        await weth.mint(owner.address, parseEther("100"));
        await weth.transfer(v.address, parseEther("100"));
        expect(await zkusd.balanceOf(receiver.address)).eq(0);
        expect(await dlp.balanceOf(receiver.address)).eq(0);
        await updateMarkPrice(['weth']);
        await v.buyZKUSD(weth.address, receiver.address);
        expect(await zkusd.balanceOf(receiver.address)).eq(parseEther("150000.0"));
        expect(await dlp.balanceOf(receiver.address)).eq(0);

        // v.sellZKUSD
        await zkusd.connect(receiver).approve (v.address, parseEther("149550.0"));
        await zkusd.connect(receiver).transfer(v.address, parseEther("14955.0"));
        expect(await weth.balanceOf(receiver.address)).eq(0);
        await v.connect(receiver).sellZKUSD(weth.address, receiver.address);
        expect(await weth.balanceOf(receiver.address)).eq(parseEther("9.97"));

        // v.swap
        await dai.mint(receiver.address, parseEther("1500"));
        await dai.connect(receiver).transfer(v.address, parseEther("1500"));
        await updateMarkPrice(['dai']);
        await v.connect(receiver).swap(dai.address, weth.address, receiver.address);
    });
    it("check PM.func => all", async() => {
        // PositionManagerSettings
        // pm.setOrderKeeper
        expect(await pm.isOrderKeeper(o.address)).false;
        await expect(pm.connect(user0).setOrderKeeper(o.address, true)).to.be.reverted;
        await pm.setOrderKeeper(o.address, true);
        expect(await pm.isOrderKeeper(o.address)).true;
        await pm.setOrderKeeper(o.address, false);
        expect(await pm.isOrderKeeper(o.address)).false;
        // pm.setLiquidator
        expect(await pm.isLiquidator(rr.address)).false;
        await expect(pm.connect(user0).setLiquidator(rr.address, true)).to.be.reverted;
        await pm.setLiquidator(rr.address, true);
        expect(await pm.isLiquidator(rr.address)).true;
        await pm.setLiquidator(rr.address, false);
        expect(await pm.isLiquidator(rr.address)).false;
        // pm.setPartner
        expect(await pm.isPartner(user0.address)).false;
        await expect(pm.connect(user0).setPartner(user0.address, true)).to.be.reverted;
        await pm.setPartner(user0.address, true);
        expect(await pm.isPartner(user0.address)).true;
        await pm.setPartner(user0.address, false);
        expect(await pm.isPartner(user0.address)).false;
        expect(await pm.admin()).eq(owner.address);
        // pm.setOpened
        expect(await pm.opened()).true;
        await expect(pm.connect(user0).setOpened(false)).to.be.reverted;
        await pm.setOpened(false);
        expect(await pm.opened()).false;
        await pm.setOpened(true);
        expect(await pm.opened()).true;
        // pm.setShouldValidateIncreaseOrder
        expect(await pm.shouldValidateIncreaseOrder()).true;
        await expect(pm.connect(user0).setShouldValidateIncreaseOrder(false)).to.be.reverted;
        await pm.setShouldValidateIncreaseOrder(false);
        expect(await pm.shouldValidateIncreaseOrder()).false;
        await pm.setShouldValidateIncreaseOrder(true);
        expect(await pm.shouldValidateIncreaseOrder()).true;
        // pm.setOrderBook
        expect(await pm.orderBook()).eq(o.address);
        await expect(pm.connect(user0).setOrderBook(user0.address)).to.be.reverted;
        await pm.setOrderBook(user0.address);
        expect(await pm.orderBook()).eq(user0.address);
        await pm.setOrderBook(o.address);
        expect(await pm.orderBook()).eq(o.address);
        // BasePositionManagerSettings
        // setAdmin
        expect(await pm.admin()).eq(owner.address);
        expect(await pm.gov()).eq(owner.address);
        await expect(pm.connect(user0).setAdmin(user0.address)).to.be.reverted;
        await pm.setAdmin(user0.address);
        expect(await pm.admin()).eq(user0.address);
        await pm.setAdmin(owner.address);
        expect(await pm.admin()).eq(owner.address);
        // pm.setDepositFee
        expect(await pm.depositFee()).eq(50);
        await expect(pm.connect(user0).setDepositFee(100)).to.be.reverted;
        await pm.setDepositFee(100);
        expect(await pm.depositFee()).eq(100);
        await pm.setDepositFee(50);
        expect(await pm.depositFee()).eq(50);
        // pm.setIncreasePositionBufferBps
        expect(await pm.increasePositionBufferBps()).eq(100);
        await expect(pm.connect(user0).setIncreasePositionBufferBps(200)).to.be.reverted;
        await pm.setIncreasePositionBufferBps(200);
        expect(await pm.increasePositionBufferBps()).eq(200);
        await pm.setIncreasePositionBufferBps(100);
        expect(await pm.increasePositionBufferBps()).eq(100);
        // pm.setMaxGlobalSizes
        expect(await pm.maxGlobalLongSizes(weth.address)).eq(0);
        expect(await pm.maxGlobalShortSizes(weth.address)).eq(0);
        await expect(pm.connect(user0).setMaxGlobalSizes([weth.address], [1],[1])).to.be.reverted;
        await pm.setMaxGlobalSizes([weth.address], [1],[1]);
        expect(await pm.maxGlobalLongSizes(weth.address)).eq(1);
        expect(await pm.maxGlobalShortSizes(weth.address)).eq(1);
        await pm.setMaxGlobalSizes([weth.address],[0],[0]);
        expect(await pm.maxGlobalLongSizes(weth.address)).eq(0);
        expect(await pm.maxGlobalShortSizes(weth.address)).eq(0);

        // BasePositionManagerStorage.params
        expect(await pm.BASIS_POINTS_DIVISOR()).eq(10000);
        expect(await pm.depositFee()).eq(50);
        expect(await pm.increasePositionBufferBps()).eq(100);
        expect(await pm.admin()).eq(owner.address);
        expect(await pm.vault()).eq(v.address);
        expect(await pm.shortsTracker()).eq(ss.address);
        expect(await pm.router()).eq(r.address);
        expect(await pm.weth()).eq(weth.address);
        expect(await pm.maxGlobalLongSizes(weth.address)).eq(0);
        expect(await pm.maxGlobalShortSizes(weth.address)).eq(0);
        expect(await pm.feeReserves(weth.address)).eq(0);
    });
    it("check TEST SCENARIO => rr", async() => {
        expect(await rr.isInitialized()).true;
        expect(await rr.weth()).eq(weth.address);
        expect(await rr.zkdx()).eq(zkdx.address);
        expect(await rr.zkdlp()).eq(dlp.address);
        expect(await rr.zkdlpManager()).eq(dm.address);

        let user = receiver;
        await buyMLPWithTokenV2(weth, parseEther("100"), user);
        await buyMLPWithETHV2(parseEther("100"), user);
        await sellMLPWithTokenV2(parseEther("99100"), weth, user);
        await sellMLPWithETHV2(parseEther("99100"), user);
        expect(await dlp.balanceOf(user.address)).eq(parseEther("101800.0"));

        let x = await dm.getAums();
        console.log(`${formatUnits(x[0],30)}, ${formatUnits(x[1],30)}`);
        console.log(`${formatUnits(await dm.getPrice(true),30)}, ${formatUnits(await dm.getPrice(false),30)}`);
        expect(await dm.isHandler(pm.address)).false;
        expect(await dm.isHandler(o.address)).false;
        expect(await dm.isHandler(r.address)).false;
        expect(await dm.isHandler(ss.address)).false;
        expect(await dm.isHandler(v.address)).false;
        expect(await dm.isHandler(dm.address)).false;
        expect(await dm.isHandler(rr.address)).true;
        expect(await dm.isHandler(t.address)).false;
        expect(await dm.isHandler(owner.address)).false;
        expect(await dm.isHandler(user.address)).false;


    });
    it("check TEST SCENARIO => rr v2", async() => {
        let user = receiver;
        await buyMLPWithTokenV2(weth, parseEther("100"), user);
        // await dlp.setMinter(dm.address, false);
        // await zkusd.removeVault(v.address);
        // await buyMLPWithTokenV2(weth, parseEther("100"), user);
        expect(await dm.isHandler(rr.address)).true;
        await dm.setCooldownDuration(86400);
        await forwardTime(86400 * 5);
        await sellMLPWithTokenV2(parseEther("99100"), weth, user);

        expect(await weth.balanceOf(v.address)).gt(parseEther("33.93"));
        expect(await dlp.totalSupply()).eq(parseEther("50900.0"));
        expect(await zkusd.totalSupply()).eq(parseEther("50900.0"));
        expect(await dm.getAumInZkusd(true)).closeTo(parseEther("50900"), MAX_WITHIN);

        await longOperationA();
    });
    it("check TEST Scenario => PM", async() => {
        let user = receiver;
        await buyMLPWithTokenV2(weth, parseEther("100"), user);
        let _amountIn = parseEther("1000");
        let _sizeDelta = 1500;
        let _token = weth;

        await dai.mint(user.address, _amountIn.mul(2));
        await dai.connect(user).approve(router.address, _amountIn.mul(2));

        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            [dai.address, _token.address], // _path
            _token.address, // _indexTokens
            _amountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
            updateData
        ];
        await _token.mint(user.address, _amountIn);
        await _token.connect(user).approve(router.address, _amountIn);
        await pm.connect(user).increasePosition(...params, {value: fee});
    });
    it("check TEST Scenario => PM => IPE", async() => {
        let user = receiver;
        await dai.mint(user.address, parseEther("1000"));
        await dai.connect(user).approve(router.address, parseEther("1000"));
        await OP_BASE_MLP();
        let _amountIn = parseEther("1.0");
        let _sizeDelta = 1500;
        let _token = weth;
        let {updateData, fee} = await getUpdateData(['weth']);
        // IPE => LONG
        let params = [
            [_token.address], // _path
            _token.address, // _indexTokens
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // long = true
            toUsd(1500.000001), // _acceptablePrice
            updateData
        ];
        // await pm.connect(user).increasePositionETH(...params, {value: _amountIn.add(fee)});
        // // IPE => SHORT
        // let params2 = [
        //     [weth.address, dai.address], // _path
        //     _token.address, // _indexTokens
        //     0, // _minOut
        //     toUsd(_sizeDelta), // _sizeDelta
        //     false, // long = true
        //     toUsd(1400.000001), // _acceptablePrice
        //     updateData
        // ];
        // await pm.connect(user).increasePositionETH(...params2, {value: _amountIn.add(fee)});
    });
    it("check TEST Scenario => PM V3", async() => {
        await OP_BASE_MLP();
        let _user = receiver;
        let _amountIn = parseEther("1000");
        let _sizeDelta = 18000;
        let _token = weth;
        let {updateData, fee} = await getUpdateData(['weth']);

        await dai.mint(_user.address, _amountIn.mul(2));
        await dai.connect(_user).approve(router.address, _amountIn.mul(2));
        // IP => LONG
        let params = [
            [dai.address,_token.address], // _path
            _token.address, // _indexTokens
            _amountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // long = true
            toUsd(2000.000001), // _acceptablePrice
            updateData
        ];
        let p1 = await v.getPosition(_user.address, _token.address, _token.address, true);
        expect(p1[0]).eq(0);
        await updateMarkPrice(['weth'],['2000']);
        await pm.connect(_user).increasePosition(...params, {value: fee});

        let p2 = await v.getPosition(_user.address, _token.address, _token.address, true);
        console.log(`${p2}`);
        expect(p2[0]).eq(toUsd(_sizeDelta));
        expect(p2[1]).eq(toUsd(982));
        expect(p2[2]).eq(toUsd(2000));
        expect(p2[4]).eq(parseEther("9.0"))

        await pm.connect(_user).increasePosition(...params, {value: fee});
        let p3 = await v.getPosition(_user.address, _token.address, _token.address, true);
        expect(p3[4]).eq(parseEther("18.0"));
    });
    it("check TEST Scenario => PM V4", async() => {
        await OP_BASE_MLP();
        let _user = receiver;
        let _amountIn = parseEther("1000").mul(2);
        let _sizeDelta = 15000;
        let _token = weth;
        let _long = true;
        let {updateData, fee} = await getUpdateData(['weth']);

        await dai.mint(_user.address, _amountIn.mul(2));
        await dai.connect(_user).approve(router.address, _amountIn.mul(2));

        // IP => LONG
        let params = [
            [dai.address,_token.address], // _path
            _token.address, // _indexTokens
            _amountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            _long, // _long
            toUsd(2000.000001), // _acceptablePrice
            updateData
        ];
        await pm.connect(_user).increasePosition(...params, {value: fee});
        await pm.connect(_user).increasePosition(...params, {value: fee});

        let p = await v.getPosition(_user.address, _token.address, _token.address, _long);
        expect(p[0]).eq(toUsd(_sizeDelta*2)); //size
        expect(p[1]).gt(toUsd(3969)); //collateral
        expect(p[1]).lt(toUsd(3970)); //collateral
        expect(p[2]).eq(toUsd(1500)); //price
        expect(p[4]).eq(parseEther("20.0")); //reserveAmount
    });
    it("check TEST Scenario => PM_LONG V5", async() => {
        await OP_BASE_MLP();
        await PM_IP_TOKEN_LONG(weth, 2000,  20000);
        await PM_IP_TOKEN_LONG(tsla, 600,   6000);
        await PM_IP_TOKEN_LONG(wbtc, 40000, 100000);
        await PM_IP_TOKEN_LONG(weth, 2000,  20000);
        await PM_IP_TOKEN_LONG(weth, 1600,  60000);

        let pWETH = await v.getPosition(receiver.address, weth.address, weth.address, true);
        expect(pWETH[0]).eq(parseUnits("100000",30)); //weth.size
        expect(pWETH[1]).gt(parseUnits("4300",30)); //weth.collateral

        let pTSLA = await v.getPosition(receiver.address, tsla.address, tsla.address, true);
        expect(pTSLA[0]).eq(parseUnits("6000",30)); //tsla.size
        expect(pTSLA[1]).eq(parseUnits("2994",30)); //tsla.collateral


        let pWBTC = await v.getPosition(receiver.address, wbtc.address, wbtc.address, true);
        expect(pWBTC[0]).eq(parseUnits("100000",30)); //wbtc.size
        expect(pWBTC[1]).eq(parseUnits("2899.9998",30)); //wbtc.collateral
    });
    it("check TEST Scenario => PM_SHORT V5", async() => {
        await OP_BASE_MLP();
        await buyMLPWithTokenV2(dai, parseEther("12345678"), user2);

        await PM_IP_TOKEN_SHORT(weth, 1400);
        await PM_IP_TOKEN_SHORT(tsla, 100);
        await PM_IP_TOKEN_SHORT(wbtc, 20000);
        await PM_IP_TOKEN_SHORT(weth, 1400, 30000);
        await PM_IP_TOKEN_SHORT(weth, 1400, 50000);

        let pWETH = await v.getPosition(receiver.address, dai.address, weth.address, false);
        expect(pWETH[0]).eq(parseUnits("100000",30)); //weth.size
        expect(pWETH[1]).eq(parseUnits("2900",30)); //weth.collateral

        let pTSLA = await v.getPosition(receiver.address, dai.address, tsla.address, false);
        expect(pTSLA[0]).eq(parseUnits("20000",30)); //tsla.size
        expect(pTSLA[1]).eq(parseUnits("980",30)); //tsla.collateral

        let pWBTC = await v.getPosition(receiver.address, dai.address, wbtc.address, false);
        expect(pWBTC[0]).eq(parseUnits("20000",30)); //wbtc.size
        expect(pWBTC[1]).eq(parseUnits("980",30)); //wbtc.collateral
        expect(pWBTC[4]).eq(parseEther("20000")); //wbtc.reservedAmounts = 20_000 DAI
    });
    it("check scenario => PM_DP_LONG", async() => {
        await OP_DEFAULT();
        let pWETH = await v.getPosition(receiver.address, weth.address, weth.address, true);
        let pWBTC = await v.getPosition(receiver.address, wbtc.address, wbtc.address, true);
        let pTSLA = await v.getPosition(receiver.address, tsla.address, tsla.address, true);
        console.log(`size: ${formatUnits(pWETH[0], 30)}, collateral: ${formatUnits(pWETH[1],30)}`);
        console.log(`size: ${formatUnits(pWBTC[0], 30)}, collateral: ${formatUnits(pWBTC[1],30)}`);
        console.log(`size: ${formatUnits(pTSLA[0], 30)}, collateral: ${formatUnits(pTSLA[1],30)}`);


        await PM_DP_TOKEN_LONG(weth, 1000,1000,1000);
        await PM_DP_TOKEN_LONG(wbtc, 20000,1000,1000);
        await PM_DP_TOKEN_LONG(tsla, 100, 10,10); //tsla.price = 160, 1tsl = 160$

        pWETH = await v.getPosition(receiver.address, weth.address, weth.address, true);
        pWBTC = await v.getPosition(receiver.address, wbtc.address, wbtc.address, true);
        pTSLA = await v.getPosition(receiver.address, tsla.address, tsla.address, true);
        console.log(`size: ${formatUnits(pWETH[0], 30)}, collateral: ${formatUnits(pWETH[1],30)}`);
        console.log(`size: ${formatUnits(pWBTC[0], 30)}, collateral: ${formatUnits(pWBTC[1],30)}`);
        console.log(`size: ${formatUnits(pTSLA[0], 30)}, collateral: ${formatUnits(pTSLA[1],30)}`);
    });
    it("check scenario => PM_DP_LONG + PM_DP_SHORT", async() => {
        await OP_DEFAULT();
        await OP_DEFAULT2();

        let pWETH = await v.getPosition(receiver.address, dai.address, weth.address, false);
        let pWBTC = await v.getPosition(receiver.address, dai.address, wbtc.address, false);
        let pTSLA = await v.getPosition(receiver.address, dai.address, tsla.address, false);
        expect(pWETH[0]).eq(parseUnits("99000",30)); //weth.size
        expect(pWETH[1]).eq(parseUnits("1900",30)); //weth.collateral
        expect(pWBTC[0]).eq(parseUnits("19900",30)); //wbtc.size
        expect(pWBTC[1]).eq(parseUnits("880",30)); //wbtc.collateral
        expect(pTSLA[0]).eq(parseUnits("19900",30)); //tsla.size
        expect(pTSLA[1]).eq(parseUnits("880",30)); //tsla.collateral
    });
});

describe("check PM TEST SCENARIO => P2", async () => {
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
        t                   : any, //timelock
        vault               : any,
        v                   : any, //vault
        feed                : any, //vaultFeed
        vaultUtils          : any,
        vu                  : any, //vaultUtils
        vec                 : any, //vaultErrorController
        pythContract        : any,

        pm                  : any, //positionManager
        dlpManager          : any,
        dm                  : any, //dlpManager
        router              : any,
        r                   : any, //router
        shortsTracker       : any,
        ss                  : any, //shortsTracker
        o                   : any, //orderBook
        rewardRouter        : any,
        rr                  : any, //rewardRouter
        reader              : any,
        obr                 : any, //orderBookReader
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
        r                   = router;
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

        await feed.setValidTime(300);
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
            [_token.address], // path
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

    async function swapToken(_tokenIn: any = dai, _tokenOut: any = weth, _receiver: any = receiver, _amountIn: any = parseEther("1500")) {
        let {updateData, fee} = await getUpdateData(['weth', 'wbtc', 'tsla', 'dai']);
        await _tokenIn.mint(_receiver.address, _amountIn);
        await _tokenIn.connect(_receiver).approve(router.address, _amountIn);
        await router.connect(_receiver).swap(
            [_tokenIn.address, _tokenOut.address], // path
            _amountIn, // inAmount
            0, // minOut
            _receiver.address, updateData, {value: fee});
    }
    async function directDoolDeposit(_token: any = weth, _amountIn: any = parseEther("100"), _user: any = receiver) {
        await _token.mint(_user.address, _amountIn);
        await _token.connect(_user).approve(router.address, _amountIn);
        await router.connect(_user).directPoolDeposit(_token.address, _amountIn);
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

    async function pm_ip_token_long(_token: any = weth, _acceptablePrice: any = 2000.000001, _sizeDelta: any = 15000, _amountIn : any = parseEther("3000"), _user: any = receiver,) {
        await dai.mint(_user.address, _amountIn);
        await dai.connect(_user).approve(router.address, _amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [dai.address, _token.address], // _path
            _token.address, // _indexTokens
            _amountIn, //_amountIn
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _long
            toUsd(_acceptablePrice), // _acceptablePrice
            updateData
        ];
        await pm.connect(_user).increasePosition(...params, {value: fee});
    }
    async function pm_ip_token_short(_token: any = weth, _acceptablePrice: any = 1400.000001, _sizeDelta: any = 20000, _amountIn : any = parseEther("1000"), _user: any = receiver,) {
        await dai.mint(_user.address, _amountIn);
        await dai.connect(_user).approve(router.address, _amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [dai.address], // _path
            _token.address, // _indexTokens
            _amountIn, //_amountIn
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            false, // _long
            toUsd(_acceptablePrice), // _acceptablePrice
            updateData
        ];
        await pm.connect(_user).increasePosition(...params, {value: fee});
    }
    async function pm_dp_token_long(_token: any = weth, _acceptablePrice: any = 1400, _collateralDelta: any = 1000, _sizeDelta: any = 1000, _user: any = receiver) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [_token.address,dai.address], // _path
            _token.address, // _indexTokens
            toUsd(_collateralDelta), // _collateralDelta
            toUsd(_sizeDelta), // _sizeDelta
            true, // _long
            _user.address, // _receiver
            toUsd(_acceptablePrice), // _acceptablePrice
            0, //_minOut
            false, // _withdrawETH
            updateData
        ];
        await pm.connect(_user).decreasePosition(...params, {value: fee});
    }
    async function pm_dp_token_short(_token : any = weth, _acceptablePrice : number = 1600, _collateralDelta : number = 1000, _sizeDelta : number = 1000, _user : any = receiver) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [dai.address], // _path
            _token.address, // _indexTokens
            toUsd(_collateralDelta), // _collateralDelta
            toUsd(_sizeDelta), // _sizeDelta
            false, // _long = false
            _user.address, // _receiver
            toUsd(_acceptablePrice), // _acceptablePrice
            0, //_minOut
            false, // _withdrawETH
            updateData
        ];
        await pm.connect(_user).decreasePosition(...params, {value: fee});
    }
    async function OP_IP() {
        await OP_BASE_MLP();
        await buyMLPWithTokenV2(dai, parseEther("12345678"), user2);

        await pm_ip_token_short(weth, 1400);
        await pm_ip_token_short(tsla, 100);
        await pm_ip_token_short(wbtc, 20000);
        await pm_ip_token_short(weth, 1400, 30000);
        await pm_ip_token_short(weth, 1400, 50000);
        //
        await pm_ip_token_long(weth, 2000, 20000);
        await pm_ip_token_long(tsla, 600, 6000);
        await pm_ip_token_long(wbtc, 40000, 100000);
        await pm_ip_token_long(weth, 2000, 20000);
        await pm_ip_token_long(weth, 1600, 60000);
    }
    async function OP_DP() {
        await pm_dp_token_long(weth, 1000, 1000, 1000);
        await pm_dp_token_long(wbtc, 20000, 1000, 1000);
        await pm_dp_token_long(tsla, 100, 10, 10);

        await pm_dp_token_short();
        await pm_dp_token_short(wbtc, 30000, 100, 100);
        await pm_dp_token_short(tsla, 300, 100, 100);
    }

    async function createDO_LONG_ABOVE(_token: any, _user: any, _triggerPrice: any, _sizeDelta: any, _collateral: any = 100) {
        await o.connect(_user).createDecreaseOrder(
            _token.address, // indexToken
            toUsd(_sizeDelta), // sizeDelta
            _token.address, // collateralToken
            toUsd(_collateral), // _collateralDelta
            true, // isLong
            toUsd(_triggerPrice), // triggerPrice
            true, // triggerAboveThreshold
            {value: parseEther("0.005")}
        );
    };
    async function createDO_LONG_BELOW(_token: any, _user: any, _triggerPrice: any, _sizeDelta: any = 100, _collateral: any = 100) {
        await o.connect(_user).createDecreaseOrder(
            _token.address, // indexToken
            toUsd(_sizeDelta), // sizeDelta
            _token.address, // collateralToken
            toUsd(_collateral), // _collateralDelta
            true, // isLong
            toUsd(_triggerPrice), // triggerPrice
            false, // triggerAboveThreshold
            {value: parseEther("0.005")}
        );
    };
    async function createDO_SHORT_ABOVE(_token: any, _user: any, _triggerPrice: any, _sizeDelta: any = 100, _collateral: any = 100) {
        await o.connect(_user).createDecreaseOrder(
            _token.address, // indexToken
            toUsd(_sizeDelta), // sizeDelta
            dai.address, // collateralToken
            toUsd(_collateral), // _collateralDelta
            false, // isLong
            toUsd(_triggerPrice), // triggerPrice
            true, // triggerAboveThreshold
            {value: parseEther("0.005")}
        );
    };
    async function createDO_SHORT_BELOW(_token: any, _user: any, _triggerPrice: any, _sizeDelta: any = 100, _collateral: any = 100) {
        await o.connect(_user).createDecreaseOrder(
            _token.address, // indexToken
            toUsd(_sizeDelta), // sizeDelta
            dai.address, // collateralToken
            toUsd(_collateral), // _collateralDelta
            false, // isLong
            toUsd(_triggerPrice), // triggerPrice
            false, // triggerAboveThreshold
            {value: parseEther("0.005")}
        );
    };

    async function O_DO_LONG_1() {
        async function executeDO_WETH(_index: any = 0, _user: any = receiver) {
            await createDO_LONG_ABOVE(weth, _user, 1400, 100, 100);
            await updateMarkPrice(['weth'], ['1401']);
            await pm.setOrderKeeper(_user.address, true);
            let {updateData, fee} = await getUpdateData(['weth']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }
        async function executeDO_TSLA(_index: any = 0, _user: any = receiver) {
            await createDO_LONG_ABOVE(tsla, _user, 130, 10, 10);
            await updateMarkPrice(['tsla'], ['131']);
            await pm.setOrderKeeper(_user.address, true);
            let {updateData, fee} = await getUpdateData(['weth', 'wbtc', 'tsla']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }
        async function executeDO_WBTC(_index: any = 0, _user: any = receiver) {
            await createDO_LONG_ABOVE(wbtc, _user, 27000, 100, 100);
            await updateMarkPrice(['wbtc'], ['27001']);
            await pm.setOrderKeeper(_user.address, true);
            let {updateData, fee} = await getUpdateData(['weth', 'wbtc', 'tsla']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }

        await executeDO_WETH(0);
        await executeDO_WETH(1);
        await executeDO_WETH(2);
        await executeDO_TSLA(3);
        await executeDO_WBTC(4);
    }
    async function O_DO_LONG_2() {
        async function executeDO_WETH(_index: any = 0, _user: any = receiver) {
            await createDO_LONG_BELOW(weth, _user, 1600);
            await updateMarkPrice(['weth'], ['1599']);
            await pm.setOrderKeeper(_user.address, true);
            let {updateData, fee} = await getUpdateData(['weth']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }
        async function executeDO_WBTC(_index: any = 0, _user: any = receiver) {
            await createDO_LONG_BELOW(wbtc, _user, 29000);
            await updateMarkPrice(['wbtc'], ['28999']);
            await pm.setOrderKeeper(_user.address, true);
            let {updateData, fee} = await getUpdateData(['weth','wbtc','tsla']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }
        async function executeDO_TSLA(_index: any = 0, _user: any = receiver) {
            await createDO_LONG_BELOW(tsla, _user, 200,10,10);
            await updateMarkPrice(['tsla'], ['199']);
            await pm.setOrderKeeper(_user.address, true);
            let {updateData, fee} = await getUpdateData(['weth','wbtc','tsla']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }

        await executeDO_WETH(5);
        await executeDO_WBTC(6);
        await executeDO_TSLA(7);
    }
    async function O_DO_SHORT_1() {
        async function executeDO_WETH(_index: any = 0, _user: any = receiver) {
            await createDO_SHORT_ABOVE(weth, _user, 1400);
            await pm.setOrderKeeper(_user.address, true);
            await updateMarkPrice(['weth'], ['1399']);
            let {updateData, fee} = await getUpdateData(['weth','tsla','wbtc']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }
        async function executeDO_TSLA(_index: any = 0, _user: any = receiver) {
            await createDO_SHORT_ABOVE(tsla, _user, 100);
            await pm.setOrderKeeper(_user.address, true);
            await updateMarkPrice(['tsla'], ['99']);
            let {updateData, fee} = await getUpdateData(['weth','tsla','wbtc']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }
        async function executeDO_WETH_2(_index: any = 0, _user: any = receiver) {
            await createDO_SHORT_BELOW(weth, _user, 1600);
            await pm.setOrderKeeper(_user.address, true);
            await updateMarkPrice(['weth'], ['1601']);
            let {updateData, fee} = await getUpdateData(['weth','tsla','wbtc']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }
        async function executeDO_TSLA_2(_index: any = 0, _user: any = receiver) {
            await createDO_SHORT_BELOW(tsla, _user, 200);
            await pm.setOrderKeeper(_user.address, true);
            await updateMarkPrice(['tsla'], ['201']);
            let {updateData, fee} = await getUpdateData(['weth','tsla','wbtc']);
            await pm.connect(_user).executeDecreaseOrder(_user.address, _index, _user.address, updateData, {value: fee});
        }

        await executeDO_WETH(0);
        await executeDO_TSLA(1);
        await executeDO_WETH_2(2);
        await executeDO_TSLA_2(3);
    }

    it("check scenario => OP_IP + OP_DP => liquidatePosition", async() => {
        await OP_IP();
        await OP_DP();

        let _account = receiver;
        let _collateral = weth;
        let _indexToken = weth;
        let _isLong = true;
        await pm.setLiquidator(_account.address, true);

        await forwardTime(86400);
        await updateMarkPrice(['weth'],['1000']);

        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            _account.address,
            _collateral.address,
            _indexToken.address,
            _isLong,
            _account.address,
            updateData
        ];
        // await pm.connect(_account).liquidatePosition(...params, {value: fee});
    });
    // it("check scenario => OP_IP + OP_DP ", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //
    //     let _amountIn = parseUnits("1", 18);
    //     let _token = weth;
    //     let _user = user0;
    //     let _executionFee = parseEther("0.005");
    //     let _sizeDelta = 100000; //100_000
    //     let _triggerPrice = 2000;
    //     await _token.mint(_user.address, _amountIn);
    //     await _token.connect(_user).approve(r.address, _amountIn);
    //
    //     await o.connect(_user).createIncreaseOrder(
    //         _token.address, // path
    //         _amountIn, // amountIn
    //         _token.address, // indexToken
    //         toUsd(_sizeDelta), // sizeDelta
    //         _token.address, // collateralToken
    //         true, // isLong
    //         toUsd(_triggerPrice), // triggerPrice
    //         false, // triggerAboveThreshold
    //         _executionFee, // executionFee
    //         false, // shouldWrap
    //         {value: _executionFee}
    //     );
    //     expect(await o.increaseOrdersIndex(_user.address)).to.equal(1);
    //     let order = await o.increaseOrders(_user.address, 0);
    //
    //     console.log(`${order['account']}`);
    //     console.log(`${order['purchaseToken']}`);
    //     console.log(`${formatEther(order['purchaseTokenAmount'])}`);
    //     console.log(`${order['collateralToken']}`);
    //     console.log(`${order['indexToken']}`);
    //     console.log(`${formatUnits(order['sizeDelta'],30)}`);
    //     console.log(`${order['isLong']}`);
    //     console.log(`${formatUnits(order['triggerPrice'],30)}`);
    //     console.log(`${order['triggerAboveThreshold']}`);
    //     console.log(`${formatEther(order['executionFee'])}`);
    //
    //     splitter();
    //
    //     console.log(`${_user.address}`);
    //     console.log(`${_token.address}`);
    // });
    // it("check OP_IP + OP_DP => TRIGGER", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //
    //
    //     let _user = receiver;
    //     async function createDO(_token: any, _user: any, _triggerPrice: any, _sizeDelta: any, _collateral: any = 100) {
    //         let {updateData, fee} = await getUpdateData(['wbtc', 'dai', 'weth', 'tsla']);
    //         await o.connect(_user).createDecreaseOrder(
    //             _token.address, // indexToken
    //             toUsd(_sizeDelta), // sizeDelta
    //             _token.address, // collateralToken
    //             toUsd(_collateral), // _collateralDelta
    //             true, // isLong
    //             toUsd(_triggerPrice), // triggerPrice
    //             true, // triggerAboveThreshold
    //             {value: parseEther("0.005")}
    //         );
    //     };
    //
    //     let p = await v.getPosition(_user.address, weth.address, weth.address, true);
    //     console.log(`size: ${formatUnits(p[0],30)},
    //             collateral: ${formatUnits(p[1],30)},
    //             averagePrice: ${formatUnits(p[2],30)}`);
    //     console.log(`${formatEther(await weth.balanceOf(_user.address))}`);
    //
    //     await createDO(weth, _user, 1400, 100);
    //     await updateMarkPrice(['weth'], ['1401']);
    //
    //     await pm.setOrderKeeper(_user.address, true);
    //     expect(await pm.isOrderKeeper(_user.address)).true;
    //     let {updateData, fee} = await getUpdateData(['wbtc', 'dai', 'weth', 'tsla']);
    //     await pm.connect(_user).executeDecreaseOrder(_user.address, 0, _user.address, updateData, {value: fee});
    //
    //     p = await v.getPosition(_user.address, weth.address, weth.address, true);
    //     console.log(`size: ${formatUnits(p[0],30)},
    //             collateral: ${formatUnits(p[1],30)},
    //             averagePrice: ${formatUnits(p[2],30)}`);
    //
    //     console.log(`${formatEther(await weth.balanceOf(_user.address))}`);
    // });
    // it("check OP_IP + OP_DP => TRIGGER", async() => {
    //     let p,_token;
    //     let _user = receiver;
    //
    //     await OP_IP();
    //     await OP_DP();
    //     await O_DO_LONG_1();
    //
    //     _token = wbtc;
    //     p = await v.getPosition(_user.address, _token.address, _token.address, true);
    //     expect(p[0]).eq(parseUnits('98900', 30));
    //     expect(p[1]).eq(parseUnits('1799.9998', 30));
    //
    //     _token = weth;
    //     p = await v.getPosition(_user.address, _token.address, _token.address, true);
    //     expect(p[0]).eq(parseUnits('98700.0', 30));
    //
    //     _token = tsla;
    //     p = await v.getPosition(_user.address, _token.address, _token.address, true);
    //     expect(p[0]).eq(parseUnits('5980.0', 30));
    //     expect(p[1]).eq(parseUnits('2974.0', 30));
    // });
    // it("check OP_IP + OP_DP => TRIGGER => v2", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //     await O_DO_LONG_1();
    //     await O_DO_LONG_2();
    // });
    // it("check OP_IP + OP_DP => TRIGGER => v3", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //     await O_DO_SHORT_1();
    //
    //
    //     let _user = receiver;
    //     let _token = weth;
    //     let p = await v.getPosition(_user.address, dai.address, _token.address, false);
    //     // console.log(`${formatUnits(p[0],30)}`);
    //     // console.log(`${formatUnits(p[1],30)}`);
    //     expect(p[0]).eq(parseUnits("98800",30));
    //     expect(p[1]).eq(parseUnits("1700",30));
    // });
    // it("check OP_IP + OP_DP => TRIGGER => v4", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //
    //     let _user = receiver;
    //     let _token = weth;
    //     await createDO_SHORT_ABOVE(_token, _user, 1400);
    //     let x = await o.getDecreaseOrder(_user.address, 0);
    //
    //     expect(x[0]).eq(dai.address); // collateralToken
    //     expect(x[2]).eq(weth.address); // indexToken
    //     expect(x[3]).eq(toUsd(100)); // sizeDelta
    //     expect(x[4]).false; // isLong = true
    //     expect(await v.getMinPrice(_token.address)).eq(toUsd(1500));
    //     expect(await v.getMaxPrice(_token.address)).eq(toUsd(1500));
    //
    //     let x1 = await o.decreaseOrders(_user.address, 0);
    //     expect(x1[0]).eq(_user.address);
    //     expect(x1[1]).eq(dai.address);
    //     expect(x1[3]).eq(weth.address);
    //     expect(x1[4]).eq(toUsd(100));
    //     expect(x1[5]).false;
    //
    //     _token = tsla;
    //     await createDO_SHORT_ABOVE(_token, _user, 100);
    //     x1 = await o.decreaseOrders(_user.address, 1);
    //     expect(x1[1]).eq(dai.address);
    //     expect(x1[3]).eq(_token.address);
    // });
    // it("check OP_IP + OP_DP => TRIGGER => createDO_SHORT_ABOVE + createDO_SHORT_BELOW", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //
    //     await createDO_SHORT_ABOVE(weth, receiver, 1400, 1700, 1800);
    //     expect(await (await o.decreaseOrders(receiver.address, 0))[1]).eq(dai.address);
    //     expect(await (await o.decreaseOrders(receiver.address, 0))[3]).eq(weth.address);
    //
    //     await createDO_SHORT_ABOVE(tsla, receiver, 100,200,300);
    //     let x = await o.decreaseOrders(receiver.address, 1);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(dai.address);
    //     expect(x[2]).eq(toUsd(300));
    //     expect(x[3]).eq(tsla.address);
    //     expect(x[4]).eq(toUsd(200));
    //     expect(x[5]).false;
    //     expect(x[6]).eq(toUsd(100));
    //     expect(x[7]).true; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    //
    //     await createDO_SHORT_BELOW(weth, receiver, 1600, 1700, 1800);
    //     x = await o.decreaseOrders(receiver.address, 2);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(dai.address);
    //     expect(x[2]).eq(toUsd(1800));
    //     expect(x[3]).eq(weth.address);
    //     expect(x[4]).eq(toUsd(1700));
    //     expect(x[5]).false; //isLong
    //     expect(x[6]).eq(toUsd(1600));
    //     expect(x[7]).false; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    //
    //     await createDO_SHORT_BELOW(tsla, receiver, 200, 300, 400);
    //     x = await o.decreaseOrders(receiver.address, 3);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(dai.address);
    //     expect(x[2]).eq(toUsd(400));
    //     expect(x[3]).eq(tsla.address);
    //     expect(x[4]).eq(toUsd(300));
    //     expect(x[5]).false; //isLong
    //     expect(x[6]).eq(toUsd(200));
    //     expect(x[7]).false; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    // });
    // it("check OP_IP + OP_DP => TRIGGER => createDO_LONG_ABOVE", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //     let _token = weth;
    //     await createDO_LONG_ABOVE(_token, receiver, 1400, 1500, 1600);
    //     expect(await (await o.increaseOrders(receiver.address, 0))[0]).eq(constants.AddressZero); //increaseOrder = empty
    //
    //     let x = await o.decreaseOrders(receiver.address, 0);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(_token.address);
    //     expect(x[2]).eq(toUsd(1600));
    //     expect(x[3]).eq(_token.address);
    //     expect(x[4]).eq(toUsd(1500));
    //     expect(x[5]).true; //isLong
    //     expect(x[6]).eq(toUsd(1400));
    //     expect(x[7]).true; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    //
    //     _token = tsla;
    //     await createDO_LONG_ABOVE(_token, receiver, 100, 200, 300);
    //     x = await o.decreaseOrders(receiver.address, 1);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(_token.address);
    //     expect(x[2]).eq(toUsd(300));
    //     expect(x[3]).eq(_token.address);
    //     expect(x[4]).eq(toUsd(200));
    //     expect(x[5]).true; //isLong
    //     expect(x[6]).eq(toUsd(100));
    //     expect(x[7]).true; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    //
    //     _token = wbtc;
    //     await createDO_LONG_ABOVE(_token, receiver, 27000, 28000, 29000);
    //     x = await o.decreaseOrders(receiver.address, 2);
    //
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(_token.address);
    //     expect(x[2]).eq(toUsd(29000));
    //     expect(x[3]).eq(_token.address);
    //     expect(x[4]).eq(toUsd(28000));
    //     expect(x[5]).true; //isLong
    //     expect(x[6]).eq(toUsd(27000));
    //     expect(x[7]).true; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    // });

    // it("check OP_IP + OP_DP => TRIGGER => createDO_LONG_BELOW", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //     let _token = weth; //weth
    //     await createDO_LONG_BELOW(_token, receiver, 1600,1700, 1800);
    //     let x = await o.decreaseOrders(receiver.address, 0);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(_token.address);
    //     expect(x[2]).eq(toUsd(1800));
    //     expect(x[3]).eq(_token.address);
    //     expect(x[4]).eq(toUsd(1700));
    //     expect(x[5]).true; //isLong
    //     expect(x[6]).eq(toUsd(1600));
    //     expect(x[7]).false; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    //
    //     _token = tsla; //tsla
    //     await createDO_LONG_BELOW(_token, receiver, 200, 300, 400);
    //     x = await o.decreaseOrders(receiver.address, 1);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(_token.address);
    //     expect(x[2]).eq(toUsd(400));
    //     expect(x[3]).eq(_token.address);
    //     expect(x[4]).eq(toUsd(300));
    //     expect(x[5]).true; //isLong
    //     expect(x[6]).eq(toUsd(200));
    //     expect(x[7]).false; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    //
    //     _token = wbtc; //wbtc
    //     await createDO_LONG_BELOW(_token, receiver, 29000, 28000, 27000);
    //     x = await o.decreaseOrders(receiver.address, 2);
    //     expect(x[0]).eq(receiver.address);
    //     expect(x[1]).eq(_token.address);
    //     expect(x[2]).eq(toUsd(27000));
    //     expect(x[3]).eq(_token.address);
    //     expect(x[4]).eq(toUsd(28000));
    //     expect(x[5]).true; //isLong
    //     expect(x[6]).eq(toUsd(29000));
    //     expect(x[7]).false; //triggerAboveThreshold
    //     expect(x[8]).eq(parseEther("0.005"));
    // });
    // it("createDO_LONG_BELOW + execute", async() => {
    //     await OP_IP();
    //     await OP_DP();
    //     let _user = receiver;
    //     let _token = weth;
    //     let x;
    //     await createDO_LONG_BELOW(_token, receiver, 1600,1700, 1800); //createDO
    //     x = await o.decreaseOrders(_user.address, 0);
    //     expect(x[0]).eq(_user.address);
    //     expect(x[1]).eq(_token.address);
    //     expect(x[2]).eq(toUsd(1800));
    //     expect(x[3]).eq(_token.address);
    //
    //     await updateMarkPrice(['weth'], ['1599']);
    //     await pm.setOrderKeeper(_user.address, true);
    //     let {updateData, fee} = await getUpdateData(['weth']);
    //     await pm.connect(_user).executeDecreaseOrder(_user.address, 0, _user.address, updateData, {value: fee}); //execute
    //
    //     x = await o.decreaseOrders(_user.address, 0);
    //     expect(x[0]).eq(constants.AddressZero);
    //     expect(x[1]).eq(constants.AddressZero);
    //     expect(x[2]).eq(0);
    //     expect(x[3]).eq(constants.AddressZero);
    // });
});
