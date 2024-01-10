import {AddressZero, ApproveAmount, getContracts, getUpdateDataAllByChainId} from "../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {deployments, ethers, getChainId} from "hardhat";
import {read} from "fs";
import {getWethConfig, getWmaticConfig, getWNativeConfigByChainId} from "../helpers/params";

async function main() {

    const {execute, get, read} = deployments;
    const {
        vaultPriceFeed, trueUSDC, trueWETH, stakingETH, stakingUSDC, owner, esZKDX, weth, zkdlpManager, rewardRouter,
        vault, usdc, timelock, reader
    } = await getContracts();

    let chainId = await getChainId();

    // let faucetAmount = await usdc.faucetAmount();
    // let faucetTotal = await usdc.faucetTotal();
    // let giveawayTotal = await usdc.giveawayTotal();
    // console.log("faucetAmount:", formatEther(faucetAmount)); // 100,000
    // console.log("faucetTotal:", formatEther(faucetTotal)) // 10,000,000,000
    // console.log("giveawayTotal:", formatEther(giveawayTotal)) // 375,900,000

    // console.log("esZKDX totalSupply:", formatEther(await esZKDX.totalSupply()));

    let time1 = await stakingETH.finishAt();
    let time2 = await stakingUSDC.finishAt();
    console.log("time1:", time1.toString());
    console.log("time2:", time2.toString());

    // ===================== Notify ================================
    let rewardAmount = parseEther("5000000");
    await execute("ZkdxStakingETH", {from: owner.address, log: true}, "notifyRewardAmount", rewardAmount);
    await execute("ZkdxStakingUSDC", {from: owner.address, log: true}, "notifyRewardAmount", rewardAmount);

    // let maxZkusd = await vault.maxZkusdAmounts(usdc.address)
    // console.log("maxZkusd: ", formatUnits(maxZkusd, 18));

    // let validTime = await vaultPriceFeed.validTime();
    // console.log("validTime: ", validTime.toString());
    // let marginFeeBasisPoints = await timelock.marginFeeBasisPoints();
    // console.log("marginFeeBasisPoints: ", marginFeeBasisPoints.toString());
    // let maxMarginFeeBasisPoints = await timelock.maxMarginFeeBasisPoints();
    // console.log("maxMarginFeeBasisPoints: ", maxMarginFeeBasisPoints.toString());
    // await timelock.setMarginFeeBasisPoints(5, 10);

    // ===================== Positions ================================
    // let account = "0x074d4ac10331ba80c92af000497d20536b108a9e"
    // let _collateralTokens = [weth.address];
    // let _indexTokens = [weth.address];
    // let _isLong = [true];
    // let positions = await reader.getPositions(vault.address, account, _collateralTokens, _indexTokens, _isLong);
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

    // ===================== Add Liquidity ===========================
    // console.log("weth in...")
    // let wethConfig = await getWethConfig(weth);wethConfig[4] = 0;
    // await timelock.setTokenConfig(vault.address, ...wethConfig);
    // let wethAmountIn = parseEther("500000");
    // await weth.mint(owner.address, wethAmountIn);
    // await weth.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // let {updateData, fee} = await getUpdateDataAllByChainId(chainId);
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(weth.address, wethAmountIn, 0, 0, updateData, {value: fee});

    // console.log("usdc in...")
    // let usdcAmountIn = parseEther("1735811496");
    // await usdc.mint(owner.address, usdcAmountIn);
    // await usdc.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // let {updateData, fee} = await getUpdateDataAllByChainId(chainId);
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(usdc.address, usdcAmountIn, 0, 0, updateData, {value: fee});

    // ===================== zkusd amount ===========================
    // let zkusdAmount = await vault.zkusdAmounts(usdc.address);
    // console.log("zkusdAmount: ", formatUnits(zkusdAmount, 18));
    // let maxZkusdAmount = await vault.maxZkusdAmounts(usdc.address);
    // console.log("maxZkusdAmount: ", maxZkusdAmount);
    // console.log("maxZkusdAmount: ", formatUnits(maxZkusdAmount, 18));

    // ===================== Stake ===========================
    // await trueUSDC.approve(stakingUSDC.address, ApproveAmount);
    // await stakingUSDC.stake(parseUnits("10.928476", 6));
    // await trueWETH.approve(stakingWETH.address, ApproveAmount);
    // await stakingWETH.stake(parseEther("0.01"));

    // ===================== Pause ===========================
    // await stakingWETH.setPaused(false);
    // await stakingUSDC.setPaused(false);

    // 190.7760 USDC
    // ===================== Reader ===========================
    // let earned = await stakingUSDC.earned(owner.address);
    // console.log("earned: ", formatEther(earned));
    // let earned2 = await stakingWETH.earned(owner.address);
    // console.log("earned2: ", formatEther(earned2));

    // ===================== Old Staking ===========================
    // let oldStakingUSDC = await ethers.getContractAt("ZkdxStaking", "0xd6cce119B45Efcb378a4735a96aE08826A37ca1c");
    // let total = await oldStakingUSDC.totalSupply();
    // console.log("total:", formatUnits(total, 6))
    // await oldStakingUSDC.stake(parseUnits("1", 6));

    // let oldStakingWETH = await ethers.getContractAt("ZkdxStaking", "0x79033C597B7d8e752a7511cF24512f4A7217C0B8");
    // await oldStakingWETH.stake(parseEther("0.01"));

    // ===================== esZKDX ===========================
    // let balance = await esZKDX.totalSupply();
    // console.log("balance:", formatEther(balance))

    // let lg2 = "0x112e5Af0B8f74B60bA7a4F2C167Ba2B1d47c87dB"
    // await esZKDX.transferOwnership(lg2);
    // await stakingUSDC.transferOwnership(lg2);
    // await stakingETH.transferOwnership(lg2);
    // await execute("ZKDXNFT", {from: owner.address}, "transferOwnership", lg2);
    // let ownerAddr = await read("ZKDXNFT", "owner");
    // console.log("ownerAddr:", ownerAddr)

    // let rate1 = await stakingUSDC.rewardRate();
    // console.log("rate1:", formatEther(rate1))
    // let rate2 = await stakingETH.rewardRate();
    // console.log("rate2:", formatEther(rate2))

    // ===================== Staking Balance ===========================
    // let balance1 = await stakingETH.balanceOf("0x27157c32c014598c7d743d8731e238ab151f2c65");
    // console.log("balance:", formatEther(balance1))

    // ===================== Mint Tokens ===========================
    // console.log("weth in...")
    // let chainId = await getChainId();
    // let wethAmountIn = parseEther("11000");
    // await weth.mint(owner.address, wethAmountIn);
    // await weth.connect(owner).approve(zkdlpManager.address, ApproveAmount);
    // let {updateData, fee} = await getUpdateDataAllByChainId(chainId);
    // await rewardRouter.connect(owner).mintAndStakeZkdlp(weth.address, wethAmountIn, 0, 0, updateData, {value: fee});

    // let poolAmount = await vault.poolAmounts(weth.address);
    // console.log("poolAmount weth:", formatEther(poolAmount));
    // let reservedAmount = await vault.reservedAmounts(weth.address);
    // console.log("reservedAmount weth:", formatEther(reservedAmount));
    // console.log("available weth:", formatEther(poolAmount.sub(reservedAmount)))

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
