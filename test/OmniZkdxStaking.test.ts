import {ApproveAmount, forwardTime, newWallet, reportGasUsed, setupFixture} from "../helpers/utils";
import {ethers} from "hardhat";
import {formatEther, formatUnits, parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {DEFAULT_WITHIN, MAX_WITHIN} from "../helpers/constants";
import {deployContract} from "../helpers/utils2";

// OmniStaking Stages
// * claim rewards to multichain
//     * esZKDXOmni - with LayerZero
// * staking - stake in from multichain
//     * omniStaking - with LayerZero & Stargate
// * staking - withdraw out to multichain
//     * omniStaking - with LayerZero & Stargate

describe("OmniZkdxStaking", async () => {

    let owner: any,
        user0: any,
        user1: any,
        user2: any,
        usdc: any,
        lzEndPoint1: any,
        lzEndPoint2: any,
        stgRouter1: any,
        stgFactory1: any,
        stgBridge1: any,
        stgRouter2: any,
        stgFactory2: any,
        stgBridge2: any,
        poolUsdc1: any,
        poolUsdc2: any,
        omniZDKX1: any,
        omniZDKX2: any,
        stakingUSDC1: any,
        stakingUSDC2: any,
        SGETH1: any,
        SGETH2: any,
        stgRouterETH1: any,
        stgRouterETH2: any,
        stakingETH1: any,
        stakingETH2: any,
        poolEth1: any,
        poolEth2: any;

    let rewardAmount = parseEther("10000");
    let chainId1 = 31337;
    let chainId2 = 31338;
    let poolIdUsdc = 1;
    let poolIdEth = 13;
    let messageFee = parseEther('0.025');
    let TYPE_STAKE = 1;
    let TYPE_WITHDRAW = 2;
    let TYPE_CLAIM = 3;


    beforeEach(async () => {
        ({owner, user0, user1, user2} = await setupFixture());

        // init lz endpoint
        lzEndPoint1 = await deployContract("LZEndpoint", [chainId1]);
        lzEndPoint2 = await deployContract("LZEndpoint", [chainId2]);
        usdc = await deployContract("Token", ["USDC", 18, parseEther("0"), parseEther("0"), 0]);

        await initStargate();
        await initStaking();
    })

    async function initStargate() {
        // init stg contracts
        stgRouter1 = await deployContract("StgRouter", []);
        stgBridge1 = await deployContract("Bridge", [lzEndPoint1.address, stgRouter1.address]);
        stgFactory1 = await deployContract("Factory", [stgRouter1.address]);
        await stgRouter1.setBridgeAndFactory(stgBridge1.address, stgFactory1.address);
        let feeLibrary1 = await deployContract("StargateFeeLibraryV02", [stgFactory1.address]);
        await stgFactory1.setDefaultFeeLibrary(feeLibrary1.address);

        stgRouter2 = await deployContract("StgRouter", []);
        stgBridge2 = await deployContract("Bridge", [lzEndPoint2.address, stgRouter2.address]);
        stgFactory2 = await deployContract("Factory", [stgRouter2.address]);
        await stgRouter2.setBridgeAndFactory(stgBridge2.address, stgFactory2.address);
        let feeLibrary2 = await deployContract("StargateFeeLibraryV02", [stgFactory2.address]);
        await stgFactory2.setDefaultFeeLibrary(feeLibrary2.address);

        // set bridge endpoint
        await lzEndPoint1.setDestLzEndpoint(stgBridge2.address, lzEndPoint2.address);
        await lzEndPoint2.setDestLzEndpoint(stgBridge1.address, lzEndPoint1.address);

        // set trusted remote - lz mock endpoint
        await stgBridge1.setBridge(
            chainId2,
            ethers.utils.solidityPack(["address", "address"], [stgBridge2.address, stgBridge1.address])
        );
        await stgBridge2.setBridge(
            chainId1,
            ethers.utils.solidityPack(["address", "address"], [stgBridge1.address, stgBridge2.address])
        );

        // set gas amount
        await stgBridge1.setGasAmount(chainId2, 1, 500000);
        await stgBridge1.setGasAmount(chainId2, 2, 500000);
        await stgBridge2.setGasAmount(chainId1, 1, 500000);
        await stgBridge2.setGasAmount(chainId1, 2, 500000);

        // ============================= init pool usdc =================================
        await stgRouter1.createPool(poolIdUsdc, usdc.address, 8, 18, "USDC", "USDC");
        await stgRouter2.createPool(poolIdUsdc, usdc.address, 8, 18, "USDC", "USDC");
        await stgRouter1.createChainPath(poolIdUsdc, chainId2, poolIdUsdc, 10);
        await stgRouter2.createChainPath(poolIdUsdc, chainId1, poolIdUsdc, 10);

        poolUsdc1 = await stgFactory1.getPool(poolIdUsdc);
        poolUsdc2 = await stgFactory2.getPool(poolIdUsdc);

        // add liquidity
        await usdc.mint(owner.address, parseEther("10000"));
        await usdc.approve(stgRouter1.address, ApproveAmount);
        await usdc.approve(stgRouter2.address, ApproveAmount);
        await stgRouter1.addLiquidity(poolIdUsdc, parseEther("1000"), owner.address);
        await stgRouter1.activateChainPath(poolIdUsdc, chainId2, poolIdUsdc);
        await stgRouter2.addLiquidity(poolIdUsdc, parseEther("2000"), owner.address);
        await stgRouter2.activateChainPath(poolIdUsdc, chainId1, poolIdUsdc);

        // ====================== check paths ======================
        let pool1 = await ethers.getContractAt("Pool", poolUsdc1);
        let len1 = await pool1.getChainPathsLength();
        let path1 = await pool1.chainPaths(0);
        // console.log("len1:", len1.toNumber());
        // console.log("credits:", formatUnits(path1.credits, 8));
        // console.log("balance1:", formatUnits(path1.balance, 8));
        // console.log("idealBalance1:", formatUnits(path1.idealBalance, 8));
        let pool2 = await ethers.getContractAt("Pool", poolUsdc2);
        let len2 = await pool2.getChainPathsLength();
        let path2 = await pool2.chainPaths(0);
        // console.log("len2:", len2.toNumber());
        // console.log("credits:", formatUnits(path2.credits, 8));
        // console.log("balance1:", formatUnits(path1.balance, 8));
        // console.log("idealBalance1:", formatUnits(path1.idealBalance, 8));

        // send credits
        await stgRouter1.sendCredits(chainId2, poolIdUsdc, poolIdUsdc, owner.address, {value: messageFee})
        await stgRouter2.sendCredits(chainId1, poolIdUsdc, poolIdUsdc, owner.address, {value: messageFee});

        // path1 = await pool1.chainPaths(0);
        // console.log("credits:", formatUnits(path1.credits, 8));
        // console.log("balance1:", formatUnits(path1.balance, 8));
        // console.log("idealBalance1:", formatUnits(path1.idealBalance, 8));
        //
        // path2 = await pool2.chainPaths(0);
        // console.log("credits:", formatUnits(path2.credits, 8));
        // console.log("balance2:", formatUnits(path2.balance, 8));
        // console.log("idealBalance2:", formatUnits(path2.idealBalance, 8));

        // ============================= init pool eth =================================
        SGETH1 = await deployContract("StargateEthVault", []);
        SGETH2 = await deployContract("StargateEthVault", []);

        stgRouterETH1 = await deployContract("RouterETH", [SGETH1.address, stgRouter1.address, poolIdEth]);
        stgRouterETH2 = await deployContract("RouterETH", [SGETH2.address, stgRouter2.address, poolIdEth]);

        await stgRouter1.createPool(poolIdEth, SGETH1.address, 8, 18, "SGETH", "SGETH");
        await stgRouter2.createPool(poolIdEth, SGETH2.address, 8, 18, "SGETH", "SGETH");
        await stgRouter1.createChainPath(poolIdEth, chainId2, poolIdEth, 10);
        await stgRouter2.createChainPath(poolIdEth, chainId1, poolIdEth, 10);

        poolEth1 = await stgFactory1.getPool(poolIdEth);
        poolEth2 = await stgFactory2.getPool(poolIdEth);
        await SGETH1.setNoUnwrapTo(poolEth1);
        await SGETH2.setNoUnwrapTo(poolEth2);

        await stgRouterETH1.addLiquidityETH({value: parseEther("1000")});
        await stgRouter1.activateChainPath(poolIdEth, chainId2, poolIdEth);
        await stgRouterETH2.addLiquidityETH({value: parseEther("2000")});
        await stgRouter2.activateChainPath(poolIdEth, chainId1, poolIdEth);

        await stgRouter1.sendCredits(chainId2, poolIdEth, poolIdEth, owner.address, {value: messageFee})
        await stgRouter2.sendCredits(chainId1, poolIdEth, poolIdEth, owner.address, {value: messageFee});
    }

    async function initStaking() {
        omniZDKX1 = await deployContract("esZKDXOmni", [lzEndPoint1.address, owner.address]);
        omniZDKX2 = await deployContract("esZKDXOmni", [lzEndPoint2.address, owner.address]);

        await lzEndPoint1.setDestLzEndpoint(omniZDKX2.address, lzEndPoint2.address);
        await lzEndPoint2.setDestLzEndpoint(omniZDKX1.address, lzEndPoint1.address);

        await omniZDKX1.setTrustedRemote(
            chainId2,
            ethers.utils.solidityPack(["address", "address"], [omniZDKX2.address, omniZDKX1.address])
        );
        await omniZDKX2.setTrustedRemote(
            chainId1,
            ethers.utils.solidityPack(["address", "address"], [omniZDKX1.address, omniZDKX2.address])
        );

        stakingUSDC1 = await deployContract("OmniZkdxStakingERC20", [usdc.address, omniZDKX1.address, 1000,
            stgRouter1.address, lzEndPoint1.address, chainId1, owner.address]);
        stakingUSDC2 = await deployContract("OmniZkdxStakingERC20", [usdc.address, omniZDKX2.address, 1000,
            stgRouter2.address, lzEndPoint2.address, chainId2, owner.address]);
        await stakingUSDC1.setGasLookup([1, 3], [200000, 200000]);

        stakingETH1 = await deployContract("OmniZkdxStakingETH", [omniZDKX1.address, 1000, stgRouterETH1.address,
            lzEndPoint1.address, chainId1, owner.address]);
        stakingETH2 = await deployContract("OmniZkdxStakingETH", [omniZDKX2.address, 1000, stgRouterETH2.address,
            lzEndPoint2.address, chainId2, owner.address]);
        await stakingETH1.setGasLookup([1, 3], [200000, 200000]);
    }

    it("check mint suc", async function () {
        let mintAmount = parseEther("1000");
        await omniZDKX1.mint(user0.address, mintAmount);
        await omniZDKX2.mint(user0.address, mintAmount);
        expect(await omniZDKX1.balanceOf(user0.address)).to.eq(mintAmount);
        expect(await omniZDKX2.balanceOf(user0.address)).to.eq(mintAmount);
    });

    it("check swap USDC remote suc", async function () {
        let refundWallet = newWallet();
        let quoteData = await stgRouter1.quoteLayerZeroFee(
            chainId2,                 // destination chainId
            1,                       // function type: see Bridge.sol for all types
            owner.address,                  // destination of tokens
            "0x",                       // payload, using abi.encode()
            ({
                dstGasForCall: 0,       // extra gas, if calling smart contract,
                dstNativeAmount: 0,     // amount of dust dropped in destination wallet
                dstNativeAddr: '0x' // destination wallet for dust
            })
        )
        // console.log("swapFee:", formatEther(quoteData[0]));

        await stgRouter1.swap(
            chainId2, // dstChainId
            poolIdUsdc, // srcPoolId
            poolIdUsdc, // dstPoolId
            refundWallet.address, // refundAddress
            parseEther("100"), // amountIn
            parseEther("90"), // minOut
            {dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: '0x'},
            user1.address, // recipient
            "0x",
            {value: quoteData[0]}
        );
        expect(await usdc.balanceOf(poolUsdc1)).to.eq(parseEther("1100"));
        expect(await usdc.balanceOf(poolUsdc2)).to.gt(parseEther("1900"));
        // - eqFee: 300000 - lpFee: 4500000 - protocolFee: 1200000
        expect(await usdc.balanceOf(user1.address)).to.eq(parseEther("99.94"));
        expect(await ethers.provider.getBalance(refundWallet.address)).to.gt(0);
    })

    it("check swap ETH remote suc", async function () {
        let refundWallet = newWallet();
        let receiver = newWallet();
        let quoteData = await stgRouter1.quoteLayerZeroFee(
            chainId2,                 // destination chainId
            1,                       // function type: see Bridge.sol for all types
            receiver.address,                  // destination of tokens
            "0x",                       // payload, using abi.encode()
            ({
                dstGasForCall: 0,       // extra gas, if calling smart contract,
                dstNativeAmount: 0,     // amount of dust dropped in destination wallet
                dstNativeAddr: '0x' // destination wallet for dust
            })
        )
        // console.log("swapFee:", formatEther(quoteData[0]));

        let amountIn = parseEther("10");
        await stgRouterETH1.swapETH(
            chainId2, // dstChainId
            refundWallet.address, // refundAddress
            receiver.address, // recipient
            amountIn, // amountIn
            0, // minOut
            {value: quoteData[0].add(amountIn)}
        );
        expect(await ethers.provider.getBalance(SGETH1.address)).to.eq(parseEther("1010"));
        expect(await ethers.provider.getBalance(SGETH2.address)).to.gt(parseEther("1990"));
        expect(await ethers.provider.getBalance(receiver.address)).to.eq(parseEther("9.994"));
        expect(await ethers.provider.getBalance(refundWallet.address)).to.gt(0);
    })

    it("check stake USDC local suc", async () => {
        // init staking2 reward
        await omniZDKX2.mint(stakingUSDC2.address, rewardAmount);
        await stakingUSDC2.setRewardChainId(chainId2, true);
        await stakingUSDC2.setPoolIds([chainId1, chainId2], [poolIdUsdc, poolIdUsdc]);

        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC2.address, ApproveAmount);
        let tx = await stakingUSDC2.connect(user0).stake(chainId2, stakeAmount);
        await reportGasUsed(tx, "stake gasLimit:"); // 127929
        await stakingUSDC2.notifyRewardAmount(rewardAmount);

        await forwardTime(1000);
        await stakingUSDC2.connect(user0).claimReward(chainId2);
        expect(await omniZDKX2.balanceOf(user0.address)).to.eq(rewardAmount);
    })

    it("check stake USDC remote suc", async function () {
        // init staking2 reward
        await omniZDKX2.mint(stakingUSDC2.address, rewardAmount);
        await stakingUSDC1.setRewardChainId(chainId2, true);
        await stakingUSDC1.setPoolIds([chainId1, chainId2], [poolIdUsdc, poolIdUsdc]);
        await stakingUSDC1.setRemoteStakings([chainId2], [stakingUSDC2.address]);

        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC1.address, ApproveAmount);

        let stakeFee = await stakingUSDC1.quoteLayerZeroFee(chainId2, TYPE_STAKE);
        console.log("stakeFee:", formatEther(stakeFee[0]));
        await stakingUSDC1.connect(user0).stake(chainId2, stakeAmount, {value: stakeFee[0]});
        await stakingUSDC2.notifyRewardAmount(rewardAmount);
        expect(await stakingUSDC2.balanceOf(user0.address)).to.gt(parseEther("999"));

        await forwardTime(1000);
        await stakingUSDC2.connect(user0).claimReward(chainId2);
        expect(await omniZDKX2.balanceOf(user0.address)).to.be.closeTo(rewardAmount, DEFAULT_WITHIN);
    })

    it("check stake ETH local suc", async () => {
        // init staking2 reward
        await omniZDKX2.mint(stakingETH2.address, rewardAmount);
        await stakingETH2.setRewardChainId(chainId2, true);
        await stakingETH2.setPoolIds([chainId1, chainId2], [poolIdEth, poolIdEth]);

        let tx = await stakingETH2.connect(user0).stake(chainId2, parseEther("100"), {value: parseEther("100")});
        await reportGasUsed(tx, "stake ETH gasLimit:");
        await stakingETH2.notifyRewardAmount(rewardAmount);

        await forwardTime(1000);
        await stakingETH2.connect(user0).claimReward(chainId2);
        expect(await omniZDKX2.balanceOf(user0.address)).to.eq(rewardAmount);
    })

    it("check stake ETH remote suc", async function () {
        // init staking2 reward
        await omniZDKX2.mint(stakingETH2.address, rewardAmount);
        await stakingETH1.setRewardChainId(chainId2, true);
        await stakingETH1.setPoolIds([chainId1, chainId2], [poolIdUsdc, poolIdUsdc]);
        await stakingETH1.setRemoteStakings([chainId2], [stakingETH2.address]);

        let stakeAmount = parseEther("1000");
        let stakeFee = await stakingETH1.quoteLayerZeroFee(chainId2, TYPE_STAKE);
        console.log("stakeFee:", formatEther(stakeFee[0]));
        await stakingETH1.connect(user0).stake(chainId2, stakeAmount, {value: stakeFee[0].add(stakeAmount)});
        await stakingETH2.notifyRewardAmount(rewardAmount);
        expect(await stakingETH2.balanceOf(user0.address)).to.gt(parseEther("999"));

        await forwardTime(1000);
        await stakingETH2.connect(user0).claimReward(chainId2);
        expect(await omniZDKX2.balanceOf(user0.address)).to.be.closeTo(rewardAmount, DEFAULT_WITHIN);
    })

    it("check withdraw USDC local suc", async function () {
        await omniZDKX2.mint(stakingUSDC2.address, rewardAmount);
        await stakingUSDC2.setRewardChainId(chainId2, true);
        await stakingUSDC2.setPoolIds([chainId1, chainId2], [poolIdUsdc, poolIdUsdc]);

        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC2.address, ApproveAmount);
        await stakingUSDC2.connect(user0).stake(chainId2, stakeAmount);
        await stakingUSDC2.notifyRewardAmount(rewardAmount);

        await stakingUSDC2.connect(user0).withdraw(chainId2, stakeAmount);
        expect(await usdc.balanceOf(user0.address)).to.eq(stakeAmount);
    })

    it("check withdraw USDC remote suc", async function () {
        // init staking2 reward
        await omniZDKX2.mint(stakingUSDC2.address, rewardAmount);
        await stakingUSDC2.setRewardChainId(chainId2, true);
        await stakingUSDC2.setPoolIds([chainId1, chainId2], [poolIdUsdc, poolIdUsdc]);

        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC2.address, ApproveAmount);
        await stakingUSDC2.connect(user0).stake(chainId2, stakeAmount);
        await stakingUSDC2.notifyRewardAmount(rewardAmount);

        let withdrawFee = await stakingUSDC2.quoteLayerZeroFee(chainId1, TYPE_WITHDRAW);
        console.log("withdrawFee:", formatEther(withdrawFee[0]));
        await stakingUSDC2.connect(user0).withdraw(chainId1, stakeAmount, {value: withdrawFee[0]});
        expect(await usdc.balanceOf(user0.address)).to.gt(parseEther("950"));
        expect(await usdc.balanceOf(poolUsdc1)).to.lt(parseEther("100"));
    })

    it("check withdraw ETH local suc", async function () {
        await omniZDKX2.mint(stakingETH2.address, rewardAmount);
        await stakingETH2.setRewardChainId(chainId2, true);
        await stakingETH2.setPoolIds([chainId1, chainId2], [poolIdEth, poolIdEth]);

        let stakeAmount = parseEther("1000");
        await stakingETH2.connect(user0).stake(chainId2, stakeAmount, {value: stakeAmount});
        await stakingETH2.notifyRewardAmount(rewardAmount);

        let balanceBefore = await ethers.provider.getBalance(user0.address);
        await stakingETH2.connect(user0).withdraw(chainId2, stakeAmount);
        expect(await ethers.provider.getBalance(user0.address)).to.be.closeTo(stakeAmount.add(balanceBefore), MAX_WITHIN);
    })

    it("check withdraw ETH remote suc", async function () {
        // init staking2 reward
        await omniZDKX2.mint(stakingETH2.address, rewardAmount);
        await stakingETH2.setRewardChainId(chainId2, true);
        await stakingETH2.setPoolIds([chainId1, chainId2], [poolIdEth, poolIdEth]);

        let stakeAmount = parseEther("1000");
        await stakingETH2.connect(user0).stake(chainId2, stakeAmount, {value: stakeAmount});
        await stakingETH2.notifyRewardAmount(rewardAmount);

        let withdrawFee = await stakingETH2.quoteLayerZeroFee(chainId1, TYPE_WITHDRAW);
        console.log("withdrawFee:", formatEther(withdrawFee[0]));
        let balanceBefore = await ethers.provider.getBalance(user0.address);
        await stakingETH2.connect(user0).withdraw(chainId1, stakeAmount, {value: withdrawFee[0]});
        expect(await ethers.provider.getBalance(user0.address)).to.gt(parseEther("950").add(balanceBefore));
        expect(await ethers.provider.getBalance(SGETH1.address)).to.lt(parseEther("100"));
    })

    it("claim local suc", async () => {
        await omniZDKX2.mint(stakingUSDC2.address, rewardAmount);
        await stakingUSDC2.setRewardChainId(chainId2, true);

        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC2.address, ApproveAmount);
        await stakingUSDC2.connect(user0).stake(chainId2, stakeAmount);
        await stakingUSDC2.notifyRewardAmount(rewardAmount);

        await forwardTime(1000);
        await stakingUSDC2.connect(user0).claimReward(chainId2);
        expect(await omniZDKX2.balanceOf(user0.address)).to.eq(rewardAmount);
    })

    it("claim remote suc", async () => {
        await omniZDKX2.mint(stakingUSDC2.address, rewardAmount);
        await stakingUSDC2.setRewardChainId(chainId2, true);
        await stakingUSDC2.setPoolIds([chainId1, chainId2], [poolIdUsdc, poolIdUsdc]);

        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC2.address, ApproveAmount);
        await stakingUSDC2.connect(user0).stake(chainId2, stakeAmount);
        await stakingUSDC2.notifyRewardAmount(rewardAmount);

        await forwardTime(1000);
        let claimFee = await stakingUSDC1.quoteLayerZeroFee(chainId1, TYPE_CLAIM);
        console.log("claimFee:", formatEther(claimFee[0]));
        await stakingUSDC2.connect(user0).claimReward(chainId1, {value: claimFee[0]});
        expect(await omniZDKX1.balanceOf(user0.address)).to.eq(rewardAmount);
        expect(await omniZDKX2.balanceOf(user0.address)).to.eq(0);
        expect(await omniZDKX1.totalSupply()).to.eq(rewardAmount);
        expect(await omniZDKX2.totalSupply()).to.eq(0);
    })

    it("check end rewards suc", async () => {
        await omniZDKX2.mint(stakingUSDC2.address, rewardAmount.mul(2));
        await stakingUSDC2.setRewardChainId(chainId2, true);

        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC2.address, ApproveAmount);
        await stakingUSDC2.connect(user0).stake(chainId2, stakeAmount);
        await stakingUSDC2.notifyRewardAmount(rewardAmount);

        await forwardTime(1000);
        await stakingUSDC2.connect(user0).claimReward(chainId2);
        expect(await omniZDKX2.balanceOf(user0.address)).to.eq(rewardAmount);

        await stakingUSDC2.endRewards(user1.address, rewardAmount);
        expect(await omniZDKX2.balanceOf(user1.address)).to.eq(rewardAmount);
    })
});

