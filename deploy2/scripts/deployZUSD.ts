import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {getZusdConfig} from "../../helpers/params";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {DefaultParams2} from "../../helpers/chains";
import {CHAIN_ID_LINEA_MAINNET, USDC_LINEA_MAINNET} from "../../helpers/constants";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {execute, deploy} = deployments;
    const {owner} = await getNamedAccounts();
    console.log(chalk.greenBright(">> scripts: deployZUSD.ts"));
    const chainId = await getChainId();

    let usdcAddress;
    if (chainId == CHAIN_ID_LINEA_MAINNET) {
        usdcAddress = USDC_LINEA_MAINNET;
    } else {
        let USDC = await deploy("USDC", await DefaultParams2(chainId,
            {
                from: owner,
                contract: "Token",
                args: ["USDC", 6, parseUnits("1000000", 6), parseUnits("10", 6), 10]
            })
        );
        usdcAddress = USDC.address;
    }

    const ZUSD = await deploy("ZUSD", await DefaultParams2(chainId));

    const ZUSDPool = await deploy("ZUSDPool", await DefaultParams2(chainId,
        {
            args: [ZUSD.address]
        })
    );

    await execute("Vault", await DefaultParams2(chainId), "setTokenConfig", ...getZusdConfig(ZUSD));
    await execute("ZUSD", await DefaultParams2(chainId), "setManager", owner, true);
    await execute("ZUSD", await DefaultParams2(chainId), "setManager", ZUSDPool.address, true);
    await execute("ZUSDPool", await DefaultParams2(chainId), "setWhitelistToken", usdcAddress, true);
    await execute("ZUSDPool", await DefaultParams2(chainId), "setCap", parseEther("10000"));

    await execute("VaultPriceFeed", await DefaultParams2(chainId), "setStableToken", ZUSD.address, true);
    await execute("PositionManager", await DefaultParams2(chainId), "setZusd", ZUSD.address);



};
export default func;
func.tags = ["staging", "ZUSD"];
