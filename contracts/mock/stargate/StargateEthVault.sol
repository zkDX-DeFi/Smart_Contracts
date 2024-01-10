// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.7.6;

import "./openzeppelin3/Ownable.sol";
import "./openzeppelin3/ReentrancyGuard.sol";
import "./interfaces/IStargateEthVault.sol";

// This contract always UNWRAPS the erc20 for native gas token on transfer + transferFrom.
// If you wish to disable the transfer auto-unwrap, you can specify _to addresses with `setNoUnwrapTo`
contract StargateEthVault is IStargateEthVault, Ownable, ReentrancyGuard {
    string public constant name     = "Stargate Ether Vault";
    string public constant symbol   = "SGETH";
    uint8  public constant decimals = 18;

    uint256 public totalSupply;

    event Approval(address indexed src, address indexed guy, uint wad);
    event Transfer(address indexed src, address indexed dst, uint wad);
    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);
    event TransferNative(address indexed src, address indexed dst, uint wad);

    mapping (address => uint)                       public  balanceOf;
    mapping (address => mapping (address => uint))  public  allowance;
    mapping (address => bool)                       public  noUnwrapTo;

    // if you do NOT wish to unwrap eth on transfers TO certain addresses
    function setNoUnwrapTo(address _addr) external onlyOwner {
        noUnwrapTo[_addr] = true;
    }

    function deposit() public payable override {
        balanceOf[msg.sender] += msg.value;
        totalSupply += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint wad) external override {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender] -= wad;
        msg.sender.transfer(wad);
        totalSupply -= wad;
        emit Withdrawal(msg.sender, wad);
    }

    function approve(address guy, uint wad) external override returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    function transfer(address dst, uint wad) external override returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(address src, address dst, uint wad) public override nonReentrant returns (bool) {
        require(balanceOf[src] >= wad);

        if (src != msg.sender && allowance[src][msg.sender] != uint(-1)) {
            require(allowance[src][msg.sender] >= wad);
            allowance[src][msg.sender] -= wad;
        }

        // always decrement the src (payer) address
        balanceOf[src] -= wad;

        if(noUnwrapTo[dst]){
            // we do *not* unwrap
            balanceOf[dst] += wad;
            emit Transfer(src, dst, wad);

        } else {
            // unwrap and send native gas token
            totalSupply -= wad; // if its getting unwrapped, decrement the totalSupply
            (bool success, ) = dst.call{value: wad}("");
            require(success, "SGETH: failed to transfer");
            emit TransferNative(src, dst, wad);
        }

        return true;
    }

    function renounceOwnership() public override onlyOwner {}

    receive() external payable {
        deposit();
    }

}