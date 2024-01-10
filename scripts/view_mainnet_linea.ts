import {ethers} from "hardhat";
import {formatEther, formatUnits} from "ethers/lib/utils";
import {FEED_ID_BTC_MAIN, FEED_ID_DOGE_MAIN, FEED_ID_ETH_MAIN} from "../helpers/constants";
import {BigNumber} from "ethers";

async function view() {

    let pm = await ethers.getContract("PositionManager");
    let vault = await ethers.getContract("Vault");
    let doge = await ethers.getContract("DOGE");
    let weth = await ethers.getContract("WNative");
    let wbtc = await ethers.getContract("WBTC");
    let zusd = await ethers.getContract("ZUSD");


    // ======================== deposit fees ============================
    let pmFeeDoge = await pm.feeReserves(doge.address);
    console.log(`pmFeeDoge: ${formatEther(pmFeeDoge)}`);
    let pmFeeWeth = await pm.feeReserves(weth.address);
    console.log(`pmFeeWeth: ${formatEther(pmFeeWeth)}`);

    // ======================== margin & funding fees ============================
    let vFeeDoge = await vault.feeReserves(doge.address);
    console.log(`vFeeDoge: ${formatEther(vFeeDoge)}`);
    let vFeeWeth = await vault.feeReserves(weth.address);
    console.log(`vFeeWeth: ${formatEther(vFeeWeth)}`);
    let vFeeWbtc = await vault.feeReserves(wbtc.address);
    console.log(`vFeeWbtc: ${formatEther(vFeeWbtc)}`);
    let vFeeZusd = await vault.feeReserves(zusd.address);
    console.log(`vFeeZusd: ${formatEther(vFeeZusd)}`);

    let priceMap = await getPrice()
    let priceDoge = priceMap.get(FEED_ID_DOGE_MAIN.substring(2));
    let priceWeth = priceMap.get(FEED_ID_ETH_MAIN.substring(2));
    let priceWbtc = priceMap.get(FEED_ID_BTC_MAIN.substring(2));
    console.log(`priceDoge: ${priceDoge}`);
    console.log(`priceWeth: ${priceWeth}`);
    console.log(`priceWbtc: ${priceWbtc}`);

    let feeDoge = parseFloat(formatEther(pmFeeDoge.add(vFeeDoge)));
    let feeWeth = parseFloat(formatEther(pmFeeWeth.add(vFeeWeth)));
    let feeWbtc = parseFloat(formatUnits(vFeeWbtc, 8));
    let feeZusd = parseFloat(formatEther(vFeeZusd));

    let totalFee = feeDoge * priceDoge + feeWeth * priceWeth + feeWbtc * priceWbtc + feeZusd;
    console.log(`totalFee: ${totalFee}`); // 577
}

async function getPrice() {

    let priceMap = new Map();
    let url = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${FEED_ID_BTC_MAIN}&ids[]=${FEED_ID_ETH_MAIN}&ids[]=${FEED_ID_DOGE_MAIN}`;
    let data = await (await fetch(url)).json();
    for (let i = 0; i < data.length; i++) {
        let price = data[i].price.price;
        let divisor = Math.pow(10, Math.abs(data[i].price.expo));
        price = price / divisor;
        priceMap.set(data[i].id, price);
    }
    return priceMap;
}

view()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });