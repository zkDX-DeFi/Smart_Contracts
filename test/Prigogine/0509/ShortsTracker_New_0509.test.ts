import {
    ApproveAmount,
    forwardTime,
    setupFixture, toUsd
} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, keccak256, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants, utils} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {toASCII} from "punycode";

import Web3 from 'web3';
import {printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("ShortsTracker -> ShortsTracker test", async () => {
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
        vaultUtils          : any,
        vaultErrorController    : any,
        vu                  : any,
        dlp                 : any,
        reader              : any,
        t                   : any,
        tsla                : any,
        ss                  : any;

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

        vaultUtils          = fixture.VaultUtils;
        vaultErrorController    = fixture.vaultErrorController;
        vu                  = fixture.VaultUtils;
        dlp                 = fixture.zkdlp;
        reader              = fixture.reader;
        t                   = timelock;
        tsla                = fixture.tsla;
        ss                  = shortsTracker;
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
    async function OP_BASE_LONG_SHORT() {
        await longOperationA();
        await shortOperationA();
        await closePositionV2(owner, 300, 400);
    }
    async function longOperationTwice() {
        await longOperationA();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
    }
    it("ss.Paramter => vault", async() => {
        expect(await ss.vault()).to.be.eq(v.address);

        expect(await ss.isHandler(pm.address)).to.be.true;
        expect(await ss.isHandler(router.address)).to.be.false;
        expect(await ss.gov()).to.be.eq(owner.address);
    });
    it("ss.func => setHandler() => owner", async() => {
        expect(await ss.isHandler(router.address)).to.be.false;
        await expect(ss.connect(user0).setHandler(router.address, true)).to.be.revertedWith(ErrorsV2.GOVERNABLE_FORBIDDEN);
        await ss.setHandler(router.address, true);
        expect(await ss.isHandler(router.address)).to.be.true;
    });
    it("ss.func => setHandler() => timelock", async() => {
        expect(await ss.isHandler(pm.address)).to.be.true;
        await ss.setGov(t.address);

        await t.signalSetHandler(ss.address, pm.address, false);
        await forwardTime(86400 * 3);
        await t.setHandler(ss.address, pm.address, false);

        expect(await ss.isHandler(pm.address)).to.be.false;
    });
    it("ss.func => setIsGlobalShortDataReady()", async() => {
        expect(await ss.isGlobalShortDataReady()).to.be.true;
        await expect(ss.connect(user0).setIsGlobalShortDataReady(true)).to.be.revertedWith(ErrorsV2.GOVERNABLE_FORBIDDEN);

        await ss.setIsGlobalShortDataReady(true);
        expect(await ss.isGlobalShortDataReady()).to.be.true;
        await ss.setIsGlobalShortDataReady(false);
        expect(await ss.isGlobalShortDataReady()).to.be.false;
    });
    it("ss.func => setGov() => timelock", async() => {
        expect(await ss.gov()).to.be.eq(owner.address);
        await ss.setGov(t.address);

        await t.signalSetGov(ss.address, user0.address);
        await forwardTime(86400 * 3);
        await t.setGov(ss.address, user0.address);

        expect(await ss.gov()).to.be.eq(user0.address);
    });
    it("ss.func => updateGlobalShortData()", async() => {
        expect(await ss.isHandler(pm.address)).to.be.true;
        expect(await ss.isHandler(owner.address)).to.be.false;
        expect(await ss.isHandler(user0.address)).to.be.false;

        await ss.setHandler(owner.address, true);
        await expect(ss.connect(user0).updateGlobalShortData(
            owner.address,
            weth.address,
            weth.address,
            false,
            toUsd(1000),
            toUsd(1500),
            true
        )).to.be.reverted;

        await ss.updateGlobalShortData(
            owner.address, // _account
            weth.address, // _collateral
            weth.address, // _indexToken
            true, // _isLong
            toUsd(1000), // _sizeDelta
            toUsd(1500), // _markPrice
            true // _isIncrease
        );

        await ss.updateGlobalShortData(
            owner.address, // _account
            weth.address, // _collateral
            weth.address, // _indexToken
            false, // _isLong
            toUsd(0), // _sizeDelta
            toUsd(1500), // _markPrice
            true // _isIncrease
        );

        await ss.setIsGlobalShortDataReady(false);
        await ss.updateGlobalShortData(
            owner.address, // _account
            weth.address, // _collateral
            weth.address, // _indexToken
            false, // _isLong
            toUsd(1000), // _sizeDelta
            toUsd(1500), // _markPrice
            true // _isIncrease
        );

        await ss.setIsGlobalShortDataReady(true);
        await ss.updateGlobalShortData(
            owner.address, // _account
            weth.address, // _collateral
            weth.address, // _indexToken
            false, // _isLong
            toUsd(1000), // _sizeDelta
            toUsd(1500), // _markPrice
            true // _isIncrease
        );
    });
    it("ss.func => getRealisedPnl()", async() => {
        // console.log(`ss.getNextGlobalShortData() : ${
        //     await ss.getNextGlobalShortData(owner.address, weth.address, weth.address, toUsd(1000), toUsd(1500), false)
        // }`)

        await ss.setHandler(owner.address, true);
        await ss.updateGlobalShortData(
            owner.address, // _account
            weth.address, // _collateral
            weth.address, // _indexToken
            false, // _isLong
            toUsd(1000), // _sizeDelta
            toUsd(1500), // _markPrice
            true // _isIncrease
        );

        console.log(`ss.getNextGlobalShortData() : ${
            await ss.getNextGlobalShortData(owner.address, weth.address, weth.address,  toUsd(1500), toUsd(1000), true)
        }`);

        console.log(`ss.getRealisedPnl(): ${
            await ss.getRealisedPnl(owner.address, weth.address, weth.address, toUsd(1000), true)
        }`);
    });
});
