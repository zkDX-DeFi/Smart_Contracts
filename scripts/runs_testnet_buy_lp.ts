// import {deployments, ethers, getChainId} from 'hardhat';
// import {parseEther, parseUnits, formatUnits, formatEther} from "ethers/lib/utils";
// import {} from "../helpers/params";
//
// import chalk from "chalk";
// import {DefaultExecuteParams2, getChainNameFromId} from "../helpers/chains";
// import {getUpdateDataAllByChainId} from "../helpers/utils";
// import {GAS_LIMIT, GAS_PRICE, ZKDX_OPR_1_ADDRESS} from "../helpers/constants";
// const {execute, read, deploy, get} = deployments;
//
// async function main() {
//     console.log(">> runs testnet_Prigo...");
//     let _user = ZKDX_OPR_1_ADDRESS;
//
//     const chainId = await getChainId();
//     console.log(chalk.greenBright(`chainId: ${chainId}, chainName: ${getChainNameFromId(chainId)}`));
//
//     const v = await ethers.getContract("VaultPriceFeed");
//     console.log(`vault: ${v.address}`);
//     console.log(`v.pyth: ${await v.pyth()}`);
//
//     const rewardRouter = await ethers.getContract("RewardRouter");
//     const dm = await ethers.getContract("ZkdlpManager");
//
//     const tokenName = "WBTC";
//     const tokenDecimals = 8;
//
//
//     const token = await ethers.getContract(tokenName);
//     const tokenAmountIN = parseUnits("1",8);
//     await token.approve(dm.address, tokenAmountIN, await DefaultExecuteParams2(chainId));
//     let {updateData, fee} = await getUpdateDataAllByChainId(chainId);
//     await rewardRouter.mintAndStakeZkdlp(token.address, tokenAmountIN, 0, 0, updateData, {value: fee, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE});
//
//     console.log(`${tokenName}.balanceOf: ${formatUnits(await token.balanceOf(_user),tokenDecimals)}`);
//     const dlp = await ethers.getContract("ZKDLP");
//     console.log(`dlp.balanceOf: ${formatEther(await dlp.balanceOf(_user))}`);
// }
//
//
// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });
