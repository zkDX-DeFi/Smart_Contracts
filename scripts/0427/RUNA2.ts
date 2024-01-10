import {
    ApproveAmount,
    getContracts,
    getUpdateDataTestnet
} from "../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {FEED_ID_BTC_TEST, FEED_ID_ETH_TEST, FEED_ID_USDC_TEST} from "../../helpers/constants";
import {expect} from "chai";
import {constants} from "ethers";
import {getChainId} from "hardhat";
import {OP_CHAINID, splitter, splitterTitle} from "../../helpers/utils2";

const secret = require("../../secret.json");
async function main() {
    const {
        reader,
        vault,
        weth,
        wbtc,
        positionManager,
        router,
        rewardRouter,
        vaultUtils,
        zkdlp,
        user0,
        user1,
        usdc,
        wnative,
        zkdlpManager,
        vaultErrorController,
        vaultPriceFeed,
        owner,
        timelock,
        ZKUSD: zkusd,
        shortsTracker,
    } = await getContracts();
    let admin = secret.adminAddress;
    let pm = positionManager;
    let v = vault;
    let t = timelock;
    async function OP_CHECK_CONTRACT() {
        async function checkVaultErrorController() {
            splitterTitle("VaultErrorController");
            let vec = vaultErrorController;
            expect(vec.address).to.not.eq(constants.AddressZero);
            expect(await vec.gov()).to.eq(admin);
            expect(await v.errors(0)).to.be.eq("Vault: zero error");
            expect(await v.errors(1)).to.be.eq("Vault: already initialized");
            expect(await v.errors(2)).to.be.eq("Vault: invalid _maxLeverage");
            expect(await v.errors(55)).to.be.eq("Vault: maxGasPrice exceeded");
            expect(await v.errors(56)).to.be.eq("");
        }
        async function checkVault() {
            splitterTitle("checkVault");
            expect(await v.isInitialized()).to.be.eq(true);
            expect(await v.router()).to.be.eq(router.address);
            expect(await v.zkusd()).to.be.eq(zkusd.address);
            expect(await v.priceFeed()).to.be.eq(vaultPriceFeed.address);
            expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("5", 30));
            expect(await v.fundingRateFactor()).to.be.eq(100);
            expect(await v.stableFundingRateFactor()).to.be.eq(100);
            expect(await v.vaultUtils()).to.be.eq(vaultUtils.address); // setVaultUtils
            expect(await v.errorController()).to.be.eq(vaultErrorController.address); //setErrorController
        }
        async function checkShortsTracker() {
            let ss = shortsTracker;
            splitterTitle("checkShortsTracker");
            expect(await ss.gov()).to.be.eq(admin);
            expect(await ss.vault()).to.be.eq(v.address);
            expect(await ss.isHandler(pm.address)).to.be.eq(true);
            expect(await ss.isGlobalShortDataReady()).to.be.true;
        }
        splitterTitle("OP_CHECK_CONTRACT");
        splitterTitle("OP_CHECK_CONTRACT");
        await checkVaultErrorController();
        await checkVault();
        await checkShortsTracker();
    }

    async function OP_CHECK_CONTRACT2() {
        async function checkPM() {
            splitterTitle("check Position Manager");
            expect(pm.address).to.not.eq(constants.AddressZero);
            expect(await pm.admin()).to.be.eq(admin);
            expect(await pm.gov()).to.be.eq(admin);

            expect(await pm.orderBook()).to.be.eq(constants.AddressZero);
            expect(await pm.vault()).to.be.eq(v.address);
            expect(await pm.router()).to.be.eq(router.address);
            expect(await pm.shortsTracker()).to.be.eq(shortsTracker.address);
            expect(await pm.weth()).to.be.eq(weth.address);
            expect(await pm.depositFee()).to.be.eq(50);
        }

        async function checkSettings() {
            splitterTitle("checkSettings");
            expect(await router.plugins(pm.address)).to.be.true;
            expect(await t.isHandler(pm.address)).to.be.true;
            expect(await t.shouldToggleIsLeverageEnabled()).to.be.true;

        }
        splitterTitle("OP_CHECK_CONTRACT2");
        splitterTitle("OP_CHECK_CONTRACT2");
        await checkPM();
        await checkSettings();
    }

    await OP_CHAINID();

    await OP_CHECK_CONTRACT();
    await OP_CHECK_CONTRACT2();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
