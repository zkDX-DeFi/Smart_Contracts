// @ts-nocheck
import fs from "fs";

let priceEth = 2090;
let value_mapping = new Map();

function rankingETH() {
    // let eth_zk = JSON.parse(fs.readFileSync("scripts/staking/file/stakers_eth_zksync.json", {encoding: 'utf-8'}));
    // let eth_zk_mapping = new Map(Object.entries(eth_zk));

    let eth_linea = JSON.parse(fs.readFileSync("scripts/staking/file/stakers_eth_linea.json", {encoding: 'utf-8'}));
    let eth_linea_mapping = new Map(Object.entries(eth_linea));

    // eth_linea_mapping.forEach((value, key) => {
    //     if (eth_zk_mapping.has(key))
    //         // @ts-ignore
    //         eth_zk_mapping.set(key, eth_zk_mapping.get(key) + parseFloat(value));
    //     else
    //         eth_zk_mapping.set(key, value);
    // })

    eth_linea_mapping.forEach((value, key) => {
        if (value == 0 || value == "0.0")
            eth_linea_mapping.delete(key);
    })

    const entries = Array.from(eth_linea_mapping);
    entries.sort((a, b) => b[1] - a[1]);
    const sortedMap = new Map(entries);

    let csvString = '';
    let totalETH = 0;
    for (const [key, value] of sortedMap) {
        csvString += `${key}, ${value}\n`;
        value_mapping.set(key, parseFloat(value) * priceEth);
        totalETH += parseFloat(value);
    }

    console.log("totalETH:", totalETH)
    fs.writeFileSync("scripts/staking/file/stake_ranking_eth.csv", csvString);
}

function rankingUSDC() {
    // let usdc_zk = JSON.parse(fs.readFileSync("scripts/staking/file/stakers_usdc_zksync.json", {encoding: 'utf-8'}));
    // let usdc_zk_mapping = new Map(Object.entries(usdc_zk));

    let usdc_linea = JSON.parse(fs.readFileSync("scripts/staking/file/stakers_usdc_linea.json", {encoding: 'utf-8'}));
    let usdc_linea_mapping = new Map(Object.entries(usdc_linea));

    // usdc_linea_mapping.forEach((value, key) => {
    //     if (usdc_zk_mapping.has(key))
    //         // @ts-ignore
    //         usdc_zk_mapping.set(key, usdc_zk_mapping.get(key) + parseFloat(value));
    //     else
    //         usdc_zk_mapping.set(key, value);
    // })

    usdc_linea_mapping.forEach((value, key) => {
        if (value == 0 || value == "0.0")
            usdc_linea_mapping.delete(key);
    })

    const entries = Array.from(usdc_linea_mapping);
    entries.sort((a, b) => b[1] - a[1]);
    const sortedMap = new Map(entries);

    let csvString = '';
    let totalUSDC = 0;
    for (const [key, value] of sortedMap) {
        csvString += `${key}, ${value}\n`;
        totalUSDC += parseFloat(value);

        if (value_mapping.has(key))
            value_mapping.set(key, value_mapping.get(key) + parseFloat(value));
        else
            value_mapping.set(key, value);
    }

    console.log("totalUSDC:", totalUSDC)
    fs.writeFileSync("scripts/staking/file/stake_ranking_usdc.csv", csvString);
}

rankingETH();
rankingUSDC();

const entries = Array.from(value_mapping);
entries.sort((a, b) => b[1] - a[1]);
const sortedMap = new Map(entries);

let valueCsvString = '';
// let totalUSDC = 0;
for (const [key, value] of sortedMap) {
    valueCsvString += `${key}, ${value}\n`;
}

fs.writeFileSync("scripts/staking/file/stake_ranking.csv", valueCsvString);