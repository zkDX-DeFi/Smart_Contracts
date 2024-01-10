import {ethers, getChainId} from 'hardhat';
import {formatEther, formatUnits} from "ethers/lib/utils";
import chalk from "chalk";
import {DefaultExecuteParams2} from "../helpers/chains";
import {ApproveAmount, getUpdateDataAllByChainId, waitContractDeployed} from "../helpers/utils";
import {ANOTHER_USER_ADDRESS, WAIT_SCRIPT_IN_MS} from "../helpers/constants";

async function main() {
    console.log(chalk.greenBright(">> runs runs_testnet_buy_lp2.ts..."));
    let _user = ANOTHER_USER_ADDRESS;
    const rewardRouter = await ethers.getContract("RewardRouter");
    const dm = await ethers.getContract("ZkdlpManager");
    const chainId = await getChainId();

    async function buyLPFromToken(_user: any, _tokenName: string, _tokenDecimals: number) {
        const token = await ethers.getContract(_tokenName);
        console.log(`${_tokenName}.balanceOf: ${formatUnits(await token.balanceOf(_user), _tokenDecimals)}`);
        const tokenAmountIN = await token.balanceOf(_user);
        if (tokenAmountIN > 0) {
            let allowance = await token.allowance(_user, dm.address);
            if (allowance.lt(tokenAmountIN)) {
                const tx = await token.approve(dm.address, ApproveAmount, await DefaultExecuteParams2(chainId));
                await waitContractDeployed(tx.hash, "token.approve");
            }

            let {updateData, fee} = await getUpdateDataAllByChainId(chainId);
            const mintAndStakeZkdlp = await rewardRouter.mintAndStakeZkdlp(token.address, tokenAmountIN, 0, 0, updateData,
                await DefaultExecuteParams2(chainId, {value: fee}));
            await waitContractDeployed(mintAndStakeZkdlp.hash, "mintAndStakeZkdlp");

            console.log(`${_tokenName}.balanceOf: ${formatUnits(await token.balanceOf(_user), _tokenDecimals)}`);
            const dlp = await ethers.getContract("ZKDLP");
            console.log(`dlp.balanceOf: ${formatEther(await dlp.balanceOf(_user))}`);
        }
    }

    let sleepTime = WAIT_SCRIPT_IN_MS * 10;
    await buyLPFromToken(_user, "WBTC", 8);
    await new Promise(resolve => setTimeout(resolve, sleepTime));
    await buyLPFromToken(_user, "WNative", 18);
    await new Promise(resolve => setTimeout(resolve, sleepTime));
    await buyLPFromToken(_user, "ZUSD", 18);
    await new Promise(resolve => setTimeout(resolve, sleepTime));
    await buyLPFromToken(_user, "DOGE", 18);
    await new Promise(resolve => setTimeout(resolve, sleepTime));
    // await buyLPFromToken(_user, "ORDI", 18);
    // await new Promise(resolve => setTimeout(resolve, sleepTime));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
