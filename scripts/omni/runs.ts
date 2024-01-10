import {ethers, getChainId} from "hardhat";
import {formatEther, parseEther} from "ethers/lib/utils";
import {CHAIN_ID_ZKSYNC_TESTNET} from "../../helpers/constants";
import {AddressOne} from "../../helpers/utils";

async function main() {

    let chainId = await getChainId();
    console.log(`running on chainId: ${chainId}`)

    // let esZKDX = await ethers.getContract("esZKDX");
    // let receiver = "0xD2B3e1907B7cD9D4Dd7f6AAbB4433557EB37925a";
    // await esZKDX.mint(receiver, parseEther("10000"));

    // let balance = await esZKDX.balanceOf(owner.address);
    let owner = await ethers.getNamedSigner("owner");
    // await esZKDX.mint(owner.address, parseEther("10000"));
    // console.log(`balance: ${formatEther(balance)}`)
    //
    // if(chainId == CHAIN_ID_ZKSYNC_TESTNET){
    //     let esZKDX = await ethers.getContract("esZKDX");
    //     let balance = await esZKDX.balanceOf(owner.address);
    //     console.log(`old balance: ${formatEther(balance)}`)
    //     let balanceOne = await esZKDX.balanceOf(AddressOne);
    //     console.log(`old balanceOne: ${formatEther(balanceOne)}`)
    //     // await esZKDX.mint("0x460e646a1907DE5B6DaC45EfCEcd9e203AAfc3b5", parseEther("1000"));
    // }

    // await esZKDX.mint("0x4e8730f175811C3079C411309DB823E62a4f9598", parseEther("10000"));

    let esZKDXOmni = await ethers.getContract("esZKDXOmni");
    await esZKDXOmni.mint("0x1df7121c6543888F0f7EcD3C07Ef5A265260c48D", parseEther("100000"));
    // await esZKDXOmni.transfer(AddressOne, parseEther("10000"));
    // await esZKDXOmni.transferOwnership("0x112e5Af0B8f74B60bA7a4F2C167Ba2B1d47c87dB");
    // let stakingETH = await ethers.getContract("OmniStakingETH");
    //
    // let ledger2 = "0x112e5Af0B8f74B60bA7a4F2C167Ba2B1d47c87dB"
    // await omniZKDX.transferOwnership(ledger2);
    // await stakingETH.transferOwnership(ledger2);

    // let rewardAmount = parseEther("10000");
    // let txMint = await omniZKDX.mint(stakingETH.address, rewardAmount);
    // await txMint.wait();
    // await stakingETH.notifyRewardAmount(rewardAmount);

    // let routerAddress = await stakingETH.stgRouterETH();
    // console.log(`routerAddress: ${routerAddress}`)
    // await stakingETH.setStgRouterETH(getStgRouterEthByChainId(chainId), {gasPrice: parseUnits("1", "gwei")});
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
