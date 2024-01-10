import {ApproveAmount, forwardTime, setupFixture, toUsd} from "../../../helpers/utils";
import {formatBytes32String, formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {constants} from "ethers";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("RewardRouter Test V2", async () => {
    let vault: any,
        router: any,
        pm: any,
        shortsTracker: any,

        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        miner: any,
        feeTo: any,
        receiver : any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v : any,
        zkdlpManager: any,
        zkdx: any,
        vaultPriceFeed: any;

    beforeEach(async () => {
        let fixture = await setupFixture();
        vault           = fixture.vault;
        router          = fixture.router;
        pm              = fixture.positionManager;
        shortsTracker   = fixture.shortsTracker;

        weth            = fixture.weth;
        wbtc            = fixture.wbtc;
        dai             = fixture.dai;
        owner           = fixture.owner;
        user0           = fixture.user0;
        user1           = fixture.user1;
        user2           = fixture.user2;
        miner           = fixture.miner;
        feeTo           = fixture.feeTo;
        receiver        = fixture.receiver;

        zkdlp           = fixture.zkdlp;
        timelock        = fixture.timelock;
        rewardRouter    = fixture.rewardRouter;
        zkusd           = fixture.ZKUSD;
        v               = fixture.vault;
        zkdlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        vaultPriceFeed  = fixture.vaultPriceFeed;

        await vaultPriceFeed.setValidTime(30);
    });
    async function buyMLPWithToken(token: any, tokenAmountIn: any, receiver: any) {
        await token.connect(receiver).mint(receiver.address, tokenAmountIn);
        await token.connect(receiver).approve(zkdlpManager.address, tokenAmountIn);
        await rewardRouter.connect(receiver).mintAndStakeZkdlp(token.address, tokenAmountIn, 0, 0);
    }
    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
        ];
        await router.connect(user).approvePlugin(pm.address);
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, _DAIAmountIn);
        await pm.connect(user).increasePosition(...params);
    }
    async function longWBTC_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, wbtc.address], // _path
            wbtc.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(28000.000001), // _acceptablePrice
        ];
        await router.connect(user).approvePlugin(pm.address);
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, _DAIAmountIn);
        await pm.connect(user).increasePosition(...params);
    }

    it("RewardRouter.func => gov()", async () => {
        expect(rewardRouter.address).to.not.eq(constants.AddressZero);
        expect(await rewardRouter.gov()).to.eq(owner.address);
    });

    it("RewardRouter.func => mintAndStakeZkdlpETH() v3_0_1", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc'],["1002","1.005","30000"]);
        let ethAmountIn = parseEther("1").add(fee);
        await rewardRouter.mintAndStakeZkdlpETH(parseEther("996"), parseEther("996"), updateData, {value: ethAmountIn});
    });

    it("RewardRouter.func => mintAndStakeZkdlpETH() v3_0_1", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc'],["1005","1.005","30000"]);
        let ethAmountIn = parseEther("1").add(fee);
        await rewardRouter.mintAndStakeZkdlpETH(parseEther("1000"), parseEther("1000"), updateData, {value: ethAmountIn});
    });
});

describe("RewardRouter Test V3", async () => {
    let vault: any,
        router: any,
        pm: any,
        shortsTracker: any,

        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        miner: any,
        feeTo: any,
        receiver : any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v : any,
        zkdlpManager: any,
        zkdx: any,
        feed: any;


    beforeEach(async () => {
        let fixture = await setupFixture();
        vault           = fixture.vault;
        router          = fixture.router;
        pm              = fixture.positionManager;
        shortsTracker   = fixture.shortsTracker;

        weth            = fixture.weth;
        wbtc            = fixture.wbtc;
        dai             = fixture.dai;
        owner           = fixture.owner;
        user0           = fixture.user0;
        user1           = fixture.user1;
        user2           = fixture.user2;
        miner           = fixture.miner;
        feeTo           = fixture.feeTo;
        receiver        = fixture.receiver;

        zkdlp           = fixture.zkdlp;
        timelock        = fixture.timelock;
        rewardRouter    = fixture.rewardRouter;
        zkusd           = fixture.ZKUSD;
        v               = fixture.vault;
        zkdlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        feed  = fixture.vaultPriceFeed;

        await feed.setValidTime(30);
    });
    async function buyMLPWithToken(token: any, tokenAmountIn: any, receiver: any) {
        await token.connect(receiver).mint(receiver.address, tokenAmountIn);
        await token.connect(receiver).approve(zkdlpManager.address, tokenAmountIn);
        await rewardRouter.connect(receiver).mintAndStakeZkdlp(token.address, tokenAmountIn, 0, 0);
    }
    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
        ];
        await router.connect(user).approvePlugin(pm.address);
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, _DAIAmountIn);
        await pm.connect(user).increasePosition(...params);
    }
    async function longWBTC_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, wbtc.address], // _path
            wbtc.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(28000.000001), // _acceptablePrice
        ];
        await router.connect(user).approvePlugin(pm.address);
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, _DAIAmountIn);
        await pm.connect(user).increasePosition(...params);
    }

    it("RewardRouter.func => gov()", async () => {
        expect(rewardRouter.address).to.not.eq(constants.AddressZero);
        expect(await rewardRouter.gov()).to.eq(owner.address);
    });
    it("RewardRouter.func => mintAndStakeZkdlpETH() v3_0_1", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await feed.setValidTime(30);

        console.log(`updateData: ${updateData}`);

        let ethAmountIn = parseEther("1");
        await rewardRouter.mintAndStakeZkdlpETH(
            parseEther("1000"),
            parseEther("1000"),
            updateData, {value: ethAmountIn});

        console.log(`feed.getMinPrice: ${await feed.getPrice(weth.address, false,true,true)}`);
    });

    it("RewardRouter.func => mintAndStakeZkdlpETH() v3_0_2", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(parseEther("1000"), parseEther("1000"), updateData, {value: parseEther("1")});
        expect(await feed.getPrice(weth.address, false,true,true)).to.eq(parseUnits("1500",30));
    });

    it("RewardRouter.func => mintAndStakeZkdlpETH() + unstakeAndRedeemZkdlpETH()", async () => {
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(parseEther("1000"), parseEther("1000"), updateData, {value: parseEther("1")});

        const zkdlpAmount = (await zkdlp.balanceOf(owner.address)).div(2);
        await zkdlp.approve(rewardRouter.address, ApproveAmount);


        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        // await rewardRouter.unstakeAndRedeemZkdlpETH(zkdlpAmount, 0, owner.address, updateData2);

    });

    it("RewardRouter.func => mintAndStakeZkdlp()", async () => {
        const wethAmountIn = parseEther("1");
        await weth.mint(owner.address, wethAmountIn);
        await weth.approve(rewardRouter.address, ApproveAmount);
        console.log(`weth.balacneOf(owner): ${formatEther(await weth.balanceOf(owner.address))}`);

        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        // await rewardRouter.mintAndStakeZkdlp(weth.address, parseEther("0.5"), 0, 0, updateData);
    });
});

describe("RewardRouter Test V4", async () => {
    let vault: any,
        router: any,
        pm: any,
        shortsTracker: any,

        weth: any,
        wbtc: any,
        dai: any,
        owner: any,
        user0: any,
        user1: any,
        user2: any,
        miner: any,
        feeTo: any,
        receiver : any,

        zkdlp: any,
        timelock: any,
        rewardRouter: any,
        zkusd: any,
        v : any,
        zkdlpManager: any,
        zkdx: any,
        feed: any;


    beforeEach(async () => {
        let fixture = await setupFixture();
        vault           = fixture.vault;
        router          = fixture.router;
        pm              = fixture.positionManager;
        shortsTracker   = fixture.shortsTracker;

        weth            = fixture.weth;
        wbtc            = fixture.wbtc;
        dai             = fixture.dai;
        owner           = fixture.owner;
        user0           = fixture.user0;
        user1           = fixture.user1;
        user2           = fixture.user2;
        miner           = fixture.miner;
        feeTo           = fixture.feeTo;
        receiver        = fixture.receiver;

        zkdlp           = fixture.zkdlp;
        timelock        = fixture.timelock;
        rewardRouter    = fixture.rewardRouter;
        zkusd           = fixture.ZKUSD;
        v               = fixture.vault;
        zkdlpManager    = fixture.zkdlpManager;
        zkdx            = fixture.ZKDX;
        feed            = fixture.vaultPriceFeed;
    });
    async function buyMLPWithETH(etherValue: any) {
        await feed.setValidTime(30);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlpETH(0, 0, updateData, {value: etherValue.add(fee)});
    }
    async function sellMLPWithETH(zkdlpAmount: any) {
        await zkdlp.approve(rewardRouter.address, zkdlpAmount);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.unstakeAndRedeemZkdlpETH(zkdlpAmount, 0, owner.address, updateData2, {value: fee2});
    }

    async function buyMLPWithToken(token: any, amountIn: any) {
        await token.mint(owner.address, amountIn);
        await token.approve(zkdlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
    }
    async function sellMLPWithToken(zkdlpAmountIn: any, tokenOut: any, receiver: any) {
        await zkdlp.approve(rewardRouter.address, zkdlpAmountIn);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn,0, receiver.address, updateData2, {value: fee2});
    }

    async function buyMLPWithTokenV2(token: any, amountIn: any, addressIn: any) {
        await token.mint(addressIn.address, amountIn);
        await token.connect(addressIn).approve(zkdlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).mintAndStakeZkdlp(token.address, amountIn, 0, 0, updateData, {value: fee});
    }
    async function sellMLPWithTokenV2(zkdlpAmountIn: any, tokenOut: any, addressIn: any) {
        await zkdlp.connect(addressIn).approve(rewardRouter.address, zkdlpAmountIn);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await rewardRouter.connect(addressIn).unstakeAndRedeemZkdlp(tokenOut.address, zkdlpAmountIn,0, addressIn.address, updateData2, {value: fee2});
    }


    async function buyZKUSDWithToken(token: any, amountIn: any, receiver: any) {
        await token.mint(vault.address, amountIn);
        await updateMarkPrice(['weth', 'wbtc', 'dai']);
        await vault.buyZKUSD(token.address, receiver.address);
    }
    async function longWETH_DAIAmountInV2(user: any, _DAIAmountIn: any, _sizeDelta: any) {
        let params = [
            [dai.address, weth.address], // _path
            weth.address, // _indexTokens
            _DAIAmountIn,
            0, // _minOut
            toUsd(_sizeDelta), // _sizeDelta
            true, // _isLong
            toUsd(1500.000001), // _acceptablePrice
        ];
        await dai.mint(user.address, _DAIAmountIn);
        await dai.connect(user).approve(router.address, ApproveAmount);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await pm.connect(user).increasePosition(...params,updateData,{value: fee});
    };

    it("rewardRouter.func => buyMLPWithETH + sellMLPWithETH", async () => {
        await buyMLPWithETH(parseEther("1234")); //ethAmountIn
        await sellMLPWithETH(parseEther("1234")); //dlpAmountIn
    });
    it("rewardRouter.func => mintAndStakeZkdlp + unstakeAndRedeemZkdlp", async () => {
        await buyMLPWithToken(weth, parseEther("100"));
        await sellMLPWithToken(parseEther("1234"), weth, owner);
    });
    it("rewardRouter.func => buyMLPWithToken => v2", async () => {
        await buyMLPWithToken(weth, parseEther("200"));
        await buyMLPWithToken(wbtc, parseUnits("10",8));
        await buyMLPWithToken(dai, parseEther("12345"));
        await buyMLPWithToken(weth, parseEther("100"));

        expect(await zkdlp.balanceOf(owner.address)).to.be.gt(0);
        expect(await zkdlp.balanceOf(user0.address)).to.be.eq(0);
        expect(await zkdlp.balanceOf(user1.address)).to.be.eq(0);
    });
    it("rewardRouter.func => buyMLPWithTokenV2", async () => {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("12345"), user2);

        expect(await zkdlp.balanceOf(owner.address)).to.be.gt(0);
        expect(await zkdlp.balanceOf(user0.address)).to.be.gt(0);
        expect(await zkdlp.balanceOf(user1.address)).to.be.gt(0);
        expect(await zkdlp.balanceOf(user2.address)).to.be.gt(0);
    });
    it("rewardRouter.func => buyMLPWithTokenV2 => sellMLPWithTokenV2", async () => {
        await buyMLPWithTokenV2(weth, parseEther("200"), owner);
        await buyMLPWithTokenV2(weth, parseEther("100"), user0);
        await buyMLPWithTokenV2(wbtc, parseUnits("10",8), user1);
        await buyMLPWithTokenV2(dai, parseEther("123456"), user2);

        console.log(`zkdlp.balanceOf(owner.address) = ${formatEther(await zkdlp.balanceOf(owner.address))}`);
        console.log(`zkdlp.balanceOf(user0.address) = ${formatEther(await zkdlp.balanceOf(user0.address))}`);
        console.log(`zkdlp.balanceOf(user1.address) = ${formatEther(await zkdlp.balanceOf(user1.address))}`);
        console.log(`zkdlp.balanceOf(user2.address) = ${formatEther(await zkdlp.balanceOf(user2.address))}`);
        console.log(`zkdlp.totalSupply() = ${formatEther(await zkdlp.totalSupply())}`);

        console.log(`weth.balanceOf(owner.address) = ${formatEther(await weth.balanceOf(owner.address))}`);
        expect(await weth.balanceOf(owner.address)).to.be.eq(0);
        expect(await weth.balanceOf(user0.address)).to.be.eq(0);
        expect(await wbtc.balanceOf(user1.address)).to.be.eq(0);
        expect(await dai.balanceOf(user2.address)).to.be.eq(0);

        await sellMLPWithTokenV2(parseEther("99100"), weth, owner);
        await sellMLPWithTokenV2(parseEther("49550"), weth, user0);
        await sellMLPWithTokenV2(parseEther("79160"), wbtc, user1);
        await sellMLPWithTokenV2(parseEther("23085"), dai, user2);

        console.log("--------------------------------------- line ---------------------------------------");
        console.log(`zkdlp.balanceOf(owner.address) = ${formatEther(await zkdlp.balanceOf(owner.address))}`);
        console.log(`zkdlp.balanceOf(user0.address) = ${formatEther(await zkdlp.balanceOf(user0.address))}`);
        console.log(`zkdlp.balanceOf(user1.address) = ${formatEther(await zkdlp.balanceOf(user1.address))}`);
        console.log(`zkdlp.balanceOf(user2.address) = ${formatEther(await zkdlp.balanceOf(user2.address))}`);
        console.log(`zkdlp.totalSupply() = ${formatEther(await zkdlp.totalSupply())}`);

        await expect(sellMLPWithTokenV2(parseEther("9910000"), weth, owner)).to.be.reverted;

        console.log(`weth.balanceOf(owner.address) = ${formatEther(await weth.balanceOf(owner.address))}`);
        console.log(`weth.balanceOf(user0.address) = ${formatEther(await weth.balanceOf(user0.address))}`);
        console.log(`wbtc.balanceOf(user1.address) = ${formatUnits(await wbtc.balanceOf(user1.address),8)}`);
        console.log(`dai.balanceOf(user2.address) = ${formatEther(await dai.balanceOf(user2.address))}`);

        expect(await weth.balanceOf(owner.address)).to.be.gt(0);
        expect(await weth.balanceOf(user0.address)).to.be.gt(0);
        expect(await wbtc.balanceOf(user1.address)).to.be.gt(0);
        expect(await dai.balanceOf(user2.address)).to.be.gt(0);
    });

    it("check RewardRouterV2.func => mintAndStakeZKdlp()", async() => {
        const r = rewardRouter;
        console.log(`r.address = ${r.address}`);

        const token = weth;
        const amountIn = parseEther("0");

        await token.mint(owner.address, amountIn);
        await token.approve(zkdlpManager.address, amountIn);
        let {updateData, fee} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await expect(rewardRouter
            .mintAndStakeZkdlp(
                token.address,
                amountIn, 0, 0, updateData, {value: fee}))
            .to.be.revertedWith("RewardRouter: invalid _amount");


        const etherValue = parseEther("0");
        await feed.setValidTime(30);
        let {updateData: updateData2, fee: fee2} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await expect(rewardRouter
            .mintAndStakeZkdlpETH(
                0, 0, updateData2,
                {value: etherValue.add(fee2)}))
            .to.be.revertedWith("RewardRouter: invalid msg.value");


        const tokenOut = weth;
        const zkdlpAmountIn = parseEther("0");
        await zkdlp.approve(rewardRouter.address, zkdlpAmountIn);
        let {updateData: updateData3, fee: fee3} = await getUpdateData(['weth', 'dai', 'wbtc']);
        await expect(rewardRouter
            .unstakeAndRedeemZkdlp(
                tokenOut.address, zkdlpAmountIn,0,
                receiver.address, updateData3, {value: fee3}))
            .to.be.revertedWith("RewardRouter: invalid _zkusdAmount");


        await expect(rewardRouter.unstakeAndRedeemZkdlpETH(
            zkdlpAmountIn, 0, owner.address, updateData3, {value: fee3}))
            .to.be.revertedWith("RewardRouter: invalid _zkusdAmount");
    });
});

