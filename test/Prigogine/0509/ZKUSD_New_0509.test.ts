import {
    ApproveAmount,
    forwardTime,
    setupFixture, toUsd
} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("ZKUSD -> YieldToken Test", async () => {
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
        dlp                 : any;

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

    it("zkusd.func => constructor", async() => {
        expect(zkusd.address).to.not.be.eq(constants.AddressZero);
        expect(await zkusd.name()).to.be.eq("ZKUSD");
        expect(await zkusd.symbol()).to.be.eq("ZKUSD");
        expect(await zkusd.gov()).to.be.eq(owner.address);
        expect(await zkusd.admins(owner.address)).to.be.eq(true);
        expect(await zkusd.totalSupply()).to.be.eq(0);
    });
    it("zkusd.func => addAdmin()", async() => {
        expect(await zkusd.admins(owner.address)).to.be.true;

        expect(await zkusd.admins(user0.address)).to.be.false;
        await expect(zkusd.connect(user0).addAdmin(user0.address)).to.be.reverted; // not admin
        await zkusd.connect(owner).addAdmin(user0.address);
        expect(await zkusd.admins(user0.address)).to.be.true;
    });
    it("zkusd.func => removeAdmin()", async() => {
        expect(await zkusd.admins(owner.address)).to.be.true;
        await expect(zkusd.connect(user0).removeAdmin(owner.address)).to.be.reverted; // not admin
        await zkusd.connect(owner).removeAdmin(owner.address);
        expect(await zkusd.admins(owner.address)).to.be.false;
    });
    it("zkusd.func => withdrawToken()", async() => {
        await expect(zkusd.connect(user0).withdrawToken(weth.address, parseEther("1"))).to.be.reverted; // not admin

        await weth.mint(owner.address, parseEther("1"));
        expect(await weth.balanceOf(owner.address)).to.be.eq(parseEther("1"));

        await weth.transfer(zkusd.address, parseEther("1"));
        await zkusd.withdrawToken(weth.address, user0.address, parseEther("1"));
        expect(await weth.balanceOf(user0.address)).to.be.eq(parseEther("1"));
        expect(await weth.balanceOf(zkusd.address)).to.be.eq(0);
        expect(await weth.balanceOf(owner.address)).to.be.eq(0);
    });
    it("zkusd.func => addNonStakingAccount", async() => {
        expect(await zkusd.admins(owner.address)).to.be.true;
        expect(await zkusd.nonStakingAccounts(owner.address)).to.be.false;
        expect(await zkusd.nonStakingAccounts(user0.address)).to.be.false;
        expect(await zkusd.nonStakingAccounts(user1.address)).to.be.false;

        await expect(zkusd.connect(user0).addNonStakingAccount(user0.address)).to.be.reverted;
        await zkusd.addNonStakingAccount(user0.address);

        expect(await zkusd.nonStakingAccounts(owner.address)).to.be.false;
        expect(await zkusd.nonStakingAccounts(user0.address)).to.be.true;
        expect(await zkusd.nonStakingAccounts(user1.address)).to.be.false;

        await expect(zkusd.addNonStakingAccount(user0.address)).to.be.revertedWith(ErrorsV2.YIELDTOKEN_ACCOUNT_ALREADY_MARKED);
    });
    it("zkusd.func => addNonStakingAccount V2", async() => {
        await OP_BASE_MLP();
        expect(await zkusd.nonStakingSupply()).to.be.eq(0);
        await zkusd.addNonStakingAccount(user0.address);
        expect(await zkusd.nonStakingAccounts(user0.address)).to.be.true;
        expect(await zkusd.nonStakingSupply()).to.be.eq(0);
    });
    it("zkusd.func => removeNonStakingAccount()", async() => {
        await zkusd.addNonStakingAccount(user0.address);
        await expect(zkusd.connect(user0).removeNonStakingAccount(user0.address)).to.be.reverted;// not admin

        expect(await zkusd.nonStakingAccounts(user0.address)).to.be.true;
        expect(await zkusd.nonStakingSupply()).to.be.eq(0);
        await zkusd.removeNonStakingAccount(user0.address);
        expect(await zkusd.nonStakingAccounts(user0.address)).to.be.false; //check nonStakingAccounts
        expect(await zkusd.nonStakingSupply()).to.be.eq(0);//check nonStakingSupply

        await expect(zkusd.removeNonStakingAccount(user0.address)).to.be.revertedWith(ErrorsV2.YIELDTOKEN_ACCOUNT_NOT_MARKED); //check revert
    });
    it("zkusd.func => recoverClaim", async() => {
        await expect(zkusd.connect(user0).recoverClaim(user0.address, user0.address)).to.be.revertedWith(ErrorsV2.YIELDTOKEN_FORBIDDEN); // not admin
        await zkusd.recoverClaim(constants.AddressZero, constants.AddressZero);
    });
    it("zkusd.func => claim", async() => {
        await expect(zkusd.claim(constants.AddressZero)).to.be.ok;
    });
    it("zkusd.func => setGov", async() => {
        expect(await zkusd.gov()).to.be.eq(owner.address);
        await expect(zkusd.connect(user0).setGov(user0.address))
            .to.be.revertedWith(ErrorsV2.YIELDTOKEN_FORBIDDEN); // not admin

        await zkusd.setGov(user0.address);
        expect(await zkusd.gov()).to.be.eq(user0.address);
        await zkusd.connect(user0).setGov(owner.address);
        expect(await zkusd.gov()).to.be.eq(owner.address);
    });
    it("zkusd.func => setInfo", async() => {
        expect(await zkusd.name()).to.be.eq("ZKUSD");
        expect(await zkusd.symbol()).to.be.eq("ZKUSD");

        await expect(zkusd.connect(user0).setInfo("ZKUSDv2", "ZKUSDv2")).to.be.reverted; // not admin
        await zkusd.setInfo("ZKUSDv2", "ZKUSDv2"); // admin
        expect(await zkusd.name()).to.be.eq("ZKUSDv2"); // check name
        expect(await zkusd.symbol()).to.be.eq("ZKUSDv2"); // check symbol
    });
    it("zkusd.func => setYieldTrackers", async() => {
        await expect(zkusd.connect(user0).setYieldTrackers([owner.address, user0.address])).to.be.revertedWith(ErrorsV2.YIELDTOKEN_FORBIDDEN); // not admin

        await zkusd.setYieldTrackers([owner.address, user0.address]);
        expect(await zkusd.yieldTrackers(0)).to.be.eq(owner.address);
        expect(await zkusd.yieldTrackers(1)).to.be.eq(user0.address);
    });
    it("zkusd.func => setInWhitelistMode", async() => {
        expect(await zkusd.inWhitelistMode()).to.be.false;

        await expect(zkusd.connect(user0).setInWhitelistMode(true)).to.be.revertedWith(ErrorsV2.YIELDTOKEN_FORBIDDEN); // not admin
        await zkusd.setInWhitelistMode(true);
        expect(await zkusd.inWhitelistMode()).to.be.true;
    });
    it("zkusd.func => setWhitelistedHandler", async() => {
        expect(await zkusd.whitelistedHandlers(owner.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user0.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user1.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user2.address)).to.be.false;

        await expect(zkusd.connect(user0).setWhitelistedHandler(user0.address, true)).to.be.revertedWith(ErrorsV2.YIELDTOKEN_FORBIDDEN); // not admin
        await zkusd.setWhitelistedHandler(user0.address, true);
        expect(await zkusd.whitelistedHandlers(owner.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user0.address)).to.be.true;
        expect(await zkusd.whitelistedHandlers(user1.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user2.address)).to.be.false;

        await zkusd.setWhitelistedHandler(user0.address, false);
        expect(await zkusd.whitelistedHandlers(owner.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user0.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user1.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user2.address)).to.be.false;
    });
    it("zkusd.func => totalStaked", async() => {
        expect(await zkusd.totalStaked()).to.be.eq(0);
        expect(await zkusd.totalSupply()).to.be.eq(0);
        expect(await zkusd.nonStakingSupply()).to.be.eq(0);
        await OP_BASE_MLP();
        expect(await zkusd.totalStaked()).to.be.eq(await zkusd.totalSupply());
        expect(await zkusd.totalStaked()).to.be.closeTo(parseEther("803460.9999"),MAX_WITHIN);
        expect(await zkusd.nonStakingSupply()).to.be.eq(0);
    });
    it("zkusd.func => balanceOf", async() => {
        expect(await zkusd.balanceOf(owner.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user0.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user1.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user2.address)).to.be.eq(0);

        await OP_BASE_MLP();

        expect(await zkusd.balanceOf(owner.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user0.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user1.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user2.address)).to.be.eq(0);

        expect(await zkusd.balanceOf(dlpManager.address)).to.be.closeTo(parseEther("803460.9999"),MAX_WITHIN);
        expect(await zkusd.totalSupply()).to.be.closeTo(parseEther("803460.9999"),MAX_WITHIN);
    });
    it("zkusd.func => stakedBalance", async() => {
        expect(await zkusd.stakedBalance(owner.address)).to.be.eq(0);
        expect(await zkusd.stakedBalance(user0.address)).to.be.eq(0);
        expect(await zkusd.stakedBalance(user1.address)).to.be.eq(0);
        expect(await zkusd.stakedBalance(user2.address)).to.be.eq(0);

        await OP_BASE_MLP();

        expect(await zkusd.stakedBalance(owner.address)).to.be.eq(0);
        expect(await zkusd.stakedBalance(user0.address)).to.be.eq(0);
        expect(await zkusd.stakedBalance(user1.address)).to.be.eq(0);
        expect(await zkusd.stakedBalance(user2.address)).to.be.eq(0);

        expect(await zkusd.stakedBalance(dlpManager.address)).to.be.closeTo(parseEther("803460.9999"),MAX_WITHIN);
        expect(await zkusd.totalStaked()).to.be.closeTo(await zkusd.stakedBalance(dlpManager.address),MAX_WITHIN);
        expect(await zkusd.totalSupply()).to.be.closeTo(parseEther("803460.9999"),MAX_WITHIN);
    });
    it("zkusd.func => stakedBalance => v2", async() => {
        await OP_BASE_MLP();
        expect(await zkusd.stakedBalance(dlpManager.address)).to.be.closeTo(parseEther("803460.9999"),MAX_WITHIN);
        await zkusd.addNonStakingAccount(dlpManager.address);
        expect(await zkusd.stakedBalance(dlpManager.address)).to.be.eq(0);
    });
    it("zkusd.func => transfer", async() => {
        expect(await zkusd.vaults(owner.address)).to.be.false;
        await expect(zkusd.mint(owner.address, parseEther("100"))).to.be.revertedWith(ErrorsV2.ZKUSD_FORBIDDEN); // not vault

        await zkusd.addVault(owner.address);
        expect(await zkusd.vaults(owner.address)).to.be.true;
        await zkusd.mint(owner.address, parseEther("100")); // vault = owner

        expect(await zkusd.balanceOf(owner.address)).to.be.eq(parseEther("100"));
        expect(await zkusd.totalSupply()).to.be.eq(parseEther("100"));

        await zkusd.transfer(user0.address, parseEther("100"));
        expect(await zkusd.balanceOf(owner.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user0.address)).to.be.eq(parseEther("100"));
        expect(await zkusd.totalSupply()).to.be.eq(parseEther("100"));
    });
    it("zkusd.func => approve + allowance", async() => {
        // console.log(`zkusd.allowance: ${formatEther(await zkusd.allowance(user0.address, dlpManager.address))}`);
        expect(await zkusd.allowance(user0.address, dlpManager.address)).to.be.eq(0);
        await zkusd.connect(user0).approve(dlpManager.address, parseEther("100"));
        // console.log(`zkusd.allowance: ${formatEther(await zkusd.allowance(user0.address, dlpManager.address))}`);
        expect(await zkusd.allowance(user0.address, dlpManager.address)).to.be.eq(parseEther("100"));
    });
    it("zkusd.func => transferFrom", async() => {
        await zkusd.addVault(owner.address);
        await zkusd.connect(owner).mint(owner.address, parseEther("100")); // vault = owner
        expect(await zkusd.balanceOf(owner.address)).to.be.eq(parseEther("100"));

        await zkusd.connect(owner).approve(owner.address, ApproveAmount);
        await zkusd.connect(owner).transferFrom(owner.address, user0.address, parseEther("100"));

        expect(await zkusd.balanceOf(dlpManager.address)).to.be.eq(0);
        expect(await zkusd.balanceOf(user0.address)).to.be.eq(parseEther("100"));
    });
});

describe("ZKUSD -> YieldTokenStorage Test", async () => {
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
        dlp                 : any;

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

    it("zkusd.parameters => name", async() => {
        expect(zkusd.address).to.not.be.eq(constants.AddressZero);
        expect(await zkusd.name()).to.be.eq("ZKUSD");
        expect(await zkusd.symbol()).to.be.eq("ZKUSD");
        expect(await zkusd.decimals()).to.be.eq(18);
        expect(await zkusd.totalSupply()).to.be.eq(0);
    });
    it("zkusd.parameters => nonStakingSupply", async() => {
        expect(await zkusd.nonStakingSupply()).to.be.eq(0);
        expect(await zkusd.inWhitelistMode()).to.be.eq(false);
        expect(await zkusd.gov()).to.be.eq(owner.address);
    });
    it("zkusd.parameters => balances", async() => {
        expect(await zkusd.balances(owner.address)).to.be.eq(0);
        expect(await zkusd.balances(user0.address)).to.be.eq(0);
        expect(await zkusd.balances(user1.address)).to.be.eq(0);
        expect(await zkusd.balances(dlpManager.address)).to.be.eq(0);
        await OP_BASE_MLP();

        expect(await zkusd.balances(owner.address)).to.be.eq(0);
        expect(await zkusd.balances(user0.address)).to.be.eq(0);
        expect(await zkusd.balances(user1.address)).to.be.eq(0);
        expect(await zkusd.balances(dlpManager.address)).to.be.gt(0);
    });
    it("zkusd.parameters => nonStakingAccounts", async() => {
        expect(await zkusd.nonStakingAccounts(owner.address)).to.be.eq(false);
        expect(await zkusd.nonStakingAccounts(user0.address)).to.be.eq(false);
        expect(await zkusd.nonStakingAccounts(user1.address)).to.be.eq(false);
        expect(await zkusd.nonStakingAccounts(dlpManager.address)).to.be.eq(false);

        await zkusd.addNonStakingAccount(dlpManager.address);

        expect(await zkusd.nonStakingAccounts(owner.address)).to.be.false;
        expect(await zkusd.nonStakingAccounts(user0.address)).to.be.false;
        expect(await zkusd.nonStakingAccounts(user1.address)).to.be.false;
        expect(await zkusd.nonStakingAccounts(dlpManager.address)).to.be.true;
    });
    it("zkusd.parameters => admins", async() => {
        expect(await zkusd.admins(owner.address)).to.be.true;
        expect(await zkusd.admins(user0.address)).to.be.false;
        expect(await zkusd.admins(user1.address)).to.be.false;

        await zkusd.addAdmin(user0.address);

        expect(await zkusd.admins(owner.address)).to.be.true;
        expect(await zkusd.admins(user0.address)).to.be.true;
        expect(await zkusd.admins(user1.address)).to.be.false;
    });
    it("zkusd.parameters => whitelist", async() => {
        expect(await zkusd.whitelistedHandlers(owner.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user0.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user1.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(dlpManager.address)).to.be.false;

        await zkusd.setWhitelistedHandler(dlpManager.address, true);
        expect(await zkusd.whitelistedHandlers(owner.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user0.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(user1.address)).to.be.false;
        expect(await zkusd.whitelistedHandlers(dlpManager.address)).to.be.true;
    });
});
