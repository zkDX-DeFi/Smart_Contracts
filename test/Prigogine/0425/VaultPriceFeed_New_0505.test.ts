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
describe("VaultPriceFeed -> VaultPriceFeed Test", async () => {
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
        vu                  : any;

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

    it("feed.func => constructor", async () => {
        expect(feed.address).to.not.eq(constants.AddressZero);
        expect(await feed.pyth()).to.be.not.eq(constants.AddressZero);
        expect(await feed.validTime()).to.be.eq(3);
        expect(await feed.gov()).to.be.eq(owner.address);

        console.log(`feed.pyth: ${await feed.pyth()}`);
    });
    it("feed.func => getPrice()", async () => {
        await OP_BASE_MLP();
        expect(await feed.getPrice(weth.address, true,true,true)).to.be.eq(parseUnits("1500",30));
        expect(await feed.getPrice(weth.address, true,false,true)).to.be.eq(parseUnits("1500",30));
        expect(await feed.getPrice(weth.address, false,true,true)).to.be.eq(parseUnits("1500",30));
        expect(await feed.getPrice(weth.address, false,false,true)).to.be.eq(parseUnits("1500",30));
    });
    it("feed.func => getPrice() => dai", async () => {
        await OP_BASE_MLP();
        expect(await feed.getPrice(dai.address, true,true,true)).to.be.eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address, true,false,true)).to.be.eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address, false,true,true)).to.be.eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address, false,false,true)).to.be.eq(parseUnits("1",30));

        expect(await feed.getPrice(wbtc.address, true,true,true)).to.be.eq(parseUnits("28000",30));
        expect(await feed.getPrice(wbtc.address, true,false,true)).to.be.eq(parseUnits("28000",30));
        expect(await feed.getPrice(wbtc.address, false,true,true)).to.be.eq(parseUnits("28000",30));
        expect(await feed.getPrice(wbtc.address, false,false,true)).to.be.eq(parseUnits("28000",30));
    });
    it("feed.func => latestTime()", async () => {
        await OP_BASE_MLP();
        expect(await feed.latestTime(weth.address)).to.be.not.eq(0);
        await expect(feed.latestTime(dai.address)).to.be.reverted;
        expect(await feed.latestTime(wbtc.address)).to.be.not.eq(0);
    });
    it("feed.func => getUpdateFee()", async () => {
        await OP_BASE_MLP();
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        expect(await feed.getUpdateFee(updateData)).to.be.eq(fee);

        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth']);
        expect(await feed.getUpdateFee(updateData2)).to.be.eq(fee2);
    });
    it("feed.func => setPyth()", async () => {
        expect(await feed.gov()).to.be.eq(owner.address);
        expect(await feed.pyth()).to.be.not.eq(constants.AddressZero);
        await expect(feed.connect(user0).setPyth(constants.AddressZero)).to.be.reverted; // not gov

        await feed.setPyth(constants.AddressZero); //gov
        expect(await feed.pyth()).to.be.eq(constants.AddressZero);
    });
    it("feed.func => setValidTime()", async () => {
        expect(await feed.validTime()).to.be.eq(3);

        expect(await feed.gov()).to.be.eq(owner.address);
        await expect(feed.connect(user0).setValidTime(0)).to.be.reverted; // not gov

        await feed.setValidTime(0); //gov
        expect(await feed.validTime()).to.be.eq(0);
    });
    it("feed.func => setFeedIds()", async () => {
        await expect(feed.connect(user0).setFeedIds([],[])).to.be.reverted; // not gov

        await feed.setFeedIds([], []); //gov
    });
    it("feed.func => setGov()", async () => {
        expect(await feed.gov()).to.be.eq(owner.address);
        await expect(feed.connect(user0).setGov(user0.address)).to.be.reverted; // not gov

        await feed.setGov(user0.address); //gov
        expect(await feed.gov()).to.be.eq(user0.address);
    });
    it("feed.params => feedIds()", async () => {
        expect(await feed.feedIds(weth.address)).to.be.not.eq(constants.AddressZero);
        expect(await feed.feedIds(dai.address)).to.be.not.eq(constants.AddressZero);
        expect(await feed.feedIds(wbtc.address)).to.be.not.eq(constants.AddressZero);
    });
});
