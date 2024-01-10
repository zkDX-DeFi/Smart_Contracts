import {DeployFunction} from "hardhat-deploy/types";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {
    getDeployByChainIdAndName,
    getNativeNameByChainId,
    getPythAddressByChainId
} from "../helpers/chains";
import {errors} from "../helpers/errors";
import {AddressZero, expandDecimals} from "../helpers/utils";
import {CHAIN_ID_LOCAL, CHAIN_ID_ZKSYNC_TESTNET} from "../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId}) {
    const {deploy, execute} = deployments;
    const {owner} = await getNamedAccounts();
    const chainId = await getChainId();
    console.log(">> starting deploying on chainId:", chainId);
    console.log(">> owner:", owner);
    console.log(">> deploying vault...");
    /* DEPLOY VAULT */
    const Vault = await deploy("Vault", {
        from: owner,
        args: [],
        log: true,
    });
    const ZKUSD = await deploy("ZKUSD", {
        from: owner,
        args: [Vault.address],
        log: true,
    });
    const nativeName = getNativeNameByChainId(chainId);

    console.log(`nativeName: ${nativeName}`);
    const WNative = await getDeployByChainIdAndName(chainId, "WNative", "Token", [nativeName, 18, parseEther("0"), parseEther("0"), 0]);
    console.log(`WNative: ${WNative.address}`);

    const pythContractAddr = await getPythAddressByChainId(chainId);
    const VaultPriceFeed = await deploy("VaultPriceFeed", {
        from: owner,
        args: [pythContractAddr],
        log: true,
    });
    const Router = await deploy("Router", {
        from: owner,
        args: [Vault.address, ZKUSD.address, WNative.address],
        log: true,
    });

    let marginFeeBasisPoints = 10;
    if (CHAIN_ID_LOCAL != chainId)
        marginFeeBasisPoints = 5;
    await deploy("Timelock", {
        from: owner,
        args: [
            owner,
            60,
            AddressZero,
            owner,
            owner,
            expandDecimals(1000, 18),
            marginFeeBasisPoints, // marginFeeBasisPoints
            500, // maxMarginFeeBasisPoints
        ],
        log: true,
    });
    const VaultUtils = await deploy("VaultUtils", {
        from: owner,
        args: [Vault.address],
        log: true,
    });
    const VaultErrorController = await deploy("VaultErrorController", {
        from: owner,
        args: [],
        log: true,
    });

    /* VAULT INIT */
    await execute("Vault", {from: owner}, "initialize", Router.address, ZKUSD.address, VaultPriceFeed.address, parseUnits("5", 30), 100, 100);
    await execute("Vault", {from: owner}, "setVaultUtils", VaultUtils.address);
    await execute("Vault", {from: owner}, "setErrorController", VaultErrorController.address);
    if (CHAIN_ID_ZKSYNC_TESTNET == chainId) {
        await execute("VaultErrorController", {from: owner, gasLimit: 250000000}, "setErrors", Vault.address, errors);
    } else {
        await execute("VaultErrorController", {from: owner}, "setErrors", Vault.address, errors);
    }
};
export default func;
func.tags = ["vault"];
