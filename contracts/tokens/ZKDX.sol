// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "./base/MintableBaseToken.sol";
import "../libraries/Constants.sol";
contract ZKDX is MintableBaseToken {
    constructor() public MintableBaseToken(Constants.ZKDX_TOKEN_NAME, Constants.ZKDX_TOKEN_SYMBOL, 0) {
    }
    function id() external pure returns (string memory _name) {
        return Constants.ZKDX_ID;
    }
}
