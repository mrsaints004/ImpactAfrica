// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReputationNFT.sol";


contract FarmingProject is ReentrancyGuard, Ownable {
    IERC20 public token;
    ReputationNFT public reputationNFT;

    enum ProjectStatus { Active, Funded, HarvestPeriod, Completed, Failed }
    enum PledgeStatus { Active, Withdrawn, Completed }

    struct Project {
        uint256 id;
        address farmer;
        string title;
        string description;
        string ipfsDocumentation;
        uint256 fundingGoal;
        uint256 totalPledged;
        uint256 harvestPeriod; 
        uint256 returnPercentage; 
        uint256 createdAt;
        uint256 fundedAt;
        uint256 harvestStartDate;
        ProjectStatus status;
        bool farmerWithdrawn;
    }

    struct Pledge {
        uint256 projectId;
        address pledger;
        uint256 amount;
        uint256 pledgedAt;
        PledgeStatus status;
    }

    uint256 private _projectIdCounter;
    uint256 private _pledgeIdCounter;

    mapping(uint256 => Project) public projects;
    mapping(uint256 => Pledge) public pledges;
    mapping(uint256 => uint256[]) public projectPledges; 
    mapping(address => uint256[]) public userPledges; 
    mapping(address => uint256[]) public farmerProjects; 

    uint256 public constant MIN_FUNDING_GOAL = 100 * 10**18; 
    uint256 public constant MAX_HARVEST_PERIOD = 365 days;
    uint256 public constant MIN_RETURN_PERCENTAGE = 100; 
    uint256 public constant MAX_RETURN_PERCENTAGE = 300; 

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed farmer,
        string title,
        uint256 fundingGoal,
        uint256 harvestPeriod,
        uint256 returnPercentage
    );
    event ProjectPledged(
        uint256 indexed projectId,
        uint256 indexed pledgeId,
        address indexed pledger,
        uint256 amount
    );
    event ProjectFunded(uint256 indexed projectId, uint256 totalAmount);
    event FundsWithdrawn(uint256 indexed projectId, address indexed farmer, uint256 amount);
    event HarvestReported(uint256 indexed projectId, bool success);
    event ReturnsDistributed(uint256 indexed projectId, uint256 totalReturns);
    event PledgeWithdrawn(uint256 indexed pledgeId, address indexed pledger, uint256 amount);

    constructor(address _token, address _reputationNFT) Ownable(msg.sender) {
        token = IERC20(_token);
        reputationNFT = ReputationNFT(_reputationNFT);
    }

    
    function createProject(
        string memory title,
        string memory description,
        string memory ipfsDocumentation,
        uint256 fundingGoal,
        uint256 harvestPeriodDays,
        uint256 returnPercentage
    ) external nonReentrant returns (uint256) {
        require(fundingGoal >= MIN_FUNDING_GOAL, "Funding goal too low");
        require(harvestPeriodDays > 0 && harvestPeriodDays * 1 days <= MAX_HARVEST_PERIOD, "Invalid harvest period");
        require(
            returnPercentage >= MIN_RETURN_PERCENTAGE && returnPercentage <= MAX_RETURN_PERCENTAGE,
            "Invalid return percentage"
        );

        _projectIdCounter++;
        uint256 projectId = _projectIdCounter;

        projects[projectId] = Project({
            id: projectId,
            farmer: msg.sender,
            title: title,
            description: description,
            ipfsDocumentation: ipfsDocumentation,
            fundingGoal: fundingGoal,
            totalPledged: 0,
            harvestPeriod: harvestPeriodDays * 1 days,
            returnPercentage: returnPercentage,
            createdAt: block.timestamp,
            fundedAt: 0,
            harvestStartDate: 0,
            status: ProjectStatus.Active,
            farmerWithdrawn: false
        });

        farmerProjects[msg.sender].push(projectId);

        
        if (!reputationNFT.hasReputation(msg.sender)) {
            reputationNFT.mintReputation(msg.sender, "");
        }

        emit ProjectCreated(projectId, msg.sender, title, fundingGoal, harvestPeriodDays * 1 days, returnPercentage);
        return projectId;
    }

    
    function pledgeToProject(uint256 projectId, uint256 amount) external nonReentrant {
        Project storage project = projects[projectId];
        require(project.id != 0, "Project does not exist");
        require(project.status == ProjectStatus.Active, "Project not accepting pledges");
        require(amount > 0, "Amount must be greater than 0");
        require(project.totalPledged + amount <= project.fundingGoal, "Exceeds funding goal");

        
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        _pledgeIdCounter++;
        uint256 pledgeId = _pledgeIdCounter;

        pledges[pledgeId] = Pledge({
            projectId: projectId,
            pledger: msg.sender,
            amount: amount,
            pledgedAt: block.timestamp,
            status: PledgeStatus.Active
        });

        project.totalPledged += amount;
        projectPledges[projectId].push(pledgeId);
        userPledges[msg.sender].push(pledgeId);

        
        if (!reputationNFT.hasReputation(msg.sender)) {
            reputationNFT.mintReputation(msg.sender, "");
        }

        
        reputationNFT.updateTotalPledged(msg.sender, amount);
        reputationNFT.updateImpactScore(msg.sender, amount / 10**18); 

        emit ProjectPledged(projectId, pledgeId, msg.sender, amount);

        
        if (project.totalPledged >= project.fundingGoal) {
            project.status = ProjectStatus.Funded;
            project.fundedAt = block.timestamp;
            emit ProjectFunded(projectId, project.totalPledged);
        }
    }

    
    function withdrawFunds(uint256 projectId) external nonReentrant {
        Project storage project = projects[projectId];
        require(project.id != 0, "Project does not exist");
        require(msg.sender == project.farmer, "Only farmer can withdraw");
        require(project.status == ProjectStatus.Funded, "Project not funded");
        require(!project.farmerWithdrawn, "Funds already withdrawn");

        project.farmerWithdrawn = true;
        project.status = ProjectStatus.HarvestPeriod;
        project.harvestStartDate = block.timestamp;

        uint256 amount = project.totalPledged;
        require(token.transfer(msg.sender, amount), "Token transfer failed");

        emit FundsWithdrawn(projectId, msg.sender, amount);
    }

    
    function reportHarvest(uint256 projectId, bool success) external nonReentrant {
        Project storage project = projects[projectId];
        require(project.id != 0, "Project does not exist");
        require(msg.sender == project.farmer, "Only farmer can report harvest");
        require(project.status == ProjectStatus.HarvestPeriod, "Not in harvest period");
        require(
            block.timestamp >= project.harvestStartDate + project.harvestPeriod,
            "Harvest period not complete"
        );

        if (success) {
            
            uint256 totalReturns = (project.totalPledged * project.returnPercentage) / 100;

            
            require(
                token.transferFrom(msg.sender, address(this), totalReturns),
                "Return transfer failed"
            );

            project.status = ProjectStatus.Completed;

            
            reputationNFT.incrementProjectsCompleted(msg.sender);
            reputationNFT.updateImpactScore(msg.sender, 50); 

            emit ReturnsDistributed(projectId, totalReturns);
        } else {
            project.status = ProjectStatus.Failed;
        }

        emit HarvestReported(projectId, success);
    }

    
    function claimReturns(uint256 pledgeId) external nonReentrant {
        Pledge storage pledge = pledges[pledgeId];
        require(pledge.pledger == msg.sender, "Not pledge owner");
        require(pledge.status == PledgeStatus.Active, "Pledge not active");

        Project storage project = projects[pledge.projectId];
        require(project.status == ProjectStatus.Completed, "Project not completed");

        uint256 returnAmount = (pledge.amount * project.returnPercentage) / 100;
        pledge.status = PledgeStatus.Completed;

        require(token.transfer(msg.sender, returnAmount), "Token transfer failed");

        
        reputationNFT.updateTotalEarned(msg.sender, returnAmount);
        reputationNFT.updateImpactScore(msg.sender, 20); 

        emit PledgeWithdrawn(pledgeId, msg.sender, returnAmount);
    }

    
    function withdrawFailedPledge(uint256 pledgeId) external nonReentrant {
        Pledge storage pledge = pledges[pledgeId];
        require(pledge.pledger == msg.sender, "Not pledge owner");
        require(pledge.status == PledgeStatus.Active, "Pledge not active");

        Project storage project = projects[pledge.projectId];
        require(
            project.status == ProjectStatus.Failed ||
            (project.status == ProjectStatus.Active && block.timestamp > project.createdAt + 90 days),
            "Cannot withdraw yet"
        );

        pledge.status = PledgeStatus.Withdrawn;

        require(token.transfer(msg.sender, pledge.amount), "Token transfer failed");

        emit PledgeWithdrawn(pledgeId, msg.sender, pledge.amount);
    }

    
    function getAllProjectIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](_projectIdCounter);
        for (uint256 i = 1; i <= _projectIdCounter; i++) {
            ids[i - 1] = i;
        }
        return ids;
    }

    
    function getProjectsByFarmer(address farmer) external view returns (uint256[] memory) {
        return farmerProjects[farmer];
    }

    
    function getPledgesByUser(address user) external view returns (uint256[] memory) {
        return userPledges[user];
    }

    
    function getProjectPledges(uint256 projectId) external view returns (uint256[] memory) {
        return projectPledges[projectId];
    }

    
    function getTotalProjects() external view returns (uint256) {
        return _projectIdCounter;
    }
}