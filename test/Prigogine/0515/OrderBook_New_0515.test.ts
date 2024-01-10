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
import {ethers} from "hardhat";
import {minExecutionFee} from "../../../helpers/params";
import {OP_GET_UPDATEData, printVault_Pool_Reserved, splitterTitle} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";

describe("OrderBook -> OrderBookStorage test", async () => {
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
        o                   : any;

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

    it("o.Paramter => PRICE_PRECISION", async() => {
        expect(o.address).to.not.eq(constants.AddressZero);
        expect(await o.router()).to.eq(router.address);
        expect(await o.vault()).to.eq(v.address);
        expect(await o.weth()).to.be.eq(weth.address);
        expect(await o.zkusd()).to.be.eq(zkusd.address);
        expect(await o.minExecutionFee()).to.be.eq(minExecutionFee);
        expect(await o.gov()).to.be.eq(owner.address);
    });
    // it("check increase order - Long BTC", async () => {
    //     async function orderPrepare() {
    //         await weth.mint(vault.address, parseEther("100"));
    //         await dai.mint(vault.address, parseEther("200000"));
    //         await wbtc.mint(vault.address, parseUnits("10", 8));
    //         await updateMarkPrice(['weth', 'wbtc', 'dai']);
    //         await vault.buyZKUSD(weth.address, user1.address);
    //         await updateMarkPrice(['weth', 'wbtc', 'dai']);
    //         await vault.buyZKUSD(dai.address, user1.address);
    //         await updateMarkPrice(['weth', 'wbtc', 'dai']);
    //         await vault.buyZKUSD(wbtc.address, user1.address);
    //         let amountIn = parseUnits("1", 8);
    //         await wbtc.mint(user0.address, amountIn);
    //         await wbtc.connect(user0).approve(router.address, ApproveAmount);
    //         return amountIn;
    //     }
    //     let amountIn = await orderPrepare();
    //
    //
    //     let executionFee = parseEther("0.005");
    //     await o.connect(user0).createIncreaseOrder(
    //         wbtc.address, // path
    //         amountIn, // amountIn
    //         wbtc.address, // indexToken
    //         toUsd(100000), // sizeDelta
    //         wbtc.address, // collateralToken
    //         true, // isLong
    //         toUsd(25000), // triggerPrice
    //         false, // triggerAboveThreshold
    //         executionFee, // executionFee
    //         false, // shouldWrap
    //         {value: executionFee}
    //     );
    //     expect(await o.increaseOrdersIndex(user0.address)).to.equal(1);
    //     let order = await o.increaseOrders(user0.address, 0);
    //     expect(order['account']).to.eq(user0.address);
    //     expect(order['sizeDelta']).to.eq(toUsd(100000));
    //     expect(order['executionFee']).to.eq(executionFee);
    //
    //     // execute
    //     await pm.setOrderKeeper(owner.address, true);
    //     let feeReceiver = await newWallet();
    //     let {updateData, fee} = await getUpdateData(['wbtc'], ['24999']);
    //     await pm.executeIncreaseOrder(user0.address, 0, feeReceiver.address, updateData, {value: fee});
    //     expect(await ethers.provider.getBalance(feeReceiver.address)).to.eq(executionFee);
    //
    //     // check position opened
    //     let key = await vault.getPositionKey(user0.address, wbtc.address, wbtc.address, true);
    //     let position = await vault.positions(key);
    //     await expect(await position.size).to.eq(parseUnits("100000", 30));
    //     await expect(await position.averagePrice).to.eq(parseUnits("24999", 30));
    // });
    // it("o.func => createIncreaseOrder - new", async () => {
    //     await OP_BASE_MLP();
    //     await orderPrepareV2(user0);
    //
    //
    //     await createIO_LONG_TOKEN(wbtc, parseUnits("1", 8), user0, 25000);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(dai , parseEther("100"), user0, 0.99);
    //     await createIO_LONG_TOKEN(tsla, parseEther("100"), user0, 1);
    // });
    // it("OrderBookStorage.paramters => increaseOrdersIndex", async () => {
    //     await OP_BASE_MLP();
    //     await orderPrepareV2(user0);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     expect(await o.increaseOrdersIndex(user0.address)).to.equal(1);
    //     expect(await o.increaseOrdersIndex(user1.address)).to.equal(0);
    //     expect(await o.increaseOrdersIndex(user2.address)).to.equal(0);
    //     expect(await o.increaseOrdersIndex(owner.address)).to.equal(0);
    //
    //
    //     await createIO_LONG_TOKEN(weth , parseEther("100"), user0, 1399);
    //     expect(await o.increaseOrdersIndex(user0.address)).to.equal(2);
    //     expect(await o.increaseOrdersIndex(user1.address)).to.equal(0);
    //     expect(await o.increaseOrdersIndex(user2.address)).to.equal(0);
    //     expect(await o.increaseOrdersIndex(owner.address)).to.equal(0);
    // });
    // it("OrderBookStorage.paramters => increaseOrdersIndex V2", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user1, 1398);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user2, 1397);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), owner, 1396);
    //
    //     expect(await o.increaseOrdersIndex(user0.address)).to.equal(2);
    //     expect(await o.increaseOrdersIndex(user1.address)).to.equal(1);
    //     expect(await o.increaseOrdersIndex(user2.address)).to.equal(1);
    //     expect(await o.increaseOrdersIndex(owner.address)).to.equal(1);
    // });
    // it("OrderBookStorage.paramters => increaseOrders => order0", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
    //     await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
    //     await createIO_LONG_TOKEN(dai , parseEther("100"), user0, 1397);
    //     await createIO_LONG_TOKEN(tsla, parseEther("100"), user0, 1396);
    //
    //     expect(await o.increaseOrdersIndex(user0.address)).to.equal(5);
    //     expect(await o.increaseOrdersIndex(user1.address)).to.equal(0);
    //     expect(await o.increaseOrdersIndex(user2.address)).to.equal(0);
    //     expect(await o.increaseOrdersIndex(owner.address)).to.equal(0);
    //
    //     let order = await o.increaseOrders(user0.address, 0); //user0,weth,1400
    //     let order1 = await o.increaseOrders(user0.address, 1); //user0,weth,1399
    //     let order2 = await o.increaseOrders(user0.address, 2); //user0,wbtc,1398
    //     let order3 = await o.increaseOrders(user0.address, 3); //user0,dai,1397
    //     let order4 = await o.increaseOrders(user0.address, 4); //user0,tsla,1396
    //
    //     await printOrderDetails(order);
    //
    //     expect(order.account).to.be.eq(user0.address);
    //     expect(order.purchaseToken).to.be.eq(weth.address);
    //     expect(order.purchaseTokenAmount).to.be.eq(parseEther("100"));
    //     expect(order.collateralToken).to.be.eq(weth.address);
    //     expect(order.indexToken).to.be.eq(weth.address);
    //     expect(order.sizeDelta).to.be.eq(toUsd(100000));
    //     expect(order.isLong).to.be.true;
    //     expect(order.triggerPrice).to.be.eq(toUsd(1400));
    //     expect(order.triggerAboveThreshold).to.be.false;
    //     expect(order.executionFee).to.be.eq(parseEther("0.005"));
    // });
    // it("OrderBookStorage.paramters => increaseOrders => order1", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
    //     await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
    //     await createIO_LONG_TOKEN(dai , parseEther("100"), user0, 1397);
    //     await createIO_LONG_TOKEN(tsla, parseEther("100"), user0, 1396);
    //
    //     let order = await o.increaseOrders(user0.address, 1); //user0,weth,1399
    //     await printOrderDetails(order);
    //
    //     expect(order.account).to.be.eq(user0.address);
    //     expect(order.purchaseToken).to.be.eq(weth.address);
    //     expect(order.purchaseTokenAmount).to.be.eq(parseEther("100"));
    //     expect(order.collateralToken).to.be.eq(weth.address);
    //     expect(order.indexToken).to.be.eq(weth.address);
    //     expect(order.sizeDelta).to.be.eq(toUsd(100000));
    //     expect(order.isLong).to.be.true;
    //     expect(order.triggerPrice).to.be.eq(toUsd(1399));
    //     expect(order.triggerAboveThreshold).to.be.false;
    //     expect(order.executionFee).to.be.eq(parseEther("0.005"));
    // });
    // it("OrderBookStorage.paramters => increaseOrders => order2", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
    //     await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
    //     await createIO_LONG_TOKEN(dai , parseEther("100"), user1, 1397);
    //     await createIO_LONG_TOKEN(tsla, parseEther("100"), owner, 1396);
    //
    //     let user = user0;
    //     let token = wbtc;
    //
    //     let order = await o.increaseOrders(user.address, 2); //user0,weth,1399
    //     await printOrderDetails(order);
    //
    //
    //     expect(order.account).to.be.eq(user.address);
    //     expect(order.purchaseToken).to.be.eq(token.address);
    //     expect(order.purchaseTokenAmount).to.be.eq(parseEther("100"));
    //     expect(order.collateralToken).to.be.eq(token.address);
    //     expect(order.indexToken).to.be.eq(token.address);
    //     expect(order.sizeDelta).to.be.eq(toUsd(100000));
    //     expect(order.isLong).to.be.true;
    //     expect(order.triggerPrice).to.be.eq(toUsd(1398));
    //     expect(order.triggerAboveThreshold).to.be.false;
    //     expect(order.executionFee).to.be.eq(parseEther("0.005"));
    // });
    // it("OrderBookStorage.paramters => increaseOrders => order3", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
    //     await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
    //     await createIO_LONG_TOKEN(dai , parseEther("100"), user1, 1397);
    //     await createIO_LONG_TOKEN(tsla, parseEther("100"), owner, 1396);
    //
    //     let user = user1;
    //     let token = dai;
    //
    //     let order = await o.increaseOrders(user.address, 0); //user1,dai,1397
    //     await printOrderDetails(order);
    //
    //
    //     expect(order.account).to.be.eq(user.address);
    //     expect(order.purchaseToken).to.be.eq(token.address);
    //     expect(order.purchaseTokenAmount).to.be.eq(parseEther("100"));
    //     expect(order.collateralToken).to.be.eq(token.address);
    //     expect(order.indexToken).to.be.eq(token.address);
    //     expect(order.sizeDelta).to.be.eq(toUsd(100000));
    //     expect(order.isLong).to.be.true;
    //     expect(order.triggerPrice).to.be.eq(toUsd(1397));
    //     expect(order.triggerAboveThreshold).to.be.false;
    //     expect(order.executionFee).to.be.eq(parseEther("0.005"));
    // });
    // it("OrderBookStorage.paramters => increaseOrders => order4", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
    //     await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
    //     await createIO_LONG_TOKEN(dai , parseEther("100"), user1, 1397);
    //     await createIO_LONG_TOKEN(tsla, parseEther("100"), owner, 1396);
    //
    //     let user = owner;
    //     let token = tsla;
    //
    //     let order = await o.increaseOrders(user.address, 0); //owner,tsla,1396
    //     await printOrderDetails(order);
    //
    //
    //     expect(order.account).to.be.eq(user.address);
    //     expect(order.purchaseToken).to.be.eq(token.address);
    //     expect(order.purchaseTokenAmount).to.be.eq(parseEther("100"));
    //     expect(order.collateralToken).to.be.eq(token.address);
    //     expect(order.indexToken).to.be.eq(token.address);
    //     expect(order.sizeDelta).to.be.eq(toUsd(100000));
    //     expect(order.isLong).to.be.true;
    //     expect(order.triggerPrice).to.be.eq(toUsd(1396));
    //     expect(order.triggerAboveThreshold).to.be.false;
    //     expect(order.executionFee).to.be.eq(parseEther("0.005"));
    // });
    // it("OrderBookStorage.paramters => increaseOrdersIndex => v3", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //
    //     expect(await o.increaseOrdersIndex(user2.address)).to.be.eq(0);
    //     expect(await o.increaseOrdersIndex(user0.address)).to.be.eq(0);
    //     expect(await o.increaseOrdersIndex(user1.address)).to.be.eq(0);
    //     expect(await o.increaseOrdersIndex(owner.address)).to.be.eq(0);
    //
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
    //     await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
    //     await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
    //     await createIO_LONG_TOKEN(dai , parseEther("100"), user1, 1397);
    //     await createIO_LONG_TOKEN(tsla, parseEther("100"), owner, 1396);
    //
    //     expect(await o.increaseOrdersIndex(user0.address)).to.be.eq(3);
    //     expect(await o.increaseOrdersIndex(user1.address)).to.be.eq(1);
    //     expect(await o.increaseOrdersIndex(owner.address)).to.be.eq(1);
    //     expect(await o.increaseOrdersIndex(user2.address)).to.be.eq(0);
    //
    // });
});

describe("OrderBookReader -> OrderBookReader test", async () => {
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
        or                  : any;

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
        or                  = fixture.orderBookReader;
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

    async function OP_LONG_IO() {
        await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1400);
        await createIO_LONG_TOKEN(weth, parseEther("100"), user0, 1399);
        await createIO_LONG_TOKEN(wbtc, parseEther("100"), user0, 1398);
        await createIO_LONG_TOKEN(dai, parseEther("100"), user1, 1397);
        await createIO_LONG_TOKEN(tsla, parseEther("100"), owner, 1396);
    }
    // it("OrderR.paramters => getIncreaseOrders", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //     await OP_LONG_IO();
    //
    //     console.log(`or.getIncreaseOrders: ${await or.getIncreaseOrders(
    //         o.address,
    //         user0.address,
    //         [0,1,2]
    //     )}`);
    // });

    // it("OrderR.paramters => getDecreaseOrders", async () => {
    //     await OP_BASE_MLP();
    //     await OP_ORDER_PREPARE();
    //     await OP_LONG_IO();
    //
    //     console.log(`or.getDecreaseOrders: ${await or.getDecreaseOrders(
    //         o.address,
    //         user0.address,
    //         [0,1,2]
    //     )}`);
    // });
});
