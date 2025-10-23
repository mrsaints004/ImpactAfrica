const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to Hedera EVM...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "HBAR\n");

  // Deploy Impact Token
  console.log("📝 Deploying ImpactToken...");
  const ImpactToken = await hre.ethers.getContractFactory("ImpactToken");
  const impactToken = await ImpactToken.deploy();
  await impactToken.waitForDeployment();
  const impactTokenAddress = await impactToken.getAddress();
  console.log("✅ ImpactToken deployed to:", impactTokenAddress, "\n");

  // Deploy Reputation NFT
  console.log("📝 Deploying ReputationNFT...");
  const ReputationNFT = await hre.ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  const reputationNFTAddress = await reputationNFT.getAddress();
  console.log("✅ ReputationNFT deployed to:", reputationNFTAddress, "\n");

  // Deploy Staking Pool
  console.log("📝 Deploying StakingPool...");
  const StakingPool = await hre.ethers.getContractFactory("StakingPool");
  const stakingPool = await StakingPool.deploy(impactTokenAddress);
  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();
  console.log("✅ StakingPool deployed to:", stakingPoolAddress, "\n");

  // Deploy Governance
  console.log("📝 Deploying Governance...");
  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(stakingPoolAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("✅ Governance deployed to:", governanceAddress, "\n");

  // Deploy Farming Project
  console.log("📝 Deploying FarmingProject...");
  const FarmingProject = await hre.ethers.getContractFactory("FarmingProject");
  const farmingProject = await FarmingProject.deploy(impactTokenAddress, reputationNFTAddress);
  await farmingProject.waitForDeployment();
  const farmingProjectAddress = await farmingProject.getAddress();
  console.log("✅ FarmingProject deployed to:", farmingProjectAddress, "\n");

  // Deploy Opportunity Contract
  console.log("📝 Deploying OpportunityContract...");
  const OpportunityContract = await hre.ethers.getContractFactory("OpportunityContract");
  const opportunityContract = await OpportunityContract.deploy(impactTokenAddress, reputationNFTAddress);
  await opportunityContract.waitForDeployment();
  const opportunityContractAddress = await opportunityContract.getAddress();
  console.log("✅ OpportunityContract deployed to:", opportunityContractAddress, "\n");

  // Authorize contracts to update reputation
  console.log("🔐 Authorizing contracts to update Reputation NFT...");
  await reputationNFT.authorizeContract(farmingProjectAddress, true);
  console.log("✅ FarmingProject authorized");
  await reputationNFT.authorizeContract(opportunityContractAddress, true);
  console.log("✅ OpportunityContract authorized\n");

  // Fund staking pool with tokens for rewards
  console.log("💰 Funding StakingPool with tokens...");
  const fundAmount = hre.ethers.parseEther("100000"); // 100,000 tokens for rewards
  await impactToken.transfer(stakingPoolAddress, fundAmount);
  console.log("✅ StakingPool funded with", hre.ethers.formatEther(fundAmount), "tokens\n");

  // Save deployment addresses
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ImpactToken: impactTokenAddress,
      ReputationNFT: reputationNFTAddress,
      StakingPool: stakingPoolAddress,
      Governance: governanceAddress,
      FarmingProject: farmingProjectAddress,
      OpportunityContract: opportunityContractAddress,
    },
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to deployment.json\n");

  // Save ABI files for frontend
  const frontendPath = path.join(__dirname, "..", "impact-africa-frontend", "src", "contracts");
  if (!fs.existsSync(frontendPath)) {
    fs.mkdirSync(frontendPath, { recursive: true });
  }

  const contracts = [
    "ImpactToken",
    "ReputationNFT",
    "StakingPool",
    "Governance",
    "FarmingProject",
    "OpportunityContract",
  ];

  console.log("📋 Copying ABIs to frontend...");
  for (const contractName of contracts) {
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(
        path.join(frontendPath, `${contractName}.json`),
        JSON.stringify({ abi: artifact.abi }, null, 2)
      );
    }
  }

  // Copy deployment addresses
  fs.writeFileSync(
    path.join(frontendPath, "addresses.json"),
    JSON.stringify(deploymentInfo.contracts, null, 2)
  );
  console.log("✅ ABIs and addresses copied to frontend\n");

  console.log("🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("=======================");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  console.log("\n⚠️  Save these addresses in your .env file!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
