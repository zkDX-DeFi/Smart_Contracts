import {ethers} from "hardhat";
import {defaultAbiCoder, formatEther, parseEther} from "ethers/lib/utils";
import {getLzChainIdByNetworkName} from "../../helpers/lzUtils";
import {AddressZero} from "../../helpers/utils";

async function main() {

    let owner = await ethers.getNamedSigner("owner");
    let esZKDXOmni = await ethers.getContract("esZKDXOmni");
    let transferAmount = parseEther("1");
    // let balance = await esZKDXOmni.balanceOf(owner.address);
    // if (balance.lt(transferAmount)) {
    //     console.log("minting...");
    //     await (await esZKDXOmni.mint(owner.address, parseEther("100000"))).wait();
    // }

    let dstChainId = getLzChainIdByNetworkName("base_mainnet");
    let receiver = defaultAbiCoder.encode(['address'], [owner.address]);

    // estimate fee
    let fees = await esZKDXOmni.estimateSendFee(
        dstChainId,
        receiver,
        transferAmount,
        false,
        "0x"
    );
    console.log(`fee: ${formatEther(fees[0])}`); // linea to base: 0.000051E, to zksync: 0.002403E

    // send
    let tx = await esZKDXOmni.sendFrom(
        owner.address,
        dstChainId,
        receiver,
        transferAmount,
        {
            refundAddress: owner.address,
            zroPaymentAddress: AddressZero,
            adapterParams: "0x"
        },
        {value: fees[0]}
    );
    console.log(`send tx: ${tx.hash}`)

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
