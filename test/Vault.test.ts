import {forwardTime, setupFixture, toChainlinkPrice, toUsd} from "../helpers/utils";
import {formatEther, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getWNativeConfigByChainId} from "../helpers/params";

describe("Vault", async () => {

    let vault: any,
        router: any,
        timelock: any,
        weth: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        positionKeeper: any,
        positionManager: any,
        wethPriceFeed: any,
        reader: any,
        zkdlp: any,
        zkdlpManager: any,
        mm: any,
        rewardRouter: any,
        vaultUtils: any,
        o: any,
        v: any,
        usdm: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        timelock = fixture.timelock;
        weth = fixture.weth;
        dai = fixture.dai;
        usdm = fixture.usdm;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        positionKeeper = fixture.positionKeeper;
        positionManager = fixture.positionManager;
        wethPriceFeed = fixture.wethPriceFeed;
        reader = fixture.reader;
        zkdlp = fixture.zkdlp;
        zkdlpManager = fixture.zkdlpManager;
        mm = fixture.zkdlpManager;
        rewardRouter = fixture.rewardRouter;
        vaultUtils = fixture.vaultUtils;
        o = fixture.orderBook;
        v = fixture.vault;

        await router.addPlugin(positionManager.address)
        await timelock.setContractHandler(positionManager.address, true)
        await timelock.setShouldToggleIsLeverageEnabled(true)
    })
    it("Vault.func => setMaxLeverage", async () => {
        await timelock.setMaxLeverage(v.address,500000*2);
        await timelock.setLiquidator(v.address, constants.AddressZero,true);
        await timelock.setFundingRate(v.address, 5000,0,0);

        await timelock.setSwapFees(v.address,0,0,0,0,0);
        await timelock.setFees(v.address,0,0,0,0,0,0,0,0,true);
        await timelock.setIsLeverageEnabled(v.address,true);

        await timelock.setZkusdAmounts(v.address,[dai.address], [parseEther("10000")]);
        await timelock.setMaxGlobalShortSize(v.address, dai.address, 0);
        await timelock.setIsSwapEnabled(v.address,true);

        await timelock.setVaultUtils(v.address, vaultUtils.address);
    });

    it("Vault.func => setMaxLeverage", async () => {
        await timelock.setMaxGasPrice(v.address,50000000000);

        await timelock.setInPrivateLiquidationMode(v.address,true);

        await timelock.setLiquidator(v.address, user2.address, true);

        await timelock.enableLeverage(v.address);
        await timelock.disableLeverage(v.address);

        await timelock.withdrawFees(v.address, dai.address, user2.address);

        await timelock.batchWithdrawFees(v.address,[dai.address]);
    });

    it("Vault.func => setMaxLeverage", async () => {
        console.log(`v.gov:: ${await v.gov()}`);
        console.log(`timelock.address: ${timelock.address}`);
        await timelock.signalSetGov(v.address, owner.address);
        await forwardTime(500000);
        await timelock.setGov(v.address,owner.address);
        console.log(`v.gov:: ${await v.gov()}`);
        console.log(`timelock.address: ${timelock.address}`);
    });

    it("Vault.func => setVaultUtils", async () => {
        await timelock.signalSetGov(v.address, owner.address);
        await forwardTime(500000);
        await timelock.setGov(v.address,owner.address);

        await v.setVaultUtils(constants.AddressZero);
        await v.setErrorController(owner.address);
        await v.setError(0,"hello world");
        await v.setInManagerMode(true);
        await v.setManager(constants.AddressZero,true);
        await v.setInPrivateLiquidationMode(true);

        await v.setLiquidator(constants.AddressZero,true);
        await v.setIsSwapEnabled(true);
        await v.setIsLeverageEnabled(true);
        await v.setMaxGasPrice(0);
        await v.setGov(owner.address);
        await v.setPriceFeed(constants.AddressZero);

        await v.setMaxLeverage(10000 * 2);
        await v.setBufferAmount(dai.address, 0);
        await v.setMaxGlobalShortSize(dai.address,0);
        await v.setFundingRate(5000,0,0);
        await v.setZkusdAmount(dai.address,0);

        expect(await v.inManagerMode()).to.be.true;
    });

    it("Vault.func => allWhitelistedTokensLength", async () => {
        await timelock.signalSetGov(v.address, owner.address);
        await forwardTime(500000);
        await timelock.setGov(v.address,owner.address);
        console.log(`v.allWhitelistedTokensLength: ${await v.allWhitelistedTokensLength()}`);
        console.log(`v.getNextFundingRate: ${await v.getNextFundingRate(dai.address)}`);
        // console.log(`v.usdToTokenMin: ${await v.usdToTokenMin(dai.address, parseEther("1.2345"))}`);
        // console.log(`v.usdToTokenMax: ${await v.usdToTokenMax(dai.address, parseEther("1.2345"))}`);
        // console.log(`v.tokenToUsdMin: ${await v.tokenToUsdMin(dai.address, parseEther("1.2345"))}`);
        // console.log(`v.usdToToken: ${await v.usdToToken(dai.address, parseEther("1"),parseEther("1"))}`);
        console.log(`v.adjustForDecimals: ${await v.adjustForDecimals(parseEther("1.2345"), usdm.address, usdm.address)}`);
        console.log(`v.allWhitelistedTokensLength: ${await v.allWhitelistedTokensLength()}`);
        // console.log(`v.getMaxPrice: ${await v.getMaxPrice(dai.address)}`);
        console.log(`v.getPositionFee: ${await v.getPositionFee(owner.address, dai.address, dai.address, true, 100)}`);
        // console.log(`v.getMinPrice: ${await v.getMinPrice(dai.address)}`);
        // console.log(`v.getDelta: ${await v.getDelta(dai.address, 100,100,true, 100)}`);
        console.log(`v.getPositionKey: ${await v.getPositionKey(owner.address, dai.address, dai.address,true)}`);
        console.log(`v.getPosition: ${await v.getPosition(owner.address, dai.address, dai.address,true)}`);
        // console.log(`v.getRedemptionAmount: ${await v.getRedemptionAmount(dai.address, parseEther("1.2345"))}`);
    });

    it("Vault.func => getTargetZkusdAmount", async () => {
        await timelock.signalSetGov(v.address, owner.address);
        await forwardTime(500000);
        await timelock.setGov(v.address,owner.address);
        console.log(`v.getTargetZkusdAmount: ${await v.getTargetZkusdAmount(dai.address)}`);
        console.log(`v.getEntryFundingRate: ${await v.getEntryFundingRate(dai.address,dai.address,true)}`);
        console.log(`v.getNextFundingRate: ${await v.getNextFundingRate(dai.address)}`);
    });

    it("Vault.func => clearTokenConfig", async () => {
        await timelock.signalSetGov(v.address, owner.address);
        await forwardTime(500000);
        await timelock.setGov(v.address,owner.address);
        await v.clearTokenConfig(dai.address);
        await v.withdrawFees(dai.address, user2.address);
        await v.addRouter(user2.address);
        await v.removeRouter(user2.address);
        await weth.mint(v.address, parseEther("10000"));
        await weth.approve(v.address, parseEther("100000"));
        await v.upgradeVault(user2.address, dai.address, 0);
        await v.directPoolDeposit(weth.address);
    });

    it("Vault.func => clearTokenConfig directly", async () => {
        let whiteCountBefore = await v.whitelistedTokenCount();
        await timelock.clearTokenConfig(v.address, dai.address);
        expect(await v.whitelistedTokens(dai.address)).to.eq(false);
        expect(await v.tokenDecimals(dai.address)).to.eq(0);
        expect(await v.tokenWeights(dai.address)).to.eq(0);
        expect(await v.minProfitBasisPoints(dai.address)).to.eq(0);
        expect(await v.maxZkusdAmounts(dai.address)).to.eq(0);
        expect(await v.stableTokens(dai.address)).to.eq(false);
        expect(await v.shortableTokens(dai.address)).to.eq(false);
        expect(await v.whitelistedTokenCount()).to.eq(whiteCountBefore - 1);
    });
});

