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
describe("ZkdxStaking -> ZkdxStakingUSDC + ZkdxStakingETH test", async () => {
    let
    weth                : any,
    wbtc                : any,
    dai                 : any,
    usdc                : any,
    tsla                : any,
    zkdlp               : any,
    dlp                 : any,
    zkusd               : any,

    /* users */
    owner               : any,
    user0               : any,
    user1               : any,
    user2               : any,
    miner               : any,
    feeTo               : any,
    receiver            : any,
    /* contracts */
    timelock            : any,
    t                   : any,
    vault               : any,
    v                   : any,
    feed                : any,
    vaultUtils          : any,
    vu                  : any,
    vec                 : any,

    pm                  : any,
    dlpManager          : any,
    router              : any,
    shortsTracker       : any,
    o                   : any,
    rewardRouter        : any,
    reader              : any,
    /* Staking */
    stakingUSDC         : any,
    esZKDX              : any,
    rewardToken         : any,
    stakingToken        : any,
    stakingETH          : any;

    beforeEach(async () => {
        let fixture = await setupFixture();

        /* tokens */
        weth                = fixture.weth;
        wbtc                = fixture.wbtc;
        dai                 = fixture.dai;
        usdc                = fixture.usdc;
        tsla                = fixture.tsla;
        zkdlp               = fixture.zkdlp;
        dlp                 = zkdlp;
        zkusd               = fixture.ZKUSD;

        /* users */
        owner               = fixture.owner;
        user0               = fixture.user0;
        user1               = fixture.user1;
        user2               = fixture.user2;
        miner               = fixture.miner;
        feeTo               = fixture.feeTo;
        receiver            = fixture.receiver;
        /* contracts */
        timelock            = fixture.timelock;
        t                   = timelock;
        vault               = fixture.vault;
        v                   = vault;
        feed                = fixture.vaultPriceFeed;
        vaultUtils          = fixture.VaultUtils;
        vu                  = vaultUtils;
        vec                 = fixture.vaultErrorController;

        pm                  = fixture.positionManager;
        dlpManager          = fixture.zkdlpManager;
        router              = fixture.router;
        shortsTracker       = fixture.shortsTracker;
        o                   = fixture.orderBook;
        rewardRouter        = fixture.rewardRouter;
        reader              = fixture.reader;
        /* Staking */
        stakingUSDC         = fixture.stakingUSDC;
        stakingETH          = fixture.stakingETH;
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
    async function stakingETHStake(
        _staking: any,
        _user: any = owner,
        _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).stake({value: _amountIn});
    }
    async function withdrawStaking(
        _staking: any,
        _user: any = owner,
        _amountIn: any = parseEther("100")) {
        await _staking.connect(_user).withdraw(_amountIn);
    }
    async function getRewardStaking(
        _staking: any,
        _user: any = owner) {
        await _staking.connect(_user).getReward();
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
    async function OP_BASE_LONG_SHORT() {
        await longOperationA();
        await shortOperationA();
        await closePositionV2(owner, 300, 400);
    }
    async function OP_ORDER_PREPARE() {
        await orderPrepareV2(owner);
        await orderPrepareV2(user0);
        await orderPrepareV2(user1);
        await orderPrepareV2(user2);
    }
    async function OP_IO_LONG() {
        await createIO_LONG_TOKEN(wbtc, parseUnits("1", 8), user0, 25000);
        await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
        await createIO_LONG_TOKEN(dai, parseEther("100"), user0, 0.99);
        await createIO_LONG_TOKEN(tsla, parseEther("100"), user0, 1);
    }
    async function OP_STAKING() {
        await stakingPrepare(stakingUSDC);
        await stakingStake(stakingUSDC);
    }
    async function OP_STAKING_ETH() {
        await stakingPrepare(stakingETH);
        await stakingETHStake(stakingETH);
    }
    // it("test Scenario => ", async() => {
    //     await OP_BASE_MLP();
    //     await OP_BASE_LONG_SHORT();
    //     await OP_ORDER_PREPARE();
    //     await OP_IO_LONG();
    //     await OP_STAKING();
    // });
    it("stakingUSDC.func => ", async() => {
        await OP_STAKING();

        expect(await stakingUSDC.stakingToken()).to.be.eq(usdc.address);
        expect(await stakingUSDC.rewardsToken()).to.be.eq(esZKDX.address);
    });
    it("stakingUSDC.params => totalSupply", async() => {
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
        await OP_STAKING();
        expect(await stakingUSDC.totalSupply()).to.be.eq(parseEther("100"));
        await stakingUSDC.connect(owner).withdraw(parseEther("100"));
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
    });
    it("stakingUSDC.params + stakingETH.Params", async() => {
        expect(await stakingETH.weth()).to.be.eq(weth.address);
        expect(await stakingETH.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingETH.duration()).to.be.eq(86400*30);
        expect(await stakingETH.totalSupply()).to.be.eq(0);

        expect(await stakingUSDC.stakingToken()).to.be.eq(usdc.address);
        expect(await stakingUSDC.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingUSDC.duration()).to.be.eq(86400*30);
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
    });
    it("stakingUSDC + stakingETH => stake", async() => {
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
        expect(await stakingETH.totalSupply()).to.be.eq(0);
        await OP_STAKING();
        await OP_STAKING_ETH();

        expect(await stakingUSDC.totalSupply()).to.be.eq(parseEther("100"));
        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("100"));
    });
    it("stakingUSDC + stakingETH => withdraw", async() => {
        await OP_STAKING();
        await OP_STAKING_ETH();

        expect(await stakingUSDC.totalSupply()).to.be.eq(parseEther("100"));
        expect(await stakingETH.totalSupply()).to.be.eq(parseEther("100"));
        await withdrawStaking(stakingUSDC);
        await withdrawStaking(stakingETH);
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
        expect(await stakingETH.totalSupply()).to.be.eq(0);
    });
    it("stakingUSDC + stakingETH => getReward", async() => {
        expect(await esZKDX.balanceOf(stakingUSDC.address)).to.be.eq(0);
        expect(await esZKDX.balanceOf(stakingETH.address)).to.be.eq(0);
        await OP_STAKING();
        await OP_STAKING_ETH();
        await forwardTime(86400*30);
        expect(await esZKDX.balanceOf(stakingUSDC.address)).to.be.eq(parseEther("50000000.0"));
        expect(await esZKDX.balanceOf(stakingETH.address)).to.be.eq(parseEther("50000000.0"));


        await getRewardStaking(stakingUSDC);
        expect(await esZKDX.balanceOf(owner.address)).to.be.gt(0);
        expect(await esZKDX.balanceOf(owner.address)).to.be.closeTo(parseEther('99999942.129629'), MAX_WITHIN);
        expect(await esZKDX.balanceOf(user0.address)).to.be.eq(0);
        await getRewardStaking(stakingETH);
        expect(await esZKDX.balanceOf(owner.address)).to.be.closeTo(parseEther('149999922.83950'), MAX_WITHIN);
        expect(await esZKDX.balanceOf(user0.address)).to.be.eq(0);


        expect(await esZKDX.balanceOf(owner.address)).to.be.gt(0);
        expect(await esZKDX.balanceOf(stakingUSDC.address)).to.be.lt(parseEther("50000000.0"));
        expect(await esZKDX.balanceOf(stakingETH.address)).to.be.lt(parseEther("50000000.0"));
        expect(await esZKDX.totalSupply()).to.be.gt(0);
    });
    it("stakingUSDC + stakingETH => parameters", async() => {
        await OP_STAKING_ETH();
        await forwardTime(86400*30);
        await getRewardStaking(stakingETH);
        await withdrawStaking(stakingETH);

        expect(await stakingETH.weth()).to.be.eq(weth.address);
        expect(await stakingETH.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingETH.duration()).to.be.eq(86400*30);
        expect(await stakingETH.finishAt()).to.be.gt(0);
        expect(await stakingETH.updatedAt()).to.be.gt(0);
    });
    it("stakingUSDC + stakingETH => parameters v2", async() => {
        await OP_STAKING_ETH();
        await forwardTime(86400*30);
        await getRewardStaking(stakingETH);
        await withdrawStaking(stakingETH);

        expect(await stakingETH.rewardRate()).to.be.closeTo(
            parseEther("19.290123"), MAX_WITHIN);
        expect(await stakingETH.rewardPerTokenStored()).to.be.closeTo(
            parseEther("499999.807098"), MAX_WITHIN);
        expect(await stakingETH.userRewardPerTokenPaid(owner.address))
            .to.be.closeTo(parseEther("499999.807098"), MAX_WITHIN);
        expect(await stakingETH.rewards(owner.address)).to.be.eq(0);
        expect(await stakingETH.totalSupply()).to.be.eq(0);
        expect(await stakingETH.balanceOf(owner.address)).to.be.eq(0);
        expect(await stakingETH.balanceOf(stakingETH.address)).to.be.eq(0);
        expect(await stakingETH.balanceOf(user0.address)).to.be.eq(0);
    });
    it("stakingETH.func => setRewardsDuration", async() => {
        await OP_STAKING_ETH();
        await forwardTime(86400*30);
        await getRewardStaking(stakingETH);
        await withdrawStaking(stakingETH);

        expect(await stakingETH.duration()).to.be.eq(86400*30);
        expect(await stakingETH.owner()).to.be.eq(owner.address);
        await expect(stakingETH.connect(user0).setRewardsDuration(0)).to.be.reverted;
        await stakingETH.setRewardsDuration(0);
        expect(await stakingETH.duration()).to.be.eq(0);
    });
    it("stakingETH.func => setPaused", async() => {
        await OP_STAKING_ETH();
        await forwardTime(86400*30);
        await getRewardStaking(stakingETH);
        await withdrawStaking(stakingETH);

        expect(await stakingETH.paused()).to.be.false;
        await expect(stakingETH.connect(user0).setPaused(true)).to.be.reverted;
        await stakingETH.setPaused(true);
        expect(await stakingETH.paused()).to.be.true;
        await stakingETH.setPaused(false);
        expect(await stakingETH.paused()).to.be.false;
    });
    it("stakingETH.func => lastTimeRewardApplicable", async() => {
        await OP_STAKING_ETH();
        await forwardTime(86400*30);
        await getRewardStaking(stakingETH);
        await withdrawStaking(stakingETH);

        expect(await stakingETH.lastTimeRewardApplicable()).to.be.gt(0);
        expect(await stakingETH.rewardPerToken()).to.be.closeTo(
            parseEther("499999.807098"), MAX_WITHIN);
        expect(await stakingETH.earned(owner.address)).to.be.eq(0);
        expect(await stakingETH.earned(user0.address)).to.be.eq(0);
    });
    it("stakingUSDC.parameters => v1", async() => {
        await OP_STAKING();
        await forwardTime(86400*30);
        await getRewardStaking(stakingUSDC);
        await withdrawStaking(stakingUSDC);

        expect(await stakingUSDC.stakingToken()).to.be.eq(usdc.address);
        expect(await stakingUSDC.rewardsToken()).to.be.eq(esZKDX.address);
        expect(await stakingUSDC.duration()).to.be.eq(86400 * 30);
        expect(await stakingUSDC.finishAt()).to.be.gt(0);
        expect(await stakingUSDC.updatedAt()).to.be.gt(0);

        expect(await stakingUSDC.rewardRate()).to.be.closeTo(
            parseEther("19.290123"), MAX_WITHIN);
        expect(await stakingUSDC.rewardPerTokenStored()).to.be.closeTo(
            parseEther("499999.421296"), MAX_WITHIN);

        expect(await stakingUSDC.userRewardPerTokenPaid(owner.address))
            .to.be.closeTo(parseEther("499999.421296"), MAX_WITHIN);
        expect(await stakingUSDC.rewards(owner.address)).to.be.eq(0);
        expect(await stakingUSDC.totalSupply()).to.be.eq(0);
        expect(await stakingUSDC.balanceOf(owner.address)).to.be.eq(0);
    });
    it("stakingUSDC.func => setRewardsDuration", async() => {
        await OP_STAKING();
        await forwardTime(86400*30);
        await getRewardStaking(stakingUSDC);
        await withdrawStaking(stakingUSDC);

        expect(await stakingUSDC.duration()).to.be.eq(86400*30);
        await expect(stakingUSDC.connect(user0).setRewardsDuration(0)).to.be.reverted;
        await stakingUSDC.setRewardsDuration(0);
        expect(await stakingUSDC.duration()).to.be.eq(0);
    });
    it("stakingUSDC.func => setPaused", async() => {
        await OP_STAKING();
        await forwardTime(86400*30);
        await getRewardStaking(stakingUSDC);
        await withdrawStaking(stakingUSDC);

        expect(await stakingUSDC.paused()).to.be.false;
        await expect(stakingUSDC.connect(user0).setPaused(true)).to.be.reverted;
        await stakingUSDC.setPaused(true);
        expect(await stakingUSDC.paused()).to.be.true;
        await stakingUSDC.setPaused(false);
        expect(await stakingUSDC.paused()).to.be.false;
    });
    it("stakingUSDC.func => setPaused", async() => {
        await OP_STAKING();
        await forwardTime(86400*30);
        await getRewardStaking(stakingUSDC);
        await withdrawStaking(stakingUSDC);

        expect(await stakingUSDC.lastTimeRewardApplicable()).to.be.gt(0);
        expect(await stakingUSDC.rewardPerToken()).to.be.closeTo(
            parseEther("499999.421296"), MAX_WITHIN);
        expect(await stakingUSDC.earned(owner.address)).to.be.eq(0);
        expect(await stakingUSDC.earned(user0.address)).to.be.eq(0);
    });
});
