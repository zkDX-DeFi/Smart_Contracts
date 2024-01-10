import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("ZkDLPManager -> ZkdlpManagerStorage Test", async () => {
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

    it("ZkdlpManagerStorage.parameters => vault()", async () => {
        expect(await dlpManager.vault()).to.equal(v.address);
        expect(await v.poolAmounts(dai.address)).to.be.eq(0);
        expect(await v.poolAmounts(weth.address)).to.be.eq(0);
        expect(await v.poolAmounts(wbtc.address)).to.be.eq(0);
        expect(await dai.balanceOf(v.address)).to.be.eq(0);
        expect(await weth.balanceOf(v.address)).to.be.eq(0);
        expect(await wbtc.balanceOf(v.address)).to.be.eq(0);

        await longOperationTwice();
        expect(await v.poolAmounts(dai.address)).to.be.eq(parseEther("900"));
        expect(await v.poolAmounts(weth.address)).to.be.gt(0);
        expect(await v.poolAmounts(wbtc.address)).to.be.eq(0);
        expect(await dai.balanceOf(v.address)).to.be.eq(parseEther("900"));
        expect(await weth.balanceOf(v.address)).to.be.gt(0);
        expect(await wbtc.balanceOf(v.address)).to.be.eq(0);
    });
    it("ZkdlpManagerStorage.parameters => zkusd()", async () => {
        expect(await dlpManager.vault()).to.be.eq(v.address);
        expect(await dlpManager.zkUsd()).to.be.eq(zkusd.address);
        expect(await dlpManager.zkdlp()).to.be.eq(zkdlp.address);
        expect(await dlpManager.shortsTracker()).to.be.eq(shortsTracker.address);
    });
    it("zkdlpManagerStorage.parameters => inPrivateMode()", async () => {
        let m = dlpManager;
        expect(await dlpManager.inPrivateMode()).to.be.true;
        expect(await m.shortsTrackerAveragePriceWeight()).to.be.eq(10000);

        expect(await m.isHandler(owner.address)).to.be.false;
        expect(await m.isHandler(user1.address)).to.be.false;
        expect(await m.isHandler(user2.address)).to.be.false;
        expect(await m.isHandler(pm.address)).to.be.false;
        expect(await m.isHandler(rewardRouter.address)).to.be.true;
        expect(await m.isHandler(v.address)).to.be.false;
        expect(await m.isHandler(zkusd.address)).to.be.false;
        expect(await m.isHandler(zkdlp.address)).to.be.false;
        expect(await m.isHandler(shortsTracker.address)).to.be.false;
        expect(await m.isHandler(router.address)).to.be.false;
        expect(await m.isHandler(dai.address)).to.be.false;
        expect(await m.isHandler(weth.address)).to.be.false;
        expect(await m.isHandler(wbtc.address)).to.be.false;
    });
    it("m.parameters => cooldownDuration()", async () => {
        let m = dlpManager;
        expect(await m.cooldownDuration()).to.be.eq(0);

        await m.setCooldownDuration(100);
        expect(await m.cooldownDuration()).to.be.eq(100);
        await m.setCooldownDuration(0);
        expect(await m.cooldownDuration()).to.be.eq(0);
    });
    it("m.parameters => aumAddition()", async () => {
        let m = dlpManager;
        expect(await m.aumAddition()).to.be.eq(0);
        expect(await m.aumDeduction()).to.be.eq(0);

        await m.setAumAdjustment(100, 200);
        expect(await m.aumAddition()).to.be.eq(100);
        expect(await m.aumDeduction()).to.be.eq(200);
        await m.setAumAdjustment(0, 0);
        expect(await m.aumAddition()).to.be.eq(0);
        expect(await m.aumDeduction()).to.be.eq(0);
    });
});


describe("ZkDLPManager -> ZkdlpManagerSettings Test", async () => {
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
        m                   : any;

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
        m                   = dlpManager;
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

    it("ZkdlpManagerSettings.func => setInPrivateMode()", async () => {
        let m = dlpManager;
        let dlp = zkdlp;
        expect(await m.inPrivateMode()).to.be.true;

        expect(await dlp.totalSupply()).to.be.eq(0);
        await buyMLPWithTokenV2(dai, parseEther("20000"), owner);
        await buyMLPWithETHV2(parseEther("20"), owner);
        expect(await dlp.totalSupply()).to.be.gt(0);
    });
    it("ZkdlpManagerSettings.func => setInPrivateMode() v2", async () => {
        let m = dlpManager;
        let dlp = zkdlp;
        await m.setInPrivateMode(false);
        expect(await m.inPrivateMode()).to.be.false;

        expect(await dlp.totalSupply()).to.be.eq(0);
        await buyMLPWithTokenV2(dai, parseEther("20000"), owner);
        await buyMLPWithETHV2(parseEther("20"), owner);
        expect(await dlp.totalSupply()).to.be.gt(0);
    });
    it("zkdlpManagerSettings.parameters => isHandler()", async () => {
       let m = dlpManager;
       expect(await m.isHandler(pm.address)).to.be.false;
       expect(await m.isHandler(router.address)).to.be.false;
       expect(await m.isHandler(rewardRouter.address)).to.be.true;
       expect(await m.isHandler(dlpManager.address)).to.be.false;
       expect(await m.isHandler(v.address)).to.be.false;
    });
    it("dlpManager.func => setHandler() v1", async () => {
        let m = dlpManager;
        let dlp = zkdlp;

        await m.setHandler(rewardRouter.address, false);
        expect(await m.isHandler(rewardRouter.address)).to.be.false;
        await expect(buyMLPWithTokenV2(dai, parseEther("20000"), owner)).to.be.reverted;
        await expect(buyMLPWithETHV2(parseEther("20"), owner)).to.be.reverted;
        expect(await dlp.totalSupply()).to.be.eq(0);


        await m.setHandler(rewardRouter.address, true);
        expect(await m.isHandler(rewardRouter.address)).to.be.true;
        await buyMLPWithTokenV2(dai, parseEther("20000"), owner);
        await buyMLPWithETHV2(parseEther("20"), owner);
        expect(await dlp.balanceOf(owner.address)).to.be.eq(parseEther("50000"));
        expect(await dlp.totalSupply()).to.be.eq(parseEther("50000"));
    });

    it("dlpManager.func => setInPrivateMode()", async () => {
        let m = dlpManager;
        let dlp = zkdlp;
        expect(await m.inPrivateMode()).to.be.true; //default value;
        await expect(m.connect(user0).setInPrivateMode(false)).to.be.reverted; //only Gov

        await m.setInPrivateMode(false);
        expect(await m.inPrivateMode()).to.be.false;
        await m.setInPrivateMode(true);
        expect(await m.inPrivateMode()).to.be.true;
    });

    it("dlpManager.settings => setShortsTrackerAveragePriceWeight()", async () => {
        expect(await m.gov()).to.be.eq(owner.address);
        await expect(m.connect(user0).setShortsTrackerAveragePriceWeight(0)).to.be.reverted; //only Gov
        expect(await m.shortsTrackerAveragePriceWeight()).to.be.eq(10000);
        await m.setShortsTrackerAveragePriceWeight(1000);
        expect(await m.shortsTrackerAveragePriceWeight()).to.be.eq(1000);
        await expect(m.setShortsTrackerAveragePriceWeight(10001)).to.be.reverted; //must less than BASIS_POINTS_DIVISOR
    });

    it("dlpManager.settings => setHandler()", async () => {
        expect(await m.isHandler(pm.address)).to.be.false;
        expect(await m.isHandler(router.address)).to.be.false;
        expect(await m.isHandler(rewardRouter.address)).to.be.true;

        expect(await m.isHandler(owner.address)).to.be.false;
        await expect(m.connect(user0).setHandler(owner.address, true)).to.be.reverted; //only Gov
        await m.setHandler(owner.address, true);
        expect(await m.isHandler(owner.address)).to.be.true;
        await m.setHandler(owner.address, false);
        expect(await m.isHandler(owner.address)).to.be.false;
    });

    it("dlpManager.settings => setCooldownDuration()", async () => {
        expect(await m.cooldownDuration()).to.be.eq(0);
        await expect(m.connect(user0).setCooldownDuration(1)).to.be.reverted; //only Gov

        await m.setCooldownDuration(1); //1 second
        expect(await m.cooldownDuration()).to.be.eq(1); // check 1 second;
        await expect(m.setCooldownDuration(48 * 3600 + 1)).to.be.reverted; //must less than 48 hours;

        await m.setCooldownDuration(48 * 3600); //48 hours;
        expect(await m.cooldownDuration()).to.be.eq(48 * 3600); //check 48 hours;
    });

    it("dlpManager.settings => setAumAdjustment()", async () => {
        expect(await m.aumAddition()).to.be.eq(0);
        expect(await m.aumDeduction()).to.be.eq(0);

        await expect(m.connect(user0).setAumAdjustment(1, 1)).to.be.reverted; //only Gov
        await m.setAumAdjustment(1, 1); //1, 1
        expect(await m.aumAddition()).to.be.eq(1); //check 1;
        expect(await m.aumDeduction()).to.be.eq(1); //check 1;
    });
});


describe("ZkDLPManager -> ZkdlpManager Test", async () => {
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
        m                   : any;

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
        m                   = dlpManager;
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

    it("ZkdlpManager.func => constructor()", async () => {
        expect(await m.gov()).to.be.eq(owner.address);
        expect(await m.vault()).to.be.eq(v.address);
        expect(await m.zkUsd()).to.be.eq(zkusd.address);
        expect(await m.zkdlp()).to.be.eq(zkdlp.address);
        expect(await m.shortsTracker()).to.be.eq(shortsTracker.address);
        expect(await m.cooldownDuration()).to.be.eq(0);
    });
});
