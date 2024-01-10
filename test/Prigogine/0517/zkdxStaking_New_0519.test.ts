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
import {OP_GET_UPDATEData, printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("ZkdxStaking -> zkdxStaking + esZKDX test", async () => {
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

        /*added @20230517 by Prigogine */
        stakingETH         : any,
        stakingUSDC         : any,
        esZKDX              : any,

        rewardToken : any,
        stakingToken : any;

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
        stakingETH         = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;

        rewardToken         = esZKDX;
        stakingToken        = weth;
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
            0, // minOut
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

    async function stakingPrepare(_staking: any, _amountIn: any = parseEther("50000000")) {
        await esZKDX.mint(owner.address, _amountIn);
        await esZKDX.approve(_staking.address, _amountIn);
        await esZKDX.transfer(_staking.address, _amountIn);
        await _staking.notifyRewardAmount(_amountIn);
    }
    async function stakingStake(_staking: any, _user: any = owner, _amountIn: any = parseEther("100")) {
        await weth.mint(_user.address, _amountIn);
        await weth.connect(_user).approve(_staking.address, _amountIn);
        await _staking.connect(_user).stake({value:_amountIn});
    }
    it("stakingWETH.func => stake + getReward => v1", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);

        expect(await weth.balanceOf(stakingETH.address)).to.equal(parseEther("100"));
        expect(await esZKDX.balanceOf(stakingETH.address)).to.equal(parseEther("50000000"));
        expect(await stakingETH.balanceOf(user0.address)).to.equal(parseEther("100"));
        expect(await stakingETH.balanceOf(user1.address)).to.equal(0);
        expect(await stakingETH.balanceOf(user2.address)).to.equal(0);
        expect(await stakingETH.balanceOf(owner.address)).to.equal(0);
        expect(await stakingETH.totalSupply()).to.equal(parseEther("100"));
    });
    it("stakingWETH.func => stake => v2", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await stakingStake(stakingETH,user1,parseEther("200"));

        expect(await stakingETH.totalSupply()).to.equal(parseEther("300"));
        expect(await stakingETH.balanceOf(user0.address)).to.equal(parseEther("100"));
        expect(await stakingETH.balanceOf(user1.address)).to.equal(parseEther("200"));
        expect(await stakingETH.balanceOf(user2.address)).to.equal(0);
        expect(await stakingETH.balanceOf(owner.address)).to.equal(0);
    });
    it("stakingWETH.func => stake + withdraw ", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await stakingStake(stakingETH,user1,parseEther("200"));
        expect(await stakingETH.totalSupply()).to.equal(parseEther("300"));

        await stakingETH.connect(user0).withdraw(parseEther("30"));
        await stakingETH.connect(user1).withdraw(parseEther("70"));
        expect(await stakingETH.totalSupply()).to.equal(parseEther("200"));
        expect(await stakingETH.balanceOf(user0.address)).to.equal(parseEther("70"));
        expect(await stakingETH.balanceOf(user1.address)).to.equal(parseEther("130"));
    });
    it("stakingWETH.func => stake + withdraw => paused", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await stakingStake(stakingETH,user1,parseEther("200"));
        await forwardTime(86400*7);

        expect(await stakingETH.paused()).to.be.false;
        await stakingETH.setPaused(true);
        expect(await stakingETH.paused()).to.be.true;

        await expect(stakingStake(stakingETH,user0))
            .to.be.revertedWith("Pausable: paused");
        await expect(stakingStake(stakingETH,user1,parseEther("200")))
            .to.be.revertedWith("Pausable: paused");

        await expect(stakingETH.connect(user0).withdraw(parseEther("30")))
            .to.be.revertedWith("Pausable: paused");
        await expect(stakingETH.connect(user1).withdraw(parseEther("70")))
            .to.be.revertedWith("Pausable: paused");

        await expect(stakingETH.connect(user0).getReward())
            .to.be.revertedWith("Pausable: paused");
        await expect(stakingETH.connect(user1).getReward())
            .to.be.revertedWith("Pausable: paused");
    });
    it("stakingWETH.func => stake + withdraw => unPaused", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await stakingStake(stakingETH,user1,parseEther("200"));
        await forwardTime(86400*7);

        expect(await stakingETH.paused()).to.be.false;
        expect(await rewardToken.balanceOf(user0.address)).to.be.eq(0);
        expect(await rewardToken.balanceOf(user1.address)).to.be.eq(0);

        await stakingETH.connect(user0).withdraw(parseEther("30"));
        await stakingETH.connect(user1).withdraw(parseEther("70"));

        expect(await stakingETH.totalSupply()).to.equal(parseEther("200"));
        expect(await rewardToken.balanceOf(user0.address)).to.be.gt(0);
        expect(await rewardToken.balanceOf(user1.address)).to.be.gt(0);
    });
});

describe("ZkdxStakingETH -> ZkdxStakingETH + esZKDX test", async () => {
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

        /*added @20230517 by Prigogine */
        stakingETH         : any,
        stakingUSDC         : any,
        esZKDX              : any,

        rewardToken : any,
        stakingToken : any;

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
        stakingETH         = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;

        rewardToken         = esZKDX;
        stakingToken        = weth;
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

    async function stakingPrepare(_staking: any, _amountIn: any = parseEther("50000000")) {
        await esZKDX.mint(owner.address, _amountIn);
        await esZKDX.approve(_staking.address, _amountIn);
        await esZKDX.transfer(_staking.address, _amountIn);
        await _staking.notifyRewardAmount(_amountIn);
    }
    async function stakingStake(_staking: any, _user: any = owner, _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).stake({value:_amountIn});
    }
    it("stakingETH.func => ", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);

        expect(await weth.balanceOf(stakingETH.address)).to.equal(parseEther("100"));
        expect(await esZKDX.balanceOf(stakingETH.address)).to.equal(parseEther("50000000"));
        expect(await stakingETH.balanceOf(user0.address)).to.equal(parseEther("100"));
        expect(await stakingETH.balanceOf(user1.address)).to.equal(0);
        expect(await stakingETH.balanceOf(user2.address)).to.equal(0);
        expect(await stakingETH.balanceOf(owner.address)).to.equal(0);
        expect(await stakingETH.totalSupply()).to.equal(parseEther("100"));
    });
    it("stakingETH.func => stake", async() => {
        expect(await user0.getBalance()).to.be.eq(parseEther("10000"));
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);


        expect(await user0.getBalance()).to.be.closeTo(parseEther("9899.9998"), MAX_WITHIN);
    });
    it("stakingETH.params => weth", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);

        expect(await stakingETH.weth()).to.be.eq(weth.address);
        expect(await stakingETH.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingETH.duration()).to.be.eq(86400 * 30);


        expect(await stakingETH.finishAt()).to.be.gt(0);
        expect(await stakingETH.updatedAt()).to.be.gt(0);
    });
    it("stakingETH.params => stake + withdraw", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await stakingStake(stakingETH,user1);
        await stakingStake(stakingETH,owner);
        expect(await weth.balanceOf(stakingETH.address)).to.be.eq(parseEther("300"));
        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("300"));

        await stakingETH.connect(user0).withdraw(parseEther("100"));
        await stakingETH.connect(user1).withdraw(parseEther("100"));
        await stakingETH.connect(owner).withdraw(parseEther("100"));
        expect(await stakingETH.totalSupply()).to.be.eq(0);
        expect(await weth.balanceOf(stakingETH.address)).to.be.eq(0);
    });
    it("stakingETH.params => stake + getReward", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await stakingStake(stakingETH,user1);
        await stakingStake(stakingETH,owner);

        await forwardTime(86400 * 7);

        console.log(`esZKDX.balanceOf(user0): 
            ${formatEther(await esZKDX.balanceOf(user0.address))}`);

        await stakingETH.connect(user0).getReward();
        await stakingETH.connect(user1).getReward();
        await stakingETH.connect(owner).getReward();

        console.log(`esZKDX.balanceOf(user0): ${formatEther(await esZKDX.balanceOf(user0.address))}`);
        console.log(`esZKDX.balanceOf(user1): ${formatEther(await esZKDX.balanceOf(user1.address))}`);
        console.log(`esZKDX.balanceOf(owner): ${formatEther(await esZKDX.balanceOf(owner.address))}`);

        await forwardTime(86400 * 30);
        console.log(`stakingETH.earned(user0): ${formatEther(await stakingETH.earned(user0.address))}`);
        console.log(`stakingETH.earned(user1): ${formatEther(await stakingETH.earned(user1.address))}`);
        console.log(`stakingETH.earned(owner): ${formatEther(await stakingETH.earned(owner.address))}`);
    });
});

describe("ZkdxStaking -> ZkdxStakingUSDC + esZKDX test", async () => {
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

        /*added @20230517 by Prigogine */
        stakingUSDC         : any,
        esZKDX              : any,

        rewardToken : any,
        stakingToken : any,
        usdc : any;

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
        stakingUSDC         = fixture.stakingETH;
        stakingUSDC         = fixture.stakingUSDC;
        usdc                = fixture.usdc;
        esZKDX              = fixture.esZKDX;

        rewardToken         = esZKDX;
        stakingToken        = usdc;

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
            _token.address,
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

    async function stakingPrepare(_staking: any, _amountIn: any = parseEther("50000000")) {
        await esZKDX.mint(owner.address, _amountIn);
        await esZKDX.approve(_staking.address, _amountIn);
        await esZKDX.transfer(_staking.address, _amountIn);
        await _staking.notifyRewardAmount(_amountIn);
    }
    async function stakingStake(_staking: any, _user: any = owner, _amountIn: any = parseEther("100")) {
        await stakingToken.mint(_user.address, _amountIn);
        await stakingToken.connect(_user).approve(_staking.address, _amountIn);
        await _staking.connect(_user).stake(_amountIn);
    }
    it("stakingETH.func => ", async() => {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC,user0);

        expect(await stakingUSDC.stakingToken()).to.be.eq(usdc.address);
        expect(await stakingUSDC.rewardsToken()).to.be.eq(esZKDX.address);
    });
    it("stakingETH.func => stake", async() => {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC,user0);
    });
    it("stakingETH.params => weth", async() => {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC,user0);

        expect(await stakingUSDC.stakingToken()).to.be.eq(usdc.address);
        expect(await stakingUSDC.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingUSDC.duration()).to.be.eq(86400 * 30);
        expect(await stakingUSDC.finishAt()).to.be.gt(0);
        expect(await stakingUSDC.updatedAt()).to.be.gt(0);
    });
    it("stakingETH.params => stake + withdraw", async() => {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC,user0);
        await stakingStake(stakingUSDC,user1);
        await stakingStake(stakingUSDC,owner);
        expect(await usdc.balanceOf(stakingUSDC.address)).to.be.eq(parseEther("300"));
        expect(await stakingUSDC.totalSupply()).to.be.eq(parseEther("300"));

        await stakingUSDC.connect(user0).withdraw(parseEther("100"));
        await stakingUSDC.connect(user1).withdraw(parseEther("100"));
        await stakingUSDC.connect(owner).withdraw(parseEther("100"));
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
        expect(await usdc.balanceOf(stakingUSDC.address)).to.be.eq(0);
    });
    it("stakingETH.params => stake + getReward", async() => {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC,user0);
        await stakingStake(stakingUSDC,user1);
        await stakingStake(stakingUSDC,owner);

        await forwardTime(86400 * 7);
        console.log(`esZKDX.balanceOf(user0): ${formatEther(await esZKDX.balanceOf(user0.address))}`);

        await stakingUSDC.connect(user0).getReward();
        await stakingUSDC.connect(user1).getReward();
        await stakingUSDC.connect(owner).getReward();
        console.log(`esZKDX.balanceOf(user0): ${formatEther(await esZKDX.balanceOf(user0.address))}`);
        console.log(`esZKDX.balanceOf(user1): ${formatEther(await esZKDX.balanceOf(user1.address))}`);
        console.log(`esZKDX.balanceOf(owner): ${formatEther(await esZKDX.balanceOf(owner.address))}`);

        await forwardTime(86400 * 30);
        console.log(`stakingETH.earned(user0): ${formatEther(await stakingUSDC.earned(user0.address))}`);
        console.log(`stakingETH.earned(user1): ${formatEther(await stakingUSDC.earned(user1.address))}`);
        console.log(`stakingETH.earned(owner): ${formatEther(await stakingUSDC.earned(owner.address))}`);
    });
    it("stakingUSDC.func => setRewardsDuration()", async() => {
        expect(await stakingUSDC.duration()).to.be.eq(86400 * 30);
        await stakingUSDC.setRewardsDuration(86400 * 7);
        expect(await stakingUSDC.duration()).to.be.eq(86400 * 7);
    });
    it("stakingUSDC.func => setPaused()", async() => {
        expect(await stakingUSDC.paused()).to.be.false;
        await stakingUSDC.setPaused(true);
        expect(await stakingUSDC.paused()).to.be.true;
    });
    it("stakingUSDC.views => lastTimeRewardApplicable()", async() => {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC,user0);
        await stakingStake(stakingUSDC,user1);
        await stakingStake(stakingUSDC,owner);

        console.log(`stakingUSDC.lastTimeRewardApplicable: ${await stakingUSDC.lastTimeRewardApplicable()}`);
        console.log(`stakingUSDC.rewardPerToken(): ${formatEther(await stakingUSDC.rewardPerToken())}`);
        console.log(`stakingUSDC.earned(user0): ${formatEther(await stakingUSDC.earned(user0.address))}`);
        console.log(`stakingUSDC.earned(user1): ${formatEther(await stakingUSDC.earned(user1.address))}`);
        console.log(`stakingUSDC.earned(owner): ${formatEther(await stakingUSDC.earned(owner.address))}`);
    });
});
