// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ReputationNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    struct Reputation {
        uint256 impactScore;
        uint256 projectsCompleted;
        uint256 opportunitiesCompleted;
        uint256 totalPledged;
        uint256 totalEarned;
        string ipfsMetadata;
    }

    mapping(address => uint256) public addressToTokenId;
    mapping(uint256 => Reputation) public reputations;
    mapping(address => bool) public authorizedContracts;

    event ReputationMinted(address indexed user, uint256 tokenId);
    event ImpactScoreUpdated(address indexed user, uint256 newScore);
    event MetadataUpdated(uint256 indexed tokenId, string ipfsHash);

    constructor() ERC721("Impact Africa Reputation", "IAR") Ownable(msg.sender) {}

    
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Transfer not allowed");
        }
        return super._update(to, tokenId, auth);
    }

    
    function mintReputation(address user, string memory ipfsHash) external {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        require(addressToTokenId[user] == 0, "User already has reputation NFT");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        addressToTokenId[user] = tokenId;
        reputations[tokenId] = Reputation({
            impactScore: 0,
            projectsCompleted: 0,
            opportunitiesCompleted: 0,
            totalPledged: 0,
            totalEarned: 0,
            ipfsMetadata: ipfsHash
        });

        _safeMint(user, tokenId);
        emit ReputationMinted(user, tokenId);
    }

    
    function updateImpactScore(address user, uint256 scoreIncrease) external {
        require(authorizedContracts[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        reputations[tokenId].impactScore += scoreIncrease;
        emit ImpactScoreUpdated(user, reputations[tokenId].impactScore);
    }

    
    function incrementProjectsCompleted(address user) external {
        require(authorizedContracts[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        reputations[tokenId].projectsCompleted++;
    }

    
    function incrementOpportunitiesCompleted(address user) external {
        require(authorizedContracts[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        reputations[tokenId].opportunitiesCompleted++;
    }

    
    function updateTotalPledged(address user, uint256 amount) external {
        require(authorizedContracts[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        reputations[tokenId].totalPledged += amount;
    }

    
    function updateTotalEarned(address user, uint256 amount) external {
        require(authorizedContracts[msg.sender], "Not authorized");
        uint256 tokenId = addressToTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        reputations[tokenId].totalEarned += amount;
    }

    
    function updateMetadata(uint256 tokenId, string memory ipfsHash) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        reputations[tokenId].ipfsMetadata = ipfsHash;
        emit MetadataUpdated(tokenId, ipfsHash);
    }

    
    function authorizeContract(address contractAddress, bool authorized) external onlyOwner {
        authorizedContracts[contractAddress] = authorized;
    }

    
    function getReputation(address user) external view returns (Reputation memory) {
        uint256 tokenId = addressToTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");
        return reputations[tokenId];
    }

    
    function hasReputation(address user) external view returns (bool) {
        return addressToTokenId[user] != 0;
    }

    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}