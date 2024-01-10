import {
    ApproveAmount,
    forwardTime,
    newWallet, setupFixture, toUsd
} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, keccak256, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants, utils} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {toASCII} from "punycode";

import Web3 from 'web3';
import {ethers} from "hardhat";
import {OP_GET_UPDATEData, printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("PM -> PMSettings test", async () => {
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
        o                   : any,
        or                  : any;

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

        o                   = fixture.orderBook;
        or                  = fixture.orderBookReader;

        await OP_BASE_MLP();
        await OP_ORDER_PREPARE();
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
        await buyMLPWithTokenV2(tsla, parseEther("100000"), user0);
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
    /* ORDER BOOK*/
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
    async function OP_ORDER_PREPARE() {
        await orderPrepareV2(owner);
        await orderPrepareV2(user0);
        await orderPrepareV2(user1);
        await orderPrepareV2(user2);
    }
    async function createIO_LONG_TOKEN(_token: any, _tokenAmountIn: any, _user: any, _triggerPrice: any) {
        await o.connect(_user).createIncreaseOrder(
            _token.address, // purchaseToken
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
            {value: parseEther("0.005")}
        );
    };

    async function createIO_LONG_TOKEN_V2(_token: any, _tokenAmountIn: any, _user: any, _triggerPrice: any, _sizeDelta: any) {
        await o.connect(_user).createIncreaseOrder(
            [_token.address], // path
            _tokenAmountIn, // amountIn
            _token.address, // indexToken
            toUsd(_sizeDelta), // sizeDelta
            _token.address, // collateralToken
            true, // isLong
            toUsd(_triggerPrice), // triggerPrice
            false, // triggerAboveThreshold
            parseEther("0.005"), // executionFee
            false, // shouldWrap
            {value: parseEther("0.005")}
        );
    };
    async function printOrderDetails(order: any) {
        console.log(`order.purchaseToken: ${order.purchaseToken}`);
        console.log(`order.purchaseTokenAmount: ${order.purchaseTokenAmount}`);
        console.log(`order.collateralToken: ${order.collateralToken}`);
        console.log(`order.indexToken: ${order.indexToken}`);
        console.log(`order.sizeDelta: ${order.sizeDelta}`);
        console.log(`order.isLong: ${order.isLong}`);
        console.log(`order.triggerPrice: ${order.triggerPrice}`);
        console.log(`order.triggerAboveThreshold: ${order.triggerAboveThreshold}`);
        console.log(`order.executionFee: ${order.executionFee}`);
    }
    async function OP_LONG_IO() {
        await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
        await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
        await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
        await createIO_LONG_TOKEN(dai, parseEther("100"), user1, 1397);
        await createIO_LONG_TOKEN(tsla, parseEther("100"), owner, 1396);
    }
    async function createDO_LongToken_V2(_token: any, _user: any, _triggerPrice: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['wbtc', 'dai', 'weth', 'tsla']);
        await o.connect(_user).createDecreaseOrder(
            _token.address, // indexToken
            toUsd(_sizeDelta), // sizeDelta
            _token.address, // collateralToken
            0, // _collateralDelta
            true, // isLong
            toUsd(_triggerPrice), // triggerPrice
            true, // triggerAboveThreshold
            {value: parseEther("0.005")}
        );
    };
    async function createDecreaseOrder() {
        await createIO_LONG_TOKEN_V2(weth, parseEther("10"), user0, 1400, 140000);
        await updateMarkPrice(['weth'], ['1300']);
        await o.executeIncreaseOrder(user0.address, 0, feeTo.address);
        await createDO_LongToken_V2(weth, user0, 1400, 30000);
    }
    it("PM.func => setOrderKeeper", async () => {
        expect(await pm.admin()).to.be.eq(owner.address);
        expect(await pm.isOrderKeeper(owner.address)).to.be.false;
        await pm.setOrderKeeper(owner.address, true);
        expect(await pm.isOrderKeeper(owner.address)).to.be.true;

        await expect(pm.connect(user0).setOrderKeeper(user0.address, true))
            .to.be.revertedWith(ErrorsV2.BASEPOSITIONMANAGER_FORBIDDEN);
    });
    it("PM.func => setLiquidator", async () => {
        expect(await pm.isLiquidator(owner.address)).to.be.false;
        await pm.setLiquidator(owner.address, true);
        expect(await pm.isLiquidator(owner.address)).to.be.true;

        await expect(pm.connect(user0).setLiquidator(user0.address, true))
            .to.be.revertedWith(ErrorsV2.BASEPOSITIONMANAGER_FORBIDDEN);
    });
    it("PM.func => setPartner", async () => {
        expect(await pm.isPartner(owner.address)).to.be.false;
        await pm.setPartner(owner.address, true);
        expect(await pm.isPartner(owner.address)).to.be.true;

        await expect(pm.connect(user0).setPartner(user0.address, true))
            .to.be.revertedWith(ErrorsV2.BASEPOSITIONMANAGER_FORBIDDEN);
    });
    it("PM.func => setOpened", async () => {
        expect(await pm.opened()).to.be.true;
        await pm.setOpened(false);
        expect(await pm.opened()).to.be.false;

        await expect(pm.connect(user0).setOpened(true))
            .to.be.revertedWith(ErrorsV2.BASEPOSITIONMANAGER_FORBIDDEN);
    });
    it("PM.func => setShouldValidateIncreaseOrder", async () => {
        expect(await pm.shouldValidateIncreaseOrder()).to.be.true;
        await pm.setShouldValidateIncreaseOrder(false);
        expect(await pm.shouldValidateIncreaseOrder()).to.be.false;

        await expect(pm.connect(user0).setShouldValidateIncreaseOrder(true))
            .to.be.revertedWith(ErrorsV2.BASEPOSITIONMANAGER_FORBIDDEN);
    });
    it("PM.func => setOrderBook", async () => {
        expect(await pm.orderBook()).to.be.eq(o.address);
        await pm.setOrderBook(user0.address);
        expect(await pm.orderBook()).to.be.eq(user0.address);

        await expect(pm.connect(user0).setOrderBook(user0.address))
            .to.be.revertedWith(ErrorsV2.BASEPOSITIONMANAGER_FORBIDDEN);
    });
});
