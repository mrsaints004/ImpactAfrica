// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract StakingPool is ReentrancyGuard, Ownable {
    IERC20 public token;

    struct Stake {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastClaimAt;
    }

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public rewardRate = 10; 
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        Stake storage userStake = stakes[msg.sender];

        
        if (userStake.amount > 0) {
            _claimRewards(msg.sender);
        }

        userStake.amount += amount;
        userStake.stakedAt = block.timestamp;
        userStake.lastClaimAt = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount, block.timestamp);
    }

    
    function unstake(uint256 amount) external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");

        
        _claimRewards(msg.sender);

        userStake.amount -= amount;
        totalStaked -= amount;

        
        require(token.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }

    
    function _claimRewards(address user) internal {
        uint256 rewards = calculatePendingRewards(user);
        if (rewards > 0) {
            stakes[user].lastClaimAt = block.timestamp;
            require(token.transfer(user, rewards), "Reward transfer failed");
            emit RewardsClaimed(user, rewards, block.timestamp);
        }
    }

    
    function calculatePendingRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        if (userStake.amount == 0) {
            return 0;
        }

        uint256 stakeDuration = block.timestamp - userStake.lastClaimAt;
        uint256 rewards = (userStake.amount * rewardRate * stakeDuration) / (SECONDS_PER_YEAR * 100);

        return rewards;
    }

    
    function getStakedAmount(address user) external view returns (uint256) {
        return stakes[user].amount;
    }

    
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 100, "Rate too high"); 
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    
    function fundPool(uint256 amount) external onlyOwner {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    
    function getPoolBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _rewardRate,
        uint256 _poolBalance
    ) {
        return (
            totalStaked,
            rewardRate,
            token.balanceOf(address(this))
        );
    }
}