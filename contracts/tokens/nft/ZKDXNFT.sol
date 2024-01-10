// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZKDXNFT is ERC721Enumerable, Ownable {

    using Strings for uint256;

    string public baseURI;
    string public baseExtension;
    uint256 public startTime;
    bool public isSimpleURI;
    bytes32 public whitelistMerkleRoot;
    mapping(address => uint256) public mintAmounts;
    mapping(address => uint256) public mintedAmounts;

    constructor (string memory _baseURI, string memory _baseExtension, uint256 _startTime, bytes32 _whitelistMerkleRoot,
        string memory _name, string memory _symbol) ERC721(_name, _symbol){
        baseURI = _baseURI;
        baseExtension = _baseExtension;
        startTime = _startTime;
        isSimpleURI = true;
        whitelistMerkleRoot = _whitelistMerkleRoot;
    }

    function mint(address to, uint256 amount, bytes32[] calldata merkleProof) external {
        require(block.timestamp >= startTime, 'Not started.');
        uint256 _balance = getMintBalance(msg.sender, merkleProof);
        require(amount <= _balance, 'Your mint balance is not enough.');

        mintedAmounts[msg.sender] += amount;
        uint256 supply = totalSupply();
        for (uint256 i = 1; i <= amount; i++)
            _safeMint(to, supply + i);
    }

    function isValidMerkleProof(address account, bytes32[] calldata merkleProof) public view returns (bool){
        return MerkleProof.verify(
            merkleProof,
            whitelistMerkleRoot,
            keccak256(abi.encodePacked(account))
        );
    }

    function getMintBalance(address account, bytes32[] calldata merkleProof) public view returns (uint256) {
        require(isValidMerkleProof(account, merkleProof), 'You are not in whitelist.');
        uint256 max = mintAmounts[account] > 0 ? mintAmounts[account] : 1;
        return max - mintedAmounts[account];
    }

    function govMint(address to, uint256 amount) external onlyOwner {
        uint256 supply = totalSupply();
        for (uint256 i = 1; i <= amount; i++)
            _safeMint(to, supply + i);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        if (isSimpleURI) return bytes(baseURI).length > 0 ? baseURI : "";
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), baseExtension)) : "";
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension) external onlyOwner {
        baseExtension = _newBaseExtension;
    }

    function setStartTime(uint256 _startTime) external onlyOwner {
        startTime = _startTime;
    }

    function setIsSimpleURI(bool _isSimpleURI) external onlyOwner {
        isSimpleURI = _isSimpleURI;
    }

    function setBalances(address[] calldata accounts, uint256[] calldata amounts) external onlyOwner {
        require(accounts.length > 0, "Invalid accounts!");
        require(accounts.length == amounts.length, "Invalid length!");

        for (uint256 i = 0; i < accounts.length; i++)
            mintAmounts[accounts[i]] = amounts[i];
    }

    function setWhiteListMerkleRoot(bytes32 _whitelistMerkleRoot) external onlyOwner {
        whitelistMerkleRoot = _whitelistMerkleRoot;
    }
}
