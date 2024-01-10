import {GraphQLClient, gql} from 'graphql-request'
import fs from "fs";
import {sleep} from "../../helpers/utils2";

const client = new GraphQLClient('https://api.studio.thegraph.com/query/47302/zkdx-graph/version/latest')

async function main() {

    const first = gql`{
        stakingBalances(first: 1000) {
            id
            account
            amount
        }
    }`

    const next = gql`
        query holders($lastID: ID!){
            stakingBalances(first: 1000 where:{id_gt : $lastID}){
                id
                account
                amount
            }
        }`

    let data = await client.request(first)

    let end = false;
    let page = 1;

    // let csvEth = "", csvUsdc = "";
    let totalEth = 0, totalUsdc = 0;
    let uniqueAccounts = new Set();
    let nowStakerCount = 0;
    let nowStakerCount2 = 0;

    let mappingEth = new Map(), mappingUsdc = new Map();

    while (!end) {
        console.log(`>> processing page: ${page}, total: ${data["stakingBalances"].length}`);
        let stakers = "";

        await sleep(1000)
        for (let i = 0; i < data["stakingBalances"].length; i++) {
            let stakingBalance = data["stakingBalances"][i];
            let id = stakingBalance["id"];
            let account = stakingBalance["account"];
            let amount = Number(stakingBalance["amount"]);

            uniqueAccounts.add(account);

            if (id.startsWith("stakingETH")) {
                if (amount > 0) nowStakerCount++;
                totalEth = totalEth + amount;
                // csvEth += account + ", " + amount + "\n";
                stakers += account + "\n";
                mappingEth.set(account, amount);
            } else {
                if (amount > 0) nowStakerCount2++;
                totalUsdc = totalUsdc + amount
                // csvUsdc += account + ", " + amount + "\n";
                stakers += account + "\n";
                mappingUsdc.set(account, amount);
            }
        }

        if (data["stakingBalances"].length < 1000) {
            end = true;
        } else {
            let lastID = data["stakingBalances"][999]["id"];
            data = await client.request(next, {lastID: lastID});
            page++;
        }
        fs.appendFileSync('scripts/staking/file/stakers_zksync.txt', stakers);
        console.log("page done: " + (page - 1));
    }

    // let result = `StakingETH, Total: ${totalEth.toFixed(4)} \n` + csvEth;
    // result += `\nStakingUSDC, Total: ${totalUsdc.toFixed(4)} \n` + csvUsdc;
    // result += `\nUnique Accounts: ${uniqueAccounts.size}`;
    // console.log(result);
    // fs.writeFileSync(`scripts/staking/file/stakers_zksync.csv`, result);

    console.log("unique accounts:", uniqueAccounts.size);
    console.log("eth:", nowStakerCount);
    console.log("usdc:", nowStakerCount2);

    fs.writeFileSync(`scripts/staking/file/stakers_eth_zksync.json`, JSON.stringify(Object.fromEntries(mappingEth)));
    fs.writeFileSync(`scripts/staking/file/stakers_usdc_zksync.json`, JSON.stringify(Object.fromEntries(mappingUsdc)));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
