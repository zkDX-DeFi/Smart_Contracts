import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {getDeployByChainIdAndName, getNativeNameByChainId} from "../../helpers/chains";
import {waitContractDeployed} from "../../helpers/utils";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const chainId = await getChainId();
    console.log(chalk.greenBright(">> scripts: getWNATIVE.ts"));
    console.log(chalk.greenBright(`chainId: ${chainId}`));

    // WNative.deployed
    const nativeName = getNativeNameByChainId(chainId);
    const WNative = await getDeployByChainIdAndName(chainId, "WNative", "Token", [nativeName, 18, 0, 0, 0]);
    await waitContractDeployed(WNative,"WNative.deployed");
    console.log(chalk.greenBright(`WNative: ${WNative.address}`));
};
export default func;
func.tags = ["staging", "wnative"];
