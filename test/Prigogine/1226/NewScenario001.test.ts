import {setupFixture} from "../../../helpers/utils";
import {parseEther} from "ethers/lib/utils";
import {deployContract} from "../../../helpers/utils2";
import {global_buyMLPWithETH, global_longWETH_DAIAmountIn} from "../../../helpers/utilsForTest";

describe("NewScenario001", async () => {
    let owner: any,
        user0: any,
        user1: any,
        user2: any,
        user3: any,
        nft: any,
        tree: any,
        root: any,
        dai: any,
        multiTransfer: any,
        vault: any,
        bt: any,
        timelock: any,
        pm: any,
        weth: any,
        r:any,
        exchanger: any,
        obr: any,
        ob: any,
        staking: any,
        feed: any,
        rewardRouter: any,
        router: any,
        vaultUtils, vu, v: any,
        usdc: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        user3 = fixture.user3;
        dai = fixture.dai;
        vault = fixture.vault;
        timelock = fixture.timelock;
        pm = fixture.positionManager;
        weth = fixture.weth;
        r = fixture.rewardRouter;
        exchanger = fixture.exchanger;
        obr = fixture.orderBookReader;
        ob = fixture.orderBook;
        staking = fixture.stakingUSDC;
        feed    = fixture.vaultPriceFeed;
        rewardRouter        = fixture.rewardRouter;
        router              = fixture.router;
        vaultUtils          = fixture.VaultUtils;
        vu                  = vaultUtils;
        v                   = fixture.vault;
        usdc                = fixture.usdc;

        bt = await deployContract("BaseToken",
            ['bt', 'bt', parseEther("1000")]);
        await bt.addAdmin(owner.address);
    })


    it("check vault.func => swap => dai 2 weth", async() => {
        await global_buyMLPWithETH(parseEther("20"), owner,feed,rewardRouter);
        await global_longWETH_DAIAmountIn(owner, parseEther("800"), 1400,dai,weth,router,pm);
    });
});

