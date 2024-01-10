import {deployments, ethers, getChainId, getNamedAccounts} from 'hardhat';
import {
    ApproveAmount,
    getContracts,
    getUpdateDataMainnet, getUpdateDataMainnetAll,
    getUpdateDataTestnet,
    getUpdateDataTestnetAll,
    toUsd
} from "../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {EvmPriceServiceConnection} from "@pythnetwork/pyth-evm-js";
import {
    FEED_ID_BTC_TEST,
    FEED_ID_DOGE_TEST,
    FEED_ID_ETH_MAIN,
    FEED_ID_ETH_TEST,
    FEED_ID_USDC_TEST
} from "../helpers/constants";
import {getUpdateData} from "../helpers/utilsForTest";

async function main() {

    let chainId = await getChainId();
    const {owner} = await ethers.getNamedSigners();
    let zusd = await ethers.getContract("ZUSD");
    let weth = await ethers.getContract("WNative");
    let positionManager = await ethers.getContract("PositionManager");
    let router = await ethers.getContract("Router");
    let vault = await ethers.getContract("Vault");
    let user = owner.address;
    let wbtc = await ethers.getContract("WBTC");
    let reader = await ethers.getContract("Reader");

    // ===================== Positions ================================
    let _collateralTokens = [wbtc.address, weth.address, zusd.address, zusd.address];
    let _indexTokens = [wbtc.address, weth.address, wbtc.address, weth.address,];
    let _isLong = [true, true, false, false];
    let positions = await reader.getPositions(vault.address, owner.address, _collateralTokens, _indexTokens, _isLong);
    for (let i = 0; i < positions.length;) {
        console.log(" ===================================================== ");
        console.log("$size:", formatUnits(positions[i++], 30));
        console.log("$collateral:", formatUnits(positions[i++], 30));
        console.log("$averagePrice:", formatUnits(positions[i++], 30));
        console.log("entryFundingRate:", positions[i++].toNumber());
        console.log("hasRealisedProfit:", positions[i++].toNumber());
        console.log("$realisedPnl", formatUnits(positions[i++], 30));
        console.log("lastIncreasedTime", positions[i++].toNumber());
        console.log("hasProfit", positions[i++].toNumber());
        console.log("delta", formatUnits(positions[i++], 30));
    }

    // await positionManager.setOpened(true);

    // ===================== Increase Position Long ETH ================================
    // let {updateData, fee} = await getUpdateDataTestnet([FEED_ID_ETH_TEST], chainId);
    // let params = [
    //     [zusd.address, weth.address], // _path
    //     weth.address, // _indexTokends
    //     parseEther("50"),
    //     0, // _minOut
    //     toUsd(100), // _sizeDelta
    //     true, // _isLong
    //     toUsd(2285), // _acceptablePrice
    //     updateData
    // ]
    // let tx = await positionManager.increasePosition(...params, {value: fee.add(parseEther("0.001")), gasPrice: parseUnits("2", "gwei")});
    // console.log("increase position long eth", tx.hash);

    // let {updateData, fee} = await getUpdateDataTestnet([FEED_ID_ETH_TEST, FEED_ID_USDC_TEST], chainId);
    // let params = [
    //     [usdc.address, weth.address], // _path
    //     weth.address, // _indexTokends
    //     parseEther("1000"),
    //     0, // _minOut
    //     toUsd(20117.81), // _sizeDelta
    //     true, // _isLong
    //     toUsd(1653.34), // _acceptablePrice
    //     updateData
    // ]
    // let tx = await positionManager.increasePosition(...params, {value: fee});
    // console.log("increase position long eth", tx.hash);

    // check position
    // let key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
    // let position = await vault.positions(key);
    // console.log("size:", formatUnits(position.size, 30));
    // console.log("collateral:", formatUnits(position.collateral, 30));
    // console.log("averagePrice:", formatUnits(position.averagePrice, 30));
    // console.log("entryFuningRate:", position.entryFuningRate);
    // console.log("reserveAmount:", formatEther(position.reserveAmount));

    // ===================== Increase Position Long BTC ================================
    // await wbtc.faucet();
    // await wbtc.approve(router.address, ApproveAmount);
    // console.log("wbtc balance:", formatUnits(await wbtc.balanceOf(owner.address), 8));

    // let feedIds = [FEED_ID_BTC_TEST];
    // let updateData = await connection.getPriceFeedsUpdateData(feedIds);
    // let fee = feedIds.length;
    // let params = [
    //     [wbtc.address], // _path
    //     wbtc.address, // _indexTokends
    //     parseUnits("1", 8),
    //     0, // _minOut
    //     toUsd(2550000), // _sizeDelta
    //     true, // _isLong
    //     toUsd(27500), // _acceptablePrice
    //     updateData
    // ]
    // let tx = await positionManager.increasePosition(...params, {value: fee});
    // console.log("increase position long btc", tx.hash);

    // check position
    // let key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
    // let position = await vault.positions(key);
    // console.log("size:", formatUnits(position.size, 30));
    // console.log("collateral:", formatUnits(position.collateral, 30));
    // console.log("averagePrice:", formatUnits(position.averagePrice, 30));
    // console.log("entryFuningRate:", position.entryFuningRate);
    // console.log("reserveAmount:", formatEther(position.reserveAmount));

    // ===================== Increase Position Short BTC ================================
    // let feedIds = [FEED_ID_BTC_TEST, FEED_ID_USDC_TEST];
    // let updateData = await connection.getPriceFeedsUpdateData(feedIds);
    // let fee = feedIds.length;
    // let params = [
    //     [usdc.address], // _path
    //     wbtc.address, // _indexTokends
    //     parseEther("100"),
    //     0, // _minOut
    //     toUsd(8700), // _sizeDelta
    //     false, // _isLong
    //     toUsd(27300), // _acceptablePrice
    //     updateData
    // ]
    // let tx = await positionManager.increasePosition(...params, {value: fee});
    // console.log("increase position short btc", tx.hash);

    // ===================== Close ================================
    // let {updateData, fee} = await getUpdateDataTestnet([FEED_ID_ETH_TEST, FEED_ID_USDC_TEST]);
    // let paramsDe = [
    //     [weth.address, usdc.address], // _path
    //     weth.address, // _indexToken
    //     toUsd(0), // _collateralDelta
    //     toUsd(1000), // _sizeDelta
    //     true, // _isLong
    //     owner.address,  // _receiver
    //     toUsd(1821),  // _price
    //     toUsd(0), // _minOut
    //     false, // _withdrawETH
    //     updateData
    // ]
    // let tx2 = await positionManager.decreasePosition(...paramsDe, {value: fee});
    // console.log("close position tx", tx2.hash);

    // ===================== Mint Zkdlp ================================
    // let {updateData, fee} = await getUpdateDataTestnetAll();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(usdc.address, parseEther("1000"), 0, 0, updateData, {value: fee});

    // ===================== Increase Position Long Doge ================================
    // await doge.faucet();
    // await doge.approve(router.address, ApproveAmount);
    // console.log("doge balance:", formatEther(await doge.balanceOf(owner.address)));

    // let {updateData, fee} = await getUpdateDataTestnet([FEED_ID_DOGE_TEST]);
    // let params = [
    //     [doge.address], // _path
    //     doge.address, // _indexTokends
    //     parseEther("1000"),
    //     0, // _minOut
    //     toUsd(800), // _sizeDelta
    //     true, // _isLong
    //     toUsd(0.08), // _acceptablePrice
    //     updateData
    // ]
    // let tx = await positionManager.increasePosition(...params, {value: fee});
    // console.log("increase position long doge", tx.hash);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
