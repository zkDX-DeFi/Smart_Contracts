import {task} from "hardhat/config";
import chalk from "chalk";
import {IS_TOKEN_BUY_IN, IS_TOKEN_MINT, WAIT_SCRIPT_IN_MS} from "../helpers/constants";
import {execSync} from "child_process";


task("deployScripts", "Deploys all contracts")
    .setAction(async (taskArguments, hre) => {
        let sleepTime = WAIT_SCRIPT_IN_MS;
        console.log(chalk.greenBright(`${hre.network.name}`));

        const network_name = hre.network.name;
        const cmd = `if [ -d ./deployments/${network_name} ]; then find ./deployments/${network_name} -type f -delete; fi`;
        execSync(cmd, {stdio: "inherit"});
        //
        // 1_deploy_vault.ts
        await hre.run("deploy", {tags: "deployVault"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "zkusd"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "wnative"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        await hre.run("deploy", {tags: "vaultPriceFeed"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "router"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        await hre.run("deploy", {tags: "timelock"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "vaultUtils"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "vaultErrorController"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "executeVaultInit"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "executeVEC"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        // 2_deploy_manager.ts
        await hre.run("deploy", {tags: "shortsTracker"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        // await hre.run("deploy", {tags: "orderBook"});
        // await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "positionManager"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        // await hre.run("deploy", {tags: "orderBookReader"});
        // await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "executeP2Settings"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        // 3_deploy_zkdlp.ts
        await hre.run("deploy", {tags: "deployZKDLP"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "ZkdlpManager"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "ZKDX"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        await hre.run("deploy", {tags: "RewardRouter"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "Reader"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "executeP3Settings"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        //  4_deploy_tokens.ts
        await hre.run("deploy", {tags: "WETH"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "WBTC"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "DOGE"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "ZUSD"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "LPool"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        await hre.run("deploy", {tags: "executeP4Settings"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        console.log(chalk.greenBright(">> deploying all contracts finished"));
        console.log(chalk.greenBright(`>> run scripts`));
        await hre.run("run", {script: "./scripts/merge_abi.ts"}); //abit
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        await hre.run("contract_settings"); //contract_settings
    });

task("contract_settings", "contract settings")
    .setAction(async (taskArguments, hre) => {
        console.log(chalk.redBright("TASK: contract_settings"));
        console.log(chalk.redBright("TASK: contract_settings"));
        let sleepTime = WAIT_SCRIPT_IN_MS;

        await hre.run("deploy", {tags: "executeTimelockSettings"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "executePMSetMaxGlobalSizes2"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "executeRobotsSettings"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));

        if (IS_TOKEN_MINT) {
            await hre.run("token_settings"); //token_settings
            await new Promise(resolve => setTimeout(resolve, sleepTime));
        }

        await hre.run("run", {script: "./scripts/viewDeployerBalance.ts"}); //viewDeployerBalance
        await new Promise(resolve => setTimeout(resolve, sleepTime));
    });

task("token_settings", "token settings")
    .setAction(async (taskArguments, hre) => {
        let sleepTime = WAIT_SCRIPT_IN_MS;
        await hre.run("deploy", {tags: "wethMINT"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "wbtcMINT"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "zusdMINT"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        await hre.run("deploy", {tags: "dogeMINT"});
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        if (IS_TOKEN_BUY_IN) {
            await hre.run("run", {script: "./scripts/runs_testnet_buy_lp2.ts"});
            await new Promise(resolve => setTimeout(resolve, sleepTime));
        }
    });

task("add_ordi", "add ordi trade token")
    .setAction(async (taskArguments, hre) => {

        await hre.run("deploy", {tags: "ORDI"});
        await new Promise(resolve => setTimeout(resolve, WAIT_SCRIPT_IN_MS));

        await hre.run("deploy", {tags: "ordiMINT"});
        await new Promise(resolve => setTimeout(resolve, WAIT_SCRIPT_IN_MS));
        //
        await hre.run("run", {script: "./scripts/runs_testnet_buy_lp2.ts"});
        await new Promise(resolve => setTimeout(resolve, WAIT_SCRIPT_IN_MS));

        // await hre.run("run", {script: "./scripts/setSizes.ts"});
        await new Promise(resolve => setTimeout(resolve, WAIT_SCRIPT_IN_MS));
    });
