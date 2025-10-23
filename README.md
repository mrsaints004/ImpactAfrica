# 🌍 Impact Africa

> Decentralized social impact platform on Hedera rewarding community volunteers and supporting African farmers with blockchain-verified contributions.

A comprehensive blockchain platform built on **Hedera EVM** that empowers African farmers through community funding and facilitates NGO volunteer programs with AI-powered proof verification and on-chain reputation tracking.

## 🌟 Features

### For Farmers
- **Create Farming Projects**: Post your farming needs with funding goals and harvest timelines
- **Receive Community Pledges**: Get token pledges from community members
- **Share Harvest Returns**: Reward your supporters with profits after successful harvests
- **Build On-Chain Reputation**: Earn reputation NFTs for completed projects

### For Community Members
- **Browse Farming Projects**: Discover farming initiatives across Africa
- **Pledge Tokens**: Support farmers financially with IAT tokens
- **Earn Returns**: Receive profits when harvests are successful
- **Track Impact**: Monitor your contributions and returns

### For NGOs
- **Create Opportunities**: Post volunteer opportunities with GPS verification
- **Verify Submissions**: Review photo proofs from volunteers
- **Reward Volunteers**: Distribute tokens and reputation NFTs
- **Manage Programs**: Track engagement and impact metrics

### For Volunteers (Impacters)
- **Find Opportunities**: Browse NGO volunteer opportunities by category
- **AI Proof Verification**: Upload photos analyzed by TensorFlow.js for automatic pre-verification
- **Submit Proof**: Upload photos with GPS verification and AI confidence scoring
- **Earn Rewards**: Receive IAT tokens for verified work
- **Build Reputation**: Accumulate impact scores

### Governance & Staking
- **Stake Tokens**: Earn passive rewards (10% APY)
- **Vote on Proposals**: Participate in platform governance
- **Create Proposals**: Suggest platform improvements
- **Earn Voting Power**: Staked tokens = voting power

### Leaderboard
- **Track Top Contributors**: See who's making the biggest impact
- **Impact Scores**: Gamified reputation system
- **Filter by Category**: View farmers, volunteers, or all contributors

## 🏗️ Architecture

### Smart Contracts (Solidity 0.8.20)

1. **ImpactToken.sol**: ERC20 token with faucet functionality
2. **ReputationNFT.sol**: Soulbound NFT representing user reputation
3. **FarmingProject.sol**: Community pledging system for farmers
4. **OpportunityContract.sol**: NGO volunteer opportunities
5. **StakingPool.sol**: Token staking with rewards
6. **Governance.sol**: Decentralized voting system

### Frontend (React + TypeScript + Vite)

- **Modern UI**: TailwindCSS with custom animations and gradients
- **Web3 Integration**: MetaMask connection for Hedera EVM with auto-network switching
- **IPFS Storage**: Decentralized file storage via Pinata
- **AI Verification**: TensorFlow.js COCO-SSD and MobileNet for image analysis
- **Real-time Updates**: Auto-refresh blockchain data
- **Responsive Design**: Mobile-first approach
- **Smart Toasts**: User-friendly error messages with transaction feedback

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MetaMask wallet
- Hedera testnet HBAR (for gas fees)
- Pinata account (for IPFS)

### Installation

1. **Clone the repository**
   ```bash
   cd ImpactAfrica
   ```

2. **Install contract dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd impact-africa-frontend
   npm install
   ```

### Configuration

1. **Configure Hedera Network**

   Create `.env` in root directory:
   ```env
   PRIVATE_KEY=your_hedera_account_private_key
   ```

2. **Configure Frontend**

   Create `.env` in `impact-africa-frontend/`:
   ```env
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_SECRET_KEY=your_pinata_secret_key
   VITE_PINATA_JWT=your_pinata_jwt
   ```

3. **Add Hedera Testnet to MetaMask**
   - Network Name: `Hedera Testnet`
   - RPC URL: `https://testnet.hashio.io/api`
   - Chain ID: `296`
   - Currency Symbol: `HBAR`
   - Block Explorer: `https://hashscan.io/testnet`

### Compilation

Compile smart contracts:
```bash
npx hardhat compile
```

### Deployment

Deploy to Hedera Testnet:
```bash
npm run deploy
```

This will:
- Deploy all 6 smart contracts
- Configure contract authorizations
- Fund the staking pool
- Copy ABIs to frontend
- Save deployment addresses

### Running the Frontend

Start the development server:
```bash
cd impact-africa-frontend
npm run dev
```

Access at: `http://localhost:5173`

## 📖 Usage Guide

### For Farmers

1. **Connect Wallet**: Click "Connect Wallet" and select MetaMask
2. **Claim Tokens**: Go to Farmer Dashboard → Click "Claim from Faucet"
3. **Create Project**:
   - Click "Create Project"
   - Fill in project details (title, description, funding goal)
   - Set harvest period (days) and return percentage
   - Upload project documentation (optional)
   - Submit
4. **Withdraw Funds**: Once fully funded, click "Withdraw Funds"
5. **Report Harvest**: After harvest period, report success/failure

### For Community Members

1. **Connect Wallet & Claim Tokens**
2. **Browse Projects**: Go to "Community" tab
3. **Pledge Tokens**:
   - Enter amount to pledge
   - Click "Pledge"
   - Confirm transaction
4. **Claim Returns**: After successful harvest, claim your returns

### For NGOs

1. **Connect Wallet & Claim Tokens**
2. **Create Opportunity**:
   - Select category
   - Set title, description, proof requirements
   - Add GPS coordinates and radius
   - Set reward amount and max volunteers
   - Submit (requires stake: 100 IAT + rewards)
3. **Verify Submissions**:
   - View pending submissions
   - Review photo proof and GPS data
   - Approve or reject

### For Volunteers

1. **Connect Wallet**
2. **Browse Opportunities**: Filter by category
3. **Submit Proof**:
   - Must be within location radius
   - Upload photo proof
   - GPS auto-detected
   - Submit
4. **Track Status**: View submission status in dashboard

### Staking

1. **Go to Staking Page**
2. **Enter amount to stake**
3. **Click "Stake Tokens"**
4. **Earn 10% APY automatically**
5. **Claim rewards anytime**
6. **Unstake with instant withdrawal**

### Governance

1. **Stake tokens first (min 100 IAT to create proposals)**
2. **View active proposals**
3. **Vote For/Against/Abstain**
4. **Create new proposals**
5. **Finalize after 3-day voting period**
6. **Execute passed proposals**

## 🔧 Contract Addresses

After deployment, contract addresses are saved in:
- `deployment.json` (root)
- `impact-africa-frontend/src/contracts/addresses.json`

## 🎨 UI Features

- **Modern Design**: Clean, professional interface
- **Responsive**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Data refreshes every 10 seconds
- **Loading States**: Clear feedback during transactions
- **Error Handling**: User-friendly error messages
- **Animations**: Smooth transitions and effects

## 🔐 Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Role-based permissions
- **Input Validation**: All inputs validated on-chain
- **Soulbound NFTs**: Non-transferable reputation tokens
- **GPS Verification**: Location-based proof validation
- **Stake Requirements**: Anti-spam mechanism

## 🌍 Impact Metrics

Track your contribution:
- **Impact Score**: Gamified reputation points
- **Projects Supported**: Number of farming projects pledged to
- **Opportunities Completed**: Verified volunteer work
- **Total Pledged**: IAT tokens pledged to farmers
- **Total Earned**: Returns from harvests + volunteer rewards

## 📝 Testing

Run contract tests:
```bash
npx hardhat test
```

## 🛠️ Built With

- **Blockchain**: Hedera EVM (Testnet: Chain ID 296)
- **Smart Contracts**: Solidity 0.8.20
- **Development**: Hardhat
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS
- **Web3**: ethers.js v6
- **Storage**: IPFS (Pinata)
- **AI/ML**: TensorFlow.js, COCO-SSD, MobileNet
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📚 Smart Contract Functions

### ImpactToken
- `claimFaucet()`: Claim 10,000 IAT (1-hour cooldown)
- `transfer()`: Transfer tokens
- `approve()`: Approve spending
- `balanceOf()`: Check balance

### FarmingProject
- `createProject()`: Create farming project
- `pledgeToProject()`: Pledge tokens
- `withdrawFunds()`: Farmer withdraws funded amount
- `reportHarvest()`: Report harvest outcome
- `claimReturns()`: Pledgers claim returns

### OpportunityContract
- `createOpportunity()`: NGO creates opportunity
- `submitProof()`: Volunteer submits proof with GPS data
- `submitProofWithAI()`: Submit proof with AI verification data
- `verifySubmission()`: NGO verifies submission
- `cancelOpportunity()`: NGO cancels opportunity
- `getActiveOpportunities()`: Get all active opportunities
- `getPendingSubmissions()`: Get pending submissions for opportunity

### StakingPool
- `stake()`: Stake tokens
- `unstake()`: Unstake tokens
- `claimRewards()`: Claim accumulated rewards
- `calculatePendingRewards()`: View pending rewards

### Governance
- `createProposal()`: Create governance proposal
- `vote()`: Cast vote (For/Against/Abstain)
- `finalizeProposal()`: Finalize after voting period
- `executeProposal()`: Execute passed proposals

### ReputationNFT
- `mintReputation()`: Mint reputation NFT
- `updateImpactScore()`: Increase impact score
- `getReputation()`: View reputation data

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with more blockchains
- [ ] Partnership with African NGOs
- [ ] Fiat on-ramp integration

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review smart contract code

## 🌟 Acknowledgments

- Hedera Team for EVM support
- OpenZeppelin for secure contract libraries
- African farmers and NGOs for inspiration

---

**Built with ❤️ for African communities**

**Powered by Hedera EVM | Secured by Blockchain | Driven by Community**
