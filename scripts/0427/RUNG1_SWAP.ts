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




    await OP_CHAINID();

    async function OP_SWAP_TO_TOKEN(user: any) {
        async function swapToToken(_user:any, _token: any, _amountIn: any = "100") {
            // swap
            let {updateData, fee} = await OP_GET_UPDATEData();
            await router.connect(_user)
                .swap(
                    [dai.address, _token.address], // path
                    parseEther(_amountIn), // inAmount
                    0, // minOut
                    _user.address, updateData, {value: fee});
            await sleep(1_000);
            console.log(`swap ${_amountIn} => token(${await _token.symbol()}) for user (${_user.address}) success`)
        }
        await swapToToken(user, weth);
        await swapToToken(user, wbtc);
        await swapToToken(user, doge);
        await swapToToken(user, ltc);
        await swapToToken(user, arb);
        await swapToToken(user, fil);
        await swapToToken(user, msft);
        await swapToToken(user, tsla);
    }
    async function OP_SWAP_TO_DAI(user: any ) {
        async function swapToDAI(_user:any, _token: any) {
            let balance = await _token.balanceOf(_user.address);
            if (balance == 0) { return; }

            // swap
            let {updateData, fee} = await OP_GET_UPDATEData();
            await router.connect(_user)
                .swap(
                    [_token.address, dai.address], // path
                    balance, // inAmount
                    0, // minOut
                    _user.address, updateData, {value: fee});
            await sleep(1_000);
            console.log(`swap token(${await _token.symbol()}), balance: ${formatEther(balance)} => dai for user (${_user.address}) success`)
        }
        await swapToDAI(user, weth);
        await swapToDAI(user, wbtc);
        await swapToDAI(user, doge);
        await swapToDAI(user, ltc);
        await swapToDAI(user, arb);
        await swapToDAI(user, fil);
        await swapToDAI(user, msft);
        await swapToDAI(user, tsla);
    }

    await OP_SWAP_TO_TOKEN(owner);
    await OP_SWAP_TO_TOKEN(user0);
    await OP_ALL_GET();
    await OP_SWAP_TO_DAI(owner);
    await OP_SWAP_TO_DAI(user0);
    await OP_ALL_GET();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
