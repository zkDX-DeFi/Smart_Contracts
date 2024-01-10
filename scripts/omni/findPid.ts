import {ethers, getChainId} from "hardhat";
import {getStgRouterByChainId} from "../../helpers/chains";
import {AddressZero} from "../../helpers/utils";

async function main() {

    let chainId = await getChainId();
    console.log(`chainId: ${chainId}`)
    let routerAddr = await getStgRouterByChainId(chainId);
    let owner = await ethers.getNamedSigner("owner");

    let abiRouter = ["function factory() external view returns (address)"]
    let router = new ethers.Contract(routerAddr, abiRouter, owner);
    let factoryAddr = await router.factory();
    console.log(`factoryAddr: ${factoryAddr}`)

    let abiFactory = ["function getPool(uint256) external view returns (address)"]
    let factory = new ethers.Contract(factoryAddr, abiFactory, owner);

    let abiPool = ["function token() external view returns (address)"]

    for (let i = 12; i < 15; i++) {
        console.log(`looking for poolId: ${i}`)
        let poolAddr = await factory.getPool(i);
        if (poolAddr == AddressZero)
            continue;

        console.log(`poolAddr: ${poolAddr}`)
        let pool = new ethers.Contract(poolAddr, abiPool, owner);
        let tokenAddr = await pool.token();
        console.log(`tokenAddr: ${tokenAddr}`)
        let token = await ethers.getContractAt("Token", tokenAddr);
        let name = await token.name();
        console.log(`name: ${name}`)
        let symbol = await token.symbol();
        console.log(`symbol: ${symbol}`)
        let decimals = await token.decimals();
        console.log(`decimals: ${decimals}`)

        // 1:USDC 13:ETH

        // match
        // let usdcAddr = await getStgUsdcByChainId(chainId);
        // if (tokenAddr == usdcAddr) {
        //     console.log(`found poolId: ${i}`)
        //     let usdc = await ethers.getContractAt("Token", usdcAddr);
        //     let balance = await usdc.balanceOf(poolAddr);
        //     console.log(`pool balance: ${formatUnits(balance, 6)}`);
        //     break;
        // }
    }
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
