# 📚 Impact Africa - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
4. [Frontend Application](#frontend-application)
5. [AI Verification System](#ai-verification-system)
6. [Web3 Integration](#web3-integration)
7. [IPFS Storage](#ipfs-storage)
8. [User Flows](#user-flows)
9. [API Reference](#api-reference)
10. [Deployment Guide](#deployment-guide)
11. [Testing](#testing)
12. [Security Considerations](#security-considerations)
13. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Impact Africa?

Impact Africa is a decentralized platform built on Hedera EVM that creates a sustainable ecosystem for social impact in Africa. It connects three key stakeholders:

1. **Farmers** - Seeking community funding for agricultural projects
2. **NGOs** - Creating volunteer opportunities for community impact
3. **Community Members** - Supporting farmers and completing impact work

The platform uses blockchain technology to ensure transparency, AI for automated verification, and tokenomics to incentivize participation.

### Key Innovation

- **AI-Powered Verification**: TensorFlow.js models (COCO-SSD + MobileNet) analyze submitted proof images
- **GPS Verification**: Location-based validation ensures on-ground impact
- **Reputation System**: Soulbound NFTs track contribution history
- **Community Governance**: Token holders vote on platform decisions
- **Economic Sustainability**: Staking rewards and harvest returns create circular economy

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Farmer  │  │   NGO    │  │ Impacter │  │Community │  │
│  │Dashboard │  │Dashboard │  │Dashboard │  │ Pledging │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │      Web3 Provider (ethers.js)      │
        │   ┌─────────────────────────────┐   │
        │   │  MetaMask / Wallet Connect  │   │
        │   └─────────────────────────────┘   │
        └─────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Hedera EVM (Chain ID: 296)                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ImpactToken  │  │ Reputation   │  │  Farming     │      │
│  │   (ERC20)    │  │ NFT (ERC721) │  │   Project    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Opportunity  │  │   Staking    │  │  Governance  │      │
│  │  Contract    │  │     Pool     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │         IPFS (Pinata)                │
        │  - Proof Images                      │
        │  - Project Documentation             │
        └─────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │    AI Verification (TensorFlow.js)   │
        │  - COCO-SSD (Object Detection)       │
        │  - MobileNet (Image Classification)  │
        └─────────────────────────────────────┘
```

### Technology Stack

**Blockchain Layer:**
- Hedera EVM (Testnet Chain ID: 296)
- Solidity 0.8.20
- Hardhat Development Environment
- OpenZeppelin Contract Libraries

**Frontend Layer:**
- React 19 with TypeScript
- Vite (Build Tool)
- TailwindCSS (Styling)
- ethers.js v6 (Web3 Integration)

**Storage & AI:**
- Pinata (IPFS Gateway)
- TensorFlow.js (ML Models)
- COCO-SSD (Object Detection)
- MobileNet (Image Classification)

---

## Smart Contracts

### 1. ImpactToken.sol

**Purpose**: ERC20 token that powers the entire ecosystem

**Key Features:**
- 1 billion initial supply
- Faucet system for easy onboarding (10,000 IAT per claim)
- 1-hour cooldown between faucet claims
- Controlled minting for staking rewards

**Contract Structure:**
```solidity
contract ImpactToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant FAUCET_AMOUNT = 10000 * 10**18;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetClaim;
    mapping(address => bool) public authorizedMinters;
}
```

**Important Functions:**

```solidity
// Claim free tokens (once per hour)
function claimFaucet() external nonReentrant

// Mint tokens (only authorized contracts)
function mint(address to, uint256 amount) external

// Standard ERC20 functions
function transfer(address to, uint256 amount) external
function approve(address spender, uint256 amount) external
```

**Events:**
```solidity
event FaucetClaimed(address indexed user, uint256 amount);
event MinterAuthorized(address indexed minter);
```

---

### 2. ReputationNFT.sol

**Purpose**: Soulbound NFT representing user reputation and impact

**Key Features:**
- Non-transferable (soulbound)
- Dynamic impact score that increases with contributions
- Track total pledged, earned, projects completed
- Different categories: Farmer, Volunteer, Supporter

**Contract Structure:**
```solidity
contract ReputationNFT is ERC721, Ownable {
    struct Reputation {
        uint256 impactScore;
        uint256 projectsCompleted;
        uint256 totalPledged;
        uint256 totalEarned;
        Category category;
        uint256 mintedAt;
    }

    enum Category { Farmer, Volunteer, Supporter }

    mapping(uint256 => Reputation) public reputations;
    mapping(address => uint256) public userTokenId;
}
```

**Important Functions:**

```solidity
// Mint reputation NFT (one per user)
function mintReputation(address user, Category category) external

// Update impact metrics
function updateImpactScore(address user, uint256 scoreIncrease) external
function updateProjectsCompleted(address user) external
function updateTotalPledged(address user, uint256 amount) external

// View reputation
function getReputation(address user) external view returns (Reputation memory)
```

**Impact Score Calculation:**
- Completing a farming project: +100 points
- Completing volunteer opportunity: +50 points
- Making a pledge: +10 points
- Verified submission: +25 points

---

### 3. FarmingProject.sol

**Purpose**: Community funding for agricultural projects

**Key Features:**
- Farmers create projects with funding goals
- Community pledges tokens
- Farmer withdraws when fully funded
- Returns distributed after harvest
- Reputation updates on completion

**Contract Structure:**
```solidity
struct Project {
    uint256 id;
    address farmer;
    string title;
    string description;
    string ipfsHash;
    uint256 fundingGoal;
    uint256 totalPledged;
    uint256 harvestPeriod;
    uint256 returnPercentage;
    uint256 createdAt;
    uint256 harvestReportedAt;
    Status status;
    bool fundsWithdrawn;
}

enum Status { Active, Funded, Harvested, Failed }

mapping(uint256 => mapping(address => uint256)) public pledges;
```

**Important Functions:**

```solidity
// Create a farming project
function createProject(
    string memory title,
    string memory description,
    string memory ipfsHash,
    uint256 fundingGoal,
    uint256 harvestPeriod,
    uint256 returnPercentage
) external

// Pledge to a project
function pledgeToProject(uint256 projectId, uint256 amount) external

// Farmer withdraws funds (when fully funded)
function withdrawFunds(uint256 projectId) external

// Report harvest outcome
function reportHarvest(uint256 projectId, bool successful) external

// Claim returns (pledgers)
function claimReturns(uint256 projectId) external
```

**Project Lifecycle:**
1. **Active** → Accepting pledges
2. **Funded** → Goal reached, farmer can withdraw
3. **Harvested** → Success reported, returns claimable
4. **Failed** → Unsuccessful, pledges refundable

---

### 4. OpportunityContract.sol

**Purpose**: NGO volunteer opportunities with GPS and AI verification

**Key Features:**
- NGOs stake tokens to create opportunities
- GPS-based location verification
- AI confidence scoring for submissions
- Manual review by NGOs
- Rewards distributed on approval

**Contract Structure:**
```solidity
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
    Status status;
    bool aiVerified;
    uint256 aiConfidence;
    bool needsManualReview;
}

enum Category { Environmental, Education, Healthcare, CommunityService, Agriculture, Other }
enum Status { Pending, Approved, Rejected }
```

**Important Functions:**

```solidity
// Create opportunity (NGO)
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
) external

// Submit proof with AI data
function submitProofWithAI(
    uint256 opportunityId,
    string memory ipfsProofHash,
    int256 latitude,
    int256 longitude,
    bool aiVerified,
    uint256 aiConfidence,
    bool needsManualReview
) external

// Verify submission (NGO)
function verifySubmission(uint256 submissionId, bool approved) external

// Cancel opportunity
function cancelOpportunity(uint256 opportunityId) external
```

**Stake Calculation:**
```
Total Stake = 100 IAT + (rewardAmount × maxVolunteers)
```

**Location Verification:**
- Haversine formula calculates distance
- Submission rejected if outside radius
- Coordinates stored as integers (lat/lng × 10^6)

---

### 5. StakingPool.sol

**Purpose**: Token staking with passive rewards

**Key Features:**
- 10% APY (configurable)
- Instant unstaking
- Rewards calculated per-second
- No lock-up period

**Contract Structure:**
```solidity
struct Stake {
    uint256 amount;
    uint256 stakedAt;
    uint256 lastClaimAt;
}

mapping(address => Stake) public stakes;
uint256 public totalStaked;
uint256 public rewardRate = 10; // 10% APY
```

**Important Functions:**

```solidity
// Stake tokens
function stake(uint256 amount) external

// Unstake tokens
function unstake(uint256 amount) external

// Claim accumulated rewards
function claimRewards() external

// Calculate pending rewards
function calculatePendingRewards(address user) public view returns (uint256)
```

**Reward Calculation:**
```solidity
reward = (stakedAmount × rewardRate × timeStaked) / (365 days × 100)
```

---

### 6. Governance.sol

**Purpose**: Decentralized platform governance

**Key Features:**
- Stake-weighted voting
- 3-day voting period
- Proposal creation requires 100 staked IAT
- Vote options: For, Against, Abstain
- Automatic execution of passed proposals

**Contract Structure:**
```solidity
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
    bool executed;
    bool finalized;
    ProposalStatus status;
}

enum ProposalStatus { Active, Passed, Rejected, Executed }
enum VoteType { For, Against, Abstain }

mapping(uint256 => mapping(address => bool)) public hasVoted;
```

**Important Functions:**

```solidity
// Create proposal (requires 100 staked tokens)
function createProposal(
    string memory title,
    string memory description
) external

// Cast vote
function vote(uint256 proposalId, VoteType voteType) external

// Finalize after voting period
function finalizeProposal(uint256 proposalId) external

// Execute passed proposal
function executeProposal(uint256 proposalId) external
```

**Voting Power:**
```
votingPower = stakedAmount
```

**Proposal Passes If:**
```
forVotes > againstVotes && (forVotes + againstVotes) > 0
```

---

## Frontend Application

### Project Structure

```
impact-africa-frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.tsx      # Navigation header with wallet connection
│   │   └── Footer.tsx      # Footer component
│   ├── pages/              # Page components
│   │   ├── Home.tsx        # Landing page
│   │   ├── FarmerDashboard.tsx
│   │   ├── NGODashboard.tsx
│   │   ├── ImpacterDashboard.tsx
│   │   ├── CommunityPledging.tsx
│   │   ├── Staking.tsx
│   │   ├── Governance.tsx
│   │   └── Leaderboard.tsx
│   ├── utils/              # Utility functions
│   │   ├── web3Provider.ts       # Web3 connection management
│   │   ├── ipfs.ts              # IPFS integration
│   │   ├── aiVerification.ts    # AI model integration
│   │   ├── opportunityContract.ts # Contract helpers
│   │   └── toast.ts             # Toast notifications
│   ├── contracts/          # Contract ABIs and addresses
│   │   ├── ImpactToken.json
│   │   ├── ReputationNFT.json
│   │   ├── FarmingProject.json
│   │   ├── OpportunityContract.json
│   │   ├── StakingPool.json
│   │   ├── Governance.json
│   │   └── addresses.json
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env                    # Environment variables
├── tailwind.config.js      # Tailwind configuration
├── vite.config.ts          # Vite configuration
└── package.json
```

### Key Components

#### 1. Web3Provider (`utils/web3Provider.ts`)

Manages wallet connection and contract instances:

```typescript
class Web3Provider {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;
  private address: string | null = null;

  // Connect to MetaMask
  async connect(): Promise<string>

  // Auto-switch to Hedera Testnet
  async switchToHederaTestnet(): Promise<boolean>

  // Get contract instances
  getImpactToken(): Contract | null
  getReputationNFT(): Contract | null
  getFarmingProject(): Contract | null
  getOpportunityContract(): Contract | null
  getStakingPool(): Contract | null
  getGovernance(): Contract | null
}
```

**Features:**
- Automatic network detection
- Auto-switch to Hedera Testnet (Chain ID 296)
- Handles network and account changes
- Singleton pattern for global access

#### 2. IPFS Service (`utils/ipfs.ts`)

Handles decentralized file storage:

```typescript
class IPFSService {
  // Upload file to IPFS via Pinata
  async uploadFile(file: File): Promise<string>

  // Generate IPFS gateway URL
  getIPFSUrl(hash: string): string
}
```

**Configuration:**
```typescript
VITE_PINATA_API_KEY=your_api_key
VITE_PINATA_SECRET_KEY=your_secret_key
VITE_PINATA_JWT=your_jwt_token
```

#### 3. AI Verification (`utils/aiVerification.ts`)

TensorFlow.js-based image verification:

```typescript
interface AIVerificationResult {
  isValid: boolean;
  confidence: number;
  detectedObjects: string[];
  suggestions: string[];
  needsManualReview: boolean;
}

// Load AI models
async function loadAIModels(): Promise<void>

// Verify image for opportunity category
async function verifyImage(
  file: File,
  category: string
): Promise<AIVerificationResult>
```

**Models Used:**
- **COCO-SSD**: Detects 90 common objects
- **MobileNet**: Classifies images into 1000+ categories

**Verification Logic:**
```typescript
// Environmental: Look for nature, waste, cleanup objects
// Education: Look for books, people, learning materials
// Healthcare: Look for medical items, people
// Community: Look for people, groups, activities
// Agriculture: Look for plants, farming equipment
```

#### 4. Toast Notifications (`utils/toast.ts`)

User-friendly error and success messages:

```typescript
export const showToast = {
  success: (message: string, duration?: number) => void
  error: (message: string | Error, duration?: number) => void
  loading: (message: string, id?: string) => string
  info: (message: string, duration?: number) => void
}

// Smart error formatting
function formatErrorMessage(error: any): string
```

**Features:**
- Extracts revert reasons from blockchain errors
- User rejection handling
- Network error messages
- Insufficient funds detection

---

## AI Verification System

### Overview

The AI verification system uses TensorFlow.js to analyze proof images before submission, providing:
- **Pre-verification**: Instant feedback to impacters
- **Confidence scoring**: Helps NGOs prioritize reviews
- **Category matching**: Ensures image relevance

### How It Works

1. **Model Loading** (on app start):
```typescript
await tf.ready();
const cocoModel = await cocoSsd.load();
const mobileNetModel = await mobilenet.load();
```

2. **Image Analysis**:
```typescript
// Object detection
const predictions = await cocoModel.detect(imageElement);

// Image classification
const classifications = await mobileNetModel.classify(imageElement);
```

3. **Verification Logic**:
```typescript
// Check for category-specific objects
const hasRelevantObjects = predictions.some(pred =>
  categoryKeywords.includes(pred.class.toLowerCase())
);

// Calculate confidence
const confidence = (
  objectConfidence * 0.6 +
  classificationConfidence * 0.4
);

// Determine if manual review needed
const needsManualReview = confidence < 70;
```

### Category Keywords

**Environmental:**
- Objects: tree, plant, bottle, trash, waste, recycling
- Activities: cleaning, planting, conservation

**Education:**
- Objects: book, laptop, person, classroom, desk
- Activities: teaching, learning, studying

**Healthcare:**
- Objects: person, medical, hospital, doctor, nurse
- Activities: care, treatment, health

**Community Service:**
- Objects: person, people, group, building, tools
- Activities: gathering, helping, building

**Agriculture:**
- Objects: plant, tree, crop, farming, tool, tractor
- Activities: farming, planting, harvesting

### Verification Thresholds

```typescript
// AI passes if:
confidence >= 60% AND hasRelevantObjects

// Manual review if:
confidence < 70% OR !hasRelevantObjects

// Auto-reject if:
confidence < 30% AND !hasRelevantObjects
```

### Storage in Smart Contract

```solidity
struct Submission {
    // ... other fields
    bool aiVerified;        // Did AI pass the image?
    uint256 aiConfidence;   // Confidence score (0-100)
    bool needsManualReview; // Should NGO review manually?
}
```

---

## Web3 Integration

### Connection Flow

```
User clicks "Connect Wallet"
       ↓
Request accounts from MetaMask
       ↓
Check current network
       ↓
If not Hedera Testnet:
    ↓
    Try to switch network
    ↓
    If network not added:
        ↓
        Add Hedera Testnet
       ↓
Initialize provider & signer
       ↓
Load contract instances
       ↓
Update UI with wallet info
```

### Network Configuration

```typescript
const HEDERA_TESTNET = {
  chainId: '0x128', // 296 in hex
  chainName: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 18,
  },
  rpcUrls: ['https://testnet.hashio.io/api'],
  blockExplorerUrls: ['https://hashscan.io/testnet'],
};
```

### Contract Interaction Pattern

```typescript
// 1. Get contract instance
const token = web3Provider.getImpactToken();

// 2. Call contract method
const tx = await token.transfer(recipient, amount);

// 3. Wait for confirmation
await tx.wait();

// 4. Update UI
showToast.success('Transfer successful!');
```

### Event Listening

```typescript
// Listen for contract events
opportunityContract.on('SubmissionVerified', (
  submissionId,
  opportunityId,
  volunteer,
  approved
) => {
  // Update UI
  loadSubmissions();
});
```

---

## IPFS Storage

### File Upload Process

```typescript
// 1. User selects file
<input type="file" onChange={handleFileChange} />

// 2. Upload to IPFS
const ipfsHash = await ipfsService.uploadFile(file);

// 3. Store hash on blockchain
await contract.submitProof(opportunityId, ipfsHash, lat, lng);

// 4. Retrieve file
const imageUrl = ipfsService.getIPFSUrl(ipfsHash);
```

### Pinata Integration

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(
  'https://api.pinata.cloud/pinning/pinFileToIPFS',
  {
    method: 'POST',
    headers: {
      'pinata_api_key': API_KEY,
      'pinata_secret_api_key': SECRET_KEY,
    },
    body: formData,
  }
);

const { IpfsHash } = await response.json();
```

### Gateway URLs

**Primary Gateway:**
```
https://gateway.pinata.cloud/ipfs/{hash}
```

**Fallback Gateway:**
```
https://ipfs.io/ipfs/{hash}
```

---

## User Flows

### 1. Farmer Creates Project

```
1. Connect wallet
2. Navigate to Farmer Dashboard
3. Click "Create Project"
4. Fill form:
   - Title & description
   - Funding goal (IAT)
   - Harvest period (days)
   - Return percentage (%)
   - Optional: Upload documentation to IPFS
5. Approve transaction
6. Wait for confirmation
7. Project appears as "Active"
8. Share project with community
```

### 2. Community Member Pledges

```
1. Connect wallet
2. Navigate to Community Pledging
3. Browse active projects
4. Select project to support
5. Enter pledge amount
6. Approve token spending
7. Confirm pledge transaction
8. Track project progress
9. After harvest, claim returns
```

### 3. NGO Creates Opportunity

```
1. Connect wallet
2. Claim tokens from faucet
3. Navigate to NGO Dashboard
4. Click "Create Opportunity"
5. Fill form:
   - Category selection
   - Title & description
   - Proof requirements
   - GPS location (or use current location)
   - Radius (meters)
   - Reward per impacter (IAT)
   - Max number of impacters
6. Approve stake amount
7. Confirm creation
8. Monitor submissions
```

### 4. Impacter Submits Proof

```
1. Connect wallet
2. Navigate to Impacter Dashboard
3. Browse available opportunities
4. Ensure within location radius
5. Click "Submit Proof"
6. Upload photo:
   - AI analyzes image automatically
   - Shows confidence score
   - GPS auto-detected
7. Review AI feedback
8. Submit proof
9. Wait for NGO verification
10. Receive reward on approval
```

### 5. Staking Flow

```
1. Connect wallet
2. Navigate to Staking page
3. View current APY (10%)
4. Enter amount to stake
5. Approve transaction
6. Tokens locked, rewards start accruing
7. View pending rewards (updates real-time)
8. Claim rewards anytime
9. Unstake tokens (instant)
```

### 6. Governance Flow

```
1. Stake minimum 100 IAT
2. Navigate to Governance
3. View active proposals
4. Read proposal details
5. Cast vote (For/Against/Abstain)
6. Voting power = staked amount
7. Wait for 3-day voting period
8. Proposal finalized
9. If passed, proposal executed
```

---

## API Reference

### Smart Contract Methods

#### ImpactToken

```solidity
// Read Methods
balanceOf(address account) → uint256
allowance(address owner, address spender) → uint256
lastFaucetClaim(address user) → uint256

// Write Methods
claimFaucet() → void
transfer(address to, uint256 amount) → bool
approve(address spender, uint256 amount) → bool
```

#### FarmingProject

```solidity
// Read Methods
projects(uint256 id) → Project
pledges(uint256 projectId, address pledger) → uint256
getTotalProjects() → uint256

// Write Methods
createProject(
    string title,
    string description,
    string ipfsHash,
    uint256 fundingGoal,
    uint256 harvestPeriod,
    uint256 returnPercentage
) → uint256

pledgeToProject(uint256 projectId, uint256 amount) → void
withdrawFunds(uint256 projectId) → void
reportHarvest(uint256 projectId, bool successful) → void
claimReturns(uint256 projectId) → void
```

#### OpportunityContract

```solidity
// Read Methods
opportunities(uint256 id) → Opportunity
submissions(uint256 id) → Submission
getActiveOpportunities() → uint256[]
getPendingSubmissions(uint256 opportunityId) → uint256[]
getSubmissionsByVolunteer(address volunteer) → uint256[]
getOpportunitiesByNGO(address ngo) → uint256[]

// Write Methods
createOpportunity(
    Category category,
    string title,
    string description,
    string proofRequirements,
    int256 latitude,
    int256 longitude,
    uint256 radius,
    uint256 rewardAmount,
    uint256 maxVolunteers
) → uint256

submitProofWithAI(
    uint256 opportunityId,
    string ipfsProofHash,
    int256 latitude,
    int256 longitude,
    bool aiVerified,
    uint256 aiConfidence,
    bool needsManualReview
) → uint256

verifySubmission(uint256 submissionId, bool approved) → void
cancelOpportunity(uint256 opportunityId) → void
```

#### StakingPool

```solidity
// Read Methods
stakes(address user) → Stake
calculatePendingRewards(address user) → uint256
totalStaked() → uint256
rewardRate() → uint256

// Write Methods
stake(uint256 amount) → void
unstake(uint256 amount) → void
claimRewards() → void
```

#### Governance

```solidity
// Read Methods
proposals(uint256 id) → Proposal
hasVoted(uint256 proposalId, address voter) → bool
getActiveProposals() → uint256[]

// Write Methods
createProposal(string title, string description) → uint256
vote(uint256 proposalId, VoteType voteType) → void
finalizeProposal(uint256 proposalId) → void
executeProposal(uint256 proposalId) → void
```

---

## Deployment Guide

### Prerequisites

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Hedera private key
```

### Compilation

```bash
# Compile contracts
npx hardhat compile

# Expected output:
# ✓ ImpactToken compiled
# ✓ ReputationNFT compiled
# ✓ FarmingProject compiled
# ✓ OpportunityContract compiled
# ✓ StakingPool compiled
# ✓ Governance compiled
```

### Deployment

```bash
# Deploy all contracts
npm run deploy

# This script:
# 1. Deploys ImpactToken
# 2. Deploys ReputationNFT
# 3. Deploys FarmingProject (links token & NFT)
# 4. Deploys OpportunityContract (links token & NFT)
# 5. Deploys StakingPool (links token)
# 6. Deploys Governance (links token & staking)
# 7. Authorizes minters
# 8. Funds staking pool
# 9. Saves addresses to deployment.json
# 10. Copies ABIs to frontend
```

### Post-Deployment

```bash
# Copy addresses to frontend
npm run copy-contracts

# Start frontend
cd impact-africa-frontend
npm run dev
```

### Verify Deployment

```bash
# Check deployed contracts
npx hardhat run scripts/verify-deployment.js --network hedera_testnet

# Should output:
# ✓ ImpactToken deployed at: 0x...
# ✓ ReputationNFT deployed at: 0x...
# ✓ FarmingProject deployed at: 0x...
# ✓ OpportunityContract deployed at: 0x...
# ✓ StakingPool deployed at: 0x...
# ✓ Governance deployed at: 0x...
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/ImpactToken.test.js

# With coverage
npx hardhat coverage
```

### Test Structure

```javascript
describe("ImpactToken", function () {
  beforeEach(async function () {
    // Setup
  });

  it("Should deploy with correct initial supply", async function () {
    // Test
  });

  it("Should allow faucet claims", async function () {
    // Test
  });
});
```

### Frontend Testing

```bash
# Run frontend tests (if implemented)
cd impact-africa-frontend
npm run test
```

---

## Security Considerations

### Smart Contract Security

1. **ReentrancyGuard**: All state-changing functions protected
2. **Access Control**: Only authorized addresses can mint/update
3. **Input Validation**: All inputs validated before processing
4. **Integer Overflow**: Using Solidity 0.8.20 (built-in protection)
5. **Pull Payment Pattern**: Users claim rewards (not pushed)

### Frontend Security

1. **Environment Variables**: Sensitive data in .env (not committed)
2. **Input Sanitization**: User inputs sanitized before blockchain calls
3. **HTTPS**: All API calls use HTTPS
4. **MetaMask Signature**: All transactions require user approval

### Best Practices

```solidity
// ✅ Good: Use pull payments
function claimRewards() external {
    uint256 reward = calculateReward(msg.sender);
    rewards[msg.sender] = 0;
    token.transfer(msg.sender, reward);
}

// ❌ Bad: Push payments in loop
function distributeRewards(address[] users) external {
    for (uint i = 0; i < users.length; i++) {
        token.transfer(users[i], rewards[users[i]]);
    }
}
```

---

## Troubleshooting

### Common Issues

#### 1. "MetaMask not installed"
**Solution**: Install MetaMask browser extension

#### 2. "Wrong network"
**Solution**:
- Click "Switch Network" in the error message
- Or manually add Hedera Testnet to MetaMask

#### 3. "Insufficient funds"
**Solution**:
- Get testnet HBAR from [Hedera Faucet](https://portal.hedera.com)
- Claim IAT tokens from the faucet in the app

#### 4. "Transaction failed: execution reverted"
**Possible causes**:
- Not enough tokens approved
- Trying to claim faucet before cooldown
- Already submitted proof for opportunity
- Project not fully funded

**Solution**: Check error message for specific reason

#### 5. "IPFS upload failed"
**Solution**:
- Check Pinata API keys in .env
- Verify file size < 10MB
- Check internet connection

#### 6. "AI models not loading"
**Solution**:
- Wait for models to download (first load takes time)
- Check browser console for errors
- Clear browser cache and reload

#### 7. "Location not detected"
**Solution**:
- Enable location services in browser
- Grant location permission to the website
- Manually enter coordinates if needed

### Debug Mode

Enable debug logging:

```typescript
// In web3Provider.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Transaction:', tx);
  console.log('Receipt:', receipt);
}
```

### Getting Help

1. Check browser console for errors
2. Review transaction on [HashScan](https://hashscan.io/testnet)
3. Verify contract addresses in `addresses.json`
4. Check network connection to Hedera RPC
5. Open GitHub issue with:
   - Error message
   - Steps to reproduce
   - Browser & MetaMask version

---

## Appendix

### Environment Variables Reference

**Root `.env`:**
```env
PRIVATE_KEY=your_hedera_private_key_without_0x_prefix
```

**Frontend `.env`:**
```env
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_api_key
VITE_PINATA_JWT=your_pinata_jwt_token

# Optional: Override contract addresses
VITE_IMPACT_TOKEN_ADDRESS=0x...
VITE_REPUTATION_NFT_ADDRESS=0x...
VITE_FARMING_PROJECT_ADDRESS=0x...
VITE_OPPORTUNITY_CONTRACT_ADDRESS=0x...
VITE_STAKING_POOL_ADDRESS=0x...
VITE_GOVERNANCE_ADDRESS=0x...
```

### Useful Links

- **Hedera Portal**: https://portal.hedera.com
- **HashScan Explorer**: https://hashscan.io/testnet
- **Hedera Docs**: https://docs.hedera.com
- **Pinata**: https://pinata.cloud
- **TensorFlow.js**: https://www.tensorflow.org/js

### Gas Optimization Tips

1. **Batch operations** when possible
2. **Use events** instead of storing data on-chain
3. **Pack struct variables** efficiently
4. **Use uint256** instead of smaller uints (paradoxically cheaper)
5. **Minimize storage writes** (most expensive operation)

### Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Multi-chain deployment (Polygon, BSC)
- [ ] Advanced AI models (custom trained)
- [ ] Real-time chat for farmers/NGOs
- [ ] Marketplace for farming equipment
- [ ] Insurance for farming projects
- [ ] Cross-chain bridging
- [ ] Layer 2 scaling solution

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Maintainers**: Impact Africa Team
