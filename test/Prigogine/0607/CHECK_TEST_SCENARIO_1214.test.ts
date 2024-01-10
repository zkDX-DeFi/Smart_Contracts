import {AddressZero, setupFixture} from "../../../helpers/utils";
import {formatEther, parseEther} from "ethers/lib/utils";
import {
    global_buyMLPWithETH,
    global_longWETH_DAIAmountIn,
    updateMarkPrice
} from "../../../helpers/utilsForTest";

describe("CHECK_TEST_SCENARIO_1214.test.ts", async () => {
    let
        weth                : any,
        wbtc                : any,
        dai                 : any,
        usdc                : any,
        tsla                : any,
        aapl                : any, //aapl
        zkdlp               : any,
        dlp                 : any,
        zkusd               : any,
        zkdx                : any,
        zkdxlv1             : any,
        hlp                 : any,

        /* users */
        owner               : any,
        user0               : any,
        user1               : any,
        user2               : any,
        miner               : any,
        feeTo               : any,
        receiver            : any,
        /* contracts */
        timelock            : any,
        t                   : any, //timelock
        vault               : any,
        v                   : any, //vault
        v2                  : any, //vaultV2
        feed                : any, //vaultFeed
        vaultUtils          : any,
        vu                  : any, //vaultUtils
        vec                 : any, //vaultErrorController
        pythContract        : any,

        pm                  : any, //positionManager
        dlpManager          : any,
        dm                  : any, //dlpManager
        hm                  : any, //hlpManager
        router              : any,
        r                   : any, //router
        shortsTracker       : any,
        ss                  : any, //shortsTracker
        o                   : any, //orderBook
        rewardRouter        : any,
        rr                  : any, //rewardRouter
        reader              : any,
        obr                 : any, //orderBookReader

        aipc                : any,
        hedge               : any,
        /* Staking */
        stakingUSDC         : any,
        esZKDX              : any,
        rewardToken         : any,
        stakingToken        : any,
        stakingETH          : any;

    beforeEach(async () => {
        let fixture = await setupFixture();

        weth                = fixture.weth;
        wbtc                = fixture.wbtc;
        dai                 = fixture.dai;
        usdc                = fixture.usdc;
        tsla                = fixture.tsla;
        aapl                = fixture.aapl;
        zkdlp               = fixture.zkdlp;
        dlp                 = zkdlp;
        hlp                 = fixture.hlp;
        zkusd               = fixture.ZKUSD;
        zkdx                = fixture.ZKDX;
        zkdxlv1             = fixture.zkdxlv1;


        owner               = fixture.owner;
        user0               = fixture.user0;
        user1               = fixture.user1;
        user2               = fixture.user2;
        miner               = fixture.miner;
        feeTo               = fixture.feeTo;
        receiver            = fixture.receiver;

        timelock            = fixture.timelock;
        t                   = timelock;
        vault               = fixture.vault;
        v                   = vault;
        v2                  = fixture.v2;
        feed                = fixture.vaultPriceFeed;
        vaultUtils          = fixture.VaultUtils;
        vu                  = vaultUtils;
        vec                 = fixture.vaultErrorController;
        pythContract        = fixture.pythContract;

        pm                  = fixture.positionManager;
        dlpManager          = fixture.zkdlpManager;
        dm                  = dlpManager;
        hm                  = fixture.hlpManager;
        router              = fixture.router;
        r                   = router;
        shortsTracker       = fixture.shortsTracker;
        ss                  = shortsTracker;
        o                   = fixture.orderBook;
        rewardRouter        = fixture.rewardRouter;
        rr                  = rewardRouter;
        reader              = fixture.reader;
        obr                 = fixture.orderBookReader;

        aipc                = fixture.aipc;
        hedge               = fixture.hedgeManager;

        stakingUSDC         = fixture.stakingUSDC;
        stakingETH          = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;
        rewardToken         = esZKDX;
        stakingToken        = usdc;

        await feed.setValidTime(300);
        // await v2.setTokenConfig(dai.address, true,true,true);
        // await v2.setTokenConfig(tsla.address, true,false,true);
        // await v2.setTokenConfig(weth.address, true,false,true);
    });



    it("check vault.func => swap => dai 2 weth", async() => {
        await global_buyMLPWithETH(parseEther("20"), owner,feed,rewardRouter);
        await global_longWETH_DAIAmountIn(owner, parseEther("800"), 1400,dai,weth,router,pm);

        await updateMarkPrice(['weth'],['1800']);
        await vu.validateLiquidation(
            owner.address,
            weth.address,
            weth.address, true, true);

        console.log(`${formatEther(await v.cumulativeFundingRates(
            weth.address))}`);
        console.log(`${formatEther(await v.cumulativeFundingRates(
            dai.address))}`);

        console.log(`${await vu.getFundingFee(
            AddressZero,
            weth.address,
            AddressZero,
            true,
            100,
            0
        )}`);

        console.log(`${await vu.getFeeBasisPoints(
            usdc.address,
            100,
            100,
            100,
            false
        )}`);

        console.log(`${await vu.getFeeBasisPoints(
            usdc.address,
            100,
            100,
            100,
            true
        )}`);

        console.log(`${await vu.getFeeBasisPoints(
            AddressZero,
            100,
            100,
            100,
            true
        )}`);
    });
});
