import {ApproveAmount, checkAddresses} from "../helpers/utils";
import {formatEther, parseEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {MultiTransfer, Token} from "../typechain";

async function main() {

    // ===================== Deploy MultiTransfer ================================
    // const {execute, read, deploy} = deployments;
    // const {owner} = await getNamedAccounts();
    // console.log(">> deploying multiTransfer");
    // await deploy("MultiTransfer", {
    //     from: owner,
    //     args: [],
    //     log: true,
    // });

    let accounts = [
        "0x558b726dd64EBfC062f439532806B6Ce36865f49",
        "0x7caec00E024BbDe0dCdaEED9c9407bAf88FDC65c",
        "0x0000040e525CE515Cca9F32c6997F5eC3cd17c22",
        "0x28525dc0a845c06a7b3a03be1550bd3937df29da",
        "0xefE632ddeCEbFfF2D3E96B0bb1BFf67358e6Bdc6",
        "0xB5B1b8b5aad7685fa74c3fE842D24451E1acF44F",
        "0xaDc5c7266BDA3fE01E87Eb90aaCa178334A6d485",
        "0xCE2A8E9dcEBFd6aed17FaAC7FE9A00ff7Bd1a826",
        "0x068b3841D39Afd65163D47c2AD1C950B00b8d854",
        "0x82aDb500c8b827fCd4bE3F7Bd5a166C606b9d819",
        "0x74e5B751A37f7102C654bef1B8491EdCd4988e09",
        "0x638fb4a64b7bDCa1b36a6380FC2cfD6Ad6a07dF0",
        "0x31f92d3806b31eBa9aec944370d386Ee224b1A61",
        "0xB111C7c9f6692256ea57743C0d9bA99Aa7054E0a",
        "0xB9CFd6c51Bab5D57A32D40C34b1A8641006dB00b",
        "0xc4fb95a823196906698E204F889a548EAaD0BE0D",
        "0x211F516557870ffbdb372BE50e2ba0b3F17c6f61",
        "0x6eb9d4aD477ca8835a0cFe51E8615B87F6b033Fc",
        "0xA3bE6747f424224729FB897D534e7f44B91A9F76",
        "0x5bf58855cdD9DA6006392B2Af0d67B6120176648",
    ];

    checkAddresses(accounts);

    let amounts = [
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
        parseEther("500"),
    ];

    let esZKDXOmni = await ethers.getContract<Token>("esZKDXOmni");
    let multiTransfer = await ethers.getContract<MultiTransfer>("MultiTransfer");
    let owner = await ethers.getNamedSigner("owner");

    let balance = await esZKDXOmni.balanceOf(owner.address);
    console.log(`owner es balance: ${formatEther(balance)}`);
    console.log(`accounts length: ${accounts.length}`)

    // await esZKDXOmni.approve(multiTransfer.address, ApproveAmount);
    await multiTransfer.multiTransfer20(esZKDXOmni.address, accounts, amounts);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
