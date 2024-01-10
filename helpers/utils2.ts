import {ethers, getChainId, getNamedAccounts} from "hardhat";
import {BigNumber} from "ethers";
import {formatEther, formatUnits} from "ethers/lib/utils";
import {
    FEED_ID_ARB_TEST,
    FEED_ID_BTC_TEST,
    FEED_ID_DOGE_TEST,
    FEED_ID_ETH_TEST,
    FEED_ID_FIL_TEST,
    FEED_ID_LTC_TEST,
    FEED_ID_MSFT_TEST,
    FEED_ID_TSLA_TEST,
    FEED_ID_USDC_TEST
} from "./constants";
import {Token} from "../typechain";
import {getUpdateDataTestnet} from "./utils";

export function splitterTitle(title: string) {
    console.log("------------------------------" + title + "------------------------------");
}
export function splitter() {
    console.log("------------------------------ SPLITTER ------------------------------");
}
export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function OP_GET_UPDATEData() {
    let chainId = await getChainId();
    return await getUpdateDataTestnet([
        FEED_ID_USDC_TEST,
        FEED_ID_BTC_TEST,
        FEED_ID_ETH_TEST,
        /* added @0504*/
        FEED_ID_DOGE_TEST,
        FEED_ID_LTC_TEST,
        FEED_ID_ARB_TEST,
        FEED_ID_FIL_TEST,
        /* added @0505*/
        FEED_ID_MSFT_TEST,
        FEED_ID_TSLA_TEST,
    ], chainId);
}
export async function printVault_Pool_Reserved(_v: any, _weth: any, _dai: any, _wbtc: any) {
    console.log(`v.poolAmounts: ${formatEther(await _v.poolAmounts(_weth.address))}`);
    console.log(`v.poolAmounts: ${formatEther(await _v.poolAmounts(_dai.address))}`);
    console.log(`v.poolAmounts: ${formatUnits(await _v.poolAmounts(_wbtc.address), 8)}`);

    console.log(`v.reservedAmounts: ${formatEther(await _v.reservedAmounts(_weth.address))}`);
    console.log(`v.reservedAmounts: ${formatEther(await _v.reservedAmounts(_dai.address))}`);
    console.log(`v.reservedAmounts: ${formatUnits(await _v.reservedAmounts(_wbtc.address), 8)}`);
    splitterTitle("PRINTVAULT_POOL_RESERVED");
}
export async function OP_ALL_GET() {
    let weth = await ethers.getContract<Token>("WNative");
    let wbtc = await ethers.getContract<Token>("WBTC");
    let usdc = await ethers.getContract<Token>("USDC");
    let zkdlp = await ethers.getContract<Token>("ZKDLP");

    let doge = await ethers.getContract<Token>("DOGE");
    let ltc = await ethers.getContract<Token>("LTC");
    let arb = await ethers.getContract<Token>("ARB");
    let fil = await ethers.getContract<Token>("FIL");

    /* added @0505*/
    let msft = await ethers.getContract<Token>("MSFT");
    let tsla = await ethers.getContract<Token>("TSLA");

    let {owner, user0, user1} = await getNamedAccounts();

    async function printTokens(user: any) {
        console.log(`weth.balanceOf(${user}): ${formatUnits(await weth.balanceOf(user), 18)}`);
        console.log(`wbtc.balanceOf(${user}): ${formatUnits(await wbtc.balanceOf(user), 8)}`);
        console.log(`usdc.balanceOf(${user}): ${formatUnits(await usdc.balanceOf(user), 18)}`);

        console.log(`doge.balanceOf(${user}): ${formatUnits(await doge.balanceOf(user), 18)}`);
        console.log(`ltc.balanceOf(${user}): ${formatUnits(await ltc.balanceOf(user), 18)}`);
        console.log(`arb.balanceOf(${user}): ${formatUnits(await arb.balanceOf(user), 18)}`);
        console.log(`fil.balanceOf(${user}): ${formatUnits(await fil.balanceOf(user), 18)}`);
        /* added @0505*/
        console.log(`msft.balanceOf(${user}): ${formatUnits(await msft.balanceOf(user), 18)}`);
        console.log(`tsla.balanceOf(${user}): ${formatUnits(await tsla.balanceOf(user), 18)}`);

        console.log(`dlp.balanceOf(${user}): ${formatUnits(await zkdlp.balanceOf(user), 18)}`);
        splitter();
    }

    await printTokens(owner);
    await printTokens(user0);
    await printTokens(user1);
}
export async function OP_GET_VAULT() {
    let weth = await ethers.getContract<Token>("WNative");
    let wbtc = await ethers.getContract<Token>("WBTC");
    let usdc = await ethers.getContract<Token>("USDC");
    let vault = await ethers.getContract("Vault");


    let doge = await ethers.getContract<Token>("DOGE");
    let ltc = await ethers.getContract<Token>("LTC");
    let arb = await ethers.getContract<Token>("ARB");
    let fil = await ethers.getContract<Token>("FIL");
    let {owner, user0, user1} = await getNamedAccounts();

    /* added @0505*/
    let msft = await ethers.getContract<Token>("MSFT");
    let tsla = await ethers.getContract<Token>("TSLA");

    async function printVaultPoolAmounts() {
        console.log(`vault.poolAmounts(weth): ${formatUnits(await vault.poolAmounts(weth.address), 18)}`);
        console.log(`vault.poolAmounts(wbtc): ${formatUnits(await vault.poolAmounts(wbtc.address), 8)}`);
        console.log(`vault.poolAmounts(usdc): ${formatUnits(await vault.poolAmounts(usdc.address), 18)}`);
        console.log(`vault.poolAmounts(doge): ${formatUnits(await vault.poolAmounts(doge.address), 18)}`);
        console.log(`vault.poolAmounts(ltc): ${formatUnits(await vault.poolAmounts(ltc.address), 18)}`);
        console.log(`vault.poolAmounts(arb): ${formatUnits(await vault.poolAmounts(arb.address), 18)}`);
        console.log(`vault.poolAmounts(fil): ${formatUnits(await vault.poolAmounts(fil.address), 18)}`);
        /* added @0505*/
        console.log(`vault.poolAmounts(msft): ${formatUnits(await vault.poolAmounts(msft.address), 18)}`);
        console.log(`vault.poolAmounts(tsla): ${formatUnits(await vault.poolAmounts(tsla.address), 18)}`);

        console.log(`weth.balanceOf(vault): ${formatUnits(await weth.balanceOf(vault.address), 18)}`);
        console.log(`wbtc.balanceOf(vault): ${formatUnits(await wbtc.balanceOf(vault.address), 8)}`);
        console.log(`usdc.balanceOf(vault): ${formatUnits(await usdc.balanceOf(vault.address), 18)}`);
        console.log(`doge.balanceOf(vault): ${formatUnits(await doge.balanceOf(vault.address), 18)}`);
        console.log(`ltc.balanceOf(vault): ${formatUnits(await ltc.balanceOf(vault.address), 18)}`);
        console.log(`arb.balanceOf(vault): ${formatUnits(await arb.balanceOf(vault.address), 18)}`);
        console.log(`fil.balanceOf(vault): ${formatUnits(await fil.balanceOf(vault.address), 18)}`);

        /* added @0505*/
        console.log(`msft.balanceOf(vault): ${formatUnits(await msft.balanceOf(vault.address), 18)}`);
        console.log(`tsla.balanceOf(vault): ${formatUnits(await tsla.balanceOf(vault.address), 18)}`);
        splitter();
    }

    splitterTitle("OP_GET_VAULT");
    splitterTitle("OP_GET_VAULT");
    await printVaultPoolAmounts();
}
export async function OP_CHAINID() {
    const chainId = await getChainId();
    console.log(`chainId: ${chainId}`);
}
export async function OP_TOKEN_INTERVAL() {
    let weth = await ethers.getContract<Token>("WNative");
    let wbtc = await ethers.getContract<Token>("WBTC");
    let usdc = await ethers.getContract<Token>("USDC");
    let zkdlp = await ethers.getContract<Token>("ZKDLP");

    let doge = await ethers.getContract<Token>("DOGE");
    let ltc = await ethers.getContract<Token>("LTC");
    let arb = await ethers.getContract<Token>("ARB");
    let fil = await ethers.getContract<Token>("FIL");

    /* added @0505*/
    let msft = await ethers.getContract<Token>("MSFT");
    let tsla = await ethers.getContract<Token>("TSLA");

    let {owner, user0, user1} = await getNamedAccounts();

    console.log(`wbtc.interval: ${await wbtc.interval()}`);
    console.log(`weth.interval: ${await weth.interval()}`);
    console.log(`dai.interval: ${await usdc.interval()}`);
    console.log(`doge.interval: ${await doge.interval()}`);
    console.log(`ltc.interval: ${await ltc.interval()}`);
    console.log(`arb.interval: ${await arb.interval()}`);
    console.log(`fil.interval: ${await fil.interval()}`);
    console.log(`msft.interval: ${await msft.interval()}`);
    console.log(`tsla.interval: ${await tsla.interval()}`);
}

export function getEthNumber(amount: BigNumber) {
    return parseInt(ethers.utils.formatEther(amount));
}

export async function deployContract(name, args) {
    const contractFactory = await ethers.getContractFactory(name)
    return await contractFactory.deploy(...args)
}
