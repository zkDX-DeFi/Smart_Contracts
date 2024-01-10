import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("DlpManager Test V1", async () => {
    let vault: any,
        router: any,
        pm: any,
        shortsTracker: any,

        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        miner: any,
        feeTo: any,
        receiver : any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v : any,
        zkdlpManager: any,
        zkdx: any,
        feed: any;


    beforeEach(async () => {
        let fixture = await setupFixture();
        vault           = fixture.vault;
        router          = fixture.router;
        pm              = fixture.positionManager;
        shortsTracker   = fixture.shortsTracker;

        weth            = fixture.weth;
        wbtc            = fixture.wbtc;
        dai             = fixture.dai;
        owner           = fixture.owner;
        user0           = fixture.user0;
        user1           = fixture.user1;
        user2           = fixture.user2;
        miner           = fixture.miner;
        feeTo           = fixture.feeTo;
        receiver        = fixture.receiver;

        zkdlp           = fixture.zkdlp;
        timelock        = fixture.timelock;
        rewardRouter    = fixture.rewardRouter;
        zkusd           = fixture.ZKUSD;
        v               = fixture.vault;
        zkdlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        feed            = fixture.vaultPriceFeed;
    });

    async function buyMLPWithTokenV2(token: any, amountIn: any, addressIn: any) {
        await token.mint(addressIn.address, amountIn);
        await token.connect(addressIn).approve(zkdlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
    }
    async function sellMLPWithTokenV2(zkdlpAmountIn: any, tokenOut: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmountIn);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn,0, addressIn.address, updateData2, {value: fee2});
    }
    async function buyMLPWithETHV2(etherValue: any, addressIn: any) {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlpETH(0, 0, updateData, {value: etherValue.add(fee)});
    }
    async function sellMLPWithETHV2(zkdlpAmount: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmount);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlpETH(zkdlpAmount, 0, addressIn.address, updateData2, {value: fee2});
    }

    it("rewardRouter.func => buyMLPWithTokenV2 => sellMLPWithTokenV2", async () => {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("123456"), user2);

        await sellMLPWithTokenV2(parseEther("99100"), weth, owner);
        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);
        await sellMLPWithTokenV2(parseEther("79160"), wbtc, user1);
        await sellMLPWithTokenV2(parseEther("23085"), dai, user2);

        await buyMLPWithETHV2(parseEther("200"), owner);
        await sellMLPWithETHV2(parseEther("99100"), owner);

        await expect(sellMLPWithTokenV2(parseEther("9910000"), weth, owner)).to.be.reverted;
    });
    it("rewardRouter.func => buyMLPWithETHV2", async () => {
        expect(await zkdlp.balanceOf(owner.address)).to.be.eq(0);
        expect(await zkdlp.balanceOf(user0.address)).to.be.eq(0);
        await buyMLPWithETHV2(parseEther("200"), owner);
        await buyMLPWithETHV2(parseEther("100"), user0);

        expect(await zkdlp.balanceOf(owner.address)).to.be.eq(parseEther("300000"));
        expect(await zkdlp.balanceOf(user0.address)).to.be.eq(parseEther("150000"));
        expect(await zkdlp.balanceOf(user1.address)).to.be.eq(0);
    });
    it("zkdlpManager.parameters => vault => buyMLPWithETHV2", async () => {
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);

       expect(await zkdlpManager.vault()).to.be.eq(v.address);
       expect(await zkdlpManager.zkUsd()).to.be.eq(zkusd.address);
       expect(await zkdlpManager.zkdlp()).to.be.eq(zkdlp.address);
       expect(await zkdlpManager.shortsTracker()).to.be.eq(shortsTracker.address);

       expect(await zkdlpManager.isHandler(zkusd.address)).to.be.eq(false);
       expect(await zkdlpManager.isHandler(rewardRouter.address)).to.be.eq(true);
    });
    it("zkdlpManager.parameters =>  v2 => buyMLPWithTokenV2", async () => {
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);

       expect(await zkdlpManager.inPrivateMode()).to.be.eq(true);
       expect(await zkdlpManager.shortsTrackerAveragePriceWeight()).to.be.eq(10000);
       expect(await zkdlpManager.gov()).to.be.eq(owner.address);

       expect(await zkdlpManager.cooldownDuration()).to.be.eq(0);
       expect(await zkdlpManager.aumAddition()).to.be.eq(0);
       expect(await zkdlpManager.aumDeduction()).to.be.eq(0);
    });
    it("zkdlpManager.parameters =>  lastAddedAt() => buyMLPWithTokenV2()", async () => {
        expect(await zkdlpManager.lastAddedAt(user0.address)).to.be.eq(0);

        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        const lastAddedAt = await zkdlpManager.lastAddedAt(user0.address);
        expect(lastAddedAt).to.be.gt(0);

        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);
       expect(await zkdlpManager.lastAddedAt(user0.address)).to.be.eq(lastAddedAt);
       expect(await zkdlpManager.lastAddedAt(owner.address)).to.be.eq(0);
       expect(await zkdlpManager.lastAddedAt(user1.address)).to.be.eq(0);
       expect(await zkdlpManager.lastAddedAt(user2.address)).to.be.eq(0);
    });
    it("zkdlpManager.func => getPrice() => buyMLPWithTokenV2()", async () => {
        expect(formatUnits(await zkdlpManager.getPrice(true),30)).to.be.eq("1.0");
        expect(formatUnits(await zkdlpManager.getPrice(false),30)).to.be.eq("1.0");
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);


        expect(await zkdlpManager.getPrice(true)).to.be.gt(parseUnits("1.0",30));
        expect(await zkdlpManager.getPrice(false)).to.be.gt(parseUnits("1.0",30));
    });
    it("zkdlpManager.func => getAums() => buyMLPWithTokenV2()", async () => {
        await buyMLPWithTokenV2(weth, parseEther("1"), user0);
        await sellMLPWithTokenV2(parseEther("123.45"), weth, user0);

        let [aum, aum2] = await zkdlpManager.getAums();
        let priceDecimals = 30;

        console.log(`aum: ${formatUnits(aum,priceDecimals)}`);
        console.log(`aum2: ${formatUnits(aum2,priceDecimals)}`);

        let aumInZkUsd = await zkdlpManager.getPrice(true);
        let aumInZkUsd2 = await zkdlpManager.getPrice(false);

        console.log(`aumInZkUsd: ${formatUnits(aumInZkUsd,priceDecimals)}`);
        console.log(`aumInZkUsd2: ${formatUnits(aumInZkUsd2,priceDecimals)}`);


        // console.log(`zkdlpManager.getAums: ${await (await zkdlpManager.getAums())[0]}`);
        // console.log(`zkdlpManager.getAums: ${ (await zkdlpManager.getAums())[1]}`);
    });
    it("zkdlpManager.func => getAums() => buyMLPWithTokenV2()", async () => {
        await buyMLPWithTokenV2(weth, parseEther("1"), user0);
        await buyMLPWithETHV2(parseEther("5.4321"), user1);
        await buyMLPWithTokenV2(wbtc, parseUnits("1",8), user2);
        await buyMLPWithTokenV2(dai, parseEther("30000"), owner);
        let [aum, aum2] = await zkdlpManager.getAums();
        expect(aum).to.be.eq(parseUnits("67648.15",30));
        expect(aum2).to.be.eq(parseUnits("67648.15",30));

        await sellMLPWithTokenV2(parseEther("28000"),dai, owner);
        [aum, aum2] = await zkdlpManager.getAums();
        expect(aum).to.be.eq(parseUnits("39648.15",30));
        expect(aum2).to.be.eq(parseUnits("39648.15",30));
    });
    it("zkdlpManager.func => getAumInZkusd() => buyMLPWithTokenV2()", async () => {
        await buyMLPWithTokenV2(dai, parseEther("1000"), owner);
        await sellMLPWithTokenV2(parseEther("990"),dai, owner);

        let [aum, aum2] = [await zkdlpManager.getAumInZkusd(true), await zkdlpManager.getAumInZkusd(false)];
        expect(aum).to.be.eq(parseUnits("10",18));
        expect(aum2).to.be.eq(parseUnits("10",18));
    });
    it("zkdlpManager.func => getAum() => buyMLPWithTokenV2()", async () => {
        await buyMLPWithTokenV2(dai, parseEther("1000"), owner);
        await sellMLPWithTokenV2(parseEther("990"),dai, owner);
        let [aum, aum2,aum3, aum4] = [
            await zkdlpManager.getAum(true,true),
            await zkdlpManager.getAum(false,true),
            await zkdlpManager.getAum(true,false),
            await zkdlpManager.getAum(false,false)];

        expect(aum).to.be.eq(parseUnits("10",30));
        expect(aum2).to.be.eq(parseUnits("10",30));
        expect(aum3).to.be.eq(parseUnits("10",30));
        expect(aum4).to.be.eq(parseUnits("10",30));
    });
    it("zkdlpManager.func => getPrice() => buyMLPWithTokenV2()", async () => {
        await buyMLPWithTokenV2(dai, parseEther("1000"), owner);
        await sellMLPWithTokenV2(parseEther("990"),dai, owner);
        let [price,price2] = [await zkdlpManager.getPrice(true), await zkdlpManager.getPrice(false)];

        expect(price).to.be.eq(parseUnits("1",30));
        expect(price2).to.be.eq(parseUnits("1",30));
    });
    it("feed.func => getPrice(weth) => buyMLPWithTokenV2()", async () => {
        await dai.mint(owner.address, parseEther("1000"));
        await dai.approve(zkdlpManager.address, ApproveAmount);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc'],["1002","1.005","25678"]);
        await rewardRouter.connect(owner).mintAndStakeZkdlp(dai.address, parseEther("1000"), 0, 0, updateData, {value: fee});

        expect(await feed.getPrice(weth.address,true,true,true)).to.be.eq(parseUnits("1002",30));
        expect(await feed.getPrice(weth.address,true,false,true)).to.be.eq(parseUnits("1002",30));
        expect(await feed.getPrice(weth.address,false,true,true)).to.be.eq(parseUnits("1002",30));
        expect(await feed.getPrice(weth.address,false,false,true)).to.be.eq(parseUnits("1002",30));
    });
    it("feed.func => getPrice(wbtc) => buyMLPWithTokenV2()", async () => {
        await dai.mint(owner.address, parseEther("1000"));
        await dai.approve(zkdlpManager.address, ApproveAmount);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc'],["1002","1.005","25678"]);
        await rewardRouter.connect(owner).mintAndStakeZkdlp(dai.address, parseEther("1000"), 0, 0, updateData, {value: fee});

        expect(await feed.getPrice(wbtc.address,true,true,true)).to.be.eq(parseUnits("25678",30));
        expect(await feed.getPrice(wbtc.address,true,false,true)).to.be.eq(parseUnits("25678",30));
        expect(await feed.getPrice(wbtc.address,false,true,true)).to.be.eq(parseUnits("25678",30));
        expect(await feed.getPrice(wbtc.address,false,false,true)).to.be.eq(parseUnits("25678",30));
    });
    it("feed.func => mintAndStakeZkdlp() => updateMarkPrice()", async () => {
        await dai.mint(owner.address, parseEther("1000"));
        await dai.approve(zkdlpManager.address, ApproveAmount);

        await updateMarkPrice(['weth', 'dai', 'wbtc'],["1002","1.3","25678"]);
        await rewardRouter.mintAndStakeZkdlp(dai.address, parseEther("1000"), 0, 0, []);

        console.log(`price: ${formatUnits(await feed.getPrice(dai.address,true,true,true),30)}`);
        console.log(`price: ${formatUnits(await feed.getPrice(weth.address,true,true,true),30)}`);
        console.log(`price: ${formatUnits(await feed.getPrice(wbtc.address,true,true,true),30)}`);
    });
    it("feed.func => getPrice(dai) => updateMarkPrice()", async () => {
        await feed.setValidTime(30);
        await updateMarkPrice(['weth', 'dai', 'wbtc'],["1002","1","25678"]);

        expect(await feed.getPrice(dai.address,true,true,true)).to.be.eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address,true,false,true)).to.be.eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address,false,true,true)).to.be.eq(parseUnits("1",30));
        expect(await feed.getPrice(dai.address,false,false,true)).to.be.eq(parseUnits("1",30));

        expect(await feed.getPrice(weth.address,true,true,true)).to.be.eq(parseUnits("1002",30));
        expect(await feed.getPrice(weth.address,true,false,true)).to.be.eq(parseUnits("1002",30));
        expect(await feed.getPrice(weth.address,false,true,true)).to.be.eq(parseUnits("1002",30));
        expect(await feed.getPrice(weth.address,false,false,true)).to.be.eq(parseUnits("1002",30));

        expect(await feed.getPrice(wbtc.address,true,true,true)).to.be.eq(parseUnits("25678",30));
        expect(await feed.getPrice(wbtc.address,true,false,true)).to.be.eq(parseUnits("25678",30));
        expect(await feed.getPrice(wbtc.address,false,true,true)).to.be.eq(parseUnits("25678",30));
        expect(await feed.getPrice(wbtc.address,false,false,true)).to.be.eq(parseUnits("25678",30));
    });
});

describe("DlpManager Test V2", async () => {
    let vault: any,
        router: any,
        pm: any,
        shortsTracker: any,

        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        miner: any,
        feeTo: any,
        receiver : any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v : any,
        dlpManager: any,
        zkdx: any,
        feed: any;


    beforeEach(async () => {
        let fixture = await setupFixture();
        vault           = fixture.vault;
        router          = fixture.router;
        pm              = fixture.positionManager;
        shortsTracker   = fixture.shortsTracker;

        weth            = fixture.weth;
        wbtc            = fixture.wbtc;
        dai             = fixture.dai;
        owner           = fixture.owner;
        user0           = fixture.user0;
        user1           = fixture.user1;
        user2           = fixture.user2;
        miner           = fixture.miner;
        feeTo           = fixture.feeTo;
        receiver        = fixture.receiver;

        zkdlp           = fixture.zkdlp;
        timelock        = fixture.timelock;
        rewardRouter    = fixture.rewardRouter;
        zkusd           = fixture.ZKUSD;
        v               = fixture.vault;
        dlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        feed            = fixture.vaultPriceFeed;
    });

    async function buyMLPWithTokenV2(token: any, amountIn: any, addressIn: any) {
        await token.mint(addressIn.address, amountIn);
        await token.connect(addressIn).approve(dlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
    }
    async function sellMLPWithTokenV2(zkdlpAmountIn: any, tokenOut: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmountIn);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn,0, addressIn.address, updateData2, {value: fee2});
    }
    async function buyMLPWithETHV2(etherValue: any, addressIn: any) {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlpETH(0, 0, updateData, {value: etherValue.add(fee)});
    }
    async function sellMLPWithETHV2(zkdlpAmount: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmount);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlpETH(zkdlpAmount, 0, addressIn.address, updateData2, {value: fee2});
    }
    it("zkdlpManager.func => buyMLP + sellMLP", async () => {
        await buyMLPWithTokenV2(dai, parseEther("1000"), owner);
        await sellMLPWithTokenV2(parseEther("990"),dai, owner);
        await buyMLPWithETHV2(parseEther("200"), owner);
        await sellMLPWithETHV2(parseEther("99100"), owner);

        expect(await dlpManager.gov()).to.be.eq(owner.address);
        expect(await dlpManager.inPrivateMode()).to.be.true;
    });
    // it("dlpManager.func => addLiquidity", async () => {
    //     let wethAmountIn = parseEther("100");
    //     await weth.mint(owner.address, wethAmountIn);
    //     await weth.approve(dlpManager.address, wethAmountIn);
    //     await updateMarkPrice(['weth', 'dai', 'wbtc'],["1000","1.3","25678"]);
    //     await expect(dlpManager.connect(owner).addLiquidity(weth.address, parseEther("100"),0,0)).to.be.reverted;
    //
    //     expect(await zkdlp.balanceOf(owner.address)).to.be.eq(0);
    //     expect(await zkdlp.totalSupply()).to.be.eq(0);
    // });
    it("dlpManager.func => isHandler", async () => {
       expect(await dlpManager.isHandler(owner.address)).to.be.eq(false);
       expect(await dlpManager.isHandler(zkdlp.address)).to.be.eq(false);
       expect(await dlpManager.isHandler(router.address)).to.be.eq(false);
       expect(await dlpManager.isHandler(pm.address)).to.be.eq(false);
       expect(await dlpManager.isHandler(shortsTracker.address)).to.be.eq(false);
       expect(await dlpManager.isHandler(rewardRouter.address)).to.be.eq(true);
    });
    // it("dlpManager.func => removeLiquidity", async () => {
    //     let wethAmountIn = parseEther("100");
    //     await weth.mint(owner.address, wethAmountIn);
    //     await weth.approve(dlpManager.address, wethAmountIn);
    //     await updateMarkPrice(['weth', 'dai', 'wbtc'],["1000","1.3","25678"]);
    //     await expect(dlpManager.connect(owner).addLiquidity(weth.address, parseEther("100"),0,0)).to.be.reverted;
    //
    //     expect(await zkdlp.balanceOf(owner.address)).to.be.eq(parseEther("0"));
    //     expect(await zkdlp.totalSupply()).to.be.eq(parseEther("0"));
    // });
    it("dlpManager.settings => setInPrivateMode()", async () => {
       expect(await dlpManager.inPrivateMode()).to.be.eq(true);
       await expect(dlpManager.connect(user0).setInPrivateMode(true)).to.be.reverted;

       await dlpManager.setInPrivateMode(true);
       expect(await dlpManager.inPrivateMode()).to.be.eq(true);

       await dlpManager.setInPrivateMode(false);
       expect(await dlpManager.inPrivateMode()).to.be.false;
    });
    it("dlpManager.settings => setGov()", async () => {
        expect(await dlpManager.gov()).to.be.eq(owner.address);
        await expect(dlpManager.connect(user0).setGov(user0.address)).to.be.reverted;

        await dlpManager.setGov(user0.address);
        expect(await dlpManager.gov()).to.be.eq(user0.address);

        await expect(dlpManager.setInPrivateMode(true)).to.be.reverted;
        expect(await dlpManager.inPrivateMode()).to.be.eq(true);

        await dlpManager.connect(user0).setInPrivateMode(false);
        expect(await dlpManager.inPrivateMode()).to.be.eq(false);
    });
    it("dlpManager.func => getGlobalShortAveragePrice()", async () => {
        await buyMLPWithTokenV2(dai, parseEther("1000"), owner);
        await sellMLPWithTokenV2(parseEther("990"),dai, owner);
        await buyMLPWithETHV2(parseEther("200"), owner);
        await sellMLPWithETHV2(parseEther("99100"), owner);

        expect(await dlpManager.shortsTrackerAveragePriceWeight()).to.be.eq(10000);
        expect(await dlpManager.getGlobalShortAveragePrice(weth.address)).to.be.eq(0);
        expect(await dlpManager.getGlobalShortAveragePrice(dai.address)).to.be.eq(0);
        expect(await dlpManager.getGlobalShortAveragePrice(wbtc.address)).to.be.eq(0);
    });
    it("dlpManager.settings => setShortsTrackerAveragePriceWeight()", async () => {
        expect(await dlpManager.shortsTrackerAveragePriceWeight()).to.be.eq(10000);
        await expect(dlpManager.connect(user0).setShortsTrackerAveragePriceWeight(10001)).to.be.reverted;
        await dlpManager.setShortsTrackerAveragePriceWeight(9999);
        await expect(dlpManager.setShortsTrackerAveragePriceWeight(10001)).to.be.reverted;
    });
    it("dlpManager.settings => setHandler()", async() => {
       expect(await dlpManager.isHandler(rewardRouter.address)).to.be.true;
       expect(await dlpManager.isHandler(owner.address)).to.be.false;

       await expect(dlpManager.connect(user0).setHandler(owner.address,true)).to.be.reverted;
       await dlpManager.setHandler(owner.address,true);
       expect(await dlpManager.isHandler(owner.address)).to.be.true;
    });
    it("dlpManager.func => setHandler() => buyMLPWithETHV2()", async() => {
        await dlpManager.setHandler(rewardRouter.address, false);
        expect(await dlpManager.isHandler(rewardRouter.address)).to.be.false;
        await expect(buyMLPWithTokenV2(dai, parseEther("1000"), owner)).to.be.reverted;
        expect(await zkdlp.totalSupply()).to.be.eq(0);

        await dlpManager.setHandler(rewardRouter.address, true);
        await buyMLPWithTokenV2(dai, parseEther("1000"), owner);
        expect(await zkdlp.totalSupply()).to.be.eq(parseEther("1000"));
        expect(await zkdlp.balanceOf(owner.address)).to.be.eq(parseEther("1000"));
    });
    it("dlpManager.settings => setCooldownDuration()", async() => {
        expect(await dlpManager.cooldownDuration()).to.be.eq(0);
        await expect(dlpManager.connect(user0).setCooldownDuration(100)).to.be.reverted;
        await dlpManager.setCooldownDuration(100);
        expect(await dlpManager.cooldownDuration()).to.be.eq(100);

        await buyMLPWithETHV2(parseEther("200"), owner);
        await expect(sellMLPWithETHV2(parseEther("99100"), owner)).to.be.reverted;
        await forwardTime(86400);

        await sellMLPWithETHV2(parseEther("99100"), owner);
    });
    it("dlpManager.settings => setCooldownDuration() V2", async() => {
        expect(await dlpManager.cooldownDuration()).to.be.eq(0);
        await dlpManager.setCooldownDuration(3600 * 48);
        expect(await dlpManager.cooldownDuration()).to.be.eq(3600 * 48);

        await expect(dlpManager.setCooldownDuration(3600 * 49)).to.be.revertedWith("ZkdlpManager: invalid _cooldownDuration");
    });

    it("dlpManager.settings => setAumAdjustment()", async() => {
        expect(await dlpManager.aumAddition()).to.be.eq(0);
        expect(await dlpManager.aumDeduction()).to.be.eq(0);
        await expect(dlpManager.connect(user0).setAumAdjustment(100, 100)).to.be.reverted;
        await dlpManager.setAumAdjustment(100, 100);
        expect(await dlpManager.aumAddition()).to.be.eq(100);
        expect(await dlpManager.aumDeduction()).to.be.eq(100);
    });

    it("dlpManager.settings => setAumAdjustment() v2", async() => {
        await buyMLPWithETHV2(parseEther("1"), owner);
        console.log(`dlpManager.getAum() => ${formatUnits(await dlpManager.getAum(true,true),30)}`);

        await dlpManager.setAumAdjustment(parseUnits("1000",30), 100);
        console.log(`dlpManager.getAum() => ${formatUnits(await dlpManager.getAum(true,true),30)}`);

        await dlpManager.setAumAdjustment(0, parseUnits("3000",30));
        console.log(`dlpManager.getAum() => ${formatUnits(await dlpManager.getAum(true,true),30)}`);

        expect(await dlpManager.getAum(true,true)).to.be.eq(0);
        expect(await dlpManager.getAum(true,false)).to.be.eq(0);
        expect(await dlpManager.getAum(false,true)).to.be.eq(0);
        expect(await dlpManager.getAum(false,false)).to.be.eq(0);

        console.log(`dlpManager.getGlobalShortAveragePrice(weth.address) => 
            ${formatUnits(await dlpManager.getGlobalShortAveragePrice(weth.address),30)}`);
        console.log(`dlpManager.getGlobalShortAveragePrice(dai.address) =>
            ${formatUnits(await dlpManager.getGlobalShortAveragePrice(dai.address),30)}`);
        console.log(`dlpManager.getGlobalShortAveragePrice(wbtc.address) =>
            ${formatUnits(await dlpManager.getGlobalShortAveragePrice(wbtc.address),30)}`);
    });

    it("dlpManager.Parameters => v1", async () => {
        expect(await dlpManager.gov()).to.be.eq(owner.address);
        expect(await dlpManager.vault()).to.be.eq(vault.address);

        expect(await dlpManager.zkUsd()).to.be.eq(zkusd.address);
        expect(await dlpManager.zkdlp()).to.be.eq(zkdlp.address);
        expect(await dlpManager.shortsTracker()).to.be.eq(shortsTracker.address);

        expect(await dlpManager.inPrivateMode()).to.be.true;
        expect(await dlpManager.shortsTrackerAveragePriceWeight()).to.be.eq(10000);
    });

    it("dlpManager.Parameters => v1", async () => {
        expect(await dlpManager.lastAddedAt(owner.address)).to.be.eq(0);
        expect(await dlpManager.lastAddedAt(user0.address)).to.be.eq(0);
        expect(await dlpManager.lastAddedAt(user1.address)).to.be.eq(0);
        expect(await dlpManager.lastAddedAt(user2.address)).to.be.eq(0);

        expect(await dlpManager.isHandler(rewardRouter.address)).to.be.true;
        expect(await dlpManager.isHandler(owner.address)).to.be.false;
        expect(await dlpManager.cooldownDuration()).to.be.eq(0);
        expect(await dlpManager.aumAddition()).to.be.eq(0);
        expect(await dlpManager.aumDeduction()).to.be.eq(0);

        await buyMLPWithETHV2(parseEther("1"), owner);
        await buyMLPWithETHV2(parseEther("1"), user0);
        await buyMLPWithETHV2(parseEther("1"), user1);
        await buyMLPWithETHV2(parseEther("1"), user2);

        expect(await dlpManager.lastAddedAt(owner.address)).to.be.gt(0);
        expect(await dlpManager.lastAddedAt(user0.address)).to.be.gt(0);
        expect(await dlpManager.lastAddedAt(user1.address)).to.be.gt(0);
        expect(await dlpManager.lastAddedAt(user2.address)).to.be.gt(0);
    });
});
