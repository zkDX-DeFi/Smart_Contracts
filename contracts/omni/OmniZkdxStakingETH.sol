// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/IOFTV2.sol";
import "@layerzerolabs/solidity-examples/contracts/interfaces/IStargateRouter.sol";
import "@layerzerolabs/solidity-examples/contracts/interfaces/IStargateReceiver.sol";
import "./interfaces/IStargateRouterETH.sol";

contract OmniZkdxStakingETH is ReentrancyGuard, Pausable, Ownable, IStargateReceiver {

    address public rewardsToken;

    uint256 public duration;
    uint256 public finishAt;
    uint256 public updatedAt;
    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    address public stgRouterETH;
    uint256 public stgSlippage;
    address public lzEndPoint;
    mapping(uint16 => uint256) public poolIds;
    mapping(uint16 => address) public remoteStakings;
    mapping(uint16 => bool) public rewardChainIds;
    mapping(uint8 => uint256) public gasLookup;
    uint16 public lzChainId;

    uint8 internal constant TYPE_STAKE = 1;
    uint8 internal constant TYPE_WITHDRAW = 2;
    uint8 internal constant TYPE_CLAIM = 3;

    constructor(address _rewardToken, uint256 _duration, address _stgRouterETH, address _lzEndPoint, uint16 _lzChainId, address _owner) {
        rewardsToken = _rewardToken;
        duration = _duration;
        stgRouterETH = _stgRouterETH;
        lzEndPoint = _lzEndPoint;
        lzChainId = _lzChainId;
        stgSlippage = 950;
        _transferOwnership(_owner);
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

    function stake(uint16 _chainId, uint256 _amount) external payable nonReentrant whenNotPaused {
        require(rewardChainIds[_chainId], "OmniZkdxStaking: invalid chainId");
        require(_amount > 0, "OmniZkdxStaking: amount must be bigger than 0");
        require(msg.value >= _amount, "OmniZkdxStaking: not enough ETH");

        if (_chainId == lzChainId) {
            _stake(msg.sender, _amount);
        } else {
            IStargateRouterETH(stgRouterETH).swapETHAndCall{value: msg.value}(
                _chainId,
                payable(msg.sender),
                abi.encodePacked(remoteStakings[_chainId]),
                IStargateRouterETH.SwapAmount(_amount, _amount * stgSlippage / 1000),
                IStargateRouterETH.lzTxObj(gasLookup[TYPE_STAKE], 0, ""),
                abi.encodePacked(msg.sender)
            );
        }
    }

    function _stake(address _account, uint256 _amount) internal updateReward(_account) {
        balanceOf[_account] += _amount;
        totalSupply += _amount;
        require(address(this).balance >= totalSupply, "OmniZkdxStaking: not enough balance");
    }

    function sgReceive(uint16, bytes memory, uint256, address, uint256 amountLD, bytes memory payload) external {
        require(msg.sender == IStargateRouterETH(stgRouterETH).stargateRouter(), "OmniZkdxStaking: only stargate router");
        address _account;
        assembly {
            _account := mload(add(payload, 20))
        }
        _stake(_account, amountLD);
    }

    function withdraw(uint16 _chainId, uint256 _amount) external payable nonReentrant whenNotPaused updateReward(msg.sender) {
        require(_amount > 0, "OmniZkdxStaking: amount must be bigger than 0");
        require(balanceOf[msg.sender] >= _amount, "OmniZkdxStaking: not enough balance");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;

        if (_chainId == lzChainId) {
            _transferOutETH(payable(msg.sender), _amount);
        } else {
            IStargateRouterETH(stgRouterETH).swapETHAndCall{value: _amount + msg.value}(
                _chainId,
                payable(msg.sender),
                abi.encodePacked(msg.sender),
                IStargateRouterETH.SwapAmount(_amount, _amount * stgSlippage / 1000),
                IStargateRouterETH.lzTxObj(gasLookup[TYPE_WITHDRAW], 0, ""),
                ""
            );
        }
    }

    function _transferOutETH(address payable _receiver, uint256 _amount) private {
        (bool sent,) = _receiver.call{value: _amount}("");
        require(sent, "OmniZkdxStaking: failed to send ETH");
    }

    function claimReward(uint16 _chainId) external payable nonReentrant whenNotPaused updateReward(msg.sender) {
        _claimReward(_chainId);
    }

    function _claimReward(uint16 _chainId) internal {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            if (_chainId == lzChainId) {
                IERC20(rewardsToken).transfer(msg.sender, reward);
            } else {
                IOFTV2(rewardsToken).sendFrom{value: msg.value}(address(this), _chainId, addrToBytes32(msg.sender),
                    reward, ICommonOFT.LzCallParams(payable(msg.sender), address(0), ""));
            }
        }
    }

    function quoteLayerZeroFee(uint16 _chainId, uint8 _type) external view returns (uint256, uint256) {
        address baseRouter = IStargateRouterETH(stgRouterETH).stargateRouter();
        if (_type == TYPE_STAKE)
            return IStargateRouter(baseRouter).quoteLayerZeroFee(_chainId, 1, abi.encodePacked(remoteStakings[_chainId]),
                abi.encodePacked(msg.sender), IStargateRouter.lzTxObj(gasLookup[TYPE_STAKE], 0, ""));
        else if (_type == TYPE_WITHDRAW)
            return IStargateRouter(baseRouter).quoteLayerZeroFee(_chainId, 1, abi.encodePacked(msg.sender), "",
                IStargateRouter.lzTxObj(0, 0, ""));
        else if (_type == TYPE_CLAIM)
            return IOFTV2(rewardsToken).estimateSendFee(_chainId, addrToBytes32(msg.sender), 1, false,
                abi.encodePacked(uint16(1), gasLookup[TYPE_CLAIM]));
        else revert("OmniZkdxStaking: invalid type");
    }

    function setRewardsDuration(uint256 _duration) external onlyOwner {
        duration = _duration;
    }

    function notifyRewardAmount(uint256 _amount) external onlyOwner updateReward(address(0)) {
        rewardRate = _amount / duration;
        require(rewardRate > 0, "OmniZkdxStaking: reward rate wrong");
        require(rewardRate * duration <= IERC20(rewardsToken).balanceOf(address(this)), "OmniZkdxStaking: reward amount wrong");

        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
    }

    function setPaused(bool _paused) external onlyOwner {
        if (_paused)
            _pause();
        else
            _unpause();
    }

    function setStgRouterETH(address _stgRouterETH) external onlyOwner {
        stgRouterETH = _stgRouterETH;
    }

    function setLzEndPoint(address _lzEndPoint) external onlyOwner {
        lzEndPoint = _lzEndPoint;
    }

    function setRewardChainId(uint16 _chainId, bool _hasReward) external onlyOwner {
        rewardChainIds[_chainId] = _hasReward;
    }

    function setPoolIds(uint16[] calldata _chainIds, uint256[] calldata _poolIds) external onlyOwner {
        require(_chainIds.length == _poolIds.length, "OmniZkdxStaking: params length wrong");
        for (uint256 i = 0; i < _chainIds.length; i++)
            poolIds[_chainIds[i]] = _poolIds[i];
    }

    function setRemoteStakings(uint16[] calldata _chainIds, address[] calldata _stakings) external onlyOwner {
        require(_chainIds.length == _stakings.length, "OmniZkdxStaking: params length wrong");
        for (uint256 i = 0; i < _chainIds.length; i++)
            remoteStakings[_chainIds[i]] = _stakings[i];
    }

    function setGasLookup(uint8[] calldata _ops, uint256[] calldata _gas) external onlyOwner {
        require(_ops.length == _gas.length, "OmniZkdxStaking: params length wrong");
        for (uint256 i = 0; i < _ops.length; i++)
            gasLookup[_ops[i]] = _gas[i];
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }

    function addrToBytes32(address _address) internal pure returns (bytes32 _bytes32Address) {
        return bytes32(uint256(uint160(_address)));
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

    function endRewards(address _receiver, uint256 _amount) external onlyOwner {
        require(block.timestamp > finishAt, "OmniZkdxStaking: not finished yet");
        IERC20(rewardsToken).transfer(_receiver, _amount);
    }

    receive() external payable {}
}
