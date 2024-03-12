import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("VaultUtils Test", async () => {
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
        feed: any,
        reader: any,
        vu: any;

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
        reader          = fixture.reader;
        vu              = fixture.VaultUtils;


        async function setTimeLockGov(target: any, user: any) {
            await timelock.signalSetGov(target.address, user.address);
            await forwardTime(86400 * 10); // after buff
            await timelock.setGov(target.address, user.address);
            await v.connect(user).acceptGov();
            expect(await target.gov()).to.be.eq(user.address);
        }
        async function buyMLPWithETH() {
            await feed.setValidTime(30);
            let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
            await rewardRouter.mintAndStakeZkdlpETH(0, 0, updateData, {value: parseEther("1").add(fee)});
        }

        await setTimeLockGov(vault, owner); // owner => gov
        await buyMLPWithETH();
    });
    it("VaultUtils.func => gov()", async () => {
        expect(vu.address).to.not.eq(constants.AddressZero);
        expect(await vu.gov()).to.be.eq(owner.address);
    });
    it("rewardRouter.func => buyMLPWithETH()", async () => {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0, 0, updateData, {value: parseEther("1").add(fee)});

        let dlpAmount = await zkdlp.balanceOf(owner.address);
        await zkdlp.approve(rewardRouter.address, dlpAmount);
        await rewardRouter.unstakeAndRedeemZkdlpETH(parseEther("100"),0,owner.address, []);
    });
    it("rewardRouter.func => buyMLPWithETH() + unstakeAndRedeemZkdlpETH()", async () => {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0, 0, updateData, {value: parseEther("1").add(fee)});

        let dlpAmount = await zkdlp.balanceOf(owner.address);
        await zkdlp.approve(rewardRouter.address, dlpAmount);

        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.unstakeAndRedeemZkdlpETH(parseEther("100"),0,owner.address, updateData2, {value: fee2});
    });

    it("VaultUtils.func => vault() ", async () => {
        expect(await vu.vault()).to.be.eq(vault.address);
    });
    it("VaultUtils.func => setGov", async () => {
        expect(await vu.gov()).to.be.eq(owner.address);
        await expect(vu.connect(user0).setGov(user0.address)).to.be.reverted;

        await vu.setGov(user0.address);
        expect(await vu.gov()).to.be.eq(user0.address);
    });

});

describe("VaultUtils Test v2", async () => {
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
        feed: any,
        reader: any,
        vu: any;

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
        reader          = fixture.reader;
        vu              = fixture.VaultUtils;

        await buyMLPWithETH();
        await buyZKUSDWithToken(weth,parseEther("100"), receiver);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"),20000);
    });

    async function setTimeLockGov(target: any, user: any) {
        await timelock.signalSetGov(target.address, user.address);
        await forwardTime(86400 * 10); // after buff
        await timelock.setGov(target.address, user.address);
        expect(await target.gov()).to.be.eq(user.address);
    }
    async function buyMLPWithETH() {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0, 0, updateData, {value: parseEther("1").add(fee)});
    }
    async function buyZKUSDWithToken(token: any, amountIn: any, receiver: any) {
        await token.mint(vault.address, amountIn);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(token.address, receiver.address);
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
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await pm.connect(user).increasePosition(...params,updateData,{value: fee});
    };

    it("VaultUtils.func => gov()", async () => {
        expect(vu.address).to.not.eq(constants.AddressZero);
        expect(await vu.gov()).to.be.eq(owner.address);
    });
    it("PM.func => increasePosition()", async () => {
        await buyMLPWithETH();
        await buyZKUSDWithToken(weth,parseEther("100"), receiver);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"),20000);
    });
    it("VaultUtils.func => vault()", async () => {
        expect(await vu.vault()).to.be.eq(vault.address);
        expect(await vu.gov()).to.be.eq(owner.address);
    });
    it("VaultUtils.func => getEntryFundingRate()", async () => {
        console.log(`vu.getEntryFundingRate() ${await vu.getEntryFundingRate(weth.address, constants.AddressZero,true)}`);
        console.log(`vault.cumulativeFundingRates: ${await vault.cumulativeFundingRates(weth.address)}`);
        console.log(`vault.cumulativeFundingRates: ${await vault.cumulativeFundingRates(wbtc.address)}`);
        console.log(`vault.cumulativeFundingRates: ${await vault.cumulativeFundingRates(dai.address)}`);
        console.log(`vault.cumulativeFundingRates: ${await vault.cumulativeFundingRates(zkusd.address)}`);
        console.log(`vault.cumulativeFundingRates: ${await vault.cumulativeFundingRates(zkdlp.address)}`);

        expect(await vault.cumulativeFundingRates(weth.address)).to.be.eq(0);
        expect(await vault.cumulativeFundingRates(wbtc.address)).to.be.eq(0);
        expect(await vault.cumulativeFundingRates(dai.address)).to.be.eq(0);
        expect(await vault.cumulativeFundingRates(zkusd.address)).to.be.eq(0);
        expect(await vault.cumulativeFundingRates(zkdlp.address)).to.be.eq(0);
    });

    it("VaultUtils.func => getBuyZkusdFeeBasisPoints()", async () => {
        expect(await vu.getBuyZkusdFeeBasisPoints(weth.address, parseEther("1.2345"))).to.eq(0);
        expect(await vault.mintBurnFeeBasisPoints()).to.be.eq(0);
        expect(await vault.taxBasisPoints()).to.be.eq(0);
    });
});
