import {DeployFunction} from "hardhat-deploy/types";
import {parseEther} from "ethers/lib/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {
    const {deploy, execute, get} = deployments;
    const {owner} = await getNamedAccounts();

    console.log(">> deploying LPool...");

    const ZKLP = await deploy("ZKLP", {
        from: owner,
        args: [],
        log: true,
    });

    const ZKHLP = await deploy("ZKHLP", {
        from: owner,
        args: [],
        log: true,
    });

    const LPool = await deploy("LPool", {
        from: owner,
        contract: "LPool",
        args: [ZKLP.address],
        log: true,
    });

    const HLPool = await deploy("HLPool", {
        from: owner,
        contract: "LPool",
        args: [ZKHLP.address],
        log: true,
    });

    const DAI = await get("DAI");
    await execute("ZKLP", {from: owner}, "setManager", LPool.address, true);
    await execute("ZKHLP", {from: owner}, "setManager", HLPool.address, true);
    await execute("LPool", {from: owner}, "setWhitelistToken", DAI.address, true);
    await execute("LPool", {from: owner}, "setCap", parseEther("10000"));
    await execute("HLPool", {from: owner}, "setWhitelistToken", DAI.address, true);
    await execute("HLPool", {from: owner}, "setCap", parseEther("10000"));

};

export default func;
func.tags = ["lpool"];
