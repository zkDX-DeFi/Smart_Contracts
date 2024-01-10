import {
    ApproveAmount,
    getContracts,
    getUpdateDataMainnet,
    getUpdateDataAllByChainId,
    toUsd
} from "../helpers/utils";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {ethers, getChainId} from "hardhat";
import {Token} from "../typechain";

async function main() {

    // const {
    //     timelock,
    //     positionManager,
    //     weth,
    //     wbtc,
    //     doge,
    //     ltc,
    //     arb,
    //     fil,
    //     vault,
    //     owner,
    //     rewardRouter,
    //     zkdlpManager,
    //     usdc,
    //     vaultPriceFeed,
    //     msft,
    //     tsla,
    // } = await getContracts();

    // console.log(">> setup running...")
    // let chainId = await getChainId();
    //
    // // ===================== Setups ================================
    // await vaultPriceFeed.setValidTime(43200);
    // await timelock.setMinProfitTime(vault.address, 60 * 60); // 1h

    // let shortSize = parseUnits("50000000", 30);
    //
    // console.log(`weth: ${weth.address}`);
    // console.log(`wbtc: ${wbtc.address}`);
    // console.log(`doge: ${doge.address}`);
    // console.log(`ltc: ${ltc.address}`);
    // console.log(`arb: ${arb.address}`);
    // console.log(`fil: ${fil.address}`);
    // console.log(`msft: ${msft.address}`);
    // console.log(`tsla: ${tsla.address}`);

    // await positionManager.setMaxGlobalSizes(
    //     [weth.address, wbtc.address, doge.address, ltc.address, arb.address, fil.address, msft.address, tsla.address],
    //     [0, 0, 0, 0, 0, 0, 0, 0],
    //     [shortSize, shortSize, shortSize, shortSize, shortSize, shortSize, shortSize, shortSize]
    // );
    //
    // console.log(">> set robots...");
    // let robots = [];
    // if (CHAIN_ID_ZKSYNC_TESTNET == chainId) {
    //     robots = [
    //         "0x3aaa18176100dd870903d465134d0522457aa70d",
    //         // "0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2",
    //         // "0x104b5cda666a504da51220035f930a77b22b8124",
    //     ]
    // } else if (CHAIN_ID_ZKSYNC_MAINNET == chainId) {
    //     robots = [
    //         "0xe118d2e27cdbb2cf1e67000a22b9d6b57e06eb3a"
    //     ]
    // }
    // for (let i = 0; i < robots.length; i++) {
    //     await positionManager.setLiquidator(robots[i], true);
    //     await positionManager.setOrderKeeper(robots[i], true);
    // }

    // ===================== Funding ===============================console.log("weth in...")
    // console.log(`chainId: ${chainId}`);
    // let tx;
    // let wethAmountIn = parseEther("30000");
    // await weth.mint(owner.address, wethAmountIn);

    // console.log("wbtc in...");
    // let wbtcAmountIn = parseUnits("3000", 8);
    // await wbtc.mint(owner.address, wbtcAmountIn);

    // console.log("usdc in...")
    // let usdcAmountIn = parseEther("400000000");
    // await usdc.mint(owner.address, usdcAmountIn);

    // console.log("doge in...")
    // let dogeAmountIn = parseEther("600000000");
    // await doge.mint(owner.address, dogeAmountIn);
    //
    // console.log("arb in...")
    // let arbAmountIn = parseEther("60000000");
    // await arb.mint(owner.address, arbAmountIn);
    //
    // console.log("fil in...")
    // let filAmountIn = parseEther("50000000");
    // await fil.mint(owner.address, filAmountIn);
    //
    // console.log("ltc in...")
    // let ltcAmountIn = parseEther("600000");
    // await ltc.mint(owner.address, ltcAmountIn);

    // console.log("msft in...")
    // let msftAmountIn = parseEther("600000");
    // await msft.mint(owner.address, msftAmountIn);
    //
    // console.log("tsla in...")
    // let tslaAmountIn = parseEther("600000");
    // await tsla.mint(owner.address, tslaAmountIn);
    //
    // console.log("Done.");

    // ===================== Set Opened ================================
    // console.log(">> set whitelist...");
    // await positionManager.setOpened(false);
    // await positionManager.setPartner("0x603666f69a88c21F9D56AB09876e835F5eE59dA5", true); // c1
    // await positionManager.setPartner("0xE9883A17Ef193241dec09DC213A0D2aaE0462da2", true); // c2
    // await positionManager.setPartner("0xFF546babBEA385fFb8108b3F0D4b137Cf1C29D72", true); // j
    // await positionManager.setPartner("0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D", true); // l
    // await positionManager.setPartner(owner.address, true);

    //===================== Mint tokens ================================
    // console.log(">> mint tokens...");
    // let users = ["0x603666f69a88c21F9D56AB09876e835F5eE59dA5"]
    //
    // for (let i = 0; i < users.length; i++) {
    //     await wbtc.mint(users[i], parseUnits("1000", 8));
    //     await weth.mint(users[i], parseEther("10000"));
    //     await usdc.mint(users[i], parseEther("20000000"));
    // }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
