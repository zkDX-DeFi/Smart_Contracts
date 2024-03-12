import {forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("VaultPriceFeed Test", async () => {
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
        zkdlpManager: any,
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
        zkdlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        feed            = fixture.vaultPriceFeed;

        await feed.setValidTime(30);
    });
    async function buyMLPWithToken(token: any, tokenAmountIn: any, receiver: any) {
        await token.connect(receiver).mint(receiver.address, tokenAmountIn);
        await token.connect(receiver).approve(zkdlpManager.address, tokenAmountIn);
        await rewardRouter.connect(receiver).mintAndStakeZkdlp(token.address, tokenAmountIn, 0, 0);
    }
    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
        ];
        await router.connect(user).approvePlugin(pm.address);
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, _DAIAmountIn);
        await pm.connect(user).increasePosition(...params);
    }
    async function longWBTC_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, wbtc.address], // _path
            wbtc.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(28000.000001), // _acceptablePrice
        ];
        await router.connect(user).approvePlugin(pm.address);
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, _DAIAmountIn);
        await pm.connect(user).increasePosition(...params);
    }
    it("feed.func => gov()", async () => {
        expect(feed.address).to.not.eq(constants.AddressZero);
        expect(await feed.gov()).to.eq(owner.address);
    });
    it("feed.func => setValidTime()", async () => {
        expect(await feed.validTime()).to.eq(30);
        const nonGov = user0;
        await expect(feed.connect(nonGov).setValidTime(60)).to.be.revertedWith("VaultPriceFeed: forbidden");
        await feed.setValidTime(60);
        expect(await feed.validTime()).to.eq(60);
    });
    it("feed.func => parameters()", async () => {
        expect(await feed.pyth()).to.not.eq(constants.AddressZero);
        expect(await feed.validTime()).to.eq(30);
        expect(await feed.gov()).to.eq(owner.address);
    });
    it("feed.func => parameters() => feedIds", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc'],["1002","1.005","30000"]);

        console.log(`feed.feedIds: ${await feed.feedIds(weth.address)}`);
        console.log(`feed.feedIds: ${await feed.feedIds(dai.address)}`);
        console.log(`feed.feedIds: ${await feed.feedIds(wbtc.address)}`);
    });
    it("feed.func => latestTime()", async () => {
        await expect(feed.latestTime(weth.address)).to.be.reverted;
    });
    it("feed.func => pyth()", async () => {
        expect(await feed.pyth()).to.not.eq(constants.AddressZero);
        await expect(feed.connect(user0).setPyth(user0.address)).to.be.reverted;

        await feed.setPyth(user0.address);
    });
    it("feed.func => getPrice()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await feed.setValidTime(30);

        let ethAmountIn = parseEther("1");
        await rewardRouter.mintAndStakeZkdlpETH(
            parseEther("1000"),
            parseEther("1000"),
            updateData, {value: ethAmountIn});

        console.log(`feed.getPrice: ${await feed.getPrice(weth.address, false,true,true)}`);
    });
    it("feed.getMinPrice => getPrice() v2", async () => {
        let {updateData} = await getUpdateData(['weth','wbtc','dai']);
        await rewardRouter.mintAndStakeZkdlpETH(
            parseEther("1000"),
            parseEther("1000"),
            updateData, {value: parseEther("1")});

        console.log(`feed.getMinPrice: ${await feed.getPrice(weth.address, false,true,true)}`);
    });
    it("feed.getMinPrice => latestTime()", async () => {
        let {updateData} = await getUpdateData(['weth','wbtc','dai']);
        await rewardRouter.mintAndStakeZkdlpETH(
            parseEther("1000"),
            parseEther("1000"),
            updateData, {value: parseEther("1")});

        expect(await feed.latestTime(weth.address)).to.eq(1);
        expect(await feed.latestTime(wbtc.address)).to.eq(1);
        await expect(feed.latestTime(dai.address)).to.be.reverted;
    });
    it("feed.func => getUpdateFee()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(parseEther("1000"), parseEther("1000"), updateData, {value: parseEther("1")});

        expect(await feed.getUpdateFee(updateData)).to.be.eq(fee);
        expect(fee).to.be.eq(5);
    });
    it(`feed.func => setGov()`, async () => {
        expect(await feed.gov()).to.eq(owner.address);
        await expect(feed.connect(user0).setGov(user0.address)).to.be.reverted;
        await feed.setGov(user0.address);
        await feed.connect(user0).acceptGov()
        expect(await feed.gov()).to.eq(user0.address);
    });
});
