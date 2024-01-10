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
import {OP_ALL_GET, OP_GET_UPDATEData, OP_GET_VAULT, sleep, splitter} from "../../helpers/utils2";
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

    async function OP_IP() {
        async function OP_SHORT() {
            async function shortWETH(user: any, _DAIAmountIn: any, _sizeDelta: any) {
                let pm = positionManager;
                let dai = usdc;
                let {
                    updateData,
                    fee
                } = await OP_GET_UPDATEData();
                let params = [
                    [dai.address], // _path
                    weth.address, // _indexTokens
                    _DAIAmountIn,
                    0, // _minOut
                    toUsd(_sizeDelta), // _sizeDelta
                    false, // _isLong
                    toUsd(1000.000001), // _acceptablePrice
                    updateData
                ];
                await pm.connect(user).increasePosition(...params, {value: fee});
            }
            async function shortWBTC(user: any, _DAIAmountIn: any, _sizeDelta: any) {
                let pm = positionManager;
                let dai = usdc;
                let {updateData, fee} = await OP_GET_UPDATEData();
                    // await getUpdateDataTestnet([FEED_ID_USDC_TEST, FEED_ID_BTC_TEST, FEED_ID_ETH_TEST]);
                let params = [
                    [dai.address], // _path
                    wbtc.address, // _indexTokens
                    _DAIAmountIn,
                    0, // _minOut
                    toUsd(_sizeDelta), // _sizeDelta
                    false, // _isLong
                    toUsd(10000.000001), // _acceptablePrice
                    updateData
                ];
                await pm.connect(user).increasePosition(...params, {value: fee});
            }
            async function shortToken(user: any, _DAIAmountIn: any, _sizeDelta: any, _token: any) {
                let pm = positionManager;
                let dai = usdc;
                let {updateData, fee} = await OP_GET_UPDATEData();
                // await getUpdateDataTestnet([FEED_ID_USDC_TEST, FEED_ID_BTC_TEST, FEED_ID_ETH_TEST]);
                let params = [
                    [dai.address], // _path
                    _token.address, // _indexTokens
                    _DAIAmountIn,
                    0, // _minOut
                    toUsd(_sizeDelta), // _sizeDelta
                    false, // _isLong
                    toUsd(0.001), // _acceptablePrice
                    updateData
                ];
                await pm.connect(user).increasePosition(...params, {value: fee});
            }
            async function shortWithUser(user: any) {
                await shortWETH(user, parseEther("1000"), 10000);
                await sleep(15_000);
                await shortWBTC(user, parseEther("1000"), 10000);
                await sleep(15_000);

                await shortToken(user, parseEther("1000"), 10000, doge);
                await sleep(15_000);

                await shortToken(user, parseEther("1000"), 10000, ltc);
                await sleep(15_000);

                await shortToken(user, parseEther("1000"), 10000, arb);
                await sleep(15_000);

                await shortToken(user, parseEther("1000"), 10000, fil);
                await sleep(15_000);

                await shortToken(user, parseEther("1000"), 10000, msft);
                await sleep(15_000);

                await shortToken(user, parseEther("1000"), 10000, tsla);
                await sleep(15_000);
            }

            await shortWithUser(owner);
            await sleep(10_000);
            await shortWithUser(user0);
            await sleep(10_000);
        }
        async function OP_LONG() {
            async function longTOKEN(user: any, _DAIAmountIn: any, _sizeDelta: any, _token: any) {
                let pm = positionManager;
                let dai = usdc;
                let {updateData, fee} = await OP_GET_UPDATEData();
                let params = [
                    [dai.address, _token.address], // _path
                    _token.address, // _indexTokens
                    _DAIAmountIn,
                    0, // _minOut
                    toUsd(_sizeDelta), // _sizeDelta
                    true, // _isLong
                    toUsd(40000.000001), // _acceptablePrice
                    updateData
                ];
                await pm.connect(user).increasePosition(...params, {value: fee});
            }
            async function longWithUser(user: any) {
                await longTOKEN(user, parseEther("1000"), 10000, weth);
                await sleep(5_000);

                await longTOKEN(user, parseEther("1000"), 10000, wbtc);
                await sleep(5_000);

                await longTOKEN(user, parseEther("1000"), 10000, doge);
                await sleep(5_000);

                await longTOKEN(user, parseEther("1000"), 10000, ltc);
                await sleep(5_000);

                await longTOKEN(user, parseEther("1000"), 10000, arb);
                await sleep(5_000);

                await longTOKEN(user, parseEther("1000"), 10000, fil);
                await sleep(5_000);

                await longTOKEN(user, parseEther("1000"), 10000, msft);
                await sleep(5_000);

                await longTOKEN(user, parseEther("1000"), 10000, tsla);
                await sleep(5_000);
            }

            await longWithUser(owner);
            await sleep(15_000);
            await longWithUser(user0);
            await sleep(15_000);
        }

        await OP_LONG();
        await OP_ALL_GET();
        await OP_SHORT();
        await OP_ALL_GET();
    }
    await OP_IP();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
