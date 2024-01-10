import {ApproveAmount, setupFixture} from "../helpers/utils";
import {formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {updateMarkPrice} from "../helpers/utilsForTest";
import {Token} from "../typechain";
import {ethers} from "hardhat";
import {deployContract} from "../helpers/utils2";

describe("LPool", async () => {

    let vault: any,
        router: any,
        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        positionManager: any,
        vaultPriceFeed: any,
        timelock: any,
        zusd: any,
        zusdPool: any,
        zklp: any,
        zkhlp: any,
        lpool: any,
        hlpool: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault = fixture.vault;
        router = fixture.router;
        weth = fixture.weth;
        wbtc = fixture.wbtc;
        dai = await ethers.getContract<Token>("DAI");
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        positionManager = fixture.positionManager;
        vaultPriceFeed = fixture.vaultPriceFeed;
        timelock = fixture.timelock;
        zusd = fixture.zusd;
        zusdPool = fixture.zusdPool;
        zklp = fixture.zklp;
        zkhlp = fixture.zkhlp;
        lpool = fixture.lpool;
        hlpool = fixture.hlpool;

        await weth.mint(vault.address, parseEther("100"));
        await wbtc.mint(vault.address, parseUnits("10", 8));
        await zusd.mint(vault.address, parseEther("200000"));

        await updateMarkPrice(['weth', 'wbtc']);
        await vault.buyZKUSD(weth.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc']);
        await vault.buyZKUSD(wbtc.address, user1.address);
        await updateMarkPrice(['weth', 'wbtc']);
        await vault.buyZKUSD(zusd.address, user1.address);
    })

    async function exchange(signer, amount) {
        await dai.mint(signer.address, amount);
        await dai.connect(signer).approve(zusdPool.address, ApproveAmount);
        await zusdPool.connect(signer).exchange(dai.address, amount);
    }

    it("check buy & redeem lp at same price", async () => {
        let amount = parseEther("1000");
        await dai.mint(user0.address, amount);
        await dai.connect(user0).approve(lpool.address, ApproveAmount);

        // buy
        await lpool.connect(user0).buyLP(dai.address, amount);
        expect(await dai.balanceOf(lpool.address)).to.equal(amount);
        expect(await zklp.balanceOf(user0.address)).to.equal(amount);
        expect(await zklp.totalSupply()).to.equal(amount);

        // redeem
        await lpool.connect(user0).redeemLP(dai.address, amount);
        expect(await dai.balanceOf(user0.address)).to.equal(amount);
        expect(await zklp.totalSupply()).to.equal(0);
    });

    it("check redeem lp at lower price", async () => {
        let amount = parseEther("1000");
        await dai.mint(user0.address, amount);
        await dai.connect(user0).approve(lpool.address, ApproveAmount);

        // buy
        await lpool.connect(user0).buyLP(dai.address, amount);
        expect(await dai.balanceOf(lpool.address)).to.equal(amount);
        expect(await zklp.balanceOf(user0.address)).to.equal(amount);
        expect(await zklp.totalSupply()).to.equal(amount);

        // transfer loss
        await lpool.transfer(dai.address, zusdPool.address, parseEther("100"));
        expect(formatUnits(await lpool.lpPrice(), 8)).to.eq("0.9");

        // redeem
        await lpool.connect(user0).redeemLP(dai.address, amount);
        expect(await dai.balanceOf(user0.address)).to.equal(parseEther("900"));
        expect(await zklp.totalSupply()).to.equal(0);
    });

    it("check redeem lp at higher price", async () => {
        let amount = parseEther("1000");
        await dai.mint(user0.address, amount);
        await dai.connect(user0).approve(lpool.address, ApproveAmount);

        // buy
        await lpool.connect(user0).buyLP(dai.address, amount);
        expect(await dai.balanceOf(lpool.address)).to.equal(amount);
        expect(await zklp.balanceOf(user0.address)).to.equal(amount);
        expect(await zklp.totalSupply()).to.equal(amount);

        // transfer profit
        await exchange(owner, parseEther("100"));
        await zusdPool.transfer(dai.address, lpool.address, parseEther("100"));
        expect(formatUnits(await lpool.lpPrice(), 8)).to.eq("1.1");

        // redeem
        await lpool.connect(user0).redeemLP(dai.address, amount);
        expect(await dai.balanceOf(user0.address)).to.equal(parseEther("1100"));
        expect(await zklp.totalSupply()).to.equal(0);
    });

    it("check buy & redeem with usdc & dai", async () => {
        let usdc = await deployContract("Token", ["USDC", 6, 0, 0, 0]);
        await lpool.setWhitelistToken(usdc.address, true);
        let amount = parseUnits("1000", 6);
        await usdc.mint(user0.address, amount);
        await usdc.connect(user0).approve(lpool.address, ApproveAmount);

        // buy 1
        await lpool.connect(user0).buyLP(usdc.address, amount);
        expect(await usdc.balanceOf(lpool.address)).to.equal(amount);
        expect(await zklp.balanceOf(user0.address)).to.equal(parseEther("1000"));
        expect(await zklp.totalSupply()).to.equal(parseEther("1000"));

        let amount2 = parseEther("1000");
        await dai.mint(user0.address, amount2);
        await dai.connect(user0).approve(lpool.address, ApproveAmount);

        // buy 2
        await lpool.connect(user0).buyLP(dai.address, amount2);
        expect(await dai.balanceOf(lpool.address)).to.equal(amount2);
        expect(await zklp.balanceOf(user0.address)).to.equal(parseEther("2000"));
        expect(await zklp.totalSupply()).to.equal(parseEther("2000"));

        expect(await lpool.aum()).to.eq(parseEther("2000"));
        expect(formatUnits(await lpool.lpPrice(), 8)).to.eq("1.0");
    });
});

