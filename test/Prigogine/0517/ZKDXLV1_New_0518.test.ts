import {
    ApproveAmount,
    forwardTime,
    newWallet, setupFixture, toUsd
} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, keccak256, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants, utils} from "ethers";
import {MAX_WITHIN} from "../../../helpers/constants";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {toASCII} from "punycode";

import Web3 from 'web3';
import {deployments, ethers} from "hardhat";
import {DeployFunction} from "hardhat-deploy/types";
import {CHAIN_ID_LOCAL} from "../../../helpers/chains";
import {OP_GET_UPDATEData, printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("ZKDXLV1 -> ZKDXLV1 test", async () => {
    let vault               : any,
        router              : any,
        pm                  : any,
        shortsTracker       : any,

        weth                : any,
        wbtc                : any,
        dai                 : any,
        owner               : any,
        user0               : any,
        user1               : any,
        user2               : any,
        miner               : any,
        feeTo               : any,
        receiver            : any,

        zkdlp               : any,
        timelock            : any,
        rewardRouter        : any,
        zkusd               : any,
        v                   : any,
        dlpManager          : any,
        zkdx                : any,
        feed                : any,
        pms                 : any,
        vaultUtils          : any,
        vaultErrorController    : any,
        vu                  : any,
        dlp                 : any,
        reader              : any,
        t                   : any,
        tsla                : any,
        o                   : any,

        /* added by Prigogine@20230517*/
        tStaking            : any,
        /* added by Prigogine@20230518*/
        zkdxlv1             : any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault               = fixture.vault;
        router              = fixture.router;
        pm                  = fixture.positionManager;
        shortsTracker       = fixture.shortsTracker;

        weth                = fixture.weth;
        wbtc                = fixture.wbtc;
        dai                 = fixture.dai;
        owner               = fixture.owner;
        user0               = fixture.user0;
        user1               = fixture.user1;
        user2               = fixture.user2;
        miner               = fixture.miner;
        feeTo               = fixture.feeTo;
        receiver            = fixture.receiver;

        zkdlp               = fixture.zkdlp;
        timelock            = fixture.timelock;
        rewardRouter        = fixture.rewardRouter;
        zkusd               = fixture.ZKUSD;
        v                   = fixture.vault;
        dlpManager          = fixture.zkdlpManager;
        zkdx                = fixture.ZKDX;
        feed                = fixture.vaultPriceFeed;
        pms                 = pm;

        vaultUtils          = fixture.VaultUtils;
        vaultErrorController    = fixture.vaultErrorController;
        vu                  = fixture.VaultUtils;
        dlp                 = fixture.zkdlp;
        reader              = fixture.reader;
        t                   = timelock;
        tsla                = fixture.tsla;

        o                   = fixture.orderBook;
        /* added by Prigogine@20230517 */
        tStaking            = fixture.zkdxStakingWeth;
        /* added by Prigogine@20230518*/
        zkdxlv1             = fixture.zkdxlv1;
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
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("123456"), user2);

        await sellMLPWithTokenV2(parseEther("99100"), weth, owner);
        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);
        await sellMLPWithTokenV2(parseEther("79160"), wbtc, user1);
        await sellMLPWithTokenV2(parseEther("23085"), dai, user2);

        await buyMLPWithETHV2(parseEther("200"), owner);
        await sellMLPWithETHV2(parseEther("99100"), owner);
        /* added for new TSLA TEST*/
        await buyMLPWithTokenV2(tsla, parseEther("100"), user0);
        await sellMLPWithTokenV2(parseEther("100"), tsla, user0);
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
    /* ORDER BOOK*/
    async function longOperationTwice() {
        await longOperationA();
        await longWETH_DAIAmountInV2(owner, parseEther("100"), 1);
    }
    async function orderPrepareV2(user: any) {
        await wbtc.mint(user.address, parseEther("10000"));
        await weth.mint(user.address, parseEther("10000"));
        await dai.mint(user.address, parseEther("10000"));
        await tsla.mint(user.address, parseEther("10000"));
        await wbtc.connect(user).approve(router.address, ApproveAmount);
        await weth.connect(user).approve(router.address, ApproveAmount);
        await dai.connect(user).approve(router.address, ApproveAmount);
        await tsla.connect(user).approve(router.address, ApproveAmount);
    }
    async function OP_ORDER_PREPARE() {
        await orderPrepareV2(owner);
        await orderPrepareV2(user0);
        await orderPrepareV2(user1);
        await orderPrepareV2(user2);
    }
    async function createIO_LONG_TOKEN(_token: any, _tokenAmountIn: any, _user: any, _triggerPrice: any) {
        await o.connect(_user).createIncreaseOrder(
            [_token.address], // path
            _tokenAmountIn, // amountIn
            _token.address, // indexToken
            toUsd(100000), // sizeDelta
            _token.address, // collateralToken
            true, // isLong
            toUsd(_triggerPrice), // triggerPrice
            false, // triggerAboveThreshold
            parseEther("0.005"), // executionFee
            false, // shouldWrap
            {value: parseEther("0.005")}
        );
    };
    async function printOrderDetails(order: any) {
        console.log(`order.purchaseToken: ${order.purchaseToken}`);
        console.log(`order.purchaseTokenAmount: ${order.purchaseTokenAmount}`);
        console.log(`order.collateralToken: ${order.collateralToken}`);
        console.log(`order.indexToken: ${order.indexToken}`);
        console.log(`order.sizeDelta: ${order.sizeDelta}`);
        console.log(`order.isLong: ${order.isLong}`);
        console.log(`order.triggerPrice: ${order.triggerPrice}`);
        console.log(`order.triggerAboveThreshold: ${order.triggerAboveThreshold}`);
        console.log(`order.executionFee: ${order.executionFee}`);
    }

    async function stakingPrepare(_amountIn: any = parseEther("50000000")) {
        await zkdx.setMinter(owner.address,true);
        await zkdx.mint(owner.address, _amountIn);
        await zkdx.approve(tStaking.address, _amountIn);
        await zkdx.transfer(tStaking.address, _amountIn);
        await tStaking.notifyRewardAmount(_amountIn);
        await stakingStake();
    }
    async function stakingStake(_user: any = owner, _amountIn: any = parseEther("100")) {
        await weth.mint(_user.address, _amountIn);
        await weth.connect(_user).approve(tStaking.address, _amountIn);
        await tStaking.connect(_user).stake(_amountIn);
    }
    it("zkdxlv1.func => constructor", async() => {
        expect(await zkdxlv1.name()).to.be.eq("ZKDXLV1");
        expect(await zkdxlv1.symbol()).to.be.eq("ZKDXLV1");
        expect(await zkdxlv1.totalSupply()).to.be.eq(10000);
        expect(await zkdxlv1.decimals()).to.be.eq(0);
        expect(await zkdxlv1.balanceOf(owner.address)).to.be.eq(10000);
        expect(await zkdxlv1.balanceOf(user0.address)).to.be.eq(0);
        expect(await zkdxlv1.balanceOf(user1.address)).to.be.eq(0);
        expect(await zkdxlv1.balanceOf(user2.address)).to.be.eq(0);
        expect(await zkdxlv1.owner()).to.be.eq(owner.address);
    });
    it("zkdxlv1.func => mint", async() => {
        await expect(zkdxlv1.connect(user0).mint(user0.address, 100)).to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);

        expect(await zkdxlv1.balanceOf(user0.address)).to.be.eq(0);
        await zkdxlv1.mint(user0.address, 100);
        expect(await zkdxlv1.balanceOf(user0.address)).to.be.eq(100);
    });
    it("zkdxlv1.func => setBurnableAddress", async() => {
        expect(await zkdxlv1.burnableAddress()).to.be.eq(constants.AddressZero);
        await expect(zkdxlv1.connect(user0).setBurnableAddress(user0.address))
            .to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);

        await zkdxlv1.setBurnableAddress(user0.address);
        expect(await zkdxlv1.burnableAddress()).to.be.eq(user0.address);
        await zkdxlv1.setBurnableAddress(owner.address);
        expect(await zkdxlv1.burnableAddress()).to.be.eq(owner.address);
    });
    it('zkdxlv1.func => setEndTime', async() => {
        expect(await zkdxlv1.endTime()).to.be.eq(0);
        await expect(zkdxlv1.connect(user0).setEndTime(1))
            .to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);

        await zkdxlv1.setEndTime(1);
        expect(await zkdxlv1.endTime()).to.be.eq(1);
        await zkdxlv1.setEndTime(0);
        expect(await zkdxlv1.endTime()).to.be.eq(0);
    });
    it("zkdxlv1.func => burn", async() => {
        await zkdxlv1.mint(owner.address, 100);
        expect(await zkdxlv1.balanceOf(owner.address)).to.be.eq(10100);

        await zkdxlv1.setBurnableAddress(owner.address); // burnable address
        await expect(zkdxlv1.connect(user0).burn(owner.address, 100)).to.be.reverted; // not burnable address
        await zkdxlv1.burn(owner.address, 100); // burnable address
        expect(await zkdxlv1.balanceOf(owner.address)).to.be.eq(10000); // 10100 - 100 = 10000
    });
    it("zkdxlv1.func => multiTransfer", async() => {
        await zkdxlv1.mint(owner.address, 100);
        await zkdxlv1.mint(user0.address, 100);
        await zkdxlv1.mint(user1.address, 100);
        await zkdxlv1.mint(user2.address, 100);
        expect(await zkdxlv1.balanceOf(owner.address)).to.be.eq(10100);
        expect(await zkdxlv1.balanceOf(user0.address)).to.be.eq(100);
        expect(await zkdxlv1.balanceOf(user1.address)).to.be.eq(100);
        expect(await zkdxlv1.balanceOf(user2.address)).to.be.eq(100);

        await zkdxlv1.setBurnableAddress(owner.address); // burnable address
        await zkdxlv1.multiTransfer([user0.address, user1.address, user2.address], [1, 2, 3]); // burnable address
        expect(await zkdxlv1.balanceOf(owner.address)).to.be.eq(10094); // 10100 - 6 = 10094
        expect(await zkdxlv1.balanceOf(user0.address)).to.be.eq(101);
        expect(await zkdxlv1.balanceOf(user1.address)).to.be.eq(102);
        expect(await zkdxlv1.balanceOf(user2.address)).to.be.eq(103);
    });
});
