import {forwardTime, setupFixture} from "../helpers/utils";
import {expect} from "chai";
import {FEED_ID_ETH_TEST} from "../helpers/constants";
import {parseUnits} from "ethers/lib/utils";
import {getCurrentTimestamp} from "hardhat/internal/hardhat-network/provider/utils/getCurrentTimestamp";
import {getNetworkCurrentTimestamp, getUpdateData, updateMarkPrice} from "../helpers/utilsForTest";

describe("VaultPriceFeed.test", async () => {

    let vault: any,
        owner: any,
        user0: any,
        weth: any,
        dai: any,
        vaultPriceFeed: any,
        pythContract: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        owner = fixture.owner;
        user0 = fixture.user0;
        weth = fixture.weth;
        dai = fixture.dai;
        vaultPriceFeed = fixture.vaultPriceFeed;
        pythContract = fixture.pythContract;
    })

    it("check get price", async () => {
        // revert not found
        // await expect(vaultPriceFeed.getPrice(weth.address, true, true)).to.be.revertedWith("PriceFeedNotFound()");
        // feed setup
        await vaultPriceFeed.setFeedIds([weth.address], [FEED_ID_ETH_TEST]);
        // update
        let {updateData, fee} = await getUpdateData(['weth'], ['1500'], ['1']);
        // revert insufficient fee
        // await expect(vaultPriceFeed.updatePriceFeeds(updateData)).to.be.revertedWith("InsufficientFee()");

        // update suc
        await vaultPriceFeed.updatePriceFeeds(updateData, {value: fee});
        // get price suc
        expect(await vaultPriceFeed.getPrice(weth.address, true, true,true)).to.be.equal(parseUnits("1501", 30));
        expect(await vaultPriceFeed.getPrice(weth.address, false, true,true)).to.be.equal(parseUnits("1500", 30));
        // forward time
        await forwardTime(50);
        // revert price too old
        await expect(vaultPriceFeed.getPrice(weth.address, true, true,true)).to.be.revertedWith("PriceFeed: price too old");

        // update dai
        await updateMarkPrice(['dai'], ['1.2'], ['0.1']);
        expect(await vaultPriceFeed.getPrice(dai.address, true, true,true)).to.be.equal(parseUnits("1.0", 30));
        expect(await vaultPriceFeed.getPrice(dai.address, false, true,true)).to.be.equal(parseUnits("1.0", 30));
    })
});

