// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReputationNFT.sol";


contract OpportunityContract is ReentrancyGuard, Ownable {
    IERC20 public token;
    ReputationNFT public reputationNFT;

    enum SubmissionStatus { Pending, Approved, Rejected }
    enum Category { Environmental, Education, Healthcare, CommunityService, Agriculture, Other }

    struct Opportunity {
        uint256 id;
        address ngo;
        Category category;
        string title;
        string description;
        string proofRequirements;
        int256 latitude;
        int256 longitude;
        uint256 radius; 
        uint256 rewardAmount;
        uint256 maxVolunteers;
        uint256 currentVolunteers;
        uint256 stakeAmount;
        uint256 createdAt;
        bool active;
    }

    struct Submission {
        uint256 id;
        uint256 opportunityId;
        address volunteer;
        string ipfsProofHash;
        int256 latitude;
        int256 longitude;
        uint256 submittedAt;
        SubmissionStatus status;
        bool aiVerified;
        uint256 aiConfidence; 
        bool needsManualReview;
    }

    uint256 private _opportunityIdCounter;
    uint256 private _submissionIdCounter;

    mapping(uint256 => Opportunity) public opportunities;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => uint256[]) public opportunitySubmissions; 
    mapping(address => uint256[]) public ngoOpportunities; 
    mapping(address => uint256[]) public volunteerSubmissions; 

    uint256 public constant BASE_STAKE = 100 * 10**18; 
    uint256 public constant IMPACT_SCORE_PER_SUBMISSION = 10;

    event OpportunityCreated(
        uint256 indexed opportunityId,
        address indexed ngo,
        string title,
        uint256 rewardAmount,
        uint256 maxVolunteers
    );
    event SubmissionCreated(
        uint256 indexed submissionId,
        uint256 indexed opportunityId,
        address indexed volunteer
    );
    event SubmissionVerified(
        uint256 indexed submissionId,
        address indexed volunteer,
        bool approved
    );
    event OpportunityCompleted(uint256 indexed opportunityId);
    event OpportunityCancelled(uint256 indexed opportunityId);

    constructor(address _token, address _reputationNFT) Ownable(msg.sender) {
        token = IERC20(_token);
        reputationNFT = ReputationNFT(_reputationNFT);
    }

    
    function createOpportunity(
        Category category,
        string memory title,
        string memory description,
        string memory proofRequirements,
        int256 latitude,
        int256 longitude,
        uint256 radius,
        uint256 rewardAmount,
        uint256 maxVolunteers
    ) external nonReentrant returns (uint256) {
        require(rewardAmount > 0, "Reward must be greater than 0");
        require(maxVolunteers > 0, "Must allow at least 1 volunteer");
        require(radius > 0, "Radius must be greater than 0");

        uint256 totalStake = BASE_STAKE + (rewardAmount * maxVolunteers);

        
        require(token.transferFrom(msg.sender, address(this), totalStake), "Stake transfer failed");

        _opportunityIdCounter++;
        uint256 opportunityId = _opportunityIdCounter;

        opportunities[opportunityId] = Opportunity({
            id: opportunityId,
            ngo: msg.sender,
            category: category,
            title: title,
            description: description,
            proofRequirements: proofRequirements,
            latitude: latitude,
            longitude: longitude,
            radius: radius,
            rewardAmount: rewardAmount,
            maxVolunteers: maxVolunteers,
            currentVolunteers: 0,
            stakeAmount: totalStake,
            createdAt: block.timestamp,
            active: true
        });

        ngoOpportunities[msg.sender].push(opportunityId);

        
        if (!reputationNFT.hasReputation(msg.sender)) {
            reputationNFT.mintReputation(msg.sender, "");
        }

        emit OpportunityCreated(opportunityId, msg.sender, title, rewardAmount, maxVolunteers);
        return opportunityId;
    }

    
    function submitProof(
        uint256 opportunityId,
        string memory ipfsProofHash,
        int256 latitude,
        int256 longitude,
        bool aiVerified,
        uint256 aiConfidence,
        bool needsManualReview
    ) external nonReentrant returns (uint256) {
        Opportunity storage opportunity = opportunities[opportunityId];
        require(opportunity.id != 0, "Opportunity does not exist");
        require(opportunity.active, "Opportunity not active");
        require(opportunity.currentVolunteers < opportunity.maxVolunteers, "Opportunity full");

        
        require(
            _isWithinRadius(latitude, longitude, opportunity.latitude, opportunity.longitude, opportunity.radius),
            "Location outside allowed radius"
        );

        _submissionIdCounter++;
        uint256 submissionId = _submissionIdCounter;

        submissions[submissionId] = Submission({
            id: submissionId,
            opportunityId: opportunityId,
            volunteer: msg.sender,
            ipfsProofHash: ipfsProofHash,
            latitude: latitude,
            longitude: longitude,
            submittedAt: block.timestamp,
            status: SubmissionStatus.Pending,
            aiVerified: aiVerified,
            aiConfidence: aiConfidence,
            needsManualReview: needsManualReview
        });

        opportunitySubmissions[opportunityId].push(submissionId);
        volunteerSubmissions[msg.sender].push(submissionId);

        
        if (!reputationNFT.hasReputation(msg.sender)) {
            reputationNFT.mintReputation(msg.sender, "");
        }

        emit SubmissionCreated(submissionId, opportunityId, msg.sender);
        return submissionId;
    }

    
    function verifySubmission(uint256 submissionId, bool approved) external nonReentrant {
        Submission storage submission = submissions[submissionId];
        require(submission.id != 0, "Submission does not exist");
        require(submission.status == SubmissionStatus.Pending, "Submission already processed");

        Opportunity storage opportunity = opportunities[submission.opportunityId];
        require(msg.sender == opportunity.ngo, "Only NGO can verify");

        if (approved) {
            submission.status = SubmissionStatus.Approved;
            opportunity.currentVolunteers++;

            
            require(token.transfer(submission.volunteer, opportunity.rewardAmount), "Reward transfer failed");

            
            reputationNFT.incrementOpportunitiesCompleted(submission.volunteer);
            reputationNFT.updateImpactScore(submission.volunteer, IMPACT_SCORE_PER_SUBMISSION);
            reputationNFT.updateTotalEarned(submission.volunteer, opportunity.rewardAmount);

            
            if (opportunity.currentVolunteers >= opportunity.maxVolunteers) {
                opportunity.active = false;
                
                require(token.transfer(opportunity.ngo, BASE_STAKE), "Stake return failed");
                emit OpportunityCompleted(submission.opportunityId);
            }
        } else {
            submission.status = SubmissionStatus.Rejected;
        }

        emit SubmissionVerified(submissionId, submission.volunteer, approved);
    }

    
    function cancelOpportunity(uint256 opportunityId) external nonReentrant {
        Opportunity storage opportunity = opportunities[opportunityId];
        require(opportunity.id != 0, "Opportunity does not exist");
        require(msg.sender == opportunity.ngo, "Only NGO can cancel");
        require(opportunity.active, "Opportunity not active");

        opportunity.active = false;

        
        uint256 remainingRewards = (opportunity.maxVolunteers - opportunity.currentVolunteers) * opportunity.rewardAmount;
        uint256 refund = BASE_STAKE + remainingRewards;

        require(token.transfer(msg.sender, refund), "Refund transfer failed");

        emit OpportunityCancelled(opportunityId);
    }

    
    function _isWithinRadius(
        int256 lat1,
        int256 lon1,
        int256 lat2,
        int256 lon2,
        uint256 radius
    ) internal pure returns (bool) {
        
        
        int256 latDiff = lat1 > lat2 ? lat1 - lat2 : lat2 - lat1;
        int256 lonDiff = lon1 > lon2 ? lon1 - lon2 : lon2 - lon1;

        
        
        uint256 approxDist = uint256((latDiff + lonDiff)) / 1000; 

        return approxDist <= radius;
    }

    
    function getAllOpportunityIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](_opportunityIdCounter);
        for (uint256 i = 1; i <= _opportunityIdCounter; i++) {
            ids[i - 1] = i;
        }
        return ids;
    }

    
    function getActiveOpportunities() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= _opportunityIdCounter; i++) {
            if (opportunities[i].active) {
                activeCount++;
            }
        }

        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= _opportunityIdCounter; i++) {
            if (opportunities[i].active) {
                activeIds[index] = i;
                index++;
            }
        }

        return activeIds;
    }

    
    function getOpportunitiesByNGO(address ngo) external view returns (uint256[] memory) {
        return ngoOpportunities[ngo];
    }

    
    function getSubmissionsByVolunteer(address volunteer) external view returns (uint256[] memory) {
        return volunteerSubmissions[volunteer];
    }

    
    function getPendingSubmissions(uint256 opportunityId) external view returns (uint256[] memory) {
        uint256[] memory allSubmissions = opportunitySubmissions[opportunityId];
        uint256 pendingCount = 0;

        for (uint256 i = 0; i < allSubmissions.length; i++) {
            if (submissions[allSubmissions[i]].status == SubmissionStatus.Pending) {
                pendingCount++;
            }
        }

        uint256[] memory pending = new uint256[](pendingCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allSubmissions.length; i++) {
            if (submissions[allSubmissions[i]].status == SubmissionStatus.Pending) {
                pending[index] = allSubmissions[i];
                index++;
            }
        }

        return pending;
    }

    
    function getTotalOpportunities() external view returns (uint256) {
        return _opportunityIdCounter;
    }
}