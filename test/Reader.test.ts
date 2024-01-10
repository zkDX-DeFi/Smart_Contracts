import {forwardTime, setupFixture, toUsd} from "../helpers/utils";
import {formatEther, parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";

describe("Readers", async () => {

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
        reader: any

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

    })

    it("check getVaultTokenInfo", async () => {

        await weth.mint(vault.address, parseEther("30"));
        await updateMarkPrice(['weth'])
        await vault.buyZKUSD(weth.address, user1.address);
        await timelock.setMinProfitTime(vault.address, 600);

        let tokens = [weth.address];
        let tokenInfos = await reader.getVaultTokenInfo(vault.address, positionManager.address, weth.address, tokens);

        expect(tokenInfos[0]).to.eq(parseEther("30"));
        // for (let i = 0; i < tokenInfos.length; i++)
            // console.log("info-" + i + ":", formatEther(tokenInfos[i]));
    })

    it("check getFundingRates", async () => {

        await weth.mint(vault.address, parseEther("100"));
        await updateMarkPrice(['weth']);
        await vault.buyZKUSD(weth.address, user1.address);
        await dai.mint(vault.address, parseEther("50000"));
        await updateMarkPrice(['dai']);
        await vault.buyZKUSD(dai.address, user1.address);
        await timelock.setFundingRate(vault.address, 60, 1000, 1000);

        // open
        let {updateData, fee} = await getUpdateData(['weth']);
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

        // await forwardTime(600);
        // await vault.updateCumulativeFundingRate(weth.address, weth.address);
        // await vault.updateCumulativeFundingRate(weth.address, weth.address);

        // let _collateralTokens = [weth.address, dai.address];
        // const rates = await reader.getFundingRates(vault.address, weth.address, _collateralTokens);
        // for (let i = 0; i < rates.length; i++)
        //     console.log("rate-" + i + ":", rates[i].toNumber());
    })
});

