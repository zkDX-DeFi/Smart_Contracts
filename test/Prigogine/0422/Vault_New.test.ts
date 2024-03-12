import {forwardTime, setupFixture} from "../../../helpers/utils";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getUpdateData} from "../../../helpers/utilsForTest";

describe("Vault Test", async () => {
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

        await feed.setValidTime(30);
        async function setTimeLockGov(target: any, user: any) {
            await timelock.signalSetGov(target.address, user.address);
            await forwardTime(86400 * 10); // after buff
            await timelock.setGov(target.address, user.address);
            await v.connect(user).acceptGov();
            expect(await target.gov()).to.be.eq(user.address);
        }
        await setTimeLockGov(vault, owner); // owner => gov
    });
    it("vault.func => gov()", async () => {
        expect(vault.address).to.not.eq(constants.AddressZero);
    });
    it("vault.parameters => stableTokens()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0,0, updateData, {value: parseEther("1").add(fee)});

        expect(await vault.stableTokens(weth.address)).to.eq(false);
        expect(await vault.stableTokens(dai.address)).to.eq(true);
        expect(await vault.stableTokens(wbtc.address)).to.eq(false);
        expect(await vault.stableTokens(zkusd.address)).to.eq(false);
        expect(await vault.stableTokens(zkdlp.address)).to.eq(false);
        expect(await weth.balanceOf(vault.address)).to.eq(parseEther("1"));
    });
    it("vault.func => gov()", async () => {
        expect(await vault.gov()).to.eq(owner.address);
        await expect(vault.connect(user0).setGov(user0.address)).to.be.reverted;
        await vault.setGov(user0.address);
    });
    it("vault.func => setVaultUtils()", async () => {
        expect(await vault.vaultUtils()).to.eq(vu.address);
        await expect(vault.connect(user0).setVaultUtils(user0.address)).to.be.reverted;
        await vault.setVaultUtils(user0.address);
    });
});
