import {AddressZero, ApproveAmount, newWallet, setupFixture, toUsd} from "../../../helpers/utils";
import {expect} from "chai";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {deployContract} from "../../../helpers/utils2";
import {
    getLiqPrice,
    getUpdateData,
    global_buyMLPWithETH,
    global_longWETH_DAIAmountIn,
    shortOperationA,
    updateMarkPrice
} from "../../../helpers/utilsForTest";
import {parse} from "url";

const fs = require('fs');

async function zusd_pool_init(zusdPool: any, user0: any) {
    let usdc = await deployContract("Token", ["USDC", 6, parseEther("10000"), parseEther("100"), 0])
    await zusdPool.setWhitelistToken(usdc.address, true);
    let amountIn = parseUnits("10000", 6);
    await usdc.mint(user0.address, amountIn);
    await usdc.connect(user0).approve(zusdPool.address, ApproveAmount);
    return {usdc, amountIn};
}

describe("BaseToken", async () => {

    let owner: any,
        user0: any,
        user1: any,
        user2: any,
        user3: any,
        nft: any,
        tree: any,
        root: any,
        dai: any,
        multiTransfer: any,
        vault, vu, vec: any,
        bt: any,
        timelock: any,
        pm,router,shortsTracker: any,
        weth,usdc,zkdx,zkdlp, zusd: any,
        dlpManager: any,
        feed: any,
        r, rewardRouter:any,
        zusdPool: any,
        obr: any,
        ob: any,
        staking: any


    beforeEach(async () => {
        let fixture = await setupFixture();
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        user3 = fixture.user3;
        dai = fixture.dai;
        vault = fixture.vault;
        vu = fixture.vaultUtils;
        timelock = fixture.timelock;
        pm = fixture.positionManager;
        router = fixture.router;
        weth = fixture.weth;
        r = fixture.rewardRouter;
        rewardRouter = fixture.rewardRouter
        zusdPool = fixture.zusdPool;
        obr = fixture.orderBookReader;
        ob = fixture.orderBook;
        staking = fixture.stakingUSDC;
        usdc = fixture.usdc;
        zkdx = fixture.ZKDX;
        zkdlp = fixture.zkdlp;
        dlpManager = fixture.zkdlpManager;
        feed =  fixture.vaultPriceFeed;
        zusd = fixture.zusd;
        shortsTracker = fixture.shortsTracker;
        vec = fixture.vaultErrorController;

        bt = await deployContract("BaseToken",
            ['bt', 'bt', parseEther("1000")]);
        await bt.addAdmin(owner.address);
    })

    it("check bt.func => withdrawToken", async () => {
        expect(await bt.name()).eq("bt");

        await dai.mint(bt.address, parseEther("1.23456"));
        await dai.approve(bt.address, parseEther("1.23456"));

        await expect(bt.connect(user0).withdrawToken(
            dai.address,
            user0.address,
            parseEther("1.23456")
        )).to.be.revertedWith("BaseToken: forbidden");
        await bt.withdrawToken(
            dai.address,
            user0.address,
            parseEther("1.23456"));

        await expect(bt.connect(user0)
            .setHandler(user0.address, true))
            .to.be.revertedWith("BaseToken: forbidden");
        await expect(bt.setHandler(user0.address, true)).to.be.ok;
    });

    it("check bt.func => addNonStakingAccount", async () => {
        await bt.addNonStakingAccount(user0.address);
        await expect(bt.addNonStakingAccount(user0.address))
            .to.be.revertedWith("BaseToken: _account already marked");

        await bt.removeNonStakingAccount(user0.address);
        await expect(bt.removeNonStakingAccount(user0.address))
            .to.be.revertedWith("BaseToken: _account not marked");

        await expect(bt.transfer(AddressZero, parseEther("1")))
            .to.be.revertedWith("BaseToken: transfer to the zero address");

        await bt.setInPrivateTransferMode(true);
        await bt.setHandler(owner.address, true);
        await bt.transfer(user0.address, parseEther("1"));

        await bt.setHandler(owner.address, false);
        await expect(bt.transfer(user0.address, parseEther("1")))
            .to.be.revertedWith("BaseToken: msg.sender not whitelisted");
    });

    it("check bt.func => _mint", async() => {
        await bt.addNonStakingAccount(owner.address);
        await bt.transfer(user0.address, parseEther("1.23456"));


        await bt.addNonStakingAccount(user0.address);
        await bt.transfer(user0.address, parseEther("1.23456"));

        await expect(bt.approve(AddressZero, parseEther("1.23456")))
            .to.be.revertedWith("BaseToken: approve to the zero address");

        const bt2 = await deployContract("BaseToken",
            ['bt2', 'bt2', parseEther("1000")]);
        const _yieldTrackers = [bt2.address];
        await bt.setYieldTrackers(_yieldTrackers);

        await expect(bt.transfer(user0.address, parseEther("1.23456")))
            .to.be.reverted;

        await expect(bt.recoverClaim(user0.address, user1.address)).to.be.reverted;

        await expect(bt.connect(user0).recoverClaim(user0.address, user1.address))
            .to.be.revertedWith("BaseToken: forbidden");

        await expect(bt.claim(user0.address)).to.be.reverted;
    });

    it("check bt.func => _mint", async() => {
        const bt = await deployContract("MintableBaseToken",
            ['mt', 'mt', parseEther("1000")]);
        await bt.setMinter(owner.address,true);
        await bt.addAdmin(owner.address);

        await expect(bt.mint(AddressZero, parseEther("1.23456")))
            .to.be.revertedWith("BaseToken: mint to the zero address");

        console.log(`${await bt.nonStakingAccounts(user0.address)}`);
        await bt.mint(user0.address, parseEther("1.23456"));

        await bt.addNonStakingAccount(user0.address);
        console.log(`${await bt.nonStakingAccounts(user0.address)}`);
        await bt.mint(user0.address, parseEther("1.23456"));

        await bt.mint(user0.address, parseEther("1000"));
        await expect(bt.burn(AddressZero, parseEther("1.23456")))
            .to.be.revertedWith("BaseToken: burn from the zero address");

        console.log(`${await bt.nonStakingAccounts(user0.address)}`);
        await bt.burn(user0.address, parseEther("1.23456"));

        await bt.removeNonStakingAccount(user0.address);
        console.log(`${await bt.nonStakingAccounts(user0.address)}`);
        await bt.burn(user0.address, parseEther("1.23456"));

        console.log(`${await bt.isHandler(owner.address)}`);

        await expect(bt.transferFrom(AddressZero, user0.address, 0))
            .to.be.revertedWith("BaseToken: approve from the zero address");
        await bt.setHandler(owner.address, true);
        console.log(`${await bt.isHandler(owner.address)}`);
        await expect(bt.transferFrom(AddressZero, user0.address, parseEther("1.23456")))
            .to.be.revertedWith("BaseToken: transfer from the zero address");
    });

    it("check YieldToken.func => _mint", async() => {
        const bt = await deployContract("ZKUSD", [vault.address]);

        await bt.addVault(owner.address);
        await bt.addAdmin(owner.address);
        await bt.mint(owner.address, parseEther("1000"));

        await expect(bt.mint(AddressZero, parseEther("1.23456"))).to.be.reverted;

        await bt.mint(user0.address, parseEther("1.23456"));
        await bt.addNonStakingAccount(user0.address);
        await bt.mint(user0.address, parseEther("1.23456"));

        await bt.mint(user0.address, parseEther("1000"));
        await expect(bt.burn(AddressZero, parseEther("1.23456")))
            .to.be.revertedWith("YieldToken: burn from the zero address");

        await bt.burn(user0.address, parseEther("1.23456"));
        await bt.removeNonStakingAccount(user0.address);
        await bt.burn(user0.address, parseEther("1.23456"));

        await expect(bt.transfer(AddressZero, parseEther("1")))
            .to.be.revertedWith("YieldToken: transfer to the zero address");
        await expect(bt.transferFrom(AddressZero, user0.address, parseEther("0")))
            .to.be.revertedWith("YieldToken: approve from the zero address");
        await expect(bt.approve(AddressZero, parseEther("1.23456")))
            .to.be.revertedWith("YieldToken: approve to the zero address");

        console.log(`${await bt.inWhitelistMode()}`);

        await bt.setInWhitelistMode(true);
        await expect(bt.transfer(user0.address, parseEther("1.23456")))
            .to.be.revertedWith("YieldToken: msg.sender not whitelisted");

        await bt.setWhitelistedHandler(owner.address, true);
        await bt.transfer(user0.address, parseEther("1.23456"));

        console.log(`${await bt.nonStakingAccounts(user0.address)}`);
        await bt.transfer(user0.address, parseEther("1.23456"));
        await bt.addNonStakingAccount(user0.address);
        console.log(`${await bt.nonStakingAccounts(user0.address)}`);
        await bt.transfer(user0.address, parseEther("1.23456"));

        console.log(`${await bt.nonStakingAccounts(owner.address)}`);
        await bt.transfer(user0.address, parseEther("1.23456"));
        await bt.addNonStakingAccount(owner.address);
        console.log(`${await bt.nonStakingAccounts(owner.address)}`);
        await bt.transfer(user0.address, parseEther("1.23456"));

        await bt.setYieldTrackers([bt.address]);
        await expect(bt.transfer(user0.address, parseEther("1.23456")))
            .to.be.reverted;

        await expect(bt.recoverClaim(user0.address, user1.address)).to.be.reverted;
        await expect(bt.connect(user0).recoverClaim(user0.address, user1.address)).to.be.reverted;
        await expect(bt.claim(user0.address)).to.be.reverted;
    });

    it("check YieldToken.func => withdrawToken", async() => {
        const bt = await deployContract("ZKUSD", [vault.address]);

        await bt.addVault(owner.address);
        await bt.addAdmin(owner.address);
        await bt.mint(owner.address, parseEther("1000"));

        await dai.mint(bt.address, parseEther("1.23456"));
        await dai.approve(bt.address, parseEther("1.23456"));
        await expect(bt.connect(user0).withdrawToken(
            dai.address,
            user0.address,
            parseEther("1.23456"))
        ).to.be.revertedWith("YieldToken: forbidden");
    });

    it("check esZKDX.func => _transfer", async() => {
        const bt = await deployContract("esZKDX", [parseEther("1000")]);

        await bt.setTax(1);
        await bt.transfer(user0.address, parseEther("1.23456"));

        const _addresses = [user0.address, user1.address, user2.address, user3.address];
        const _statuses = [true, true, true];

        await expect(bt.setWhitelist(_addresses, _statuses))
            .to.be.revertedWith("esZKDX: params wrong.");

        const _statuses2 = [false, false, false, true];
        await bt.setWhitelist(_addresses, _statuses2);

        await bt.transfer(user0.address, parseEther("1.23456"));

        await bt.transfer(user1.address, parseEther("1.23456"));

        const _addresses2 = [owner.address];
        const _statuses3 = [true];
        await bt.setWhitelist(_addresses2, _statuses3);
        await bt.transfer(user0.address, parseEther("1.23456"));
    });

    it("check esZKDX.func => _transfer v2", async() => {
        const bt = await deployContract("esZKDX", [parseEther("1000")]);
        await bt.setTax(1);

        await bt.setWhitelist([user0.address], [true]);
        await bt.transfer(user0.address, parseEther("1.23456"));

        await bt.setWhitelist([user0.address], [false]);
        await bt.setWhitelist([owner.address], [true]);
        await bt.transfer(user0.address, parseEther("1.23456"));
    });

    it("check zkUSD.func => addVault", async() => {
        const bt = await deployContract("ZKUSD", [vault.address]);
        await expect(bt.connect(user0).addVault(user0.address))
            .to.be.revertedWith("YieldToken: forbidden");

        await expect(bt.connect(user0).removeVault(user0.address))
            .to.be.revertedWith("YieldToken: forbidden");

        await expect(bt.connect(user0).burn(user0.address, parseEther("0")))
            .to.be.revertedWith("ZKUSD: forbidden");
    });

    it("check zkdxLv1.func => _transfer", async() => {
        const bt = await deployContract("ZKDXLV1", [parseEther("1000")]);

        console.log(`${await bt.endTime()}`);
        await bt.setEndTime(3);
        console.log(`${await bt.endTime()}`);

        await expect(bt.transfer(user0.address, parseEther("1.23456")))
            .to.be.revertedWith("Can not transfer now.");
        await bt.setEndTime(1798135674);
        await bt.transfer(user0.address, parseEther("1.23456"));

        const _users = [user0.address, user1.address];
        const _amounts = [parseEther("1.23456"), parseEther("1.23456")];
        await bt.multiTransfer(_users, _amounts);

        await expect(bt.multiTransfer([], _amounts))
            .to.be.revertedWith("Invalid params!");
        const _invalidAmounts = [parseEther("1.23456"), parseEther("1.23456"), parseEther("1.23456")];
        await expect(bt.multiTransfer(_users, _invalidAmounts))
            .to.be.revertedWith("Invalid length!");
    });

    it("check MultiTransfer.func => multiTransfer", async() => {
        const mt = await deployContract("MultiTransfer", []);

        await expect(mt.multiTransfer20(dai.address, [user1.address], [parseEther("1"), parseEther("1")]))
            .to.be.revertedWith("params length mismatch");

        await expect(mt.multiTransfer721(dai.address, [user1.address], [1, 2]))
            .to.be.revertedWith("params length mismatch");
    });

    it("check esZKDXOmni.func => mint", async() => {
        const et = await deployContract("esZKDXOmni", [
            AddressZero,
            owner.address
        ]);

        await expect(et.connect(user0).mint(user0.address, parseEther("1.23456")))
            .to.be.reverted;
    });

    it("check AIPC.FUNC => setPolicy", async() => {
        const aipc = await deployContract("AIPC", []);
        await expect(aipc.connect(user0).setPolicy(1,"test111"))
            .to.be.revertedWith("Governable: forbidden");
        await aipc.setPolicy(1,"test111");
    });

    it("check Timelock.func => v1", async() => {
        const tl = timelock;
        const v = vault;

        await tl.setMinProfitTime(v.address, 0);

        console.log(`${await tl.isHandler(user3.address)}`);
        await tl.setContractHandler(user3.address,true);
        console.log(`${await tl.isHandler(user3.address)}`);

        await tl.connect(user3).setMinProfitTime(v.address, 0);

        console.log(`${await tl.isKeeper(user2.address)}`);
        await tl.setKeeper(user2.address,true);
        console.log(`${await tl.isKeeper(user2.address)}`);

        await tl.connect(user2).setMinProfitTime(v.address, 0);
    });

    it("check PM.func => v1", async() => {
        console.log(`${await pm}`);

        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        let ethAmountIn = parseEther("100");
        await r.connect(user0).mintAndStakeZkdlpETH(0, 0, updateData, {value: ethAmountIn.add(fee)});

        await updateMarkPrice(['weth', 'dai', 'wbtc']);

        ({updateData, fee} = await getUpdateData(['weth']));
        let params = [
            [weth.address], // _path
            weth.address, // _indexToken
            0, // _minOut
            toUsd(15000), // _sizeDelta
            true, // _isLong
            toUsd(1500), // _acceptablePrice
            updateData
        ];
    });

    it("check ZUSD.sol => mint()", async() => {
        expect(await dai.owner()).eq(owner.address);

        expect(await dai.balanceOf(owner.address)).eq(parseEther("0"));
        expect(await dai.totalSupply()).eq(parseEther("0"));
        expect(await dai.isManager(zusdPool.address)).true;
        expect(await dai.isManager(owner.address)).true;
        expect(await dai.isManager(user0.address)).false;

        await expect(dai.connect(user0).setManager(user0.address, true))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await dai.setManager(user0.address, true);
        expect(await dai.isManager(user0.address)).true;

        await expect(dai.connect(user1).mint(user1.address, parseEther("100")))
            .to.be.revertedWith("ZUSD: not manager");
        await dai.connect(user0).mint(user0.address, parseEther("100"));
        expect(await dai.balanceOf(user0.address)).eq(parseEther("100"));
        expect(await dai.totalSupply()).eq(parseEther("100"));

        await expect(dai.connect(user1).burn(user1.address, parseEther("100")))
            .to.be.revertedWith("ZUSD: not manager");
        await dai.connect(user0).burn(user0.address, parseEther("100"));
        expect(await dai.balanceOf(user0.address)).eq(parseEther("0"));
        expect(await dai.totalSupply()).eq(parseEther("0"));
    });

    it("check orderBookReader.sol => ", async() => {
        console.log(`${obr.address}`);
        console.log(`${ob.address}`);

        console.log(`${await obr.getIncreaseOrders(
            ob.address, 
            owner.address,
            [0,1,2]
        )}`);

        console.log(`${await obr.getDecreaseOrders(
            ob.address, 
            owner.address,
            [0,1,2]
        )}`);
    });

    it("check zusdPool.sol => ", async () => {
        let {usdc, amountIn} = await zusd_pool_init(zusdPool, owner);

        await expect(zusdPool.exchange(usdc.address, 0))
            .to.be.revertedWith("ZUSDPool: amount must be greater than zero");
        await expect(zusdPool.exchange(dai.address, amountIn))
            .to.be.revertedWith("ZUSDPool: token not in whitelist");

        await zusdPool.setCap(0);
        await expect(zusdPool.exchange(usdc.address, amountIn))
            .to.be.revertedWith("ZUSDPool: cap exceeded");

        await zusdPool.setCap(ApproveAmount);
        await zusdPool.exchange(usdc.address, amountIn);

        await expect(zusdPool.connect(user0).setWhitelistToken(
            usdc.address,true))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await expect(zusdPool.connect(user0).setCap(ApproveAmount))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await expect(zusdPool.connect(user0).transfer(
            usdc.address,
            user0.address,
            amountIn
        )).to.be.revertedWith("Ownable: caller is not the owner");

        await expect(zusdPool.redeem(usdc.address,0))
            .to.be.revertedWith("ZUSDPool: amount must be greater than zero");

        await expect(zusdPool.connect(user1).setFee(1)).to.be.reverted;
        await zusdPool.setFee(1);
    });

    it("check BaseToken.func => setGov()", async() => {
        await expect(bt.connect(user0).setGov(user0.address)).to.be.reverted;
        await expect(bt.connect(user0).setInfo('test','test')).to.be.reverted;
        await bt.setInfo('test','test');
        await expect(bt.connect(user0).setYieldTrackers([user0.address])).to.be.reverted;
        await expect(bt.connect(user0).addAdmin(user0.address)).to.be.reverted;

        await bt.addAdmin(user2.address);
        await expect(bt.removeAdmin(user2.address)).to.be.ok;
        await expect(bt.connect(user0).removeAdmin(user2.address)).to.be.reverted;
        await expect(bt.connect(user0).setInPrivateTransferMode(true)).to.be.reverted;

        await bt.addAdmin(owner.address);
        await expect(bt.connect(user0).addNonStakingAccount(user0.address)).to.be.reverted;
        await expect(bt.connect(user0).removeNonStakingAccount(user0.address)).to.be.reverted;

        console.log(`totalStaked: ${await bt.totalStaked()}`);
        console.log(`balanceOf: ${await bt.balanceOf(user0.address)}`);
        console.log(`stakedBalance: ${await bt.stakedBalance(user2.address)}`);
        await bt.addNonStakingAccount(user2.address);
        console.log(`stakedBalance: ${await bt.stakedBalance(user2.address)}`);

        console.log(`${await bt.allowance(user0.address, user1.address)}`);
        await bt.approve(vault.address, parseEther("2"));

        await bt.setHandler(owner.address, true);
        await bt.transfer(user0.address,parseEther("1"));
        await bt.transferFrom(user0.address, user1.address, parseEther("1"));

        await bt.setHandler(owner.address, false);
        await bt.approve(owner.address, parseEther("2"));
        await bt.transfer(owner.address, parseEther("1"));
        await bt.transferFrom(owner.address, user1.address, parseEther("1"));

        await bt.setGov(user0.address);
    });

    it('check YieldToken.func => addAdmin', async() => {
        const bt2 = await deployContract("ZKUSD", [owner.address]);

        await expect(bt2.connect(user0).addAdmin(user0.address)).to.be.reverted;
        await expect(bt2.connect(user0).removeAdmin(user0.address)).to.be.reverted;
        await bt2.removeAdmin(user0.address);

        await bt.transfer(bt2.address, parseEther("1"));
        await bt2.withdrawToken(bt.address, user0.address, parseEther("1"));

        await expect(bt2.connect(user0).addNonStakingAccount(user0.address)).to.be.reverted;
        await bt2.addNonStakingAccount(user0.address);
        await expect(bt2.connect(owner).addNonStakingAccount(user0.address)).to.be.reverted;

        await expect(bt2.connect(user0).removeNonStakingAccount(user0.address)).to.be.reverted;
        await bt2.removeNonStakingAccount(user0.address);
        await expect(bt2.removeNonStakingAccount(user0.address)).to.be.reverted;

        await expect(bt2.connect(user0).setGov(user0.address)).to.be.reverted;
        await bt2.setGov(user0.address);
        await expect(bt2.connect(user0).setGov(owner.address)).to.be.ok;

        await expect(bt2.connect(user0).setInfo('test','test')).to.be.reverted;
        await bt2.setInfo('test','test');

        await expect(bt2.connect(user0).setYieldTrackers([user0.address])).to.be.reverted;
        await expect(bt2.connect(user0).setInWhitelistMode(true)).to.be.reverted;
        await expect(bt2.connect(user0).setWhitelistedHandler(user0.address, true)).to.be.reverted;

        console.log(`${await bt2.totalStaked()}`);
        console.log(`${await bt2.balanceOf(user0.address)}`);
        console.log(`${await bt2.stakedBalance(user0.address)}`);
        await bt2.addNonStakingAccount(user0.address);
        console.log(`${await bt2.stakedBalance(user0.address)}`);

        console.log(`allowance: ${await bt2.allowance(user0.address, user1.address)}`);

        await bt2.mint(owner.address, parseEther("2"));
        await bt2.approve(owner.address, parseEther("2"));
        await bt2.transferFrom(owner.address, user1.address, parseEther("1"));

        await expect(
            bt2.connect(AddressZero).transfer(user1.address, parseEther("1"))
        ).to.be.reverted;
        await expect(bt2.transferFrom(AddressZero, user1.address, parseEther("1")))
            .to.be.reverted;
    })

    it("check MintableBaseToken.func => mint", async() => {
        const bt3 = await deployContract("MintableBaseToken", [
            "test","test",parseEther("1000")]);

        await expect(bt3.connect(user0).setMinter(owner.address, true)).to.be.reverted;
        await bt3.setMinter(owner.address, true);

        await bt3.mint(user0.address, parseEther("1"));
        await expect(bt3.connect(user0).mint(user0.address, parseEther("1"))).to.be.reverted;

        await bt3.burn(user0.address, parseEther("1"));
        await expect(bt3.connect(user0).burn(user0.address, parseEther("1"))).to.be.reverted;
    });

    it("check esZKDX.func", async() => {
        const bt4 = await deployContract("esZKDX", [
            parseEther("1000")]);

        await bt4.mint(user0.address, parseEther("1"));
        await expect(bt4.connect(user0)
            .mint(user0.address, parseEther("1"))).to.be.reverted;

        await expect(bt4.connect(user0)
            .setTax(1)).to.be.reverted;
        await bt4.setTax(1);
        await bt4.transfer(user0.address, parseEther("1"));
        await bt4.setTax(0);
        await bt4.transfer(user0.address, parseEther("1"));

        await expect(bt4.connect(user0).setTaxReceiver(user0.address)).to.be.reverted;
        await bt4.setTaxReceiver(user0.address);

        await expect(bt4.connect(user0)
            .setWhitelist([user0.address], [true])).to.be.reverted;
    });

    it("check zkusd.func", async() => {
        const bt5 = await deployContract("ZKUSD", [owner.address]);

        await bt5.addVault(user0.address);
        await expect(bt5.connect(user0).removeVault(user0.address)).to.be.reverted;
        await bt5.removeVault(user0.address);

        await bt5.mint(user0.address, parseEther("1"));
        await expect(bt5.connect(user0).mint(user0.address, parseEther("1"))).to.be.reverted;
    });

    it("check zkdxlv1.func", async() => {
        const bt = await deployContract("ZKDXLV1", [parseEther("1000")]);

        console.log(`decimals: ${await bt.decimals()}`);

        await bt.mint(owner.address, parseEther("1000"));
        await expect(bt.connect(user0).mint(user0.address, parseEther("1"))).to.be.reverted;

        await bt.setBurnableAddress(owner.address);
        await expect(bt.connect(user0).setBurnableAddress(user0.address)).to.be.reverted;

        await bt.burn(owner.address, parseEther("1"));
        await expect(bt.connect(user0).burn(user0.address, parseEther("1"))).to.be.reverted;

        await expect(bt.connect(user0).setEndTime(0)).to.be.reverted;
        await bt.setEndTime(0);
        await expect(bt.transfer(user0.address, parseEther("1"))).to.be.ok;
    });

    it("check zkdx.sol + zkdlp.sol", async() => {
        const bt = await deployContract("ZKDX", []);
        console.log(`id: ${await bt.id()}`);

        const bt2 = await deployContract("ZKDLP", []);
        console.log(`id: ${await bt2.id()}`);
    });

    it("check zkdxStaking.sol", async() => {
        const s = staking;

        await s.getReward();

        await usdc.mint(owner.address, parseEther("1000"));
        await usdc.connect(owner).approve(s.address, parseEther("1000"));
        await s.connect(owner).stake(parseEther("1"));
        await expect(s.stake(0)).to.be.reverted;

        await expect(s.withdraw(0)).to.be.reverted;
        await s.withdraw(parseEther("0.5"));
        await s.getReward();

        await expect(s.connect(user0).setRewardsDuration(0)).to.be.reverted;
        await s.setRewardsDuration(0);

        await expect(s.connect(user0).setPaused(true)).to.be.reverted;
        await s.setPaused(true);
        await s.setPaused(false);
        await s.setPaused(true);
        /* paused */
        await expect(s.getReward()).to.be.reverted;
        await expect(s.stake(parseEther("1"))).to.be.reverted;
        await expect(s.withdraw(parseEther("0.5"))).to.be.reverted;

        await expect(s.connect(user0)
            .notifyRewardAmount(parseEther("1"))).to.be.reverted;
        // await s.notifyRewardAmount(parseEther("1"));
        await expect(s.notifyRewardAmount(0)).to.be.reverted;
    });

    it("check zkdxStaking.sol => deployNew", async() => {
        const s = await deployContract("ZkdxStaking", [
            usdc.address,
            zkdx.address,
            86400
        ]);
        await s.getReward();

        await usdc.mint(owner.address, parseEther("1000"));
        await zkdx.setMinter(owner.address, true);
        await zkdx.mint(owner.address, parseEther("1000"));

        await expect(s.notifyRewardAmount(parseEther("1"))).to.be.reverted;

        await zkdx.transfer(s.address, parseEther("100"));
        await usdc.approve(s.address, parseEther("1000"));
        await s.stake(parseEther("1000"));

        await s.notifyRewardAmount(parseEther("1"));
        await expect(s.notifyRewardAmount(parseEther("0"))).to.be.reverted;

        await s.getReward();
    });

    it("check ZkdxStakingETH.sol => deployNew", async() => {
        console.log(`${weth.address}`);
        const s = await deployContract("ZkdxStakingETH", [
            weth.address,
            zkdx.address,
            86400
        ]);
        await s.getReward();
        await expect(s.notifyRewardAmount(parseEther("1"))).to.be.reverted;


        await zkdx.setMinter(owner.address, true);
        await zkdx.mint(owner.address, parseEther("1000"));
        await zkdx.transfer(s.address, parseEther("100"));

        await expect(s.stake({value: parseEther("0")})).to.be.reverted;
        await s.stake({value: parseEther("1")});

        await expect(s.withdraw(parseEther("0"))).to.be.reverted;
        await s.withdraw(parseEther("0.5"));

        await s.getReward();

        await expect(s.connect(user0).setPaused(true)).to.be.reverted;
        await s.setPaused(true);
        await s.setPaused(false);
        await s.setPaused(true);

        await expect(s.stake({value: parseEther("1")})).to.be.reverted;
        await expect(s.withdraw(parseEther("0.5"))).to.be.reverted;
        await expect(s.getReward()).to.be.reverted;

        await s.setPaused(false);
        await expect(s.connect(user0).setRewardsDuration(0)).to.be.reverted;
        await s.setRewardsDuration(0);

        await s.getReward();
        await s.setRewardsDuration(86400);
        await s.getReward();

        await expect(s.notifyRewardAmount(parseEther("0"))).to.be.reverted;
        await s.notifyRewardAmount(parseEther("1"));
    });

    it("check RewardRouterV2.sol", async() => {
        const r = await deployContract("RewardRouterV2", [
            vault.address
        ]);

        await expect(
            r.connect(user0).initialize(
                weth.address,
                zkdx.address,
                zkdlp.address,
                dlpManager.address)
        ).to.be.reverted;

        await r.initialize(
            weth.address,
            zkdx.address,
            zkdlp.address,
            dlpManager.address);

        await expect(r.initialize(
            weth.address,
            zkdx.address,
            zkdlp.address,
            dlpManager.address)
        ).to.be.reverted;

        await dlpManager.setHandler(r.address, true);

        await dai.mint(owner.address, parseEther("1000"));
        await dai.approve(r.address, ApproveAmount);
        await dai.approve(dlpManager.address, ApproveAmount);

        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await r.mintAndStakeZkdlp(
            dai.address,
            parseEther("1.23456"),
            0,
            0,
            updateData, {value: fee});

        await expect(
            r.mintAndStakeZkdlp(
                dai.address,
                parseEther("0"),
                0,
                0,
                updateData, {value: fee})
        ).to.be.reverted;

        let {updateData: data2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await r.mintAndStakeZkdlpETH(
            0,
            0,
            data2, {value: parseEther("1.23456").add(fee2)});

        await expect(
            r.mintAndStakeZkdlpETH(
                0,
                0,
                data2, {value: parseEther("0").add(fee2)})
        ).to.be.reverted;

        let {updateData: data3, fee: fee3} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await r.unstakeAndRedeemZkdlp(
            dai.address,
            parseEther("0.0001"),
            0,
            owner.address,
            data3, {value: (fee3)});

        await expect(
            r.unstakeAndRedeemZkdlp(
                dai.address,
                parseEther("0"),
                0,
                owner.address,
                data3, {value: (fee3)})
        ).to.be.reverted;

        let {updateData: data4, fee: fee4} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await r.unstakeAndRedeemZkdlpETH(
            parseEther("0.0001"),
            0,
            owner.address,
            data4, {value: (fee4)});

        await expect(r.unstakeAndRedeemZkdlpETH(
            parseEther("0"),
            0,
            owner.address,
            data4, {value: (fee4)})
        ).to.be.reverted;
    });

    it("check esZKDXOmniEra.sol", async() => {
        const lzEndPoint1 = await deployContract("LZEndpoint", [31337]);
        const esZKDX = await deployContract("esZKDX", [parseEther("1000")]);
        const e = await deployContract("esZKDXOmniEra", [lzEndPoint1.address, esZKDX.address]);

        await expect(e.connect(user0).mint(user0.address, parseEther("1000"))).to.be.reverted;
        await e.mint(owner.address, parseEther("1000"));

        await esZKDX.approve(e.address, ApproveAmount);
        await esZKDX.approve(owner.address, ApproveAmount);
        await e.upgrade();
        await expect(e.connect(user0).upgrade()).to.be.revertedWith("no balance or already upgraded");
    });

    it("check esZKDXOmni.sol", async() => {
        const lzEndPoint1 = await deployContract("LZEndpoint", [31337]);
        const e = await deployContract("esZKDXOmni", [lzEndPoint1.address, owner.address]);

        await e.mint(owner.address, parseEther("1000"));
        await expect(e.connect(user0).mint(owner.address, parseEther("1000"))).to.be.reverted;
    });

    it("check ZUSDPool.sol", async() => {
        const e = await deployContract("ZUSDPool", [zusd.address]);
        await zusd.setManager(e.address, true);

        await e.setWhitelistToken(usdc.address, true);
        await e.setCap(ApproveAmount);
        await usdc.mint(owner.address, parseEther("1000"));
        await usdc.approve(e.address, ApproveAmount);

        await e.exchange(usdc.address, parseEther("1000"));
        await e.redeem(usdc.address, parseEther("400"));
        await expect(e.redeem(usdc.address, parseEther("0"))).to.be.reverted;

        await expect(
            e.connect(user0).transfer(
                usdc.address,
                owner.address,
                parseEther("100"))
        ).to.be.reverted;
        await e.transfer(
            usdc.address,
            owner.address,
            parseEther("100")
        );

        const dai = await deployContract("Token2", [
            'newDAI',
            18,
            0,
            0,
            0
        ]);
        await dai.mint(owner.address, parseEther("1000"));

        await e.setWhitelistToken(dai.address, true);
        await dai.approve(e.address, ApproveAmount);
        await e.exchange(dai.address, parseEther("1000"));
        await e.redeem(dai.address, parseEther("400"));

        await expect(e.connect(user0).setPaused(true)).to.be.reverted;
        await e.setPaused(true);
        await e.setPaused(false);
    });

    /*Added @20231227 */
    it ("check ZKLP.sol", async() => {
        const z = await deployContract("ZKLP", []);

        await expect(z.connect(user0).setManager(user0.address, true)).to.be.reverted;
        await z.setManager(owner.address, true);

        await expect(z.connect(user0).mint(owner.address, parseEther("1000"))).to.be.reverted;
        await z.mint(owner.address, parseEther("1000"));

        await expect(z.connect(user0).burn(owner.address, parseEther("100"))).to.be.reverted;
        await z.burn(owner.address, parseEther("100"));
    });

    it ("check ZKHLP.sol", async() => {
        const z = await deployContract("ZKHLP", []);

        await expect(z.connect(user0).setManager(user0.address, true)).to.be.reverted;
        await z.setManager(owner.address, true);

        await expect(z.connect(user0).mint(owner.address, parseEther("1000"))).to.be.reverted;
        await z.mint(owner.address, parseEther("1000"));

        await expect(z.connect(user0).burn(owner.address, parseEther("100"))).to.be.reverted;
        await z.burn(owner.address, parseEther("100"));
    });

    it("check LPool.sol => d18", async() => {
        const lpt = await deployContract("ZKLP", []);
        const dai = await deployContract("Token2", [
            'newDAI',
            18,
            0,
            0,
            0
        ]);
        const pool = await deployContract("LPool", [lpt.address]);
        await pool.setCap(parseEther("1000"));
        await lpt.setManager(pool.address, true);


        await expect(pool.connect(user0).setWhitelistToken(dai.address, true)).to.be.reverted;
        await pool.setWhitelistToken(dai.address, true);

        await dai.mint(owner.address, parseEther("1000"));
        await dai.approve(pool.address, ApproveAmount);

        await pool.buyLP(dai.address, parseEther("100"));
        await expect(pool.buyLP(dai.address, parseEther("0"))).to.be.reverted;
        await pool.setWhitelistToken(dai.address, false);
        await expect(pool.buyLP(dai.address, parseEther("100"))).to.be.reverted;
        await pool.setPaused(true);
        await expect(pool.buyLP(dai.address, parseEther("100"))).to.be.reverted;
        await pool.setPaused(false);
        await pool.setWhitelistToken(dai.address, true);


        await pool.buyLP(dai.address, parseEther("100"));

        console.log(`${await lpt.totalSupply()}`);
        console.log(`${await pool.cap()}`);

        await lpt.setManager(owner.address,true);
        await lpt.mint(owner.address, parseEther("1000"));
        console.log(`${await lpt.totalSupply()}`);
        console.log(`${formatEther(await lpt.balanceOf(owner.address))}`);

        await pool.redeemLP(dai.address, parseEther("100"));
        await expect(pool.redeemLP(dai.address, parseEther("0"))).to.be.reverted;

        await pool.setCap(0);
        await expect(pool.connect(user0).setCap(0)).to.be.reverted;

        await pool.setFee(0);
        await expect(pool.connect(user0).setFee(0)).to.be.reverted;

        await pool.transfer(dai.address, owner.address, parseEther("0.001"));
        await expect(pool.connect(user0)
            .transfer(dai.address, owner.address, parseEther("0.001"))).to.be.reverted;

    });

    it("check LPool.sol => d6", async() => {
        const lpt = await deployContract("ZKLP", []);
        const dai = await deployContract("Token2", [
            'newDAI',
            6,
            0,
            0,
            0
        ]);
        const pool = await deployContract("LPool", [lpt.address]);
        await pool.setCap(parseEther("1000"));
        await lpt.setManager(pool.address, true);


        await expect(pool.connect(user0).setWhitelistToken(dai.address, true)).to.be.reverted;
        await pool.setWhitelistToken(dai.address, true);

        await dai.mint(owner.address, parseUnits("1000", 6));
        await dai.approve(pool.address, ApproveAmount);

        await pool.buyLP(dai.address, parseUnits("100", 6));
        await expect(pool.buyLP(dai.address, parseUnits("0", 6))).to.be.reverted;
        await pool.setWhitelistToken(dai.address, false);
        await expect(pool.buyLP(dai.address, parseUnits("100", 6))).to.be.reverted;
        await pool.setPaused(true);
        await expect(pool.buyLP(dai.address, parseUnits("100", 6))).to.be.reverted;
        await pool.setPaused(false);
        await pool.setWhitelistToken(dai.address, true);


        await pool.buyLP(dai.address, parseUnits("100", 6));

        console.log(`${await lpt.totalSupply()}`);
        console.log(`${await pool.cap()}`);

        await lpt.setManager(owner.address,true);
        await lpt.mint(owner.address, parseEther("1000"));
        console.log(`${await lpt.totalSupply()}`);
        console.log(`${formatEther(await lpt.balanceOf(owner.address))}`);

        await pool.redeemLP(dai.address, parseEther("100"));
        await expect(pool.redeemLP(dai.address, parseEther("0"))).to.be.reverted;

        await pool.setCap(0);
        await expect(pool.connect(user0).setCap(0)).to.be.reverted;

        await pool.setFee(0);
        await expect(pool.connect(user0).setFee(0)).to.be.reverted;

        await pool.transfer(dai.address, owner.address, parseUnits("0.001", 6));
        await expect(pool.connect(user0)
            .transfer(dai.address, owner.address, parseUnits("0.001", 6))).to.be.reverted;

        await expect(pool.connect(user0).setPaused(false)).to.be.reverted;
    });

    it("check ZkdlpManagerSettings.sol", async() => {
        await dlpManager.setInPrivateMode(true);

        await expect(dlpManager.connect(user0).setInPrivateMode(true)).to.be.reverted;
        await expect(dlpManager.connect(user0).setShortsTrackerAveragePriceWeight(0)).to.be.reverted;

        await expect(dlpManager.setShortsTrackerAveragePriceWeight(10001)).to.be.reverted;
        await expect(dlpManager.setShortsTrackerAveragePriceWeight(10000)).to.be.ok;

        await expect(dlpManager.connect(user0).setHandler(user0.address, true)).to.be.reverted;

        const d = dlpManager;
        await expect(d.connect(user0).setCooldownDuration(0)).to.be.reverted;
        await d.setCooldownDuration(0);
        await expect(d.setCooldownDuration(48 * 3600 + 1)).to.be.reverted;

        await expect(d.connect(user0).setAumAdjustment(0,0)).to.be.reverted;
        await d.setAumAdjustment(0,0);
    });

    it("check ZkdlpManager.sol", async() => {
        const d = dlpManager;

        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);

        console.log(`${await d.getPrice(true)}`);
        console.log(`${await d.getPrice(false)}`);


        console.log(`${await d.vault()}`);
        console.log(`${vault.address}`);

        let {updateData: data2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);

        console.log(`${await d.getGlobalShortAveragePrice(
            zusd.address
        )}`);
    });

    it("check PositionManagerSettings.sol", async() => {
        await pm.setOrderKeeper(user0.address, true);
        await expect(pm.connect(user0).setOrderKeeper(user0.address, true)).to.be.reverted;

        await expect(pm.connect(user0).setLiquidator(user0.address, true)).to.be.reverted;
        await pm.setLiquidator(user0.address, true);

        await expect(pm.connect(user0).setPartner(user0.address, true)).to.be.reverted;
        await pm.setPartner(user0.address, true);

        await expect(pm.connect(user0).setOpened(true)).to.be.reverted;
        await pm.setOpened(true);

        await expect(pm.connect(user0).setShouldValidateIncreaseOrder(true)).to.be.reverted;
        await pm.setShouldValidateIncreaseOrder(true);

        await expect(pm.connect(user0).setOrderBook(user0.address)).to.be.reverted;
        await pm.setOrderBook(user0.address);

        await expect(pm.connect(user0).setDepositFee(0)).to.be.reverted;
        await pm.setDepositFee(0);

        await expect(pm.connect(user0).setIncreasePositionBufferBps(0)).to.be.reverted;
        await pm.setIncreasePositionBufferBps(0);

        await expect(pm.connect(user0).setMaxGlobalSizes(
            [usdc.address], [0], [0]
        )).to.be.reverted;
        await pm.setMaxGlobalSizes(
            [usdc.address], [0], [0]
        );

        await expect(pm.connect(user0).setMinLiquidationFee(0)).to.be.reverted;
        await pm.setMinLiquidationFee(0);

        await expect(pm.connect(user0).setAdmin(owner.address)).to.be.reverted;
        await pm.setAdmin(owner.address);

        await expect(pm.connect(user0).setZusd(zusd.address)).to.be.reverted;
    });

    it("check RouterSettings.sol", async() => {
        async function directDoolDeposit(_token: any = weth, _amountIn: any = parseEther("100"), _user: any = owner) {
            await _token.mint(_user.address, _amountIn);
            await _token.connect(_user).approve(router.address, _amountIn);
            await router.connect(_user).directPoolDeposit(_token.address, _amountIn);
        }

        await expect(router.connect(user0).setGov(owner.address)).to.be.reverted;
        await router.setGov(owner.address);

        await directDoolDeposit(dai , parseEther("100000"));

        let _user = user0;
        let _amountIn = parseEther("1");
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);

        await router.connect(_user).swapETHToTokens([weth.address, dai.address], 0, _user.address,
            updateData, {value: _amountIn.add(fee)});

        let {updateData: data2, fee: fee2} = await getUpdateData(['weth', 'dai']);
        await expect(router.connect(_user).swapETHToTokens([dai.address, weth.address], 0, _user.address,
            data2, {value: _amountIn.add(fee2)})).to.be.reverted;

        _amountIn = parseEther("1000"); //1000 dai
        await dai.connect(_user).approve(router.address, _amountIn);

        let {updateData: data3, fee: fee3} = await getUpdateData(['weth', 'dai']);
        await router.connect(_user).swapTokensToETH([dai.address, weth.address], _amountIn, 0, _user.address,
            data3, {value: fee3});

        await expect(router.connect(_user).swapTokensToETH([weth.address, dai.address], _amountIn, 0, _user.address,
            data3, {value: fee3})).to.be.reverted;

        await expect(router.connect(user0).removePlugin(pm.address)).to.be.reverted;
        await router.removePlugin(pm.address);

        await expect(router.connect(user0).addPlugin(pm.address)).to.be.reverted;
        await router.addPlugin(pm.address)
    });

    it("check Router.sol => swap function", async() => {
        await weth.mint(vault.address, parseEther("1.1"));
        await updateMarkPrice(['weth']);
        await vault.buyZKUSD(weth.address, owner.address);
        let feeBefore = await vault.feeReserves(weth.address);

        await dai.mint(user0.address, parseEther("1500"));
        await dai.connect(user0).approve(router.address, ApproveAmount);
        let receiver = newWallet();
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        await router.connect(user0).swap([dai.address, weth.address], parseEther("1500"), 0,
            receiver.address, updateData, {value: fee});

        expect(await weth.balanceOf(receiver.address)).to.eq(parseEther("1"));
        expect(await vault.feeReserves(weth.address)).to.eq(parseEther("0").add(feeBefore));
    });

    it("check ShortsTrackerSettings.sol", async() => {
        const s = shortsTracker;
        await expect(s.setInitData([usdc.address],[0])).to.be.reverted;
        await expect(s.connect(user0).setHandler(owner.address, true)).to.be.reverted;
        await expect(s.setHandler(AddressZero, true)).to.be.reverted;

        await expect(s.connect(user0).setIsGlobalShortDataReady(false)).to.be.reverted;
        await s.setIsGlobalShortDataReady(false);

        await expect(s.connect(user0).setInitData([usdc.address],[0])).to.be.reverted;
        await s.setInitData([usdc.address],[0]);

        console.log(`s.getNextGlobalShortData: ${await s.getNextGlobalShortData(
            user0.address,
            dai.address,
            dai.address,
            parseEther("1"),
            100,
            true
        )}`);

        console.log(`s.getRealisedPnl: ${await s.getRealisedPnl(
            user0.address,
            dai.address,
            dai.address,
            100,
            true
        )}`);

        await s.setHandler(owner.address, true);
        await s.updateGlobalShortData(
            owner.address, // _account
            weth.address, // _collateral
            weth.address, // _indexToken
            false, // _isLong
            toUsd(1000), // _sizeDelta
            toUsd(1500), // _markPrice
            true // _isIncrease
        );

        console.log(`ss.getNextGlobalShortData() : ${
            await s.getNextGlobalShortData(owner.address, weth.address, weth.address,  toUsd(1500), toUsd(1000), true)
        }`);

        console.log(`ss.getRealisedPnl(): ${
            await s.getRealisedPnl(owner.address, weth.address, weth.address, toUsd(1000), true)
        }`);
    });

    it("check vaultInternal.sol", async() => {
        const v = vault;
        await shortOperationA(
            dlpManager,
            rewardRouter,
            dai,
            weth,
            router,
            pm,
            owner
        );

        console.log(`${await v.globalShortAveragePrices(weth.address)}`);

        console.log(`${await v.getNextGlobalShortAveragePrice(
            weth.address,
            toUsd(1000),
            toUsd(1500),
        )}`)

        console.log(`${await v.getNextAveragePrice(
            weth.address,
            toUsd(1000),
            toUsd(1500),
            true,
            toUsd(1501),
            toUsd(100),
            1232432
        )}`);

        console.log(`${await v.getNextAveragePrice(
            weth.address,
            toUsd(1000),
            toUsd(1500),
            false,
            toUsd(1501),
            toUsd(100),
            1232432
        )}`);

        console.log(`${await v.getTargetZkusdAmount(weth.address)}`);

        console.log(`${await v.getFeeBasisPoints(
            weth.address,
            toUsd(1000),
            100,100,true    
        )}`);

        console.log(`${await v.getNextFundingRate(
            weth.address
        )}`);

        console.log(`${await v.isPositionExist(
            owner.address,
            weth.address,
            dai.address,
            true
        )}`);

        await v.addRouter(router.address);
        await v.removeRouter(router.address);

        console.log(`${await v.usdToToken(weth.address, 0, toUsd(1500))}`);
        console.log(`${await v.usdToTokenMin(weth.address,0)}`);
        console.log(`${await v.usdToTokenMax(weth.address,0)}`);

        console.log(`${await v.getMinPrice(dai.address)}`);
        console.log(`${await v.getMaxPrice(dai.address)}`);

        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai']);
        console.log(`${await v.getPositionDelta(
            owner.address,
            dai.address,
            weth.address,
            false
        )}`);
    });

    it("check VaultSettings.sol => newDeployed", async() => {
        const v = await deployContract("Vault", []);
        await expect(v.connect(user0).setManager(user0.address, true)).to.be.reverted;
        await v.setManager(owner.address, true);

        await expect(v.connect(user0).setInPrivateLiquidationMode(true)).to.be.reverted;
        await v.setInPrivateLiquidationMode(true);

        await expect(v.connect(user0).setIsSwapEnabled(true)).to.be.reverted;
        await v.setIsSwapEnabled(true);

        await expect(v.connect(user0).setMaxGasPrice(0)).to.be.reverted;
        await v.setMaxGasPrice(0);

        await expect(v.connect(user0).setPriceFeed(feed.address)).to.be.reverted;
        await v.setPriceFeed(feed.address);

        await expect(v.connect(user0).setMaxLeverage(0)).to.be.reverted;
        await expect(v.setMaxLeverage(10000)).to.be.reverted;
        await v.setMaxLeverage(10001);

        await expect(v.connect(user0).setBufferAmount(usdc.address, 0)).to.be.reverted;
        await v.setBufferAmount(usdc.address, 0);

        await expect(v.connect(user0).setMaxGlobalShortSize(weth.address, 0)).to.be.reverted;
        await v.setMaxGlobalShortSize(weth.address, 0);

        await expect(v.connect(user0).setFundingRate(
            0,0,0
        )).to.be.reverted;
        await v.setFundingRate(
            0,0,0
        );

        await expect(v.connect(user0).setZkusdAmount(weth.address, parseEther("1000"))).to.be.reverted;
        await v.setZkusdAmount(weth.address, parseEther("1000"));
        await v.setZkusdAmount(weth.address, parseEther("999"));
        await v.setZkusdAmount(weth.address, parseEther("3000"));

        await expect(v.connect(user0).setZusd(zusd.address)).to.be.reverted;
        await v.setZusd(zusd.address);
    });

    it("check PM.sol", async() => {
        await global_buyMLPWithETH(parseEther("20"), owner,feed,rewardRouter);
        await global_longWETH_DAIAmountIn(owner, parseEther("800"), 1400,dai,weth,router,pm);

        let {updateData, fee} = await getUpdateData(['weth'], ['1600']);
        let paramsDe = [
            [weth.address, dai.address],
            weth.address,
            toUsd(0),
            toUsd(10),
            true,
            user0.address,
            toUsd(1550),
            toUsd(0),
            false,
            updateData
        ];
        await pm.connect(owner).decreasePosition(...paramsDe, {value: fee});

        paramsDe = [
            [weth.address,dai.address],
            weth.address,
            toUsd(0),
            toUsd(10),
            true,
            user0.address,
            toUsd(1550),
            toUsd(0),
            true,
            updateData
        ];

        await expect(pm.connect(owner).decreasePosition(...paramsDe, {value: fee})).to.be.reverted;

        paramsDe = [
            [weth.address,dai.address,usdc.address],
            weth.address,
            toUsd(0),
            toUsd(10),
            true,
            user0.address,
            toUsd(1550),
            toUsd(0),
            true,
            updateData
        ];
        await expect(pm.connect(owner).decreasePosition(...paramsDe, {value: fee})).to.be.reverted;

        paramsDe = [
            [weth.address,usdc.address],
            weth.address,
            toUsd(0),
            toUsd(10),
            true,
            user0.address,
            toUsd(1550),
            toUsd(0),
            true,
            updateData
        ];
        await expect(pm.connect(owner).decreasePosition(...paramsDe, {value: fee})).to.be.reverted;

        await pm.setLiquidator(owner.address, true);
        let key = await vault.getPositionKey(owner.address, weth.address, weth.address, true);
        let position = await vault.positions(key);
        console.log(`position1: ${await position.size}`);

        await updateMarkPrice(['weth'], ['653.10143']);
        await expect(pm.connect(user0)
            .liquidatePosition(owner.address, weth.address, weth.address, true, user0.address, [])).to.be.reverted;
        await pm.connect(owner)
            .liquidatePosition(owner.address, weth.address, weth.address, true, user0.address, []);

        position = await vault.positions(key);
        console.log(`position2: ${await position.size}`);
    });

    it("check BasePositionManager.sol", async() => {
        await global_buyMLPWithETH(parseEther("20"), owner,feed,rewardRouter);
        await global_longWETH_DAIAmountIn(owner, parseEther("800"), 1400,dai,weth,router,pm);

        await expect(pm.connect(user0).withdrawFees(weth.address, owner.address)).to.be.reverted;
        await pm.withdrawFees(weth.address, owner.address);

        await expect(pm.connect(user0).approve(weth.address, owner.address, ApproveAmount)).to.be.reverted;
        await pm.approve(weth.address, owner.address, ApproveAmount);

        await expect(pm.connect(user0).sendValue(owner.address,0)).to.be.reverted;
        await pm.sendValue(owner.address, 0);
    });

    it('check VaultUtils.sol', async() => {
        const v = vault;
        await global_buyMLPWithETH(parseEther("20"), owner,feed,rewardRouter);
        await global_longWETH_DAIAmountIn(owner, parseEther("800"), 1400,dai,weth,router,pm);

        console.log(`${await vu.getFeeBasisPoints(
            weth.address,
            toUsd(1000),
            100,100,true    
        )}`);

        console.log(`${await v.hasDynamicFees()}`);

        await timelock.setFees(
            v.address, 0,0,0,0,0,0,0,0,true
        );

        console.log(`${await v.hasDynamicFees()}`);
        console.log(`${await vu.getFeeBasisPoints(
            weth.address,
            toUsd(1000),
            100,100,true
        )}`);
    });

    it("check ZkdlpManager.sol", async() => {
        await shortOperationA(
            dlpManager,
            rewardRouter,
            dai,
            weth,
            router,
            pm,
            owner
        );

        console.log(`${await dlpManager.getGlobalShortAveragePrice(weth.address)}`);
        console.log(`${await dlpManager.getGlobalShortDelta(
            weth.address,
            toUsd(1500),
            toUsd(1000)
        )}`);
    });

    it("check VaultErrorController.sol", async() => {
        console.log(`${await vec.gov()}`);
        await expect( vec.connect(user0).setErrors(vault.address, ['error1', 'error2']))
            .to.be.reverted;
    })
});

