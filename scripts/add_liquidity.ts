import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {deployments, ethers, getChainId} from "hardhat";
import {ApproveAmount, getUpdateDataAllByChainId, getUpdateDataMainnet, waitContractDeployed} from "../helpers/utils";
import {
    PositionManager,
    Reader,
    Router,
    Token,
    Vault,
    VaultErrorController,
    VaultPriceFeed,
    VaultUtils
} from "../typechain";
import {BigNumber} from "ethers";
import {DefaultParams2, getDeployByChainIdAndName, getFeedIdByChainAndToken} from "../helpers/chains";
import {
    DOGE_DEFAULT_AMOUNT,
    FEED_ID_ARB_MAIN,
    FEED_ID_BTC_MAIN, FEED_ID_DOGE_MAIN,
    FEED_ID_ETH_MAIN, FEED_ID_FIL_MAIN,
    FEED_ID_LTC_MAIN, FEED_ID_MSFT_MAIN, FEED_ID_TSLA_MAIN, FEED_ID_USDC_MAIN
} from "../helpers/constants";
import {getEquityConfig, getTokenConfig} from "../helpers/params";
import chalk from "chalk";
import {address} from "hardhat/internal/core/config/config-validation";

let owner,
    zkdlpManager,
    zkdlp,
    rewardRouter,
    usdc,
    weth,
    wbtc,
    ltc,
    doge,
    arb,
    fil,
    msft,
    tsla,
    chainId,
    vault,
    positionManager,
    vaultPriceFeed,
    timelock

async function getContracts() {

    const res: any = {
        owner: await ethers.getNamedSigner("owner"),
        vault: await ethers.getContract<Vault>("Vault"),
        router: await ethers.getContract<Router>("Router"),
        zkdlpManager: await ethers.getContract("ZkdlpManager"),
        zkdlp: await ethers.getContract("ZKDLP"),
        rewardRouter: await ethers.getContract("RewardRouter"),
        vaultPriceFeed: await ethers.getContract<VaultPriceFeed>("VaultPriceFeed"),
        positionManager: await ethers.getContract<PositionManager>("PositionManager"),
        reader: await ethers.getContract<Reader>("Reader"),
        vaultUtils: await ethers.getContract<VaultUtils>("VaultUtils"),
        vaultErrorController: await ethers.getContract<VaultErrorController>("VaultErrorController"),
        usdc: await ethers.getContract<Token>("USDC"),
        weth: await ethers.getContract<Token>("WNative"),
        wbtc: await ethers.getContract<Token>("WBTC"),
        doge: await ethers.getContract<Token>("DOGE"),
        ltc: await ethers.getContract<Token>("LTC"),
        arb: await ethers.getContract<Token>("ARB"),
        fil: await ethers.getContract<Token>("FIL"),
        msft: await ethers.getContract<Token>("MSFT"),
        tsla: await ethers.getContract<Token>("TSLA"),
        timelock: await ethers.getContract("Timelock")
    };

    return res;
}

async function main() {

    ({
        owner,
        zkdlpManager,
        zkdlp,
        rewardRouter,
        usdc,
        weth,
        wbtc,
        ltc,
        doge,
        arb,
        fil,
        msft,
        tsla,
        vault,
        positionManager,
        vaultPriceFeed,
        timelock
    } = await getContracts());
    chainId = await getChainId();

    // ======================== MaxGlobalSizes ============================
    // let shortSizeLarge = parseUnits("1200000000", 30);
    // let shortSizeSmall = parseUnits("400000000", 30);
    // await positionManager.setMaxGlobalSizes(
    //     [wbtc.address, weth.address, ltc.address, doge.address, arb.address, fil.address],
    //     [0, 0, 0, 0, 0, 0],
    //     [shortSizeLarge, shortSizeLarge, shortSizeSmall, shortSizeSmall, shortSizeSmall, shortSizeSmall]
    // );
    // console.log("usdc address:", usdc.address);
    // let poolAmountUsdc = await vault.poolAmounts(usdc.address);
    // console.log("poolAmountUsdc:", formatEther(poolAmountUsdc));
    // let shortSizeBtc = await positionManager.maxGlobalShortSizes(wbtc.address);
    // console.log("shortSizeBtc:", formatUnits(shortSizeBtc, 30));
    // let allWhitelistedTokensLength = await vault.allWhitelistedTokensLength();
    // console.log("allWhitelistedTokensLength:", allWhitelistedTokensLength);
    // let isMsftEquity = await vault.equityTokens(msft.address);
    // console.log("isMsftEquity:", isMsftEquity);
    // let isTslaEquity = await vault.equityTokens(tsla.address);
    // console.log("isTslaEquity:", isTslaEquity);
    // let allowStaleEquityPrice = await vault.allowStaleEquityPrice();
    // console.log("allowStaleEquityPrice:", allowStaleEquityPrice);
    // let validTime = await vaultPriceFeed.validTime();
    // console.log("validTime:", validTime.toNumber()); // 1day
    // await timelock.setTokenConfig(vault.address, ...getEquityConfig(msft));
    // await timelock.setTokenConfig(vault.address, ...getEquityConfig(tsla));

    // ===================== Add Liquidity ===========================
    // await buyLp(usdc, parseEther("3000000000"));
    // await buyLp(weth, parseEther("10000"));
    // await buyLp(wbtc, parseUnits("1000", 8));
    // await buyLp(ltc, parseEther("10000"));
    // await buyLp(doge, parseEther("10000000"));
    // await buyLp(arb, parseEther("100000"));
    // await buyLp(fil, parseEther("100000"));
    // await buyLp(msft, parseEther("100000"));
    // await buyLp(tsla, parseEther("100000"));
}

async function buyLp(token: any, amount: BigNumber) {
    console.log(`adding liquidity for ${await token.name()}...`)
    let lpBalance = await zkdlp.balanceOf(owner.address);
    console.log("lpBalance:", formatEther(lpBalance));
    let balance = await token.balanceOf(owner.address);
    if (balance.lt(amount)) {
        console.log("minting...");
        let tx = await token.mint(owner.address, amount);
        await tx.wait();
    }
    let allowance = await token.allowance(owner.address, zkdlpManager.address);
    if (allowance.lt(amount)) {
        console.log("approve...");
        let tx = await token.approve(zkdlpManager.address, ApproveAmount);
        await tx.wait();
    }
    console.log("buying...");
    let {
        updateData,
        fee
    } = await getUpdateDataMainnet([FEED_ID_ETH_MAIN, FEED_ID_BTC_MAIN, FEED_ID_LTC_MAIN, FEED_ID_ARB_MAIN, FEED_ID_DOGE_MAIN, FEED_ID_FIL_MAIN], chainId);
    await rewardRouter.connect(owner).mintAndStakeZkdlp(token.address, amount, 0, 0, updateData, {value: fee});
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
