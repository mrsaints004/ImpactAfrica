import { useState, useEffect } from 'react';
import { Heart, TrendingUp, Calendar, Target } from 'lucide-react';
import { web3Provider } from '../utils/web3Provider';
import { ethers } from 'ethers';
import { showToast } from '../utils/toast';

interface CommunityPledgingProps {
  account: string | null;
}

interface Project {
  id: number;
  farmer: string;
  title: string;
  description: string;
  fundingGoal: bigint;
  totalPledged: bigint;
  returnPercentage: bigint;
  harvestPeriod: bigint;
  status: number;
}

export default function CommunityPledging({ account }: CommunityPledgingProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const farmingContract = web3Provider.getFarmingProject();
      if (!farmingContract) return;

      const totalProjects = await farmingContract.getTotalProjects();
      console.log('📋 Total projects:', totalProjects);
      const projectsData: Project[] = [];

      for (let i = 1; i <= Number(totalProjects); i++) {
        const project = await farmingContract.projects(i);
        console.log(`📊 Raw project data for ID ${i}:`, project);

        const projectData = {
          id: i,
          farmer: project.farmer || project[0],
          title: project.title || project[1],
          description: project.description || project[2],
          fundingGoal: project.fundingGoal || project[4],
          totalPledged: project.totalPledged || project[5],
          harvestPeriod: project.harvestPeriod || project[6],
          returnPercentage: project.returnPercentage || project[7],
          status: Number(project.status !== undefined ? project.status : project[11])
        };

        
        if (projectData.status === 0) {
          projectsData.push(projectData);
        }
      }

      console.log('✅ Processed projects:', projectsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const pledgeToProject = async (projectId: number) => {
    try {
      if (!account) {
        showToast.error('Please connect your wallet');
        return;
      }

      const amount = pledgeAmount[projectId];
      if (!amount || parseFloat(amount) <= 0) {
        showToast.error('Please enter a valid pledge amount');
        return;
      }

      setLoading(true);
      const token = web3Provider.getImpactToken();
      const farmingContract = web3Provider.getFarmingProject();
      if (!token || !farmingContract) throw new Error('Contracts not initialized');

      const amountWei = ethers.parseEther(amount);

      
      const approveTx = await token.approve(await farmingContract.getAddress(), amountWei);
      await approveTx.wait();

      
      const pledgeTx = await farmingContract.pledgeToProject(projectId, amountWei);
      await pledgeTx.wait();

      showToast.success('Pledge successful!');
      setPledgeAmount({ ...pledgeAmount, [projectId]: '' });
      await loadProjects();
    } catch (error: any) {
      console.error('Error pledging:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-xl text-yellow-800">Please connect your wallet to support farmers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Pledging</h1>
        <p className="text-gray-600">Support farmers and earn returns after successful harvests</p>
      </div>

      {loading && projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">No active projects at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-3">{project.description}</p>
                  <p className="text-sm text-gray-500">Farmer: {project.farmer.slice(0, 10)}...</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">Goal</p>
                    <p className="font-semibold">{project.fundingGoal ? ethers.formatEther(project.fundingGoal) : '0'} IAT</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-africa-600" />
                  <div>
                    <p className="text-sm text-gray-600">Pledged</p>
                    <p className="font-semibold text-africa-600">{project.totalPledged ? ethers.formatEther(project.totalPledged) : '0'} IAT</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Returns</p>
                    <p className="font-semibold text-green-600">{project.returnPercentage?.toString() || '0'}%</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Period</p>
                    <p className="font-semibold">{project.harvestPeriod ? (Number(project.harvestPeriod) / 86400).toFixed(0) : '0'} days</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{project.fundingGoal && project.totalPledged ? ((Number(project.totalPledged) / Number(project.fundingGoal)) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary-600 to-africa-600 h-3 rounded-full"
                    style={{ width: `${project.fundingGoal && project.totalPledged ? Math.min((Number(project.totalPledged) / Number(project.fundingGoal)) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="number"
                  value={pledgeAmount[project.id] || ''}
                  onChange={(e) => setPledgeAmount({ ...pledgeAmount, [project.id]: e.target.value })}
                  placeholder="Amount to pledge"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={() => pledgeToProject(project.id)}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Pledging...' : 'Pledge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}