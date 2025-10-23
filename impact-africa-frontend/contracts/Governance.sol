// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StakingPool.sol";


contract Governance is ReentrancyGuard, Ownable {
    StakingPool public stakingPool;

    enum ProposalStatus { Active, Passed, Defeated, Executed, Cancelled }
    enum VoteType { For, Against, Abstain }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 createdAt;
        uint256 votingEnds;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
        mapping(address => VoteType) votes;
    }

    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_APPROVAL_PERCENTAGE = 51;
    uint256 public minStakeToPropose = 100 * 10**18; 

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 votingEnds
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 votingPower
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus newStatus);

    constructor(address _stakingPool) Ownable(msg.sender) {
        stakingPool = StakingPool(_stakingPool);
    }

    
    function createProposal(
        string memory title,
        string memory description
    ) external nonReentrant returns (uint256) {
        require(
            stakingPool.getStakedAmount(msg.sender) >= minStakeToPropose,
            "Insufficient stake to create proposal"
        );

        _proposalIdCounter++;
        uint256 proposalId = _proposalIdCounter;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.forVotes = 0;
        proposal.againstVotes = 0;
        proposal.abstainVotes = 0;
        proposal.createdAt = block.timestamp;
        proposal.votingEnds = block.timestamp + VOTING_PERIOD;
        proposal.status = ProposalStatus.Active;

        emit ProposalCreated(proposalId, msg.sender, title, proposal.votingEnds);
        return proposalId;
    }

    
    function vote(uint256 proposalId, VoteType voteType) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.votingEnds, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 votingPower = stakingPool.getStakedAmount(msg.sender);
        require(votingPower > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = voteType;

        if (voteType == VoteType.For) {
            proposal.forVotes += votingPower;
        } else if (voteType == VoteType.Against) {
            proposal.againstVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

        emit VoteCast(proposalId, msg.sender, voteType, votingPower);
    }

    
    function finalizeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.votingEnds, "Voting period not ended");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        require(totalVotes > 0, "No votes cast");

        uint256 approvalPercentage = (proposal.forVotes * 100) / (proposal.forVotes + proposal.againstVotes);

        if (approvalPercentage >= MIN_APPROVAL_PERCENTAGE) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Defeated;
        }

        emit ProposalStatusChanged(proposalId, proposal.status);
    }

    
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Passed, "Proposal not passed");

        proposal.status = ProposalStatus.Executed;

        
        

        emit ProposalExecuted(proposalId);
        emit ProposalStatusChanged(proposalId, ProposalStatus.Executed);
    }

    
    function cancelProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );
        require(
            proposal.status == ProposalStatus.Active,
            "Proposal not active"
        );

        proposal.status = ProposalStatus.Cancelled;

        emit ProposalCancelled(proposalId);
        emit ProposalStatusChanged(proposalId, ProposalStatus.Cancelled);
    }

    
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 createdAt,
        uint256 votingEnds,
        ProposalStatus status
    ) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");

        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.createdAt,
            proposal.votingEnds,
            proposal.status
        );
    }

    
    function hasVoted(uint256 proposalId, address user) external view returns (bool) {
        return proposals[proposalId].hasVoted[user];
    }

    
    function getUserVote(uint256 proposalId, address user) external view returns (VoteType) {
        require(proposals[proposalId].hasVoted[user], "User has not voted");
        return proposals[proposalId].votes[user];
    }

    
    function getAllProposalIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](_proposalIdCounter);
        for (uint256 i = 1; i <= _proposalIdCounter; i++) {
            ids[i - 1] = i;
        }
        return ids;
    }

    
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= _proposalIdCounter; i++) {
            if (proposals[i].status == ProposalStatus.Active && block.timestamp < proposals[i].votingEnds) {
                activeCount++;
            }
        }

        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= _proposalIdCounter; i++) {
            if (proposals[i].status == ProposalStatus.Active && block.timestamp < proposals[i].votingEnds) {
                activeIds[index] = i;
                index++;
            }
        }

        return activeIds;
    }

    
    function updateMinStakeToPropose(uint256 newMinStake) external onlyOwner {
        minStakeToPropose = newMinStake;
    }

    
    function getTotalProposals() external view returns (uint256) {
        return _proposalIdCounter;
    }
}