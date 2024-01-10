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

    async function OP_LP_SELL() {
        async function sellMLPWithToken(token: any, user: any, dlpAmountIn: any) {
            let {updateData, fee} = await OP_GET_UPDATEData();
            await rewardRouter.connect(user).unstakeAndRedeemZkdlp(token.address, dlpAmountIn, 0, user.address, updateData, {value: fee});
            await sleep(1_000);
            console.log(`sellMLPWithToken: ${await token.symbol()}, lpAmount: ${formatEther(dlpAmountIn)}, user: ${user.address}`);
        }

        async function sellMLP(user: any) {
            await sellMLPWithToken(dai, user, parseEther("100"));
            await sleep(5_000);
            await sellMLPWithToken(weth, user, parseEther("100"));
            await sleep(5_000);
            await sellMLPWithToken(wbtc, user, parseEther("100"));
            await sleep(5_000);

            /* added @0504 */
            await sellMLPWithToken(doge,user, parseEther("100"));
            await sleep(5_000);
            await sellMLPWithToken(ltc, user, parseEther("100"));
            await sleep(5_000);
            await sellMLPWithToken(arb, user, parseEther("100"));
            await sleep(5_000);
            await sellMLPWithToken(fil, user, parseEther("100"));
            await sleep(5_000);

            /* added @0505 */
            await sellMLPWithToken(msft, user, parseEther("100"));
            await sleep(5_000);
            await sellMLPWithToken(tsla, user, parseEther("100"));
            await sleep(5_000);
        }
        await sellMLP(owner);
        await sellMLP(user0);
    }

    await OP_CHAINID();
    await OP_LP_SELL();
    await OP_ALL_GET();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
