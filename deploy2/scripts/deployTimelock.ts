import {DeployFunction} from "hardhat-deploy/types";
import chalk from "chalk";
import {AddressZero, expandDecimals, waitContractDeployed} from "../../helpers/utils";
import {CHAIN_ID_LOCAL} from "../../helpers/constants";
import {DefaultParams2} from "../../helpers/chains";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    console.log(chalk.greenBright(">> scripts: deployTimelock.ts"));

    const chainId = await getChainId();
    let marginFeeBasisPoints = 10;
    if (CHAIN_ID_LOCAL != chainId)
        marginFeeBasisPoints = 5;
    // Timelock.deployed
    const Timelock = await deploy("Timelock", await DefaultParams2(chainId,
        {
            args: [
                    deployer,
                    60,
                    AddressZero,
                    deployer,
                    deployer,
                    expandDecimals(1000, 18),
                    marginFeeBasisPoints, // marginFeeBasisPoints
                    500, // maxMarginFeeBasisPoints
                ],
        }));
    await waitContractDeployed(Timelock, "Timelock");
};
export default func;
func.tags = ["staging", "timelock"];
