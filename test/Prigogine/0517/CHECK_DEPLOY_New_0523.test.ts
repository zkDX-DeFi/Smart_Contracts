import {ApproveAmount, setupFixture, toUsd} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {
    CHAIN_ID_LOCAL,
    CHAIN_ID_MUMBAI, CHAIN_ID_ZKSYNC_MAINNET,
    CHAIN_ID_ZKSYNC_TESTNET,
    FEED_ID_ETH_MAIN,
    FEED_ID_ETH_TEST, PYTH_CONTRACT_MUMBAI_TESTNET
} from "../../../helpers/constants";
import {deployments, getChainId} from "hardhat";
import {
    DISTINCT_CHAIN_IDS,
    getDeployByChainIdAndName,
    getFeedIdByChainAndToken,
    getNativeNameByChainId,
    getPythAddressByChainId
} from "../../../helpers/chains";
import {minExecutionFee} from "../../../helpers/params";
import {getUpdateData} from "../../../helpers/utilsForTest";

describe("check deploy scripts =>  1_deploy -> x_deploy", async () => {
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
        vec    : any,
        pythContract        : any,

        pm                  : any,
        dlpManager          : any,
        router              : any,
        shortsTracker       : any,
        o                   : any,
        rewardRouter        : any,
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
        router              = fixture.router;
        shortsTracker       = fixture.shortsTracker;
        o                   = fixture.orderBook;
        rewardRouter        = fixture.rewardRouter;
        reader              = fixture.reader;
        obr                 = fixture.orderBookReader;
        /* Staking */
        stakingUSDC         = fixture.stakingUSDC;
        stakingETH          = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;
        rewardToken         = esZKDX;
        stakingToken        = usdc;
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

    async function stakingPrepare(_staking: any, _amountIn: any = parseEther("50000000")) {
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
    async function stakingETHStake(
        _staking: any,
        _user: any = owner,
        _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).stake({value: _amountIn});
    }
    async function withdrawStaking(
        _staking: any,
        _user: any = owner,
        _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).withdraw(_amountIn);
    }
    async function getRewardStaking(
        _staking: any,
        _user: any = owner) {
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
    // it("check BASE OPERATION", async() => {
    //     await OP_BASE_MLP();
    //     await OP_BASE_LONG_SHORT();
    //     await OP_ORDER_PREPARE();
    //     await OP_IO_LONG();
    //     await OP_STAKING();
    // });
    it("check deploy scripts => 1_deploy", async() => {
        expect(await v.gov()).to.be.eq(t.address); //vault

        expect(await zkusd.vaults(v.address)).to.be.true; //zkusd
        expect(await zkusd.totalSupply()).to.be.eq(0);
        expect(await feed.pyth()).to.be.eq(pythContract.address); //vaultPriceFeed

        expect(await router.vault()).to.be.eq(v.address); //router
        expect(await router.zkusd()).to.be.eq(zkusd.address);
        expect(await router.weth()).to.be.eq(weth.address);
        expect(await router.gov()).to.be.eq(owner.address);
    });
    it("check deploy scripts => 1_deploy v2", async() => {
        // timelock deploy scripts
        expect(await t.admin()).to.be.eq(owner.address);
        expect(await t.buffer()).to.be.eq(60);
        expect(await t.tokenManager()).to.be.eq(constants.AddressZero);
        expect(await t.mintReceiver()).to.be.eq(owner.address);
        expect(await t.zkdlpManager()).to.be.eq(owner.address);
        expect(await t.maxTokenSupply()).to.be.eq(parseEther("1000.0"));
        expect(await t.marginFeeBasisPoints()).to.be.eq(10);
        expect(await t.maxMarginFeeBasisPoints()).to.be.eq(500);
        // VU DEPLOY SCRIPTS
        expect(await vu.vault()).to.be.eq(v.address);
        expect(await vu.gov()).to.be.eq(owner.address);
        // Vault Error Controller Deploy Scripts
        expect(await vec.gov()).to.be.eq(owner.address);
    });
    it("check deploy scripts => 1_deploy v3", async() => {
        // vault.initialize
        expect(await v.isInitialized()).to.be.true;
        expect(await v.router()).to.be.eq(router.address);
        expect(await v.zkusd()).to.be.eq(zkusd.address);
        expect(await v.priceFeed()).to.be.eq(feed.address);
        expect(await v.liquidationFeeUsd()).to.be.eq(toUsd(0));
        expect(await v.fundingRateFactor()).to.be.eq(100);
        expect(await v.stableFundingRateFactor()).to.be.eq(100);
        // vault.execute
        expect(await v.vaultUtils()).to.be.eq(vu.address);
        expect(await v.errorController()).to.be.eq(vec.address);
        expect(await v.errors(10)).to.be.eq("Vault: invalid _fundingInterval");
    });

    it("check deploy scripts => 2_deploy", async() => {
        // shortsTracker.deploy
        expect(await shortsTracker.vault()).to.be.eq(v.address);
        expect(await shortsTracker.gov()).to.be.eq(owner.address);

        // OrderBook.deploy
        expect(await o.gov()).to.be.eq(owner.address);
        expect(await o.router()).to.be.eq(router.address);
        expect(await o.vault()).to.be.eq(v.address);
        expect(await o.weth()).to.be.eq(weth.address);
        expect(await o.zkusd()).to.be.eq(zkusd.address);

        expect(await o.gov()).to.be.eq(owner.address);
        expect(await o.minExecutionFee()).to.be.eq(minExecutionFee);

        // PM.deploy
        expect(await pm.gov()).to.be.eq(owner.address);
        expect(await pm.orderBook()).to.be.eq(o.address);
        expect(await pm.vault()).to.be.eq(v.address);
        expect(await pm.router()).to.be.eq(router.address);
        expect(await pm.weth()).to.be.eq(weth.address);

        expect(await pm.depositFee()).to.be.eq(50);
        expect(await pm.shortsTracker()).to.be.eq(shortsTracker.address);
        expect(await pm.admin()).to.be.eq(owner.address);

        // OrderBookReader deploy
        expect(obr.address).to.not.be.eq(constants.AddressZero);
    });
    it("check deploy scripts => 2_deploy v2 => settings", async() => {
        // SHORTSTRACKER.SETTINGS
        expect(await shortsTracker.isGlobalShortDataReady()).to.be.true;
        expect(await shortsTracker.isHandler(pm.address)).to.be.true;
        expect(await shortsTracker.isHandler(router.address)).to.be.false;
        expect(await shortsTracker.isHandler(owner.address)).to.be.false;
        expect(await shortsTracker.isHandler(user0.address)).to.be.false;
        expect(await shortsTracker.isHandler(rewardRouter.address)).to.be.false;

        // ROUTER.SETTINGS
        expect(await router.plugins(pm.address)).to.be.true;
        expect(await router.plugins(o.address)).to.be.true;
        expect(await router.plugins(owner.address)).to.be.false;
        expect(await router.plugins(user0.address)).to.be.false;
        expect(await router.plugins(rewardRouter.address)).to.be.false;
        expect(await router.plugins(dlpManager.address)).to.be.false;

        // TIMELOCK.SETTINGS
        expect(await t.isHandler(pm.address)).to.be.true;
        expect(await t.isHandler(router.address)).to.be.false;
        expect(await t.isHandler(owner.address)).to.be.false;
        expect(await t.isHandler(user0.address)).to.be.false;
        expect(await t.isHandler(rewardRouter.address)).to.be.false;
        expect(await t.isHandler(dlpManager.address)).to.be.false;

        expect(await t.shouldToggleIsLeverageEnabled()).to.be.true;
    });

    it("check deploy scripts => 3_deply", async () => {
        // ZKDLP.DEPLOY
        expect(await dlp.name()).to.be.eq("ZKDLP");
        expect(await dlp.symbol()).to.be.eq("ZKDLP");
        expect(await dlp.decimals()).to.be.eq(18);
        expect(await dlp.totalSupply()).to.be.eq(0);
        expect(await dlp.gov()).to.be.eq(owner.address);
        // ZkdlpManager.DEPLOY
        expect(await dlpManager.gov()).to.be.eq(owner.address);
        expect(await dlpManager.vault()).to.be.eq(v.address);
        expect(await dlpManager.zkUsd()).to.be.eq(zkusd.address);
        expect(await dlpManager.zkdlp()).to.be.eq(dlp.address);
        expect(await dlpManager.shortsTracker()).to.be.eq(shortsTracker.address);
        expect(await dlpManager.cooldownDuration()).to.be.eq(0);
        // ZKDX.DEPLOY
        expect(await zkdx.gov()).to.be.eq(owner.address);
        expect(await zkdx.name()).to.be.eq("ZKDX");
        expect(await zkdx.symbol()).to.be.eq("ZKDX");
        expect(await zkdx.decimals()).to.be.eq(18);
        expect(await zkdx.totalSupply()).to.be.eq(0);
        // RewardRouter.DEPLOY
        expect(await rewardRouter.gov()).to.be.eq(owner.address);
        // Reader.DEPLOY
        expect(await reader.gov()).to.be.eq(owner.address);
    });
    it("check deploy scripts => 3_deply v2 => settings", async () => {
        // ZKDLP.SETTINGS
        expect(await dlp.isMinter(dlpManager.address)).to.be.true;
        expect(await dlp.isMinter(pm.address)).to.be.false;
        expect(await dlp.isMinter(router.address)).to.be.false;
        expect(await dlp.isMinter(owner.address)).to.be.false;
        expect(await dlp.isMinter(user0.address)).to.be.false;
        expect(await dlp.isMinter(rewardRouter.address)).to.be.false;
        expect(await dlp.isMinter(pm.address)).to.be.false;

        // RewardRouter.SETTINGS
        expect(await rewardRouter.isInitialized()).to.be.true;
        expect(await rewardRouter.weth()).to.be.eq(weth.address);
        expect(await rewardRouter.zkdx()).to.be.eq(zkdx.address);
        expect(await rewardRouter.zkdlp()).to.be.eq(zkdlp.address);
        expect(await rewardRouter.zkdlpManager()).to.be.eq(dlpManager.address);

        // DlpManager.SETTINGS
        expect(await dlpManager.isHandler(rewardRouter.address)).to.be.true;
        expect(await dlpManager.isHandler(pm.address)).to.be.false;
    });
    it("check deploy scripts => 4_deploy => settings", async () => {
        // VaultPriceFeed.SETTINGS
        expect(await feed.gov()).to.be.eq(owner.address);
        expect(await feed.feedIds(weth.address)).to.be.not.eq(constants.AddressZero);
        expect(await feed.feedIds(dai.address)).to.be.not.eq(constants.AddressZero);
        expect(await feed.feedIds(wbtc.address)).to.be.not.eq(constants.AddressZero);
        expect(await feed.feedIds(tsla.address)).to.be.not.eq(constants.AddressZero);
        // Vault.SETTINGS
        expect(await v.gov()).to.be.eq(t.address);
        // Timelock.SETTINGS
        expect(await v.isLiquidator(pm.address)).to.be.true;
        expect(await v.isLiquidator(router.address)).to.be.false;
        expect(await v.isLiquidator(owner.address)).to.be.false;
        expect(await v.isLiquidator(user0.address)).to.be.false;
        expect(await v.isLiquidator(rewardRouter.address)).to.be.false;
        expect(await v.isLiquidator(dlpManager.address)).to.be.false;
        // Timelock.SETTINGS
        expect(await v.allowStaleEquityPrice()).to.be.true;
    });
    it("check deploy scripts => 5_deploy_staking", async () => {
        // esZKDX.DEPLOY
        expect(await esZKDX.totalSupply()).to.be.eq(parseEther('50000000'));
        expect(await esZKDX.taxReceiver()).to.be.eq(owner.address);
        expect(await esZKDX.owner()).to.be.eq(owner.address);
        expect(await esZKDX.tax()).to.be.eq(0);
        // weth + usdc
        expect(weth.address).to.be.not.eq(constants.AddressZero);
        expect(usdc.address).to.be.not.eq(constants.AddressZero);
        // StakingETH.DEPLOY
        expect(await stakingETH.weth()).to.be.eq(weth.address);
        expect(await stakingETH.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingETH.duration()).to.be.eq(86400 * 30);
        expect(await stakingETH.owner()).to.be.eq(owner.address);
        // StakingUSDC.DEPLOY
        expect(await stakingUSDC.stakingToken()).to.be.eq(usdc.address);
        expect(await stakingUSDC.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingUSDC.duration()).to.be.eq(86400 * 30);
        expect(await stakingUSDC.owner()).to.be.eq(owner.address);

        expect(await esZKDX.totalSupply()).to.be.eq(parseEther("50000000")); //50m
        expect(await weth.totalSupply()).to.be.eq(parseEther("100")); //100
        expect(await usdc.totalSupply()).to.be.eq(0);
        expect(await weth.balanceOf(owner.address)).to.be.eq(0);
        expect(await weth.balanceOf(user0.address)).to.be.eq(0);
    });
    it("check deploy scripts => x_add_order", async () => {
        // SHORTSTRACKER.SETTINGS
        expect(await shortsTracker.isHandler(pm.address)).to.be.true;
        expect(await shortsTracker.isHandler(router.address)).to.be.false;
        expect(await shortsTracker.isHandler(owner.address)).to.be.false;
        expect(await shortsTracker.isHandler(user0.address)).to.be.false;
        expect(await shortsTracker.isHandler(rewardRouter.address)).to.be.false;
        expect(await shortsTracker.isHandler(dlpManager.address)).to.be.false;
    });
    it("check deploy scripts => x_deploy_zkdxlv1", async () => {
        expect(await zkdxlv1.name()).to.be.eq('ZKDXLV1');
        expect(await zkdxlv1.symbol()).to.be.eq('ZKDXLV1');
        expect(await zkdxlv1.decimals()).to.be.eq(0);
        expect(await zkdxlv1.totalSupply()).to.be.eq(10000);
        expect(await zkdxlv1.owner()).to.be.eq(owner.address);

        await zkdxlv1.mint(user0.address, 3);
        expect(await zkdxlv1.balanceOf(user0.address)).to.be.eq(3);
        expect(await zkdxlv1.totalSupply()).to.be.eq(10003);
    });
});

describe("check run scripts => ", async () => {
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
        vec    : any,
        pythContract        : any,

        pm                  : any,
        dlpManager          : any,
        router              : any,
        shortsTracker       : any,
        o                   : any,
        rewardRouter        : any,
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
        router              = fixture.router;
        shortsTracker       = fixture.shortsTracker;
        o                   = fixture.orderBook;
        rewardRouter        = fixture.rewardRouter;
        reader              = fixture.reader;
        obr                 = fixture.orderBookReader;
        /* Staking */
        stakingUSDC         = fixture.stakingUSDC;
        stakingETH          = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;
        rewardToken         = esZKDX;
        stakingToken        = usdc;
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

    async function stakingPrepare(_staking: any, _amountIn: any = parseEther("50000000")) {
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
    async function stakingETHStake(
        _staking: any,
        _user: any = owner,
        _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).stake({value: _amountIn});
    }
    async function withdrawStaking(
        _staking: any,
        _user: any = owner,
        _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).withdraw(_amountIn);
    }
    async function getRewardStaking(
        _staking: any,
        _user: any = owner) {
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
    // it("check BASE OPERATION", async() => {
    //     await OP_BASE_MLP();
    //     await OP_BASE_LONG_SHORT();
    //     await OP_ORDER_PREPARE();
    //     await OP_IO_LONG();
    //     await OP_STAKING();
    // });
    it("check run scripts => calc.ts", async () => {
        let entryPrice = 1500;
        let col = 1500;
        let size = 15000;
        col = col - size / 1000;
        let liqPriceLong  = 1.02 * entryPrice - col * entryPrice / size;
        let liqPriceShort = 0.98 * entryPrice + col * entryPrice / size;
        expect(liqPriceLong).to.be.equal(1381.5);
        expect(liqPriceShort).to.be.equal(1618.5);


        col = 1480.5;
        let anotherLiqPriceShort = (col / size + 0.98) * entryPrice;
        expect(anotherLiqPriceShort).to.be.equal(1618.05);
    });
    it("check run scripts => lv1.ts", async () => {
        const {execute, read} = deployments;
        console.log("balance1:", formatUnits(await read("ZKDXLV1", "balanceOf", owner.address),0));
        console.log("balance2:", formatUnits(await read("ZKDXLV1", "balanceOf", user0.address),0));
        console.log("balance3:", formatUnits(await read("ZKDXLV1", "balanceOf", user1.address),0));
        console.log("balance4:", formatUnits(await read("ZKDXLV1", "balanceOf", feeTo.address),0));
        console.log("balance5:", formatUnits(await read("ZKDXLV1", "balanceOf", receiver.address),0));
        console.log("balance6:", formatUnits(await read("ZKDXLV1", "balanceOf", "0x1df7121c6543888f0f7ecd3c07ef5a265260c48d"),0));

        await zkdxlv1.mint(user0.address,3);
        console.log("balance1:", formatUnits(await read("ZKDXLV1", "balanceOf", owner.address),0));
        console.log("balance2:", formatUnits(await read("ZKDXLV1", "balanceOf", user0.address),0));
        console.log("balance3:", formatUnits(await read("ZKDXLV1", "balanceOf", user1.address),0));
        console.log("balance4:", formatUnits(await read("ZKDXLV1", "balanceOf", feeTo.address),0));
        console.log("balance5:", formatUnits(await read("ZKDXLV1", "balanceOf", receiver.address),0));
        console.log("balance6:", formatUnits(await read("ZKDXLV1", "balanceOf", "0x1df7121c6543888f0f7ecd3c07ef5a265260c48d"),0));

        expect(await read("ZKDXLV1", "balanceOf", owner.address)).to.be.equal(10000);
        expect(await read("ZKDXLV1", "balanceOf", user0.address)).to.be.equal(3);
        expect(await read("ZKDXLV1", "balanceOf", user1.address)).to.be.equal(0);
    });
    it("check run scripts => ods.ts + ops.ts", async () => {
        console.log(`scripts/ods.ts`);
        expect(await o.minExecutionFee()).to.be.equal(minExecutionFee);
        console.log(`scripts/ops.ts`);
    });
    it("check run scripts => pyth.ts", async() => {
        console.log(`scripts/pyth.ts`);
        let {updateData, fee} = await getUpdateData(['weth'], ['1500'], ['1']);
        let tx = await feed.updatePriceFeeds(updateData, {value: fee});
        expect(tx.hash).to.not.be.eq(constants.AddressZero);
    });
    it("check helpers => helpers/chains.ts", async() => {
        expect(DISTINCT_CHAIN_IDS[0]).to.be.eq('80001');
        expect(getNativeNameByChainId(CHAIN_ID_LOCAL)).to.be.eq('WETH');
        expect(getNativeNameByChainId(CHAIN_ID_MUMBAI)).to.be.eq('WMatic');
        expect(getNativeNameByChainId(CHAIN_ID_ZKSYNC_TESTNET)).to.be.eq('WETH');
        expect(getNativeNameByChainId(CHAIN_ID_ZKSYNC_MAINNET)).to.be.eq('WETH');
        expect(getNativeNameByChainId('1')).to.be.eq('WETH');

        const chainId = await getChainId();
        expect(chainId).to.be.eq('31337'); // local
        const NEWWETH = await getDeployByChainIdAndName(
            chainId, "WETH", "Token",
            ["WETH", 18, parseEther("100000"), parseEther("100"), 0]);

        console.log(`NEWWETH: ${formatEther(await NEWWETH.totalSupply())}`);
        expect(await NEWWETH.totalSupply()).to.be.eq(0);

    });
    it("check helpers => helpers/chains.ts v2", async() => {
        const chainId = await getChainId();
        expect(await getPythAddressByChainId(chainId))
            .to.be.eq("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
        expect(await getPythAddressByChainId(CHAIN_ID_LOCAL))
            .to.be.eq("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
        expect(await getPythAddressByChainId(CHAIN_ID_MUMBAI))
            .to.be.eq(PYTH_CONTRACT_MUMBAI_TESTNET);
        expect(await getPythAddressByChainId(CHAIN_ID_ZKSYNC_TESTNET))
            .to.be.eq("0xC38B1dd611889Abc95d4E0a472A667c3671c08DE");
        expect(await getPythAddressByChainId(CHAIN_ID_ZKSYNC_MAINNET))
            .to.be.eq("0xf087c864AEccFb6A2Bf1Af6A0382B0d0f6c5D834");
    });
    it("check chains.ts => getFeedIdByChainAndToken", async() => {
        expect(await getFeedIdByChainAndToken(CHAIN_ID_LOCAL, 'weth'))
            .to.be.eq(FEED_ID_ETH_TEST);
        expect(await getFeedIdByChainAndToken(CHAIN_ID_MUMBAI, 'weth'))
            .to.be.eq(FEED_ID_ETH_TEST);
        expect(await getFeedIdByChainAndToken(CHAIN_ID_ZKSYNC_TESTNET, 'weth'))
            .to.be.eq(FEED_ID_ETH_TEST);
        expect(await getFeedIdByChainAndToken(CHAIN_ID_ZKSYNC_TESTNET, 'WEth'))
            .to.be.eq(FEED_ID_ETH_TEST);
        expect(await getFeedIdByChainAndToken(CHAIN_ID_ZKSYNC_TESTNET, 'WETH'))
            .to.be.eq(FEED_ID_ETH_TEST);

        expect(await getFeedIdByChainAndToken(CHAIN_ID_ZKSYNC_MAINNET, 'weth'))
            .to.be.eq(FEED_ID_ETH_MAIN);
        expect(await getFeedIdByChainAndToken(CHAIN_ID_ZKSYNC_MAINNET, 'WEth'))
            .to.be.eq(FEED_ID_ETH_MAIN);
        expect(await getFeedIdByChainAndToken(CHAIN_ID_ZKSYNC_MAINNET, 'WETH'))
            .to.be.eq(FEED_ID_ETH_MAIN);
    });
});
