// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../../libraries/NewDataTypes.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVaultPriceFeed {
    function getPrice(address _token, bool _includeConf, bool _maximise, bool _fresh) external view returns (uint256);
}

abstract contract VaultV2Settings {
    address public gov;
    uint256 public fundingRate;
    address public priceFeed;
    bool public isInitialized;
    mapping(bytes32 => NewDataTypes.NewPosition) public positions;
    mapping(bytes32 => NewDataTypes.LongShortPosition) public lsps;
    mapping(uint256 => string) public errors;
    mapping(address => bool) public whitelistedTokens;
    mapping(address => bool) public stableTokens;
    mapping(address => bool) public shortableTokens;

    mapping(address => uint256) public tokenBalances;

    function _onlyGov() internal view {
        require(msg.sender == gov, "only gov");
    }

    function _validateTokens(address _collateralToken, address _indexToken, bool _isLong, uint256 _positionType) internal view {
        _validate(whitelistedTokens[_collateralToken], 1);
        _validate(whitelistedTokens[_indexToken], 1);
        _validate(_positionType == 1, 1);
        if (_isLong) { // long
            _validate(_collateralToken != _indexToken, 1);
            _validate(stableTokens[_collateralToken], 1);
            _validate(!stableTokens[_indexToken], 1);
            return;
        } else { //short
            _validate(_collateralToken != _indexToken, 1);
            _validate(stableTokens[_collateralToken], 1);
            _validate(!stableTokens[_indexToken], 1);
            _validate(shortableTokens[_indexToken], 1);
        }
    }

    function _validate(bool _condition, uint256 _errorCode) internal view {
        require(_condition, errors[_errorCode]);
    }

    function setTokenConfig(
        address _token,
        bool _whitelisted,
        bool _stable,
        bool _shortable) external {
        _onlyGov();
        whitelistedTokens[_token] = _whitelisted;
        stableTokens[_token] = _stable;
        shortableTokens[_token] = _shortable;
    }

    function setLongShortPositions(
        address _collateralToken,
        address _indexToken,
        uint256 _longSize,
        uint256 _shortSize,
        uint _positionType
    ) external {
        _onlyGov();
        _validate(whitelistedTokens[_collateralToken], 1);
        _validate(whitelistedTokens[_indexToken], 1);
        _validate(_positionType == 1, 1);

        bytes32 key = keccak256(abi.encodePacked(_collateralToken, _indexToken, _positionType));
        lsps[key].longSize = _longSize;
        lsps[key].shortSize = _shortSize;
    }

    function _transferIn(address _token) internal returns (uint256) {
            uint256 prevBalance = tokenBalances[_token];
        uint256 nextBalance = IERC20(_token).balanceOf(address(this));
        tokenBalances[_token] = nextBalance;
        return nextBalance - prevBalance;
    }

    function getMaxPrice(address _token) public view returns (uint256) {
        return IVaultPriceFeed(priceFeed).getPrice(_token, true, true, true);
    }

    function getMinPrice(address _token) public view returns (uint256) {
        return IVaultPriceFeed(priceFeed).getPrice(_token, true, false, true);
    }

    function getPosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        uint256 _positionType
    ) external view returns (NewDataTypes.NewPosition memory){
        bytes32 key = keccak256(abi.encodePacked(_account, _collateralToken, _indexToken, _isLong, _positionType));
        return positions[key];
    }

    function getLSPS(
        address _collateralToken,
        address _indexToken,
        uint256 _positionType
    ) external view returns (NewDataTypes.LongShortPosition memory){
        bytes32 key = keccak256(abi.encodePacked(_collateralToken, _indexToken, _positionType));
        return lsps[key];
    }
}
