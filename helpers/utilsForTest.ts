import {
    BASIS_POINTS_DIVISOR,
    FEED_ID_BTC_TEST,
    FEED_ID_DAI_TEST,
    FEED_ID_ETH_TEST,
    FEED_ID_TSLA_TEST, FEED_ID_USDC_TEST,
    FUNDING_RATE_PRECISION,
    LIQUIDATION_FEE,
    MARGIN_FEE_BASIS_POINTS,
    MAX_LEVERAGE
} from "./constants";
import {Vault} from "../typechain";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {PythContract, VaultPriceFeed} from "../typechain";
import {ApproveAmount, bigNumberify, toUsd} from "./utils";
import {BigNumber} from "ethers";

// For Test Only
export function getNetworkCurrentTimestamp() {
    // get current block timestamp
    return ethers.provider.getBlock("latest").then((block) => {
        return block.timestamp;
    });
}
export async function getUpdateData(tokens: string[], prices?: string[], confidences?: string[]) {
    let pythContract = await ethers.getContract<PythContract>("PythContract");
    let updateData = [];
    let publishTime = await getNetworkCurrentTimestamp();
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].toLowerCase() === "weth") {
            let price = parseUnits(prices && prices[i] ? prices[i] : "1500", 8);
            let confidence = parseUnits(confidences && confidences[i] ? confidences[i] : "0", 8);
            updateData.push(await pythContract.createPriceFeedUpdateData(
                FEED_ID_ETH_TEST,
                price,
                confidence,
                -8,
                price,
                confidence,
                publishTime,
            ));
        } else if (tokens[i].toLowerCase() === "wbtc") {
            let price = parseUnits(prices && prices[i] ? prices[i] : "28000", 8);
            let confidence = parseUnits(confidences && confidences[i] ? confidences[i] : "0", 8);
            updateData.push(await pythContract.createPriceFeedUpdateData(
                FEED_ID_BTC_TEST,
                price,
                confidence,
                -8,
                price,
                confidence,
                publishTime,
            ));
        } else if (tokens[i].toLowerCase() === "dai") {
            let price = parseUnits(prices && prices[i] ? prices[i] : "1", 8);
            let confidence = parseUnits(confidences && confidences[i] ? confidences[i] : "0", 8);
            updateData.push(await pythContract.createPriceFeedUpdateData(
                FEED_ID_DAI_TEST,
                price,
                confidence,
                -8,
                price,
                confidence,
                publishTime,
            ));
        } else if (tokens[i].toLowerCase() === "tsla") {
            let price = parseUnits(prices && prices[i] ? prices[i] : "160", 8);
            let confidence = parseUnits(confidences && confidences[i] ? confidences[i] : "0", 8);
            updateData.push(await pythContract.createPriceFeedUpdateData(
                FEED_ID_TSLA_TEST,
                price,
                confidence,
                -8,
                price,
                confidence,
                publishTime,
            ));
        } else if (tokens[i].toLowerCase() === "usdc") {
            let price = parseUnits(prices && prices[i] ? prices[i] : "1", 8);
            let confidence = parseUnits(confidences && confidences[i] ? confidences[i] : "0", 8);
            updateData.push(await pythContract.createPriceFeedUpdateData(
                FEED_ID_USDC_TEST,
                price,
                confidence,
                -8,
                price,
                confidence,
                publishTime,
            ));
        }
    }
    let fee = await pythContract.getUpdateFee(updateData);
    return {updateData, fee};
}
export async function updateMarkPrice(tokens: string[], prices?: string[], confidences?: string[]) {
    let vaultPriceFeed = await ethers.getContract<VaultPriceFeed>("VaultPriceFeed");
    let {updateData, fee} = await getUpdateData(tokens, prices, confidences);
    await vaultPriceFeed.updatePriceFeeds(updateData, {value: fee});
}

// PositionFee For Test Only
export function getPositionFee(size: BigNumber) {
    if (!size)
        return bigNumberify(0);
    const afterFeeUsd = size.mul(BASIS_POINTS_DIVISOR - MARGIN_FEE_BASIS_POINTS).div(BASIS_POINTS_DIVISOR);
    return size.sub(afterFeeUsd);
}
export function getFundingFee(size: BigNumber, entryFundingRate: BigNumber, cumulativeFundingRate: BigNumber) {
    if (!entryFundingRate || !cumulativeFundingRate)
        return bigNumberify(0);
    return size.mul(cumulativeFundingRate.sub(entryFundingRate)).div(FUNDING_RATE_PRECISION);
}
export async function getLiqPriceForPosition(account: string, collateralToken: string, indexToken: string, isLong: boolean) {
    let vault = await ethers.getContract<Vault>("Vault");
    let key = await vault.getPositionKey(account, collateralToken, indexToken, isLong);
    let position = await vault.positions(key);
    let cumulativeFundingRate = await vault.cumulativeFundingRates(collateralToken);
    return getLiqPrice(position, cumulativeFundingRate, true);
}
export function getLiqPrice(position: any, cumulativeFundingRate: BigNumber, isLong: boolean) {
    let positionFee = getPositionFee(position.size);
    let fundingFee = getFundingFee(position.size, position.entryFundingRate, cumulativeFundingRate);
    // @ts-ignore
    let marginFee = positionFee.add(fundingFee).add(LIQUIDATION_FEE);
    let marginExceedMaxLeverage = position.size.mul(BASIS_POINTS_DIVISOR).div(MAX_LEVERAGE);
    let liqPriceForFees = getLiqPriceFromSize(marginFee, position.size, position.collateral, position.averagePrice, isLong);
    let liqPriceForMaxLeverage = getLiqPriceFromSize(marginExceedMaxLeverage, position.size, position.collateral, position.averagePrice, isLong);

    if (!liqPriceForFees)
        return liqPriceForMaxLeverage;
    if (!liqPriceForMaxLeverage)
        return liqPriceForFees;
    if (isLong) // return the higher price
        return liqPriceForFees.gt(liqPriceForMaxLeverage) ? liqPriceForFees : liqPriceForMaxLeverage;
    return liqPriceForFees.lt(liqPriceForMaxLeverage) ? liqPriceForFees : liqPriceForMaxLeverage;
}
export function getLiqPriceFromSize(liqAmount: BigNumber, size: BigNumber, collateral: BigNumber, averagePrice: BigNumber, isLong: boolean) {
    if (!size || size.eq(0)) {
        return;
    }
    if (liqAmount.gt(collateral))
        throw new Error("getLiqPriceFromSize: position need to be liquidated now!");
    const liquidationDelta = collateral.sub(liqAmount);
    const priceDelta = liquidationDelta.mul(averagePrice).div(size);
    return isLong ? averagePrice.sub(priceDelta) : averagePrice.add(priceDelta);
}

export async function global_buyMLPWithETH(etherValue: any, addressIn: any, feed:any, rewardRouter: any) {
    await feed.setValidTime(30);
    let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
    await rewardRouter.connect(addressIn).mintAndStakeZkdlpETH(0, 0, updateData, {value: etherValue.add(fee)});
};
export async function global_longWETH_DAIAmountIn(user: any, _DAIAmountIn: any, _sizeDelta: any, dai:any, weth: any, router:any, pm: any) {
    let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
    let params = [
        [dai.address, weth.address], // _path
        weth.address, // _indexTokens
        _DAIAmountIn,
        0, // _minOut
        toUsd(_sizeDelta), // _sizeDelta
        true, // _isLong
        toUsd(1500.000001), // _acceptablePrice
        updateData
    ];
    await dai.mint(user.address, _DAIAmountIn);
    await dai.connect(user).approve(router.address, ApproveAmount);
    await pm.connect(user).increasePosition(...params, {value: fee});
};

export async function shortOperationA(dlpManager: any, rewardRouter: any, dai: any, weth: any, router: any, pm: any, owner: any) {
    async function buyMLPWithTokenV2(token: any, amountIn: any, addressIn: any) {
        await token.mint(addressIn.address, amountIn);
        await token.connect(addressIn).approve(dlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
    }

    async function shortWETH_DAIAmountInV2(user: any, _daiAmountIn: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let params = [
            [dai.address], // _path
            weth.address, // _indexTokens
            _daiAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            false, // _isLong
            toUsd(1499.000001), // _acceptablePrice
            updateData
        ];
        await dai.mint(user.address, _daiAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await pm.connect(user).increasePosition(...params, {value: fee});
    };


    await buyMLPWithTokenV2(dai, parseEther("20000"), owner);
    await shortWETH_DAIAmountInV2(owner, parseEther("100"), 1400);
}
