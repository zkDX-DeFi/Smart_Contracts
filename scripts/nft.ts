import {deployments, ethers, getNamedAccounts} from "hardhat";
import {MerkleTree} from "merkletreejs";
import {keccak256} from "ethers/lib/utils";

const fs = require("fs");

let whitelist1 = JSON.parse(fs.readFileSync('./scripts/other/whitelist.json', 'UTF-8'));
let whitelist2 = JSON.parse(fs.readFileSync('./scripts/other/whitelist2.json', 'UTF-8'));
let whitelist5 = JSON.parse(fs.readFileSync('./scripts/other/whitelist5.json', 'UTF-8'));
let uri = "ipfs://bafkreibjw5pxgc3k4owd5drdoaxanil4zcu2nul3et5oxqczgjiypctkly";
let accounts = JSON.parse(fs.readFileSync('./scripts/other/accounts.json', 'UTF-8'));
let amounts = JSON.parse(fs.readFileSync('./scripts/other/amounts.json', 'UTF-8'));

async function main() {

    const {execute, read, deploy} = deployments;
    const {owner} = await getNamedAccounts();

    // ===================== Deploy NFT v2 ================================
    console.log(">> deploying zkdx nft v1 ...");
    let invalidAddrList1 = [];
    for (let i = 0; i < whitelist1.length; i++) {
        let addr = whitelist1[i]
        if (!ethers.utils.isAddress(addr))
            invalidAddrList1.push(addr);
    }
    if (invalidAddrList1.length > 0) {
        console.log("!! invalid addresses:", invalidAddrList1);
        return
    }

    let leafNode1 = whitelist1.map((address: string) => keccak256(address));
    let tree1 = new MerkleTree(leafNode1, keccak256, {sortPairs: true});
    await deploy("ZKDXNFT1", {
        from: owner,
        contract: "ZKDXNFT",
        args: [uri, "", 1685525667, tree1.getRoot(), "zkDX NFT LV1", "zkDXL1"],
        log: true,
    });

    // ===================== Deploy NFT v2 ================================
    console.log(">> deploying zkdx nft v2 ...");
    let invalidAddrList2 = [];
    for (let i = 0; i < whitelist2.length; i++) {
        let addr = whitelist2[i]
        if (!ethers.utils.isAddress(addr))
            invalidAddrList2.push(addr);
    }
    if (invalidAddrList2.length > 0) {
        console.log("!! invalid addresses:", invalidAddrList2);
        return
    }

    let leafNodes2 = whitelist2.map((address: string) => keccak256(address));
    let tree2 = new MerkleTree(leafNodes2, keccak256, {sortPairs: true});
    await deploy("ZKDXNFT2", {
        from: owner,
        contract: "ZKDXNFT",
        args: [uri, "ipfs://bafkreievf37tbccplf53b5nomtzusot5zquojgnhxk4v3pc6aqsijkl6d4", 1689047093, tree2.getRoot(), "zkDX NFT LV2", "zkDXL2"],
        log: true,
    });

    // ===================== Deploy NFT v5 ================================
    console.log(">> deploying zkdx nft v5 ...");
    let invalidAddrList5 = [];
    for (let i = 0; i < whitelist5.length; i++) {
        let addr = whitelist5[i]
        if (!ethers.utils.isAddress(addr))
            invalidAddrList5.push(addr);
    }
    if (invalidAddrList5.length > 0) {
        console.log("!! invalid addresses:", invalidAddrList5);
        return
    }

    let leafNode5 = whitelist5.map((address: string) => keccak256(address));
    let tree5 = new MerkleTree(leafNode5, keccak256, {sortPairs: true});
    await deploy("ZKDXNFT5", {
        from: owner,
        contract: "ZKDXNFT",
        args: [uri, "ipfs://bafkreib4onf5nflzief2tcfwt5jov6mdyn74bjbn6bj3d5i7s7uvnkamyu", 1689047093, tree5.getRoot(), "zkDX NFT LV5", "zkDXL5"],
        log: true,
    });



    // await execute("ZKDXNFT", {from: owner}, "setBalances", accounts, amounts);
    // isValidMerkleProof
    // let account = "0x8ba099790596e7b28f1798adebab1c7cacf226c1";
    // let isValid = await read("ZKDXNFT", "isValidMerkleProof", account, tree.getHexProof(keccak256(account)));
    // console.log("isValid:", isValid)

    // let a = "0xd2D96f4b6Fb0028A52E8CfBc42ADBdD19d1a80f";
    // let x = keccak256(a);
    // console.log(x)

    // let total = await read("ZKDXNFT", "totalSupply");
    // console.log("total:", total.toNumber());

    // ===================== Mint ================================
    // await execute("ZKDXNFT", {from: owner}, "mint", owner, 1, tree.getHexProof(keccak256(owner)));

    // ===================== Discord NFT ================================
    // await read("ZKDXLV1", "balanceOf", "0x1df7121c6543888f0f7ecd3c07ef5a265260c48d");
    // let abi = ["function tokenURI(uint256 tokenId) public view returns (string)"]
    // let nftDiscord = await ethers.getContractAt(abi, "0xcCC3eA590d5859Cf6bB529B344BF62B8863aB7D1");
    // let uri1 = await nftDiscord.tokenURI(1);
    // console.log("uri:", uri1); // https://gateway.pinata.cloud/ipfs/QmW8MCX1EEdkEJ4dqEbLKfAw56E28Xhb9nrnriWjweARwc

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
