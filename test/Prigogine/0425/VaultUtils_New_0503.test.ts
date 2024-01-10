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


describe("VaultUtils -> VaultUtilsStorage Test", async () => {
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

    it("vu.Parameters => vault", async () => {
        expect(await vaultUtils.vault()).to.be.eq(vault.address);
    });

    it("vu.parameters => gov", async () => {
        expect(await vaultUtils.gov()).to.be.eq(owner.address);
        await expect(vaultUtils.connect(user0).setGov(user0.address)).to.be.reverted; //!gov

        await vaultUtils.setGov(user0.address);
        expect(await vaultUtils.gov()).to.be.eq(user0.address);
        await vaultUtils.connect(user0).setGov(owner.address);
        expect(await vaultUtils.gov()).to.be.eq(owner.address);
    });
});

describe("VaultUtils -> VaultUtils Test", async () => {
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

    it("vu.func => constructor", async () => {
        expect(await vaultUtils.vault()).to.be.eq(vault.address);
    });
    it("vu.func => getEntryFundingRate()", async () => {
        await OP_BASE_MLP();
        expect(await vu.getEntryFundingRate(weth.address, constants.AddressZero,true)).to.be.eq(0);
        expect(await vu.getEntryFundingRate(dai.address, constants.AddressZero,true)).to.be.eq(0);
        expect(await vu.getEntryFundingRate(wbtc.address, constants.AddressZero,true)).to.be.eq(0);

        expect(await v.getEntryFundingRate(weth.address, constants.AddressZero,true)).to.be.eq(0);
        expect(await v.getEntryFundingRate(dai.address, constants.AddressZero,true)).to.be.eq(0);
        expect(await v.getEntryFundingRate(wbtc.address, constants.AddressZero,true)).to.be.eq(0);

        expect(await v.cumulativeFundingRates(weth.address)).to.be.eq(0);
        expect(await v.cumulativeFundingRates(dai.address)).to.be.eq(0);
        expect(await v.cumulativeFundingRates(wbtc.address)).to.be.eq(0);
    });
    it("vault.func => getEntryFundingRate()", async () => {
        await OP_BASE_MLP();
        expect(await v.getEntryFundingRate(weth.address, weth.address, true)).to.be.eq(0);
        expect(await v.getEntryFundingRate(dai.address, dai.address, true)).to.be.eq(0);
        expect(await v.getEntryFundingRate(wbtc.address, wbtc.address, true)).to.be.eq(0);
    });
    it("vu.func => getPositionFee()", async () => {
        await OP_BASE_MLP();
        await OP_BASE_LONG_SHORT();

        expect(await vu.getPositionFee(constants.AddressZero,
            constants.AddressZero, constants.AddressZero, true, toUsd(1000)))
            .to.be.eq(parseUnits("50",30));

        expect(await vu.getPositionFee(constants.AddressZero,
            constants.AddressZero, constants.AddressZero, true, toUsd(200)))
            .to.be.eq(parseUnits("10",30));
        expect(await v.marginFeeBasisPoints()).to.be.eq(500);

        expect(await vu.getPositionFee(constants.AddressZero,
            constants.AddressZero, constants.AddressZero, false, toUsd(0)))
            .to.be.eq(parseUnits("0",30));
    });
    it("vu.func => getFundingFee()", async () => {
        await OP_BASE_MLP();
        await OP_BASE_LONG_SHORT();
        expect(await v.cumulativeFundingRates(weth.address)).to.be.eq(0);
        expect(await v.cumulativeFundingRates(dai.address)).to.be.eq(0);
        expect(await v.cumulativeFundingRates(wbtc.address)).to.be.eq(0);

         expect(await vu.getFundingFee(
             constants.AddressZero,
                weth.address, // _collateral
                constants.AddressZero,
                true,
                toUsd(1000), //_sizeDelta
                0,    //_entryFundingRate
            )).to.be.eq(0);

        expect(await vu.getFundingFee(
            constants.AddressZero,
            dai.address, // _collateral
            constants.AddressZero,
            true,
            toUsd(1000), //_sizeDelta
            0,    //_entryFundingRate
        )).to.be.eq(0);

        expect(await vu.getFundingFee(
            constants.AddressZero,
            wbtc.address, // _collateral
            constants.AddressZero,
            true,
            toUsd(1000), //_sizeDelta
            0,    //_entryFundingRate
        )).to.be.eq(0);
    });
    it("vu.func => getBuyZkusdFeeBasisPoints()", async() => {
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("100000"), user2);
        expect(await v.hasDynamicFees()).to.be.false;
        expect(await v.mintBurnFeeBasisPoints()).to.be.eq(0);
        expect(await v.taxBasisPoints()).to.be.eq(0);

        expect(await vu.getBuyZkusdFeeBasisPoints(weth.address, parseEther("100"))).to.be.eq(0);
        expect(await vu.getBuyZkusdFeeBasisPoints(dai.address, parseEther("100"))).to.be.eq(0);
        expect(await vu.getBuyZkusdFeeBasisPoints(wbtc.address, parseEther("100"))).to.be.eq(0);
    });
    it("vu.func => getBuyZkusdFeeBasisPoints() v2", async() => {
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("10000"), user2);
        await timelock.setFees(
            vault.address,
            50, // _taxBasisPoints,
            20, // _stableTaxBasisPoints,
            30, // _mintBurnFeeBasisPoints,
            30, // _swapFeeBasisPoints,
            4, // _stableSwapFeeBasisPoints,
            10, // _marginFeeBasisPoints,
            parseUnits("5", 30), // _liquidationFeeUsd,
            0, // _minProfitTime,
            true
        );

        expect(await v.hasDynamicFees()).to.be.true;
        expect(await vu.getBuyZkusdFeeBasisPoints(weth.address, parseEther("10000"))).to.be.not.eq(30);
        expect(await vu.getBuyZkusdFeeBasisPoints(dai.address, parseEther("10000"))).to.be.not.eq(30);
        expect(await vu.getBuyZkusdFeeBasisPoints(wbtc.address, parseEther("10000"))).to.be.not.eq(30);
    });
    it("vu.func => getSellZkusdFeeBasisPoints() ", async() => {
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("10000"), user2);

        expect(await vu.getSellZkusdFeeBasisPoints(weth.address, parseEther("100"))).to.be.eq(0);
        expect(await vu.getSellZkusdFeeBasisPoints(dai.address, parseEther("100"))).to.be.eq(0);
        expect(await vu.getSellZkusdFeeBasisPoints(wbtc.address, parseEther("100"))).to.be.eq(0);

        await timelock.setFees(
            vault.address,
            50, // _taxBasisPoints,
            20, // _stableTaxBasisPoints,
            50, // _mintBurnFeeBasisPoints,
            30, // _swapFeeBasisPoints,
            4, // _stableSwapFeeBasisPoints,
            10, // _marginFeeBasisPoints,
            parseUnits("5", 30), // _liquidationFeeUsd,
            0, // _minProfitTime,
            false
        );

        expect(await vu.getSellZkusdFeeBasisPoints(weth.address, parseEther("100"))).to.be.eq(50); // _mintBurnFeeBasisPoints
        expect(await vu.getSellZkusdFeeBasisPoints(dai.address, parseEther("100"))).to.be.eq(50); //_mintBurnFeeBasisPoints
        expect(await vu.getSellZkusdFeeBasisPoints(wbtc.address, parseEther("100"))).to.be.eq(50); //_mintBurnFeeBasisPoints
    });
    it("vu.func => getSwapFeeBasisPoints() ", async() => {
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("10000"), user2);

        expect(await v.stableTokens(weth.address)).to.be.eq(false);
        expect(await v.stableTokens(wbtc.address)).to.be.eq(false);
        expect(await v.stableTokens(dai.address)).to.be.eq(true);
        expect(await v.taxBasisPoints()).to.be.eq(0);
        expect(await v.stableTaxBasisPoints()).to.be.eq(0);
        expect(await v.swapFeeBasisPoints()).to.be.eq(0);
        expect(await v.stableSwapFeeBasisPoints()).to.be.eq(0);



        expect(await vu.getSwapFeeBasisPoints(dai.address,weth.address,parseEther("100"))).to.be.eq(0);
        expect(await vu.getSwapFeeBasisPoints(dai.address,wbtc.address,parseEther("100"))).to.be.eq(0);
        expect(await vu.getSwapFeeBasisPoints(weth.address,dai.address,parseEther("100"))).to.be.eq(0);
        expect(await vu.getSwapFeeBasisPoints(wbtc.address,dai.address,parseEther("100"))).to.be.eq(0);
        expect(await vu.getSwapFeeBasisPoints(weth.address,wbtc.address,parseEther("100"))).to.be.eq(0);
        expect(await vu.getSwapFeeBasisPoints(wbtc.address,weth.address,parseEther("100"))).to.be.eq(0);
    });
    it("vu.func => getSwapFeeBasisPoints() v2", async() => {
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("10000"), user2);

        await timelock.setFees(
            vault.address,
            50, // _taxBasisPoints,
            20, // _stableTaxBasisPoints,
            50, // _mintBurnFeeBasisPoints,
            50, // _swapFeeBasisPoints,
            50, // _stableSwapFeeBasisPoints,
            10, // _marginFeeBasisPoints,
            parseUnits("5", 30), // _liquidationFeeUsd,
            0, // _minProfitTime,
            false
        );

        expect(await vu.getSwapFeeBasisPoints(dai.address,weth.address,parseEther("100"))).to.be.eq(50);
        expect(await vu.getSwapFeeBasisPoints(dai.address,wbtc.address,parseEther("100"))).to.be.eq(50);
        expect(await vu.getSwapFeeBasisPoints(weth.address,dai.address,parseEther("100"))).to.be.eq(50);
        expect(await vu.getSwapFeeBasisPoints(wbtc.address,dai.address,parseEther("100"))).to.be.eq(50);
        expect(await vu.getSwapFeeBasisPoints(weth.address,wbtc.address,parseEther("100"))).to.be.eq(50);
        expect(await vu.getSwapFeeBasisPoints(wbtc.address,weth.address,parseEther("100"))).to.be.eq(50);
    });
});
