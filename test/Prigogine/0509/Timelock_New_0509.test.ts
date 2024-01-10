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

describe("Timelock -> Timelock Test => PART I", async () => {
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
        tsla                : any;

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

    it("Timelock.parameters => PRICE_PRECISION", async() => {
        expect(await timelock.PRICE_PRECISION()).to.be.eq(parseUnits("1", 30));
    });
    it("Timelock.func => constructor", async() => {
        expect(await timelock.admin()).to.be.eq(owner.address);
        expect(await timelock.buffer()).to.be.eq(60);
        expect(await timelock.tokenManager()).to.be.eq(constants.AddressZero);
        expect(await timelock.mintReceiver()).to.be.eq(owner.address);
        expect(await timelock.zkdlpManager()).to.be.eq(owner.address);
        expect(await timelock.maxTokenSupply()).to.be.eq(parseEther("1000"));
        expect(await timelock.marginFeeBasisPoints()).to.be.eq(10);
        expect(await timelock.maxMarginFeeBasisPoints()).to.be.eq(500);
    });
    it("Timelock.func => setContractHandler", async() => {
        expect(await t.isHandler(pm.address)).to.be.true;
        expect(await t.isHandler(router.address)).to.be.false;

        await expect(timelock.connect(user0).setContractHandler(pm.address,false)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await timelock.setContractHandler(pm.address,false);
        await timelock.setContractHandler(router.address,true);

        expect(await t.isHandler(pm.address)).to.be.false;
        expect(await t.isHandler(router.address)).to.be.true;
    });
    it("t.func => setKeeper()", async () => {
        await expect(t.connect(user0).setKeeper(user0.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        expect(await t.isKeeper(user0.address)).to.be.false;

        await t.setKeeper(user0.address, true);
        expect(await t.isKeeper(user0.address)).to.be.true;
        await t.setKeeper(user0.address, false);
        expect(await t.isKeeper(user0.address)).to.be.false;
    });
    it("t.func => setBuffer()", async () => {
        expect(await t.buffer()).to.be.eq(60);
        await expect(t.connect(user0).setBuffer(100)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

        await t.setBuffer(100);
        expect(await t.buffer()).to.be.eq(100);

        await expect(t.setBuffer(5 * 86400 + 1)).to.be.revertedWith(ErrorsV2.Timelock_Invalid_Buffer);
        await expect(t.setBuffer(99)).to.be.revertedWith(ErrorsV2.Timelock_Buffer_Cannot_Be_Decreased);
    });
    it("t.func => setMaxLeverage()", async () => {
       expect(await v.maxLeverage()).to.be.eq(1000000);
       await expect(t.connect(user0).setMaxLeverage(v.address, 100)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

       await t.setMaxLeverage(v.address, 2000000);
       expect(await v.maxLeverage()).to.be.eq(2000000);
    });
    it("t.func => setMaxGlobalShortSize()", async () => {
        expect(await v.maxGlobalShortSizes(weth.address)).to.be.eq(0);
        expect(await v.maxGlobalShortSizes(dai.address)).to.be.eq(0);
        expect(await v.maxGlobalShortSizes(wbtc.address)).to.be.eq(0);
        expect(await v.maxGlobalShortSizes(tsla.address)).to.be.eq(0);

        await expect(t.connect(user0).setMaxGlobalShortSize(v.address, weth.address, parseEther("100"))).to.be.reverted;

        await t.setMaxGlobalShortSize(v.address, weth.address, parseEther("100"));
        expect(await v.maxGlobalShortSizes(weth.address)).to.be.eq(parseEther("100"));
        expect(await v.maxGlobalShortSizes(dai.address)).to.be.eq(0);
        expect(await v.maxGlobalShortSizes(wbtc.address)).to.be.eq(0);
        expect(await v.maxGlobalShortSizes(tsla.address)).to.be.eq(0);
    });
    it("t.func => setVaultUtils", async () => {
        expect(await v.vaultUtils()).to.be.eq(vaultUtils.address);
        await expect(t.connect(user0).setVaultUtils(v.address, user0.address)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

        await t.setVaultUtils(v.address, constants.AddressZero);
        expect(await v.vaultUtils()).to.be.eq(constants.AddressZero);
    });
    it("t.func => setMaxGasPrice", async() => {
        expect(await v.maxGasPrice()).to.be.eq(0);
        await expect(t.connect(user0).setMaxGasPrice(v.address, 100)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.setMaxGasPrice(v.address, 100)).to.be.reverted;

        await t.setMaxGasPrice(v.address, 6000000000);
        expect(await v.maxGasPrice()).to.be.eq(6000000000);
    });
    it("t.func => setInPrivateLiquidationMode", async() => {
        expect(await v.inPrivateLiquidationMode()).to.be.true;
        await expect(t.connect(user0).setInPrivateLiquidationMode(v.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

        await t.setInPrivateLiquidationMode(v.address, true);
        expect(await v.inPrivateLiquidationMode()).to.be.true;
        await t.setInPrivateLiquidationMode(v.address, false);
        expect(await v.inPrivateLiquidationMode()).to.be.false;
    });
    it("t.func => setLiquidator", async() => {
        expect(await v.isLiquidator(pm.address)).to.be.true;
        expect(await v.isLiquidator(owner.address)).to.be.false;
        expect(await v.isLiquidator(user0.address)).to.be.false;
        expect(await v.isLiquidator(user1.address)).to.be.false;

        await expect(t.connect(user0).setLiquidator(v.address, user0.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await t.setLiquidator(v.address, pm.address, false);
        expect(await v.isLiquidator(pm.address)).to.be.false;
        expect(await v.isLiquidator(owner.address)).to.be.false;
        expect(await v.isLiquidator(user0.address)).to.be.false;
        expect(await v.isLiquidator(user1.address)).to.be.false;


        await t.setLiquidator(v.address, owner.address, true);
        expect(await v.isLiquidator(pm.address)).to.be.false;
        expect(await v.isLiquidator(owner.address)).to.be.true;
        expect(await v.isLiquidator(user0.address)).to.be.false;
        expect(await v.isLiquidator(user1.address)).to.be.false;
    });
    it("t.func => setInPrivateTransferMode", async() => {
        expect(await zkdx.inPrivateTransferMode()).to.be.false;
        expect(await zkdlp.inPrivateTransferMode()).to.be.false;
        await expect(t.connect(user0).setInPrivateTransferMode(zkdx.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.setInPrivateTransferMode(zkdx.address, true)).to.be.reverted;


        /* zkdx + zkdlp */
        expect(await zkdx.gov()).to.be.eq(owner.address);
        expect(await zkdlp.gov()).to.be.eq(owner.address);
        await zkdx.setInPrivateTransferMode(true);
        await zkdlp.setInPrivateTransferMode(true);
        expect(await zkdx.inPrivateTransferMode()).to.be.true;
        expect(await zkdlp.inPrivateTransferMode()).to.be.true;
    });
    it("t.func => setGov", async() => {
        expect(await zkusd.gov()).to.be.eq(owner.address);
        expect(await zkdlp.gov()).to.be.eq(owner.address);
        expect(await zkdx.gov()).to.be.eq(owner.address);

        await zkusd.setGov(t.address);
        await t.signalSetGov(zkusd.address, user0.address);
        await forwardTime(86400 * 2);
        await t.setGov(zkusd.address, user0.address);
    });
    it("t.func => setHandler", async() => {
        expect(await dlpManager.gov()).to.be.eq(owner.address);
        expect(await dlpManager.isHandler(pm.address)).to.be.false;
        expect(await dlpManager.isHandler(owner.address)).to.be.false;
        expect(await dlpManager.isHandler(user0.address)).to.be.false;
        expect(await dlpManager.isHandler(user1.address)).to.be.false;
        expect(await dlpManager.isHandler(rewardRouter.address)).to.be.true;

        await expect(t.connect(user0).setHandler(dlpManager.address, pm.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.connect(user0).setHandler(dlpManager.address, pm.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);


        await dlpManager.setGov(t.address);
        await t.signalSetHandler(dlpManager.address, pm.address, true);
        await forwardTime(86400 * 2);
        await t.setHandler(dlpManager.address, pm.address, true);

        expect(await dlpManager.isHandler(pm.address)).to.be.true;
        expect(await dlpManager.isHandler(owner.address)).to.be.false;
        expect(await dlpManager.isHandler(user0.address)).to.be.false;
        expect(await dlpManager.isHandler(user1.address)).to.be.false;
        expect(await dlpManager.isHandler(rewardRouter.address)).to.be.true;
    });
    it("t.func => setPriceFeed", async() => {
        expect(await v.priceFeed()).to.be.eq(feed.address);

        await t.signalSetPriceFeed(v.address, constants.AddressZero);
        await forwardTime(86400 * 2);
        await t.setPriceFeed(v.address, constants.AddressZero);

        expect(await v.priceFeed()).to.be.eq(constants.AddressZero);
    });
    it("t.func => removeAdmin", async() => {
        expect(await zkusd.gov()).to.be.eq(owner.address);
        expect(await zkusd.admins(owner.address)).to.be.true;

        await expect(t.connect(user0).removeAdmin(zkusd.address, owner.address)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.removeAdmin(zkusd.address, owner.address)).to.be.reverted;

        await zkusd.setGov(t.address);
        await t.removeAdmin(zkusd.address, owner.address);
        expect(await zkusd.admins(owner.address)).to.be.false;
        expect(await zkusd.gov()).to.be.eq(t.address);
    });
    it("t.func => withdrawFees", async() => {
        expect(await v.feeReserves(dai.address)).to.be.eq(0);
        expect(await v.feeReserves(weth.address)).to.be.eq(0);
        expect(await v.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await v.feeReserves(tsla.address)).to.be.eq(0);
        await OP_BASE_MLP();

        expect(await v.feeReserves(dai.address)).to.be.eq(0);
        expect(await v.feeReserves(weth.address)).to.be.eq(0);
        expect(await v.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await v.feeReserves(tsla.address)).to.be.eq(0);
        expect(await v.gov()).to.be.eq(t.address);


        await expect(t.connect(user0).withdrawFees(v.address, dai.address, owner.address)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await t.withdrawFees(v.address, dai.address, owner.address);
        await t.withdrawFees(v.address, weth.address, owner.address);
        await t.withdrawFees(v.address, wbtc.address, owner.address);
        await t.withdrawFees(v.address, tsla.address, owner.address);

        expect(await v.feeReserves(dai.address)).to.be.eq(0);
        expect(await v.feeReserves(weth.address)).to.be.eq(0);
        expect(await v.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await v.feeReserves(tsla.address)).to.be.eq(0);
    });
});

describe("Timelock -> Timelock Test => PART II", async () => {
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
        tsla                : any;

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
    it("t.func => transferIn", async() => {
        await dai.mint(owner.address, parseEther("1000"));
        await dai.transfer(pm.address, parseEther("1000"));

        await pm.approve(dai.address, t.address, parseEther("1000"));
        await expect(t.connect(user0).transferIn(pm.address, dai.address, parseEther("1000"))).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.transferIn(pm.address, dai.address, parseEther("1001"))).to.be.reverted;
        await t.transferIn(pm.address, dai.address, parseEther("1000"));
    });
    it("t.func => signalApprove() + approve()", async() => {
        await expect(t.connect(user0).signalApprove(dai.address, v.address, parseEther("1000"))).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.connect(user0).approve(dai.address, v.address, parseEther("1000"))).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

        await t.signalApprove(dai.address, v.address, parseEther("1000"));
        await forwardTime(86400 * 2);
        await t.approve(dai.address, v.address, parseEther("1000"));
    });
    it("t.func => signalApprove() + PM", async() => {
        await dai.mint(owner.address, parseEther("1000"));
        await dai.transfer(pm.address, parseEther("1000"));
        await expect(t.transferIn(pm.address, dai.address, parseEther("1000"))).to.be.reverted;

        await t.signalApprove(dai.address, pm.address, parseEther("1000"));
        await forwardTime(86400 * 2);
        await t.approve(dai.address, pm.address, parseEther("1000"));

        expect(await dai.balanceOf(t.address)).to.be.eq(parseEther("0"));
        expect(await dai.balanceOf(pm.address)).to.be.eq(parseEther("1000"));
        await pm.approve(dai.address, t.address, parseEther("1000"));
        await t.transferIn(pm.address, dai.address, parseEther("1000"));
        expect(await dai.balanceOf(t.address)).to.be.eq(parseEther("1000"));
        expect(await dai.balanceOf(pm.address)).to.be.eq(parseEther("0"));

    });
    it("t.func => signalWithdrawToken + withdrawToken => V1 zkusd", async() => {
        /* zkusd */
        await dai.mint(zkusd.address, parseEther("1000"));
        await zkusd.setGov(t.address);

        await t.signalWithdrawToken(zkusd.address, dai.address, user0.address, parseEther("1000"));
        await forwardTime(86400 * 2);
        await t.withdrawToken(zkusd.address, dai.address, user0.address, parseEther("1000"));

        await expect(t.connect(user0).signalWithdrawToken(zkusd.address, dai.address, user0.address, parseEther("1000")))
            .to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.connect(user0).withdrawToken(zkusd.address, dai.address, user0.address, parseEther("1000")))
            .to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
    });
    it("t.func => signalWithdrawToken + withdrawToken => V2 zkdlp", async() => {
        /* zkdlp */
        await dai.mint(zkdlp.address, parseEther("1000"));
        await zkdlp.setGov(t.address);

        await t.signalWithdrawToken(zkdlp.address, dai.address, user0.address, parseEther("1000"));
        await forwardTime(86400 * 2);
        await t.withdrawToken(zkdlp.address, dai.address, user0.address, parseEther("1000"));
    });
    it("t.func => signalMint + processMint => V1 zkdlp", async() => {
        /* zkdlp */
        expect(await zkdlp.gov()).to.be.eq(owner.address);
        await zkdlp.setGov(t.address);
        expect(await zkdlp.gov()).to.be.eq(t.address);

        await t.signalMint(zkdlp.address, user0.address, parseEther("1000"));
        await forwardTime(86400 * 2);
        await t.processMint(zkdlp.address, user0.address, parseEther("1000"));
        expect(await zkdlp.balanceOf(user0.address)).to.be.eq(parseEther("1000"));

        await expect(t.connect(user0).signalMint(zkdlp.address, user0.address, parseEther("1000"))).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await expect(t.connect(user0).processMint(zkdlp.address, user0.address, parseEther("1000"))).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
    });
    it("t.func => signalRedeemZkusd + redeemZkusd", async() => {
        await OP_BASE_MLP();
        await expect(t.connect(user0).signalRedeemZkusd(v.address,dai.address, parseEther("100"))).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await t.signalRedeemZkusd(v.address,dai.address, parseEther("1000"));
        await zkusd.setGov(t.address);
        await forwardTime(86400 * 2);
        await updateMarkPrice(['weth', 'dai', 'wbtc','tsla']);

        expect(await dai.balanceOf(v.address)).to.be.closeTo(parseEther("100370.9999"), MAX_WITHIN);
        await t.redeemZkusd(v.address,dai.address, parseEther("1000"));
        expect(await dai.balanceOf(v.address)).to.be.closeTo(parseEther("99370.9999"), MAX_WITHIN);
    });
    it("t.func => cancelAction", async() => {
        let str = "hello world";
        let hex = Web3.utils.asciiToHex(str);
        let bytes32 = Web3.utils.padRight(hex, 64);
        console.log(`bytes32: ${bytes32}`);
        await expect(t.connect(user0).cancelAction(bytes32)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
    });
    it("t.func => setFundingRate", async() => {
        expect(await v.fundingInterval()).to.be.eq(3600);
        expect(await v.fundingRateFactor()).to.be.eq(100);
        expect(await v.stableFundingRateFactor()).to.be.eq(100);
        await expect(t.connect(user0).setFundingRate(v.address, 1, 1, 1)).to.be.ok;

        await t.setFundingRate(v.address, 1, 1, 1);
        expect(await v.fundingInterval()).to.be.eq(1);
        expect(await v.fundingRateFactor()).to.be.eq(1);
        expect(await v.stableFundingRateFactor()).to.be.eq(1);

        await expect(t.setFundingRate(v.address, 1, 1001, 1)).to.be.ok;
        await expect(t.setFundingRate(v.address, 1, 1, 1001)).to.be.ok;
    });
    it("t.func => onlyKeeperAndAbove", async() => {
        // console.log(`t.isHandler(owner): ${await t.isHandler(owner.address)}`);
        // console.log(`t.isHandler(user0): ${await t.isHandler(user0.address)}`);
        // console.log(`t.isHandler(user1): ${await t.isHandler(user1.address)}`);
        // console.log(`t.isHandler(user2): ${await t.isHandler(user2.address)}`);
        //
        // console.log(`t.isKeeper(owner): ${await t.isKeeper(owner.address)}`);
        // console.log(`t.isKeeper(user0): ${await t.isKeeper(user0.address)}`);
        // console.log(`t.isKeeper(user1): ${await t.isKeeper(user1.address)}`);
        // console.log(`t.isKeeper(user2): ${await t.isKeeper(user2.address)}`);
        //
        // console.log(`t.admin: ${await t.admin()}`);
        // console.log(`t.tokenManager: ${await t.tokenManager()}`);

        expect(await t.isHandler(owner.address)).to.be.false;
        expect(await t.isHandler(user0.address)).to.be.false;
        expect(await t.isHandler(user1.address)).to.be.false;
        expect(await t.isHandler(user2.address)).to.be.false;

        expect(await t.isKeeper(owner.address)).to.be.false
        expect(await t.isKeeper(user0.address)).to.be.false
        expect(await t.isKeeper(user1.address)).to.be.false
        expect(await t.isKeeper(user2.address)).to.be.false

        expect(await t.admin()).to.be.eq(owner.address);
        expect(await t.tokenManager()).to.be.eq(constants.AddressZero);
    });
    it("t.func => setSwapFees", async() => {
        await expect(t.connect(user0).setSwapFees(v.address, 1, 1, 1, 1, 1)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await t.setSwapFees(v.address, 1, 1, 1, 1, 1);

        expect(await v.taxBasisPoints()).to.be.eq(1);
        expect(await v.stableTaxBasisPoints()).to.be.eq(1);
        expect(await v.mintBurnFeeBasisPoints()).to.be.eq(1);
        expect(await v.swapFeeBasisPoints()).to.be.eq(1);
        expect(await v.stableSwapFeeBasisPoints()).to.be.eq(1);
        expect(await v.marginFeeBasisPoints()).to.be.eq(await t.maxMarginFeeBasisPoints());
        expect(await v.minProfitTime()).to.be.eq(3600);
        expect(await v.hasDynamicFees()).to.be.false;
        expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("0",30));
    });
    it("t.func => setFees", async() => {
        await expect(t.connect(user0).setFees(v.address, 1, 1, 1, 1, 1, 1, 1, 1,true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

        await t.setFees(v.address, 1, 1, 1, 1, 1, 1, 1, 1,true);

        expect(await v.taxBasisPoints()).to.be.eq(1);
        expect(await v.stableTaxBasisPoints()).to.be.eq(1);
        expect(await v.mintBurnFeeBasisPoints()).to.be.eq(1);
        expect(await v.swapFeeBasisPoints()).to.be.eq(1);
        expect(await v.stableSwapFeeBasisPoints()).to.be.eq(1);
        expect(await v.marginFeeBasisPoints()).to.be.eq(500);
        expect(await v.liquidationFeeUsd()).to.be.eq(1);
        expect(await v.minProfitTime()).to.be.eq(1);
        expect(await v.hasDynamicFees()).to.be.true;
    });
    it("t.func => setMinProfitTime", async() => {
        expect(await v.minProfitTime()).to.be.eq(3600);
        await expect(t.connect(user0).setMinProfitTime(v.address, 1)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await t.setMinProfitTime(v.address, 1);
        expect(await v.minProfitTime()).to.be.eq(1);
    });
    it("t.func => setTokenConfig", async() => {
        /* dai */
        let tokenAddress = dai.address;
        console.log(`v.whitelistedTokenCount: ${await v.whitelistedTokenCount()}`);
        console.log(`v.whitelistedTokens: ${await v.whitelistedTokens(tokenAddress)}`);
        console.log(`v.tokenDecimals: ${await v.tokenDecimals(tokenAddress)}`);
        console.log(`v.tokenWeights: ${await v.tokenWeights(tokenAddress)}`);
        console.log(`v.minProfitBasisPoints: ${await v.minProfitBasisPoints(tokenAddress)}`);
        console.log(`v.maxZkusdAmounts: ${await v.maxZkusdAmounts(tokenAddress)}`);
        console.log(`v.stableTokens: ${await v.stableTokens(tokenAddress)}`);
        console.log(`v.shortableTokens: ${await v.shortableTokens(tokenAddress)}`);
        console.log(`v.equityTokens: ${await v.equityTokens(tokenAddress)}`);
        console.log(`v.totalTokenWeights: ${await v.totalTokenWeights()}`);

        /* timelock.setTokenConfig */
        await expect(t.connect(user0).setTokenConfig(v.address, tokenAddress, 1, 1, 1, 1, true, true, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
        await t.setTokenConfig(v.address, tokenAddress, 1, 1, 1, 1, true, true, true);


        splitterTitle("after setTokenConfig");
        console.log(`v.whitelistedTokenCount: ${await v.whitelistedTokenCount()}`);
        console.log(`v.whitelistedTokens: ${await v.whitelistedTokens(tokenAddress)}`);
        console.log(`v.tokenDecimals: ${await v.tokenDecimals(tokenAddress)}`);
        console.log(`v.tokenWeights: ${await v.tokenWeights(tokenAddress)}`);
        console.log(`v.minProfitBasisPoints: ${await v.minProfitBasisPoints(tokenAddress)}`);
        console.log(`v.maxZkusdAmounts: ${await v.maxZkusdAmounts(tokenAddress)}`);
        console.log(`v.stableTokens: ${await v.stableTokens(tokenAddress)}`);
        console.log(`v.shortableTokens: ${await v.shortableTokens(tokenAddress)}`);
        console.log(`v.equityTokens: ${await v.equityTokens(tokenAddress)}`);
        console.log(`v.totalTokenWeights: ${await v.totalTokenWeights()}`);

        expect(await v.whitelistedTokenCount()).to.be.eq(5);
        expect(await v.whitelistedTokens(tokenAddress)).to.be.true;
        expect(await v.tokenDecimals(tokenAddress)).to.be.eq(1);
        expect(await v.tokenWeights(tokenAddress)).to.be.eq(1);
        expect(await v.minProfitBasisPoints(tokenAddress)).to.be.eq(1);
        expect(await v.maxZkusdAmounts(tokenAddress)).to.be.eq(1);
        expect(await v.stableTokens(tokenAddress)).to.be.true;
        expect(await v.shortableTokens(tokenAddress)).to.be.true;
        expect(await v.equityTokens(tokenAddress)).to.be.true;
        expect(await v.totalTokenWeights()).to.be.eq(40001);
    });
    it("t.func => setAllowStableEquity", async() => {
        expect(await v.allowStaleEquityPrice()).to.be.true;
        await expect(t.connect(user0).setAllowStableEquity(v.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

        await t.setAllowStableEquity(v.address, false);
        expect(await v.allowStaleEquityPrice()).to.be.false;
        await t.setAllowStableEquity(v.address, true);
        expect(await v.allowStaleEquityPrice()).to.be.true;
    });
});

describe("Timelock -> TimelockStorage", async () => {
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
        tsla                : any;

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
    it("t.Paramter => PRICE_PRECISION", async() => {
        expect(await t.PRICE_PRECISION()).to.equal(parseUnits("1", 30));
        expect(await t.MAX_BUFFER()).to.equal(86400 * 5);
        expect(await t.MAX_FUNDING_RATE_FACTOR()).to.equal(10000);
        expect(await t.buffer()).to.be.eq(60);
        expect(await t.maxTokenSupply()).to.be.eq(parseEther("1000"));

        expect(await t.marginFeeBasisPoints()).to.be.eq(10);
        expect(await t.maxMarginFeeBasisPoints()).to.be.eq(500);
        expect(await t.shouldToggleIsLeverageEnabled()).to.be.true;

        expect(await t.admin()).to.be.eq(owner.address);
        expect(await t.tokenManager()).to.be.eq(constants.AddressZero);
        expect(await t.mintReceiver()).to.be.eq(owner.address);
        expect(await t.zkdlpManager()).to.be.eq(owner.address);
    });
    it("t.func => setBufferAmounts", async() => {
        expect(await v.bufferAmounts(dai.address)).to.be.eq(0);
        expect(await v.bufferAmounts(weth.address)).to.be.eq(0);
        expect(await v.bufferAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.bufferAmounts(tsla.address)).to.be.eq(0);

        await expect(t.connect(user0).
            setBufferAmounts(v.address, [dai.address], [parseEther("100")]))
            .to.be.revertedWith("Timelock: forbidden");

        await t.setBufferAmounts(v.address, [dai.address], [parseEther("100")]);

        expect(await v.bufferAmounts(dai.address)).to.be.eq(parseEther("100"));
        expect(await v.bufferAmounts(weth.address)).to.be.eq(0);
        expect(await v.bufferAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.bufferAmounts(tsla.address)).to.be.eq(0);
    });
    it("t.func => setBufferAmounts => v2", async() => {
        expect(await v.bufferAmounts(dai.address)).to.be.eq(0);
        expect(await v.bufferAmounts(weth.address)).to.be.eq(0);
        expect(await v.bufferAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.bufferAmounts(tsla.address)).to.be.eq(0);

        await t.setBufferAmounts(
            v.address,
            [dai.address,tsla.address],
            [parseEther("100"), parseEther("200")]);

        expect(await v.bufferAmounts(dai.address)).to.be.eq(parseEther("100"));
        expect(await v.bufferAmounts(weth.address)).to.be.eq(0);
        expect(await v.bufferAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.bufferAmounts(tsla.address)).to.be.eq(parseEther("200"));
    });
    it("t.func => setZkusdAmounts", async() => {
        expect(await v.zkusdAmounts(dai.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(weth.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(tsla.address)).to.be.eq(0);

        await expect(t.connect(user0).setZkusdAmounts(v.address, [], [])).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);

        await t.setZkusdAmounts(
            v.address,
            [dai.address, tsla.address],
            [parseEther("100"), parseEther("200")]
        );
        expect(await v.zkusdAmounts(dai.address)).to.be.eq(parseEther("100"));
        expect(await v.zkusdAmounts(weth.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(tsla.address)).to.be.eq(parseEther("200"));
    });
    it("t.func => setIsSwapEnabled()", async() => {
        expect(await v.isSwapEnabled()).to.be.true; //default
        await expect(t.connect(user0).setIsSwapEnabled(v.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN); //!gov

        await t.setIsSwapEnabled(v.address, true);
        expect(await v.isSwapEnabled()).to.be.true;
        await t.setIsSwapEnabled(v.address, false);
        expect(await v.isSwapEnabled()).to.be.false;
    });
    it("t.func => updateZkusdSupply()", async() => {
        console.log(`t.zkdlpManager: ${await t.zkdlpManager()}`);
        console.log(`dlpManager: ${dlpManager.address}`);
        expect(await t.zkdlpManager()).to.be.not.eq(dlpManager.address);


        // console.log(`zkusdSupply: ${formatEther(await t.zkusdSupply())}`);
        // console.log(`zkusd.balanceOf(dlpManager): ${formatEther(await zkusd.balanceOf(t.zkdlpManager()))}`)
        //
        // await updateMarkPrice(['weth', 'dai', 'wbtc','tsla']);
        // await t.updateZkusdSupply(parseEther("100"));
    });
    it("t.func => batchWithdrawFees()", async () => {
        expect(await v.feeReserves(dai.address)).to.be.eq(0);
        expect(await v.feeReserves(weth.address)).to.be.eq(0);
        expect(await v.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await v.feeReserves(tsla.address)).to.be.eq(0);
        await OP_BASE_MLP();
        expect(await v.feeReserves(dai.address)).to.be.eq(0);
        expect(await v.feeReserves(weth.address)).to.be.eq(0);
        expect(await v.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await v.feeReserves(tsla.address)).to.be.eq(0);

        await expect(t.connect(user0).batchWithdrawFees(v.address, [dai.address, weth.address, wbtc.address, tsla.address])).to.be.reverted;
        await t.batchWithdrawFees(v.address, [dai.address, weth.address, wbtc.address, tsla.address]);

        expect(await v.feeReserves(dai.address)).to.be.eq(0);
        expect(await v.feeReserves(weth.address)).to.be.eq(0);
        expect(await v.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await v.feeReserves(tsla.address)).to.be.eq(0);
    });
    it('t.setShouldToggleIsLeverageEnabled', async () => {
        console.log(`t.shouldToggleIsLeverageEnabled: ${await t.shouldToggleIsLeverageEnabled()}`); //default
        await t.setShouldToggleIsLeverageEnabled(true);
        expect(await t.shouldToggleIsLeverageEnabled()).to.be.true;

        await t.setShouldToggleIsLeverageEnabled(false);
        expect(await t.shouldToggleIsLeverageEnabled()).to.be.false;

        await expect(t.connect(user0).setShouldToggleIsLeverageEnabled(true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN);
    });
    it("t.func => setMarginFeeBasisPoints", async () => {
        // console.log(`t.marginFeeBasisPoints: ${await t.marginFeeBasisPoints()}`); //default
        // console.log(`v.maxMarginFeeBasisPoints: ${await t.maxMarginFeeBasisPoints()}`); //default

        expect(await t.marginFeeBasisPoints()).to.be.eq(10);
        expect(await t.maxMarginFeeBasisPoints()).to.be.eq(500);

        await t.setMarginFeeBasisPoints(1, 1);
        expect(await t.marginFeeBasisPoints()).to.be.eq(1);
        expect(await t.maxMarginFeeBasisPoints()).to.be.eq(1);
        await expect(t.connect(user0).setMarginFeeBasisPoints(1, 1)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN); //!gov
    });
    it("t.func => setIsLeverageEnabled", async () => {
        // console.log(`v.isLeverageEnabled: ${await v.isLeverageEnabled()}`); //default for vault
        expect(await v.isLeverageEnabled()).to.be.true;

        await t.setIsLeverageEnabled(v.address, true);
        expect(await v.isLeverageEnabled()).to.be.true;
        await t.setIsLeverageEnabled(v.address, false);
        expect(await v.isLeverageEnabled()).to.be.false;


        await expect(t.connect(user0).setIsLeverageEnabled(v.address, true)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN); //!gov
    });
    it("t.func => enableLeverage()", async () => {
        await expect(t.connect(user0).enableLeverage(v.address)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN); //!gov
        expect(await t.shouldToggleIsLeverageEnabled()).to.be.true;
        await t.enableLeverage(v.address);

        await t.setShouldToggleIsLeverageEnabled(false);
        await t.enableLeverage(v.address);
    });
    it("t.func => disableLeverage()", async () => {
        await expect(t.connect(user0).disableLeverage(v.address)).to.be.revertedWith(ErrorsV2.TIMELOCK_FORBIDDEN); //!gov
        expect(await t.shouldToggleIsLeverageEnabled()).to.be.true;
        await t.disableLeverage(v.address);

        await t.setShouldToggleIsLeverageEnabled(true);
        await t.disableLeverage(v.address);
    });
});
