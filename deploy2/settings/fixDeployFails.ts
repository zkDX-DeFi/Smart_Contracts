import {DeployFunction} from "hardhat-deploy/types";
import {ethers} from "hardhat";

const func: DeployFunction = async function ({deployments, getNamedAccounts, network, getChainId, getUnnamedAccounts}) {
    const {deployer} = await getNamedAccounts();


    const TO_ADDRESS = deployer; // Replace this with the address you want to send ETH to
    const HIGH_GAS_PRICE = ethers.utils.parseUnits('100', 'gwei'); // Replace this with the gas price you want to set

    const signer = ethers.provider.getSigner(deployer);

    // Get the current nonce of the account
    const nonce = await ethers.provider.getTransactionCount(deployer);

    // Create a new transaction, where nonce is set to the problematic nonce, and gasPrice is set to a higher value
    const tx = {
        to: TO_ADDRESS,
        value: ethers.utils.parseEther('0.0001'), // The transfer amount is 0.0001 ETH
        gasPrice: HIGH_GAS_PRICE, // Set a high gas price
        nonce: nonce // Set nonce
    };

    // Sign and send this transaction
    const txResponse = await signer.sendTransaction(tx);
    console.log('Transaction sent:', txResponse.hash);

    // Wait for this transaction to be confirmed
    const receipt = await txResponse.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);


};
export default func;
func.tags = ["FixNonceIssue"];
