import {deployments, ethers, getChainId} from 'hardhat';
import {minLiquidationFee} from "../helpers/params";
import {formatEther, parseEther, parseUnits} from "ethers/lib/utils";
import {DefaultExecuteParams2, DefaultParams2, getFeedIdByChainAndToken} from "../helpers/chains";
import {getInterval, getWETHContract} from "../helpers/utils";
import {sleep} from "../helpers/utils2";
import {LONG_SIZE_AMOUNTS, SHORT_SIZE_AMOUNTS} from "../helpers/constants";
import {parse} from "url";

const {execute, read, deploy, get} = deployments;

async function main() {

    console.log(">> runs testnet...");
    const {owner} = await ethers.getNamedSigners();
    const reader  = await ethers.getContract("Reader");
    const vault = await ethers.getContract("Vault");
    const wnative = await ethers.getContract("WNative");
    const zusd = await ethers.getContract("ZUSD");
    const usdc = await ethers.getContract("USDC");
    const exchanger = await ethers.getContract("Exchanger");

    // const cap = await exchanger.cap();
    // console.log("cap:", formatEther(cap));
    // const exchangeAmount = await exchanger.exchangeAmount();
    // console.log("exchangeAmount:", formatEther(exchangeAmount));

    // const positionManager = await ethers.getContract("PositionManager");
    // const chainId = await getChainId();
    //
    // // get Tokens
    // const weth = await getWETHContract(chainId);
    // const wbtc = await ethers.getContract("WBTC");
    // const doge = await ethers.getContract("DOGE");
    //
    // // pm.setMaxGlobalSizes
    // await sleep(getInterval(chainId));
    // await positionManager.setMaxGlobalSizes(
    //     [weth.address, wbtc.address, doge.address],
    //     [LONG_SIZE_AMOUNTS, LONG_SIZE_AMOUNTS, LONG_SIZE_AMOUNTS],
    //     [SHORT_SIZE_AMOUNTS, SHORT_SIZE_AMOUNTS, SHORT_SIZE_AMOUNTS],
    //     await DefaultExecuteParams2(chainId)
    // );

    // await usdc.mint(owner.address, parseUnits("200", 6), {gasPrice: parseUnits("2", "gwei")});
    // await usdc.mint("0x07970F8F26840EC6C2CB23abDF2CD6C17368b526", parseUnits("200", 6), {gasPrice: parseUnits("2", "gwei")});
    // await usdc.mint("0x97AbCd8b901CA10282046DC143456f83deBEBAdC", parseUnits("1000", 6), {gasPrice: parseUnits("2", "gwei")});
    // await usdc.mint("0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D", parseUnits("200", 6), {gasPrice: parseUnits("2", "gwei")});
    // await zusd.mint("0x4e8730f175811C3079C411309DB823E62a4f9598", parseEther("10000"));
    // await zusd.mint(owner.address, parseEther("10000"));

    // const rates = await reader.getFundingRates(vault.address, wnative.address, [wbtc.address, wnative.address, zusd.address, "0xb80831af2735543934d7919a6f4b61d7538b5fac"]);
    // for (let i = 0; i < rates.length; i++)
    //     console.log("rate-" + i + ":", rates[i].toNumber());

    // await execute("Exchanger", {from: owner.address}, "setCap", parseEther("10000"));

    // await execute("VaultPriceFeed", await DefaultParams2(chainId), "setFeedIds", [USDC.address], [getFeedIdByChainAndToken(chainId, "USDC")]);
    // await USDC.mint("0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D", parseEther("10000"));
    // await execute("USDC", {
    //     from: owner.address,
    //     nonce: 315
    // }, "mint", "0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D", parseEther("10000"));

    // const trueUSDC = await ethers.getContract("trueUSDC");
    // await trueUSDC.mint("0x4e8730f175811C3079C411309DB823E62a4f9598", parseUnits("50000", 6))
    // console.log("usdc in...")
    // let usdcAmountIn = parseEther("320000000");
    // await usdc.mint(owner.address, usdcAmountIn);
    // await usdc.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // let {updateData, fee} = await getUpdateDataAllByChainId(chainId);
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(usdc.address, usdcAmountIn, 0, 0, updateData, {value: fee});
    //
    // let shortSize = parseUnits("50000000", 30);
    // await positionManager.setMaxGlobalSizes(
    //     [weth.address, wbtc.address, doge.address, ltc.address, arb.address, fil.address, msft.address, tsla.address],
    //     [0, 0, 0, 0, 0, 0, 0, 0],
    //     [shortSize, shortSize, shortSize, shortSize, shortSize, shortSize, shortSize, shortSize]
    // );

    // ===================== Gas Limit ================================
    // let fee = await parseEther("0.0014");
    // let gasPrice = await parseUnits("0.25", "gwei");
    // let gasLimit = fee.div(gasPrice);
    // console.log(">> gasLimit: ", gasLimit.toString());

    // ===================== Mint Tokens ================================
    // let receiver = "0x603666f69a88c21F9D56AB09876e835F5eE59dA5"
    // await weth.mint(receiver, parseEther("30000"));
    // await wbtc.mint(receiver, parseUnits("3000", 8));
    // await usdc.mint(receiver, parseUnits("80000000"));
    // await doge.mint(receiver, parseEther("600000000"));
    // await ltc.mint(receiver, parseEther("600000"));
    // await arb.mint(receiver, parseEther("60000000"));
    // await fil.mint(receiver, parseEther("50000000"));
    // await msft.mint(receiver, parseEther("600000"));
    // await tsla.mint(receiver, parseEther("30000000"));

    // ===================== Set Funding Rate ================================
    // setFundingRate(address _vault, uint256 _fundingInterval, uint256 _fundingRateFactor, uint256 _stableFundingRateFactor)
    // await timelock.setFundingRate(vault.address, 3600, 1000, 1000);

    // ===================== Buy zkdlp ================================
    // let bal1 = await zkdlp.balanceOf(owner.address);
    // console.log('bal1', formatEther(bal1));
    // console.log("doge in...")
    // let dogeAmountIn = parseEther("20000000");
    // await doge.mint(owner.address, dogeAmountIn);
    // await doge.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // let {updateData, fee} = await getUpdateDataTestnetAll();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(doge.address, dogeAmountIn, 0, 0, updateData, {value: fee});
    //
    // let bal2 = await zkdlp.balanceOf(owner.address);
    // console.log('bal2', formatEther(bal2));

    // ===================== Set Feed IDs ================================
    // await vaultPriceFeed.setFeedIds(
    //     [weth.address, wbtc.address, usdc.address, doge.address, ltc.address, arb.address, fil.address],
    //     [FEED_ID_ETH_TEST, FEED_ID_BTC_TEST, FEED_ID_USDC_TEST, FEED_ID_DOGE_TEST, FEED_ID_LTC_TEST, FEED_ID_ARB_TEST, FEED_ID_FIL_TEST]
    // );

    // ===================== Set Token Config ================================
    // await execute("Vault", {from: owner.address}, "setTokenConfig", ...getTokenConfig(doge));
    // await execute("Vault", {from: owner.address}, "setTokenConfig", ...getTokenConfig(ltc));
    // await execute("Vault", {from: owner.address}, "setTokenConfig", ...getTokenConfig(arb));
    // await execute("Vault", {from: owner.address}, "setTokenConfig", ...getTokenConfig(fil));

    // ===================== Set Max Global Sizes ================================
    // await positionManager.setMaxGlobalSizes(
    //     [weth.address, wbtc.address],
    //     [toUsd(1000000), toUsd(1000000)],
    //     [toUsd(1000000), toUsd(1000000)]
    // );

    // ===================== Distribute fee to robots ================================
    // let robots = [
    //     "0x3aaa18176100dd870903d465134d0522457aa70d",
    //     "0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2",
    //     "0x104b5cda666a504da51220035f930a77b22b8124",
    // ]
    //
    // for (let i = 0; i < robots.length; i++) {
    //     await owner.sendTransaction({
    //         to: robots[i],
    //         value: parseEther("0.5")
    //     })
    // }

    // ===================== Set liquidators ================================
    // let liquidators = [
    //     "0x1b87292764856c0504e63d561b1cc033e9bf8f89",
    //     "0xd3a962e594a4f6a15ac3e73edaa94e9c6398e68c"
    // ]
    // for (let i = 0; i < liquidators.length; i++) {
    //     await positionManager.setLiquidator(liquidators[i], true);
    // }

    // ===================== Pricing ================================
    // let wnativePriceFeed = await ethers.getContract<PriceFeed>("WNativePriceFeed");
    // await wnativePriceFeed.setLatestAnswer(toChainlinkPrice(1.065))
    // await wnativePriceFeed.setLatestAnswer(toChainlinkPrice(1.07))
    // await wnativePriceFeed.setLatestAnswer(toChainlinkPrice(1.061))

    // let WethPriceFeed = await ethers.getContract<PriceFeed>("WethPriceFeed");
    // await WethPriceFeed.setLatestAnswer(toChainlinkPrice(1187))
    // await WethPriceFeed.setLatestAnswer(toChainlinkPrice(1539))
    // await WethPriceFeed.setLatestAnswer(toChainlinkPrice(1538))

    // ===================== Close ================================
    // let paramsDe = [
    //     [weth.address], // _path
    //     weth.address, // _indexToken
    //     toUsd(0), // _collateralDelta
    //     toUsd(18693.56), // _sizeDelta
    //     true, // _isLong
    //     owner.address,  // _receiver
    //     toUsd(1400),  // _price
    //     toUsd(0), // _minOut
    //     false // _withdrawETH
    // ]
    // await positionManager.decreasePosition(...paramsDe);
    //
    // console.log("Done.")

    // ===================== Liquidate ================================
    // await positionManager.setLiquidator(owner.address, true);
    // await positionManager.liquidatePosition(owner.address, weth.address, weth.address, true, owner.address);

    // ===================== setFees ================================
    // console.log("taxBasisPoints", (await vault.taxBasisPoints()).toNumber());
    // console.log("stableTaxBasisPoints", (await vault.stableTaxBasisPoints()).toNumber());
    // console.log("mintBurnFeeBasisPoints", (await vault.mintBurnFeeBasisPoints()).toNumber());
    // console.log("swapFeeBasisPoints", (await vault.swapFeeBasisPoints()).toNumber());
    // console.log("stableSwapFeeBasisPoints", (await vault.stableSwapFeeBasisPoints()).toNumber());
    // console.log("marginFeeBasisPoints", (await vault.marginFeeBasisPoints()).toNumber());
    // console.log("liquidationFeeUsd", formatUnits(await vault.liquidationFeeUsd(), 30));
    // console.log("minProfitTime", (await vault.minProfitTime()).toNumber());
    // console.log("hasDynamicFees", await vault.hasDynamicFees());

    // await timelock.setMarginFeeBasisPoints(10, 10);

    // await timelock.setFees(
    //     vault.address,
    //     50, // _taxBasisPoints,
    //     20, // _stableTaxBasisPoints,
    //     30, // _mintBurnFeeBasisPoints,
    //     30, // _swapFeeBasisPoints,
    //     4, // _stableSwapFeeBasisPoints,
    //     10, // _marginFeeBasisPoints,
    //     parseUnits("5", 30), // _liquidationFeeUsd,
    //     0, // _minProfitTime,
    //     false
    // );

    // ===================== setFaucets ================================
    // await usdc.setInterval(0);
    // await wnative.setInterval(30);
    // await weth.setInterval(30);
    // await weth.setFaucetAmount(parseEther("10"));
    // await positionManager.setLiquidator("0x0cc60f3e4a6c3fbbcd932489c72b7c07bc49251d", true);

    // ===================== Faucets ================================
    // const owner = await ethers.getNamedSigner("owner");
    // await execute("WNative", {from: owner.address}, "setInterval", 0);
    // await execute("WNative", {from: owner.address}, "faucet");
    // await execute("WNative", {from: owner.address}, "faucet");
    // let bal = await read("WNative", {from: owner.address}, "balanceOf", owner.address);
    // console.log("balance WNative", formatEther(bal));

    // ===================== Set PriceFeed ================================
    // const VaultPriceFeed = await deploy("VaultPriceFeed", {
    //     from: owner.address,
    //     args: [PYTH_CONTRACT_ZKSYNC_TESTNET],
    //     log: true,
    // });
    // console.log("VaultPriceFeed:", VaultPriceFeed.address);
    // await timelock.signalSetPriceFeed(vault.address, VaultPriceFeed.address);
    // let tokens = [weth.address, wbtc.address, usdc.address],
    //     feedIds = [FEED_ID_ETH_TEST, FEED_ID_BTC_TEST, FEED_ID_USDC_TEST];
    // await execute("VaultPriceFeed", {from: owner.address}, "setFeedIds", tokens, feedIds);


    // const priceFeed = await vault.priceFeed();
    // console.log("priceFeed:", priceFeed);
    // let tx = await timelock.setPriceFeed(vault.address, "0x33dFB03e1e2BAE759adc7f9293a80285480C86ff");
    // console.log("tx:", tx.hash);
    // const priceFeed2 = await vault.priceFeed();
    // console.log("priceFeed2:", priceFeed2);

    // await deploy("Reader", {
    //     from: owner.address,
    //     args: [],
    //     log: true,
    // }); // 0x2C3820F628F9B3a8B4Ac0846ca42541f0Dd43DC8

    // ===================== Set FastPrice ================================
    // await vaultPriceFeed.setFastPrices([weth.address, wbtc.address, usdc.address],
    //     [toUsd(1865), toUsd(27342), toUsd(1)]);
    // await vaultPriceFeed.setFastFeed(false);
    // let btcPrice = await vaultPriceFeed.getPrice(wbtc.address, true, false);
    // console.log("btcPrice:", formatUnits(btcPrice, 30));


}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
