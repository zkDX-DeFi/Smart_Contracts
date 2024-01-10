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
import {OP_ALL_GET, OP_CHAINID, sleep, splitter} from "../../helpers/utils2";
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
    async function OP_APPROVE() {
        async function approveUser(user: any) {
            await usdc.connect(user).approve(router.address, ApproveAmount);
            await weth.connect(user).approve(router.address, ApproveAmount);
            await wbtc.connect(user).approve(router.address, ApproveAmount);

            /* added @0504 */
            await doge.connect(user).approve(router.address, ApproveAmount);
            await ltc.connect(user).approve(router.address, ApproveAmount);
            await arb.connect(user).approve(router.address, ApproveAmount);
            await fil.connect(user).approve(router.address, ApproveAmount);

            /* added @0505 */
            await msft.connect(user).approve(router.address, ApproveAmount);
            await tsla.connect(user).approve(router.address, ApproveAmount);
        }

        await approveUser(owner);
        await approveUser(user0);
    }

    await OP_CHAINID();
    await OP_APPROVE();
    await OP_ALL_GET();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
