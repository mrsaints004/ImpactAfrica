import { useState, useEffect } from 'react';
import { Sprout, Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { web3Provider } from '../utils/web3Provider';
import { ipfsService } from '../utils/ipfs';
import { ethers } from 'ethers';
import { showToast } from '../utils/toast';

interface FarmerDashboardProps {
  account: string | null;
}

interface Project {
  id: number;
  farmer: string;
  title: string;
  description: string;
  ipfsDocumentation: string;
  fundingGoal: bigint;
  totalPledged: bigint;
  harvestPeriod: bigint;
  returnPercentage: bigint;
  createdAt: bigint;
  fundedAt: bigint;
  harvestStartDate: bigint;
  status: number;
  farmerWithdrawn: boolean;
}

export default function FarmerDashboard({ account }: FarmerDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');

  
  const [title, setTitle] = useState('Organic Rice Farming Project');
  const [description, setDescription] = useState('Community-supported organic rice farming in rural Nigeria. We will use sustainable farming practices to grow high-quality rice for local markets.');
  const [fundingGoal, setFundingGoal] = useState('500');
  const [harvestPeriod, setHarvestPeriod] = useState('120');
  const [returnPercentage, setReturnPercentage] = useState('125');
  const [documentationFile, setDocumentationFile] = useState<File | null>(null);

  useEffect(() => {
    if (account) {
      loadProjects();
      loadTokenBalance();
    }
  }, [account]);

  const loadTokenBalance = async () => {
    try {
      const token = web3Provider.getImpactToken();
      if (!token || !account) return;

      const balance = await token.balanceOf(account);
      setTokenBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const farmingContract = web3Provider.getFarmingProject();
      if (!farmingContract || !account) return;

      const projectIds = await farmingContract.getProjectsByFarmer(account);
      console.log('📋 Project IDs for farmer:', projectIds);
      const projectsData: Project[] = [];

      for (const id of projectIds) {
        const project = await farmingContract.projects(id);
        console.log(`📊 Raw project data for ID ${id}:`, project);

        projectsData.push({
          id: Number(id),
          farmer: project.farmer || project[0],
          title: project.title || project[1],
          description: project.description || project[2],
          ipfsDocumentation: project.ipfsDocumentation || project[3],
          fundingGoal: project.fundingGoal || project[4],
          totalPledged: project.totalPledged || project[5],
          harvestPeriod: project.harvestPeriod || project[6],
          returnPercentage: project.returnPercentage || project[7],
          createdAt: project.createdAt || project[8],
          fundedAt: project.fundedAt || project[9],
          harvestStartDate: project.harvestStartDate || project[10],
          status: Number(project.status !== undefined ? project.status : project[11]),
          farmerWithdrawn: project.farmerWithdrawn !== undefined ? project.farmerWithdrawn : project[12]
        });
      }

      console.log('✅ Processed projects:', projectsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimFaucet = async () => {
    try {
      setLoading(true);
      const token = web3Provider.getImpactToken();
      if (!token) throw new Error('Token contract not initialized');

      const tx = await token.claimFaucet();
      await tx.wait();

      showToast.success('Successfully claimed 10,000 tokens!');
      await loadTokenBalance();
    } catch (error: any) {
      console.error('Error claiming faucet:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      if (!title || !description || !fundingGoal || !harvestPeriod || !returnPercentage) {
        showToast.error('Please fill all fields');
        return;
      }

      setLoading(true);

      
      let ipfsHash = '';
      if (documentationFile) {
        ipfsHash = await ipfsService.uploadFile(documentationFile);
      }

      const farmingContract = web3Provider.getFarmingProject();
      if (!farmingContract) throw new Error('Contract not initialized');

      const fundingGoalWei = ethers.parseEther(fundingGoal);
      const returnPct = parseInt(returnPercentage);

      const tx = await farmingContract.createProject(
        title,
        description,
        ipfsHash,
        fundingGoalWei,
        parseInt(harvestPeriod),
        returnPct
      );

      await tx.wait();

      showToast.success('Project created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadProjects();
    } catch (error: any) {
      console.error('Error creating project:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const withdrawFunds = async (projectId: number) => {
    try {
      setLoading(true);
      const farmingContract = web3Provider.getFarmingProject();
      if (!farmingContract) throw new Error('Contract not initialized');

      const tx = await farmingContract.withdrawFunds(projectId);
      await tx.wait();

      showToast.success('Funds withdrawn successfully!');
      await loadProjects();
    } catch (error: any) {
      console.error('Error withdrawing funds:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reportHarvest = async (projectId: number, success: boolean) => {
    try {
      setLoading(true);
      const farmingContract = web3Provider.getFarmingProject();
      const token = web3Provider.getImpactToken();
      if (!farmingContract || !token) throw new Error('Contract not initialized');

      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');

      if (success) {
        
        const totalReturns = (project.totalPledged * project.returnPercentage) / 100n;

        
        const approveTx = await token.approve(await farmingContract.getAddress(), totalReturns);
        await approveTx.wait();
      }

      const tx = await farmingContract.reportHarvest(projectId, success);
      await tx.wait();

      showToast.success(`Harvest reported as ${success ? 'successful' : 'failed'}!`);
      await loadProjects();
    } catch (error: any) {
      console.error('Error reporting harvest:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('Organic Rice Farming Project');
    setDescription('Community-supported organic rice farming in rural Nigeria. We will use sustainable farming practices to grow high-quality rice for local markets.');
    setFundingGoal('500');
    setHarvestPeriod('120');
    setReturnPercentage('125');
    setDocumentationFile(null);
  };

  const getStatusBadge = (status: number) => {
    const statuses = ['Active', 'Funded', 'Harvest Period', 'Completed', 'Failed'];
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-primary-100 text-primary-800', 'bg-red-100 text-red-800'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
        {statuses[status]}
      </span>
    );
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-xl text-yellow-800">Please connect your wallet to access the Farmer Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Farmer Dashboard</h1>
          <p className="text-gray-600">Manage your farming projects and receive community support</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition"
        >
          <Plus className="h-5 w-5" />
          <span>Create Project</span>
        </button>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Your IAT Balance</p>
              <p className="text-3xl font-bold text-primary-600">{parseFloat(tokenBalance).toFixed(2)} IAT</p>
            </div>
            <DollarSign className="h-12 w-12 text-primary-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-africa-500 to-africa-600 rounded-xl shadow-md p-6 text-white">
          <p className="mb-4">Need tokens to get started?</p>
          <button
            onClick={claimFaucet}
            disabled={loading}
            className="w-full px-4 py-2 bg-white text-africa-600 rounded-lg font-medium hover:bg-africa-50 transition disabled:opacity-50"
          >
            {loading ? 'Claiming...' : 'Claim 10,000 IAT from Faucet'}
          </button>
        </div>
      </div>

      
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Projects</h2>

        {loading && projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Sprout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">No projects yet</p>
            <p className="text-gray-500 mb-6">Create your first farming project to start receiving community support</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Funding Goal</p>
                    <p className="text-lg font-semibold text-gray-900">{project.fundingGoal ? ethers.formatEther(project.fundingGoal) : '0'} IAT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Pledged</p>
                    <p className="text-lg font-semibold text-primary-600">{project.totalPledged ? ethers.formatEther(project.totalPledged) : '0'} IAT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Return Rate</p>
                    <p className="text-lg font-semibold text-africa-600">{project.returnPercentage?.toString() || '0'}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Harvest Period</p>
                    <p className="text-lg font-semibold text-gray-900">{project.harvestPeriod ? (Number(project.harvestPeriod) / 86400).toFixed(0) : '0'} days</p>
                  </div>
                </div>

                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Funding Progress</span>
                    <span>{project.fundingGoal && project.totalPledged ? ((Number(project.totalPledged) / Number(project.fundingGoal)) * 100).toFixed(1) : '0'}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary-600 to-africa-600 h-3 rounded-full transition-all"
                      style={{ width: `${project.fundingGoal && project.totalPledged ? Math.min((Number(project.totalPledged) / Number(project.fundingGoal)) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                
                <div className="flex gap-3">
                  {project.status === 1 && !project.farmerWithdrawn && (
                    <button
                      onClick={() => withdrawFunds(project.id)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      Withdraw Funds
                    </button>
                  )}

                  {project.status === 2 && Number(project.harvestStartDate) + Number(project.harvestPeriod) <= Date.now() / 1000 && (
                    <>
                      <button
                        onClick={() => reportHarvest(project.id, true)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Report Success</span>
                      </button>
                      <button
                        onClick={() => reportHarvest(project.id, false)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Report Failure</span>
                      </button>
                    </>
                  )}

                  {project.status === 2 && Number(project.harvestStartDate) + Number(project.harvestPeriod) > Date.now() / 1000 && (
                    <div className="flex-1 flex items-center justify-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Harvest period in progress...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-3xl font-bold mb-6">Create Farming Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Organic Tomato Farm Expansion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your farming project, what you plan to grow, and how the funds will be used..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funding Goal (IAT Tokens)</label>
                <input
                  type="number"
                  value={fundingGoal}
                  onChange={(e) => setFundingGoal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                  min="100"
                />
                <p className="text-sm text-gray-500 mt-1">Minimum: 100 IAT</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harvest Period (Days)</label>
                <input
                  type="number"
                  value={harvestPeriod}
                  onChange={(e) => setHarvestPeriod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 90"
                  min="1"
                  max="365"
                />
                <p className="text-sm text-gray-500 mt-1">How many days until harvest? (Max: 365)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Return Percentage (%)</label>
                <input
                  type="number"
                  value={returnPercentage}
                  onChange={(e) => setReturnPercentage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 120"
                  min="100"
                  max="300"
                />
                <p className="text-sm text-gray-500 mt-1">What percentage will you return to pledgers? (100% = break even, 120% = 20% profit)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Documentation (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setDocumentationFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  accept="image/*,.pdf"
                />
                <p className="text-sm text-gray-500 mt-1">Upload images or documents about your project (will be stored on IPFS)</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}