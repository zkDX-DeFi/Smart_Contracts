import {formatEther, parseUnits} from "ethers/lib/utils";
import {ethers, getChainId} from "hardhat";
import {getUpdateDataAllByChainId} from "../helpers/utils";
import {
    PositionManager,
    Reader,
    Router,
    Token,
    Vault,
    VaultErrorController,
    VaultPriceFeed,
    VaultUtils
} from "../typechain";

async function main() {

    let stakingEth = await ethers.getContract("ZkdxStakingETH");
    let stakingUsdc = await ethers.getContract("ZkdxStakingUSDC");
    let newOwner = "0x9d186fDF05eCc3589dDd9a9D05063c762E0F3769";
    await stakingEth.transferOwnership(newOwner);
    await stakingUsdc.transferOwnership(newOwner);


    // ===================== Add Liquidity ===========================
    // console.log("usdc in...")

    // let usdcAmountIn = parseEther("400000000");
    // let tx = await usdc.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // await tx.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(usdc.address, usdcAmountIn, 0, 0, updateData, {value: fee, gasPrice: gasPrice});

    // console.log("weth in...")
    // let wethAmountIn = parseEther("157000");
    // let tx = await weth.connect(owner).approve(zkdlpManager.address, ApproveAmount, {gasPrice: gasPrice});
    // await tx.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(weth.address, wethAmountIn, 0, 0, updateData, {value: fee, gasPrice: gasPrice,});
    //
    // console.log("wbtc in...")
    // let wbtcAmountIn = parseUnits("10000", 8);
    // let tx = await wbtc.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // await tx.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(wbtc.address, wbtcAmountIn, 0, 0, updateData, {value: fee});

    // console.log("ltc in...")
    // let ltcAmountIn = parseEther("3627569");
    // let tx = await ltc.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // await tx.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(ltc.address, ltcAmountIn, 0, 0, updateData, {value: fee, gasPrice: gasPrice});

    // console.log("doge in...")
    // let dogeAmountIn = parseEther("3750000000");
    // let tx = await doge.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // await tx.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(doge.address, dogeAmountIn, 0, 0, updateData, {value: fee, gasPrice: gasPrice});

    // console.log("arb in...")
    // let arbAmountIn = parseEther("260869565");
    // let tx = await arb.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // await tx.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(arb.address, arbAmountIn, 0, 0, updateData, {value: fee});

    // console.log("fil in...")
    // let filAmountIn = parseEther("72115384");
    // let txFil = await fil.connect(owner).approve(zkdlpManager.address, ApproveAmount, {gasPrice: gasPrice});
    // await txFil.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(fil.address, filAmountIn, 0, 0, updateData, {value: fee, gasPrice: gasPrice});

    // console.log("msft in...")
    // let msftAmountIn = parseEther("600000");
    // let txMsft = await msft.connect(owner).approve(zkdlpManager.address, ApproveAmount, {gasPrice: gasPrice});
    // await txMsft.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(msft.address, msftAmountIn, 0, 0, updateData, {value: fee, gasPrice: gasPrice});
    //
    // console.log("tsla in...")
    // let tslaAmountIn = parseEther("600000");
    // let txTsla = await tsla.connect(owner).approve(zkdlpManager.address, ApproveAmount, {gasPrice: gasPrice});
    // await txTsla.wait();
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(tsla.address, tslaAmountIn, 0, 0, updateData, {value: fee, gasPrice: gasPrice});
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

async function getLineaMains() {

    const res: any = {
        owner: await ethers.getNamedSigner("owner"),
        vault: await ethers.getContract<Vault>("Vault"),
        router: await ethers.getContract<Router>("Router"),
        zkdlpManager: await ethers.getContract("ZkdlpManager"),
        rewardRouter: await ethers.getContract("RewardRouter"),
        vaultPriceFeed: await ethers.getContract<VaultPriceFeed>("VaultPriceFeed"),
        positionManager: await ethers.getContract<PositionManager>("PositionManager"),
        reader: await ethers.getContract<Reader>("Reader"),
        vaultUtils: await ethers.getContract<VaultUtils>("VaultUtils"),
        vaultErrorController: await ethers.getContract<VaultErrorController>("VaultErrorController"),
        usdc: await ethers.getContract<Token>("USDC"),
        weth: await ethers.getContract<Token>("WNative"),
        wbtc: await ethers.getContract<Token>("WBTC"),
        doge: await ethers.getContract<Token>("DOGE"),
        ltc: await ethers.getContract<Token>("LTC"),
        arb: await ethers.getContract<Token>("ARB"),
        fil: await ethers.getContract<Token>("FIL"),
        msft: await ethers.getContract<Token>("MSFT"),
        tsla: await ethers.getContract<Token>("TSLA")
    };

    return res;
}