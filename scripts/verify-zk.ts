import {network} from 'hardhat';
import fs from "fs";
import {sleep} from "../helpers/utils2";

const hre = require("hardhat");

async function main() {

    console.log("=== verify zk contracts start at %s ===", new Date().toString());
    let fullPath = "deployments/" + network.name;

    fs.readdir(fullPath, function (err: any, files: []) {

        if (err)
            return console.log('Unable to scan directory: ' + err);

        files.forEach(async function (file: string) {

            let index = file.indexOf(".json");
            if (index < 0)
                return;

            let data = JSON.parse(fs.readFileSync(fullPath + "/" + file, {encoding: 'utf-8'}));
            let contractName = file.substring(0, index);
            if (contractName != "esZKDXOmni") return;

            console.log(`>> verifying ${contractName}...`);

            let contractPath = data["storageLayout"]["storage"][0]["contract"]
            console.log(`>> storage layout: ${contractPath}`)
            try {
                const verificationId = await hre.run("verify:verify", {
                    address: data.address,
                    contract: contractPath,
                    constructorArguments: data.args,
                });
                console.log(`Verification ID: ${verificationId}`);
                await sleep(5000);
            } catch (e) {
                console.log(`>> verification failed: ${e}`);
            }

        });

    });
    console.log("=== verify zk contracts end at %s ===", new Date().toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
