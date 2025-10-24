import { useState, useEffect } from 'react';
import { Award, Trophy, Medal, TrendingUp, Users, Sprout } from 'lucide-react';
import { web3Provider } from '../utils/web3Provider';
import { ethers } from 'ethers';

interface LeaderboardEntry {
  address: string;
  impactScore: number;
  projectsCompleted: number;
  opportunitiesCompleted: number;
  totalPledged: bigint;
  totalEarned: bigint;
  rank: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'farmers' | 'impacters'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const reputationNFT = web3Provider.getReputationNFT();
      if (!reputationNFT) return;

      const totalSupply = await reputationNFT.totalSupply();
      const entries: LeaderboardEntry[] = [];

      for (let i = 1; i <= Number(totalSupply); i++) {
        try {
          const owner = await reputationNFT.ownerOf(i);
          const reputation = await reputationNFT.reputations(i);

          entries.push({
            address: owner,
            impactScore: Number(reputation.impactScore),
            projectsCompleted: Number(reputation.projectsCompleted),
            opportunitiesCompleted: Number(reputation.opportunitiesCompleted),
            totalPledged: reputation.totalPledged,
            totalEarned: reputation.totalEarned,
            rank: 0
          });
        } catch (error) {
          console.error(`Error loading reputation for token ${i}:`, error);
        }
      }

      
      entries.sort((a, b) => b.impactScore - a.impactScore);

      
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLeaderboard = (): LeaderboardEntry[] => {
    if (filter === 'farmers') {
      return leaderboard.filter(entry => entry.projectsCompleted > 0);
    } else if (filter === 'impacters') {
      return leaderboard.filter(entry => entry.opportunitiesCompleted > 0);
    }
    return leaderboard;
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-8 w-8 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-8 w-8 text-gray-400" />;
    if (rank === 3) return <Medal className="h-8 w-8 text-orange-600" />;
    return <div className="w-8 h-8 flex items-center justify-center text-gray-500 font-bold">#{rank}</div>;
  };

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    if (rank <= 10) return 'bg-gradient-to-r from-primary-500 to-primary-700';
    return 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const filteredLeaderboard = getFilteredLeaderboard();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-12 w-12 text-africa-600" />
          <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
          <Trophy className="h-12 w-12 text-africa-600" />
        </div>
        <p className="text-gray-600 text-lg">Top contributors making the biggest impact in Africa</p>
      </div>

      
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-gradient-to-r from-primary-600 to-africa-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Contributors
        </button>
        <button
          onClick={() => setFilter('farmers')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
            filter === 'farmers'
              ? 'bg-gradient-to-r from-primary-600 to-africa-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Sprout className="h-5 w-5" />
          Farmers
        </button>
        <button
          onClick={() => setFilter('impacters')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
            filter === 'impacters'
              ? 'bg-gradient-to-r from-primary-600 to-africa-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="h-5 w-5" />
          Impacters
        </button>
      </div>

      
      {filteredLeaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Contributors</p>
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredLeaderboard.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Impact Score</p>
              <TrendingUp className="h-5 w-5 text-africa-600" />
            </div>
            <p className="text-2xl font-bold text-africa-600">
              {filteredLeaderboard.reduce((sum, entry) => sum + entry.impactScore, 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Projects Completed</p>
              <Sprout className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {filteredLeaderboard.reduce((sum, entry) => sum + entry.projectsCompleted, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Opportunities Completed</p>
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {filteredLeaderboard.reduce((sum, entry) => sum + entry.opportunitiesCompleted, 0)}
            </p>
          </div>
        </div>
      )}

      
      {filteredLeaderboard.length >= 3 && (
        <div className="mb-12">
          <div className="flex items-end justify-center gap-4 md:gap-8">
            
            <div className="flex flex-col items-center flex-1 max-w-xs">
              <div className="bg-gradient-to-br from-gray-300 to-gray-500 text-white rounded-2xl p-6 w-full shadow-xl transform hover:scale-105 transition">
                <div className="flex justify-between items-start mb-4">
                  <Medal className="h-10 w-10 text-white" />
                  <span className="text-4xl font-bold">2</span>
                </div>
                <p className="text-sm font-medium mb-1">Silver</p>
                <p className="font-mono text-lg mb-3">{formatAddress(filteredLeaderboard[1].address)}</p>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-2xl font-bold">{filteredLeaderboard[1].impactScore.toLocaleString()}</p>
                  <p className="text-sm">Impact Score</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-300 to-gray-500 w-full h-32 rounded-t-lg mt-4"></div>
            </div>

            
            <div className="flex flex-col items-center flex-1 max-w-xs">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-2xl p-6 w-full shadow-2xl transform hover:scale-105 transition">
                <div className="flex justify-between items-start mb-4">
                  <Trophy className="h-12 w-12 text-white" />
                  <span className="text-5xl font-bold">1</span>
                </div>
                <p className="text-sm font-medium mb-1">Gold Champion</p>
                <p className="font-mono text-lg mb-3">{formatAddress(filteredLeaderboard[0].address)}</p>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-3xl font-bold">{filteredLeaderboard[0].impactScore.toLocaleString()}</p>
                  <p className="text-sm">Impact Score</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 w-full h-48 rounded-t-lg mt-4"></div>
            </div>

            
            <div className="flex flex-col items-center flex-1 max-w-xs">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl p-6 w-full shadow-xl transform hover:scale-105 transition">
                <div className="flex justify-between items-start mb-4">
                  <Medal className="h-10 w-10 text-white" />
                  <span className="text-4xl font-bold">3</span>
                </div>
                <p className="text-sm font-medium mb-1">Bronze</p>
                <p className="font-mono text-lg mb-3">{formatAddress(filteredLeaderboard[2].address)}</p>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-2xl font-bold">{filteredLeaderboard[2].impactScore.toLocaleString()}</p>
                  <p className="text-sm">Impact Score</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 w-full h-24 rounded-t-lg mt-4"></div>
            </div>
          </div>
        </div>
      )}

      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-africa-600">
          <h2 className="text-xl font-bold text-white">Complete Rankings</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No contributors yet</p>
            <p className="text-gray-500 mt-2">Be the first to make an impact!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Impact Score</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunities</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pledged</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaderboard.map((entry) => (
                  <tr
                    key={entry.address}
                    className={`hover:bg-gray-50 transition ${entry.rank <= 3 ? 'bg-opacity-10 ' + (entry.rank === 1 ? 'bg-yellow-100' : entry.rank === 2 ? 'bg-gray-100' : 'bg-orange-100') : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getMedalIcon(entry.rank)}
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getRankBadgeColor(entry.rank)}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900">{formatAddress(entry.address)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4 text-primary-600" />
                        <span className="text-lg font-bold text-primary-600">{entry.impactScore.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Sprout className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-gray-900">{entry.projectsCompleted}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-gray-900">{entry.opportunitiesCompleted}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{entry.totalPledged ? parseFloat(ethers.formatEther(entry.totalPledged)).toFixed(2) : '0.00'} IAT</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-africa-600">{entry.totalEarned ? parseFloat(ethers.formatEther(entry.totalEarned)).toFixed(2) : '0.00'} IAT</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      <div className="mt-12 bg-gradient-to-r from-primary-50 to-africa-50 rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How Impact Score is Calculated</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
              +10
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Per Verified Opportunity</h3>
            <p className="text-sm text-gray-600">
              Earn 10 points for each Impacter opportunity you complete and get verified.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 bg-africa-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
              +1
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Per Token Pledged</h3>
            <p className="text-sm text-gray-600">
              Get 1 point for every IAT token you pledge to support farmers.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
              +50
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Per Completed Project</h3>
            <p className="text-sm text-gray-600">
              Farmers earn 50 points for successfully completing a farming project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}