import { useState, useEffect } from 'react';
import { Award, Plus, MapPin, Camera, CheckCircle, XCircle, Clock, Eye, Users, Brain, AlertCircle } from 'lucide-react';
import { web3Provider } from '../utils/web3Provider';
import { ipfsService } from '../utils/ipfs';
import { opportunityContract } from '../utils/opportunityContract';
import { ethers } from 'ethers';
import { showToast } from '../utils/toast';

interface NGODashboardProps {
  account: string | null;
}

interface Opportunity {
  id: number;
  ngo: string;
  category: number;
  title: string;
  description: string;
  proofRequirements: string;
  latitude: bigint;
  longitude: bigint;
  radius: bigint;
  rewardAmount: bigint;
  maxImpacters: bigint;
  currentImpacters: bigint;
  stakeAmount: bigint;
  createdAt: bigint;
  active: boolean;
}

interface Submission {
  id: number;
  opportunityId: number;
  impacter: string;
  ipfsProofHash: string;
  latitude: bigint;
  longitude: bigint;
  submittedAt: bigint;
  status: number;
  aiVerified?: boolean;
  aiConfidence?: number;
  needsManualReview?: boolean;
}

export default function NGODashboard({ account }: NGODashboardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [submissions, setSubmissions] = useState<{ [key: number]: Submission[] }>({});
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');

  
  const [category, setCategory] = useState('0');
  const [title, setTitle] = useState('Beach Cleanup - Lagos Coast');
  const [description, setDescription] = useState('Help clean up plastic waste and debris from our beautiful Lagos beaches. Make an impact on ocean health and marine life.');
  const [proofRequirements, setProofRequirements] = useState('Photo of collected waste with GPS location and timestamp');
  const [latitude, setLatitude] = useState('6450000');
  const [longitude, setLongitude] = useState('3400000');
  const [radius, setRadius] = useState('5000');
  const [rewardAmount, setRewardAmount] = useState('50');
  const [maxImpacters, setMaxImpacters] = useState('10');

  const categories = ['Environmental', 'Education', 'Healthcare', 'Community Service', 'Agriculture', 'Other'];

  useEffect(() => {
    if (account) {
      loadOpportunities();
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

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const opportunityContract = web3Provider.getOpportunityContract();
      if (!opportunityContract || !account) return;

      const opportunityIds = await opportunityContract.getOpportunitiesByNGO(account);
      console.log('📋 Opportunity IDs for NGO:', opportunityIds);
      const opportunitiesData: Opportunity[] = [];

      for (const id of opportunityIds) {
        const opp = await opportunityContract.opportunities(id);
        console.log(`📊 Raw opportunity data for ID ${id}:`, opp);
        console.log(`🔍 maxImpacters raw value:`, opp.maxImpacters || opp[9]);
        console.log(`🔍 maxImpacters type:`, typeof (opp.maxImpacters || opp[9]));
        console.log(`🔍 maxImpacters toString:`, (opp.maxImpacters || opp[9])?.toString());

        const maxImpactersRaw = opp.maxImpacters || opp[9];

        opportunitiesData.push({
          id: Number(id),
          ngo: opp.ngo || opp[1],
          category: Number(opp.category !== undefined ? opp.category : opp[2]),
          title: opp.title || opp[3],
          description: opp.description || opp[4],
          proofRequirements: opp.proofRequirements || opp[5],
          latitude: opp.latitude || opp[6],
          longitude: opp.longitude || opp[7],
          radius: opp.radius || opp[8],
          rewardAmount: opp.rewardAmount || opp[9],
          maxImpacters: opp.maxVolunteers || opp[10],
          currentImpacters: opp.currentVolunteers || opp[11],
          stakeAmount: opp.stakeAmount || opp[12],
          createdAt: opp.createdAt || opp[13],
          active: opp.active !== undefined ? opp.active : opp[14]
        });

        
        await loadSubmissionsForOpportunity(Number(id));
      }

      console.log('✅ Processed opportunities:', opportunitiesData);
      setOpportunities(opportunitiesData);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionsForOpportunity = async (opportunityId: number) => {
    try {
      const opportunityContract = web3Provider.getOpportunityContract();
      if (!opportunityContract) return;

      const pendingSubmissionIds = await opportunityContract.getPendingSubmissions(opportunityId);
      console.log(`📋 Pending submission IDs for opportunity ${opportunityId}:`, pendingSubmissionIds);
      const submissionsData: Submission[] = [];

      for (const subId of pendingSubmissionIds) {
        const sub = await opportunityContract.submissions(subId);
        console.log(`📊 Raw submission data for ID ${subId}:`, sub);

        submissionsData.push({
          id: Number(subId),
          opportunityId: Number(sub.opportunityId !== undefined ? sub.opportunityId : sub[1]),
          impacter: sub.volunteer || sub[2],
          ipfsProofHash: sub.ipfsProofHash || sub[3],
          latitude: sub.latitude || sub[4],
          longitude: sub.longitude || sub[5],
          submittedAt: sub.submittedAt || sub[6],
          status: Number(sub.status !== undefined ? sub.status : sub[7]),
          aiVerified: sub.aiVerified !== undefined ? sub.aiVerified : sub[8],
          aiConfidence: sub.aiConfidence !== undefined ? Number(sub.aiConfidence) : (sub[9] !== undefined ? Number(sub[9]) : 0),
          needsManualReview: sub.needsManualReview !== undefined ? sub.needsManualReview : sub[10]
        });
      }

      console.log(`✅ Processed submissions for opportunity ${opportunityId}:`, submissionsData);
      setSubmissions(prev => ({ ...prev, [opportunityId]: submissionsData }));
    } catch (error) {
      console.error('Error loading submissions:', error);
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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude((position.coords.latitude * 1e6).toFixed(0));
          setLongitude((position.coords.longitude * 1e6).toFixed(0));
          showToast.success('Location detected successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          showToast.success('Could not get your location. Please enter manually.');
        }
      );
    } else {
      showToast.success('Geolocation is not supported by this browser');
    }
  };

  const createOpportunity = async () => {
    try {
      if (!title || !description || !proofRequirements || !latitude || !longitude || !radius || !rewardAmount || !maxImpacters) {
        showToast.error('Please fill all fields');
        return;
      }

      setLoading(true);

      const token = web3Provider.getImpactToken();
      const opportunityContract = web3Provider.getOpportunityContract();
      if (!token || !opportunityContract) throw new Error('Contracts not initialized');

      const rewardWei = ethers.parseEther(rewardAmount);
      const maxVol = parseInt(maxImpacters);
      const totalStake = ethers.parseEther('100') + (rewardWei * BigInt(maxVol));

      console.log('🔧 Creating opportunity with:');
      console.log('   - maxImpacters input:', maxImpacters);
      console.log('   - maxVol (parsed):', maxVol);
      console.log('   - typeof maxVol:', typeof maxVol);

      
      const approveTx = await token.approve(await opportunityContract.getAddress(), totalStake);
      await approveTx.wait();

      
      const tx = await opportunityContract.createOpportunity(
        parseInt(category),
        title,
        description,
        proofRequirements,
        parseInt(latitude),
        parseInt(longitude),
        parseInt(radius),
        rewardWei,
        maxVol
      );

      console.log('✅ Opportunity creation transaction sent:', tx.hash);

      await tx.wait();

      showToast.success('Opportunity created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verifySubmission = async (submissionId: number, approved: boolean) => {
    try {
      setLoading(true);

      await opportunityContract.verifySubmission(submissionId, approved);

      showToast.success(`Submission ${approved ? 'approved' : 'rejected'} successfully!${approved ? ' Reward sent to Impacter!' : ''}`);
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error verifying submission:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOpportunity = async (opportunityId: number) => {
    try {
      if (!confirm('Are you sure you want to cancel this opportunity?')) return;

      setLoading(true);
      const opportunityContract = web3Provider.getOpportunityContract();
      if (!opportunityContract) throw new Error('Contract not initialized');

      const tx = await opportunityContract.cancelOpportunity(opportunityId);
      await tx.wait();

      showToast.success('Opportunity cancelled successfully!');
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error cancelling opportunity:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory('0');
    setTitle('Beach Cleanup - Lagos Coast');
    setDescription('Help clean up plastic waste and debris from our beautiful Lagos beaches. Make an impact on ocean health and marine life.');
    setProofRequirements('Photo of collected waste with GPS location and timestamp');
    setLatitude('6450000');
    setLongitude('3400000');
    setRadius('5000');
    setRewardAmount('50');
    setMaxImpacters('10');
  };

  const getStatusBadge = (active: boolean, current: bigint, max: bigint) => {
    if (!active) return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Inactive</span>;
    const maxNumber = Number(max);
    if (Number(current) >= maxNumber) return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Completed</span>;
    return <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Active</span>;
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-xl text-yellow-800">Please connect your wallet to access the NGO Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">NGO Dashboard</h1>
          <p className="text-gray-600">Create opportunities and manage Impacter submissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition"
        >
          <Plus className="h-5 w-5" />
          <span>Create Opportunity</span>
        </button>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Your IAT Balance</p>
              <p className="text-3xl font-bold text-primary-600">{parseFloat(tokenBalance).toFixed(2)} IAT</p>
            </div>
            <Award className="h-12 w-12 text-primary-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-africa-500 to-africa-600 rounded-xl shadow-md p-6 text-white">
          <p className="mb-4">Need tokens to create opportunities?</p>
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
        <h2 className="text-2xl font-bold mb-6">Your Opportunities</h2>

        {loading && opportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">No opportunities yet</p>
            <p className="text-gray-500 mb-6">Create your first opportunity to start engaging Impacters</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Create Your First Opportunity
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{opportunity.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {categories[opportunity.category]}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{opportunity.description}</p>
                    <p className="text-sm text-gray-500"><strong>Proof Required:</strong> {opportunity.proofRequirements}</p>
                  </div>
                  {getStatusBadge(opportunity.active, opportunity.currentImpacters, opportunity.maxImpacters)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm text-gray-600">Reward</p>
                      <p className="font-semibold">{opportunity.rewardAmount ? ethers.formatEther(opportunity.rewardAmount) : '0'} IAT</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-africa-600" />
                    <div>
                      <p className="text-sm text-gray-600">Impacters</p>
                      <p className="font-semibold">{Number(opportunity.currentImpacters || 0)}/{Number(opportunity.maxImpacters || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Radius</p>
                      <p className="font-semibold">{opportunity.radius?.toString() || '0'}m</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="font-semibold">{submissions[opportunity.id]?.length || 0}</p>
                    </div>
                  </div>
                </div>

                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Completion Progress</span>
                    <span>{opportunity.maxImpacters && opportunity.currentImpacters ? ((Number(opportunity.currentImpacters) / Number(opportunity.maxImpacters)) * 100).toFixed(0) : '0'}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary-600 to-africa-600 h-3 rounded-full transition-all"
                      style={{ width: `${opportunity.maxImpacters && opportunity.currentImpacters ? Math.min((Number(opportunity.currentImpacters) / Number(opportunity.maxImpacters)) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedOpportunity(selectedOpportunity === opportunity.id ? null : opportunity.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{selectedOpportunity === opportunity.id ? 'Hide' : 'View'} Submissions ({submissions[opportunity.id]?.length || 0})</span>
                  </button>

                  {opportunity.active && (
                    <button
                      onClick={() => cancelOpportunity(opportunity.id)}
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                
                {selectedOpportunity === opportunity.id && submissions[opportunity.id] && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-lg font-bold mb-4">Pending Submissions</h4>
                    {submissions[opportunity.id].length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No pending submissions</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions[opportunity.id].map((submission) => (
                          <div key={submission.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">Impacter: <span className="font-medium text-gray-900">{submission.impacter}</span></p>
                                <p className="text-sm text-gray-600">
                                  Submitted: {new Date(Number(submission.submittedAt) * 1000).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Location: {(Number(submission.latitude) / 1e6).toFixed(6)}, {(Number(submission.longitude) / 1e6).toFixed(6)}
                                </p>
                              </div>
                            </div>

                            
                            {submission.aiVerified !== undefined && (
                              <div className={`mb-3 border rounded-lg p-3 ${
                                submission.aiVerified
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-yellow-50 border-yellow-200'
                              }`}>
                                <div className="flex items-start">
                                  {submission.aiVerified ? (
                                    <Brain className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      submission.aiVerified ? 'text-green-900' : 'text-yellow-900'
                                    }`}>
                                      AI Verification: {submission.aiVerified ? '✓ Passed' : '⚠ Needs Review'}
                                    </p>
                                    <p className={`text-xs ${
                                      submission.aiVerified ? 'text-green-700' : 'text-yellow-700'
                                    }`}>
                                      Confidence: {submission.aiConfidence || 0}%
                                    </p>
                                    {submission.needsManualReview && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        ℹ️ Manual review recommended
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            
                            {submission.ipfsProofHash && (
                              <div className="mb-3">
                                <img
                                  src={ipfsService.getIPFSUrl(submission.ipfsProofHash)}
                                  alt="Proof"
                                  className="w-full max-w-md rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                  }}
                                />
                                <a
                                  href={ipfsService.getIPFSUrl(submission.ipfsProofHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center mt-2"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View on IPFS
                                </a>
                              </div>
                            )}

                            
                            <div className="flex gap-3">
                              <button
                                onClick={() => verifySubmission(submission.id, true)}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => verifySubmission(submission.id, false)}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 my-8">
            <h2 className="text-3xl font-bold mb-6">Create Impacter Opportunity</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={idx}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Beach Cleanup at Lagos Coast"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe the Impacter opportunity..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proof Requirements</label>
                <input
                  type="text"
                  value={proofRequirements}
                  onChange={(e) => setProofRequirements(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Photo of collected waste with GPS location"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude (×10⁶)</label>
                  <input
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 6450000 (6.45°)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude (×10⁶)</label>
                  <input
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 3400000 (3.40°)"
                  />
                </div>
              </div>

              <button
                onClick={getCurrentLocation}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>Use My Current Location</span>
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Radius (meters)</label>
                <input
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                  min="1"
                />
                <p className="text-sm text-gray-500 mt-1">Impacters must be within this radius to submit proof</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reward Per Impacter (IAT)</label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 50"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Impacters</label>
                <input
                  type="number"
                  value={maxImpacters}
                  onChange={(e) => setMaxImpacters(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 10"
                  min="1"
                />
              </div>

              {rewardAmount && maxImpacters && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Total Stake Required:</strong> {(100 + parseFloat(rewardAmount || '0') * parseInt(maxImpacters || '0')).toFixed(2)} IAT
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    (100 IAT base stake + {parseFloat(rewardAmount || '0').toFixed(2)} IAT × {maxImpacters} impacters)
                  </p>
                </div>
              )}
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
                onClick={createOpportunity}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Opportunity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}