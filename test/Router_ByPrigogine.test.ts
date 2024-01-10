import {expect} from "chai";
import {setupFixture} from "../helpers/utils";
import {ethers} from "hardhat";

describe("Router By Prigogine", async () => {

    let vault: any,
        router: any,
        r:any,
        timelock: any,
        weth: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        positionKeeper: any,
        positionManager: any,
        wethPriceFeed: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        r = fixture.router;
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
    });

    it("Router.Parameters -- Part A", async () => {
        expect(r.address).not.eq(ethers.constants.AddressZero);
        expect(await r.gov()).eq(owner.address);
        expect(await r.weth()).not.eq(ethers.constants.AddressZero);
        expect(await r.weth()).eq(weth.address);

        expect(await r.zkusd()).not.eq(ethers.constants.AddressZero);
        expect(await r.vault()).eq(vault.address);
        expect(await r.vault()).not.eq(ethers.constants.AddressZero);
    });


    it("Router.Funcs => setGov()", async () => {
        expect(await r.gov()).not.eq(ethers.constants.AddressZero);
        await r.setGov(ethers.constants.AddressZero);
        expect(await r.gov()).eq(ethers.constants.AddressZero);
    });

    it("Router.Parameters => gov", async () => {
        expect(await r.gov()).eq(owner.address);
    });

    it("Router.Funcs => addPlugin()", async () => {
        await r.addPlugin(user0.address);
        expect(await r.plugins(user0.address)).eq(true);

        await r.removePlugin(user0.address);
        expect(await r.plugins(user0.address)).eq(false);
    });
});
 
