import {
    AddressZero,
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
describe("check Test VaultV2 => P1_0612", async () => {
    let
        weth                : any,
        wbtc                : any,
        dai                 : any,
        usdc                : any,
        tsla                : any,
        aapl                : any, //aapl
        zkdlp               : any,
        dlp                 : any,
        zkusd               : any,
        zkdx                : any,
        zkdxlv1             : any,
        hlp                 : any,

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
        v2                  : any, //vaultV2
        feed                : any, //vaultFeed
        vaultUtils          : any,
        vu                  : any, //vaultUtils
        vec                 : any, //vaultErrorController
        pythContract        : any,

        pm                  : any, //positionManager
        dlpManager          : any,
        dm                  : any, //dlpManager
        hm                  : any, //hlpManager
        router              : any,
        r                   : any, //router
        shortsTracker       : any,
        ss                  : any, //shortsTracker
        o                   : any, //orderBook
        rewardRouter        : any,
        rr                  : any, //rewardRouter
        reader              : any,
        obr                 : any, //orderBookReader

        aipc                : any,
        hedge               : any,
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
        aapl                = fixture.aapl;
        zkdlp               = fixture.zkdlp;
        dlp                 = zkdlp;
        hlp                 = fixture.hlp;
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
        v2                  = fixture.v2;
        feed                = fixture.vaultPriceFeed;
        vaultUtils          = fixture.VaultUtils;
        vu                  = vaultUtils;
        vec                 = fixture.vaultErrorController;
        pythContract        = fixture.pythContract;

        pm                  = fixture.positionManager;
        dlpManager          = fixture.zkdlpManager;
        dm                  = dlpManager;
        hm                  = fixture.hlpManager;
        router              = fixture.router;
        r                   = router;
        shortsTracker       = fixture.shortsTracker;
        ss                  = shortsTracker;
        o                   = fixture.orderBook;
        rewardRouter        = fixture.rewardRouter;
        rr                  = rewardRouter;
        reader              = fixture.reader;
        obr                 = fixture.orderBookReader;

        aipc                = fixture.aipc;
        hedge               = fixture.hedgeManager;
        /* Staking */
        stakingUSDC         = fixture.stakingUSDC;
        stakingETH          = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;
        rewardToken         = esZKDX;
        stakingToken        = usdc;

        await feed.setValidTime(300);
        // await v2.setTokenConfig(dai.address, true,true,true);
        // await v2.setTokenConfig(tsla.address, true,false,true);
        // await v2.setTokenConfig(weth.address, true,false,true);
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
        let {updateData, fee} = await getUpdateData(['wbtc', 'dai', 'weth', 'tsla']);
        await o.connect(_user).createIncreaseOrder(
            [_token.address], // path
            _tokenAmountIn, // amountIn
            _token.address, // indexToken
            0, // minOut
            toUsd(100000), // sizeDelta
            _token.address, // collateralToken
            true, // isLong
            toUsd(_triggerPrice), // triggerPrice
            false, // triggerAboveThreshold
            parseEther("0.005"), // executionFee
            false, // shouldWrap
            updateData, // updateData
            {value: parseEther("0.005").add(fee)}
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

    async function pm_ip_token_long(_token: any = weth, _acceptablePrice: any = 2000.000001, _sizeDelta: any = 15000, _amountIn : any = parseEther("1.0"), _user: any = receiver,) {
        await _token.mint(_user.address, _amountIn);
        await _token.connect(_user).approve(router.address, _amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc', 'tsla']);
        let params = [
            [_token.address], // _path
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
            [_token.address], // _path
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

        await pm_ip_token_long(weth, 2000, 20000);
        await pm_ip_token_long(tsla, 600, 6000);
        await pm_ip_token_long(wbtc, 40000, 100000, parseUnits("1.5", 8));
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

    it("check VAULT.func", async() => {
        expect(await v.isInitialized()).true;
        expect(await v.router()).eq(r.address);
        expect(await v.zkusd()).eq(zkusd.address);
        expect(await v.priceFeed()).eq(feed.address);
        expect(await v.liquidationFeeUsd()).eq(toUsd(0));
        expect(await v.fundingRateFactor()).eq(100);
        expect(await v.stableFundingRateFactor()).eq(100);
        expect(await v.gov()).eq(t.address);
        expect(await v.whitelistedTokenCount()).eq(5);

        let token;
        token = dai.address;
        expect(await v.whitelistedTokens(token)).true;
        expect(await v.tokenDecimals(token)).eq(18);
        expect(await v.tokenWeights(token)).eq(10000);
        expect(await v.minProfitBasisPoints(token)).eq(80);
        expect(await v.maxZkusdAmounts(token)).eq(0);
        expect(await v.stableTokens(token)).true;
        expect(await v.shortableTokens(token)).false;

        token = weth.address;
        expect(await v.whitelistedTokens(token)).true;
        expect(await v.tokenDecimals(token)).eq(18);
        expect(await v.tokenWeights(token)).eq(10000);
        expect(await v.minProfitBasisPoints(token)).eq(100);
        expect(await v.maxZkusdAmounts(token)).gt(0);
        expect(await v.stableTokens(token)).false;
        expect(await v.shortableTokens(token)).true;

        token = wbtc.address;
        expect(await v.whitelistedTokens(token)).true;
        expect(await v.tokenDecimals(token)).eq(8);
        expect(await v.tokenWeights(token)).eq(10000);
        expect(await v.minProfitBasisPoints(token)).eq(100);
        expect(await v.maxZkusdAmounts(token)).gt(0);
        expect(await v.stableTokens(token)).false;
        expect(await v.shortableTokens(token)).true;

        token = tsla.address;
        expect(await v.whitelistedTokens(token)).true;
        expect(await v.tokenDecimals(token)).eq(18);
        expect(await v.tokenWeights(token)).eq(10000);
        expect(await v.minProfitBasisPoints(token)).eq(80);
        expect(await v.maxZkusdAmounts(token)).gt(0);
        expect(await v.stableTokens(token)).false;
        expect(await v.shortableTokens(token)).true;

        expect(await v.feeReserves(tsla.address)).eq(0);
        expect(await v.feeReserves(weth.address)).eq(0);
        expect(await v.feeReserves(wbtc.address)).eq(0);
        expect(await v.feeReserves(dai.address)).eq(0);

        await OP_BASE_MLP();

        expect(await v.feeReserves(tsla.address)).eq(0);
        expect(await v.feeReserves(weth.address)).eq(0);
        expect(await v.feeReserves(wbtc.address)).eq(0);
        expect(await v.feeReserves(dai.address)).eq(0);
    });
    it("check vault.func", async() => {
        await weth.mint(v.address, parseEther("1.2345"));
        await v.directPoolDeposit(weth.address);

        expect(await v.feeReserves(tsla.address)).eq(0);
        expect(await v.feeReserves(weth.address)).eq(0);
        expect(await v.feeReserves(wbtc.address)).eq(0);
        expect(await v.feeReserves(dai.address)) .eq(0);
        expect(await weth.balanceOf(v.address)).gt(0);
        expect(await wbtc.balanceOf(v.address)).eq(0);
        expect(await tsla.balanceOf(v.address)).eq(0);
        expect(await dai .balanceOf(v.address)).eq(0);


        let token = weth;
        expect(await zkusd.balanceOf(receiver.address)).eq(0);

        await token.mint(v.address, parseEther("1.2345"));
        await updateMarkPrice(['weth','wbtc','tsla','dai']);
        await v.buyZKUSD(token.address, receiver.address);

        expect(await zkusd.balanceOf(receiver.address)).gt(parseEther("1846"));
        expect(await zkusd.balanceOf(receiver.address)).eq(parseEther("1851.75"));
        expect(await dlp.balanceOf(receiver.address)).eq(0);
    });

    it("check vault.func => buyZKUSD => wbtc + dai + tsla", async() => {
        let token, user;
        token = wbtc;
        user  = user0.address;

        await token.mint(v.address, parseUnits("1.2345",8));
        await updateMarkPrice(['weth','wbtc','tsla','dai']);
        await v.buyZKUSD(token.address, user);
        expect(await zkusd.balanceOf(user)).gt(parseEther("34462"));
        expect(await zkusd.balanceOf(user)).eq(parseEther("34566"));

        token = dai;
        user  = user1.address;

        expect(await zkusd.balanceOf(user)).eq(0);
        await token.mint(v.address, parseUnits("1234",18));
        await updateMarkPrice(['weth','wbtc','tsla','dai']);
        await v.buyZKUSD(token.address, user);
        expect(await zkusd.balanceOf(user)).gt(parseEther("1230"));
        expect(await zkusd.balanceOf(user)).eq(parseEther("1234"));

        token = tsla;
        user = user2.address;

        expect(await zkusd.balanceOf(user)).eq(0);
        await token.mint(v.address, parseUnits("100",18));
        await updateMarkPrice(['weth','wbtc','tsla','dai']);
        await v.buyZKUSD(token.address, user);
        expect(await zkusd.balanceOf(user)).eq(parseEther("16000"));
    });
    it("check vault.func => swap => dai 2 weth", async() => {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        await buyMLPWithTokenV2(dai, parseEther("123456"), owner);

        expect(await v.isSwapEnabled()).true;
        expect(await v.whitelistedTokens(dai.address)).true;
        expect(await v.whitelistedTokens(weth.address)).true;

        let user = user0;
        let _tokenInAmount = parseEther("1500");
        let _tokenIn = dai;
        let _tokenOut = weth;

        await _tokenIn.mint(user.address, _tokenInAmount);
        await _tokenIn.connect(user).transfer(v.address, _tokenInAmount);
        await v.swap(_tokenIn.address, _tokenOut.address, user.address);

        expect(await dai.balanceOf(user.address)).eq(0);
        expect(await weth.balanceOf(user.address)).eq(parseEther("1"));

        expect(await v.lastFundingTimes(_tokenIn.address)).gt(0);
        expect(await v.lastFundingTimes(_tokenOut.address)).gt(0);
        expect(await v.fundingInterval()).eq(3600);
        expect(await v.cumulativeFundingRates(_tokenIn.address)).eq(0);
        expect(await v.cumulativeFundingRates(_tokenOut.address)).eq(0);
        expect(await v.getNextFundingRate(_tokenIn.address)).eq(0);
        expect(await v.getNextFundingRate(_tokenOut.address)).eq(0);
        expect(await v.getMinPrice(_tokenIn.address)).eq(toUsd(1.0));
        expect(await v.getMaxPrice(_tokenOut.address)).eq(toUsd(1500.0));

        let _tokenOutAmount = parseEther("1.2345"); //1.2345 WETH
        expect(await v.adjustForDecimals(_tokenOutAmount, _tokenIn.address, _tokenOut.address)).eq(parseEther("1.2345"));
        expect(await vu.getSwapFeeBasisPoints(_tokenIn.address, _tokenOut.address, _tokenInAmount)).eq(0);
        expect(await v.zkusdAmounts(dai.address)).gt(parseEther("123456"));

        expect(await v.poolAmounts(_tokenIn.address)).gt(parseEther("123456"));
        expect(await v.poolAmounts(_tokenOut.address)).lt(parseEther("200"));
        expect(await v.reservedAmounts(_tokenIn.address)).eq(0);
        expect(await v.reservedAmounts(_tokenOut.address)).eq(0);
        expect(await v.bufferAmounts(_tokenIn.address)).eq(0);
        expect(await v.bufferAmounts(_tokenOut.address)).eq(0);
    });
    it("check vault.func => swap => weth 2 dai", async() => {
        await buyMLPWithTokenV2(weth, parseEther("100"), owner);
        await buyMLPWithTokenV2(dai, parseEther("123456"), owner);
        let user = user0;
        let _tokenInAmount  = parseEther("1");
        let _zkusdAmount    = parseEther("1500");
        let _tokenIn = weth;
        let _tokenOut = dai;

        await _tokenIn.mint(user.address, _tokenInAmount);
        await _tokenIn.connect(user).transfer(v.address, _tokenInAmount);
        await expect(v.swap(_tokenIn.address, _tokenIn.address, user.address)).to.be.reverted;
        await expect(v.swap(_tokenOut.address, _tokenOut.address, user.address)).to.be.reverted;

        await v.swap(_tokenIn.address, _tokenOut.address, user.address);
        expect(await vu.getSwapFeeBasisPoints(_tokenIn.address, _tokenOut.address, _zkusdAmount)).eq(0);

        expect(await v.zkusdAmounts(_tokenIn.address)).gt(parseEther("150000"));
        expect(await v.zkusdAmounts(_tokenOut.address)).lt(parseEther("123456"));
        expect(await v.poolAmounts(_tokenIn.address)).gt(parseEther("100"));
        expect(await v.poolAmounts(_tokenOut.address)).lt(parseEther("123456"));

        expect(await v.bufferAmounts(_tokenIn.address)).eq(0);
        expect(await v.bufferAmounts(_tokenOut.address)).eq(0);
        expect(await v.reservedAmounts(_tokenIn.address)).eq(0);
        expect(await v.reservedAmounts(_tokenOut.address)).eq(0);

        expect(await v.tokenBalances(_tokenIn.address)).gt(parseEther("100"));
        expect(await v.tokenBalances(_tokenOut.address)).lt(parseEther("123456"));

        expect(await v.gov()).eq(t.address);
        expect(await v.isInitialized()).true;
        expect(await v.router()).eq(r.address);
        expect(await v.zkusd()).eq(zkusd.address);
        expect(await v.priceFeed()).eq(feed.address);
        expect(await v.liquidationFeeUsd()).eq(toUsd(0));
        expect(await v.fundingRateFactor()).eq(100);
        expect(await v.stableFundingRateFactor()).eq(100);

        expect(await v.poolAmounts(_tokenIn.address)).gt(parseEther("100"));
        expect(await v.poolAmounts(_tokenOut.address)).lt(parseEther("123456"));
        expect(await v.reservedAmounts(_tokenIn.address)).eq(0);
        expect(await v.reservedAmounts(_tokenOut.address)).eq(0);

        expect(await v.maxLeverage()).eq(100* 10000);
        expect(await v.taxBasisPoints()).eq(0);
        expect(await v.stableTaxBasisPoints()).eq(0);
        expect(await v.mintBurnFeeBasisPoints()).eq(0);
        expect(await v.swapFeeBasisPoints()).eq(0);
        expect(await v.stableSwapFeeBasisPoints()).eq(0);
        expect(await v.marginFeeBasisPoints()).eq(500);
        expect(await v.fundingInterval()).eq(3600);
        expect(await v.whitelistedTokenCount()).eq(5);
        expect(await v.maxGasPrice()).eq(0);
        expect(await v.minProfitTime()).eq(3600);

        expect(await v.isSwapEnabled()).true;
        expect(await v.isLeverageEnabled()).true;
        expect(await v.hasDynamicFees()).false;
        expect(await v.inPrivateLiquidationMode()).true;
        expect(await v.vaultUtils()).eq(vu.address);
        expect(await v.errorController()).eq(vec.address);


        expect(await v.minProfitBasisPoints(weth.address)).eq(100);
        expect(await v.minProfitBasisPoints(wbtc.address)).eq(100);
        expect(await v.minProfitBasisPoints(tsla.address)).eq(80);
        expect(await v.minProfitBasisPoints(dai .address)).eq(80);

        expect(await v.stableTokens(weth.address)).false;
        expect(await v.stableTokens(wbtc.address)).false;
        expect(await v.stableTokens(tsla.address)).false;
        expect(await v.stableTokens(dai .address)).true;

        expect(await v.shortableTokens(weth.address)).true;
        expect(await v.shortableTokens(wbtc.address)).true;
        expect(await v.shortableTokens(tsla.address)).true;
        expect(await v.shortableTokens(dai .address)).false;

        expect(await v.equityTokens(weth.address)).false;
        expect(await v.equityTokens(wbtc.address)).false;
        expect(await v.equityTokens(tsla.address)).true;
        expect(await v.equityTokens(dai .address)).false;

        expect(await v.errors(0)) .eq("Vault: zero error");
        expect(await v.errors(10)).eq("Vault: invalid _fundingInterval");
        expect(await v.tokenDecimals(weth.address)).eq(18);
        expect(await v.tokenDecimals(wbtc.address)).eq(8);
        expect(await v.tokenDecimals(tsla.address)).eq(18);
        expect(await v.tokenDecimals(dai .address)).eq(18);

        expect(await v.tokenBalances(weth.address)).gt(0);
        expect(await v.tokenBalances(wbtc.address)).eq(0);
        expect(await v.tokenBalances(tsla.address)).eq(0);
        expect(await v.tokenBalances(dai .address)).gt(0);

        expect(await v.tokenWeights(weth.address)).eq(10000);
        expect(await v.tokenWeights(wbtc.address)).eq(10000);
        expect(await v.tokenWeights(tsla.address)).eq(10000);
        expect(await v.tokenWeights(dai .address)).eq(10000);

        expect(await v.totalTokenWeights()).eq(50000);
        expect(await v.allWhitelistedTokens(0)).not.eq(constants.AddressZero);
        expect(await v.allWhitelistedTokens(1)).not.eq(constants.AddressZero);
        expect(await v.allWhitelistedTokens(2)).not.eq(constants.AddressZero);
        expect(await v.allWhitelistedTokens(3)).not.eq(constants.AddressZero);
        expect(await v.allWhitelistedTokens(4)).not.eq(constants.AddressZero);
        expect(await v.whitelistedTokens(weth.address)).true;
        expect(await v.whitelistedTokens(wbtc.address)).true;
        expect(await v.whitelistedTokens(tsla.address)).true;
        expect(await v.whitelistedTokens(dai .address)).true;
        expect(await v.whitelistedTokens(zkusd.address)).false;
        expect(await v.whitelistedTokens(dlp.address)).false;

        expect(await v.zkusdAmounts(weth.address)).gt(0);
        expect(await v.zkusdAmounts(wbtc.address)).eq(0);
        expect(await v.zkusdAmounts(tsla.address)).eq(0);
        expect(await v.zkusdAmounts(dai .address)).gt(0);

        expect(await v.maxZkusdAmounts(weth.address)).gt(0);
        expect(await v.maxZkusdAmounts(wbtc.address)).gt(0);
        expect(await v.maxZkusdAmounts(tsla.address)).gt(0);
        expect(await v.maxZkusdAmounts(dai .address)).eq(parseEther("0"));
        expect(await v.allowStaleEquityPrice()).true;
    });

    // it("check HLP => params", async() => {
    //     expect(hlp.address).not.eq(constants.AddressZero);
    //     expect(hm.address).not.eq(constants.AddressZero);
    //     expect(await hm.gov()).eq(owner.address);
    //     expect(await hm.vault()).eq(v.address);
    //     expect(await hm.zkhlp()).eq(hlp.address);
    //     expect(await hm.cooldownDuration()).eq(0);
    //
    //     expect(await hm.isHandler(owner.address)).true;
    //
    //     let _amount = parseEther("1.0");
    //     let _account = owner;
    //     let _token = weth;
    //
    //     await weth.approve(hm.address, _amount);
    //     await weth.mint(owner.address, _amount);
    //
    //     expect(await hlp.totalSupply()).eq(0);
    //     expect(await hlp.balanceOf(_account.address)).eq(0);
    //     await updateMarkPrice(['weth']);
    //     await hm.addLiquidityForAccount(
    //         _account.address,
    //         _account.address,
    //         _token.address,
    //         _amount,
    //     );
    //
    //     expect(await hlp.totalSupply()).eq(parseEther("1495.5"));
    //     expect(await hlp.balanceOf(_account.address)).eq(parseEther("1495.5"));
    // });
    // it("check HLP => params", async() => {
    //     let _amount = parseEther("1.0");
    //     let _account = owner;
    //     let _token = weth;
    //
    //     await weth.approve(hm.address, _amount);
    //     await weth.mint(owner.address, _amount);
    //     await updateMarkPrice(['weth']);
    //     await hm.addLiquidityForAccount(
    //         _account.address,
    //         _account.address,
    //         _token.address,
    //         _amount,
    //     );
    //     expect(await hlp.totalSupply()).eq(parseEther("1495.5"));
    //     expect(await hlp.balanceOf(_account.address)).eq(parseEther("1495.5"));
    //
    //
    //     let _hlpAmount = parseEther("100");
    //     let _receiver = receiver;
    //     expect(await weth.balanceOf(_receiver.address)).eq(0);
    //     await hlp.approve(hm.address, _hlpAmount);
    //     await hm.removeLiquidityForAccount(
    //         _account.address,
    //         _token.address,
    //         _hlpAmount,
    //         _receiver.address
    //     );
    //
    //     expect(await hlp.totalSupply()).eq(parseEther("1395.5"));
    //     expect(await hlp.balanceOf(_account.address)).eq(parseEther("1395.5"));
    //     expect(await weth.balanceOf(_receiver.address)).gt(0);
    //     expect(await zkusd.balanceOf(hm.address)).eq(parseEther("1395.5"));
    // });
    // it("check aipc => params", async() => {
    //     expect(await aipc.gov()).eq(owner.address);
    //     expect(await aipc.policies(0)).eq("Put Option");
    //     expect(await aipc.policies(1)).eq("Call Option");
    //     expect(await aipc.policies(2)).eq("American Option");
    //     expect(await aipc.policies(3)).eq("European Option");
    //     expect(await aipc.policies(4)).eq("Asian Option");
    //     expect(await aipc.policies(5)).eq("Barrier Option");
    //     expect(await aipc.policies(6)).eq("Binary Option");
    //     expect(await aipc.policies(7)).eq("Compound Option");
    //     expect(await aipc.getPolicy(15)).eq("Spread Option");
    //
    //     let _collateralToken = weth;
    //     let _indexToken = weth;
    //     let _isLong = true;
    //     let _sizeDelta = toUsd(15000);
    //     let _collateralDelta = toUsd(1000);
    //     let result;
    //
    //     result = await aipc.getAIPCPolicy(_collateralToken.address, _indexToken.address, _isLong, _sizeDelta, _collateralDelta);
    //     expect(result[0]).eq(0);
    //     expect(result[1]).eq("Put Option");
    //
    //     _isLong = false;
    //     result = await aipc.getAIPCPolicy(_collateralToken.address, _indexToken.address, _isLong, _sizeDelta, _collateralDelta);
    //     expect(result[0]).eq(1);
    //     expect(result[1]).eq("Call Option");
    // });
    // it("check hedge => params", async() => {
    //     expect(hedge.address).not.eq(constants.AddressZero);
    //
    //     let _collateralToken = weth;
    //     let _indexToken = weth;
    //     let _isLong = true;
    //     let _sizeDelta = toUsd(15000);
    //     let _collateralDelta = toUsd(1000);
    //     let _account = owner;
    //     let result;
    //
    //     result = await hedge.getPolicyFromAIPC(
    //         _collateralToken.address,
    //         _indexToken.address, _isLong, _sizeDelta, _collateralDelta);
    //     expect(result[0]).eq(0);
    //     expect(result[1]).eq("Put Option");
    //
    //     _isLong = false;
    //     result = await hedge.getPolicyFromAIPC(
    //         _collateralToken.address,
    //         _indexToken.address, _isLong, _sizeDelta, _collateralDelta);
    //     expect(result[0]).eq(1);
    //     expect(result[1]).eq("Call Option");
    //
    //     await OP_BASE_MLP();
    //     await OP_BASE_LONG_SHORT();
    //
    //     let _key = await v.getPositionKey(_account.address, _collateralToken.address, _indexToken.address, _isLong);
    //     await hedge.createHedgePolicy(_key, result[0]);
    //
    //     result = await hedge.getPolicyFromKey(_key);
    //     expect(result[0]).eq(1);
    //     expect(result[1]).gt(0);
    //     expect(await hedge.getPolicyMessageById(0)).eq("Put Option");
    // });

    it("check orderBook => params", async() => {
        expect(await o.router()).eq(r.address);
        expect(await o.vault()).eq(v.address);
        expect(await o.weth()).eq(weth.address);
        expect(await o.zkusd()).eq(zkusd.address);
        expect(await o.minExecutionFee()).eq(parseEther("0.0005"));
        expect(await o.gov()).eq(owner.address);

        let _purchaseToken = weth;
        let _amountIn = parseEther("1.0");
        let _indexToken = weth;
        let _sizeDelta = toUsd(15000);
        let _collateralToken = weth;
        let _isLong = true;
        let _triggerPrice = toUsd(1200);
        let _triggerAboveThreshold = true;
        let _executionFee = parseEther("0.0005");
        let _shouldWrap = true;

        let addressIn = owner;
        let etherValue = parseEther("1.2345");
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter
            .connect(addressIn)
            .mintAndStakeZkdlpETH(0, 0, updateData, {value: etherValue});
    });

    // it("check orderBook => params v2", async() => {
    //     let _purchaseToken = weth;
    //     let _amountIn = parseEther("1.0");
    //     let _indexToken = weth;
    //     let _sizeDelta = toUsd(15000);
    //     let _collateralToken = weth;
    //     let _isLong = true;
    //     let _triggerPrice = toUsd(1200);
    //     let _triggerAboveThreshold = true;
    //     let _executionFee = parseEther("0.0005");
    //     let _shouldWrap = false;
    //
    //     await OP_BASE_MLP();
    //     await weth.approve(o.address, _amountIn);
    //     await weth.approve(r.address, _amountIn);
    //     await o.createIncreaseOrder(
    //            _purchaseToken.address,
    //             _amountIn,
    //             _indexToken.address,
    //             _sizeDelta,
    //             _collateralToken.address,
    //             _isLong,
    //             _triggerPrice,
    //             _triggerAboveThreshold,
    //             _executionFee,
    //             _shouldWrap,
    //             {value: _executionFee}
    //     );
    // });

    // it("check orderBook => params v3", async() => {
    //     async function createIncreaseOrder(_user: any) {
    //         let _purchaseToken = weth;
    //         let _amountIn = parseEther("1.0");
    //         let _indexToken = weth;
    //         let _sizeDelta = toUsd(15000);
    //         let _collateralToken = weth;
    //         let _isLong = true;
    //         let _triggerPrice = toUsd(1200);
    //         let _triggerAboveThreshold = true;
    //         let _executionFee = parseEther("0.0005");
    //         let _shouldWrap = false;
    //
    //         await OP_BASE_MLP();
    //         await weth.connect(_user).approve(r.address, _amountIn);
    //         await o.connect(_user).createIncreaseOrder(
    //             _purchaseToken.address,
    //             _amountIn,
    //             _indexToken.address,
    //             _sizeDelta,
    //             _collateralToken.address,
    //             _isLong,
    //             _triggerPrice,
    //             _triggerAboveThreshold,
    //             _executionFee,
    //             _shouldWrap,
    //             {value: _executionFee}
    //         );
    //     }
    //
    //     let _user = owner;
    //     await createIncreaseOrder(_user);
    //     let order = await o.increaseOrders(_user.address, 0);
    //     expect(order[0]).eq(_user.address);
    //     expect(order[1]).eq(weth.address);
    //     expect(order[2]).eq(parseEther("1.0"));
    //     expect(order[3]).eq(weth.address);
    //     expect(order[4]).eq(weth.address);
    //     expect(order[5]).eq(toUsd(15000));
    //     expect(order[6]).true;
    //     expect(order[7]).eq(toUsd(1200));
    //     expect(order[8]).true;
    //     expect(order[9]).eq(parseEther("0.0005"));
    //
    //     await o.connect(_user).updateIncreaseOrder(
    //         0, // _orderIndex
    //         toUsd(18000),
    //         toUsd(1800),
    //         false
    //     );
    //
    //     order = await o.increaseOrders(_user.address, 0);
    //     expect(order[0]).eq(_user.address);
    //     expect(order[1]).eq(weth.address);
    //     expect(order[2]).eq(parseEther("1.0"));
    //     expect(order[3]).eq(weth.address);
    //     expect(order[4]).eq(weth.address);
    //     expect(order[5]).eq(toUsd(18000));
    //     expect(order[6]).true;
    //     expect(order[7]).eq(toUsd(1800));
    //     expect(order[8]).false;
    //     expect(order[9]).eq(parseEther("0.0005"));
    //
    //     await o.connect(_user).cancelIncreaseOrder(0);
    //     order = await o.increaseOrders(_user.address, 0);
    //     console.log(`${order}`);
    //     expect(order[0]).eq(AddressZero);
    //     expect(order[1]).eq(AddressZero);
    //     expect(order[2]).eq(0);
    //     expect(order[3]).eq(AddressZero);
    //     expect(order[4]).eq(AddressZero);
    //     expect(order[5]).eq(0);
    //     expect(order[6]).false;
    //     expect(order[7]).eq(0);
    //     expect(order[8]).false;
    //     expect(order[9]).eq(0);
    // });
});
