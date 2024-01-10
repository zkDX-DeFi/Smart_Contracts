// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library NewDataTypes {
    /* VaultV2.sol */
    struct NewPosition {
        uint256 size;
        uint256 collateral;
        uint256 entryFundingRate;
        uint256 reservedAmounts;
        uint256 lastIncreasedTime;
    }

    struct LongShortPosition {
        uint256 longSize;
        uint256 shortSize;
    }
}
