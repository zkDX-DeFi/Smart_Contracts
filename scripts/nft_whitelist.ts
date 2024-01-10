import {checkAddresses, getContracts} from "../helpers/utils";
import {ethers} from "hardhat";
import {MerkleTree} from "merkletreejs";
import {keccak256} from "ethers/lib/utils";

const fs = require("fs");

let whitelist = JSON.parse(fs.readFileSync('./scripts/other/whitelist.json', 'UTF-8'));
let whitelist2 = JSON.parse(fs.readFileSync('./scripts/other/whitelist2.json', 'UTF-8'));

async function main() {

    const {nft1, nft2} = await getContracts();

    // ===================== Update Whitelist ================================
    console.log(">> update whitelist v1 ...");
    let leafNode1 = whitelist.map((address: string) => keccak256(address.trim()));
    let tree1 = new MerkleTree(leafNode1, keccak256, {sortPairs: true});
    checkAddresses(whitelist);
    await nft1.setWhiteListMerkleRoot(tree1.getRoot());

    // let accounts = [
    //     "0x6eb9d4ad477ca8835a0cfe51e8615b87f6b033fc",
    //     "0x7caec00e024bbde0dcdaeed9c9407baf88fdc65c",
    //     "0xA3bE6747f424224729FB897D534e7f44B91A9F76"
    // ]
    // let amounts = [2, 2, 2];
    // await nft1.setBalances(accounts, amounts);

    // console.log(">> update whitelist v2 ...");
    // let invalidAddrList2 = [];
    // console.log(">> length:", whitelist2.length);
    // for (let i = 0; i < whitelist2.length; i++) {
    //     let addr = whitelist2[i]
    //     if (!ethers.utils.isAddress(addr))
    //         invalidAddrList2.push(addr);
    // }
    // if (invalidAddrList2.length > 0) {
    //     console.log("!! invalid addresses:", invalidAddrList2);
    //     return
    // }
    //
    // let leafNode2 = whitelist2.map((address: string) => keccak256(address));
    // let tree2 = new MerkleTree(leafNode2, keccak256, {sortPairs: true});
    // await nft2.setWhiteListMerkleRoot(tree2.getRoot());

    // ===================== Set Balances ================================
    // await nft1.setBalances(accounts, amounts);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
