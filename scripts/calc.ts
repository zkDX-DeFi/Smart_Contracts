import {deployments} from 'hardhat';
import {parseUnits} from "ethers/lib/utils";
import {getLiqPrice} from "../helpers/utilsForTest";

const {execute, read} = deployments;

async function main() {

    // size - liqPrice / entryPrice * size = col
    // liqPrice = entryPrice * (size - col) / size

    let entryPrice = 1500;
    let col = 1500;
    let size = 15000;
    col = col - size / 1000;

    // size - liqPriceLong / entryPrice * size = col - size / 50
    // liqPriceLong = 1.02 * entryPrice - col * entryPrice / size;
    let liqPriceLong = 1.02 * entryPrice - col * entryPrice / size;
    console.log("liqPriceLong:", liqPriceLong);

    // liqPriceShort / entryPrice * size - size = col - size / 50
    // liqPriceShort = (col / size + 0.98) * entryPrice
    // col = 1480.5;
    // let liqPriceShort = (col / size + 0.98) * entryPrice;
    // console.log("liqPriceShort:", liqPriceShort);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
