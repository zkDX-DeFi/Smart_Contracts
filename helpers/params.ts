import {parseEther} from "ethers/lib/utils";
import {
    CHAIN_ID_LOCAL,
    CHAIN_ID_MUMBAI,
    MAX_USDM_AMOUNTS_EQUITY,
    MAX_USDM_AMOUNTS_TOKEN, MAX_USDM_AMOUNTS_WBTC, MAX_USDM_AMOUNTS_WETH, MAX_USDM_AMOUNTS_WMATIC
} from "./constants";

export const minExecutionFee = parseEther("0.0005");
export const minExecutionFeeMainnet = parseEther("0.001");
export const minLiquidationFee = parseEther("0.001");


export function getWNativeConfigByChainId(wnative: any, chainId: string) {
    if (chainId == CHAIN_ID_LOCAL)
        return getWethConfig(wnative);
    else if (chainId == CHAIN_ID_MUMBAI)
        return getWmaticConfig(wnative);
}
export function getWmaticConfig(wmatic: any) {
    return [
        wmatic.address, // _token
        18, // _tokenDecimals
        10000, // _tokenWeight
        100, // _minProfitBps  // 1%
        MAX_USDM_AMOUNTS_WMATIC, // _maxUsdmAmount
        false, // _isStable
        true, // _isShortable
        false
    ]
}
export function getWethConfig(weth: any) {
    return [
        weth.address, // _token
        18, // _tokenDecimals
        10000, // _tokenWeight
        100, // _minProfitBps
        MAX_USDM_AMOUNTS_WETH, // _maxUsdmAmount
        false, // _isStable
        true, // _isShortable
        false
    ]
}
export function getWbtcConfig(wbtc: any) {
    return [
        wbtc.address, // _token
        8, // _tokenDecimals
        10000, // _tokenWeight
        100, // _minProfitBps
        MAX_USDM_AMOUNTS_WBTC, // _maxUsdmAmount
        false, // _isStable
        true, // _isShortable
        false
    ]
}
export function getDaiConfig(dai: any) {
    return [
        dai.address, // _token
        18, // _tokenDecimals
        10000, // _tokenWeight
        80, // _minProfitBps
        0, // _maxUsdmAmount
        true, // _isStable
        false, // _isShortable
        false
    ]
}
export function getUsdcConfig(usdc: any) {
    return [
        usdc.address, // _token
        18, // _tokenDecimals
        10000, // _tokenWeight
        80, // _minProfitBps
        0, // _maxUsdmAmount
        true, // _isStable
        false, // _isShortable
        false
    ]
}
export function getTokenConfig(token: any) {
    return [
        token.address, // _token
        18, // _tokenDecimals
        10000, // _tokenWeight
        80, // _minProfitBps
        MAX_USDM_AMOUNTS_TOKEN, // _maxUsdmAmount
        false, // _isStable
        true, // _isShortable
        false
    ]
}
export function getEquityConfig(token: any) {
    return [
        token.address, // _token
        18, // _tokenDecimals
        10000, // _tokenWeight
        80, // _minProfitBps
        MAX_USDM_AMOUNTS_EQUITY, // _maxUsdmAmount
        false, // _isStable
        true, // _isShortable
        true // isEquity
    ]
}
export function getZusdConfig(zusd: any) {
    return [
        zusd.address, // _token
        18, // _tokenDecimals
        10000, // _tokenWeight
        80, // _minProfitBps
        0, // _maxUsdmAmount
        true, // _isStable
        false, // _isShortable
        false
    ]
}
