### MEDIUM-1
#### State change before the transfer of the funds

`OCPRouter.sol`: `omniMint`

In the `omniMint` function, the state of the contract is changed before the transfer of the funds.

#### Recommendation:
Update the state first before the transfer of the funds.
This issue does not affect the security of the contract, but it is recommended to update the state first before the transfer of the funds.

#### Suggestions:

```solidity
function omniMint(uint256 _amount, address _to, address _omniToken, bytes calldata _payload) external {
    require(_amount > 0, "OCPRouter: INVALID_AMOUNT");
    require(_to != address(0), "OCPRouter: INVALID_ADDRESS");
    require(_omniToken != address(0), "OCPRouter: INVALID_ADDRESS");
    require(_payload.length > 0, "OCPRouter: INVALID_PAYLOAD");
    require(_amount <= IERC20(_omniToken).balanceOf(address(this)), "OCPRouter: INSUFFICIENT_BALANCE");
    IERC20(_omniToken).transfer(_to, _amount);
    emit OmniMint(_to, _amount, _omniToken, _payload);
}
```

### MEDIUM-2
#### `_internal` should be checked whether it is a valid value

`Token.sol`: `setInterval`

The `setInterval` function should the `_internal` value whether it is a valid value.

#### Recommendation:
This issue does not affect the security of the contract, but it is recommended to check the `_internal` value whether it is a valid value.

#### Suggestions:

```solidity
function setInterval(uint256 _internal) external onlyOwner {
    require(_internal > 0, "Token: INVALID_INTERVAL");
    interval = _internal;
}
```


### MEDIUM-3
#### Function not returning the expected value

`OCPOmniTokenManager.sol`: `createOmniToken`

In `OCPOmniTokenManager`, `createOmniToken` function will create the new `omniToken` contract and return the address of the new `omniToken` contract.
If the `token` is not a valid address, the transaction will be reverted, but the function will return the address of the new `omniToken` contract.


#### Recommendation:
Add required statements to check the validity of the `token` address.
If the `token` is not a valid address, the transaction will be reverted, and the function will not return the address of the new `omniToken` contract.

#### Suggestions:

```solidity
function createOmniToken(address _token, uint16 _chainId) external onlyTimeLock returns (address) {
    require(_token != address(0), "OCPOmniTokenManager: INVALID_ADDRESS");
    require(_chainId > 0, "OCPOmniTokenManager: INVALID_CHAIN_ID");
    require(omniTokens[_token][_chainId] == address(0), "OCPOmniTokenManager: OMNI_TOKEN_EXISTS");
    OCPOmniToken omniToken = new OCPOmniToken(_token, _chainId);
    omniTokens[_token][_chainId] = address(omniToken);
    emit CreateOmniToken(_token, _chainId, address(omniToken));
    return address(omniToken);
}
```

### MEDIUM-4
#### Function call need a privileged account
`OCPoolFactory.sol`: `withdraw`

In `OCPoolFactory`, `withdraw` function will transfer the `_amount` of `_token` to the `msg.sender`.
This function call need a privileged account, but it is not checked whether the `msg.sender` is a privileged account.

#### Recommendation:
Caller application should check whether the `msg.sender` is a privileged account before calling this function.
This issue does not affect the security of the contract, but it is recommended to check whether the `msg.sender` is a privileged account before calling this function.

#### Suggestions:

```solidity
function withdraw(address _token, uint256 _amount) external onlyOwner {
    require(_amount > 0, "OCPoolFactory: INVALID_AMOUNT");
    require(_amount <= IERC20(_token).balanceOf(address(this)), "OCPoolFactory: INSUFFICIENT_BALANCE");
    IERC20(_token).transfer(msg.sender, _amount);
    emit Withdraw(_token, msg.sender, _amount);
}
```









### LOW-1
#### Correcting the required statements to be more precise

`OCPRouter.sol`: `omniRedeem`
Since the transactions would be reverted if the required statements are not met, it is recommended to make the required statements more precise.
If `_to` is not a valid address, the transaction will be reverted, so it is recommended to add a required statement to check the validity of `_to`.
And the error message should be more precise.

#### Recommendation:
This issue does not affect the security of the contract, but it is recommended to make the required statements more precise.

#### Suggestions:

```solidity
function omniRedeem(uint256 _amount, address _to) external {
    require(_to != address(0), "OCPRouter: _to cannot be Address(0)");
    ...
}
```

### LOW-2
#### Lock pragma to a specific version

Lock the pragma to a specific version to prevent the contract from being compiled with a newer compiler version that may introduce incompatibilities.
Since not all the EVM versions are backward compatible, it is recommended to lock the pragma to a specific version.

Locking the pragma to a specific version can prevent the contract from being attacked by malicious contracts.
For example, the `OCPRouter.sol` contract uses the `^` symbol in the pragma, which means that the contract can be compiled with a newer compiler version.
And the latest compiler version may introduce incompatibilities, which may cause the contract to be attacked by malicious contracts.

#### Recommendation:
Lock the pragma to a specific version.


### LOW-3
#### omniMintETH does not check if the amount is greater than 0

`OCPRouter.sol`: `omniMintETH`

The contract should check if the amount is greater than 0 before omniMint.
Lacking of this check may cause the contract to be attacked by malicious contracts.

#### Recommendation:
This issue does not affect the security of the contract, but it is recommended to check if the amount is greater than 0 before omniMint.

#### Suggestions:

```solidity
function omniMintETH(address _omniToken, uint256 _amount, bytes calldata _payload) external payable {
    require(_amount > 0, "OCPRouter: INVALID_AMOUNT");
    ...
}
```

### INFO-1

#### Several unused arguments
`OCPOmniTokenManager.sol`: `timelock`

`timelock` should be a DAO address, but it is not used anywhere in the contract.

#### Recommendation:
Should add a `timelock` address to the constructor and use it in the contract.


### INFO-2
#### Error Message unclear

`OCPOmniTokenManager.sol` : `addSourceTokens`

The error message is unclear when the `sourceToken` is not a valid address.

#### Recommendation:
Should add a clear error message when the `sourceToken` is not a valid address.

#### Suggestions:

```solidity
function addSourceTokens(address[] calldata _srcTokens, uint16[] calldata _srcChainIds, address[] calldata _omniTokens) external onlyTimeLock {
    require(_srcTokens.length == _srcChainIds.length && _srcTokens.length == _omniTokens.length, "OCPOmniTokenManager: INVALID_INPUT");

```

### INFO-3
#### Check balance before withdrawing

`OCPOmniTokenManager.sol`: `omniBurn`

The contract should check the balance of the `omniToken` before withdrawing.

#### Recommendation:
This issue does not affect the security of the contract, but it is recommended to check the balance before withdrawing.
Checking the balance can prevent the contract from being attacked by malicious contracts.

#### Suggestions:

```solidity
function omniBurn(uint256 _amount) external {
    require(_amount > 0, "OCPOmniTokenManager: INVALID_AMOUNT");
    require(_amount <= omniToken.balanceOf(address(this)), "OCPOmniTokenManager: INSUFFICIENT_BALANCE");
    omniToken.transfer(msg.sender, _amount);
    emit OmniBurn(msg.sender, _amount);
}
```

### INFO-4
#### Check balance before withdrawing

`OCPoolFactory.sol`: `withdraw`

The contract should check the balance of the `token` before withdrawing.
Checking the balance can prevent the contract from being attacked by malicious contracts.

#### Recommendation:
This issue does not affect the security of the contract, but it is recommended to check the balance before withdrawing.

#### Suggestions:

```solidity
function withdraw(address _token, uint256 _amount) external onlyOwner {
    require(_amount > 0, "OCPoolFactory: INVALID_AMOUNT");
    require(_amount <= IERC20(_token).balanceOf(address(this)), "OCPoolFactory: INSUFFICIENT_BALANCE");
    IERC20(_token).transfer(msg.sender, _amount);
    emit Withdraw(_token, msg.sender, _amount);
}
```







# CODE COVERAGE AND TEST RESULTS FOR ALL FILES
### Test written by Zokyo Security

As a part of our work assisting OCP in verifying the correctness of their contract code, 
our team was tasked with writing tests for the contracts using the Hardhat testing framework.

The tests were written in Solidity and JavaScript, and can be found in the `test` directory of this repository, 
as well as a review of the OCP contract requirements for details about issuance amounts and how the system handles them.

Version
=======
> solidity-coverage: v0.8.5

Instrumenting for coverage...
=============================

> entity/OCPool.sol
> entity/OmniToken.sol
> interfaces/IOCPBridge.sol
> interfaces/IOCPOmniTokenManager.sol
> interfaces/IOCPoolFactory.sol
> interfaces/IOCPReceiver.sol
> interfaces/IOCPRouter.sol
> interfaces/IOmniToken.sol
> interfaces/IWETH.sol
> libraries/Structs.sol
> libraries/Types.sol
> OCPBridge.sol
> OCPOmniTokenManager.sol
> OCPoolFactory.sol
> OCPRouter.sol

Coverage skipped for:
=====================

> mock/LZEndpoint.sol
> mock/ReceiverContract.sol
> mock/ReceiverContract2.sol
> mock/ReceiverContract3.sol
> mock/Token.sol

Compilation:
============

Compiling 45 Solidity files
Generating typings for: 45 artifacts in dir: typechain-types for target: ethers-v5
Successfully generated 118 typings!
Successfully compiled 45 Solidity files

Network Info
============
> HardhatEVM: v2.17.2
> network:    hardhat



  LZEndpoint
>> deploying OCPBridge...
>> deploying OCPOmniTokenManager...
>> deploying OCPPoolFactory...
>> deploying OCPRouter...
>> deploying same on local chain 2 (test only) ...
>> ✔ check LZ.FUNC => VARIABLES
>> ✔ check lz.func => blockNextMsg()

  OCPB
    ✔ check OCPB.FUNC => omniMint
    ✔ check OCPB.FUNC => omniMint v2 (51ms)
66006380000000000,0
    ✔ check OCPB.FUNC => quoteLayerZeroFee
66006380000001100,0
    ✔ check OCPB.FUNC => _txParamBuilder => dstNativeAmount >0
    ✔ omniMint messaging reverted, not enough fees
    ✔ omniMint messaging suc (48ms)
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    ✔ check OCPB.FUNC => updateGasLookups()
0.06600638, 0
    ✔ check OCPB.FUNC => quoteLayerZeroFee() (83ms)
    ✔ check OCPB.FUNC => updateRouter()
    ✔ check OCPB.FUNC => updateTrustedRemotes()
    ✔ check OCPB.FUNC => omniMint => onlyRouter
0x0000000000000000000000000000000000000000000000000000000000000000
    ✔ check OCPB.FUNC => revertMessage

  OT
    ✔ check OT.FUNC => CONSTRUCTOR (65ms)
    ✔ check OT.FUNC => MINT
    ✔ check OT.FUNC => BURN

  OCPOTM
    ✔ check OCPTM.FUNC => createToken
    ✔ check OCPTM.FUNC => updateRouter
    ✔ check OCPTM.FUNC => omniMint
    ✔ check OCPTM.FUNC => omniBurn
    ✔ createOmniToken suc
    ✔ createOmniToken suc V2
    ✔ check OCPTM.VARIABLES => updateRouter
    ✔ check OCPTM.FUNC => updateTimeLock()
    ✔ check OCPOTM.FUNC => createOmniToken
    ✔ check OCPOTM.FUNC => updateRouter
    ✔ check OCPOTM.FUNC => updateTimeLock
    ✔ check OCPF.FUNC => createPool()
    ✔ check OCP.FUNC => constructor()
    ✔ check OT.FUNC => constructor() (62ms)

  OCPR
    ✔ check OCPR.VARIABLES => bridge()
    ✔ check OCPR.FUNC => omniMint() (149ms)
66006380000000000,0
    ✔ check OCPR.FUNC => quoteLayerZeroFee()
    ✔ check OCPR.FUNC => updateBridge()
    ✔ check OCPR.FUNC => omniMintRemote()
    ✔ check OCPR.FUNC => _amountD18() (111ms)
    ✔ check OCPR.FUNC => omniMint() (65ms)
DeployMint Fee: 0.069306732
    ✔ check OCPR.FUNC => omniMint() v2 (78ms)
DeployMint Fee: 0.069306732
    ✔ check OCPR.FUNC => omniMint() v3 (202ms)
    ✔ check OCPR.FUNC => omniMint() v4 (105ms)
    ✔ check OCPR.VARIABLES => poolFactory
msgFee:, 0.069306732
msgFee:, 0.072606732
    ✔ check Router.FUNC => quoteLayerZeroFee
_userPayload:, 0x0000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bc
0.069306732
0.069306732
    ✔ check R2.FUNC => quoteLayerZeroFee()
_token: 0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44
_token: 0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44
_token: 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
    ✔ check R.FUNC => omniMint() (199ms)
    ✔ check R.FUNC => omniMint() => tm (114ms)
    ✔ check R.FUNC => omniMint() => tm v2 (111ms)

  Router
Deploy Gas: Pool[642002] Token[4504353] Total[5146355]
    ✔ print deploy pool & token gas estimated
DeployMint Fee: 0.06600638
RefundFee: 0.00600058
    ✔ omni mint suc - type 1 (124ms)
DeployMint Fee: 0.069306732
    ✔ omni mint with payload suc - type 1 (89ms)
    ✔ omni mint fail, retry suc - type 1 (93ms)
    ✔ omni mint fail, revert suc - type 1 (135ms)
Mint Fee: 0.01430638
    ✔ omni mint suc - type 2 (120ms)
Redeem Fee: 0.014303916
    ✔ redeem suc (180ms)
    ✔ redeem suc with payload (118ms)
    ✔ redeem fail, revert suc (169ms)
DeployMint Fee: 0.069306732
    ✔ omni mint ETH with payload suc - type 1 (82ms)
Redeem Fee: 0.014303916
    ✔ omni redeem ETH suc (115ms)

  OCPScenario
r.address: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
r2.address: 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
_token.address: 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
0x66FEBAAd49178882b88A3776a3C821a01fEb6776
_omniToken.address: 0x66FEBAAd49178882b88A3776a3C821a01fEb6776
_omniToken.totalSupply(): 100.0
_omniToken.balanceOf(_user.address): 100.0
0x66FEBAAd49178882b88A3776a3C821a01fEb6776
_omniToken.totalSupply(): 200.0
_omniToken.balanceOf(_user.address): 200.0
    ✔ check ScenarioTest => S1 => omniMint && _type = 1 (110ms)
    ✔ check ScenarioTest => S2 => omniMint && _type = 2 (47ms)
    ✔ check STEST => S5 => omniMint => _payLoad is not 0x (205ms)
0x0000000000000000000000000000000000000000
0x0000000000000000000000000000000000000000
2000.0
0x0000000000000000000000000000000000000000
    ✔ check OCPR.FUNC => omniMint() v4 (129ms)
0x66FEBAAd49178882b88A3776a3C821a01fEb6776
    ✔ check STEST => S4 => omniMint => _payLoad is 0x (99ms)
1: 0x0000000000000000000000000000000000000000
2: 0x66FEBAAd49178882b88A3776a3C821a01fEb6776
3: 0x66FEBAAd49178882b88A3776a3C821a01fEb6776
    ✔ check STEST => S4 => omniMint => _payLoad is NOT 0x (179ms)
    ✔ check STEST => S5 => omniMint => _type = 1 && payload = 0x (57ms)
rc:  0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44
0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
31337
tm2: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
0xeC20022011f6158f27c148E5f8E635D05fCB49ff
true
totalSupply: 1000.0
balanceOf(_rc): 1000.0
balanceOf(user1): 0.0
    ✔ check STEST => S5 => omniMint => _type = 1 && payload != 0x (80ms)
    ✔ check ST => S6 => omniMint => _type = 2 && payload = 0x (49ms)
    ✔ check ST => S6 => omniMint => _type = 2 && payload != 0x (58ms)
    ✔ check ST => S6 => omniMint => _type = 3 or 4 (55ms)
    ✔ check ST => s7 => omniMint => _type = 1 => _omniToken (204ms)
    ✔ check ST => s8 => omniMint => _type => 111 (156ms)
    ✔ check ST => s8 => omniMint => _type => 121 (152ms)
    ✔ check ST => s8 => omniMint => _type => 122 (161ms)
    ✔ check ST => s8 => omniMint => _type => 2122 (192ms)
    ✔ check ST => s9 => omniMint => _type = 2212 => _payload != 0x (192ms)
    ✔ check ST => s9 => omniMint => _type = 2212 => _payload != 0x V2 (239ms)
    ✔ check ST => s10 => omniMint => user1(122) + user2(12) (241ms)
    ✔ check ST => s10 => omniMint => user1(122) + user2(22) (237ms)
    ✔ check ST => s11 => omniMint =>  user1(122) => usdcD6 (166ms)
    ✔ check ST => s11 => omniMint => user1(2122) => usdcD6 => payload is empty (210ms)
    ✔ check ST => s11 => omniMint => user1(2122) => usdcD6 => payload is not empty (226ms)
0xac1Eb31d8982BCA225D9235589f6B59f8bCaF32C
370.368
    ✔ check ST => s11 => omniMint => user1(2122) => usdcD6 => payload is not empty + lzTxObj is valid (279ms)
    ✔ check ST => s11 => omniMint => user1(2122) => usdcD6 => lzTxObj is inValid (288ms)
    ✔ check ST => s12 => omniMint => user(2122) (192ms)
    ✔ check ST => s12 => omniMint => user(2122) => user1+user2 (195ms)
    ✔ check ST => s12 => omniMint => user(212222) => user1+user2 => payload != 0x (302ms)
    ✔ check ST => s12 => omniMint => user(212222) => user1+user2 => payload != 0x v2 (279ms)
    ✔ check ST => s12 => omniMint => user1(2121) + user2(12) (283ms)
    ✔ check ST => S13 => omniMint => user1(2121) (193ms)
    ✔ check ST => S13 => omniMint => user1(2122) (326ms)
    ✔ check ST => S14 => omniMint2 => user1(2122) (196ms)
    ✔ check ST => S14 => omniMint2 => user1(212) + user2(2) => usdcD6 (212ms)
    ✔ check ST => S14 => omniMint2 => user1(212) + user2(2) => usdcD6 => payload != 0x (210ms)
    ✔ check ST => S14 => omniMint2 => user1(212) + user2(2) => usdcD6 => payload != 0x v2 (283ms)
    ✔ check ST => S14 => omniMint2 => user1(212) + user2(2) => usdcD6 => payload != 0x v3 (282ms)
    ✔ check ST => S15 => omniMint2 => user1(212) + user2(2) => usdcD18 (200ms)
    ✔ check ST => S14 => omniMint2 => user1(212) + user2(2) => usdcD6 => payload != 0x v4 (574ms)
1: 0x0000000000000000000000000000000000000000
2: 0x66FEBAAd49178882b88A3776a3C821a01fEb6776
3: 0x66FEBAAd49178882b88A3776a3C821a01fEb6776
    ✔ check STEST => S15 => omniMint => _payLoad is NOT 0x (184ms)

  OP
    ✔ check OP.FUNC => withdraw

  OCPPoolFactory
    ✔ check OCPF.FUNC => createPool()
    ✔ check OCPF.FUNC => createPool() v2
    ✔ check OCPF.FUNC=> WITHDRAW

  102 passing (17s)



| File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
| ------------------------ | ------- | -------- | ------- | ------- | --------------- |
| contracts/               | 98.23   | 85.34    | 97.14   | 97.4    |                 |
| OCPBridge.sol            | 100     | 92.11    | 100     | 100     |                 |
| OCPOmniTokenManager.sol  | 84.62   | 80       | 90      | 83.33   | 191,192,193,194 |
| OCPRouter.sol            | 100     | 81.48    | 100     | 100     |                 |
| OCPoolFactory.sol        | 100     | 100      | 100     | 100     |                 |
| contracts/entity/        | 100     | 100      | 100     | 100     |                 |
| OCPool.sol               | 100     | 100      | 100     | 100     |                 |
| OmniToken.sol            | 100     | 100      | 100     | 100     |                 |
| contracts/interfaces/    | 100     | 100      | 100     | 100     |                 |
| IOCPBridge.sol           | 100     | 100      | 100     | 100     |                 |
| IOCPOmniTokenManager.sol | 100     | 100      | 100     | 100     |                 |
| IOCPReceiver.sol         | 100     | 100      | 100     | 100     |                 |
| IOCPRouter.sol           | 100     | 100      | 100     | 100     |                 |
| IOCPoolFactory.sol       | 100     | 100      | 100     | 100     |                 |
| IOmniToken.sol           | 100     | 100      | 100     | 100     |                 |
| IWETH.sol                | 100     | 100      | 100     | 100     |                 |
| contracts/libraries/     | 100     | 100      | 100     | 100     |                 |
| Structs.sol              | 100     | 100      | 100     | 100     |                 |
| Types.sol                | 100     | 100      | 100     | 100     |                 |
| All files | 98.33 | 86.51 | 97.5 | 97.53 |      |
