import {
    ApproveAmount, forwardTime,
    setupFixture, toUsd,
} from "../../../helpers/utils";
import {formatEther, formatUnits, parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {
    MAX_WITHIN
} from "../../../helpers/constants";
import {constants} from "ethers";
import {ethers, network} from "hardhat";
import {ErrorsV2} from "../../../helpers/errorsV2";
import {parse} from "url";
import {OP_GET_UPDATEData, splitter} from "../../../helpers/utils2";
import {getUpdateData, updateMarkPrice} from "../../../helpers/utilsForTest";
describe("check Test VaultV2 => P1_0607", async () => {
    let
        weth                : any,
        wbtc                : any,
        dai                 : any,
        usdc                : any,
        tsla                : any,
        aapl                : any, //aapl
        zkdlp               : any,
        dlp                 : any,
        zkusd               : any,
        zkdx                : any,
        zkdxlv1             : any,

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
        t                   : any, //timelock
        vault               : any,
        v                   : any, //vault
        v2                  : any, //vaultV2
        feed                : any, //vaultFeed
        vaultUtils          : any,
        vu                  : any, //vaultUtils
        vec                 : any, //vaultErrorController
        pythContract        : any,

        pm                  : any, //positionManager
        dlpManager          : any,
        dm                  : any, //dlpManager
        router              : any,
        r                   : any, //router
        shortsTracker       : any,
        ss                  : any, //shortsTracker
        o                   : any, //orderBook
        rewardRouter        : any,
        rr                  : any, //rewardRouter
        reader              : any,
        obr                 : any, //orderBookReader
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
        aapl                = fixture.aapl;
        zkdlp               = fixture.zkdlp;
        dlp                 = zkdlp;
        zkusd               = fixture.ZKUSD;
        zkdx                = fixture.ZKDX;
        zkdxlv1             = fixture.zkdxlv1;

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
        v2                  = fixture.v2;
        feed                = fixture.vaultPriceFeed;
        vaultUtils          = fixture.VaultUtils;
        vu                  = vaultUtils;
        vec                 = fixture.vaultErrorController;
        pythContract        = fixture.pythContract;

        pm                  = fixture.positionManager;
        dlpManager          = fixture.zkdlpManager;
        dm                  = dlpManager;
        router              = fixture.router;
        r                   = router;
        shortsTracker       = fixture.shortsTracker;
        ss                  = shortsTracker;
        o                   = fixture.orderBook;
        rewardRouter        = fixture.rewardRouter;
        rr                  = rewardRouter;
        reader              = fixture.reader;
        obr                 = fixture.orderBookReader;
        /* Staking */
        stakingUSDC         = fixture.stakingUSDC;
        stakingETH          = fixture.stakingETH;
        esZKDX              = fixture.esZKDX;
        rewardToken         = esZKDX;
        stakingToken        = usdc;

        await feed.setValidTime(300);
        // await v2.setTokenConfig(dai.address, true,true,true);
        // await v2.setTokenConfig(tsla.address, true,false,true);
        // await v2.setTokenConfig(weth.address, true,false,true);
    });
    // it("check AAPL => params", async() => {
    //     expect(await v2.gov()).eq(owner.address);
    //     expect(v2.address).not.eq(constants.AddressZero);
    //     expect(await aapl.totalSupply()).eq(0);
    //     expect(await aapl.name()).eq("AAPL");
    //     expect(await aapl.symbol()).eq("AAPL");
    // })
    // it("check VaultV2 => ", async() => {
    //     let _user = user0;
    //     let _collateralToken = dai;
    //     let _indexToken = tsla;
    //     let _sizeDelta = toUsd(1000);
    //     let _isLong = true;
    //     let _positionType = 1;
    //     let _price = toUsd(160);
    //     let p;
    //
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, _isLong, _positionType, _sizeDelta,);
    //     p = await v2.getPosition(_user.address, _collateralToken.address, _indexToken.address, _isLong, _positionType);
    //     expect(p[0]).eq(_sizeDelta.mul(1));
    //     expect(p[1]).eq(0);
    //     expect(p[2]).eq(parseEther("1"));
    //     expect(p[3]).eq(parseEther("6.25"));
    //     expect(p[4]).gt(0);
    //
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, _isLong, _positionType, _sizeDelta,);
    //     p = await v2.getPosition(_user.address, _collateralToken.address, _indexToken.address, _isLong, _positionType);
    //     expect(p[0]).eq(_sizeDelta.mul(2));
    //     expect(p[1]).eq(0);
    //     expect(p[2]).eq(parseEther("2"));
    //     expect(p[3]).eq(parseEther("12.5"));
    //     expect(p[4]).gt(0);
    //
    //     p = await v2.getPosition(_user.address, _collateralToken.address, _indexToken.address, _isLong, 0);
    //     expect(p[0]).eq(0);
    //     expect(p[1]).eq(0);
    //     expect(p[2]).eq(0);
    //     expect(p[3]).eq(0);
    //     expect(p[4]).eq(0);
    // });
    // it("check VaultV2.func => IP => v1", async() => {
    //     let _user = user0;
    //     let _collateralToken = dai;
    //     let _indexToken = tsla;
    //     let _sizeDelta = toUsd(12345);
    //     let _positionType = 1;
    //     let p;
    //
    //     await updateMarkPrice(['weth','dai','tsla','wbtc']);
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, true,  _positionType, _sizeDelta,);
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, false, _positionType, _sizeDelta,);
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, false, _positionType, _sizeDelta,);
    //
    //     p = await v2.getPosition(_user.address, _collateralToken.address, _indexToken.address, true, 1);
    //     expect(p[0]).eq(_sizeDelta.mul(1));
    //     p = await v2.getPosition(_user.address, _collateralToken.address, _indexToken.address, false, 1);
    //     expect(p[0]).eq(_sizeDelta.mul(2));
    // });
    // it("check VaultV2.func => IP => v1", async() => {
    //     let _user = user0;
    //     let _collateralToken = dai;
    //     let _indexToken = tsla;
    //     let _sizeDelta = toUsd(1000);
    //     let _positionType = 1;
    //     let p;
    //
    //     async function print() {
    //         p = await v2.getPosition(_user.address, _collateralToken.address, _indexToken.address, true, _positionType);
    //         console.log(`size: ${formatUnits(p[0], 30)}`);
    //         console.log(`col : ${formatEther(p[1])}`);
    //         // console.log(`${formatEther(p[2])}`);
    //         console.log(`rsv : ${formatEther(p[3])}`);
    //         splitter();
    //     }
    //
    //     await updateMarkPrice(['weth','dai','tsla','wbtc']);
    //     await dai.mint(v2.address, parseEther("100"));
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, true,  _positionType, _sizeDelta,);
    //     await print();
    //
    //     await dai.mint(v2.address, parseEther("100"));
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, true,  _positionType, _sizeDelta,);
    //     await print();
    //
    //     await dai.mint(v2.address, parseEther("100"));
    //     await v2.increasePosition(_user.address, _collateralToken.address, _indexToken.address, true,  _positionType, _sizeDelta,);
    //     await print();
    // });
    // it("check VaultV2.func => getLSPS => v1", async() => {
    //     let _user = user0;
    //     let _collateralToken = dai;
    //     let _indexToken = tsla;
    //     let _sizeDelta = toUsd(1000);
    //     let _positionType = 1;
    //     let p;
    //
    //     console.log(`${await v2.getLSPS(
    //         _collateralToken.address,
    //         _indexToken.address,
    //         _positionType)}`);
    // });
});
