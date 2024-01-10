import fs from "fs";

let targets: any = [
    "esZKDXOmni",
    "esZKDX"
]

// let result: any = {
//     "zksync_testnet": {},
//     "linea_testnet": {},
//     "base_testnet": {}
// }

let result: any = {
    "zksync_mainnet": {},
    "linea_mainnet": {},
    "base_mainnet": {}
}

async function main() {

    console.log("=== merge abi start at %s ===", new Date().toString());

    // merge("zksync_testnet")
    // merge("linea_testnet")
    // merge("base_testnet")

    merge("zksync_mainnet")
    merge("linea_mainnet")
    merge("base_mainnet")

    fs.writeFileSync('scripts/omni/abi/es_zkdx_addresses.json', JSON.stringify(result));

    console.log("=== merge abi end at %s ===", new Date().toString());
}

function merge(network: string) {
    let fullPath = "deployments/" + network;

    try {
        const files = fs.readdirSync(fullPath);
        files.forEach(function (file: string) {

            let index = file.indexOf(".json");
            if (index < 0)
                return;

            let data = JSON.parse(fs.readFileSync(fullPath + "/" + file, {encoding: 'utf-8'}));
            let contractName = file.substring(0, index);

            if (targets.includes(contractName)) {
                result[network][contractName] = data["address"];
            }
        });
    } catch (error) {
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

