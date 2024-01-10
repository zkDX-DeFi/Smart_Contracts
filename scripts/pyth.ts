import {
    FEED_ID_ARB_TEST,
    FEED_ID_BTC_TEST,
    FEED_ID_DOGE_TEST,
    FEED_ID_ETH_TEST,
    FEED_ID_FIL_TEST,
    FEED_ID_LTC_TEST
} from "../helpers/constants";
import {ethers, getChainId} from "hardhat";
import {formatUnits} from "ethers/lib/utils";
import {PYTH_CONTRACT_BY_CHAIN_ID} from "../helpers/chains";
import {getUpdateDataTestnet} from "../helpers/utils";

async function main() {

    let chainId = await getChainId();
    // let pythAddr = getPythContractByChainId(chainId);
    let pythAddr = PYTH_CONTRACT_BY_CHAIN_ID[chainId]
    let pyth = await ethers.getContractAt("MockPyth", pythAddr);
    console.log("pyth:", pyth.address);

    let updateData = await getUpdateDataTestnet([FEED_ID_ETH_TEST], chainId);
    console.log("updateData:", updateData)

    // await getPythPriceFeed(pyth, FEED_ID_BTC_TEST);
    // await getPythPriceFeed(pyth, FEED_ID_ETH_TEST);
    // await getPythPriceFeed(pyth, FEED_ID_LTC_TEST);
    // await getPythPriceFeed(pyth, FEED_ID_ARB_TEST);
    // await getPythPriceFeed(pyth, FEED_ID_DOGE_TEST);
    // await getPythPriceFeed(pyth, FEED_ID_FIL_TEST);

}

async function getPythPriceFeed(pythContract, priceId) {
    let priceFeed = await pythContract.queryPriceFeed(priceId);
    // console.log("priceFeed:", priceFeed);

    console.log("================= Price =====================");
    console.log("price:", formatUnits(priceFeed["price"][0].toNumber(), 8));
    console.log("conf:", formatUnits(priceFeed["price"][1].toNumber(), 8));
    console.log("expo:", priceFeed["price"][2].toString());
    console.log("publishTime:", priceFeed["price"][3].toNumber());
    let ts = priceFeed["price"][3].toNumber();
    let lastUpdateTime = new Date(ts * 1000 + 8 * 3600 * 1000); // ts to time, time zone is UTC 8
    let time = lastUpdateTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '');
    console.log("publishTime:", time);
}

main()

