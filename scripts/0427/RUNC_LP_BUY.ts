import {deployments, ethers} from 'hardhat';
import {
    AddressZero,
    ApproveAmount,
    forwardTime,
    getContracts,
    getUpdateDataTestnet
} from "../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {
    FEED_ID_ARB_TEST,
    FEED_ID_BTC_TEST,
    FEED_ID_DOGE_TEST,
    FEED_ID_ETH_TEST, FEED_ID_FIL_TEST,
    FEED_ID_LTC_TEST,
    FEED_ID_USDC_TEST
} from "../../helpers/constants";
import {OP_ALL_GET, OP_CHAINID, OP_GET_UPDATEData, sleep, splitter} from "../../helpers/utils2";
import {getLiqPrice} from "../../helpers/utilsForTest";

const {execute, read} = deployments;

async function main() {
    const {
        reader,
        vault,
        weth,
        wbtc,
        positionManager,
        router,
        rewardRouter,
        vaultUtils,
        zkdlp,
        user0,
        user1,
        usdc,
        wnative,
        zkdlpManager,
        vaultErrorController,
        vaultPriceFeed,
        owner,

        /* added @0504*/
        doge: doge,
        ltc: ltc,
        arb: arb,
        fil: fil,

        /* added @0505*/
        msft: msft,
        tsla: tsla,
    } = await getContracts();

    let dai = usdc;

    async function approveAllTokens(user:any) {
        async function approveToken(token: any, approveAddress: any, user: any) {
            await token.connect(user).approve(approveAddress, ApproveAmount);
        }
        await approveToken(weth,    zkdlpManager.address, user);
        await sleep(5_000);
        await approveToken(dai,     zkdlpManager.address, user);
        await sleep(5_000);
        await approveToken(wbtc,    zkdlpManager.address, user);
        await sleep(5_000);
    }
    async function OP_APPROVE() {
        await approveAllTokens(owner);
        await sleep(10_000);
        await approveAllTokens(user0);
        await sleep(10_000);
        await approveAllTokens(user1);
        await sleep(10_000);
    }

    async function printAllowance(token: any, owner: any, spenderAddress: any, spenderName?: string) {
        let allowance = await token.allowance(owner.address, spenderAddress);
        const result: string = allowance > parseEther("50000") ? 'TRUE' : 'FALSE';
        const tokenName = await token.symbol();
        console.log(`${tokenName}.allowance( ${owner.address} ==> ${spenderName} (${spenderAddress}) ) ::== ${result}`);
    }
    async function printAllowanceForUser(user: any) {
        await printAllowance(weth,  user, zkdlpManager.address, "zkdlpManager");
        await printAllowance(dai,   user, zkdlpManager.address, "zkdlpManager");
        await printAllowance(wbtc,  user, zkdlpManager.address, "zkdlpManager");
        console.log(`--------------------------------- SPLIT ---------------------------------`);
    }
    async function OP_APPROVE_PRINT() {
        await printAllowanceForUser(owner);
        await printAllowanceForUser(user0);
        await printAllowanceForUser(user1);
    }

    async function OP_LP_BUY() {
        async function tokenInWithMLP(token:any, user:any) {
            async function buyMLPWithToken(token: any, user: any) {
                let amountIn = await token.balanceOf(user.address);
                if (amountIn.eq(0)) {
                    return;
                }
                await sleep(1_000);

                let {updateData, fee} = await OP_GET_UPDATEData();
                await rewardRouter.connect(user).mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
                console.log(`buyMLPWithToken: ${await token.symbol()}, amount: ${formatEther(amountIn)}, user: ${user.address}`);
            }
            await buyMLPWithToken(token, user);
        }
        async function BuyDLPForUser(user:any) {
            await sleep(5_000);
            await tokenInWithMLP(weth, user);
            await sleep(5_000);
            await tokenInWithMLP(dai, user);
            await sleep(5_000);
            await tokenInWithMLP(wbtc, user);
            await sleep(5_000);

            /* added @0504*/
            await tokenInWithMLP(doge, user);
            await sleep(5_000);
            await tokenInWithMLP(ltc, user);
            await sleep(5_000);
            await tokenInWithMLP(arb, user);
            await sleep(5_000);
            await tokenInWithMLP(fil, user);
            await sleep(5_000);

            /* added @0505*/
            await tokenInWithMLP(msft, user);
            await sleep(5_000);
            await tokenInWithMLP(tsla, user);
            await sleep(5_000);

        }
        await BuyDLPForUser(owner);
        await BuyDLPForUser(user0);
    }


    // await OP_APPROVE();
    // await OP_APPROVE_PRINT();

    await OP_CHAINID();
    await OP_LP_BUY();
    await OP_ALL_GET();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
