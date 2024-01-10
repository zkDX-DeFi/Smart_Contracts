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
describe("Vault -> VaultStorage Test", async () => {
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
        vaultErrorController    : any;

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

    it("VaultStorage.Parameters => gov + isInitialized", async () => {
        await OP_BASE_LONG_SHORT();

        expect(await v.gov()).to.be.eq(timelock.address);
        expect(await v.isInitialized()).to.be.true;
        expect(await v.router()).to.be.eq(router.address);
        expect(await v.zkusd()).to.be.eq(zkusd.address);
        expect(await v.priceFeed()).to.be.eq(feed.address);
    });
    it("VaultStorage.Parameters => liquidationFeeUsd", async () => {
        expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("0",30));
        expect(await v.fundingRateFactor()).to.be.eq(100);
        expect(await v.stableFundingRateFactor()).to.be.eq(100);

        await OP_BASE_LONG_SHORT();
        await OP_BASE_MLP();

        expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("0",30));
        expect(await v.fundingRateFactor()).to.be.eq(100);
        expect(await v.stableFundingRateFactor()).to.be.eq(100);
    });
    it("VaultStorage.Parameters => liquidationFeeUsd", async () => {
        await printVault_Pool_Reserved(v,weth,dai,wbtc);
        expect(await v.poolAmounts(weth.address)).to.be.eq(0);
        expect(await v.poolAmounts(dai.address)).to.be.eq(0);
        expect(await v.poolAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.reservedAmounts(weth.address)).to.be.eq(0);
        expect(await v.reservedAmounts(dai.address)).to.be.eq(0);
        expect(await v.reservedAmounts(wbtc.address)).to.be.eq(0);

        await OP_BASE_MLP();

        await printVault_Pool_Reserved(v,weth,dai,wbtc);
        expect(await v.poolAmounts(weth.address)).to.be.gt(0);
        expect(await v.poolAmounts(dai.address)).to.be.gt(0);
        expect(await v.poolAmounts(wbtc.address)).to.be.gt(0);
        expect(await v.reservedAmounts(weth.address)).to.be.eq(0);
        expect(await v.reservedAmounts(dai.address)).to.be.eq(0);
        expect(await v.reservedAmounts(wbtc.address)).to.be.eq(0);
    });
    it("VaultStorage.Parameters => poolAmounts + reservedAmounts v2", async () => {
        await printVault_Pool_Reserved(v,weth,dai,wbtc);
        expect(await v.poolAmounts(weth.address)).to.be.eq(0);
        expect(await v.poolAmounts(dai.address)).to.be.eq(0);
        expect(await v.poolAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.reservedAmounts(weth.address)).to.be.eq(0);
        expect(await v.reservedAmounts(dai.address)).to.be.eq(0);
        expect(await v.reservedAmounts(wbtc.address)).to.be.eq(0);

        await OP_BASE_LONG_SHORT();

        await printVault_Pool_Reserved(v,weth,dai,wbtc);

        expect(await v.poolAmounts(weth.address)).to.be.gt(0);
        expect(await v.poolAmounts(dai.address)).to.be.gt(0);
        expect(await v.poolAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.reservedAmounts(weth.address)).to.be.gt(0);
        expect(await v.reservedAmounts(dai.address)).to.be.gt(0);
        expect(await v.reservedAmounts(wbtc.address)).to.be.eq(0);
    });
    it("vs.parameters => maxLeverage", async () => {
        expect(await v.maxLeverage()).to.be.eq(100 * 10000); // 50x
        expect(await v.taxBasisPoints()).to.be.eq(0); // 0.5%
        expect(await v.stableTaxBasisPoints()).to.be.eq(0); // 0.2%

        expect(await v.mintBurnFeeBasisPoints()).to.be.eq(0); // 0.3%
        expect(await v.swapFeeBasisPoints()).to.be.eq(0); // 0.3%
        expect(await v.stableSwapFeeBasisPoints()).to.be.eq(0); // 0.04%
        expect(await v.marginFeeBasisPoints()).to.be.eq(500); // 0.1%

        expect(await v.fundingInterval()).to.be.eq(3600); // 1 hour
    });
    it("vs.parameters => whitelistedTokenCount", async () => {
        expect(await v.whitelistedTokenCount()).to.be.eq(5);
        expect(await v.whitelistedTokens(dai.address)).to.be.true;
        expect(await v.whitelistedTokens(weth.address)).to.be.true;
        expect(await v.whitelistedTokens(wbtc.address)).to.be.true;
        expect(await v.whitelistedTokens(zkusd.address)).to.be.false;
        expect(await v.whitelistedTokens(zkdlp.address)).to.be.false;
    });
    it("vs.parameters => maxGasPrice", async () => {
        expect(await v.maxGasPrice()).to.be.eq(0);
        expect(await v.minProfitTime()).to.be.eq(3600);

        expect(await v.isSwapEnabled()).to.be.true;
        expect(await v.isLeverageEnabled()).to.be.true;
        expect(await v.hasDynamicFees()).to.be.false;
        expect(await v.inManagerMode()).to.be.false;
        expect(await v.inPrivateLiquidationMode()).to.be.true;
    });
    it("vs.parameters => vaultUtils + errorController", async () => {
        expect(await v.vaultUtils()).to.be.eq(vaultUtils.address);
        expect(await v.errorController()).to.be.eq(vaultErrorController.address);
    });
    it("vs.parameters => tokenDecimals", async () => {
        expect(await v.tokenDecimals(weth.address)).to.be.eq(18);
        expect(await v.tokenDecimals(dai.address)).to.be.eq(18);
        expect(await v.tokenDecimals(wbtc.address)).to.be.eq(8);
    });
    it("vs.parameters => tokenBalances", async () => {
       expect(await v.tokenBalances(weth.address)).to.be.eq(0);
       expect(await v.tokenBalances(dai.address)).to.be.eq(0);
       expect(await v.tokenBalances(wbtc.address)).to.be.eq(0);

        await OP_BASE_LONG_SHORT();

        expect(await v.tokenBalances(weth.address)).to.be.gt(0);
        expect(await v.tokenBalances(dai.address)).to.be.gt(0);
        expect(await v.tokenBalances(wbtc.address)).to.be.eq(0); //no wbtc in base
    });
    it("vs.Parameters => tokenBalances V2", async () => {
        expect(await v.tokenBalances(weth.address)).to.be.eq(0);
        expect(await v.tokenBalances(dai.address)).to.be.eq(0);
        expect(await v.tokenBalances(wbtc.address)).to.be.eq(0);

        await OP_BASE_MLP();

        expect(await v.tokenBalances(weth.address)).to.be.gt(0);
        expect(await v.tokenBalances(dai.address)).to.be.gt(0);
        expect(await v.tokenBalances(wbtc.address)).to.be.gt(0); //wbtc in mlp buy && sell
    });
    it("vs.Parameters => tokenWeights ", async () => {
        expect(await v.tokenWeights(weth.address)).to.be.eq(10000);
        expect(await v.tokenWeights(dai.address)).to.be.eq(10000);
        expect(await v.tokenWeights(wbtc.address)).to.be.eq(10000);
        expect(await v.totalTokenWeights()).to.be.eq(50000);

        await OP_BASE_MLP();

        expect(await v.tokenWeights(weth.address)).to.be.eq(10000);
        expect(await v.tokenWeights(dai.address)).to.be.eq(10000);
        expect(await v.tokenWeights(wbtc.address)).to.be.eq(10000);
        expect(await v.totalTokenWeights()).to.be.eq(50000);
    });
    it("vs.Parameters => allWhitelistedTokens", async () => {
        expect(await v.allWhitelistedTokens(0)).to.be.eq(weth.address);
        expect(await v.allWhitelistedTokens(1)).to.be.eq(wbtc.address);
        expect(await v.allWhitelistedTokens(2)).to.be.not.eq(constants.AddressZero);

        expect(await v.whitelistedTokens(weth.address)).to.be.true;
        expect(await v.whitelistedTokens(wbtc.address)).to.be.true;
        expect(await v.whitelistedTokens(dai.address)).to.be.true;
    });
    it("vs.Parameters => zkusdAmounts", async () => {
        expect(await zkusd.totalSupply()).to.be.eq(0);
        await OP_BASE_MLP();

        expect(await v.zkusdAmounts(owner.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(user0.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(user1.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(dlpManager.address)).to.be.eq(0);
        expect(await zkusd.totalSupply()).to.be.closeTo(parseEther("803460.9999"), MAX_WITHIN);
    });
    it("vs.Parameters => zkusdAmounts v2", async () => {
        expect(await v.zkusdAmounts(weth.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(dai.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(wbtc.address)).to.be.eq(0);
        expect(await zkusd.totalSupply()).to.be.eq(0);

        await OP_BASE_MLP();

        expect(await v.zkusdAmounts(weth.address)).to.be.gt(0);
        expect(await v.zkusdAmounts(dai.address)).to.be.gt(0);
        expect(await v.zkusdAmounts(wbtc.address)).to.be.gt(0);
        expect(await v.zkusdAmounts(zkdlp.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(zkusd.address)).to.be.eq(0);


        console.log(`zkusdAmounts(weth) = ${formatEther(await v.zkusdAmounts(weth.address))}`);
        console.log(`zkusdAmounts(dai) = ${formatEther(await v.zkusdAmounts(dai.address))}`);
        console.log(`zkusdAmounts(wbtc) = ${formatEther(await v.zkusdAmounts(wbtc.address))}`);

        expect(await v.zkusdAmounts(weth.address)).to.be.closeTo(parseEther("502249.9999"), MAX_WITHIN);
        expect(await v.zkusdAmounts(dai.address)).to.be.closeTo(parseEther("100370.9999"), MAX_WITHIN);
        expect(await v.zkusdAmounts(wbtc.address)).to.be.closeTo(parseEther("200839.9999"), MAX_WITHIN);
    });
    it("vs.parameters => maxZkusdAmounts", async () => {
        expect(await v.maxZkusdAmounts(weth.address)).to.be.gt(0);
        expect(await v.maxZkusdAmounts(dai.address)).to.be.eq(parseEther("0")); //0
        expect(await v.maxZkusdAmounts(wbtc.address)).to.be.gt(0);
        expect(await v.maxZkusdAmounts(zkdlp.address)).to.be.eq(parseEther("0")); //0
        expect(await v.maxZkusdAmounts(zkusd.address)).to.be.eq(parseEther("0")); //0

        await OP_BASE_MLP();

        expect(await v.maxZkusdAmounts(weth.address)).to.be.gt(0);
        expect(await v.maxZkusdAmounts(dai.address)).to.be.eq(parseEther("0")); //0
        expect(await v.maxZkusdAmounts(wbtc.address)).to.be.gt(0);
        expect(await v.maxZkusdAmounts(zkdlp.address)).to.be.eq(parseEther("0")); //0
        expect(await v.maxZkusdAmounts(zkusd.address)).to.be.eq(parseEther("0")); //0
    });
});

describe("Vault -> VaultSettings Test", async () => {
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
        vaultErrorController    : any;

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

    it("v.Parameters => gov", async () => {
        expect(await v.gov()).to.be.eq(timelock.address);
        expect(v.address).to.not.eq(constants.AddressZero);
    });
    it("v.func => setVaultUtils", async () => {
        expect(await v.vaultUtils()).to.be.eq(vaultUtils.address);
        await expect(v.connect(user0).setVaultUtils(vaultUtils.address)).to.be.reverted;//!gov
        expect(await v.gov()).to.be.eq(timelock.address);
        await expect(v.connect(owner).setVaultUtils(user0.address)).to.be.reverted; //!gov
    });
    it("v.func => setErrorController", async () => {
        expect(await v.errorController()).to.be.eq(vaultErrorController.address);
        await expect(v.connect(user0).setErrorController(vaultErrorController.address)).to.be.reverted;//!gov
        await expect(v.connect(owner).setErrorController(user0.address)).to.be.reverted;//!gov
    });
    it("v.func => setError", async () => {
        expect(await v.errors(0)).to.be.eq("Vault: zero error");
        expect(await v.errors(1)).to.be.eq("Vault: already initialized");
        expect(await v.errors(55)).to.be.eq("Vault: maxGasPrice exceeded");
        expect(await v.errors(56)).to.be.eq("");
        expect(await v.errors(57)).to.be.eq("");


        await expect(v.connect(user0).setError(55, "Vault: maxGasPrice exceeded")).to.be.reverted;//!gov
        await expect(v.connect(owner).setError(55, "Vault: maxGasPrice exceeded")).to.be.reverted;//!gov
    });
    it("v.func => setInManagerMode", async () => {
        expect(await v.inManagerMode()).to.be.eq(false);
        await expect(v.connect(user0).setInManagerMode(true)).to.be.reverted;//!gov
        await expect(v.connect(owner).setInManagerMode(true)).to.be.reverted;//!gov
    });
    it("v.func => setManager", async () => {
        expect(await v.isManager(user0.address)).to.be.eq(false);
        expect(await v.isManager(timelock.address)).to.be.eq(false);

        await expect(v.connect(user0).setManager(user0.address,true)).to.be.reverted;//!gov
        await expect(v.connect(owner).setManager(user0.address,true)).to.be.reverted;//!gov
    });
    it("v.func => setInPrivateLiquidationMode", async () => {
        expect(await v.inPrivateLiquidationMode()).to.be.eq(true);

        await expect(v.connect(user0).setInPrivateLiquidationMode(true)).to.be.reverted;//!gov
        await expect(v.connect(owner).setInPrivateLiquidationMode(true)).to.be.reverted;//!gov
    });
    it("v.func => setLiquidator", async () => {
        expect(await v.isLiquidator(pm.address)).to.be.eq(true);
        expect(await v.isLiquidator(owner.address)).to.be.eq(false);
        expect(await v.isLiquidator(user0.address)).to.be.eq(false);
        expect(await v.isLiquidator(user1.address)).to.be.eq(false);

        await expect(v.connect(user0).setLiquidator(pm.address,true)).to.be.reverted;//!gov
        await expect(v.connect(owner).setLiquidator(pm.address,true)).to.be.reverted;//!gov
    });
    it("v.func => setIsSwapEnabled", async () => {
        expect(await v.isSwapEnabled()).to.be.eq(true);

        await expect(v.connect(user0).setIsSwapEnabled(false)).to.be.reverted;//!gov
        await expect(v.connect(owner).setIsSwapEnabled(false)).to.be.reverted;//!gov
    });
    it("v.func => setIsLeverageEnabled", async () => {
        expect(await v.isLeverageEnabled()).to.be.eq(true);

        await expect(v.connect(user0).setIsLeverageEnabled(false)).to.be.reverted;//!gov
        await expect(v.connect(owner).setIsLeverageEnabled(false)).to.be.reverted;//!gov
    });
    it("v.func => setMaxGasPrice", async () => {
        expect(await v.maxGasPrice()).to.be.eq(0);

        await expect(v.connect(user0).setMaxGasPrice(100)).to.be.reverted;//!gov
        await expect(v.connect(owner).setMaxGasPrice(100)).to.be.reverted;//!gov
    });
    it("v.func => setGov", async () => {
        expect(await v.gov()).to.be.eq(timelock.address);

        await expect(v.connect(user0).setGov(user0.address)).to.be.reverted;//!gov
        await expect(v.connect(owner).setGov(user0.address)).to.be.reverted;//!gov
    });
    it("v.func => setPriceFeed", async () => {
        expect(await v.priceFeed()).to.be.eq(feed.address);

        await expect(v.connect(user0).setPriceFeed(user0.address)).to.be.reverted;//!gov
        await expect(v.connect(owner).setPriceFeed(user0.address)).to.be.reverted;//!gov
    });
    it("v.func => setMaxLeverage", async () => {
        expect(await v.maxLeverage()).to.be.eq(100 * 10000);
        await expect(v.connect(user0).setMaxLeverage(10)).to.be.reverted;//!gov
        await expect(v.connect(owner).setMaxLeverage(10)).to.be.reverted;//!gov
    });

    it("v.func => setBufferAmounts", async () => {
        splitterTitle("setBufferAmounts");
        await expect(v.connect(user0).setBufferAmount(weth.address, 100)).to.be.reverted;//!gov
        await expect(v.connect(owner).setBufferAmount(weth.address, 100)).to.be.reverted;//!gov

        expect(await v.bufferAmounts(weth.address)).to.be.eq(0);
        expect(await v.bufferAmounts(dai.address)).to.be.eq(0);
        expect(await v.bufferAmounts(wbtc.address)).to.be.eq(0);

        await OP_BASE_MLP();

        expect(await v.bufferAmounts(weth.address)).to.be.eq(0);
        expect(await v.bufferAmounts(dai.address)).to.be.eq(0);
        expect(await v.bufferAmounts(wbtc.address)).to.be.eq(0);

        expect(await v.poolAmounts(weth.address)).to.be.gt(0);
        expect(await v.poolAmounts(dai.address)).to.be.gt(0);
        expect(await v.poolAmounts(wbtc.address)).to.be.gt(0);

        expect(await v.reservedAmounts(weth.address)).to.be.eq(0);
        expect(await v.reservedAmounts(dai.address)).to.be.eq(0);
        expect(await v.reservedAmounts(wbtc.address)).to.be.eq(0);
    });
    it("v.func => setMaxGlobalShortSize", async () => {
        splitterTitle("setMaxGlobalShortSize");
        await expect(v.connect(user0).setMaxGlobalShortSize(weth.address, 100)).to.be.reverted;//!gov
        await expect(v.connect(owner).setMaxGlobalShortSize(weth.address, 100)).to.be.reverted;//!gov

        expect(await v.maxGlobalShortSizes(weth.address)).to.be.eq(0);
        expect(await v.maxGlobalShortSizes(dai.address)).to.be.eq(0);
        expect(await v.maxGlobalShortSizes(wbtc.address)).to.be.eq(0);
    });
    it("v.func => setFees", async () => {
        splitterTitle("setFees");
        expect(await v.taxBasisPoints()).to.be.eq(0);
        expect(await v.stableTaxBasisPoints()).to.be.eq(0);
        expect(await v.mintBurnFeeBasisPoints()).to.be.eq(0);
        expect(await v.swapFeeBasisPoints()).to.be.eq(0);
        expect(await v.stableSwapFeeBasisPoints()).to.be.eq(0);
        expect(await v.marginFeeBasisPoints()).to.be.eq(500);
        expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("0", 30));
        expect(await v.minProfitTime()).to.be.eq(3600);
        expect(await v.hasDynamicFees()).to.be.eq(false);

        await timelock.setFees(
            v.address, // address _vault,
            100, // uint256 _taxBasisPoints,
            100, // uint256 _stableTaxBasisPoints,
            100, // uint256 _mintBurnFeeBasisPoints,
            100, // uint256 _swapFeeBasisPoints,
            100, // uint256 _stableSwapFeeBasisPoints,
            100, // uint256 _marginFeeBasisPoints,
            parseUnits("10", 30), // uint256 _liquidationFeeUsd,
            100, // uint256 _minProfitTime,
            true // bool _hasDynamicFees
        );

        expect(await v.taxBasisPoints()).to.be.eq(100);
        expect(await v.stableTaxBasisPoints()).to.be.eq(100);
        expect(await v.mintBurnFeeBasisPoints()).to.be.eq(100);
        expect(await v.swapFeeBasisPoints()).to.be.eq(100);
        expect(await v.stableSwapFeeBasisPoints()).to.be.eq(100);
        // expect(await v.marginFeeBasisPoints()).to.be.eq(100);
        expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("10", 30));
        expect(await v.minProfitTime()).to.be.eq(100);
        expect(await v.hasDynamicFees()).to.be.eq(true);

        console.log(`v.taxBasisPoints: ${await v.taxBasisPoints()}`);
        console.log(`v.stableTaxBasisPoints: ${await v.stableTaxBasisPoints()}`);
        console.log(`v.mintBurnFeeBasisPoints: ${await v.mintBurnFeeBasisPoints()}`);
        console.log(`v.swapFeeBasisPoints: ${await v.swapFeeBasisPoints()}`);
        console.log(`v.stableSwapFeeBasisPoints: ${await v.stableSwapFeeBasisPoints()}`);
        console.log(`v.marginFeeBasisPoints: ${await v.marginFeeBasisPoints()}`);
        console.log(`v.liquidationFeeUsd: ${formatUnits(await v.liquidationFeeUsd(),30)}`);
        console.log(`v.minProfitTime: ${await v.minProfitTime()}`);
        console.log(`v.hasDynamicFees: ${await v.hasDynamicFees()}`);
    });
    it("v.func => setFundingRate", async () => {
        expect(await v.fundingInterval()).to.be.eq(3600);
        expect(await v.fundingRateFactor()).to.be.eq(100);
        expect(await v.stableFundingRateFactor()).to.be.eq(100);
        await expect(v.connect(user0).setFundingRate(100, 100,100)).to.be.reverted;
        await expect(v.connect(owner).setFundingRate(100, 100,100)).to.be.reverted;

        await timelock.setFundingRate(v.address,7200,50,50);

        expect(await v.fundingInterval()).to.be.eq(7200);
        expect(await v.fundingRateFactor()).to.be.eq(50);
        expect(await v.stableFundingRateFactor()).to.be.eq(50);

        await expect(timelock.setFundingRate(7200,1001,50)).to.be.reverted;
        await expect(timelock.setFundingRate(7200,50,1001)).to.be.reverted;
        await expect(timelock.connect(user0).setFundingRate(v.address,7200,50,50)).to.be.reverted;
        await expect(timelock.connect(owner).setFundingRate(v.address,7200,50,50)).to.be.ok;
    });
    it("v.func => setTokenConfig() => weth", async () => {
        expect(await v.gov()).to.be.eq(timelock.address);
        expect(await v.totalTokenWeights()).to.be.eq(50000);

        /* weth */
        console.log(`v.whitelistedTokenCount(): ${await v.whitelistedTokenCount()}`);
        console.log(`v.whiteListedTokens: ${await v.whitelistedTokens(weth.address)}`);
        console.log(`v.tokenDecimals: ${await v.tokenDecimals(weth.address)}`);
        console.log(`v.tokenWeights: ${await v.tokenWeights(weth.address)}`);
        console.log(`v.minProfitBasisPoints: ${await v.minProfitBasisPoints(weth.address)}`);
        console.log(`v.maxZkusdAmounts: ${formatUnits(await v.maxZkusdAmounts(weth.address),18)}`);
        console.log(`v.stableTokens: ${await v.stableTokens(weth.address)}`);
        console.log(`v.shortableTokens: ${await v.shortableTokens(weth.address)}`);


        expect(await v.whitelistedTokenCount()).to.be.eq(5);
        expect(await v.whitelistedTokens(weth.address)).to.be.eq(true); //true
        expect(await v.tokenDecimals(weth.address)).to.be.eq(18); //18
        expect(await v.tokenWeights(weth.address)).to.be.eq(10000); //100%
        expect(await v.minProfitBasisPoints(weth.address)).to.be.eq(100); //1%
        expect(await v.maxZkusdAmounts(weth.address)).to.be.gt(0);
        expect(await v.stableTokens(weth.address)).to.be.eq(false); //false
        expect(await v.shortableTokens(weth.address)).to.be.eq(true); //true
    });
    it("v.func => setTokenConfig() => dai", async () => {
        /* dai */
        console.log(`v.whitelistedTokenCount(): ${await v.whitelistedTokenCount()}`);
        console.log(`v.whiteListedTokens: ${await v.whitelistedTokens(dai.address)}`);
        console.log(`v.tokenDecimals: ${await v.tokenDecimals(dai.address)}`);
        console.log(`v.tokenWeights: ${await v.tokenWeights(dai.address)}`);
        console.log(`v.minProfitBasisPoints: ${await v.minProfitBasisPoints(dai.address)}`);
        console.log(`v.maxZkusdAmounts: ${formatUnits(await v.maxZkusdAmounts(dai.address),18)}`);
        console.log(`v.stableTokens: ${await v.stableTokens(dai.address)}`);
        console.log(`v.shortableTokens: ${await v.shortableTokens(dai.address)}`);


        expect(await v.whitelistedTokenCount()).to.be.eq(5); //3
        expect(await v.whitelistedTokens(dai.address)).to.be.eq(true); //true
        expect(await v.tokenDecimals(dai.address)).to.be.eq(18); //18
        expect(await v.tokenWeights(dai.address)).to.be.eq(10000); //100%
        expect(await v.minProfitBasisPoints(dai.address)).to.be.eq(80); //0.8%
        expect(await v.maxZkusdAmounts(dai.address)).to.be.eq(parseUnits("0", 18)); //0
        expect(await v.stableTokens(dai.address)).to.be.eq(true); //true
        expect(await v.shortableTokens(dai.address)).to.be.eq(false); //false
    });
    it("v.func => setTokenConfig() => wbtc", async () => {
        /* wbtc */
        console.log(`v.whitelistedTokenCount(): ${await v.whitelistedTokenCount()}`);
        console.log(`v.whiteListedTokens: ${await v.whitelistedTokens(wbtc.address)}`);
        console.log(`v.tokenDecimals: ${await v.tokenDecimals(wbtc.address)}`);
        console.log(`v.tokenWeights: ${await v.tokenWeights(wbtc.address)}`);
        console.log(`v.minProfitBasisPoints: ${await v.minProfitBasisPoints(wbtc.address)}`);
        console.log(`v.maxZkusdAmounts: ${formatUnits(await v.maxZkusdAmounts(wbtc.address),18)}`);
        console.log(`v.stableTokens: ${await v.stableTokens(wbtc.address)}`);
        console.log(`v.shortableTokens: ${await v.shortableTokens(wbtc.address)}`);

        expect(await v.whitelistedTokenCount()).to.be.eq(5);
        expect(await v.whitelistedTokens(wbtc.address)).to.be.eq(true); //true
        expect(await v.tokenDecimals(wbtc.address)).to.be.eq(8); //8
        expect(await v.tokenWeights(wbtc.address)).to.be.eq(10000); //100%
        expect(await v.minProfitBasisPoints(wbtc.address)).to.be.eq(100); //1%
        expect(await v.maxZkusdAmounts(wbtc.address)).to.be.gt(0);
        expect(await v.stableTokens(wbtc.address)).to.be.eq(false); //false
        expect(await v.shortableTokens(wbtc.address)).to.be.eq(true); //true
    });
    it("v.func => setTokenConfig() => weth v2", async () => {
        expect(await v.whitelistedTokenCount()).to.be.eq(5); //3
        expect(await v.whitelistedTokens(weth.address)).to.be.eq(true); //true
        expect(await v.tokenDecimals(weth.address)).to.be.eq(18); //18
        expect(await v.tokenWeights(weth.address)).to.be.eq(10000); //100%
        expect(await v.minProfitBasisPoints(weth.address)).to.be.eq(100); //1%
        expect(await v.maxZkusdAmounts(weth.address)).to.be.gt(0);
        expect(await v.stableTokens(weth.address)).to.be.eq(false); //false
        expect(await v.shortableTokens(weth.address)).to.be.eq(true); //true

        await expect(v.setTokenConfig(
            weth.address, 10000, 100, parseUnits("300000000", 18), false, true, false)).to.be.reverted;

        await timelock.setTokenConfig(v.address,
            weth.address, //token
            18, //tokenDecimals
            15000, //tokenWeight
            100, //minProfitBasisPoints
            parseUnits("300000000", 18), //300m
            true, //stable
            false, //shortable
            false
        );

        expect(await v.totalTokenWeights()).to.be.eq(55000);
        expect(await v.whitelistedTokenCount()).to.be.eq(5);
        expect(await v.whitelistedTokens(weth.address)).to.be.eq(true); //true
        expect(await v.tokenDecimals(weth.address)).to.be.eq(18); //18
        expect(await v.tokenWeights(weth.address)).to.be.eq(15000); //100%
        expect(await v.minProfitBasisPoints(weth.address)).to.be.eq(100); //1%
        expect(await v.maxZkusdAmounts(weth.address)).to.be.eq(parseUnits("300000000", 18)); //300m
        expect(await v.stableTokens(weth.address)).to.be.eq(true); // stable
        expect(await v.shortableTokens(weth.address)).to.be.eq(false); //shortable

        await expect(timelock.connect(user0).setTokenConfig(v.address,
            weth.address, //token
            18, //tokenDecimals
            10000, //tokenWeight
            100, //minProfitBasisPoints
            parseUnits("300000000", 18), //300m
            false, //stable
            true //shortable
        )).to.be.reverted;
    });
    it("v.func => setMinProfitTime() => 1 day", async () => {
       expect(await v.minProfitTime()).to.be.eq(3600);

       await expect(v.connect(user0).setMinProfitTime(86400)).to.be.reverted;
       await expect(v.connect(owner).setMinProfitTime(86400)).to.be.reverted;
       await expect(timelock.connect(user0).setMinProfitTime(v.address, 86400)).to.be.reverted;

       await timelock.setMinProfitTime(v.address, 86400);
       expect(await v.minProfitTime()).to.be.eq(86400);
    });
    it("v.func => setZkusdAmount()", async () => {
        expect(await v.zkusdAmounts(dai.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(wbtc.address)).to.be.eq(0);
        expect(await v.zkusdAmounts(weth.address)).to.be.eq(0);
        await OP_BASE_MLP();
        expect(await v.zkusdAmounts(dai.address)).to.be.gt(0);
        expect(await v.zkusdAmounts(wbtc.address)).to.be.gt(0);
        expect(await v.zkusdAmounts(weth.address)).to.be.gt(0);
    });
    it("v.func => setZkusdAmount() => 1000 v2", async () => {
        await OP_BASE_MLP();
        await expect(v.connect(owner).setZkusdAmount(weth.address, parseEther("1000"))).to.be.reverted; //not timelock
        await expect(timelock.connect(user0).setZkusdAmounts(v.address, [weth.address], [parseEther("1000")])).to.be.reverted; //not owner

        expect(await v.zkusdAmounts(weth.address)).to.be.not.eq(parseEther("1000"));
        expect(await v.zkusdAmounts(wbtc.address)).to.be.not.eq(parseEther("1000"));
        expect(await v.zkusdAmounts(dai.address)).to.be.not.eq(parseEther("1000"));

        await timelock.setZkusdAmounts(v.address, [weth.address], [parseEther("1000")]);
        await timelock.setZkusdAmounts(v.address, [wbtc.address], [parseEther("1000")]);
        await timelock.setZkusdAmounts(v.address, [dai.address], [parseEther("1000")]);

        expect(await v.zkusdAmounts(weth.address)).to.be.eq(parseEther("1000"));
        expect(await v.zkusdAmounts(wbtc.address)).to.be.eq(parseEther("1000"));
        expect(await v.zkusdAmounts(dai.address)).to.be.eq(parseEther("1000"));
    });

    it("v.func => setVaultUtils()", async () => {
        expect(await vault.vaultUtils()).to.be.eq(vaultUtils.address);
        await expect(vault.connect(user0).setVaultUtils(vaultUtils.address)).to.be.reverted; //not owner
        await expect(timelock.connect(user0).setVaultUtils(v.address, user0.address)).to.be.reverted; //not owner

        await timelock.setVaultUtils(v.address, user0.address);
        expect(await vault.vaultUtils()).to.be.eq(user0.address);
        await timelock.setVaultUtils(v.address, vaultUtils.address);
        expect(await vault.vaultUtils()).to.be.eq(vaultUtils.address);
    });

    it("v.func => setErrorController()", async () => {
        let errorController = vaultErrorController;
        expect(await vault.errorController()).to.be.eq(errorController.address);
        await expect(vault.connect(user0).setErrorController(errorController.address)).to.be.reverted; //not owner
    });
});

describe("Vault -> VaultInternal Test", async () => {
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
        tsla                : any;

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
        tsla                = fixture.tsla;
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

    it("v.func => getMaxPrice()", async () => {
        await OP_BASE_MLP();
        expect(await v.getMaxPrice(weth.address)).to.equal(parseUnits("1500",30));
        expect(await v.getMaxPrice(dai.address)).to.equal(parseUnits("1",30));
        expect(await v.getMaxPrice(wbtc.address)).to.equal(parseUnits("28000",30));
    });
    it("v.func => getMinPrice()", async () => {
        await OP_BASE_MLP();
        expect(await v.getMinPrice(weth.address)).to.equal(parseUnits("1500",30));
        expect(await v.getMinPrice(dai.address)).to.equal(parseUnits("1",30));
        expect(await v.getMinPrice(wbtc.address)).to.equal(parseUnits("28000",30));
    });
    it("v.func => usdToTokenMax()", async () => {
        let usdAmount = parseUnits("100",30);
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        expect(await v.usdToTokenMax(weth.address, usdAmount )).to.be.closeTo(parseEther("0.0666"),MAX_WITHIN);
        expect(await v.usdToTokenMax(dai.address, usdAmount )).to.be.eq(parseEther("100"));
        expect(await v.usdToTokenMax(wbtc.address, usdAmount )).to.be.eq(parseUnits("0.00357142",8));
    });
    it("v.func => usdToTokenMin()", async () => {
        let usdAmount = parseUnits("100",30);
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        expect(await v.usdToTokenMin(weth.address, usdAmount )).to.be.gt(0);
        expect(await v.usdToTokenMin(dai.address, usdAmount )).to.be.gt(0);
        expect(await v.usdToTokenMin(wbtc.address, usdAmount )).to.be.gt(0);

        expect(await v.usdToTokenMin(weth.address, usdAmount )).to.be.closeTo(parseEther("0.0666"),MAX_WITHIN);
        expect(await v.usdToTokenMin(dai.address, usdAmount )).to.be.eq(parseEther("100"));
        expect(await v.usdToTokenMin(wbtc.address, usdAmount )).to.be.eq(parseUnits("0.00357142",8));
    });
    it("v.func => tokenToUsdMin()", async () => {
        let tokenAmount = parseEther("1");
        let wbtcAmount = parseUnits("1",8);
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        expect(await v.tokenToUsdMin(weth.address, tokenAmount )).to.be.eq(parseUnits("1500",30));
        expect(await v.tokenToUsdMin(dai.address, tokenAmount )).to.be.eq(parseUnits("1",30));
        expect(await v.tokenToUsdMin(wbtc.address, wbtcAmount )).to.be.eq(parseUnits("28000",30));
    });
    it("v.func => usdToToken()", async () => {
        let usdAmount = parseUnits("1300",30);
        let wbtcAmount = parseUnits("28000",30);
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);

        expect(await v.getMaxPrice(weth.address)).to.equal(parseUnits("1500",30));
        expect(await v.getMaxPrice(dai.address)).to.equal(parseUnits("1",30));
        expect(await v.getMaxPrice(wbtc.address)).to.equal(parseUnits("28000",30));

        expect(await v.usdToToken(weth.address, usdAmount, toUsd(1300))).to.be.eq(parseEther("1.0"));
        expect(await v.usdToToken(dai.address, usdAmount, toUsd(1.3))).to.be.eq(parseEther("1000"));
        expect(await v.usdToToken(wbtc.address, wbtcAmount, toUsd(28000))).to.be.eq(parseUnits("1",8));
    });
    it("v.params => tokenDecimals()", async() => {
        expect(await v.tokenDecimals(weth.address)).to.be.eq(18);
        expect(await v.tokenDecimals(dai.address)).to.be.eq(18);
        expect(await v.tokenDecimals(wbtc.address)).to.be.eq(8);
    });
    it("v.func => adjustForDecimals()", async() => {
        let amount = parseEther("1");
        let wbtcAmount = parseUnits("1",8);
        expect(await v.adjustForDecimals(amount,weth.address, weth.address)).to.be.eq(amount);
        expect(await v.adjustForDecimals(amount,dai.address, dai.address)).to.be.eq(amount);
        expect(await v.adjustForDecimals(wbtcAmount,wbtc.address, wbtc.address)).to.be.eq(wbtcAmount);

        expect(await v.adjustForDecimals(amount,weth.address, dai.address)).to.be.eq(amount);
        expect(await v.adjustForDecimals(amount,weth.address, wbtc.address)).to.be.eq(wbtcAmount);
    });
    it("v.func => getRedemptionAmount()", async () => {
        let zkusdAmount = parseEther("1500");
        let zkusdWBTCAmount = parseEther("28000");
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);

        expect(await v.getRedemptionAmount(weth.address, zkusdAmount)).to.be.eq(parseEther("1.0"));
        expect(await v.getRedemptionAmount(dai.address, zkusdAmount)).to.be.eq(parseEther("1500"));
        expect(await v.getRedemptionAmount(wbtc.address, zkusdWBTCAmount)).to.be.eq(parseUnits("1",8));
    });
    it("v.func => allWhitelistedTokensLength()", async() => {
        expect(await v.allWhitelistedTokensLength()).to.be.eq(5);
    });
    it("v.func => getPositionFee()", async() => {
        await OP_BASE_MLP();
        await OP_BASE_LONG_SHORT();
        expect(await v.getPositionFee(constants.AddressZero, constants.AddressZero, constants.AddressZero,
            true, toUsd(200))).to.be.eq(parseUnits("10",30));
        expect(await v.getPositionFee(owner.address, owner.address, owner.address,
            true, toUsd(200))).to.be.eq(parseUnits("10",30));
    });
    it("v.func => addRouter() => owner + user0", async() => {
        expect(await v.approvedRouters(owner.address, rewardRouter.address)).to.be.false
        await v.addRouter(rewardRouter.address);
        expect(await v.approvedRouters(owner.address, rewardRouter.address)).to.be.true;
        await v.removeRouter(rewardRouter.address);
        expect(await v.approvedRouters(owner.address, rewardRouter.address)).to.be.false;


        expect(await v.approvedRouters(user0.address, rewardRouter.address)).to.be.false;
        await v.connect(user0).addRouter(rewardRouter.address);
        expect(await v.approvedRouters(user0.address, rewardRouter.address)).to.be.true;
        await v.connect(user0).removeRouter(rewardRouter.address);
        expect(await v.approvedRouters(user0.address, rewardRouter.address)).to.be.false;
    });
    it("tsla", async() => {
        expect(tsla.address).to.not.eq(constants.AddressZero);
    });
    it("v.func => getPositionKey()", async() => {
        console.log(`v.getPositionKey: ${await v.getPositionKey(owner.address, weth.address, weth.address, true)}`);
        console.log(`v.getPositionKey: ${await v.getPositionKey(owner.address, dai.address, weth.address, false)}`);
        console.log(`v.getPositionKey: ${await v.getPositionKey(owner.address, weth.address, dai.address, false)}`);
        console.log(`v.getPositionKey: ${await v.getPositionKey(owner.address, dai.address, dai.address, false)}`);


        console.log(`v.getPositionKey: ${await v.getPositionKey(user0.address, weth.address, weth.address, true)}`);
        console.log(`v.getPositionKey: ${await v.getPositionKey(user0.address, dai.address, weth.address, false)}`);
        console.log(`v.getPositionKey: ${await v.getPositionKey(user0.address, weth.address, dai.address, false)}`);
        console.log(`v.getPositionKey: ${await v.getPositionKey(user0.address, dai.address, dai.address, false)}`);
    });
    it("v.func => getPosition()", async() => {
        await OP_BASE_MLP();
        await OP_BASE_LONG_SHORT();
        let position = await v.getPosition(owner.address, weth.address, weth.address, true);
        expect(position[0]).to.be.eq(parseUnits("1000",30));

        position = await v.getPosition(owner.address, dai.address, weth.address, false);
        expect(position[0]).to.be.eq(parseUnits("1400",30));
    });
    it("v.func => getPositionDelta()", async() => {
        await OP_BASE_MLP();
        await OP_BASE_LONG_SHORT();
        let positionDelta = await v.getPositionDelta(owner.address, weth.address, weth.address, true);
        expect(positionDelta[0]).to.be.false;
        expect(positionDelta[1]).to.be.eq(0);

        positionDelta = await v.getPositionDelta(owner.address, dai.address, weth.address, false);
        expect(positionDelta[0]).to.be.false;
        expect(positionDelta[1]).to.be.eq(0);
    });
    it("v.func => getTargetZkusdAmount()", async() => {
        await OP_BASE_MLP();
        expect(await v.getTargetZkusdAmount(weth.address)).to.be.gt(0);
        expect(await v.getTargetZkusdAmount(dai.address)).to.be.gt(0);
        expect(await v.getTargetZkusdAmount(wbtc.address)).to.be.gt(0);
        expect(await v.getTargetZkusdAmount(tsla.address)).to.be.gt(0);
    });
    it("v.func => getEntryFundingRate()", async () => {
        await OP_BASE_MLP();
        await OP_BASE_LONG_SHORT();
        expect(await v.getEntryFundingRate(weth.address, weth.address, true)).to.be.eq(0);
        // expect(await v.getEntryFundingRate(dai.address, weth.address, false)).to.be.eq(0);
    });
    it("v.func => getNextFundingRate()", async () => {
        await OP_BASE_MLP();
        // await OP_BASE_LONG_SHORT();

        expect(await v.getNextFundingRate(weth.address)).to.be.eq(0);
        expect(await v.getNextFundingRate(dai.address)).to.be.eq(0);
        expect(await v.getNextFundingRate(wbtc.address)).to.be.eq(0);
        expect(await v.getNextFundingRate(tsla.address)).to.be.eq(0);

        expect(await v.fundingInterval()).to.be.eq(3600);
        expect(await v.lastFundingTimes(weth.address)).to.be.gt(0);
        expect(await v.lastFundingTimes(dai.address)).to.be.gt(0);
        expect(await v.lastFundingTimes(wbtc.address)).to.be.gt(0);
        expect(await v.lastFundingTimes(tsla.address)).to.be.eq(0);
    });
});
