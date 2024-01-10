import {deployments, ethers} from 'hardhat';
import {
    AddressZero,
    forwardTime,
    getContracts,
    getUpdateDataTestnet
} from "../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {FEED_ID_BTC_TEST} from "../../helpers/constants";
import {OP_ALL_GET, OP_CHAINID, OP_TOKEN_INTERVAL, sleep, splitter} from "../../helpers/utils2";
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

    async function OP_ALL_FAUCET() {
        async function OP_FAUCET(user:any) {
            async function allTokensFaucet(user: any) {
                async function tokenFaucet(token: any, user:any) {
                    await token.connect(user).faucet();
                    console.log(`token: ${await token.symbol()} => faucet( ${user.address})`);
                }
                // await tokenFaucet(weth,user);
                // await tokenFaucet(wbtc,user);
                await tokenFaucet(usdc,user);

                /* added @0504 */
                // await tokenFaucet(doge,user);
                // await tokenFaucet(ltc,user);
                // await tokenFaucet(arb,user);
                // await tokenFaucet(fil,user);

                /* added @0505 */
                // await tokenFaucet(msft,user);
                // await tokenFaucet(tsla,user);
            }
            await allTokensFaucet(user);
            await sleep(30_000);
        }
        await OP_FAUCET(owner);
        await OP_FAUCET(user0);
    };

    await OP_CHAINID();
    await OP_ALL_FAUCET();

    await OP_ALL_GET();
    await OP_TOKEN_INTERVAL();
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
