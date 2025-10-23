import { useState, useEffect } from 'react';
import { Vote, Plus, ThumbsUp, ThumbsDown, MinusCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { web3Provider } from '../utils/web3Provider';
import { ethers } from 'ethers';
import { showToast } from '../utils/toast';

interface GovernanceProps {
  account: string | null;
}

interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  createdAt: bigint;
  votingEnds: bigint;
  status: number;
}

export default function Governance({ account }: GovernanceProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stakedAmount, setStakedAmount] = useState('0');
  const [hasVoted, setHasVoted] = useState<{ [key: number]: boolean }>({});

  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const statuses = ['Active', 'Passed', 'Defeated', 'Executed', 'Cancelled'];
  const statusColors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-red-100 text-red-800', 'bg-purple-100 text-purple-800', 'bg-gray-100 text-gray-800'];

  useEffect(() => {
    if (account) {
      loadProposals();
      loadStakedAmount();
    }
  }, [account]);

  const loadStakedAmount = async () => {
    try {
      const stakingPool = web3Provider.getStakingPool();
      if (!stakingPool || !account) return;

      const amount = await stakingPool.getStakedAmount(account);
      setStakedAmount(ethers.formatEther(amount));
    } catch (error) {
      console.error('Error loading staked amount:', error);
    }
  };

  const loadProposals = async () => {
    try {
      setLoading(true);
      const governance = web3Provider.getGovernance();
      if (!governance || !account) return;

      const totalProposals = await governance.getTotalProposals();
      const proposalsData: Proposal[] = [];

      for (let i = 1; i <= Number(totalProposals); i++) {
        const proposal = await governance.getProposal(i);
        proposalsData.push({
          id: i,
          proposer: proposal[1],
          title: proposal[2],
          description: proposal[3],
          forVotes: proposal[4],
          againstVotes: proposal[5],
          abstainVotes: proposal[6],
          createdAt: proposal[7],
          votingEnds: proposal[8],
          status: proposal[9]
        });

        
        const voted = await governance.hasVoted(i, account);
        setHasVoted(prev => ({ ...prev, [i]: voted }));
      }

      
      proposalsData.sort((a, b) => b.id - a.id);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async () => {
    try {
      if (!title || !description) {
        showToast.error('Please fill all fields');
        return;
      }

      setLoading(true);

      const governance = web3Provider.getGovernance();
      if (!governance) throw new Error('Governance contract not initialized');

      const tx = await governance.createProposal(title, description);
      await tx.wait();

      showToast.success('Proposal created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadProposals();
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (proposalId: number, voteType: number) => {
    try {
      setLoading(true);

      const governance = web3Provider.getGovernance();
      if (!governance) throw new Error('Governance contract not initialized');

      const tx = await governance.vote(proposalId, voteType);
      await tx.wait();

      showToast.success('Vote cast successfully!');
      await loadProposals();
    } catch (error: any) {
      console.error('Error voting:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const finalizeProposal = async (proposalId: number) => {
    try {
      setLoading(true);

      const governance = web3Provider.getGovernance();
      if (!governance) throw new Error('Governance contract not initialized');

      const tx = await governance.finalizeProposal(proposalId);
      await tx.wait();

      showToast.success('Proposal finalized successfully!');
      await loadProposals();
    } catch (error: any) {
      console.error('Error finalizing proposal:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId: number) => {
    try {
      setLoading(true);

      const governance = web3Provider.getGovernance();
      if (!governance) throw new Error('Governance contract not initialized');

      const tx = await governance.executeProposal(proposalId);
      await tx.wait();

      showToast.success('Proposal executed successfully!');
      await loadProposals();
    } catch (error: any) {
      console.error('Error executing proposal:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  const getTotalVotes = (proposal: Proposal): bigint => {
    return proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  };

  const getVotePercentage = (votes: bigint, total: bigint): string => {
    if (total === 0n) return '0';
    return ((Number(votes) * 100) / Number(total)).toFixed(1);
  };

  const isVotingActive = (proposal: Proposal): boolean => {
    return proposal.status === 0 && Number(proposal.votingEnds) > Date.now() / 1000;
  };

  const canFinalize = (proposal: Proposal): boolean => {
    return proposal.status === 0 && Number(proposal.votingEnds) <= Date.now() / 1000;
  };

  const canExecute = (proposal: Proposal): boolean => {
    return proposal.status === 1;
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-xl text-yellow-800">Please connect your wallet to participate in governance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Governance</h1>
          <p className="text-gray-600">Participate in platform decisions through decentralized voting</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={parseFloat(stakedAmount) < 100}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={parseFloat(stakedAmount) < 100 ? 'You need at least 100 staked IAT to create proposals' : ''}
        >
          <Plus className="h-5 w-5" />
          <span>Create Proposal</span>
        </button>
      </div>

      
      <div className="bg-gradient-to-r from-primary-600 to-africa-600 rounded-xl shadow-md p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 mb-1">Your Voting Power</p>
            <p className="text-3xl font-bold">{parseFloat(stakedAmount).toFixed(2)} IAT</p>
            <p className="text-sm text-primary-100 mt-1">
              {parseFloat(stakedAmount) < 100 ? '⚠️ Stake at least 100 IAT to create proposals' : '✓ You can create proposals'}
            </p>
          </div>
          <Vote className="h-12 w-12 text-primary-200" />
        </div>
      </div>

      
      <div>
        <h2 className="text-2xl font-bold mb-6">All Proposals</h2>

        {loading && proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Vote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">No proposals yet</p>
            <p className="text-gray-500 mb-6">Be the first to create a proposal for platform improvement</p>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={parseFloat(stakedAmount) < 100}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              Create First Proposal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {proposals.map((proposal) => {
              const totalVotes = getTotalVotes(proposal);
              const votingActive = isVotingActive(proposal);
              const timeRemaining = Number(proposal.votingEnds) - Date.now() / 1000;

              return (
                <div key={proposal.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">#{proposal.id} {proposal.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[proposal.status]}`}>
                          {statuses[proposal.status]}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{proposal.description}</p>
                      <p className="text-sm text-gray-500">Proposed by: {proposal.proposer.slice(0, 10)}...</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(Number(proposal.createdAt) * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  
                  {votingActive && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Voting ends in {Math.floor(timeRemaining / 3600)}h {Math.floor((timeRemaining % 3600) / 60)}m
                      </span>
                    </div>
                  )}

                  
                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="h-4 w-4" />
                          For: {proposal.forVotes ? ethers.formatEther(proposal.forVotes) : '0'} IAT
                        </span>
                        <span className="text-gray-600">{getVotePercentage(proposal.forVotes, totalVotes)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${getVotePercentage(proposal.forVotes, totalVotes)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1 text-red-600">
                          <ThumbsDown className="h-4 w-4" />
                          Against: {proposal.againstVotes ? ethers.formatEther(proposal.againstVotes) : '0'} IAT
                        </span>
                        <span className="text-gray-600">{getVotePercentage(proposal.againstVotes, totalVotes)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${getVotePercentage(proposal.againstVotes, totalVotes)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-1 text-gray-600">
                          <MinusCircle className="h-4 w-4" />
                          Abstain: {proposal.abstainVotes ? ethers.formatEther(proposal.abstainVotes) : '0'} IAT
                        </span>
                        <span className="text-gray-600">{getVotePercentage(proposal.abstainVotes, totalVotes)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full transition-all"
                          style={{ width: `${getVotePercentage(proposal.abstainVotes, totalVotes)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  
                  <div className="flex gap-3">
                    {votingActive && !hasVoted[proposal.id] && parseFloat(stakedAmount) > 0 && (
                      <>
                        <button
                          onClick={() => vote(proposal.id, 0)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>Vote For</span>
                        </button>
                        <button
                          onClick={() => vote(proposal.id, 1)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>Vote Against</span>
                        </button>
                        <button
                          onClick={() => vote(proposal.id, 2)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50"
                        >
                          <MinusCircle className="h-4 w-4" />
                          <span>Abstain</span>
                        </button>
                      </>
                    )}

                    {votingActive && hasVoted[proposal.id] && (
                      <div className="flex-1 text-center py-2 text-green-600 font-medium">
                        ✓ You have voted on this proposal
                      </div>
                    )}

                    {votingActive && parseFloat(stakedAmount) === 0 && (
                      <div className="flex-1 text-center py-2 text-yellow-600 font-medium">
                        ⚠️ You need to stake tokens to vote
                      </div>
                    )}

                    {canFinalize(proposal) && (
                      <button
                        onClick={() => finalizeProposal(proposal.id)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Finalize Proposal</span>
                      </button>
                    )}

                    {canExecute(proposal) && (
                      <button
                        onClick={() => executeProposal(proposal.id)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Execute Proposal</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-3xl font-bold mb-6">Create Proposal</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Increase staking rewards to 15%"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your proposal in detail. Explain why this change is needed and how it will benefit the platform..."
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">{description.length}/500 characters</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Voting Period:</strong> 3 days
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Approval Threshold:</strong> 51% of votes must be "For"
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Your Voting Power:</strong> {parseFloat(stakedAmount).toFixed(2)} IAT
                </p>
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
                onClick={createProposal}
                disabled={loading || !title || !description}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}