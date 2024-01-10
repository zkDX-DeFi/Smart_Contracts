import {deployments, getChainId, network} from 'hardhat';
import {AddressZero} from "../helpers/utils";

import fs from "fs";
import {getWmaticConfig} from "../helpers/params";
import {getFeedIdByChainAndToken} from "../helpers/chains";

let fullPath: string;
let networkName: string;
let chainId: string;

let addrInfo: any = {
    Vault: AddressZero,
    Router: AddressZero,
    Reader: AddressZero,
    ZkdlpManager: AddressZero,
    RewardRouter: AddressZero,
    NATIVE_TOKEN: AddressZero,
    OrderBook: AddressZero,
    OrderBookReader: AddressZero,
    PositionManager: AddressZero,
    ARB: AddressZero,
    DOGE: AddressZero,
    FIL: AddressZero,
    LTC: AddressZero,
    MSFT: AddressZero,
    TSLA: AddressZero,
    USDC: AddressZero,
    WBTC: AddressZero,
    ZkdxStakingETH: AddressZero,
    ZkdxStakingUSDC: AddressZero,
    esZKDX: AddressZero,
    trueUSDC: AddressZero,
    trueWETH: AddressZero,
    ZKDXNFT1: AddressZero,
    ZKDXNFT2: AddressZero,
    ZKDXNFT5: AddressZero,
}

async function main() {

    console.log("=== merge abi start at %s ===", new Date().toString());
    networkName = network.name;
    fullPath = "deployments/" + networkName;
    chainId = await getChainId();
    merge_abi(chainId);
    console.log("=== merge abi end at %s ===", new Date().toString());
}

main().then(() => {
    console.log("success");
});

let excludeContracts = [
    "DaiPriceFeed",
    "Timelock",
    "VaultErrorController",
    "VaultUtils",
    "WethPriceFeed"
]

let apiTargetContracts = [
    "Vault",
    "PositionManager",
    "OrderBook",
    "Reader",
    "WETH",
    "WBTC",
    "WNative",
    "DAI",
    "USDC",
    "DOGE",
    "LTC",
    "ARB",
    "FIL",
    "MSFT",
    "TSLA",
    "Exchanger",
    "ZUSD",
]

let feedTargetContracts = [
    "WETH",
    "WBTC",
    // "USDC"
    "DOGE",
    "WNative",
    "ORDI"
]

let addTargetContracts = [
    // "DOGE",
    // "LTC",
    // "ARB",
    // "FIL",
    // "MSFT",
    // "TSLA",
    // "Exchanger"
    // "ZUSD"
    "ORDI"
]

function merge_abi(chainId: string) {

    fs.readdir(fullPath, function (err: any, files: []) {

        if (err)
            return console.log('Unable to scan directory: ' + err);

        // let abi: any = {};
        let sql = ""

        files.forEach(function (file: string) {

            let index = file.indexOf(".json");
            if (index < 0)
                return;

            let data = JSON.parse(fs.readFileSync(fullPath + "/" + file, {encoding: 'utf-8'}));

            let contractName = file.substring(0, index);

            if (apiTargetContracts.includes(contractName)) {
                let field;
                if (contractName == "PositionManager")
                    field = "position_manager_contract"
                else
                    field = contractName.toLowerCase() + "_contract"

                sql += `UPDATE t_config SET value ='${data["address"].toLowerCase()}' WHERE name = '${field}' AND chain = ${chainId};\n`;
            }

            if (addTargetContracts.includes(contractName)) {
                let field = contractName.toLowerCase() + "_contract"
                sql += `INSERT INTO t_config VALUES (null, '${field}', '${data["address"].toLowerCase()}', null, ${chainId});\n`;
            }

            if (feedTargetContracts.includes(contractName)) {
                let field = contractName.toLowerCase() + "_contract"
                sql += `UPDATE t_config SET feed_id = '${getFeedIdByChainAndToken(chainId, contractName.toUpperCase())}' WHERE name = '${field}';\n`;
            }

            if (excludeContracts.includes(contractName))
                return

            console.log(".. including abi:", contractName);

            if (contractName == "WNative")
                contractName = "NATIVE_TOKEN"
            addrInfo[contractName] = data["address"];

        });

        fs.writeFileSync('scripts/addresses/addresses_' + networkName + '.json', JSON.stringify(addrInfo));

        console.log(">> sql result:\n", sql);
    });
}

function cleanIt(obj) {
    let cleaned = JSON.stringify(obj, null, 2);

    return cleaned.replace(/^[\t ]*"[^:\n\r]+(?<!\\)":/gm, function (match) {
        return match.replace(/"/g, "");
    });
}

function getDate() {
    let date = new Date();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    let monthStr = month.toString();
    let dayStr = day.toString();
    if (month >= 1 && month <= 9) {
        monthStr = "0" + month;
    }
    if (day >= 0 && day <= 9) {
        dayStr = "0" + dayStr;
    }
    return monthStr + dayStr;
}
