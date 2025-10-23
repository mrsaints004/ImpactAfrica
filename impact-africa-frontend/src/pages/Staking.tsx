import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Lock, Unlock, Gift } from 'lucide-react';
import { web3Provider } from '../utils/web3Provider';
import { ethers } from 'ethers';
import { showToast } from '../utils/toast';

interface StakingProps {
  account: string | null;
}

export default function Staking({ account }: StakingProps) {
  const [stakingLoading, setStakingLoading] = useState(false);
  const [unstakingLoading, setUnstakingLoading] = useState(false);
  const [claimingLoading, setClaimingLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [rewardRate, setRewardRate] = useState('0');
  const [poolBalance, setPoolBalance] = useState('0');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [stakedAt, setStakedAt] = useState<bigint>(0n);

  useEffect(() => {
    if (account) {
      loadData();
      const interval = setInterval(loadData, 10000); 
      return () => clearInterval(interval);
    }
  }, [account]);

  const loadData = async () => {
    try {
      const token = web3Provider.getImpactToken();
      const stakingPool = web3Provider.getStakingPool();
      if (!token || !stakingPool || !account) return;

      
      const balance = await token.balanceOf(account);
      setTokenBalance(ethers.formatEther(balance));

      
      const stake = await stakingPool.stakes(account);
      setStakedAmount(ethers.formatEther(stake.amount));
      setStakedAt(stake.stakedAt);

      
      const rewards = await stakingPool.calculatePendingRewards(account);
      setPendingRewards(ethers.formatEther(rewards));

      
      const stats = await stakingPool.getStakingStats();
      setTotalStaked(ethers.formatEther(stats._totalStaked));
      setRewardRate(stats._rewardRate.toString());
      setPoolBalance(ethers.formatEther(stats._poolBalance));
    } catch (error) {
      console.error('Error loading staking data:', error);
    }
  };

  const stake = async () => {
    try {
      if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
        showToast.error('Please enter a valid amount');
        return;
      }

      setStakingLoading(true);
      const token = web3Provider.getImpactToken();
      const stakingPool = web3Provider.getStakingPool();
      if (!token || !stakingPool) throw new Error('Contracts not initialized');

      const amount = ethers.parseEther(stakeAmount);

      
      const approveTx = await token.approve(await stakingPool.getAddress(), amount);
      await approveTx.wait();

      
      const stakeTx = await stakingPool.stake(amount);
      await stakeTx.wait();

      showToast.success('Tokens staked successfully!');
      setStakeAmount('');
      await loadData();
    } catch (error: any) {
      console.error('Error staking:', error);
      showToast.error(error);
    } finally {
      setStakingLoading(false);
    }
  };

  const unstake = async () => {
    try {
      if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
        showToast.error('Please enter a valid amount');
        return;
      }

      if (parseFloat(unstakeAmount) > parseFloat(stakedAmount)) {
        showToast.success('Amount exceeds staked balance');
        return;
      }

      setUnstakingLoading(true);
      const stakingPool = web3Provider.getStakingPool();
      if (!stakingPool) throw new Error('Contract not initialized');

      const amount = ethers.parseEther(unstakeAmount);

      const tx = await stakingPool.unstake(amount);
      await tx.wait();

      showToast.success('Tokens unstaked successfully!');
      setUnstakeAmount('');
      await loadData();
    } catch (error: any) {
      console.error('Error unstaking:', error);
      showToast.error(error);
    } finally {
      setUnstakingLoading(false);
    }
  };

  const claimRewards = async () => {
    try {
      setClaimingLoading(true);
      const stakingPool = web3Provider.getStakingPool();
      if (!stakingPool) throw new Error('Contract not initialized');

      const tx = await stakingPool.claimRewards();
      await tx.wait();

      showToast.success('Rewards claimed successfully!');
      await loadData();
    } catch (error: any) {
      console.error('Error claiming rewards:', error);
      showToast.error(error);
    } finally {
      setClaimingLoading(false);
    }
  };

  const calculateAPY = (): string => {
    if (parseFloat(totalStaked) === 0) return rewardRate;
    return rewardRate;
  };

  const calculateStakeDuration = (): string => {
    if (stakedAt === 0n) return 'Not staking';
    const duration = Date.now() / 1000 - Number(stakedAt);
    const days = Math.floor(duration / 86400);
    const hours = Math.floor((duration % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-xl text-yellow-800">Please connect your wallet to access staking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Staking Dashboard</h1>
        <p className="text-gray-600">Stake your IAT tokens to earn rewards and gain voting power</p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Your Staked Balance</p>
            <Lock className="h-5 w-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{parseFloat(stakedAmount).toFixed(2)} IAT</p>
          <p className="text-sm text-gray-500 mt-1">{calculateStakeDuration()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Rewards</p>
            <Gift className="h-5 w-5 text-africa-600" />
          </div>
          <p className="text-2xl font-bold text-africa-600">{parseFloat(pendingRewards).toFixed(4)} IAT</p>
          <button
            onClick={claimRewards}
            disabled={claimingLoading || parseFloat(pendingRewards) === 0}
            className="mt-2 w-full px-3 py-1 bg-africa-600 text-white text-sm rounded-lg hover:bg-africa-700 transition disabled:opacity-50"
          >
            {claimingLoading ? 'Claiming...' : 'Claim Rewards'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Staked (Platform)</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{parseFloat(totalStaked).toFixed(2)} IAT</p>
          <p className="text-sm text-gray-500 mt-1">Pool Balance: {parseFloat(poolBalance).toFixed(2)} IAT</p>
        </div>

        <div className="bg-gradient-to-r from-primary-600 to-africa-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-primary-100">Annual Percentage Yield</p>
            <TrendingUp className="h-5 w-5 text-primary-200" />
          </div>
          <p className="text-2xl font-bold">{calculateAPY()}% APY</p>
          <p className="text-sm text-primary-100 mt-1">Earn passive rewards</p>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Stake Tokens</h2>
              <p className="text-sm text-gray-600">Lock your tokens to earn rewards</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Amount to Stake</label>
              <button
                onClick={() => setStakeAmount(tokenBalance)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Max: {parseFloat(tokenBalance).toFixed(2)} IAT
              </button>
            </div>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              min="0"
              step="0.01"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Staking Benefits:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Earn {rewardRate}% APY in IAT rewards
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Gain voting power in governance
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Unstake anytime with instant withdrawal
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                No lock-up period or penalties
              </li>
            </ul>
          </div>

          {stakeAmount && parseFloat(stakeAmount) > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">You will stake:</span>
                <span className="font-semibold text-gray-900">{parseFloat(stakeAmount).toFixed(2)} IAT</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Estimated daily rewards:</span>
                <span className="font-semibold text-green-600">
                  {(parseFloat(stakeAmount) * parseFloat(rewardRate) / 100 / 365).toFixed(4)} IAT
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated yearly rewards:</span>
                <span className="font-semibold text-green-600">
                  {(parseFloat(stakeAmount) * parseFloat(rewardRate) / 100).toFixed(2)} IAT
                </span>
              </div>
            </div>
          )}

          <button
            onClick={stake}
            disabled={stakingLoading || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(tokenBalance)}
            className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {stakingLoading ? 'Staking...' : 'Stake Tokens'}
          </button>
        </div>

        
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-africa-100 rounded-full flex items-center justify-center">
              <Unlock className="h-6 w-6 text-africa-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Unstake Tokens</h2>
              <p className="text-sm text-gray-600">Withdraw your staked tokens</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Amount to Unstake</label>
              <button
                onClick={() => setUnstakeAmount(stakedAmount)}
                className="text-sm text-africa-600 hover:text-africa-700 font-medium"
              >
                Max: {parseFloat(stakedAmount).toFixed(2)} IAT
              </button>
            </div>
            <input
              type="number"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-africa-500 focus:border-transparent text-lg"
              min="0"
              step="0.01"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">Important:</h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Unstaking will automatically claim your pending rewards
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Your voting power will decrease proportionally
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Tokens are returned to your wallet immediately
              </li>
            </ul>
          </div>

          {parseFloat(pendingRewards) > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Pending Rewards to Claim</p>
                  <p className="text-lg font-bold text-green-600">{parseFloat(pendingRewards).toFixed(4)} IAT</p>
                </div>
                <Gift className="h-8 w-8 text-green-600" />
              </div>
            </div>
          )}

          {unstakeAmount && parseFloat(unstakeAmount) > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">You will receive:</span>
                <span className="font-semibold text-gray-900">{parseFloat(unstakeAmount).toFixed(2)} IAT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rewards claimed:</span>
                <span className="font-semibold text-green-600">{parseFloat(pendingRewards).toFixed(4)} IAT</span>
              </div>
            </div>
          )}

          <button
            onClick={unstake}
            disabled={unstakingLoading || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > parseFloat(stakedAmount)}
            className="w-full px-6 py-4 bg-gradient-to-r from-africa-600 to-africa-700 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {unstakingLoading ? 'Unstaking...' : 'Unstake Tokens'}
          </button>
        </div>
      </div>

      
      <div className="mt-8 bg-gradient-to-r from-primary-50 to-africa-50 rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How Staking Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Stake Your Tokens</h3>
            <p className="text-sm text-gray-600">
              Lock your IAT tokens in the staking pool to start earning rewards. There's no minimum or lock-up period.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Earn Passive Rewards</h3>
            <p className="text-sm text-gray-600">
              Receive {rewardRate}% APY in IAT rewards. Rewards are calculated in real-time and can be claimed anytime.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Participate in Governance</h3>
            <p className="text-sm text-gray-600">
              Your staked tokens give you voting power to influence platform decisions and future development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}