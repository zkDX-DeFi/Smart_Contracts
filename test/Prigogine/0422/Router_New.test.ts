import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("Router Test V1", async () => {
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
        receiver : any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v : any,
        dlpManager: any,
        zkdx: any,
        feed: any;


    beforeEach(async () => {
        let fixture = await setupFixture();
        vault           = fixture.vault;
        router          = fixture.router;
        pm              = fixture.positionManager;
        shortsTracker   = fixture.shortsTracker;

        weth            = fixture.weth;
        wbtc            = fixture.wbtc;
        dai             = fixture.dai;
        owner           = fixture.owner;
        user0           = fixture.user0;
        user1           = fixture.user1;
        user2           = fixture.user2;
        miner           = fixture.miner;
        feeTo           = fixture.feeTo;
        receiver        = fixture.receiver;

        zkdlp           = fixture.zkdlp;
        timelock        = fixture.timelock;
        rewardRouter    = fixture.rewardRouter;
        zkusd           = fixture.ZKUSD;
        v               = fixture.vault;
        dlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        feed            = fixture.vaultPriceFeed;
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
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn,0, addressIn.address, updateData2, {value: fee2});
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
    it("router.func => constructor()", async () => {
       console.log(`feed.address: ${feed.address}`);
       expect(await router.vault()).to.equal(vault.address);
       expect(await router.zkusd()).to.equal(zkusd.address);
       expect(await router.weth()).to.equal(weth.address);
       expect(await router.gov()).to.equal(owner.address);
    });
    it("router.func => addPlugin() in 2_deploy_manager.ts", async () => {
        expect(await router.plugins(pm.address)).to.be.true;
        expect(await router.plugins(owner.address)).to.be.false;
    });
    it("router.func => setGov()", async () => {
        expect(await router.gov()).to.be.equal(owner.address);
        await expect(router.connect(user0).setGov(user0.address)).to.be.revertedWith("Router: forbidden");

        await router.setGov(user0.address);
        expect(await router.gov()).to.be.equal(user0.address);
        await expect(router.connect(owner).setGov(owner.address)).to.be.revertedWith("Router: forbidden");
    });

    it("router.func.internal => pluginTransfer()", async () => {
        expect(await router.plugins(owner.address)).to.be.false;
        expect(await router.plugins(pm.address)).to.be.true;

        await weth.mint(owner.address, parseEther("1"));
        await expect(router.pluginTransfer(weth.address, owner.address, user0.address, parseEther("1")))
            .to.be.revertedWith("Router: invalid plugin");
    });

    it("router.func.internal => pluginTransfer()", async () => {
        await router.addPlugin(owner.address);
        await weth.mint(owner.address, parseEther("1"));
        await weth.approve(router.address, parseEther("1"));
        expect(await router.plugins(owner.address)).to.be.true;
        expect(await weth.balanceOf(owner.address)).to.be.equal(parseEther("1"));
        expect(await weth.balanceOf(user0.address)).to.be.eq(0);

        await router.pluginTransfer(weth.address, owner.address, user0.address, parseEther("1"));

        expect(await router.plugins(owner.address)).to.be.true;
        expect(await weth.balanceOf(owner.address)).to.be.eq(0);
        expect(await weth.balanceOf(user0.address)).to.be.eq(parseEther("1"));
    });

    it("router.func => removePlugin + addPlugin ", async () => {
        expect(await router.plugins(pm.address)).to.be.true;
        await expect(router.connect(user0).removePlugin(pm.address)).to.be.revertedWith("Router: forbidden");

        await router.removePlugin(pm.address);
        expect(await router.plugins(pm.address)).to.be.false;

        await expect(router.connect(user0).addPlugin(pm.address)).to.be.revertedWith("Router: forbidden");
        await router.addPlugin(pm.address);
        expect(await router.plugins(pm.address)).to.be.true;
    });
});


describe("Router Test V2", async () => {
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
        receiver : any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v : any,
        dlpManager: any,
        zkdx: any,
        feed: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault           = fixture.vault;
        router          = fixture.router;
        pm              = fixture.positionManager;
        shortsTracker   = fixture.shortsTracker;

        weth            = fixture.weth;
        wbtc            = fixture.wbtc;
        dai             = fixture.dai;
        owner           = fixture.owner;
        user0           = fixture.user0;
        user1           = fixture.user1;
        user2           = fixture.user2;
        miner           = fixture.miner;
        feeTo           = fixture.feeTo;
        receiver        = fixture.receiver;

        zkdlp           = fixture.zkdlp;
        timelock        = fixture.timelock;
        rewardRouter    = fixture.rewardRouter;
        zkusd           = fixture.ZKUSD;
        v               = fixture.vault;
        dlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        feed            = fixture.vaultPriceFeed;
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
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn,0, addressIn.address, updateData2, {value: fee2});
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
        await pm.connect(user).increasePosition(...params,{value: fee});
    };
    async function closePositionV2(_usdAmountOut: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let paramsDe = [
            [weth.address, dai.address],
            weth.address,
            toUsd(_usdAmountOut),
            toUsd(_sizeDelta),
            true,
            owner.address,
            toUsd(1500),
            toUsd(0),
            false,
            updateData];
        await pm.connect(owner).decreasePosition(...paramsDe, {value: fee});
    }

    it("router.func => pluginIncreasePosition()", async () => {
       await buyMLPWithETHV2(parseEther("20"), owner);
       await longWETH_DAIAmountInV2(owner, parseEther("2000"),20000);
       await longWETH_DAIAmountInV2(owner, parseEther("2000"),5000);
       await expect(longWETH_DAIAmountInV2(owner, parseEther("2000"),5000)).to.be.reverted; //exceed pool
    });
    it("router.func => pluginDecreasePosition() v2", async () => {
        await buyMLPWithETHV2(parseEther("20"), owner);
        await router.removePlugin(pm.address);
        await expect(longWETH_DAIAmountInV2(owner, parseEther("2000"),5000)).to.be.reverted; //pm is not plugin

        await router.addPlugin(pm.address);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"),5000);
        expect(await dai.balanceOf(vault.address)).to.be.equal(parseEther("2000"));
    });
    it("router.func => longWETH + closePosition()", async () => {
        expect(await vault.poolAmounts(weth.address)).to.be.eq(0);
        await buyMLPWithTokenV2(weth, parseEther("10"), owner);
        expect(await vault.poolAmounts(weth.address)).to.be.eq(parseEther("10"));

        await longWETH_DAIAmountInV2(owner, parseEther("2000"),10000);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let paramsDe = [
            [weth.address,dai.address],
            weth.address,
            toUsd(1700),
            toUsd(6000),
            true,
            owner.address,
            toUsd(1400),
            toUsd(0),
            false,
            updateData2];
        await pm.connect(owner).decreasePosition(...paramsDe, {value: fee2});
        console.log(`weth.balanceOf(owner): ${formatEther(await weth.balanceOf(owner.address))}`)
        console.log(`dai.balanceOf: ${formatEther(await dai.balanceOf(owner.address))}`);
        console.log(`eth.balanceOf(owner): ${formatEther(await owner.getBalance())}`);



        let key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
        let position = await vault.positions(key);
        console.log(`position.size: ${formatUnits(await position.size,30)}`);
    });
    it("router.func => longWETH + close() v2", async () => {
        await buyMLPWithETHV2(parseEther("10"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"),10000);

        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let paramsDe = [
            [weth.address,dai.address],
            weth.address,
            toUsd(1000),
            toUsd(8900),
            true,
            owner.address,
            toUsd(1500),
            toUsd(0),
            false,
            updateData2];
        await pm.connect(owner).decreasePosition(...paramsDe, {value: fee2});
    });
    it("router.func => longWETH + close() v3", async () => {
        await buyMLPWithETHV2(parseEther("10"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"),10000);

        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let paramsDe = [
            [weth.address,dai.address],
            weth.address,
            toUsd(1000),
            toUsd(8000),
            true,
            owner.address,
            toUsd(1500),
            toUsd(0),
            false,
            updateData2];
        await pm.connect(owner).decreasePosition(...paramsDe, {value: fee2});
        expect(await dai.balanceOf(owner.address)).to.be.closeTo(parseEther("991.9999"),MAX_WITHIN);
    });
    it("router.func => longWETH + close() v4", async () => {
        await buyMLPWithETHV2(parseEther("10"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"),10000);
        await closePositionV2(1000,8000);

        expect(await dai.balanceOf(owner.address)).to.be.closeTo(parseEther("991.9999"),MAX_WITHIN);
    });
});
