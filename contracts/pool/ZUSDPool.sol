// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Extended.sol";

contract ZUSDPool is ReentrancyGuard, Pausable, Ownable {

    using SafeERC20 for IERC20;

    IERC20Extended public zusd;
    mapping(address => bool) public whitelistTokens;
    uint256 public exchangeAmount;
    uint256 public cap;
    uint256 public fee; // 10000 = 100%

    event Exchange(address indexed account, address indexed _tokenIn, uint256 _amountIn, uint256 _usdAmount);
    event Redeem(address indexed account, address indexed _tokenOut, uint256 _amountOut, uint256 _usdAmount);

    constructor(address _zusd) {
        zusd = IERC20Extended(_zusd);
    }

    function exchange(address _tokenIn, uint256 _amountIn) external payable nonReentrant whenNotPaused {
        require(_amountIn > 0, "ZUSDPool: amount must be greater than zero");
        require(whitelistTokens[_tokenIn], "ZUSDPool: token not in whitelist");
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);

        uint256 _amountD18 = _toD18(_tokenIn, _amountIn);
        require(exchangeAmount + _amountD18 <= cap, "ZUSDPool: cap exceeded");

        exchangeAmount += _amountD18;
        uint256 _amountOut = _amountD18 * (10000 - fee) / 10000;
        zusd.mint(msg.sender, _amountOut);
        zusd.mint(owner(), _amountD18 - _amountOut);
        emit Exchange(msg.sender, _tokenIn, _amountIn, _amountD18);
    }

    function redeem(address _tokenOut, uint256 _amount) external payable nonReentrant {
        require(_amount > 0, "ZUSDPool: amount must be greater than zero");
        IERC20Extended(zusd).burn(msg.sender, _amount);

        uint256 _amountOut = _toD(_tokenOut, _amount);
        exchangeAmount = exchangeAmount >= _amount ? exchangeAmount - _amount : 0;
        IERC20(_tokenOut).safeTransfer(msg.sender, _amountOut);
        emit Redeem(msg.sender, _tokenOut, _amountOut, _amount);
    }

    function setWhitelistToken(address _token, bool _enabled) external onlyOwner {
        whitelistTokens[_token] = _enabled;
    }

    function setCap(uint256 _cap) external onlyOwner {
        cap = _cap;
    }

    function setFee(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }

    function transfer(address _token, address _receiver, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(_receiver, _amount);
    }

    function _toD18(address token, uint256 _amount) internal view returns (uint256) {
        uint256 _decimals = IERC20Metadata(token).decimals();
        if (_decimals == 18) return _amount;
        return _amount * (10 ** (18 - _decimals));
    }

    function _toD(address token, uint256 _amount) internal view returns (uint256) {
        uint256 _decimals = IERC20Metadata(token).decimals();
        if (_decimals == 18) return _amount;
        return _amount / (10 ** (18 - _decimals));
    }

}
