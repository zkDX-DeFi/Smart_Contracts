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
import {OP_ALL_GET, OP_CHAINID, splitter, splitterTitle} from "../../helpers/utils2";
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
        ZKUSD,
    } = await getContracts();
    let admin = "0xafc183BE937367B219F9283916d352f2C03ff512"; // k

    async function OP_CHECK_LIQUIDATOR() {
        async function checkIsLiquidator() {
            let pms = positionManager;
            let v = vault;
            splitterTitle("PositionManager.isLiquidator()");

            console.log(`v.isLiquidator(${pms.address}): ${await v.isLiquidator(pms.address)}`);
            console.log(`pms.isLiquidator(0x3aaa18176100dd870903d465134d0522457aa70d): ${await pms.isLiquidator("0x3aaa18176100dd870903d465134d0522457aa70d")}`);
            console.log(`pms.isLiquidator(0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2): ${await pms.isLiquidator("0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2")}`);
            console.log(`pms.isLiquidator(0x104b5cda666a504da51220035f930a77b22b8124): ${await pms.isLiquidator("0x104b5cda666a504da51220035f930a77b22b8124")}`);

            expect(await v.isLiquidator(pms.address)).to.be.true;
            expect(await pms.isLiquidator("0x3aaa18176100dd870903d465134d0522457aa70d")).to.be.false;
            expect(await pms.isLiquidator("0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2")).to.be.false;
            expect(await pms.isLiquidator("0x104b5cda666a504da51220035f930a77b22b8124")).to.be.false;

            console.log(`pms.isLiquidator(${vault.address}): ${await pms.isLiquidator(vault.address)}`);
            console.log(`v.isLiquidator(0x3aaa18176100dd870903d465134d0522457aa70d): ${await v.isLiquidator("0x3aaa18176100dd870903d465134d0522457aa70d")}`);
            console.log(`v.isLiquidator(0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2): ${await v.isLiquidator("0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2")}`);
            console.log(`v.isLiquidator(0x104b5cda666a504da51220035f930a77b22b8124): ${await v.isLiquidator("0x104b5cda666a504da51220035f930a77b22b8124")}`);


            expect(await pms.isLiquidator(vault.address)).to.be.false;
            expect(await v.isLiquidator("0x3aaa18176100dd870903d465134d0522457aa70d")).to.be.false;
            expect(await v.isLiquidator("0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2")).to.be.false;
            expect(await v.isLiquidator("0x104b5cda666a504da51220035f930a77b22b8124")).to.be.false;

            splitter();
        }
        async function checkPM() {
            let pm = positionManager;
            splitterTitle("PositionManager.opened()");
            console.log(`pm.opened: ${await pm.opened()}`);
            expect(await pm.opened()).to.be.true;

            console.log(`pm.isPartner(${owner.address}): ${await pm.isPartner(owner.address)}`);
            console.log(`pm.isPartner(${user0.address}): ${await pm.isPartner(user0.address)}`);
            console.log(`pm.isPartner(${user1.address}): ${await pm.isPartner(user1.address)}`);
            console.log(`pm.isPartner(0xFF546babBEA385fFb8108b3F0D4b137Cf1C29D72): ${await pm.isPartner("0xFF546babBEA385fFb8108b3F0D4b137Cf1C29D72")}`);
            expect(await pm.isPartner(owner.address)).to.be.false;
            expect(await pm.isPartner(user0.address)).to.be.false;
            expect(await pm.isPartner(user1.address)).to.be.false;
            expect(await pm.isPartner("0xFF546babBEA385fFb8108b3F0D4b137Cf1C29D72")).to.be.false;
            splitter();
        }

        await checkIsLiquidator();
        await checkPM();
    }
    async function OP_CHECK_CONTRACT() {
        async function checkPMNew() {
            let pm = positionManager;
            splitterTitle("CHECK PM NEW");
            console.log(`pm.gov: ${await pm.gov()}`);
            console.log(`pm.admin: ${await pm.admin()}`);
            expect(await pm.gov()).to.be.equal(admin);
            expect(await pm.admin()).to.be.equal(admin);
            splitter();
        }
        async function checkZKUSD() {
            splitterTitle("CheckZKUSD");
            let zkusd = ZKUSD;
            console.log(`ZKUSD.address: ${ZKUSD.address}`);
            console.log(`ZKUSD.gov: ${await ZKUSD.gov()}`);
            console.log(`ZKUSD.admins(${admin})       : ${await ZKUSD.admins(admin)}`);
            console.log(`ZKUSD.admins(${owner.address})     : ${await ZKUSD.admins(owner.address)}`);
            console.log(`ZKUSD.admins(${user0.address})     : ${await ZKUSD.admins(user0.address)}`);

            console.log(`userAddress: ${admin}`);

            expect(await zkusd.gov()).to.be.equal(admin);
            expect(await zkusd.admins(admin)).to.be.true;
            expect(await zkusd.admins(owner.address)).to.be.false;
            expect(await zkusd.admins(user0.address)).to.be.false;
            splitter();
        }
        async function checkVault() {
            splitterTitle("CheckVault");
            console.log(`vault.gov: ${await vault.gov()}`);
            console.log(`timelock: ${timelock.address}`);
            expect(await vault.gov()).to.be.equal(timelock.address);
        }
        async function checkVaultPriceFeed() {
            splitterTitle("vaultPriceFeed");
            expect(await vault.priceFeed()).to.be.eq(vaultPriceFeed.address);
            expect(await vaultPriceFeed.gov()).to.be.eq(admin);
        }

        await checkPMNew();
        await checkZKUSD();
        await checkVault();
        await checkVaultPriceFeed();
    }
    async function OP_CHECK_CONTRACT2() {
        let pm = positionManager;
        async function checkRouter() {
            splitterTitle("CheckRouter");
            expect(await router.gov()).to.be.eq(admin);
            expect(await router.vault()).to.be.eq(vault.address);
            expect(await router.zkusd()).to.be.eq(ZKUSD.address);
            expect(await router.weth()).to.be.eq(weth.address);
            expect(await router.plugins(pm.address)).to.be.true;
            expect(await router.plugins(admin)).to.be.false;
            expect(await router.plugins(owner.address)).to.be.false;
        }
        async function checkTimelock() {
            let t = timelock;
            splitterTitle("CheckTimelock");
            expect(await t.admin()).to.be.eq(admin);
            expect(await t.buffer()).to.be.eq(60);
            expect(await t.tokenManager()).to.be.eq(constants.AddressZero);
            expect(await t.mintReceiver()).to.be.eq(admin);
            expect(await t.zkdlpManager()).to.be.eq(admin);
            expect(await t.maxTokenSupply()).to.be.eq(parseEther("1000"));
            // expect(await t.marginFeeBasisPoints()).to.be.eq(10);
            expect(await t.maxMarginFeeBasisPoints()).to.be.eq(500);
        }
        async function checkVaultUtils() {
            splitterTitle("CheckVaultUtils");
            let vu = vaultUtils;
            expect(await vu.gov()).to.be.eq(admin);
            expect(await vu.vault()).to.be.eq(vault.address);
        }
        await checkRouter();
        await checkTimelock();
        await checkVaultUtils();
    }

    await OP_CHAINID();

    await OP_ALL_GET();
    await OP_CHECK_LIQUIDATOR();
    await OP_CHECK_CONTRACT();
    await OP_CHECK_CONTRACT2();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
