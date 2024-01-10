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

describe("ZkdxStaking -> ZkdxStaking + zkDX test", async () => {
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

        /*added @20230517 by Prigogine */
        stakingUSDC            : any,
        stakingETH            : any,
        esZkdx              : any,
        usdc                : any;

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
        stakingUSDC            = fixture.stakingUSDC;
        stakingETH            = fixture.stakingETH;
        esZkdx              = fixture.esZKDX;
        usdc                = fixture.usdc;

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
        await esZkdx.mint(stakingUSDC.address, _amountIn);
        await stakingUSDC.notifyRewardAmount(_amountIn);
        await stakingStake();
    }
    async function stakingStake(_user: any = owner, _amountIn: any = parseEther("100")) {
        await usdc.mint(_user.address, _amountIn);
        await usdc.connect(_user).approve(stakingUSDC.address, _amountIn);
        await stakingUSDC.connect(_user).stake(_amountIn);
    }
    it("esZkdxStaking.func => constructor", async() => {
        expect(stakingUSDC.address).to.not.eq(constants.AddressZero);
        expect(await stakingUSDC.stakingToken()).to.be.eq(usdc.address);
        expect(await stakingUSDC.rewardsToken()).to.be.eq(esZkdx.address);
        expect(await stakingUSDC.duration()).to.be.eq(86400 * 30);
    });
    it("esZkdxStaking.func => lastTimeRewardApplicable()", async() => {
        expect(await stakingUSDC.lastTimeRewardApplicable()).to.be.eq(0);

        await stakingPrepare();
        expect(await stakingUSDC.lastTimeRewardApplicable()).to.be.gt(0);
        const beforeValue = await stakingUSDC.lastTimeRewardApplicable();

        await stakingStake(user0, parseEther("100"));
        expect(await stakingUSDC.lastTimeRewardApplicable()).to.be.gt(beforeValue);
    });
    it("esZkdxStaking.func => rewardPerToken()", async() => {
        await stakingPrepare();
        expect(await stakingUSDC.rewardPerToken()).to.be.eq(0);

        await stakingStake(user0, parseEther("100"));
        expect(await stakingUSDC.rewardPerToken()).to.be.gt(0);
    });
    it("esZkdxStaking.parameters => totalSupply()", async() => {
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);

        await stakingPrepare();
        expect(await stakingUSDC.totalSupply()).to.be.eq(parseEther("100"));
        expect(await usdc.balanceOf(stakingUSDC.address)).to.be.eq(parseEther("100"));

        await stakingStake();
        expect(await stakingUSDC.totalSupply()).to.be.eq(parseEther("200"));
        expect(await usdc.balanceOf(stakingUSDC.address)).to.be.eq(parseEther("200"));
    });
    it("esZkdxStaking.Params => withdraw()", async() => {
        await stakingPrepare();
        await stakingStake();
        expect(await stakingUSDC.totalSupply()).to.be.eq(parseEther("200"));
        expect(await usdc.balanceOf(stakingUSDC.address)).to.be.eq(parseEther("200"));

        await expect(stakingUSDC.withdraw(parseEther("201"))).to.be.reverted;

        await(stakingUSDC.withdraw(parseEther("200")));
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
        expect(await usdc.balanceOf(stakingUSDC.address)).to.be.eq(0);
    });
    it("zkdxStaking.Params => earned()", async() => {
        await stakingPrepare();
        await stakingStake();
        await forwardTime(86400 * 7);
        expect(await stakingUSDC.earned(owner.address)).to.be.gt(0);
        expect(await stakingUSDC.earned(user0.address)).to.be.eq(0);
        expect(await stakingUSDC.earned(user1.address)).to.be.eq(0);

        await forwardTime(86400 * 7);
        expect(await stakingUSDC.earned(owner.address)).to.be.gt(0);
        expect(await stakingUSDC.earned(user0.address)).to.be.eq(0);
        expect(await stakingUSDC.earned(user1.address)).to.be.eq(0);


        await forwardTime(86400 * 7);
        expect(await stakingUSDC.earned(owner.address)).to.be.gt(0);
        expect(await stakingUSDC.earned(user0.address)).to.be.eq(0);
        expect(await stakingUSDC.earned(user1.address)).to.be.eq(0);
    });
    it("zkdxStaking.Params => earned() v2", async() => {
        await stakingPrepare();
        await stakingStake();
        await stakingStake(user0, parseEther("100"));

        await forwardTime(86400 * 7);
        expect(await stakingUSDC.earned(owner.address)).to.be.gt(0);
        expect(await stakingUSDC.earned(user0.address)).to.be.gt(0);
        expect(await stakingUSDC.earned(user1.address)).to.be.eq(0);


        await forwardTime(86400 * 7);
        expect(await stakingUSDC.earned(owner.address)).to.be.gt(0);
        expect(await stakingUSDC.earned(user0.address)).to.be.gt(0);
        expect(await stakingUSDC.earned(user1.address)).to.be.eq(0);
    });
    it("zkdxStaking.Params => getReward()", async() => {
        await stakingPrepare();
        await stakingStake();
        await forwardTime(86400 * 7);


        await stakingUSDC.getReward();
        expect(await esZkdx.balanceOf(owner.address)).to.be.gt(0);
        expect(await esZkdx.balanceOf(user0.address)).to.be.eq(0);
        expect(await esZkdx.balanceOf(user1.address)).to.be.eq(0);
        expect(await esZkdx.totalSupply()).to.be.gt(0);
        expect(await esZkdx.balanceOf(stakingUSDC.address)).to.be.gt(0);

        await forwardTime(86400 * 365);
        await stakingUSDC.getReward();
        expect(await esZkdx.balanceOf(owner.address)).to.be.gt(0);
        expect(await esZkdx.balanceOf(user0.address)).to.be.eq(0);
        expect(await esZkdx.balanceOf(user1.address)).to.be.eq(0);
        expect(await esZkdx.totalSupply()).to.be.gt(0);
        expect(await esZkdx.balanceOf(stakingUSDC.address)).to.be.gt(0);
    });
    it("zkdxStaking.func => setRewardsDuration()", async() => {
        await stakingPrepare();
        await stakingStake();
        await forwardTime(86400 * 7);

        expect(await stakingUSDC.owner()).to.be.eq(owner.address);
        expect(await stakingUSDC.duration()).to.be.eq(86400 * 30);
        await expect(stakingUSDC.connect(user0).setRewardsDuration(0)).to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);
        await expect(stakingUSDC.setRewardsDuration(0)).to.be.ok;

        await forwardTime(86400 * 365);
        await stakingUSDC.setRewardsDuration(0);
    });
    it("zkdxStaking.func => setPaused()", async() => {
        expect(await stakingUSDC.paused()).to.be.false;
        await expect(stakingUSDC.connect(user0).setPaused(true)).to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);

        await stakingUSDC.setPaused(true);
        expect(await stakingUSDC.paused()).to.be.true;
        await stakingUSDC.setPaused(false);
        expect(await stakingUSDC.paused()).to.be.false;
    });
});

describe("esZKDX -> esZKDX test", async () => {
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
        esZKDX              : any;

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
        stakingETH         = fixture.zkdxStakingWeth;
        esZKDX              = fixture.esZKDX;

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
            _token.address, // path
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
        await stakingStake(_staking);
    }
    async function stakingStake(_staking: any, _user: any = owner, _amountIn: any = parseEther("100")) {
        await weth.mint(_user.address, _amountIn);
        await weth.connect(_user).approve(_staking.address, _amountIn);
        await _staking.connect(_user).stake({value: _amountIn});
    }
    it("esZKDX.func => constructor", async() => {
        expect(await esZKDX.owner()).to.be.eq(owner.address);
        expect(await esZKDX.taxReceiver()).to.be.eq(owner.address);
        expect(await esZKDX.totalSupply()).to.be.eq(parseEther("50000000"));
        expect(await esZKDX.balanceOf(owner.address)).to.be.eq(parseEther("50000000"));
        expect(await esZKDX.balanceOf(user0.address)).to.be.eq(0);
        expect(await esZKDX.balanceOf(user1.address)).to.be.eq(0);
        expect(await esZKDX.balanceOf(user2.address)).to.be.eq(0);

        expect(await esZKDX.name()).to.be.eq("esZKDX");
        expect(await esZKDX.symbol()).to.be.eq("esZKDX");
    });
    it("esZKDX.func => mint", async() => {
        await expect(esZKDX.connect(user0).mint(user0.address, parseEther("100")))
            .to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);
        expect(await esZKDX.balanceOf(user0.address)).to.be.eq(0);
        expect(await esZKDX.totalSupply()).to.be.eq(parseEther("50000000"));
        await esZKDX.mint(user0.address, parseEther("100"));
        expect(await esZKDX.balanceOf(user0.address)).to.be.eq(parseEther("100"));
        expect(await esZKDX.totalSupply()).to.be.eq(parseEther("50000100"));
    });
    it("esZKDX.func => transfer", async() => {
        await esZKDX.mint(owner.address, parseEther("100"));
        expect(await esZKDX.balanceOf(owner.address)).to.be.eq(parseEther("50000100"));
        expect(await esZKDX.balanceOf(user0.address)).to.be.eq(0);
        await esZKDX.transfer(user0.address, parseEther("100"));
        expect(await esZKDX.balanceOf(owner.address)).to.be.eq(parseEther("50000000"));
        expect(await esZKDX.balanceOf(user0.address)).to.be.eq(parseEther("100"));
        expect(await esZKDX.tax()).to.be.eq(0);
    });
    it("esZKDX.parameters => whitelist", async() => {
        await expect(esZKDX.connect(user0).setWhitelist([user0.address], [true])).to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);
        expect(await esZKDX.whitelist(user0.address)).to.be.false;
        await esZKDX.setWhitelist([user0.address], [true]);
        expect(await esZKDX.whitelist(user0.address)).to.be.true;

        expect(await esZKDX.whitelist(owner.address)).to.be.false;
        await esZKDX.setWhitelist([owner.address], [true]);
        expect(await esZKDX.whitelist(owner.address)).to.be.true;
    });
    it("esZKDX.parameters => setTax", async() => {
        expect(await esZKDX.tax()).to.be.eq(0);
        await expect(esZKDX.connect(user0).setTax(100)).to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);
        await esZKDX.setTax(100);
        expect(await esZKDX.tax()).to.be.eq(100);
    });
    it("esZKDX.parameters => setTaxReceiver", async() => {
        expect(await esZKDX.taxReceiver()).to.be.eq(owner.address);
        await expect(esZKDX.connect(user0).setTaxReceiver(user0.address)).to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);
        await esZKDX.setTaxReceiver(user0.address);
        expect(await esZKDX.taxReceiver()).to.be.eq(user0.address);
    });
    it('esZKDX.parameters => owner', async() => {
        expect(await esZKDX.owner()).to.be.eq(owner.address);
        await expect(esZKDX.connect(user0).transferOwnership(user0.address)).to.be.revertedWith(ErrorsV2.OWNABLE_CALLER_IS_NOT_THE_OWNER);
        await esZKDX.transferOwnership(user0.address);
        expect(await esZKDX.owner()).to.be.eq(user0.address);
    });
});

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
        let {updateData, fee} = await getUpdateData(['wbtc', 'dai', 'weth', 'tsla']);
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
        await weth.mint(_user.address, _amountIn);
        await weth.connect(_user).approve(_staking.address, _amountIn);
        await _staking.connect(_user).stake({value: _amountIn});
    }
    it("stakingETH.func => constructor", async() => {
        expect(stakingETH.address).to.not.eq(constants.AddressZero);
        expect(await stakingETH.weth()).to.be.eq(weth.address);
        expect(await stakingETH.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingETH.duration()).to.be.eq(86400 * 30);
    });
    it("stakingETH.func => stake", async() => {
        expect(await weth.balanceOf(owner.address)).to.be.eq(0);
        expect(await esZKDX.balanceOf(owner.address)).to.be.gt(0);
        expect(await weth.balanceOf(stakingETH.address)).to.be.eq(0);
        expect(await esZKDX.balanceOf(stakingETH.address)).to.be.eq(0);

        let _amountIn = parseEther("100");
        await weth.approve(stakingETH.address, _amountIn);
        await weth.mint(owner.address, _amountIn);
        await stakingETH.stake({value: _amountIn});

        // expect(await weth.balanceOf(owner.address)).to.be.eq(0);
        expect(await esZKDX.balanceOf(owner.address)).to.be.gt(0);
        expect(await weth.balanceOf(stakingETH.address)).to.be.eq(_amountIn);
        expect(await esZKDX.balanceOf(stakingETH.address)).to.be.eq(0);
    });
    it("stakingETH.func => stake => v2", async() => {
        let _amountIn = parseEther("100");
        let _staker = owner;
        await weth.approve(stakingETH.address, _amountIn);
        await weth.mint(_staker.address, _amountIn);
        await stakingETH.connect(_staker).stake({value: _amountIn});
        expect(await stakingETH.earned(_staker.address)).to.be.eq(0);

        await forwardTime(86400 * 365);
        expect(await stakingETH.earned(_staker.address)).to.be.eq(0);
    });
    it("stakingETH.func => stake => v3", async() => {
        let _amountIn = parseEther("100");
        let _staker = user0;
        await weth.connect(_staker).approve(stakingETH.address, _amountIn);
        await weth.connect(owner).mint(_staker.address, _amountIn); // mint for staker by Owner
        await stakingETH.connect(_staker).stake({value: _amountIn});
        expect(await stakingETH.earned(_staker.address)).to.be.eq(0);

        await forwardTime(86400 * 365);
        expect(await stakingETH.earned(_staker.address)).to.be.eq(0);
        // expect(await weth.balanceOf(_staker.address)).to.be.eq(0);

        await stakingETH.connect(_staker).withdraw(_amountIn);
        expect(await weth.balanceOf(_staker.address)).to.be.eq(_amountIn);
    });
    it("stakingETH.func => stake + withdraw ", async() => {
        await stakingStake(stakingETH,user0);
        await stakingStake(stakingETH,user1);
        await stakingStake(stakingETH,owner);

        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("300"));
        await stakingETH.connect(user0).withdraw(parseEther("100"));
        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("200"));
        await stakingETH.connect(user1).withdraw(parseEther("100"));
        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("100"));
        await stakingETH.connect(owner).withdraw(parseEther("100"));
        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("0"));

        expect(await weth.balanceOf(user0.address)).to.be.eq(parseEther("100"));
        expect(await weth.balanceOf(user1.address)).to.be.eq(parseEther("100"));
        expect(await weth.balanceOf(owner.address)).to.be.eq(parseEther("100"));
    });
    it("stakingETH.func => stake + withdraw + setLockPeriod", async() => {
        await stakingStake(stakingETH,user0);

        await (stakingETH.connect(user0).withdraw(parseEther("10")));
        await forwardTime(86400 * 3);
        await (stakingETH.connect(user0).withdraw(parseEther("10")));
        await forwardTime(86400 * 4);
        expect(await weth.balanceOf(stakingETH.address)).to.be.eq(parseEther("80"));
        await stakingETH.connect(user0).withdraw(parseEther("80"));
        expect(await weth.balanceOf(stakingETH.address)).to.be.eq(0);
    });
    it("stakingETH.func => stake + withdraw + getReward", async() => {
        await stakingStake(stakingETH,user0);
        await forwardTime(86400 * 7);

        await stakingETH.connect(user0).getReward();
        expect(await rewardToken.balanceOf(user0.address)).to.be.eq(0);

        await stakingETH.connect(user0).withdraw(parseEther("100"));
        expect(await stakingToken.balanceOf(user0.address)).to.be.eq(parseEther("100"));
    });
    it("stakingETH.func => stake + getReward => v2", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);

        await forwardTime(86400 * 7);
        await stakingETH.connect(user0).getReward();
        expect(await rewardToken.balanceOf(user0.address)).to.be.gt(0);

        await forwardTime(86400 * 365);
        await stakingETH.connect(user0).getReward();
        expect(await rewardToken.balanceOf(user0.address)).to.be.gt(0);
    });
    it("stakingETH.func => stake + getReward => v3", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await forwardTime(86400 * 7);
        console.log(`_reward: ${formatEther(await rewardToken.balanceOf(user0.address))}`);

        await stakingETH.connect(user0).getReward();
        console.log(`_reward: ${formatEther(await rewardToken.balanceOf(user0.address))}`);

        await stakingETH.connect(user0).withdraw(parseEther("100"));
        console.log(`_reward: ${formatEther(await rewardToken.balanceOf(user0.address))}`);

        await forwardTime(86400 * 365);
        await stakingETH.connect(user0).getReward();

        console.log(`_reward: ${formatEther(await rewardToken.balanceOf(user0.address))}`);
        expect(await stakingETH.totalSupply()).to.be.eq(0);
        console.log(`rewardToken: ${formatEther(await rewardToken.balanceOf(stakingETH.address))}`);
    });
    it("stakingETH.func => stake + getReward => v3", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await forwardTime(86400 * 7);

        /* s1 */
        await stakingETH.connect(user0).getReward();
        await stakingETH.connect(user0).withdraw(parseEther("100"));
        await forwardTime(86400 * 365);
        await stakingETH.connect(user0).getReward();

        console.log(`rewardToken: ${formatEther(await rewardToken.balanceOf(stakingETH.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(user0.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(user1.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(owner.address))}`);

        /* S2 */
        await stakingStake(stakingETH,user0);
        await forwardTime(86400 * 365);

        console.log(`rewardToken: ${formatEther(await rewardToken.balanceOf(stakingETH.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(user0.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(user1.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(owner.address))}`);
        await stakingETH.connect(user0).withdraw(parseEther("100"));
        await stakingETH.connect(user0).getReward();

        console.log(`rewardToken: ${formatEther(await rewardToken.balanceOf(stakingETH.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(user0.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(user1.address))}`);
        console.log(`earned: ${formatEther(await stakingETH.earned(owner.address))}`);
    });
    it("stakingETH.func => stake + getReward => v4", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await forwardTime(86400 * 365);

        expect(await rewardToken.balanceOf(stakingETH.address)).to.be.closeTo(parseEther("50000000.0"), MAX_WITHIN);
        expect(await stakingETH.earned(user0.address)).to.be.gt(0);
        expect(await stakingETH.earned(user1.address)).to.be.closeTo(parseEther("0.0"), MAX_WITHIN);
        expect(await stakingETH.earned(owner.address)).to.be.closeTo(parseEther("0"), MAX_WITHIN);

        await stakingETH.connect(user0).getReward();

        expect(await rewardToken.balanceOf(stakingETH.address)).to.be.gt(0);
        expect(await stakingETH.earned(user0.address)).to.be.eq(0);
        expect(await stakingETH.earned(user1.address)).to.be.eq(0);
        expect(await stakingETH.earned(owner.address)).to.be.eq(0);
    });
    it("stakingETH.func => lastTimeRewardApplicable + finishAt", async() => {
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);
        await forwardTime(86400 * 30);

        console.log(`stakingETH.lastTimeRewardApplicable: ${await stakingETH.lastTimeRewardApplicable()}`);
        console.log(`stakingETH.finishAt: ${await stakingETH.finishAt()}`);
        console.log(`stakingETH.updatedAt: ${await stakingETH.updatedAt()}`);

        // await expect(stakingETH.setRewardsDuration(86400 * 365)).to.be.reverted;
    });
    it("stakingETH.func => stake + getReward => v5", async() => {
        expect(await stakingETH.weth()).to.be.eq(weth.address);
        expect(await stakingETH.rewardsToken()).to.be.eq(esZKDX.address);
        await stakingPrepare(stakingETH);
        await stakingStake(stakingETH,user0);

        expect(await stakingETH.balanceOf(user0.address)).to.be.eq(parseEther("100"));
        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("100"));

        await forwardTime(86400 * 30);

        console.log(`stakingETH.rewardPerTokenStored: ${formatEther(await stakingETH.rewardPerTokenStored())}`);
        console.log(`stakingETH.rewardRate: ${formatEther(await stakingETH.rewardRate())}`);
        console.log(`stakingETH.rewardPerToken: ${formatEther(await stakingETH.rewardPerToken())}`);
    });
});
