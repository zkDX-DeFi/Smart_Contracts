import {ethers} from "hardhat";
import {parseEther} from "ethers/lib/utils";
import {sleep} from "../../helpers/utils2";

async function main() {

    let targetNonce = 0;
    let sameNonceSigner = (await ethers.getSigners())[1];
    let count = await ethers.provider.getTransactionCount(sameNonceSigner.address);
    console.log(`>> sameNonceSigner: ${sameNonceSigner.address}, currentCount: ${count}`);

    let gasPrice = await ethers.provider.getGasPrice();
    for (let i = 0; i < targetNonce + 1 - count; i++) {
        let tx = await sameNonceSigner.sendTransaction({
            to: sameNonceSigner.address,
            value: parseEther("0.0001"),
            gasPrice: gasPrice.mul(15).div(10),
            nonce: 0
        });
        await tx.wait();
        await sleep(1500);
    }
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});