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
import {OP_ALL_GET, OP_CHAINID, OP_GET_VAULT, OP_TOKEN_INTERVAL, splitter, splitterTitle} from "../../helpers/utils2";

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
        ZKDX: zkdx,
        doge: doge,
        ltc: ltc,
        arb: arb,
        fil: fil,

        /* added @0505*/
        msft: msft,
        tsla: tsla,
    } = await getContracts();
    let admin = secret.adminAddress;
    let pm = positionManager;
    let v = vault;
    let t = timelock;
    let dai = usdc;
    async function OP_CHECK_CONTRACT() {
        splitterTitle("OP_CHECK_CONTRACT");
        splitterTitle("OP_CHECK_CONTRACT");
        async function checkDeployZKDLP() {
            splitterTitle("checkDeployZKDLP");
            expect(await zkdlp.gov()).to.be.eq(admin);
            expect(await zkdlp.name()).to.be.eq("ZKDLP");
            expect(await zkdlp.symbol()).to.be.eq("ZKDLP");
            expect(await zkdlp.id()).to.be.eq("ZKDLP");
            // expect(await zkdlp.totalSupply()).to.be.gt(0);
        }
        async function checkDeployZkdlpManager() {
            let m = zkdlpManager;
            splitterTitle("checkDeployZkdlpManager");
            expect(await m.gov()).to.be.eq(admin);
            expect(await m.vault()).to.be.eq(v.address);
            expect(await m.zkUsd()).to.be.eq(zkusd.address);
            expect(await m.zkdlp()).to.be.eq(zkdlp.address);
            expect(await m.shortsTracker()).to.be.eq(shortsTracker.address);
            expect(await m.cooldownDuration()).to.be.eq(0);
        }

        async function checkDeployZKDX() {
            splitterTitle("checkDeployZKDX");
            expect(zkdx.address).to.be.not.eq(constants.AddressZero);
            expect(await zkdx.id()).to.be.eq("ZKDX");
            expect(await zkdx.name()).to.be.eq("ZKDX");
            expect(await zkdx.symbol()).to.be.eq("ZKDX");
            expect(await zkdx.totalSupply()).to.be.eq(0);
            expect(await zkdx.gov()).to.be.eq(admin);
        }

        await checkDeployZKDLP();
        await checkDeployZkdlpManager();
        await checkDeployZKDX();


    }

    async function OP_CHECK_CONTRACT2() {
        async function checkRouter_Plugins() {
            expect(await router.plugins(pm.address)).to.be.eq(true);
        }
        async function checkVault_WhiteList() {
            expect(await v.whitelistedTokenCount()).to.be.eq(9);
            expect(await v.whitelistedTokens(dai.address)).to.be.true;
            expect(await v.whitelistedTokens(weth.address)).to.be.true;
            expect(await v.whitelistedTokens(wbtc.address)).to.be.true;
            expect(await v.whitelistedTokens(zkusd.address)).to.be.false;
            expect(await v.whitelistedTokens(zkdlp.address)).to.be.false;
            expect(await v.whitelistedTokens(doge.address)).to.be.true;
            expect(await v.whitelistedTokens(ltc.address)).to.be.true;
            expect(await v.whitelistedTokens(arb.address)).to.be.true;
            expect(await v.whitelistedTokens(fil.address)).to.be.true;
            expect(await v.whitelistedTokens(msft.address)).to.be.true;
            expect(await v.whitelistedTokens(tsla.address)).to.be.true;
        }
        async function checkVault_Fees() {
            expect(await v.maxLeverage()).to.be.eq(100 * 10000); // 50x
            expect(await v.taxBasisPoints()).to.be.eq(50); // 0.5%
            expect(await v.stableTaxBasisPoints()).to.be.eq(20); // 0.2%
            expect(await v.mintBurnFeeBasisPoints()).to.be.eq(30); // 0.3%
            expect(await v.swapFeeBasisPoints()).to.be.eq(30); // 0.3%
            expect(await v.stableSwapFeeBasisPoints()).to.be.eq(4); // 0.04%
            // expect(await v.marginFeeBasisPoints()).to.be.eq(500); // 0.1%
            expect(await v.fundingInterval()).to.be.eq(3600); // 1 hour

            expect(await v.maxGasPrice()).to.be.eq(0);
            expect(await v.minProfitTime()).to.be.eq(3600); // 1 hour
            expect(await v.liquidationFeeUsd()).to.be.eq(parseUnits("5", 30));
            expect(await v.hasDynamicFees()).to.be.eq(false);
            expect(await v.gov()).to.be.eq(timelock.address);
        }

        await checkRouter_Plugins();
        await checkVault_WhiteList();
        await checkVault_Fees();
    }

    await OP_CHAINID();

    await OP_CHECK_CONTRACT();
    await OP_CHECK_CONTRACT2();
    await OP_ALL_GET();
    await OP_GET_VAULT();


    await OP_TOKEN_INTERVAL();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
