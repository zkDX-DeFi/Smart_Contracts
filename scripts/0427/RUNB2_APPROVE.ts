import {deployments, ethers} from 'hardhat';
import {
    AddressZero,
    ApproveAmount,
    forwardTime,
    getContracts,
    getUpdateDataTestnet
} from "../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {FEED_ID_BTC_TEST, FEED_ID_ETH_TEST, FEED_ID_USDC_TEST} from "../../helpers/constants";
import {OP_ALL_GET, OP_CHAINID, sleep, splitter} from "../../helpers/utils2";
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

    async function OP_APPROVE() {
        async function approveAllTokens(user:any) {
            async function approveToken(token: any, approveAddress: any, user: any) {
                await token.connect(user).approve(approveAddress, ApproveAmount);
                console.log(`token: ${await token.symbol()} => Approve( ${user.address})`);
            }
            await approveToken(weth,    zkdlpManager.address, user);
            await sleep(5_000);
            await approveToken(dai,     zkdlpManager.address, user);
            await sleep(5_000);
            await approveToken(wbtc,    zkdlpManager.address, user);
            await sleep(5_000);

            /* added @0504*/
            await approveToken(doge,    zkdlpManager.address, user);
            await sleep(5_000);
            await approveToken(ltc,     zkdlpManager.address, user);
            await sleep(5_000);
            await approveToken(arb,     zkdlpManager.address, user);
            await sleep(5_000);
            await approveToken(fil,     zkdlpManager.address, user);
            await sleep(5_000);

            /* added @0505*/
            await approveToken(msft,    zkdlpManager.address, user);
            await sleep(5_000);
            await approveToken(tsla,    zkdlpManager.address, user);
            await sleep(5_000);
        }

        await approveAllTokens(owner);
        await sleep(10_000);
        await approveAllTokens(user0);
        await sleep(10_000);
    }
    await OP_CHAINID();
    await OP_APPROVE();
    await OP_ALL_GET();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
