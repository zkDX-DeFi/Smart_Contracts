import {ApproveAmount, newWallet, setupFixture, toUsd} from "../helpers/utils";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {minLiquidationFee} from "../helpers/params";
import {ethers} from "hardhat";
import {getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";


describe("PositionManager_equity", async () => {

    let vault: any,
        vaultPriceFeed: any,
        router: any,
        timelock: any,
        weth: any,
        wbtc: any,
        dai: any,
        tsla: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        positionKeeper: any,
        positionManager: any,
        pm: any,
        reader: any,
        v: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        vaultPriceFeed = fixture.vaultPriceFeed;
        router = fixture.router;
        timelock = fixture.timelock;
        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = fixture.dai;
        tsla = fixture.tsla;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        positionKeeper = fixture.positionKeeper;
        positionManager = fixture.positionManager;
        pm = fixture.positionManager;
        reader = fixture.reader;
        v = fixture.vault;

        await weth.mint(vault.address, parseEther("100"));
        await dai.mint(vault.address, parseEther("200000"));
        await wbtc.mint(vault.address, parseUnits("10", 8));
        await tsla.mint(vault.address, parseEther("1000"));

        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(weth.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(dai.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(wbtc.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(tsla.address, user1.address);
    })

    it("check long position tsla", async () => {
        // open
        let amount = parseEther("3000");
        await dai.mint(user0.address, amount);
        await dai.connect(user0).approve(router.address, amount);

        let {updateData, fee} = await getUpdateData(['tsla']);
        let params = [
            [dai.address, tsla.address], // _path
            tsla.address, // _indexToken
            amount, // _collateral
            0, // _minOut
            toUsd(16000), // _sizeDelta
            true, // _isLong
            toUsd(160), // _acceptablePrice
            updateData
        ]
        await positionManager.connect(user0).increasePosition(...params, {value: parseEther("1").add(fee)});
        let key = await vault.getPositionKey(user0.address, tsla.address, tsla.address, true);

        // check position
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("16000", 30));
        await expect(await position.averagePrice).to.eq(parseUnits("160", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("100"));
    })

    it("check short position tsla", async () => {
        // open
        await timelock.setAllowStableEquity(vault.address, false);
        let {updateData, fee} = await getUpdateData(['tsla', 'dai']);

        let daiAmountIn = parseEther("1600");
        let params = [
            [dai.address], // _path
            tsla.address, // _indexTokends
            daiAmountIn,
            0, // _minOut
            toUsd(16000), // _sizeDelta
            false, // _isLong
            toUsd(160), // _acceptablePrice
            updateData
        ]

        await dai.mint(user0.address, daiAmountIn);
        await dai.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, dai.address, tsla.address, false);
        let position = await vault.positions(key);

        await expect(await position.size).to.eq(parseUnits("16000", 30));
        await expect(await position.averagePrice).to.eq(parseUnits("160", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("16000"));
    });

    // it("check open position pre charge", async () => {
    //
    //     await positionManager.setMinLiquidationFee(minLiquidationFee);
    //     let daiAmountIn = parseEther("1500");
    //     await dai.mint(user0.address, parseEther("5000"));
    //     await dai.connect(user0).approve(router.address, ApproveAmount);
    //
    //     let {updateData, fee} = await getUpdateData(['weth', 'dai']);
    //
    //     let params = [
    //         [dai.address, weth.address], // _path
    //         weth.address, // _indexTokends
    //         daiAmountIn,
    //         0, // _minOut
    //         toUsd(15000), // _sizeDelta
    //         true, // _isLong
    //         toUsd(1500), // _acceptablePrice
    //         updateData
    //     ]
    //     await expect(positionManager.connect(user0).increasePosition(...params, {value: fee})).to.be.revertedWith("PositionManager: insufficient fee");
    //     await positionManager.connect(user0).increasePosition(...params, {value: fee.add(minLiquidationFee)});
    //     await positionManager.connect(user0).increasePosition(...params, {value: fee});
    //
    //     let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
    //     let position = await vault.positions(key);
    //
    //     expect(await position.size).to.eq(parseUnits("30000", 30));
    //     expect(await positionManager.liquidationFees(key)).to.eq(minLiquidationFee);
    //
    //     await positionManager.setLiquidator(user1.address, true);
    //     await updateMarkPrice(['weth'], ['1300']);
    //     let receiver = newWallet();
    //     await positionManager.connect(user1).liquidatePosition(user0.address, weth.address, weth.address, true, receiver.address, []);
    //     //
    //     // position = await vault.positions(key);
    //     // expect(await position.size).to.eq(0);
    //     // expect(await positionManager.liquidationFees(key)).to.eq(0);
    //     // expect(await ethers.provider.getBalance(receiver.address)).to.eq(minLiquidationFee);
    // });
});

