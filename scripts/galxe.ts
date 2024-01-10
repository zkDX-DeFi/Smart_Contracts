import {GraphQLClient, gql} from 'graphql-request'

async function zk() {

    const client = new GraphQLClient('https://api.studio.thegraph.com/query/47302/zkdx-graph/v0.0.6')
    const query = gql`
        query info($address: String!) {
            stakingBalances(
                where: {
                    account: $address,
                    id_gt: "stakingE",
                    amount_gt: 0.1,
                }
            ) {
                id
            }
        }
    `
    let data = await client.request(query, {address: "0x0039f58dfcde2be21879225b78d11af8514a1545"});
    console.log("data:", data);

    let result = check(data);
    console.log("result:", result);
}

function check(resp) {
    if (resp != null && (resp.stakingBalances != null && resp.stakingBalances.length > 0))
        return 1
    return 0
}

zk();

async function test() {

    const client = new GraphQLClient('https://api.thegraph.com/subgraphs/name/hyd628/nomad-and-connext')
    const query = gql`
        query info($address: String!) {
            receiveds(
                where: {
                    recipient: $address
                    block_gt: 1400000
                    token_in: [
                        "0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9"
                        "0x1DC78Acda13a8BC4408B207c9E48CDBc096D95e0"
                        "0x30D2a9F5FDf90ACe8c17952cbb4eE48a55D916A7"
                    ]
                }
            ) {
                id
            }
            fulfilleds(where: { user: $address, timestamp_gt: 1651986604 }) {
                id
                timestamp
            }
        }
    `
    let data = await client.request(query, {address: "0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9"});
    console.log("data:", data);
}

// test();
