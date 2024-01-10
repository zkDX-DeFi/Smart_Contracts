import {deployments, ethers} from 'hardhat';
import {
    AddressZero,
    ApproveAmount,
    forwardTime,
    getContracts,
    getUpdateDataTestnet, toUsd
} from "../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {FEED_ID_BTC_TEST, FEED_ID_ETH_TEST, FEED_ID_USDC_TEST} from "../../helpers/constants";
import {OP_ALL_GET, OP_CHAINID, OP_GET_UPDATEData, OP_GET_VAULT, sleep, splitter} from "../../helpers/utils2";
import {getLiqPrice, getUpdateData} from "../../helpers/utilsForTest";

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
    let pm = positionManager;
    let dai = usdc;
    async function OP_DP() {
        async function OP_DP_LONG(user:any) {
            async function dp_long_TOKEN(user:any, _token: any, _acceptablePrice: number = 1000) {
                let key = await vault.getPositionKey(user.address, _token.address, _token.address, true);
                let _sizeDelta = await (await vault.positions(key)).size;
                console.log(`token: ${await _token.symbol()}, _sizeDelta: ${formatUnits(_sizeDelta,30)}`);
                if (_sizeDelta.eq(0)) {
                    return;
                }
                await sleep(1_000);

                let params = [
                    [_token.address, dai.address],
                    _token.address,
                    0,
                    _sizeDelta, // _sizeDelta,
                    true, // _isLong
                    user.address, // _receiver
                    toUsd(_acceptablePrice), // _acceptablePrice
                    0,
                    false,
                ];
                let {updateData, fee} = await OP_GET_UPDATEData();
                await pm.connect(user).decreasePosition(...params, updateData, {value: fee});
            }

            await dp_long_TOKEN(user, weth);
            await sleep(10_000);
            await dp_long_TOKEN(user, wbtc);
            await sleep(10_000);

            await dp_long_TOKEN(user, doge,0.01);
            await sleep(10_000);
            await dp_long_TOKEN(user, ltc,10);
            await sleep(10_000);
            await dp_long_TOKEN(user, arb, 1);
            await sleep(10_000);
            await dp_long_TOKEN(user, fil,1);
            await sleep(10_000);
            await dp_long_TOKEN(user, msft,100);
            await sleep(10_000);
            await dp_long_TOKEN(user, tsla,100);
            await sleep(10_000);

        }
        async function OP_DP_SHORT2(user:any) {
            async function dp_long_TOKEN(user:any, _token: any, _acceptablePrice: number = 100000) {
                let key = await vault.getPositionKey(user.address, dai.address, _token.address, false);
                let _sizeDelta = await (await vault.positions(key)).size;
                console.log(`token: ${await _token.symbol()}, _sizeDelta: ${formatUnits(_sizeDelta,30)}`);
                if (_sizeDelta.eq(0)) {
                    return;
                }
                await sleep(1_000);

                let params = [
                    [dai.address],
                    _token.address,
                    0,
                    _sizeDelta, // _sizeDelta,
                    false, // _isLong
                    user.address, // _receiver
                    toUsd(_acceptablePrice), // _acceptablePrice
                    0,
                    false,
                ];

                let {updateData, fee} = await OP_GET_UPDATEData();
                await pm.connect(user).decreasePosition(...params, updateData, {value: fee});
            }

            await dp_long_TOKEN(user, weth,5000);
            await sleep(10_000);
            await dp_long_TOKEN(user, wbtc,50000);
            await sleep(10_000);

            await dp_long_TOKEN(user, doge,1);
            await sleep(10_000);
            await dp_long_TOKEN(user, ltc,200);
            await sleep(10_000);
            await dp_long_TOKEN(user, arb, 10);
            await sleep(10_000);
            await dp_long_TOKEN(user, fil,10);
            await sleep(10_000);
            await dp_long_TOKEN(user, msft,1000);
            await sleep(10_000);
            await dp_long_TOKEN(user, tsla,1000);
            await sleep(10_000);
        }

        await OP_CHAINID();
        await OP_DP_LONG(owner);
        await OP_DP_LONG(user0);
        await OP_ALL_GET();

        await OP_DP_SHORT2(owner);
        await OP_DP_SHORT2(user0);
        await OP_ALL_GET();
    }


    await OP_DP();

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
