import {deployments, ethers, getNamedAccounts} from "hardhat";
import {PositionManager, Router, Token, VaultPriceFeed} from "../typechain";
import {
    DOGE_MINT_AMOUNT,
    USDC_LINEA_MAINNET,
    WBTC_MINT_AMOUNT,
    WETH_MINT_AMOUNT,
    ZUSD_MINT_AMOUNT
} from "../helpers/constants";
import {ApproveAmount} from "../helpers/utils";
import {parseEther, parseUnits} from "ethers/lib/utils";

async function main() {

    const {execute, get, read} = deployments;
    const {owner} = await getNamedAccounts();

    let router = await ethers.getContract<Router>("Router");
    let zkdlpManager = await ethers.getContract("ZkdlpManager");
    let vaultPriceFeed = await ethers.getContract<VaultPriceFeed>("VaultPriceFeed");
    let positionManager = await ethers.getContract<PositionManager>("PositionManager");
    let weth = await ethers.getContract<Token>("WNative");
    let wbtc = await ethers.getContract<Token>("WBTC");
    let doge = await ethers.getContract<Token>("DOGE");
    let exchanger = await ethers.getContract("Exchanger");
    let zusd = await ethers.getContract("ZUSD");
    let shortsTracker = await ethers.getContract("ShortsTracker");
    let timelock = await ethers.getContract("Timelock");
    let zkdlp = await ethers.getContract("ZKDLP");
    let zkdx = await ethers.getContract("ZKDX");
    let zkusd = await ethers.getContract("ZKUSD");
    let usdc = await ethers.getContractAt("Token", USDC_LINEA_MAINNET);
    let vault = await ethers.getContract("Vault");

    await zusd.mint("0x3C02EF2F81b2ebcBBd6fDAa3AE3DdF7ed30b1820", parseEther("30"));

    // let fundingRate = await vault.fundingRateFactor();
    // console.log("fundingRate", fundingRate.toString());
    // let stableFundingRateFactor = await vault.stableFundingRateFactor();
    // console.log("stableFundingRateFactor", stableFundingRateFactor.toString());

    // await weth.mint(owner, parseEther("4"));
    // await doge.mint(owner, parseEther("90000"));
    // await zusd.mint("", parseEther("30"))
    // let own = await zusd.owner();
    // console.log("own:", own)
    // let isManager = await zusd.isManager(owner);
    // console.log("isManager:", isManager)

    // setFundingRate
    // await execute("Timelock", {from: owner}, "setFundingRate", vault.address, 3600, 2000, 2000);

    // await (await zusd.transferOwnership(newOwner)).wait();
    // await (await exchanger.transferOwnership(newOwner)).wait();

    // await zusd.mint("0x3C02EF2F81b2ebcBBd6fDAa3AE3DdF7ed30b1820", parseEther("30"));
    // await positionManager.setMinLiquidationFee(0)
    // await usdc.approve(exchanger.address, ApproveAmount);
    // await exchanger.exchange(usdc.address, parseUnits("28", 6));
    // let newOwner = "0x112e5Af0B8f74B60bA7a4F2C167Ba2B1d47c87dB";
    // await (await timelock.setAdmin(newOwner)).wait();
    // await (await weth.transferOwnership(newOwner)).wait();
    // await (await wbtc.transferOwnership(newOwner)).wait();
    // await (await doge.transferOwnership(newOwner)).wait();

    // await (await vaultPriceFeed.setGov(newOwner)).wait();
    // await (await positionManager.setGov(newOwner)).wait();
    // await (await positionManager.setAdmin(newOwner)).wait();
    // await (await router.setGov(newOwner)).wait();
    // await (await shortsTracker.setGov(newOwner)).wait();
    // await (await zkdlp.setGov(newOwner)).wait();
    // await (await zkdlpManager.setGov(newOwner)).wait();
    // await (await zkdx.setGov(newOwner)).wait();
    // await (await zkusd.setGov(newOwner)).wait();

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});