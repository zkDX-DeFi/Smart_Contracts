import {
    ApproveAmount,
    bigNumberify,
    expandDecimals,
    forwardTime,
    getBlockTime,
    getGasFee,
    mineBlocks,
    newWallet,
    reportGasUsed,
    setupFixture,
    toChainlinkPrice,
    toUsd
} from "../../../helpers/utils";
import {formatEther, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {DEFAULT_WITHIN, MAX_WITHIN} from "../../../helpers/constants";
import {
    getDaiConfig,
    getEquityConfig,
    getTokenConfig,
    getUsdcConfig,
    getWbtcConfig,
    getWethConfig,
    getWmaticConfig
} from "../../../helpers/params";
import {constants} from "ethers";
import {ethers} from "hardhat";
import {
    getEthNumber,
    OP_CHAINID,
    printVault_Pool_Reserved,
    sleep,
    splitter,
    splitterTitle
} from "../../../helpers/utils2";
import {getNetworkCurrentTimestamp, getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("check helpers scripts => ", async () => {
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
            _token.address, // path
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
    it("check constants.ts => ", async() => {
        expect(DEFAULT_WITHIN).to.be.eq(10000);
        expect(MAX_WITHIN).to.be.gt(parseEther('0.009'));
    });
    it("check helpers/params.ts => getWNativeConfigByChainId", async() => {
        splitterTitle("getWethConfig");
        console.log(`${await getWmaticConfig(weth)}`);
        console.log(`${await getWethConfig(weth)}`);
        console.log(`${await getWbtcConfig(wbtc)}`);
        console.log(`${await getDaiConfig(dai)}`);
        console.log(`${await getUsdcConfig(usdc)}`);

        splitterTitle("getTokenConfig");
        console.log(`${await getTokenConfig(weth)}`);
        console.log(`${await getTokenConfig(wbtc)}`);
        console.log(`${await getTokenConfig(dai)}`);
        console.log(`${await getTokenConfig(usdc)}`);
        console.log(`${await getTokenConfig(tsla)}`);

        splitterTitle("getEquityConfig");
        console.log(`${await getEquityConfig(weth)}`);
        console.log(`${await getEquityConfig(wbtc)}`);
        console.log(`${await getEquityConfig(dai)}`);
        console.log(`${await getEquityConfig(usdc)}`);
        console.log(`${await getEquityConfig(tsla)}`);
    });
    it("check helpers/utils.ts => getContracts()", async() => {
        let fixture = await setupFixture();
        expect(v.address).to.not.eq(constants.AddressZero);
        expect(router.address).to.not.eq(constants.AddressZero);
        expect(feed.address).to.not.eq(constants.AddressZero);

        let wn = fixture.wnative;
        expect(weth.address).to.be.eq(wn.address);
        expect(weth.address).to.not.eq(constants.AddressZero);
        expect(wn.address).to.not.eq(constants.AddressZero);
        expect(wbtc.address).to.not.eq(constants.AddressZero);
        let usdm = fixture.usdm;
        expect(usdm.address).to.not.eq(constants.AddressZero);
        expect(zkusd.address).to.not.eq(constants.AddressZero);
        expect(zkusd.address).to.be.eq(usdm.address);
        expect(t.address).to.not.eq(constants.AddressZero);
        expect(pm.address).to.not.eq(constants.AddressZero);
        expect(reader.address).to.not.eq(constants.AddressZero);

        expect(vu.address).to.not.eq(constants.AddressZero);
        expect(vec.address).to.not.eq(constants.AddressZero);
        expect(rewardRouter.address).to.not.eq(constants.AddressZero);

        expect(dlp.address).to.not.eq(constants.AddressZero);
        expect(dlpManager.address).to.not.eq(constants.AddressZero);
        expect(shortsTracker.address).to.not.eq(constants.AddressZero);

        expect(zkdx.address).to.not.eq(constants.AddressZero);
        expect(tsla.address).to.not.eq(constants.AddressZero);
        expect(stakingETH.address).to.not.eq(constants.AddressZero);
        expect(stakingUSDC.address).to.not.eq(constants.AddressZero);
        // users
        expect(owner.address).to.not.eq(constants.AddressZero);
        expect(user0.address).to.not.eq(constants.AddressZero);
        expect(user1.address).to.not.eq(constants.AddressZero);
        expect(user2.address).to.not.eq(constants.AddressZero);
        expect(miner.address).to.not.eq(constants.AddressZero);
        expect(feeTo.address).to.not.eq(constants.AddressZero);
        expect(receiver.address).to.not.eq(constants.AddressZero);

        // Utils Contracts
        expect(pythContract.address).to.not.eq(constants.AddressZero);
        expect(weth.address).to.not.eq(constants.AddressZero);
        expect(wbtc.address).to.not.eq(constants.AddressZero);
        expect(dai.address).to.not.eq(constants.AddressZero);
        expect(usdc.address).to.not.eq(constants.AddressZero);
        expect(tsla.address).to.not.eq(constants.AddressZero);
        expect(o.address).to.not.eq(constants.AddressZero);
        expect(esZKDX.address).to.not.eq(constants.AddressZero);
        expect(usdc.address).to.not.eq(constants.AddressZero);
        expect(zkdxlv1.address).to.not.eq(constants.AddressZero);
        expect(obr.address).to.not.eq(constants.AddressZero);
    });
    it("check helpers/utils.ts => newWallet()", async() => {
        let wallet = newWallet();
        expect(wallet.address).to.not.eq(constants.AddressZero);
        expect(wallet.address).to.not.eq(owner.address);
        expect(wallet.address).to.not.eq(user0.address);
        expect(wallet.address).to.not.eq(user1.address);
        expect(wallet.address).to.not.eq(user2.address);
        expect(wallet.address).to.not.eq(miner.address);
        expect(wallet.address).to.not.eq(feeTo.address);
        expect(wallet.address).to.not.eq(receiver.address);

        let num = parseEther("100");
        expect(bigNumberify(num)).to.be.eq(num);

        let num2 = expandDecimals(100, 18);
        expect(num2).to.be.eq(parseEther("100"));

        let num3 = toUsd(123);
        expect(num3).to.be.eq(parseUnits("123",30));

        let n4 = toChainlinkPrice(456)
        expect(n4).to.be.eq(parseUnits("456", 8));
    });
    it("check helpers/utils.ts => reportGasUsed()", async() => {
        let tx1 = await weth.mint(user0.address,parseEther("100"));
        await tx1.wait();
        let gas1 = await reportGasUsed(tx1, "weth.mint");
        expect(gas1).to.be.gt(50000);
        expect(gas1).to.be.lt(60000);

        let blockNumberBefore = await ethers.provider.getBlockNumber();
        await mineBlocks(100);
        let blockNumberAfter = await ethers.provider.getBlockNumber();
        expect(blockNumberAfter).to.be.eq(blockNumberBefore + 100);

        let blockTime = await getBlockTime(ethers.provider);
        console.log(`blockTime: ${blockTime}`);

        let tx2 = await weth.mint(user0.address,parseEther("100"));
        await tx2.wait();
        console.log(`gas2: ${formatEther(await getGasFee(tx2))}`);

        await expect(forwardTime(86400 * 7)).to.be.ok;
    });
    it("check helpers/utils.ts => getLiqPriceForPosition() + getLiqPrice()", async() => {
        await buyMLPWithETHV2(parseEther("20"), owner);
        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            [weth.address], // _path
            weth.address, // _indexToken
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]
        // await pm.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
        //
        // let liqPrice = await getLiqPriceForPosition(
        //     user0.address, weth.address, weth.address, true);
        // expect(liqPrice).to.be.eq(toUsd(1366.5));
        //
        // let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
        // let position = await vault.positions(key);
        // let cumulativeFundingRate = await vault.cumulativeFundingRates(weth.address);
        // let liqPrice2 = getLiqPrice(position, cumulativeFundingRate, true);
        // expect(liqPrice2).to.be.eq(toUsd(1366.5));
        //
        // let positionFee = getPositionFee(position.size);
        // console.log(`positionFee: ${formatUnits(positionFee,30)}`);
        // expect(positionFee).to.be.eq(toUsd(15)); //getPositionFee from helpers/utils.ts
        //
        // let fundingFee = getFundingFee(
        //     position.size,
        //     position.entryFundingRate,
        //     cumulativeFundingRate);
        // console.log(`fundingFee: ${formatUnits(fundingFee,30)}`);
        // expect(fundingFee).to.be.eq(0); //getFundingFee from helpers/utils.ts
        //
        // let marginFee = positionFee.add(fundingFee).add(LIQUIDATION_FEE);
        // let liqPriceForFees = getLiqPriceFromSize(marginFee, position.size, position.collateral, position.averagePrice, true);
        // console.log(`liqPriceForFees: ${formatUnits(liqPriceForFees,30)}`);
        // expect(liqPriceForFees).to.be.eq(toUsd(1353.5)); //getLiqPriceFromSize from helpers/utils.ts
    });
    it("check helpers/utils.ts => getNetworkCurrentTimestamp()", async() => {
        expect(await getNetworkCurrentTimestamp()).to.be.gt(0);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        expect(fee).to.be.eq(5);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);

        expect(getEthNumber(parseEther("1.2345"))).to.be.eq(1);
        expect(getEthNumber(parseEther("3.2345"))).to.be.eq(3);

        console.log(`sleep`);
        await sleep(60);
        console.log(`wake up`);

        splitter();
        splitterTitle("hello world");

        await printVault_Pool_Reserved(v,weth,dai,wbtc);
        await OP_CHAINID();
    });
});
