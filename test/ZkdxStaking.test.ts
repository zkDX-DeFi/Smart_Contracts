import {AddressZero, ApproveAmount, forwardTime, setupFixture} from "../helpers/utils";
import {formatEther, parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {ethers} from "hardhat";
import {MAX_WITHIN} from "../helpers/constants";
import {deployContract, getEthNumber} from "../helpers/utils2";

describe("ZkdxStaking", async () => {

    let usdc: any,
        weth: any,
        owner: any,
        user0: any,
        user1:any,
        esZkdx: any,
        stakingUSDC: any,
        stakingETH: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        usdc = fixture.usdc;
        weth = fixture.wnative;
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        esZkdx = fixture.esZKDX;
        stakingUSDC = fixture.stakingUSDC;
        stakingETH = fixture.stakingETH;

    })

    it("check stake & withdraw - USDC", async () => {
        // add reward
        let rewardAmount = parseEther("10000");
        await stakingUSDC.setRewardsDuration(100);
        await esZkdx.mint(stakingUSDC.address, rewardAmount);
        await stakingUSDC.notifyRewardAmount(rewardAmount);

        // stake
        let stakeAmount = parseEther("1");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC.address, ApproveAmount);
        await stakingUSDC.connect(user0).stake(stakeAmount);

        // withdraw suc
        await forwardTime(100);
        expect(await stakingUSDC.earned(user0.address)).to.gt(parseEther("9500"));
        await stakingUSDC.connect(user0).withdraw(stakeAmount);
        expect(await stakingUSDC.balanceOf(user0.address)).to.equal(0);
        expect(await stakingUSDC.earned(user0.address)).to.equal(0);
        expect(await esZkdx.balanceOf(user0.address)).to.gt(parseEther("9500"));
        expect(await usdc.balanceOf(user0.address)).to.eq(stakeAmount);
    });

    it("check stake & withdraw - ETH", async () => {
        // add reward
        let rewardAmount = parseEther("10000");
        await stakingETH.setRewardsDuration(100);
        await esZkdx.mint(stakingETH.address, rewardAmount);
        await stakingETH.notifyRewardAmount(rewardAmount);

        // stake
        let stakeAmount = parseEther("1");
        await stakingETH.connect(user0).stake({value: stakeAmount});

        // withdraw suc
        await forwardTime(100);
        let balanceBefore = await ethers.provider.getBalance(user0.address);
        expect(await stakingETH.earned(user0.address)).to.gt(parseEther("9500"));
        await stakingETH.connect(user0).withdraw(stakeAmount);
        expect(await stakingETH.balanceOf(user0.address)).to.equal(0);
        expect(await stakingETH.earned(user0.address)).to.equal(0);
        expect(await esZkdx.balanceOf(user0.address)).to.gt(parseEther("9500"));
        let balanceAfter = await ethers.provider.getBalance(user0.address);
        expect(balanceAfter).to.be.closeTo(balanceBefore.add(stakeAmount), MAX_WITHIN);
    });

    //  5M / month
    //  8M / month
    // 10M / month
    // 12M / month
    // 15M / month

    it("check raise reward rate", async () => {
        // add reward
        let duration = 86400 * 30;  // 1 month
        await stakingUSDC.setRewardsDuration(duration);
        await esZkdx.transfer(stakingUSDC.address, parseEther("25000000"));
        await stakingUSDC.notifyRewardAmount(parseEther("5000000")); // 5M / month

        // user0 stake
        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC.address, ApproveAmount);
        await stakingUSDC.connect(user0).stake(stakeAmount);

        await forwardTime(86400 * 15);

        // user1 stake
        await usdc.mint(user1.address, stakeAmount);
        await usdc.connect(user1).approve(stakingUSDC.address, ApproveAmount);
        await stakingUSDC.connect(user1).stake(stakeAmount);
        await stakingUSDC.notifyRewardAmount(parseEther("10000000")); // 10M / month

        await forwardTime(duration);
        let reward0 = await stakingUSDC.earned(user0.address);
        let reward1 = await stakingUSDC.earned(user1.address);
        expect(getEthNumber(reward0)).to.be.closeTo(7500000, 10);
        expect(getEthNumber(reward1)).to.be.closeTo(5000000, 10);

        // withdraw
        await stakingUSDC.connect(user0).withdraw(stakeAmount);
        await stakingUSDC.connect(user1).withdraw(stakeAmount);
        let balance0 = await esZkdx.balanceOf(user0.address);
        let balance1 = await esZkdx.balanceOf(user1.address);
        expect(getEthNumber(balance0)).to.be.closeTo(7500000, 10);
        expect(getEthNumber(balance1)).to.be.closeTo(5000000, 10);
        expect(await stakingUSDC.earned(user0.address)).to.eq(0);
        expect(await stakingUSDC.earned(user1.address)).to.eq(0);

        let stakingEsBalance = await esZkdx.balanceOf(stakingUSDC.address);
        expect(getEthNumber(stakingEsBalance)).to.be.closeTo(25000000 - 12500000, 100);
    });

    it("check lower reward rate", async () => {
        // add reward
        let duration = 86400 * 30;  // 1 month
        await stakingUSDC.setRewardsDuration(duration);
        await esZkdx.transfer(stakingUSDC.address, parseEther("25000000"));
        await stakingUSDC.notifyRewardAmount(parseEther("10000000")); // 10M / month

        // user0 stake
        let stakeAmount = parseEther("1000");
        await usdc.mint(user0.address, stakeAmount);
        await usdc.connect(user0).approve(stakingUSDC.address, ApproveAmount);
        await stakingUSDC.connect(user0).stake(stakeAmount);

        await forwardTime(86400 * 15);

        // user1 stake
        await usdc.mint(user1.address, stakeAmount);
        await usdc.connect(user1).approve(stakingUSDC.address, ApproveAmount);
        await stakingUSDC.connect(user1).stake(stakeAmount);
        await stakingUSDC.notifyRewardAmount(parseEther("5000000")); // 5M / month

        await forwardTime(duration);
        let reward0 = await stakingUSDC.earned(user0.address);
        let reward1 = await stakingUSDC.earned(user1.address);
        expect(getEthNumber(reward0)).to.be.closeTo(7500000, 20);
        expect(getEthNumber(reward1)).to.be.closeTo(2500000, 20);

        // withdraw
        await stakingUSDC.connect(user0).withdraw(stakeAmount);
        await stakingUSDC.connect(user1).withdraw(stakeAmount);
        let balance0 = await esZkdx.balanceOf(user0.address);
        let balance1 = await esZkdx.balanceOf(user1.address);
        expect(getEthNumber(balance0)).to.be.closeTo(7500000, 20);
        expect(getEthNumber(balance1)).to.be.closeTo(2500000, 20);
        expect(await stakingUSDC.earned(user0.address)).to.eq(0);
        expect(await stakingUSDC.earned(user1.address)).to.eq(0);

        let stakingEsBalance = await esZkdx.balanceOf(stakingUSDC.address);
        expect(getEthNumber(stakingEsBalance)).to.be.closeTo(25000000 - 10000000, 100);
    });

    it("check lower reward rate", async () => {
        let duration = 86400 * 30;
        await stakingUSDC.setRewardsDuration(duration);
        await esZkdx.transfer(stakingUSDC.address, parseEther("25000000"));
        await expect(
            stakingUSDC.connect(user0).notifyRewardAmount(parseEther("10000000"))
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(
            stakingUSDC.notifyRewardAmount(parseEther("0"))
        ).to.be.revertedWith("ZkdxStaking: reward rate wrong");
        await expect(
            stakingUSDC.notifyRewardAmount(parseEther("25000001"))
        ).to.be.revertedWith("ZkdxStaking: reward amount wrong");

        await stakingUSDC.notifyRewardAmount(parseEther("10000000"));

        let stakeAmount = parseEther("1.23456");
        await usdc.mint(user1.address, parseEther("1000"));
        await usdc.connect(user1).approve(stakingUSDC.address, ApproveAmount);
        await stakingUSDC.connect(user1).stake(stakeAmount);

        const s = stakingUSDC;
        await s.setPaused(true);
        await expect(s.connect(user1).stake(stakeAmount))
            .to.be.revertedWith("Pausable: paused");
        await expect(s.connect(user1).withdraw(parseEther("0.0001")))
            .to.be.revertedWith("Pausable: paused");

        await s.setPaused(false);
        await expect(s.connect(user1).stake(0))
            .to.be.revertedWith("ZkdxStaking: amount must be bigger than 0");

        await expect(s.connect(user1).withdraw(0))
            .to.be.revertedWith("ZkdxStaking: amount must be bigger than 0");
        await s.connect(user1).withdraw(parseEther("0.0001"));

        await forwardTime(duration);
        await s.setPaused(true);
        await expect(s.connect(user1).getReward())
            .to.be.revertedWith("Pausable: paused");
    });

    it("check StakingETH.func => setPaused", async () => {
        const s = stakingETH;
        let rewardAmount = parseEther("10000");
        await s.setRewardsDuration(100);
        await esZkdx.mint(s.address, rewardAmount);

        await expect(s.connect(user0).notifyRewardAmount(rewardAmount))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await expect(s.notifyRewardAmount(0))
            .to.be.revertedWith("ZkdxStaking: reward rate wrong");
        await expect(s.notifyRewardAmount(parseEther("10001")))
            .to.be.revertedWith("ZkdxStaking: reward amount wrong");
        await s.notifyRewardAmount(rewardAmount);

        let stakeAmount = parseEther("1");
        await expect(s.stake({value: 0}))
            .to.be.revertedWith("ZkdxStaking: amount must be bigger than 0");
        await s.stake({value: stakeAmount});


        await expect(s.withdraw(0))
            .to.be.revertedWith("ZkdxStaking: amount must be bigger than 0");
        await expect(s.withdraw(parseEther("0.0001")));
        await forwardTime(100);

        const s2 = await deployContract("ZkdxStakingETH", [AddressZero,esZkdx.address, weth.address]);


    });

    it("check StakingETH.func => _transferOutETH", async () => {
        const s = stakingETH;
        let rewardAmount = parseEther("10000");
        await s.setRewardsDuration(100);
        await esZkdx.mint(s.address, rewardAmount);

        await s.stake({value: parseEther("1")});
        await expect(s.withdraw(parseEther("1.1"))).to.be.reverted;
    });
});
