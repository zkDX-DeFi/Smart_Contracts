import {deployments, ethers, getChainId} from 'hardhat';
import {
    AddressZero,
    getContracts,
    getUpdateDataTestnet,
    getUpdateDataTestnetAll
} from "../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {FEED_ID_BTC_TEST} from "../helpers/constants";
import {getLiqPrice, updateMarkPrice} from "../helpers/utilsForTest";
import {DefaultParams2, getFeedIdByChainAndToken} from "../helpers/chains";

const {execute, read} = deployments;

async function main() {

    let VaultPriceFeed = await ethers.getContract("VaultPriceFeed");
    let ORDI = await ethers.getContract("ORDI");
    let chainId = await getChainId();

    let validTime = await VaultPriceFeed.validTime();
    console.log("validTime:", validTime.toNumber());

    // let openMintUsdc = await usdc.openMint();
    // console.log("openMintUsdc:", openMintUsdc);
    // let openMintWbtc = await wbtc.openMint();
    // console.log("openMintWbtc:", openMintWbtc);
    // let openMintWeth = await weth.openMint();
    // console.log("openMintWeth:", openMintWeth);
    // let openMintDoge = await doge.openMint();
    // console.log("openMintDoge:", openMintDoge);
    // let openMintArb = await arb.openMint();
    // console.log("openMintArb:", openMintArb);
    // let openMintFil = await fil.openMint();
    // console.log("openMintFil:", openMintFil);
    // let openMintTsla = await tsla.openMint();
    // console.log("openMintTsla:", openMintTsla);
    // let openMintMsft = await msft.openMint();
    // console.log("openMintMsft:", openMintMsft);
    // let openMintLtc = await ltc.openMint();
    // console.log("openMintLtc:", openMintLtc);
    //
    // let positionManager = await ethers.getContract("PositionManager");
    // console.log("admin:", await positionManager.admin());

    // await usdc.setOpenMint(false)
    // await wbtc.setOpenMint(false)
    // await weth.setOpenMint(false)
    // await doge.setOpenMint(false)
    // await arb.setOpenMint(false)

    // const {
    //     reader,
    //     vault,
    //     weth,
    //     wbtc,
    //     positionManager,
    //     router,
    //     rewardRouter,
    //     vaultUtils,
    //     zkdlp,
    //     owner,
    //     user0,
    //     user1,
    //     usdc,
    //     wnative,
    //     zkdlpManager,
    //     vaultErrorController,
    //     vaultPriceFeed,
    //     doge,
    //     ltc,
    //     arb,
    //     fil,
    //     tsla,
    //     msft,
    //     orderBook,
    //     orderBookReader,
    //     timelock
    // } = await getContracts();

    // let total = await read("ZKDXNFT", "totalSupply");
    // console.log("total:", total.toString());

    // let chainId = await getChainId()
    // console.log("chainId:", chainId);
    // let v = await ethers.getContractAt("Vault", "0x28BF4c9C3F3D60F23f6fbf46D2008B7C914A8E72");
    // let router = await v.router();
    // console.log("router:", router);
    // let whitelistToken = await v.allWhitelistedTokens(0);
    // console.log("whitelistToken:", whitelistToken);
    // let whitelistedTokenCount = await v.whitelistedTokenCount();
    // console.log("whitelistedTokenCount:", whitelistedTokenCount.toNumber());

    // let aumAddition = await zkdlpManager.aumAddition();
    // console.log("aumAddition:", formatEther(aumAddition));

    // ===================== Orders ================================
    // let account = "0x0deAbDA10f6AA947aB79b70eE2271272c9caBf7A"
    // let order = await orderBook.decreaseOrders(account, 4)
    // console.log("indexToken:", order["indexToken"]);
    // console.log("isLong:", order["isLong"]);
    // console.log("sizeDelta:", formatUnits(order["sizeDelta"], 30));
    // console.log("collateralDelta::", formatUnits(order["collateralDelta"], 30));
    // console.log("triggerPrice:", formatUnits(order["triggerPrice"], 30));
    // console.log("triggerAboveThreshold:", order["triggerAboveThreshold"]);


    // ===================== Get Delta ================================
    // let deltaAll = await vault.getPositionDelta(account, wbtc.address, wbtc.address, true);
    // console.log("deltaAll:", deltaAll);
    // console.log("deltaAll:", formatUnits(deltaAll[1], 30));
    // let delta = await vault.getDelta(wbtc.address, weth.address, parseEther("1"), parseEther("1"));

    // ===================== Executor Balance ================================
    // let transfer = parseEther("0.1").sub(parseEther("0.067793668499999933"))
    // console.log("transfer:", formatEther(transfer));
    // await owner.sendTransaction({
    //     to: "0x3aaa18176100dD870903D465134d0522457AA70D",
    //     value: transfer
    // });

    // ===================== Fees ================================
    // let taxBasisPoints = await vault.taxBasisPoints();
    // console.log("taxBasisPoints:", taxBasisPoints.toString());
    // let stableTaxBasisPoints = await vault.stableTaxBasisPoints();
    // console.log("stableTaxBasisPoints:", stableTaxBasisPoints.toString());
    // let mintBurnFeeBasisPoints = await vault.mintBurnFeeBasisPoints();
    // console.log("mintBurnFeeBasisPoints:", mintBurnFeeBasisPoints.toString());
    // let swapFeeBasisPoints = await vault.swapFeeBasisPoints();
    // console.log("swapFeeBasisPoints:", swapFeeBasisPoints.toString());
    // let stableSwapFeeBasisPoints = await vault.stableSwapFeeBasisPoints();
    // console.log("stableSwapFeeBasisPoints:", stableSwapFeeBasisPoints.toString());
    // let marginFeeBasisPoints = await vault.marginFeeBasisPoints();
    // console.log("marginFeeBasisPoints:", marginFeeBasisPoints.toString());
    // let liquidationFeeUsd = await vault.liquidationFeeUsd();
    // console.log("liquidationFeeUsd:", formatEther(liquidationFeeUsd));
    // let minProfitTime = await vault.minProfitTime();
    // console.log("minProfitTime:", minProfitTime.toString());
    // let hasDynamicFees = await vault.hasDynamicFees();
    // console.log("hasDynamicFees:", hasDynamicFees);

    // ===================== Orders ================================
    // let index = await orderBook.decreaseOrdersIndex(owner.address);
    // console.log("index:", index.toString());
    // let order = await orderBook.increaseOrders("0x4e8730f175811c3079c411309db823e62a4f9598", 0);
    // console.log("order:", order);
    // console.log("purchaseTokenAmount:", formatEther(order["purchaseTokenAmount"]));

    // ===================== Price ================================
    // let p1 = await vaultPriceFeed.getPrice(tsla.address, false, false);
    // console.log("tsla price:", formatUnits(p1, 30));

    // ===================== Aums ================================
    // let len = await vault.allWhitelistedTokensLength();
    // console.log("len:", len.toString());
    // let aums = await zkdlpManager.getAums();
    // console.log("max aum:", formatUnits(aums[0], 30));
    // console.log("min aum:", formatUnits(aums[1], 30));
    // let maxAum = await zkdlpManager.getAum(true);
    // let minAum = await zkdlpManager.getAum(false);
    // console.log("max aum:", formatUnits(maxAum, 30));
    // console.log("min aum:", formatUnits(minAum, 30));
    // let zkdlpTotal = await zkdlp.totalSupply();
    // console.log("zkdlp total:", formatEther(zkdlpTotal));
    // let zkdlpPrice = maxAum.div(zkdlpTotal);
    // console.log("zkdlp price:", formatUnits(zkdlpPrice, 12));

    // ===================== Price ================================
    // let maxPrice = await vault.getMaxPrice(wnative.address);
    // console.log("maxPrice:", formatUnits(maxPrice, 8));
    // let minPrice = await vault.getMinPrice(wnative.address);
    // console.log("minPrice:", formatUnits(minPrice, 8));

    // ===================== Params ================================
    // const isInitialized = await vault.isInitialized();
    // console.log("isInitialized:", isInitialized);
    // const errorController = await vault.errorController();
    // console.log("errorController:", errorController);
    // const gov = await vaultErrorController.gov();
    // console.log("gov:", gov);
    // const e1 = await vault.errors(1);
    // console.log("e1:", e1);
    // const marginFeeBasisPoints = await vault.marginFeeBasisPoints(); // 0.001 * sizeDelta
    // console.log("marginFeeBasisPoints:", formatEther(marginFeeBasisPoints));
    // const cumulativeFundingRates = await vault.cumulativeFundingRates(weth.address);
    // console.log("cumulativeFundingRates:", formatEther(cumulativeFundingRates));
    // const maxLeverage = await vault.maxLeverage();
    // console.log("maxLeverage:", maxLeverage.toNumber());
    // const liquidationFeeUsd = await vault.liquidationFeeUsd();
    // console.log("liquidationFeeUsd:", formatUnits(liquidationFeeUsd, 30));
    // let aumAddition = await zkdlpManager.aumAddition();
    // console.log("aumAddition:", aumAddition);
    // let aumDeduction = await zkdlpManager.aumDeduction();
    // console.log("aumDeduction:", aumDeduction);
    // let maxGasPrice = await vault.maxGasPrice();
    // console.log("maxGasPrice:", formatUnits(maxGasPrice, 0));
    // let minProfitTime = await vault.minProfitTime();
    // console.log("minProfitTime:", minProfitTime);

    // ===================== Requests ================================
    // let count = await positionRouter.increasePositionsIndex(user);
    // console.log("count:", count.toNumber());
    // let key = await positionRouter.getRequestKey(user, count);
    // let request = await positionRouter.increasePositionRequests(key);
    // console.log("request:", request);

    // ===================== Positions ================================
    // let k = await vault.getPositionKey(user, wbtc.address, wbtc.address, true);
    // console.log("k:", k);
    // let _collateralTokens = [usdc.address];
    // let _indexTokens = [weth.address];
    // let _isLong = [false];
    // let positions = await reader.getPositions(vault.address, "0x475b6ff6603F17177B7E419d1aD2791fb82a3a56", _collateralTokens, _indexTokens, _isLong);
    // for (let i = 0; i < positions.length;) {
    //     console.log(" ===================================================== ");
    //     console.log("$size:", formatUnits(positions[i++], 30));
    //     console.log("$collateral:", formatUnits(positions[i++], 30));
    //     console.log("$averagePrice:", formatUnits(positions[i++], 30));
    //     console.log("entryFundingRate:", positions[i++].toNumber());
    //     console.log("hasRealisedProfit:", positions[i++].toNumber());
    //     console.log("$realisedPnl", formatUnits(positions[i++], 30));
    //     console.log("lastIncreasedTime", positions[i++].toNumber());
    //     console.log("hasProfit", positions[i++].toNumber());
    //     console.log("delta", formatUnits(positions[i++], 30));
    // }

    // ===================== Position Raw ================================
    // let key = await vault.getPositionKey(user, weth.address, weth.address, true);
    // let positionRaw = await vault.positions(key);
    // console.log("positionRaw:", positionRaw);

    // ===================== Amounts ================================
    // let token = ltc.address;
    // let poolAmount = await vault.poolAmounts(token);
    // console.log("poolAmount:", formatEther(poolAmount));
    // let reservedAmount = await vault.reservedAmounts(token);
    // console.log("reservedAmount:", formatEther(reservedAmount));
    // let bufferAmount = await vault.bufferAmounts(token);
    // console.log("bufferAmount:", formatEther(bufferAmount));
    // console.log("available:", formatEther(poolAmount.sub(reservedAmount)))
    // let feeAmount = await vault.feeReserves(token);
    // console.log("feeAmount DAI:", formatEther(feeAmount));
    // console.log("total DAI:", formatEther(poolAmount.add(feeAmount)));
    // let tokenBalance = await vault.tokenBalances(dai.address);
    // console.log("tokenBalances DAI:", formatEther(tokenBalance));

    // non-stable-token: tokenBalance = poolAmount + feeAmount
    // stable-token: tokenBalance = poolAmount + feeAmount + user's total collateral

    // let poolAmount = await vault.poolAmounts(weth.address);
    // console.log("poolAmount weth:", formatEther(poolAmount));
    // let reservedAmount = await vault.reservedAmounts(weth.address);
    // console.log("reservedAmount weth:", formatEther(reservedAmount));
    // console.log("available weth:", formatEther(poolAmount.sub(reservedAmount)))
    // let feeAmount = await vault.feeReserves(weth.address);
    // console.log("feeAmount weth:", formatEther(feeAmount));
    // console.log("total weth:", formatEther(poolAmount.add(feeAmount)));
    // let tokenBalance = await vault.tokenBalances(weth.address);
    // console.log("tokenBalances weth:", formatEther(tokenBalance));

    // let poolAmount = await vault.poolAmounts(wbtc.address);
    // console.log("poolAmount wbtc:", formatUnits(poolAmount, 8));
    // let reservedAmount = await vault.reservedAmounts(wbtc.address);
    // console.log("reservedAmount wbtc:", formatUnits(reservedAmount, 8));
    // console.log("available wbtc:", formatUnits(poolAmount.sub(reservedAmount, 8)))
    // let feeAmount = await vault.feeReserves(wbtc.address);
    // console.log("feeAmount wbtc:", formatUnits(feeAmount, 8));
    // console.log("total wbtc:", formatUnits(poolAmount.add(feeAmount), 8));
    // let tokenBalance = await vault.tokenBalances(wbtc.address);
    // console.log("tokenBalances wbtc:", formatUnits(tokenBalance, 8));

    // ===================== PoolAmounts ================================
    // let poolAmount1 = await vault.poolAmounts(weth.address);
    // console.log("poolAmount1 weth:", formatEther(poolAmount1));
    // let poolAmount2 = await vault.poolAmounts(wbtc.address);
    // console.log("poolAmount2 wbtc:", formatUnits(poolAmount2, 8));
    // let poolAmount3 = await vault.poolAmounts(usdc.address);
    // console.log("poolAmount3 usdc:", formatEther(poolAmount3));
    // let poolAmount4 = await vault.poolAmounts(doge.address);
    // console.log("poolAmount4 doge:", formatEther(poolAmount4));
    // let poolAmount5 = await vault.poolAmounts(arb.address);
    // console.log("poolAmount5 arb:", formatEther(poolAmount5));
    // let poolAmount6 = await vault.poolAmounts(fil.address);
    // console.log("poolAmount6 fil:", formatEther(poolAmount6));


    // ===================== getVaultTokenInfo ================================
    // let tokens = [arb.address];
    // const info = await reader.getVaultTokenInfo(vault.address, positionManager.address, weth.address, tokens);
    // for (let i = 0; i < tokens.length; i++) {
    //     let maxZkusdAmounts = info[5 + i * 12];
    //     let maxGlobalShortSize = info[7 + i * 12];
    //     console.log("maxZkusdAmounts:", formatEther(maxZkusdAmounts));
    //     console.log(`maxGlobalShortSize ${formatUnits(maxGlobalShortSize, 30)}`)
    // }

    // let shortSize = parseUnits("600000000", 30);
    // await positionManager.setMaxGlobalSizes([weth.address, wbtc.address], [0, 0], [shortSize, shortSize])


    // let globalShortSize = info[6];
    // let maxGlobalShortSize = info[7];
    // let available = maxGlobalShortSize.sub(globalShortSize);
    // console.log(`globalShortSize ${formatUnits(globalShortSize, 30)}`)
    // console.log(`maxGlobalShortSize ${formatUnits(maxGlobalShortSize, 30)}`)
    // console.log(`available ${formatUnits(available, 30)}`)

    // ===================== getFundingRates ================================
    // const rates = await reader.getFundingRates(vault.address, wnative.address, [wbtc.address, dai.address]);
    // for (let i = 0; i < rates.length; i++)
    //     console.log("rate-" + i + ":", rates[i].toNumber());

    // ===================== Receipt ================================
    // let hash = "0xc381b03f2cd0753fa335e6defd69e0118e85bc3ebb8c63c4a741afde3bdd887a"; // 2382976
    // let receipt = await ethers.provider.getTransactionReceipt(hash);
    // console.log("receipt:", receipt);
    // console.log("gasUsed:", receipt.gasUsed.toString());
    // console.log("cumulativeGasUsed:", receipt.cumulativeGasUsed.toString());
    // console.log("effectiveGasPrice:", receipt.effectiveGasPrice.toString());

    // ===================== Token Balances ================================
    // let account = "0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D";
    // let tokens = [
    //     "0x0000000000000000000000000000000000000000",
    //     "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    //     "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
    // ]
    // let tokenBalances = await reader.getTokenBalances(account, tokens);
    // console.log("balance:", tokenBalances)

    // ===================== Buy Fees ================================
    // let feeBasisPoints = await vaultUtils.getBuyUsdmFeeBasisPoints(weth.address, parseEther("1499"));
    // console.log("BuyUsdmFee:", feeBasisPoints.toNumber());
    // let zkdlpBalance = await zkdlp.balanceOf("0x9B6B26Db5F9149F0e3f4DAF2Eb98307020236dDB");
    // console.log("zkdlp balance:", formatEther(zkdlpBalance));

    // ===================== Liq Price ================================
    // let position = {
    //     size: parseUnits("15000", 30),
    //     collateral: parseUnits("1484", 30),
    //     averagePrice: parseUnits("1504", 30),
    //     entryFundingRate: 0,
    //     collateralToken: weth.address
    // }
    // let cumulativeFundingRates = await vault.cumulativeFundingRates(weth.address);
    // let price = getLiqPrice(position, cumulativeFundingRates, true);
    // console.log("liqPrice:", formatUnits(price, 30));

    // ===================== Valid Time ================================
    // let p = await vault.priceFeed();
    // console.log("priceFeed:", p);
    // let validTime = await vaultPriceFeed.validTime();
    // console.log("validTime:", validTime.toNumber());

    // ===================== Get Pyth Addr Mainet ================================
    // const implementation = await upgrades.erc1967.getImplementationAddress("0xf087c864AEccFb6A2Bf1Af6A0382B0d0f6c5D834");
    // console.log("implementation:", implementation);

    // ===================== Method Sign ================================
    // get method signature of vault.liquidatePosition
    // let method = positionManager.interface.getSighash("liquidatePosition");
    // console.log("method:", method);

    // ===================== Estimate Gas - Mint Zkdlp  ================================
    // let {updateData, fee} = await getUpdateDataTestnetAll();
    // let transaction = await rewardRouter.populateTransaction.mintAndStakeZkdlp(usdc.address, parseEther("1000"), 0, 0, updateData, {value: fee});
    // const gasLimit = await ethers.provider.estimateGas(transaction);
    // console.log("estimateGasLimit:", gasLimit.toNumber()); // 165329671 05-05 16:50

    // ===================== Estimate Gas - Faucet ================================
    // const transaction = await usdc.populateTransaction.faucet();
    // const gasLimit = await ethers.provider.estimateGas(transaction);
    // console.log("estimateGasLimit:", gasLimit.toNumber()); // 26000000

    // let {updateData, fee} = await getUpdateDataTestnet([FEED_ID_BTC_TEST]);
    // console.log(fee)
    // const transaction = await positionManager.populateTransaction.liquidatePosition(
    //     "0xfe34e1718dfb29b4e4dd68993ba7038735f9226a",
    //     "0xfe34e1718dfb29b4e4dd68993ba7038735f9226a",
    //     "0xfe34e1718dfb29b4e4dd68993ba7038735f9226a",
    //     true,
    //     "0x3aaa18176100dD870903D465134d0522457AA70D",
    //     updateData
    // );
    // const gasLimit = await ethers.provider.estimateGas(transaction);
    // console.log("estimateGasLimit:", gasLimit.toNumber());

    // ===================== Get Token Config ================================
    // let isStable = await vault.stableTokens(usdc.address);
    // console.log("isStable:", isStable);
    // let isEquity = await vault.equityTokens(tsla.address);
    // console.log("isEquity:", isEquity);
    // let isEquity2 = await vault.equityTokens(msft.address);
    // console.log("isEquity2:", isEquity2);

    // ===================== PriceFeed ================================
    // let pyth = await vaultPriceFeed.pyth();
    // console.log("pyth:", pyth);
    // let validTime = await vaultPriceFeed.validTime();
    // console.log("validTime:", validTime.toNumber());
    // let feedIdEth = await vaultPriceFeed.feedIds(weth.address);
    // console.log("feedIdEth:", feedIdEth);
    // let feedIdUsdc = await vaultPriceFeed.feedIds(usdc.address);
    // console.log("feedIdUsdc:", feedIdUsdc);

    // ===================== Get Token Config ================================
    // let len = await vault.allWhitelistedTokensLength();
    // console.log("len:", len);
    // for (let i = 0; i < len; i++) {
    //     let token = await vault.allWhitelistedTokens(i);
    //     console.log("token:", token);
    // }

    // ===================== Vault ================================
    // let opened = await positionManager.opened();
    // console.log("opened:", opened);

    // ===================== OrderBook ================================
    // console.log("orderbookReader:", orderBookReader.address);
    // let res = await orderBookReader.getIncreaseOrders(
    //     orderBook.address,
    //     "0xafc183BE937367B219F9283916d352f2C03ff512",
    //     []
    // );
    // console.log("res:", res);
    // console.log("OrderBook:", orderBook.address);
    // let isPlugin = await router.plugins(orderBook.address);
    // console.log("isPlugin:", isPlugin);
    // let pob = await positionManager.orderBook();
    // console.log("pob:", pob);

    // ===================== View Other ================================
    // let abi = ["function priceFeed() view returns(address)"];
    // let v = await ethers.getContractAt(abi, "0x09Aa1138dfdfF855Df18DDAf08e92186D213700e");
    // let addr = await v.priceFeed();
    // console.log("feed:", addr); // 0x6880cDc4eEFD95aB8C1cc9e6dC612De0A56daB67
    // let abiPRouter = ["function minExecutionFee() view returns(address)"]
    // let pRouter = await ethers.getContractAt(abiPRouter, "0x81883ba423C0135a9e867476559976AF0f90E84b");
    // let minExecutionFee = await pRouter.minExecutionFee();
    // console.log(`minFee: ${formatEther(minExecutionFee)} ${getTimeStr()}`);

    // 0.0021 6-2-14:31
    // executor: 0x104b5cda666a504da51220035f930a77b22b8124

}

function getTimeStr() {
    let date = new Date();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let min = date.getMinutes();
    return `${month}-${day}-${hour}:${min}`;
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
