// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IWETH {
    function deposit() external payable;

    function transfer(address to, uint256 value) external returns (bool);

    function withdraw(uint256) external;
}

contract ZkdxStakingETH is ReentrancyGuard, Pausable, Ownable {

    IWETH public weth;
    IERC20 public rewardsToken;
    using SafeERC20 for IERC20;

    uint256 public duration;
    uint256 public finishAt;
    uint256 public updatedAt;
    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(address _weth, address _rewardToken, uint256 _duration) {
        weth = IWETH(_weth);
        rewardsToken = IERC20(_rewardToken);
        duration = _duration;
    }

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        updatedAt = lastTimeRewardApplicable();

        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }

    function stake() external payable nonReentrant whenNotPaused updateReward(msg.sender) {
        require(msg.value > 0, "ZkdxStaking: amount must be bigger than 0");
        weth.deposit{value: msg.value}();
        balanceOf[msg.sender] += msg.value;
        totalSupply += msg.value;
    }

    function withdraw(uint256 _amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(_amount > 0, "ZkdxStaking: amount must be bigger than 0");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        _transferOutETH(_amount, payable(msg.sender));
        _getReward();
    }

    function _transferOutETH(uint256 _amountOut, address payable _receiver) internal {
        weth.withdraw(_amountOut);
        (bool sent,) = _receiver.call{value: _amountOut}("");
        require(sent, "ZkdxStaking: failed to send ETH");
    }

    receive() external payable {
        require(msg.sender == address(weth), "ZkdxStaking: wrong eth sender");
    }

    function getReward() external nonReentrant whenNotPaused updateReward(msg.sender) {
        _getReward();
    }

    function _getReward() internal {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.safeTransfer(msg.sender, reward);
        }
    }

    function setRewardsDuration(uint256 _duration) external onlyOwner {
        duration = _duration;
    }

    function notifyRewardAmount(uint256 _amount) external onlyOwner updateReward(address(0)) {
        rewardRate = _amount / duration;
        require(rewardRate > 0, "ZkdxStaking: reward rate wrong");
        require(rewardRate * duration <= rewardsToken.balanceOf(address(this)), "ZkdxStaking: reward amount wrong");

        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }

    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finishAt, block.timestamp);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0)
            return rewardPerTokenStored;
        return rewardPerTokenStored + (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) / totalSupply;
    }

    function earned(address _account) public view returns (uint256) {
        return ((balanceOf[_account] * (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) + rewards[_account];
    }

}
