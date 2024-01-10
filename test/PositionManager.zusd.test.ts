import {ApproveAmount, setupFixture, toUsd} from "../helpers/utils";
import {formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {DEFAULT_WITHIN, MAX_WITHIN} from "../helpers/constants";
import {ethers} from "hardhat";
import {getLiqPrice, getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";
import {Token} from "../typechain";
import {deployContract} from "../helpers/utils2";

describe("PositionManager.zusd", async () => {

    let vault: any,
        router: any,
        weth: any,
        wbtc: any,
        dai: any,
        user0: any,
        user1: any,
        positionManager: any,
        vaultPriceFeed: any,
        timelock: any,
        zusd: any,
        zusdPool: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = await ethers.getContract<Token>("DAI");
        user0 = fixture.user0;
        user1 = fixture.user1;
        positionManager = fixture.positionManager;
        vaultPriceFeed = fixture.vaultPriceFeed;
        timelock = fixture.timelock;
        zusd = fixture.zusd;
        zusdPool = fixture.zusdPool;

        await weth.mint(vault.address, parseEther("100"));
        await wbtc.mint(vault.address, parseUnits("10", 8));
        await zusd.mint(vault.address, parseEther("200000"));

        await updateMarkPrice(['weth', 'wbtc']);
        await vault.buyZKUSD(weth.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc']);
        await vault.buyZKUSD(wbtc.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc']);
        await vault.buyZKUSD(zusd.address, user1.address);
    })

    async function exchange(signer, amount) {
        await dai.mint(signer.address, amount);
        await dai.connect(signer).approve(zusdPool.address, ApproveAmount);
        await zusdPool.connect(signer).exchange(dai.address, amount);
    }

    it("check exchange and redeem", async () => {

        let amountIn = parseEther("10000");
        await dai.mint(user0.address, amountIn);
        await dai.connect(user0).approve(zusdPool.address, ApproveAmount);

        await zusdPool.connect(user0).exchange(dai.address, amountIn);
        expect(await dai.balanceOf(zusdPool.address)).to.eq(amountIn);
        expect(await zusd.balanceOf(user0.address)).to.eq(parseEther("10000"));

        await zusdPool.connect(user0).redeem(dai.address, parseEther("9900"));
        expect(await dai.balanceOf(zusdPool.address)).to.eq(parseEther("100"));
        expect(await zusd.balanceOf(user0.address)).to.eq(parseEther("100"));

        await zusdPool.transfer(dai.address, user1.address, parseEther("100"));
        expect(await dai.balanceOf(zusdPool.address)).to.eq(0);
        expect(await dai.balanceOf(user1.address)).to.eq(parseEther("100"));
    });

    it("check exchange and redeem - decimal 6", async () => {

        let usdc = await deployContract("Token", ["USDC", 6, parseEther("10000"), parseEther("100"), 0])
        await zusdPool.setWhitelistToken(usdc.address, true);

        let amountIn = parseUnits("10000", 6);
        await usdc.mint(user0.address, amountIn);
        await usdc.connect(user0).approve(zusdPool.address, ApproveAmount);

        await zusdPool.connect(user0).exchange(usdc.address, amountIn);
        expect(await usdc.balanceOf(zusdPool.address)).to.eq(amountIn);
        expect(await zusd.balanceOf(user0.address)).to.eq(parseEther("10000"));

        await zusdPool.connect(user0).redeem(usdc.address, parseEther("9900"));
        expect(await usdc.balanceOf(zusdPool.address)).to.eq(parseUnits("100", 6));
        expect(await zusd.balanceOf(user0.address)).to.eq(parseEther("100"));
    });

    it("check redeem exceed", async () => {

        let usdc = await deployContract("Token", ["USDC", 6, parseEther("10000"), parseEther("100"), 0])
        await zusdPool.setWhitelistToken(usdc.address, true);

        let amountIn = parseUnits("10000", 6);
        await usdc.mint(user0.address, amountIn);
        await usdc.connect(user0).approve(zusdPool.address, ApproveAmount);

        await zusdPool.connect(user0).exchange(usdc.address, amountIn);
        expect(await usdc.balanceOf(zusdPool.address)).to.eq(amountIn);
        expect(await zusd.balanceOf(user0.address)).to.eq(parseEther("10000"));

        await zusd.mint(user0.address, parseEther("1000"));
        await usdc.mint(zusdPool.address, parseUnits("1000", 6));
        await zusdPool.connect(user0).redeem(usdc.address, parseEther("11000"));
    });

    it("check long position - Open", async () => {

        // exchange
        let amountIn = parseEther("1500")
        await exchange(user0, amountIn);

        // open
        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            [zusd.address, weth.address], // _path
            weth.address, // _indexToken
            amountIn,
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]
        await zusd.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);

        // check position
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("15000", 30));
        await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
        await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("10"));
    })

    it("check long position - Close with profit", async () => {

        // exchange
        let amountIn = parseEther("1500")
        await exchange(user0, amountIn);

        // open
        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            [zusd.address, weth.address], // _path
            weth.address, // _indexToken
            amountIn,
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]

        await zusd.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("15000", 30));
        await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
        await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("10"));

        // price up
        ({updateData, fee} = await getUpdateData(['weth'], ['1600']))

        // close all
        let paramsDe = [
            [weth.address, zusd.address], // _path
            weth.address, // _indexToken
            toUsd(0), // _collateralDelta
            toUsd(15000), // _sizeDelta
            true, // _isLong
            user0.address,  // _receiver
            toUsd(1550),  // _price
            toUsd(0), // _minOut
            false, // _withdrawETH
            updateData
        ]
        await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
        let profit = (1600 - 1500) / 1500 * 15000;
        expect(await zusd.balanceOf(user0.address)).to.eq(amountIn.add(parseEther(profit.toString())).sub(parseEther("30")));
        expect(formatUnits(await vault.tokenPnl(weth.address), 30)).to.eq("1000.0");

        // expect user position deleted
        position = await vault.positions(key);
        await expect(await position.size).to.eq(0);
        await expect(await position.collateral).to.eq(0);
    })

    it("check long position - Close with loss", async () => {

        // exchange
        let amountIn = parseEther("1500")
        await exchange(user0, amountIn);

        // open
        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            [zusd.address, weth.address], // _path
            weth.address, // _indexToken
            amountIn,
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]

        await zusd.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("15000", 30));
        await expect(await position.collateral).to.eq(parseUnits("1485", 30)); // - 0.1% positionFee
        await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("10"));

        // close all
        ({updateData, fee} = await getUpdateData(['weth'], ['1400']));
        let paramsDe = [
            [weth.address, zusd.address], // _path
            weth.address, // _indexToken
            toUsd(0), // _collateralDelta
            toUsd(15000), // _sizeDelta
            true, // _isLong
            user0.address,  // _receiver
            toUsd(1400),  // _price
            toUsd(0), // _minOut
            false, // _withdrawETH
            updateData
        ]
        await positionManager.connect(user0).decreasePosition(...paramsDe, {value: fee});
        let loss = (1500 - 1400) / 1500 * 15000;
        expect(await zusd.balanceOf(user0.address)).to.be
            .closeTo(amountIn.sub(parseEther(loss.toString())).sub(parseEther("30")), DEFAULT_WITHIN);
        expect(formatUnits(await vault.tokenPnl(weth.address), 30)).to.eq("-1000.0");

        // expect user position deleted
        position = await vault.positions(key);
        await expect(await position.size).to.eq(0);
        await expect(await position.collateral).to.eq(0);
    })

    it("check long position - Liquidate", async () => {

        // exchange
        let amountIn = parseEther("1500")
        await exchange(user0, amountIn);

        // open
        let {updateData, fee} = await getUpdateData(['weth']);
        let params = [
            [zusd.address, weth.address], // _path
            weth.address, // _indexToken
            amountIn,
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ]
        await zusd.connect(user0).approve(router.address, ApproveAmount);
        await positionManager.connect(user0).increasePosition(...params, {value: fee});
        let key = await vault.getPositionKey(user0.address, weth.address, weth.address, true);
        let position = await vault.positions(key);
        await expect(await position.size).to.eq(parseUnits("15000", 30));
        await expect(await position.collateral).to.eq(parseUnits("1485", 30));
        await expect(await position.averagePrice).to.eq(parseUnits("1500", 30));
        await expect(await position.reserveAmount).to.eq(parseEther("10"));

        let cumulativeFundingRate = await vault.cumulativeFundingRates(weth.address);
        let liqPrice = getLiqPrice(position, cumulativeFundingRate, true);

        // liquidate
        await positionManager.setLiquidator(user1.address, true);
        let changePrice = liqPrice.sub(parseUnits("0.1", 30));
        // console.log("liqPrice:", formatUnits(changePrice, 30));
        await updateMarkPrice(['weth'], [formatUnits(changePrice, 30)]);
        await positionManager.connect(user1).liquidatePosition(user0.address, weth.address, weth.address, true, user1.address, []);

        // sendBack $ = 1485 - (1500-1366.4) / 1500 * 15000 - 15 = 134
        expect(await zusd.balanceOf(user0.address)).to.be.closeTo(parseEther("134"), MAX_WITHIN);

        // expect user position deleted
        position = await vault.positions(key);
        await expect(await position.size).to.eq(0);
        await expect(await position.collateral).to.eq(0);
    })

});

