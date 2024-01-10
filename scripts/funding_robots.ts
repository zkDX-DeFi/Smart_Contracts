import {ethers} from "hardhat";
import {formatEther, parseEther} from "ethers/lib/utils";

async function main() {

    let owner = await ethers.getNamedSigner("owner");

    console.log(">> funding robots ...");
    let robots = [
        "0x3aaa18176100dd870903d465134d0522457aa70d",
        "0xb33539b8e18ff1bdf299d66c0e89fbe5e3de68b2",
        "0x104b5cda666a504da51220035f930a77b22b8124",
    ]
    for (let i = 0; i < robots.length; i++) {
        let robot = robots[i];
        let balance = await ethers.provider.getBalance(robot);
        console.log(`>> ${robot} balance: ${formatEther(balance)}`)
        if (balance.lt(parseEther("0.1"))) {
            console.log(`>> funding ${robot} ...`)
            await owner.sendTransaction({
                to: robot,
                value: parseEther("0.3"),
            })
        }
    }

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
