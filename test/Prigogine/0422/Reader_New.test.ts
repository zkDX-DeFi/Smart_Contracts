import {forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("Reader Test", async () => {
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
        reader: any;

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

        await feed.setValidTime(30);
    });
    it("reader.func => gov()", async () => {
        expect(reader.address).to.not.eq(constants.AddressZero);
        expect(await reader.gov()).to.eq(owner.address);
    });

    it("reader.func => getVaultTokenInfo()", async () => {
        let tokenInfos;
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});

        tokenInfos = await reader.getVaultTokenInfo(vault.address, pm.address, weth.address, [weth.address]);
        console.log(`after tokenInfos(weth): ${tokenInfos}`);

        tokenInfos = await reader.getVaultTokenInfo(vault.address, pm.address, weth.address, [dai.address]);
        console.log(`after tokenInfos(dai): ${tokenInfos}`);

        tokenInfos = await reader.getVaultTokenInfo(vault.address, pm.address, weth.address, [wbtc.address]);
        console.log(`after tokenInfos(wbtc): ${tokenInfos}`);
    });

    it("reader.func => getVaultTokenInfo() v2", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});

        let tokenInfos = await reader.getVaultTokenInfo(vault.address, pm.address, weth.address, [weth.address,dai.address,wbtc.address]);
        console.log(`after tokenInfos(weth,dai,wbtc): ${tokenInfos}`);
    });

    it("reader.func => getFees()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});
        let fees = await reader.getFees(vault.address, [weth.address,dai.address,wbtc.address]);

        expect(fees[0]).to.be.eq(parseEther("0.00"));
        expect(fees[1]).to.be.eq(0);
        expect(fees[2]).to.be.eq(0);
    });

    it("reader.func => getFeeBasisPoints()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});

        let feeBasisPoints = await reader.getFeeBasisPoints(vault.address, weth.address,dai.address, parseEther("0.01"));
        expect(feeBasisPoints[0]).to.be.eq(0);
        expect(feeBasisPoints[1]).to.be.eq(0);
        expect(feeBasisPoints[2]).to.be.eq(0);

        feeBasisPoints = await reader.getFeeBasisPoints(vault.address, dai.address,weth.address, parseEther("1"));
        expect(feeBasisPoints[0]).to.be.eq(0);
        expect(feeBasisPoints[1]).to.be.eq(0);
        expect(feeBasisPoints[2]).to.be.eq(0);
    });


    it("reader.func => getTotalStaked()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});

        // await expect(reader.getTotalStaked([zkdlp.address])).to.be.reverted;
    });

    it("reader.func => getStakingInfo()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});

        // let stakingInfo = await reader.getStakingInfo(owner.address, [zkdlp.address]);
    });

    it("reader.func => getFundingRates()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});

        let getFundingRates = await reader.getFundingRates(vault.address,weth.address,[weth.address]);
        expect(getFundingRates[0]).to.be.eq(0);
    });
});
