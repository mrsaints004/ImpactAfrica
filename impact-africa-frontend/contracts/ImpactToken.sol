// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ImpactToken is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 10000 * 10**18; 
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetClaim;

    event FaucetClaimed(address indexed user, uint256 amount, uint256 timestamp);

    constructor() ERC20("Impact Africa Token", "IAT") Ownable(msg.sender) {
        
        _mint(msg.sender, 1000000 * 10**18); 
    }

    
    function claimFaucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown active"
        );

        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }

    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    
    function timeUntilNextClaim(address user) external view returns (uint256) {
        uint256 nextClaimTime = lastFaucetClaim[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
}