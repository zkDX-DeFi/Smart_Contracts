import {ApproveAmount, newWallet, setupFixture, toUsd} from "../helpers/utils";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {ethers} from "hardhat";
import {getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";

describe("Router", async () => {

    let vault: any,
        router: any,
        r: any,
        timelock: any,
        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        positionKeeper: any,
        positionManager: any,
        pm: any,
        wethPriceFeed: any,
        reader: any,
        zkdlp: any,
        zkdlpManager: any,
        mm: any,
        rewardRouter: any,
        vaultUtils: any

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
        pm = fixture.positionManager;
        wethPriceFeed = fixture.wethPriceFeed;
        reader = fixture.reader;
        zkdlp = fixture.zkdlp;
        zkdlpManager = fixture.zkdlpManager;
        mm = fixture.zkdlpManager;
        rewardRouter = fixture.rewardRouter;
        vaultUtils = fixture.vaultUtils;

        await router.addPlugin(positionManager.address)
        await timelock.setContractHandler(positionManager.address, true)
        await timelock.setShouldToggleIsLeverageEnabled(true)
    })
    it("r.func => setGov()", async () => {
        await r.setGov(constants.AddressZero);
        await expect(r.connect(user2).setGov(constants.AddressZero)).reverted;
    });

    it("r.func => addPlugin()", async () => {
        await r.addPlugin(pm.address);
        await expect(r.connect(user2).addPlugin(pm.address)).reverted;

        await r.removePlugin(pm.address);
        await expect(r.connect(user2).removePlugin(pm.address)).reverted;
    });

    it("r.func => pluginTransfer()", async () => {
        await r.addPlugin(pm.address);
        await r.addPlugin(owner.address);
        await r.addPlugin(user0.address);

        await dai.mint(user0.address, parseEther("100"));
        await dai.connect(user0).approve(user2.address, parseEther("1000000"));
        await dai.connect(user0).approve(r.address, parseEther("1000000"));

        await r.connect(user0).pluginTransfer(dai.address, user0.address, user2.address, 100);
    });

    it("r.func => pluginTransfer()", async () => {
        await r.addPlugin(user0.address);
        await dai.mint(user0.address, parseEther("100"));
        await dai.connect(user0).approve(r.address, parseEther("1000000"));
        await r.connect(user0).pluginTransfer(dai.address, user0.address, user2.address, 100);
    });

    it("r.func => pluginTransfer(owner,pm)", async () => {
        await dai.mint(owner.address, parseEther("100"));
        await dai.approve(r.address, parseEther("1000000"));
        await r.addPlugin(owner.address);
        await r.pluginTransfer(dai.address, owner.address, pm.address, 100);
    });

    it("check long position - Decrease", async () => {
        await weth.mint(vault.address, parseEther("30"));
        await updateMarkPrice(['weth']);
        await vault.buyZKUSD(weth.address, user1.address);
        await router.addPlugin(positionManager.address)
        await router.addPlugin(owner.address);
        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [[weth.address], weth.address, 0, toUsd(15000), true, toUsd(1500), updateData]
        // await positionManager.increasePositionETH(...params, {value: parseEther("1").add(fee)});
    });

    it("check swap, dai => weth", async () => {
        await weth.mint(vault.address, parseEther("1.1"));
        await updateMarkPrice(['weth']);
        await vault.buyZKUSD(weth.address, owner.address);
        let feeBefore = await vault.feeReserves(weth.address);

        await dai.mint(user0.address, parseEther("1500"));
        await dai.connect(user0).approve(router.address, ApproveAmount);
        let receiver = newWallet();
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        await router.connect(user0).swap([dai.address, weth.address], parseEther("1500"), 0,
            receiver.address, updateData, {value: fee});

        expect(await weth.balanceOf(receiver.address)).to.eq(parseEther("1"));
        expect(await vault.feeReserves(weth.address)).to.eq(parseEther("0").add(feeBefore));
    });

    it("check swapETHToTokens, eth => dai", async () => {
        await dai.mint(vault.address, parseEther("1600"));
        await updateMarkPrice(['dai']);
        await vault.buyZKUSD(dai.address, owner.address);
        let feeBefore = await vault.feeReserves(dai.address);

        let receiver = newWallet();
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        await router.connect(user0).swapETHToTokens([weth.address, dai.address], 0, receiver.address,
            updateData, {value: parseEther("1").add(fee)});

        expect(await dai.balanceOf(receiver.address)).to.eq(parseEther("1500"));
        expect(await vault.feeReserves(dai.address)).to.eq(parseEther("0").add(feeBefore));
    });

    it("check swapTokensToETH, dai => eth", async () => {
        await weth.mint(vault.address, parseEther("1.1"));
        await updateMarkPrice(['weth']);
        await vault.buyZKUSD(weth.address, owner.address);
        let feeBefore = await vault.feeReserves(weth.address);

        await dai.mint(user0.address, parseEther("1500"));
        await dai.connect(user0).approve(router.address, ApproveAmount);

        let receiver = newWallet();
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        await router.connect(user0).swapTokensToETH([dai.address, weth.address], parseEther("1500"), 0,
            receiver.address, updateData, {value: fee});

        expect(await ethers.provider.getBalance(receiver.address)).to.eq(parseEther("1"));
        expect(await vault.feeReserves(weth.address)).to.eq(parseEther("0").add(feeBefore));
    });

    it("check swap under buffer amounts", async () => {
        await timelock.setBufferAmounts(vault.address, [weth.address], [parseEther("1")]);
        await weth.mint(vault.address, parseEther("2"));
        await updateMarkPrice(['weth']);
        await vault.buyZKUSD(weth.address, owner.address);

        await dai.mint(user0.address, parseEther("1501"));
        await dai.connect(user0).approve(router.address, ApproveAmount);

        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        await expect(router.connect(user0).swap([dai.address, weth.address], parseEther("1501"), 0,
            user0.address, updateData, {value: fee})).to.be.revertedWith("Vault: poolAmount < buffer");
    });

});
