import {
    ApproveAmount,
    forwardTime,
    setupFixture, toUsd
} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, keccak256, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants, utils} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {toASCII} from "punycode";

import Web3 from 'web3';
import {printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("BPM -> BasePositionManager test", async () => {
    let vault: any,
        router: any,
        pm: any,
        shortsTracker: any,

        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        feeTo: any,
        user1: any,
        user2: any,
        miner: any,
        user0: any,
        receiver: any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v: any,
        dlpManager: any,
        zkdx: any,
        feed: any,
        pms: any,
        vaultUtils: any,
        vaultErrorController: any,
        vu: any,
        dlp: any,
        reader: any,
        t: any,
        tsla: any,
        ss: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        pm = fixture.positionManager;
        shortsTracker = fixture.shortsTracker;

        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = fixture.dai;
        owner = fixture.owner;
        feeTo = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        miner = fixture.miner;
        feeTo = fixture.feeTo;
        receiver = fixture.receiver;

        zkdlp = fixture.zkdlp;
        timelock = fixture.timelock;
        rewardRouter = fixture.rewardRouter;
        zkusd = fixture.ZKUSD;
        v = fixture.vault;
        dlpManager = fixture.zkdlpManager;
        zkdx = fixture.ZKDX;
        feed = fixture.vaultPriceFeed;
        pms = pm;

        vaultUtils = fixture.VaultUtils;
        vaultErrorController = fixture.vaultErrorController;
        vu = fixture.VaultUtils;
        dlp = fixture.zkdlp;
        reader = fixture.reader;
        t = timelock;
        tsla = fixture.tsla;
        ss = shortsTracker;
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
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn, 0, addressIn.address, updateData2, {value: fee2});
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

    async function OP_BASE_MLP() {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        await buyMLPWithTokenV2(weth, parseEther("100"), feeTo);
        await buyMLPWithTokenV2(wbtc, parseUnits("10", 8), user1);
        await buyMLPWithTokenV2(dai, parseEther("123456"), user2);

        await sellMLPWithTokenV2(parseEther("99100"), weth, owner);
        await sellMLPWithTokenV2(parseEther("49550"), weth, feeTo);
        await sellMLPWithTokenV2(parseEther("79160"), wbtc, user1);
        await sellMLPWithTokenV2(parseEther("23085"), dai, user2);

        await buyMLPWithETHV2(parseEther("200"), owner);
        await sellMLPWithETHV2(parseEther("99100"), owner);
        /* added for new TSLA TEST*/
        await buyMLPWithTokenV2(tsla, parseEther("100"), feeTo);
        await sellMLPWithTokenV2(parseEther("100"), tsla, feeTo);
    }

    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
            updateData
        ];
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await pm.connect(user).increasePosition(...params, {value: fee});
    };

    async function closePositionV2(user: any, _usdAmountOut: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let paramsDe = [
            [weth.address, dai.address],
            weth.address,
            toUsd(_usdAmountOut),
            toUsd(_sizeDelta),
            true,
            user.address,
            toUsd(1500),
            toUsd(0),
            false,
            updateData];
        await pm.connect(user).decreasePosition(...paramsDe, {value: fee});
    }

    async function shortWETH_DAIAmountInV2(user: any, _daiAmountIn: any, _sizeDelta: any) {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let params = [
            [dai.address], // _path
            weth.address, // _indexTokens
            _daiAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            false, // _isLong
            toUsd(1499.000001), // _acceptablePrice
            updateData
        ];
        await dai.mint(user.address, _daiAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await pm.connect(user).increasePosition(...params, {value: fee});
    };

    async function longOperationA() {
        await buyMLPWithETHV2(parseEther("20"), owner);
        await longWETH_DAIAmountInV2(owner, parseEther("800"), 1400);
    }

    async function shortOperationA() {
        await buyMLPWithTokenV2(dai, parseEther("20000"), owner);
        await shortWETH_DAIAmountInV2(owner, parseEther("100"), 1400);
    }

    async function OP_BASE_LONG_SHORT() {
        await longOperationA();
        await shortOperationA();
        await closePositionV2(owner, 300, 400);
    }

    async function longOperationTwice() {
        await longOperationA();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
    }

    it("bpm.Paramter => vault", async () => {
        expect(pm.address).to.not.eq(constants.AddressZero);
        expect(await dai.balanceOf(pm.address)).to.eq(0);
        expect(await weth.balanceOf(pm.address)).to.eq(0);
        expect(await wbtc.balanceOf(pm.address)).to.eq(0);
        expect(await tsla.balanceOf(pm.address)).to.eq(0);

        await longOperationTwice();
        expect(await dai.balanceOf(pm.address)).to.eq(0);
        expect(await weth.balanceOf(pm.address)).to.closeTo(parseEther("0.00033233"), MAX_WITHIN);
        expect(await wbtc.balanceOf(pm.address)).to.eq(0);
        expect(await tsla.balanceOf(pm.address)).to.eq(0);

        await longWETH_DAIAmountInV2(owner, parseEther("10000"), 10000);
        expect(await dai.balanceOf(pm.address)).to.eq(0);
        expect(await weth.balanceOf(pm.address)).to.closeTo(parseEther("0.0335656"), MAX_WITHIN);
        expect(await wbtc.balanceOf(pm.address)).to.eq(0);
        expect(await tsla.balanceOf(pm.address)).to.eq(0);
    });
    it("bpm.Paramter => withdrawFees", async () => {
        expect(await pm.admin()).to.be.eq(owner.address);
        expect(await pm.gov()).to.be.eq(owner.address);
        await longOperationTwice();
        await longWETH_DAIAmountInV2(owner, parseEther("10000"), 10000);

        await expect(pm.connect(feeTo).withdrawFees(weth.address, feeTo.address))
            .to.be.revertedWith(ErrorsV2.BASEPOSITIONMANAGER_FORBIDDEN); //! admin
        expect(await pm.feeReserves(weth.address)).to.be.gt(0);
        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await pm.feeReserves(tsla.address)).to.be.eq(0);


        expect(await weth.balanceOf(feeTo.address)).to.be.eq(0);
        await pm.withdrawFees(weth.address, feeTo.address);
        expect(await weth.balanceOf(feeTo.address)).to.closeTo(parseEther("0.0335656"), MAX_WITHIN);
        expect(await dai.balanceOf(feeTo.address)).to.eq(0);
        expect(await wbtc.balanceOf(feeTo.address)).to.eq(0);
        expect(await tsla.balanceOf(feeTo.address)).to.eq(0);

        expect(await pm.feeReserves(weth.address)).to.be.eq(0);
        expect(await pm.feeReserves(dai.address)).to.be.eq(0);
        expect(await pm.feeReserves(wbtc.address)).to.be.eq(0);
        expect(await pm.feeReserves(tsla.address)).to.be.eq(0);
    });
    it("bpm.func => approve()", async () => {
        await expect(pm.connect(user0).approve(weth.address, router.address, ApproveAmount)).to.be.reverted;
        await pm.approve(weth.address, router.address, ApproveAmount);
    });
    it("bpm.func => sendValue()", async () => {
        await expect(pm.connect(user0).sendValue(feeTo.address, parseEther("1"))).to.be.reverted;

        async function sendETH(_from: any, _to: any, _value: any) {
            console.log(`Account balance:, ${formatEther(await _from.getBalance())}`);
            const tx = await _from.sendTransaction({
                to: _to.address,
                value: _value,
            });
            await tx.wait();
            console.log(`Account balance:, ${formatEther(await _from.getBalance())}`);
        }
        await sendETH(owner, feeTo, parseEther("1"));

        await weth.mint(owner.address, parseEther("1000"));
        await weth.transfer(pm.address, parseEther("1000"));
    });
});
