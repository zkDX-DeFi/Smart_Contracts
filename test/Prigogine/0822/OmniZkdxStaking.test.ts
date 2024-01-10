import {ApproveAmount, setupFixture} from "../../../helpers/utils";
import {ethers} from "hardhat";
import {parseEther,formatEther} from "ethers/lib/utils";
import {expect} from "chai";
import {deployContract} from "../../../helpers/utils2";
import {constants} from "ethers";

describe("OmniZkdxStaking - Prigogine", async () => {
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
        poolAddress1: any,
        poolAddress2: any,
        omniZKDX1: any,
        omniZKDX2: any,
        omniStaking1: any,
        omniStaking2: any

    let rewardAmount = parseEther("10000");
    let chainId1 = 31337;
    let chainId2 = 31338;
    let poolId1 = 1;
    let poolId2 = 2;
    let messageFee = parseEther('0.025');
    let TYPE_STAKE = 1;
    let TYPE_WITHDRAW = 2;
    let TYPE_CLAIM = 3;

    beforeEach(async () => {
        ({owner, user0, user1, user2} = await setupFixture());
        lzEndPoint1 = await deployContract("LZEndpoint", [chainId1]);
        lzEndPoint2 = await deployContract("LZEndpoint", [chainId2]);
        usdc = await deployContract("Token", ["USDC", 18, parseEther("0"), parseEther("0"), 0]);

        await initStargate();
        await initStaking();
    });
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

        // set trusted remote - stg mock endpoint
        // await stgBridge1.setBridge(
        //     chainId2,
        //     ethers.utils.solidityPack(["address"], [stgBridge2.address])
        // );
        // await stgBridge2.setBridge(
        //     chainId1,
        //     ethers.utils.solidityPack(["address"], [stgBridge1.address])
        // );

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

        // init pool
        await stgRouter1.createPool(poolId1, usdc.address, 8, 18, "USDC", "USDC");
        await stgRouter2.createPool(poolId2, usdc.address, 8, 18, "USDC", "USDC");
        await stgRouter1.createChainPath(poolId1, chainId2, poolId2, 10);
        await stgRouter2.createChainPath(poolId2, chainId1, poolId1, 10);

        poolAddress1 = await stgFactory1.getPool(poolId1);
        poolAddress2 = await stgFactory2.getPool(poolId2);

        // add liquidity
        await usdc.mint(owner.address, parseEther("10000"));
        await usdc.approve(stgRouter1.address, ApproveAmount);
        await usdc.approve(stgRouter2.address, ApproveAmount);
        await stgRouter1.addLiquidity(poolId1, parseEther("1000"), owner.address);
        await stgRouter1.activateChainPath(poolId1, chainId2, poolId2);
        await stgRouter2.addLiquidity(poolId2, parseEther("2000"), owner.address);
        await stgRouter2.activateChainPath(poolId2, chainId1, poolId1);

        // send credits
        await stgRouter1.sendCredits(chainId2, poolId1, poolId2, owner.address, {value: messageFee})
        await stgRouter2.sendCredits(chainId1, poolId2, poolId1, owner.address, {value: messageFee});
    }
    async function initStaking() {
        omniZKDX1 = await deployContract("esZKDXOmni", [lzEndPoint1.address, owner.address]);
        omniZKDX2 = await deployContract("esZKDXOmni", [lzEndPoint2.address, owner.address]);

        await lzEndPoint1.setDestLzEndpoint(omniZKDX2.address, lzEndPoint2.address);
        await lzEndPoint2.setDestLzEndpoint(omniZKDX1.address, lzEndPoint1.address);

        await omniZKDX1.setTrustedRemote(
            chainId2,
            ethers.utils.solidityPack(["address", "address"], [omniZKDX2.address, omniZKDX1.address])
        );
        await omniZKDX2.setTrustedRemote(
            chainId1,
            ethers.utils.solidityPack(["address", "address"], [omniZKDX1.address, omniZKDX2.address])
        );

        omniStaking1 = await deployContract("OmniZkdxStakingERC20", [usdc.address, omniZKDX1.address, 1000,
            stgRouter1.address, lzEndPoint1.address, chainId1, owner.address]);
        omniStaking2 = await deployContract("OmniZkdxStakingERC20", [usdc.address, omniZKDX2.address, 1000,
            stgRouter2.address, lzEndPoint2.address, chainId2, owner.address]);
        await omniStaking1.setGasLookup([1, 3], [200000, 200000]);
    }

    it("check mint suc", async function () {
        let mintAmount = parseEther("1000");
        await omniZKDX1.mint(user0.address, mintAmount);
        await omniZKDX2.mint(user0.address, mintAmount);
        expect(await omniZKDX1.balanceOf(user0.address)).to.eq(mintAmount);
        expect(await omniZKDX2.balanceOf(user0.address)).to.eq(mintAmount);

        console.log(`${formatEther(await omniZKDX1.balanceOf(user0.address))}`);
        console.log(`${formatEther(await omniZKDX2.balanceOf(user0.address))}`);
    });
    it("check og1 => parameters", async function () {
        const os1 = omniStaking1;
        const _user = owner;
        expect(os1.address).not.eq(ethers.constants.AddressZero);
        expect(await os1.stakingToken()).not.eq(constants.AddressZero);
        expect(await os1.rewardsToken()).not.eq(constants.AddressZero);

        expect(await os1.duration()).to.eq(1000);
        expect(await os1.finishAt()).to.eq(0);
        expect(await os1.updatedAt()).to.eq(0);
        expect(await os1.rewardRate()).to.eq(0);
        expect(await os1.rewardPerTokenStored()).to.eq(0);


        expect(await os1.userRewardPerTokenPaid(_user.address)).to.eq(0);
        expect(await os1.rewards(_user.address)).to.eq(0);
        expect(await os1.totalSupply()).eq(0);
        expect(await os1.balanceOf(_user.address)).eq(0);

        expect(await os1.stgRouter()).eq(stgRouter1.address);
        expect(await os1.lzEndPoint()).eq(lzEndPoint1.address);
        expect(await os1.stgRouter()).not.eq(constants.AddressZero);
        expect(await os1.lzEndPoint()).not.eq(constants.AddressZero);

        // check pool id
        expect(await os1.poolIds(chainId1)).eq(0);
        expect(await os1.poolIds(chainId2)).eq(0);
        await os1.setPoolIds([chainId1, chainId2], [poolId1, poolId2]);
        expect(await os1.poolIds(chainId1)).eq(poolId1);
        expect(await os1.poolIds(chainId2)).eq(poolId2);

        // check remote staking
        expect(await os1.remoteStakings(chainId1)).eq(constants.AddressZero);
        await os1.setRemoteStakings([chainId1], [omniStaking1.address]);
        expect(await os1.remoteStakings(chainId1)).not.eq(constants.AddressZero);
        expect(await os1.remoteStakings(chainId1)).eq(omniStaking1.address);
    });

    it("check og1 => parameters v2", async function () {
        const os1 = omniStaking1;
        const os2 = omniStaking2;
        const _user = owner;

        // check reward chain id
        expect(await os1.rewardChainIds(chainId1)).false;
        expect(await os1.rewardChainIds(chainId2)).false;
        await os1.setRewardChainId(chainId2, true);
        expect(await os1.rewardChainIds(chainId1)).false;
        expect(await os1.rewardChainIds(chainId2)).true;

        // check gas lookup
        expect(await os1.gasLookup(0)).eq(0);
        expect(await os1.gasLookup(1)).eq(200000);
        expect(await os1.gasLookup(2)).eq(0);
        expect(await os1.gasLookup(3)).eq(200000);
        await os1.setGasLookup([1, 3], [100000, 100000]);
        expect(await os1.gasLookup(0)).eq(0);
        expect(await os1.gasLookup(1)).eq(100000);
        expect(await os1.gasLookup(2)).eq(0);
        expect(await os1.gasLookup(3)).eq(100000);

        // check lz chain id
        expect(await os1.lzChainId()).eq(chainId1);
        expect(await os2.lzChainId()).eq(chainId2);

        // check views
        expect(await os1.lastTimeRewardApplicable()).eq(0);
        expect(await os1.rewardPerToken()).eq(0);
        expect(await os1.earned(_user.address)).eq(0);
        expect(await os1.quoteLayerZeroFee(chainId1,1)).not.eq(0);
        expect(await os1.quoteLayerZeroFee(chainId1,3)).not.eq(0);

    });
});
