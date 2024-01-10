import {AddressZero, ApproveAmount, setupFixture} from "../../../helpers/utils";
import {MerkleTree} from "merkletreejs";
import {expect} from "chai";
import {keccak256, parseEther} from "ethers/lib/utils";
import {deployContract} from "../../../helpers/utils2";

const fs = require('fs');

let whitelist = JSON.parse(fs.readFileSync('./scripts/other/whitelist.json', 'UTF-8'));
let uri = "ipfs://bafkreibjw5pxgc3k4owd5drdoaxanil4zcu2nul3et5oxqczgjiypctkly";

describe("ZKDXNFT", async () => {
    let owner: any,
        user0: any,
        user1: any,
        user2: any,
        user3: any,
        nft: any,
        tree: any,
        root: any,
        dai: any,
        multiTransfer: any

    beforeEach(async () => {
        let fixture = await setupFixture();
        owner = fixture.owner;
        user0 = fixture.user0;
        user1 = fixture.user1;
        user2 = fixture.user2;
        user3 = fixture.user3;
        dai = fixture.dai;

        whitelist.push(user0.address);
        whitelist.push(user1.address);
        whitelist.push(user2.address);

        // create root
        let leafNodes = whitelist.map((address: string) => keccak256(address));
        tree = new MerkleTree(leafNodes, keccak256, {sortPairs: true});
        root = tree.getRoot();
        nft = await deployContract("ZKDXNFT", [uri, "", 1685577600, root, "zkDX NFT LV1a", "zkDXL1"]);
        multiTransfer = await deployContract("MultiTransfer", []);

        nft.setBalances([user1.address, user2.address], [2, 3]);
    })

    it("check metadata", async () => {
        expect(await nft.baseURI()).to.equal(uri);
        expect(await nft.baseExtension()).to.equal("");
        expect(await nft.startTime()).to.equal(1685577600);
        expect(await nft.isSimpleURI()).to.equal(true);
        expect(await nft.totalSupply()).to.equal(0);
        expect(await nft.mintAmounts(user0.address)).to.equal(0);
        expect(await nft.mintedAmounts(user0.address)).to.equal(0);
        expect(await nft.getMintBalance(user0.address, tree.getHexProof(keccak256(user0.address)))).to.eq(1);
        expect(await nft.getMintBalance(user1.address, tree.getHexProof(keccak256(user1.address)))).to.eq(2);
        expect(await nft.getMintBalance(user2.address, tree.getHexProof(keccak256(user2.address)))).to.eq(3);
    })

    it("check mint", async () => {
        // owner mint
        await nft.govMint(owner.address, 10);
        expect(await nft.totalSupply()).to.eq(10);

        // user0 mint 1
        await expect(nft.connect(user0).mint(user0.address, 2, tree.getHexProof(keccak256(user0.address))))
            .to.be.revertedWith("Your mint balance is not enough.");
        await nft.connect(user0).mint(user0.address, 1, tree.getHexProof(keccak256(user0.address)));
        expect(await nft.balanceOf(user0.address)).to.eq(1);
        expect(await nft.totalSupply()).to.eq(11);

        // user1 mint 2
        await nft.connect(user1).mint(user1.address, 2, tree.getHexProof(keccak256(user1.address)));
        expect(await nft.balanceOf(user1.address)).to.eq(2);
        expect(await nft.totalSupply()).to.eq(13);

        // user2 mint 2 and 1
        await nft.connect(user2).mint(user2.address, 2, tree.getHexProof(keccak256(user2.address)));
        expect(await nft.balanceOf(user2.address)).to.eq(2);
        await nft.connect(user2).mint(user2.address, 1, tree.getHexProof(keccak256(user2.address)));
        expect(await nft.totalSupply()).to.eq(16);
        await expect(nft.connect(user2).mint(user2.address, 1, tree.getHexProof(keccak256(user2.address))))
            .to.be.revertedWith("Your mint balance is not enough.");

        // user3 not in whitelist
        await expect(nft.connect(user3).mint(user3.address, 1, tree.getHexProof(keccak256(user3.address))))
            .to.be.revertedWith("You are not in whitelist.");

        // check token uri
        expect(await nft.tokenURI(1)).to.eq(uri);
        expect(await nft.tokenURI(10)).to.eq(uri);
    })

    it("check multi transfer erc20", async () => {
        await dai.mint(user0.address, parseEther("800000"));
        await dai.connect(user0).approve(multiTransfer.address, ApproveAmount);
        await multiTransfer.connect(user0).multiTransfer20(dai.address, [user1.address, user2.address, user3.address],
            [parseEther("400000"), parseEther("200000"), parseEther("200000")]);
        expect(await dai.balanceOf(user0.address)).to.eq(parseEther("0"));
        expect(await dai.balanceOf(user1.address)).to.eq(parseEther("400000"));
        expect(await dai.balanceOf(user2.address)).to.eq(parseEther("200000"));
        expect(await dai.balanceOf(user3.address)).to.eq(parseEther("200000"));
    })

    it("check multi transfer erc721", async () => {
        await nft.setBalances([user0.address], [3]);
        await nft.connect(user0).mint(user0.address, 3, tree.getHexProof(keccak256(user0.address)));
        await nft.connect(user0).setApprovalForAll(multiTransfer.address, true);
        await multiTransfer.connect(user0).multiTransfer721(nft.address, [user1.address, user2.address, user3.address],
            [1, 2, 3]);
        expect(await nft.balanceOf(user0.address)).to.eq(0);
        expect(await nft.balanceOf(user1.address)).to.eq(1);
        expect(await nft.balanceOf(user2.address)).to.eq(1);
        expect(await nft.balanceOf(user3.address)).to.eq(1);
    });

    it("check nft.func => setBaseURI() + setBaseExtension()", async() => {
        expect(await nft.baseURI()).not.eq(AddressZero);
        await expect(
            nft.connect(user0).setBaseURI("https://ipfs.io/ipfs/"))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await nft.setBaseURI("https://ipfs.io/ipfs/");
        expect(await nft.baseURI()).eq("https://ipfs.io/ipfs/");

        expect(await nft.baseExtension()).eq("");
        await expect(
            nft.connect(user0).setBaseExtension(".json"))
            .to.be.revertedWith("Ownable: caller is not the owner");

        await nft.setBaseExtension(".json");
        expect(await nft.baseExtension()).eq(".json");
    });
    it("check nft.func => setStartTime()", async() => {
        expect(await nft.startTime()).not.eq(0);
        await expect(
            nft.connect(user0).setStartTime(1685577600))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await nft.setStartTime(1685577600);
        expect(await nft.startTime()).eq(1685577600);
    });
    it("check nft.func => setIsSimpleURI()", async() => {
        expect(await nft.isSimpleURI()).eq(true);
        await expect(
            nft.connect(user0).setIsSimpleURI(false))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await nft.setIsSimpleURI(false);
        expect(await nft.isSimpleURI()).eq(false);
    });
    it("check nft.func => setBalances()", async() => {
        const _accounts = [user0.address, user1.address, user2.address];
        const _balances = [1, 2, 3,4];
        await expect(nft.setBalances(_accounts, _balances)).to.be.revertedWith("Invalid length!");

        const _accounts2 = [];
        const _balances2 = [];
        await expect(nft.setBalances(_accounts2, _balances2)).to.be.revertedWith("Invalid accounts!");

        const _accounts3 = [user0.address, user1.address, user2.address];
        const _balances3 = [1, 2, 3];
        await expect(nft.connect(user0).setBalances(_accounts3, _balances3))
            .to.be.revertedWith("Ownable: caller is not the owner");

        const _whitelistMerkleRoot = "0x";
        await expect(nft.connect(user0).setWhiteListMerkleRoot(root))
            .to.be.revertedWith("Ownable: caller is not the owner");
        await nft.setWhiteListMerkleRoot(root);
    });

    it("check nft.func => tokenURI()", async() => {
        await expect(nft.tokenURI(0)).to.be.revertedWith("URI query for nonexistent token");

        console.log(`${await nft.isSimpleURI()}`);
        console.log(`${await nft.baseURI()}`);

        await nft.connect(user0).mint(user0.address, 1, tree.getHexProof(keccak256(user0.address)));
        console.log(`${await nft.tokenURI(1)}`);
        await nft.setIsSimpleURI(false);
        console.log(`${await nft.tokenURI(1)}`);
        await nft.setBaseURI("");
        console.log(`${await nft.tokenURI(1)}`);

        await nft.setIsSimpleURI(true);
        await nft.setBaseURI("ipfs://bafkreibjw5pxgc3k4owd5drdoaxanil4zcu2nul3et5oxqczgjiypctkly");
        console.log(`${await nft.tokenURI(1)}`);
        await nft.setBaseURI("");
        console.log(`${await nft.tokenURI(1)}`);
    });

    it("check nft.func => mint()", async() => {
        const nft2 = await deployContract("ZKDXNFT", [uri, "", 1785577600, root, "zkDX NFT LV1a", "zkDXL1"]);

        await expect(nft2.connect(user0).mint(user0.address, 1, tree.getHexProof(keccak256(user0.address))))
            .to.be.revertedWith("Not started.");
        await expect(nft.connect(user0).govMint(user0.address, 1))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
});

