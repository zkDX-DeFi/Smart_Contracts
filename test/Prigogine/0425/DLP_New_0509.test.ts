import {
    ApproveAmount,
    forwardTime,
    setupFixture, toUsd
} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("DLP -> DLP Test", async () => {
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

    it("dlp.func => constructor", async () => {
        expect(dlp.address).to.not.eq(constants.AddressZero);
        expect(await dlp.name()).to.eq("ZKDLP");
        expect(await dlp.symbol()).to.eq("ZKDLP");
        expect(await dlp.id()).to.be.eq("ZKDLP");
        expect(await dlp.gov()).to.be.eq(owner.address);
        expect(await dlp.totalSupply()).to.be.eq(0);
    });
    it("dlp.func => isMinter()", async () => {
        expect(await dlp.isMinter(dlpManager.address)).to.be.true;
        expect(await dlp.isMinter(user0.address)).to.be.false;
        expect(await dlp.isMinter(user1.address)).to.be.false;
        expect(await dlp.isMinter(owner.address)).to.be.false;
        expect(await dlp.isMinter(router.address)).to.be.false;
        expect(await dlp.isMinter(rewardRouter.address)).to.be.false;
    });
    it("dlp.func => setMinter()", async () => {
        await expect(dlp.connect(user0).setMinter(user0.address, true)).to.be.reverted; //!gov

        await dlp.setMinter(dlpManager.address, false);
        expect(await dlp.isMinter(dlpManager.address)).to.be.false;

        await dlp.setMinter(dlpManager.address, true);
        expect(await dlp.isMinter(dlpManager.address)).to.be.true;
    });
    it("dlp.func => mint()", async () => {
        await expect(dlp.connect(user0).mint(user0.address, parseEther("1"))).to.be.reverted; //!minter
        await expect(dlp.mint(user0.address, parseEther("1"))).to.be.reverted; //!minter

        expect(await dlp.isMinter(owner.address)).to.be.false;
        await dlp.setMinter(owner.address, true);
        expect(await dlp.isMinter(owner.address)).to.be.true;

        expect(await dlp.totalSupply()).to.be.eq(0);
        await expect(dlp.mint(user0.address, parseEther("1"))).to.be.ok;
        expect(await dlp.totalSupply()).to.be.eq(parseEther("1"));
        expect(await dlp.balanceOf(user0.address)).to.be.eq(parseEther("1"));
    });
    it("dlp.func => burn()", async () => {
        await expect(dlp.connect(user0).burn(user0.address, parseEther("1"))).to.be.reverted; //!minter
        await expect(dlp.burn(user0.address, parseEther("1"))).to.be.reverted; //!minter

        await dlp.setMinter(owner.address, true);
        await dlp.mint(user0.address, parseEther("1"));

        expect(await dlp.totalSupply()).to.be.eq(parseEther("1"));
        expect(await dlp.balanceOf(user0.address)).to.be.eq(parseEther("1"));
        await expect(dlp.burn(user0.address, parseEther("1"))).to.be.ok;
        expect(await dlp.totalSupply()).to.be.eq(0);
        expect(await dlp.balanceOf(user0.address)).to.be.eq(0);
    });
});

describe("DLP -> BaseToken Test", async () => {
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

    it("dlp.parameters => name", async () => {
        expect(dlp.address).to.not.eq(constants.AddressZero);
        expect(await dlp.name()).to.eq("ZKDLP");
        expect(await dlp.symbol()).to.eq("ZKDLP");
        expect(await dlp.decimals()).to.eq(18);
        expect(await dlp.totalSupply()).to.eq(0);
        expect(await dlp.nonStakingSupply()).to.be.eq(0);
        expect(await dlp.gov()).to.be.eq(owner.address);
    });
    it("dlp.parameters => balances", async () => {
        await OP_BASE_MLP();

        expect(await dlp.totalSupply()).to.be.closeTo(parseEther("803460.9999"), MAX_WITHIN);
        expect(await dlp.nonStakingSupply()).to.be.eq(0);
    });
    it("dlp.parameters => admins", async () => {
        await OP_BASE_MLP();

        expect(await dlp.admins(owner.address)).to.be.false;
        expect(await dlp.admins(user0.address)).to.be.false;
        expect(await dlp.admins(user1.address)).to.be.false;
        expect(await dlp.admins(user2.address)).to.be.false;
    });
    it("dlp.func => setGov()", async () => {
        expect(await dlp.gov()).to.be.eq(owner.address);

        await expect(dlp.connect(user0).setGov(user0.address)).to.be.reverted;//!gov
        await dlp.setGov(user0.address);
        expect(await dlp.gov()).to.be.eq(user0.address);

        await expect(dlp.connect(owner).setGov(constants.AddressZero)).to.be.reverted;//!gov
        await dlp.connect(user0).setGov(owner.address);
        expect(await dlp.gov()).to.be.eq(owner.address);
    });
    it("dlp.func => setInfo()", async () => {
        expect(await dlp.name()).to.be.eq("ZKDLP");
        expect(await dlp.symbol()).to.be.eq("ZKDLP");

        await expect(dlp.connect(user0).setInfo("ZKDLP", "ZKDLP")).to.be.reverted;//!gov

        await dlp.setInfo("ZKDLPv2", "ZKDLPv2");
        expect(await dlp.name()).to.be.eq("ZKDLPv2");
        expect(await dlp.symbol()).to.be.eq("ZKDLPv2");
    });
    it("dlp.func => setYieldTrackers()", async () => {
        await expect(dlp.connect(user0).setYieldTrackers([owner.address, user0.address, user1.address])).to.be.reverted;//!gov
        await dlp.setYieldTrackers([owner.address, user0.address, user1.address]);

        expect(await dlp.yieldTrackers(0)).to.be.eq(owner.address);
        expect(await dlp.yieldTrackers(1)).to.be.eq(user0.address);
        expect(await dlp.yieldTrackers(2)).to.be.eq(user1.address);
    });
    it("dlp.func => addAdmin()", async () => {
        expect(await dlp.admins(owner.address)).to.be.false;
        expect(await dlp.admins(user0.address)).to.be.false;

        await expect(dlp.connect(user0).addAdmin(owner.address)).to.be.reverted;//!gov
        await dlp.addAdmin(owner.address);
        expect(await dlp.admins(owner.address)).to.be.true;
        expect(await dlp.admins(user0.address)).to.be.false;
    });
    it("dlp.func => removeAdmin()", async () => {
        await dlp.addAdmin(owner.address);
        await dlp.addAdmin(user0.address);

        await expect(dlp.connect(user0).removeAdmin(owner.address)).to.be.reverted;//!gov
        await dlp.removeAdmin(owner.address);
        expect(await dlp.admins(owner.address)).to.be.false;
        expect(await dlp.admins(user0.address)).to.be.true;
    });
    it("dlp.func => setInPrivateTransferMode()", async () => {
        expect(await dlp.inPrivateTransferMode()).to.be.false;
        await expect(dlp.connect(user0).setInPrivateTransferMode(true)).to.be.reverted;//!gov

        await dlp.setInPrivateTransferMode(true);
        expect(await dlp.inPrivateTransferMode()).to.be.true;
        await dlp.setInPrivateTransferMode(false);
        expect(await dlp.inPrivateTransferMode()).to.be.false;
    });
    it("dlp.func => setHandler", async () => {
        await expect(dlp.connect(user0).setHandler(user0.address)).to.be.reverted;//!gov
        expect(await dlp.isHandler(dlpManager.address)).to.be.false;
        expect(await dlp.isHandler(owner.address)).to.be.false;
        expect(await dlp.isHandler(user0.address)).to.be.false;
        expect(await dlp.isHandler(pm.address)).to.be.false;

        await dlp.setHandler(user0.address,true);
        expect(await dlp.isHandler(user0.address)).to.be.true;
        await dlp.setHandler(user0.address,false);
        expect(await dlp.isHandler(user0.address)).to.be.false;
    });
    it("dlp.func => addNonStakingAccount()", async () => {
        expect(await dlp.nonStakingAccounts(owner.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user0.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user1.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user2.address)).to.be.false;
        expect(await dlp.nonStakingSupply()).to.be.eq(0);

        await OP_BASE_MLP();

        expect(await dlp.nonStakingAccounts(owner.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user0.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user1.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user2.address)).to.be.false;
        expect(await dlp.nonStakingSupply()).to.be.eq(0);

        await expect(dlp.connect(user0).addNonStakingAccount(user0.address)).to.be.reverted;//!gov
        await dlp.addAdmin(owner.address);
        await dlp.addNonStakingAccount(user0.address);

        expect(await dlp.nonStakingAccounts(owner.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user0.address)).to.be.true;
        expect(await dlp.nonStakingAccounts(user1.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user2.address)).to.be.false;
        expect(await dlp.nonStakingSupply()).to.be.gt(0);

        expect(await dlp.nonStakingSupply()).to.be.eq(parseEther("100450.0"));
    });
    it("dlp.func => removeNonStakingAccount()", async () => {
        await OP_BASE_MLP();
        await dlp.addAdmin(owner.address);
        await dlp.addNonStakingAccount(user0.address);

        expect(await dlp.nonStakingSupply()).to.be.eq(parseEther("100450.0"));
        await expect(dlp.connect(user0).removeNonStakingAccount(user0.address)).to.be.reverted;//!gov
        await dlp.removeNonStakingAccount(user0.address);

        expect(await dlp.nonStakingAccounts(owner.address)).to.be.false;
        expect(await dlp.nonStakingAccounts(user0.address)).to.be.false;
        expect(await dlp.nonStakingSupply()).to.be.eq(0);
    });
    it("dlp.func => recoverClaim()", async () => {
        await expect(dlp.connect(user0).recoverClaim(constants.AddressZero,constants.AddressZero)).to.be.reverted;//!gov
    });
    it("dlp.func => claim()", async() => {
        await dlp.claim(constants.AddressZero);
    });
    it("dlp.func => totalStaked() + balanceOf", async () => {
        expect(await dlp.totalStaked()).to.be.eq(0);
        await OP_BASE_MLP();
        expect(await dlp.totalStaked()).to.be.closeTo(parseEther("803460.9999"), MAX_WITHIN);

        expect(await dlp.balanceOf(user0.address)).to.be.closeTo(parseEther("100450.0"), MAX_WITHIN);
        expect(await dlp.balanceOf(user1.address)).to.be.closeTo(parseEther("200840.0"), MAX_WITHIN);
        expect(await dlp.balanceOf(user2.address)).to.be.closeTo(parseEther("100371.0"), MAX_WITHIN);
    });
    it("dlp.func => stakedBalance()", async () => {
        await OP_BASE_MLP();
        expect(await dlp.totalStaked()).to.be.closeTo(parseEther("803460.9999"), MAX_WITHIN);
        expect(await dlp.stakedBalance(user0.address)).to.be.closeTo(parseEther("100450.0"), MAX_WITHIN);
        expect(await dlp.stakedBalance(user1.address)).to.be.closeTo(parseEther("200840.0"), MAX_WITHIN);
        expect(await dlp.stakedBalance(user2.address)).to.be.closeTo(parseEther("100371.0"), MAX_WITHIN);

        /* dlp.addAdmin */
        expect(await dlp.stakedBalance(owner.address)).to.be.closeTo(parseEther("401799.9999"), MAX_WITHIN);
        expect(await dlp.balanceOf(owner.address)).to.be.closeTo(parseEther("401799.9999"), MAX_WITHIN);
        await dlp.addAdmin(owner.address);
        await dlp.addNonStakingAccount(owner.address);
        expect(await dlp.stakedBalance(owner.address)).to.be.eq(0);
        expect(await dlp.balanceOf(owner.address)).to.be.closeTo(parseEther("401799.9999"), MAX_WITHIN);
    });
    it("dlp.func => transfer()", async() => {
        await OP_BASE_MLP();
        expect(await dlp.totalStaked()).to.be.closeTo(parseEther("803460.9999"), MAX_WITHIN);
        await dlp.transfer(user0.address, parseEther("100.0"));
        await expect(dlp.transfer(user0.address, parseEther("900001.0"))).to.be.reverted;//!not enough
    });
    it("dlp.func => allowance()", async() => {
        await OP_BASE_MLP();
        expect(await dlp.allowance(owner.address, dlpManager.address)).to.be.eq(0);

        await dlp.approve(dlpManager.address, parseEther("100.0"));
        expect(await dlp.allowance(owner.address, dlpManager.address)).to.be.eq(parseEther("100.0"));
    });
    it("dlp.func => transferFrom()", async() => {
        await OP_BASE_MLP();
        expect(await dlp.isHandler(owner.address)).to.be.false;
        await dlp.approve(owner.address,parseEther("100.0"));
        await dlp.transferFrom(owner.address, user0.address, parseEther("100.0"));
    });
    it("dlp.func => transferFrom() + isHandler", async() => {
        await OP_BASE_MLP();
        expect(await dlp.isHandler(owner.address)).to.be.false;
        await dlp.setHandler(owner.address,true);
        expect(await dlp.isHandler(owner.address)).to.be.true;
        await dlp.connect(owner).transferFrom(user0.address, user1.address, parseEther("100.0"));
    });
});
