import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("ShortsTracker Test V2", async () => {
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
        receiver: any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v: any,
        dlpManager: any,
        zkdx: any,
        feed: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        pm = fixture.positionManager;
        shortsTracker = fixture.shortsTracker;

        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = fixture.dai;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        miner = fixture.miner;
        feeTo = fixture.feeTo;
        receiver = fixture.receiver;

        zkdlp = fixture.zkdlp;
        timelock = fixture.timelock;
        rewardRouter = fixture.rewardRouter;
        zkusd = fixture.ZKUSD;
        v = fixture.vault;
        dlpManager = fixture.zkdlpManager;
        zkdx = fixture.ZKDX;
        feed = fixture.vaultPriceFeed;
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

    it("shortsTracker.scripts => deploy => 3_deploy_zkdlp.ts", async () => {
        expect(shortsTracker.address).to.not.eq(constants.AddressZero);
        expect(await dlpManager.shortsTracker()).to.equal(shortsTracker.address);
    });
    it("shortsTracker.scripts => deploy => 2_deploy_manager.ts", async () => {
        expect(await shortsTracker.isGlobalShortDataReady()).to.be.true;
        expect(await shortsTracker.isHandler(pm.address)).to.be.true;
        expect(await shortsTracker.isHandler(router.address)).to.be.false;
        expect(await shortsTracker.isHandler(shortsTracker.address)).to.be.false;
        expect(await shortsTracker.isHandler(dlpManager.address)).to.be.false;
        expect(await shortsTracker.isHandler(rewardRouter.address)).to.be.false;
        expect(await shortsTracker.isHandler(owner.address)).to.be.false;
        expect(await shortsTracker.isHandler(user0.address)).to.be.false;
    });
    it("shortsTracker.scripts => deploy => 2_deploy_manager.ts v2", async () => {
        expect(await pm.shortsTracker()).to.equal(shortsTracker.address);
        expect(await shortsTracker.vault()).to.equal(vault.address);
    });
    it("shortsTracker.settings => setGov", async () => {
        expect(await shortsTracker.gov()).to.equal(owner.address);
        await expect(shortsTracker.connect(user0).setGov(user0.address)).to.be.revertedWith("Governable: forbidden");

        await shortsTracker.connect(owner).setGov(user0.address);
        expect(await shortsTracker.gov()).to.equal(user0.address);

        await shortsTracker.connect(user0).setGov(owner.address);
        expect(await shortsTracker.gov()).to.equal(owner.address);
    });
    it("shortsTracker.settings => setHandler", async () => {
        expect(await shortsTracker.isHandler(pm.address)).to.be.true;
        await expect(shortsTracker.connect(user0).setHandler(pm.address, true))
            .to.be.revertedWith("Governable: forbidden");
        await shortsTracker.connect(owner).setHandler(pm.address, false);
        expect(await shortsTracker.isHandler(pm.address)).to.be.false;

        await shortsTracker.connect(owner).setHandler(pm.address, true);
        expect(await shortsTracker.isHandler(pm.address)).to.be.true;
    });
    it("shortsTracker.settings => setHandler v2", async () => {
        let handlerAddress = owner.address;
        expect(await shortsTracker.isHandler(handlerAddress)).to.be.false;

        await shortsTracker.setHandler(handlerAddress, true);
        expect(await shortsTracker.isHandler(handlerAddress)).to.be.true;
        await shortsTracker.setHandler(handlerAddress, false);
        expect(await shortsTracker.isHandler(handlerAddress)).to.be.false;
    });
    it("shortsTracker.settings => setIsGlobalShortDataReady()", async () => {
        expect(await shortsTracker.isGlobalShortDataReady()).to.be.true;
        await expect(shortsTracker.connect(user0).setIsGlobalShortDataReady(false)).to.be.revertedWith("Governable: forbidden");

        await shortsTracker.setIsGlobalShortDataReady(false);
        expect(await shortsTracker.isGlobalShortDataReady()).to.be.false;
        await shortsTracker.setIsGlobalShortDataReady(true);
        expect(await shortsTracker.isGlobalShortDataReady()).to.be.true;
    });
    it("shortsTracker.settings => setInitData()", async () => {
        expect(await shortsTracker.globalShortAveragePrices(dai.address)).to.be.eq(0);
        await shortsTracker.setIsGlobalShortDataReady(false);
        await shortsTracker.setInitData([dai.address], [12345])

        expect(await shortsTracker.globalShortAveragePrices(dai.address)).to.be.eq(12345);
        expect(await shortsTracker.globalShortAveragePrices(weth.address)).to.be.eq(0);
        expect(await shortsTracker.globalShortAveragePrices(wbtc.address)).to.be.eq(0);
        expect(await shortsTracker.isGlobalShortDataReady()).to.be.true;
        await expect(shortsTracker.setInitData([dai.address], [12345])).to.be.revertedWith("ShortsTracker: already migrated");
    });
    it("shortsTracker.settings => setInitData() v2", async () => {
        await shortsTracker.setIsGlobalShortDataReady(false);
        await expect(shortsTracker.connect(user0).setInitData([dai.address], [12345])).to.be.revertedWith("Governable: forbidden");

        await shortsTracker.setInitData([dai.address], [12345]);
        expect(await shortsTracker.isGlobalShortDataReady()).to.be.true;
        expect(await shortsTracker.globalShortAveragePrices(dai.address)).to.be.eq(12345);
    });
    it("shortsTracker.Parameters => vault", async () => {
        let s = shortsTracker;
        expect(await s.vault()).to.be.eq(vault.address);
        expect(await s.isHandler(vault.address)).to.be.false;
        expect(await s.isHandler(router.address)).to.be.false;
        expect(await s.isHandler(pm.address)).to.be.true;

        expect(await s.globalShortAveragePrices(dai.address)).to.be.eq(0);
        expect(await s.globalShortAveragePrices(weth.address)).to.be.eq(0);
        expect(await s.globalShortAveragePrices(wbtc.address)).to.be.eq(0);
        expect(await s.isGlobalShortDataReady()).to.be.true;
    });
    it("shortsTracker.func => updateGlobalShortData()", async () => {
        let s = shortsTracker;
        await buyMLPWithETHV2(parseEther("10"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"), 10000);

        console.log(`s.globalShortAveragePrices(dai): ${formatUnits(await s.globalShortAveragePrices(dai.address),30)}`);
        console.log(`s.globalShortAveragePrices(weth): ${formatUnits(await s.globalShortAveragePrices(weth.address),30)}`);
        console.log(`s.globalShortAveragePrices(wbtc): ${formatUnits(await s.globalShortAveragePrices(wbtc.address),30)}`);

        expect(await s.globalShortAveragePrices(dai.address)).to.be.eq(0);
        expect(await s.globalShortAveragePrices(weth.address)).to.be.eq(0);
        expect(await s.globalShortAveragePrices(wbtc.address)).to.be.eq(0);
    });
});
