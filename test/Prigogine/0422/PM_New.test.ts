import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("PM Test", async () => {
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
        feed: any,
        reader: any,
        vu: any;

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
        reader          = fixture.reader;
        vu              = fixture.VaultUtils;
    });
    async function buyZKUSDWithToken(token: any, amountIn: any, receiver: any) {
        await token.mint(vault.address, amountIn);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(token.address, receiver.address);
    }
    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
        ];
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await pm.connect(user).increasePosition(...params,updateData,{value: fee});
    };
    it("PM.func => gov()", async () => {
        expect(pm.address).to.not.eq(constants.AddressZero);
    });

    it("PM.func => increasePosition()", async () => {
        await buyZKUSDWithToken(weth,parseEther("100"), receiver);
        await longWETH_DAIAmountInV2(owner, parseEther("2000"),20000);
    });
});
