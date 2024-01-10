import {AddressOne, AddressZero, ApproveAmount, setupFixture} from "../helpers/utils";
import {ethers} from "hardhat";
import {defaultAbiCoder, parseEther} from "ethers/lib/utils";
import {deployContract} from "../helpers/utils2";
import {expect} from "chai";

describe("esZKDXOmni", async () => {

    let owner: any,
        user1: any,
        lzEndPoint1: any,
        lzEndPoint2: any,
        esZKDXOmni1: any,
        esZKDXOmni2: any,
        esZKDX: any,
        chainId1 = 31337,
        chainId2 = 31338,
        currentSupply = parseEther("52655000");

    beforeEach(async () => {
        ({owner, user1} = await setupFixture());

        // init lz endpoint
        lzEndPoint1 = await deployContract("LZEndpoint", [chainId1]);
        lzEndPoint2 = await deployContract("LZEndpoint", [chainId2]);

        esZKDX = await deployContract("esZKDX", [currentSupply]);
        esZKDXOmni1 = await deployContract("esZKDXOmniEra", [lzEndPoint1.address, esZKDX.address]);
        esZKDXOmni2 = await deployContract("esZKDXOmni", [lzEndPoint2.address, owner.address]);

        await lzEndPoint1.setDestLzEndpoint(esZKDXOmni2.address, lzEndPoint2.address);
        await lzEndPoint2.setDestLzEndpoint(esZKDXOmni1.address, lzEndPoint1.address);

        await esZKDXOmni1.setTrustedRemote(
            chainId2,
            ethers.utils.solidityPack(["address", "address"], [esZKDXOmni2.address, esZKDXOmni1.address])
        );
        await esZKDXOmni2.setTrustedRemote(
            chainId1,
            ethers.utils.solidityPack(["address", "address"], [esZKDXOmni1.address, esZKDXOmni2.address])
        );
    });

    it("check esZKDXOmni1.sol => ", async function () {
        await expect(esZKDXOmni1.connect(user1).mint(user1.address, parseEther("1000")))
            .to.be.reverted;
        await esZKDXOmni1.mint(user1.address, parseEther("1000"));
    });

    it("check omni send", async function () {

        let amount = parseEther("1000");
        let receiver = defaultAbiCoder.encode(['address'], [user1.address]);
        await esZKDX.approve(esZKDXOmni1.address, ApproveAmount);
        await esZKDXOmni1.upgrade();
        await esZKDXOmni1.sendFrom(
            owner.address,
            chainId2,
            receiver,
            amount,
            {
                refundAddress: owner.address,
                zroPaymentAddress: AddressZero,
                adapterParams: "0x"
            },
            {value: parseEther("0.1")}
        );
        expect(await esZKDXOmni1.totalSupply()).to.equal(currentSupply.sub(amount));
        expect(await esZKDXOmni1.balanceOf(owner.address)).to.equal(currentSupply.sub(amount));
        expect(await esZKDXOmni2.balanceOf(user1.address)).to.equal(amount);
        expect(await esZKDX.balanceOf(owner.address)).to.equal(0);
        expect(await esZKDX.balanceOf(AddressOne)).to.equal(currentSupply);

        await esZKDXOmni1.sendFrom(
            owner.address,
            chainId2,
            receiver,
            amount,
            {
                refundAddress: owner.address,
                zroPaymentAddress: AddressZero,
                adapterParams: "0x"
            },
            {value: parseEther("0.1")}
        );
        expect(await esZKDXOmni1.totalSupply()).to.equal(currentSupply.sub(amount.mul(2)));
        expect(await esZKDXOmni2.balanceOf(user1.address)).to.equal(amount.mul(2));
    })

    it("check upgrade", async function () {

        await esZKDX.approve(esZKDXOmni1.address, ApproveAmount);
        await esZKDXOmni1.upgrade();
        expect(await esZKDXOmni1.totalSupply()).to.equal(currentSupply);
        expect(await esZKDX.balanceOf(AddressOne)).to.equal(currentSupply);
        await expect(esZKDXOmni1.upgrade()).to.be.revertedWith("no balance or already upgraded");
    })
});

