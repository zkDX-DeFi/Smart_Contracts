import {ApproveAmount, newWallet, setupFixture, toUsd} from "../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants, Wallet} from "ethers";
import {ethers} from "hardhat";
import {getUsdcConfig, getWethConfig} from "../helpers/params";
import {getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";

describe("ZKDLP", async () => {

    let vault: any,
        router: any,
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
        reader: any,
        zkdlp: any,
        zkdlpManager: any,
        mm: any,
        rewardRouter: any,
        vaultUtils: any,
        wnative: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        timelock = fixture.timelock;
        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = fixture.dai;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        positionKeeper = fixture.positionKeeper;
        positionManager = fixture.positionManager;
        reader = fixture.reader;
        zkdlp = fixture.zkdlp;
        zkdlpManager = fixture.zkdlpManager;
        mm = fixture.zkdlpManager;
        rewardRouter = fixture.rewardRouter;
        vaultUtils = fixture.vaultUtils;
        wnative = fixture.wnative;

        await router.addPlugin(positionManager.address)
        await timelock.setContractHandler(positionManager.address, true)
        await timelock.setShouldToggleIsLeverageEnabled(true)
    })

    it("check mint exceed max revert", async () => {

        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let ethAmountIn = parseEther("1").add(fee);
        await rewardRouter.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: ethAmountIn});
        expect(await zkdlp.balanceOf(user0.address)).to.eq(parseEther("1500"));

        let config = getWethConfig(weth);
        config[4] = parseEther("2000"); // _maxUsdmAmount
        await timelock.setTokenConfig(vault.address, ...config);

        ({updateData} = await getUpdateData(['weth', 'dai', 'wbtc']));
        await expect(rewardRouter.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: parseEther("0.5")}))
            .to.be.revertedWith("Vault: max ZKUSD exceeded'");
    });

    it("check mint & redeem zkdlp with ether", async () => {

        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let ethAmountIn = parseEther("1").add(fee);
        await rewardRouter.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: ethAmountIn});
        expect(await zkdlp.balanceOf(user0.address)).to.eq(parseEther("1500"));

        let receiver = newWallet();
        ({updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']));
        await rewardRouter.connect(user0).unstakeAndRedeemZkdlpETH(parseEther("1495.5"), 0, receiver.address, updateData, {value: fee});
        let balance = await ethers.provider.getBalance(receiver.address);
        expect(balance).to.eq(parseEther("0.997"));
    });

    it("check mint & redeem zkdlp with token", async () => {

        let daiAmountIn = parseEther("1500");
        await dai.mint(user0.address, daiAmountIn);
        await dai.connect(user0).approve(zkdlpManager.address, ApproveAmount);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(user0).mintAndStakeZkdlp(dai.address, daiAmountIn, 0, 0, updateData, {value: fee});
        expect(await zkdlp.balanceOf(user0.address)).to.eq(parseEther("1500"));

        let receiver = newWallet();
        ({updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']));
        await rewardRouter.connect(user0).unstakeAndRedeemZkdlp(dai.address, parseEther("1495.5"), 0, receiver.address, updateData, {value: fee});
        let balance = await dai.balanceOf(receiver.address);
        expect(balance).to.eq(parseEther("1495.5"));
    })

    it("check get price & get aums", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let ethAmountIn = parseEther("1");
        await rewardRouter.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: ethAmountIn.add(fee)});

        await updateMarkPrice(['weth'], ['1499'], ['1']);
        expect(await zkdlpManager.getPrice(true)).to.eq(parseUnits("1", 30));
        expect(await zkdlpManager.getPrice(false)).to.lt(parseUnits("1", 30));
        let aums = await zkdlpManager.getAums();
        expect(aums[0]).to.eq(parseUnits("1500", 30));
        expect(aums[1]).to.lt(parseUnits("1500", 30));
    });

    it("check buy zkdlp and open position", async () => {

        expect(await zkdlpManager.getPrice(true)).to.eq(parseUnits("1", 30));

        // buy zkdlp, add liquidity
        expect(await vault.poolAmounts(weth.address)).to.eq(0);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let ethAmountIn = parseEther("100");
        await rewardRouter.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: ethAmountIn.add(fee)});
        expect(await zkdlp.balanceOf(user0.address)).to.eq(parseEther("150000"));

        let feeBasisPoints = await vaultUtils.getBuyZkusdFeeBasisPoints(weth.address, parseEther("150000"));
        let buyFee = ethAmountIn.mul(feeBasisPoints).div(10000); // 0.997
        expect(await vault.poolAmounts(weth.address)).to.eq(ethAmountIn.sub(buyFee));

        // open long position
        ({updateData, fee} = await getUpdateData(['weth']));
        let params = [
            [weth.address], // _path
            weth.address, // _indexToken
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]
        // await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
        // let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
        //
        // check position
        // let position = await vault.positions(key);
        // await expect(await position.size).to.eq(parseUnits("15000", 30));
        // await expect(await position.collateral).to.eq(parseUnits("1485", 30));
        //
        // expect(await zkdlpManager.getPrice(true)).to.eq(parseUnits("1", 30));
        //
        // await updateMarkPrice(['weth'], ['1499']);
        // expect(await zkdlpManager.getPrice(true)).to.lt(parseUnits("1", 30));
        // await updateMarkPrice(['weth'], ['1501']);
        // expect(await zkdlpManager.getPrice(true)).to.gt(parseUnits("1", 30));
    })

    it("check guaranteedUsd hedge long positions' PnL in AUM", async () => {
        expect(await zkdlpManager.getPrice(true)).to.eq(parseUnits("1", 30));

        // buy zkdlp, add liquidity
        expect(await vault.poolAmounts(weth.address)).to.eq(0);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let ethAmountIn = parseEther("100");
        await rewardRouter.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: ethAmountIn.add(fee)});
        expect(await zkdlp.balanceOf(user0.address)).to.eq(parseEther("150000"));

        let feeBasisPoints = await vaultUtils.getBuyZkusdFeeBasisPoints(weth.address, parseEther("150000"));
        let buyFee = ethAmountIn.mul(feeBasisPoints).div(10000); // 0.997
        expect(await vault.poolAmounts(weth.address)).to.eq(ethAmountIn.sub(buyFee));

        await updateMarkPrice(['weth', 'dai', 'wbtc']);
        expect(await zkdlpManager.getAum(true, true)).to.eq(toUsd(150000)); // 99.7 * 1500
        let price1 = await zkdlpManager.getPrice(true);
        expect(price1).to.eq(toUsd(1));

        // open long position
        ({updateData, fee} = await getUpdateData(['weth']));
        let params = [
            [weth.address], // _path
            weth.address, // _indexToken
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]
        // await positionManager.connect(user0).increasePositionETH(...params, {value: parseEther("1").add(fee)});
        //
        // bring up price
        // await updateMarkPrice(['weth'], ['2000']);
        // let aum = await zkdlpManager.getAum(true, true);
        // let poolAmount = await vault.poolAmounts(weth.address);
        // let reservedAmount = await vault.reservedAmounts(weth.address);
        // let guaranteedAmount = await vault.guaranteedUsd(weth.address);
        //
        // expect(aum).to.eq((poolAmount.sub(reservedAmount).mul(parseUnits("2000", 12)).add(guaranteedAmount)));
        // expect(await zkdlpManager.getPrice(true)).to.gt(price1);
    })

//    Added by Prigogine@20230307
    it("RewardRouterV2.func => mintAndStakeZkdlpETH()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let ethAmountIn = parseEther("1").add(fee);
        await rewardRouter.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: ethAmountIn});
    });

    //    Added by Prigogine@20230308
    it("ZkdlpManager.func => setInPrivateMode()", async () => {
        await mm.setInPrivateMode(true);
        await expect(mm.connect(user2).setInPrivateMode(true)).to.be.reverted;

        await mm.setShortsTrackerAveragePriceWeight(0);
        await expect(mm.connect(user2).setShortsTrackerAveragePriceWeight(0)).to.be.reverted;

        await mm.setHandler(constants.AddressZero, true);
        await expect(mm.connect(user2).setHandler(constants.AddressZero, true)).to.be.reverted;

        await mm.setCooldownDuration(0);
        await expect(mm.connect(user2).setCooldownDuration(0)).reverted;

        await mm.setAumAdjustment(0, 0);
        await expect(mm.connect(user2).setAumAdjustment(0, 0)).reverted;
    });

    // it("ZkdlpManager.func => addLiquidity(weth)", async () => {
    //     await weth.mint(owner.address, parseEther("1"));
    //     await weth.approve(mm.address, parseEther("1000000"));
    //     await expect(mm.addLiquidity(weth.address, 100, 1, 1)).to.be.revertedWith("ZkdlpManager: action not enabled");
    //     await updateMarkPrice(['weth', 'dai', 'wbtc']);
    //     await mm.setInPrivateMode(false);
    //     await mm.addLiquidity(weth.address, 100, 1, 1);
    // });
    //
    // it("ZkdlpManager.func => addLiquidity(dai)", async () => {
    //     await dai.mint(owner.address, parseEther("100"));
    //     await dai.approve(mm.address, parseEther("1000000"));
    //     await expect(mm.addLiquidity(dai.address, 100, 1, 1)).to.be.revertedWith("ZkdlpManager: action not enabled");
    //
    //     await mm.setHandler(owner.address, true);
    //     await expect(mm.addLiquidityForAccount(owner.address, owner.address, dai.address, 100, 1, 1))
    //         .to.be.revertedWith("PriceFeedNotFound()");
    // });

    // it("ZkdlpManager.func => removeLiquidity(dai)", async () => {
    //     await dai.mint(owner.address, parseEther("100"));
    //     await dai.approve(mm.address, parseEther("1000000"));
    //     await expect(mm.addLiquidity(dai.address, parseEther("1"), 1, 1)).to.be.revertedWith("ZkdlpManager: action not enabled");
    //     await mm.setCooldownDuration(0);
    //     await mm.setHandler(owner.address, true);
    //
    //     await expect(mm.removeLiquidity(dai.address, 100, 1, owner.address)).to.be.revertedWith("ZkdlpManager: action not enabled");
    //     await expect(mm.removeLiquidityForAccount(owner.address, dai.address, 100, 1, owner.address)).to.be.revertedWith("PriceFeedNotFound()");
    // });

    it("ZkdlpManager.func => removeLiquidity(dai) 2", async () => {
        // console.log(`mm.getAums: ${await mm.getAums()}`);

        await updateMarkPrice(['weth', 'dai', 'wbtc']);
        console.log(`mm.getAumInZkusd: ${await mm.getAumInZkusd(true)}`);
        console.log(`mm.getAumInZkusd: ${await mm.getAumInZkusd(false)}`);

        console.log(`mm.getAum: ${await mm.getAum(true, true)}`);
        console.log(`mm.getAum: ${await mm.getAum(false, true)}`);

        console.log(`mm.getGlobalShortAveragePrice: ${await mm.getGlobalShortAveragePrice(dai.address)}`);
        console.log(`mm.getGlobalShortAveragePrice: ${await mm.getGlobalShortAveragePrice(weth.address)}`);

    });
});

