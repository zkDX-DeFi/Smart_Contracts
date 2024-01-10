import {setupFixture, toChainlinkPrice, toUsd} from "../helpers/utils";
import {formatEther, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";

describe("ShortTracker", async () => {

    let vault: any,
        router: any,
        timelock: any,
        weth: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        positionKeeper: any,
        positionManager: any,
        wethPriceFeed: any,
        reader: any,
        zkdlp: any,
        zkdlpManager: any,
        mm: any,
        rewardRouter: any,
        vaultUtils: any,
        o: any,
        s: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        timelock = fixture.timelock;
        weth = fixture.weth;
        dai = fixture.dai;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        positionKeeper = fixture.positionKeeper;
        positionManager = fixture.positionManager;
        wethPriceFeed = fixture.wethPriceFeed;
        reader = fixture.reader;
        zkdlp = fixture.zkdlp;
        zkdlpManager = fixture.zkdlpManager;
        mm = fixture.zkdlpManager;
        rewardRouter = fixture.rewardRouter;
        vaultUtils = fixture.vaultUtils;
        o = fixture.orderBook;
        s = fixture.shortsTracker;
        
        await router.addPlugin(positionManager.address)
        await timelock.setContractHandler(positionManager.address, true)
        await timelock.setShouldToggleIsLeverageEnabled(true)
    })
    it("ShortTracker.func => setHandler", async () => {
        console.log(`s.address: ${s.address}`);

        await s.setHandler(user2.address, true);
        await expect(s.connect(user2).setHandler(user2.address,true)).reverted;

        await s.setIsGlobalShortDataReady(true);
        await expect(s.connect(user2).setIsGlobalShortDataReady(true)).reverted;

        await s.setIsGlobalShortDataReady(false);
        await s.setInitData([dai.address],[0])
    });

    it("ShortTracker.func => setHandler", async () => {
        // console.log(`s.getGlobalShortDelta: ${await s.getGlobalShortDelta(dai.address)}`);
        // console.log(`s.getGlobalShortDelta: ${await s.getGlobalShortDelta(weth.address)}`);

        console.log(`s.getNextGlobalShortData: ${await s.getNextGlobalShortData(
            user0.address,
            dai.address,
            dai.address,
            parseEther("1"),
            100,
            true
        )}`);

        console.log(`s.getRealisedPnl: ${await s.getRealisedPnl(
            user0.address,
            dai.address,
            dai.address,
            100,
            true
        )}`);
    });
});
 
