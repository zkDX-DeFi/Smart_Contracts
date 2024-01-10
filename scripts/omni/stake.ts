import {ethers, getChainId} from "hardhat";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {getStgRouterByChainId, getStgUsdcByChainId} from "../../helpers/chains";
import {getLzChainIdByNetworkName} from "../../helpers/lzUtils";
import {ApproveAmount} from "../../helpers/utils";
import {CHAIN_ID_FUJI, CHAIN_ID_GOERLI} from "../../helpers/constants";

async function main() {

    let chainId = await getChainId();
    console.log(`running on chainId: ${chainId}`)

    let owner = await ethers.getNamedSigner("owner");
    let tokenAddr = getStgUsdcByChainId(chainId);
    let token = await ethers.getContractAt("Token", tokenAddr);

    // let staking = await ethers.getContract("OmniZkdxStaking");
    // let omniZKDX = await ethers.getContract("omniZKDX");
    // let stakeAmount = await parseUnits("1000", 6);

    // ==================== Notify ======================
    // let rewardAmount = parseEther("10000");
    // let duration = 86400 * 3;
    // await staking.setRewardsDuration(duration);
    // await (await omniZKDX.transfer(staking.address, rewardAmount)).wait();
    // await staking.notifyRewardAmount(rewardAmount);

    // ==================== Views ======================
    // let rewardRate = await staking.rewardRate();
    // console.log(`rewardRate: ${rewardRate.toString()}`)
    // let rewardBalance = await omniZKDX.balanceOf(staking.address);
    // console.log(`rewardBalance: ${formatEther(rewardBalance)}`)
    // let finishAt = await staking.finishAt();
    // console.log(`finishAt: ${finishAt.toString()}`)
    // let stakingBalance = await staking.balanceOf(owner.address);
    // console.log(`stakingBalance: ${formatUnits(stakingBalance, decimals)}`)
    // let earned = await staking.earned(owner.address);
    // console.log(`earned: ${formatEther(earned)}`)

    // ==================== Stake ======================
    // let balance = await token.balanceOf(owner.address);
    //
    // console.log(`token balance: ${formatUnits(balance, decimals)}`);
    // if (balance.lt(stakeAmount)) {
    //     console.log(`mint token`)
    //     let tx = await token.mint(owner.address, parseUnits("100000", 6));
    //     await tx.wait();
    // }
    // let allowance = await token.allowance(owner.address, staking.address);
    // if(allowance.lt(stakeAmount)){
    //     console.log(`approve token`)
    //     let tx = await token.approve(staking.address, ApproveAmount);
    //     await tx.wait();
    // }
    //
    // let dstChainId = getLzChainIdByNetworkName("goerli");
    // if (CHAIN_ID_GOERLI == chainId) {
    //     console.log(`stake local`);
    //     await staking.stake(dstChainId, stakeAmount);
    // } else {
    //     console.log(`stake remote`);
    //     let stakeFee = await staking.quoteLayerZeroFee(dstChainId, 1);
    //     console.log(`stakeFee: ${formatEther(stakeFee[0])}`)
    //     await staking.stake(dstChainId, stakeAmount, {value: stakeFee[0]}); // 0x902b6e3147ad7f5e3d04c955c63958251416296312f9aa2237cb0bd03e3f7f45
    // }

    // ==================== Withdraw ======================
    // let dstChainId = getLzChainIdByNetworkName("fuji");
    // let withdrawFee = await staking.quoteLayerZeroFee(dstChainId, 2);
    // console.log(`withdrawFee: ${formatEther(withdrawFee[0])}`)
    // await staking.withdraw(dstChainId, parseUnits("100", decimals), {value: withdrawFee[0]}); // 0x077110f8c81fe9d91a6a25b39d8107bff5a5a03b01301e7843ae9771b160a0a0

    // ==================== Claim ======================
    // let dstChainId = getLzChainIdByNetworkName("fuji");
    // let claimFee = await staking.quoteLayerZeroFee(dstChainId, 3);
    // console.log(`claimFee: ${formatEther(claimFee[0])}`) // 0.00046
    // let tx = await staking.claimReward(dstChainId, {value: claimFee[0]});
    // console.log(`tx: ${tx.hash}`);

    // ==================== Quote Stg Fees ======================
    let routerAddr = await getStgRouterByChainId(chainId);
    let router = await ethers.getContractAt("StgRouter", routerAddr);
    let dstChainId = await getLzChainIdByNetworkName("optimism_goerli");
    let fees = await router.quoteLayerZeroFee(
        dstChainId,
        1,
        owner.address,
        "0x",                       // payload, using abi.encode()
        {
            dstGasForCall: 0,       // extra gas, if calling smart contract,
            dstNativeAmount: 0,     // amount of dust dropped in destination wallet
            dstNativeAddr: '0x' // destination wallet for dust
        });
    console.log(`fees: ${formatEther(fees[0])}`)

    // stg fees:
    // from arb to mumbai: 0.000005681189137396
    // from arb to op: 0.000063
    // from arb to fuji: 0.000168
    // from arb to goerli: 0.00008
    // from mumbai to arb: 126.51
    // from op goerli to arb goerli: 0.0446
    // from op to arb: 0.00036
    // from fuji to bsc testnet: 0.1661
    // from fuji to arb: 0.0362
    // from fuji to goerli: 0.119
    // from goerli to fuji: 0.00016

    // ==================== Make The Swap ======================
    let balance = await token.balanceOf(owner.address);
    let unit = await token.decimals();
    let amount = parseUnits("100", unit);
    let poolId = 1;

    if (balance.lt(amount)) {
        console.log(`mint token`);
        await token.mint(owner.address, parseUnits("100000", unit));
    }
    let allowance = await token.allowance(owner.address, router.address);
    if (allowance.lt(amount)) {
        console.log(`approve token`);
        await token.approve(router.address, ApproveAmount);
    }
    if (fees[0].lt(parseEther("0.2"))) {
        console.log(`swap now`);
        let tx = await router.swap(
            dstChainId,
            poolId,
            poolId,
            owner.address,
            parseUnits("100", unit),
            0,
            {
                dstGasForCall: 0,
                dstNativeAmount: 0,
                dstNativeAddr: "0x"
            },
            owner.address,
            "0x",
            {value: fees[0]}
        );
        console.log(`tx: ${tx.hash}`)
    }
    // from arb to goerli: 0x3707c35a23ff3bd09bf52ef013bae837e59a4aaa7495709f70191bd1394eb5cb -- Blocked
    // from arb to op: 0x48d1f220f9fb50e7b0e79aeb648b455520ae1bd06eec738fed985fbe2e967767 -- Blocked
    // from arb to fuji: 0xe79aec53453d94cbd906fc41584c27f1959399465317c453896d426c1da0ae6a -- Delivered -- X

    // from bsc to fuji: 0xf03f2212da89272b177100c94440b11fc7303f233a59751498127f00bece025a -- Pending
    // from op to goerli: 0x4954d70648b2d6f517e412fce98035a5893f0b4988a7c912065579c99d08e8dc -- Blocked

    // from fuji to arb: 0x310ba00105944850f6d81d1a1b703d23ffee50665532cf03e273da8ca229e5cf -- Blocked
    // from fuji to goerli: 0x6aef83e377354be5b5c08c54123075fc4aa580298ff8a8dc2abf3683b285931c -- Delivered

    // from goerli to fuji: 0x7f9ea7adc49eea578934e31a9565948b888b5bb3b8802768247518eb85f71a7c -- Delivered

    // ==================== Quote Staking Fees ======================
    // let stakeFee = await staking.quoteLayerZeroFee(dstChainId, 1);
    // console.log(`stakeFee: ${formatEther(stakeFee[0])}`)
    // let withdrawFee = await staking.quoteLayerZeroFee(dstChainId, 1);
    // console.log(`withdrawFee: ${formatEther(withdrawFee[0])}`)
    // let claimFee = await staking.quoteLayerZeroFee(dstChainId, 3);
    // console.log(`claimFee: ${formatEther(claimFee[0])}`)

    // ==================== omniZKDX ======================
    // let omniZKDX = await ethers.getContract("omniZKDX");
    // let balance = await omniZKDX.balanceOf(owner.address);
    // console.log(`omniZKDX balance: ${formatEther(balance)}`);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
