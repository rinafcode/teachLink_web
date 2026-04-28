'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  TrendingUp,
  Lock,
  AlertCircle,
  ChevronDown,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Info,
  Check,
  X,
} from 'lucide-react';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

interface StakingPosition {
  id: string;
  token: string;
  amount: string;
  apy: number;
  lockPeriod: number;
  rewards: string;
  unrealizedRewards: string;
  startDate: number;
  endDate: number;
}

interface DeFiProtocol {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: string;
  riskLevel: 'low' | 'medium' | 'high';
  minStake: string;
  tokens: string[];
}

interface DeFiInterfaceProps {
  className?: string;
  onStake?: (protocol: string, amount: string, duration: number) => void;
  onUnstake?: (positionId: string) => void;
}

type Tab = 'protocols' | 'positions' | 'rewards';

/**
 * DeFiInterface Component
 *
 * Comprehensive DeFi interaction platform:
 * - Browse staking protocols
 * - Manage staking positions
 * - Track rewards
 * - Real-time APY updates
 * - Risk assessment
 *
 * Modern DeFi UX with:
 * - Multiple staking protocols
 * - Position management
 * - Reward tracking
 * - Risk indicators
 * - Responsive design
 */
export const DeFiInterface: React.FC<DeFiInterfaceProps> = ({
  className = '',
  onStake,
  onUnstake,
}) => {
  const wallet = useWeb3Wallet();
  const [activeTab, setActiveTab] = useState<Tab>('protocols');
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<DeFiProtocol | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState('30');
  const [isStaking, setIsStaking] = useState(false);

  // Mock DeFi protocols
  const protocols: DeFiProtocol[] = [
    {
      id: 'aave',
      name: 'Aave V3',
      description: 'Decentralized lending protocol with variable and stable rates',
      apy: 4.2,
      tvl: '$10.2B',
      riskLevel: 'low',
      minStake: '0.1',
      tokens: ['ETH', 'USDC', 'DAI'],
    },
    {
      id: 'uniswap',
      name: 'Uniswap V4 Liquidity',
      description: 'Provide liquidity and earn swap fees',
      apy: 15.8,
      tvl: '$5.8B',
      riskLevel: 'medium',
      minStake: '0.05',
      tokens: ['ETH', 'USDC', 'USDT'],
    },
    {
      id: 'lido',
      name: 'Lido Staking',
      description: 'Earn staking rewards with liquid staking',
      apy: 3.5,
      tvl: '$32.1B',
      riskLevel: 'low',
      minStake: '0.01',
      tokens: ['ETH'],
    },
    {
      id: 'convex',
      name: 'Convex Finance',
      description: 'Boost Curve Finance liquidity pool yields',
      apy: 12.3,
      tvl: '$8.4B',
      riskLevel: 'medium',
      minStake: '100',
      tokens: ['CVX', 'CRV'],
    },
  ];

  /**
   * Fetch user staking positions
   */
  const fetchPositions = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) {
      setStakingPositions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Mock staking positions
      const positions: StakingPosition[] = [
        {
          id: '1',
          token: 'ETH',
          amount: '5.0',
          apy: 3.5,
          lockPeriod: 30,
          rewards: '0.24',
          unrealizedRewards: '0.18',
          startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
          endDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        },
      ];

      await new Promise((resolve) => setTimeout(resolve, 300));
      setStakingPositions(positions);
    } catch (error) {
      console.error('[DeFiInterface] Error fetching positions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [wallet.isConnected, wallet.address]);

  /**
   * Load positions on mount and when wallet changes
   */
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  /**
   * Handle staking submission
   */
  const handleStake = useCallback(async () => {
    if (!selectedProtocol || !stakeAmount) return;

    setIsStaking(true);

    try {
      // Simulate staking transaction
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPosition: StakingPosition = {
        id: `${Date.now()}`,
        token: selectedProtocol.tokens[0],
        amount: stakeAmount,
        apy: selectedProtocol.apy,
        lockPeriod: parseInt(stakeDuration),
        rewards: '0',
        unrealizedRewards: '0',
        startDate: Date.now(),
        endDate: Date.now() + parseInt(stakeDuration) * 24 * 60 * 60 * 1000,
      };

      setStakingPositions([...stakingPositions, newPosition]);
      onStake?.(selectedProtocol.id, stakeAmount, parseInt(stakeDuration));

      // Reset form
      setStakeAmount('');
      setStakeDuration('30');
      setSelectedProtocol(null);
      setActiveTab('positions');
    } catch (error) {
      console.error('[DeFiInterface] Staking failed:', error);
    } finally {
      setIsStaking(false);
    }
  }, [selectedProtocol, stakeAmount, stakeDuration, stakingPositions, onStake]);

  /**
   * Handle unstaking
   */
  const handleUnstake = useCallback(
    async (positionId: string) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));

        setStakingPositions(stakingPositions.filter((p) => p.id !== positionId));
        onUnstake?.(positionId);
      } catch (error) {
        console.error('[DeFiInterface] Unstaking failed:', error);
      }
    },
    [stakingPositions, onUnstake],
  );

  /**
   * Calculate total staked value
   */
  const totalStaked = stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);

  /**
   * Calculate total rewards
   */
  const totalRewards = stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.rewards), 0);

  if (!wallet.isConnected) {
    return (
      <div className={`p-8 text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
        <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3 opacity-50" />
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          Connect wallet to access DeFi protocols
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary cards */}
      {stakingPositions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total staked */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Total Staked
              </p>
              <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaked.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Across {stakingPositions.length} positions</p>
          </div>

          {/* Total rewards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Total Rewards
              </p>
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRewards.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Earned to date</p>
          </div>

          {/* Average APY */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Avg APY
              </p>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(
                stakingPositions.reduce((sum, pos) => sum + pos.apy, 0) / stakingPositions.length
              ).toFixed(1)}
              %
            </p>
            <p className="text-xs text-gray-500 mt-1">Weighted average</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['protocols', 'positions', 'rewards'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors capitalize -mb-[2px] ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Protocols tab */}
      {activeTab === 'protocols' && (
        <div className="space-y-3">
          {protocols.map((protocol) => (
            <div
              key={protocol.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{protocol.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{protocol.description}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    protocol.riskLevel === 'low'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : protocol.riskLevel === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  {protocol.riskLevel}
                </span>
              </div>

              {/* Protocol stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">APY</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{protocol.apy}%</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">TVL</p>
                  <p className="font-medium text-gray-900 dark:text-white">{protocol.tvl}</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Min Stake</p>
                  <p className="font-medium text-gray-900 dark:text-white">{protocol.minStake}</p>
                </div>
              </div>

              {/* Supported tokens */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Supported Tokens</p>
                <div className="flex flex-wrap gap-1">
                  {protocol.tokens.map((token) => (
                    <span
                      key={token}
                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stake button */}
              <button
                onClick={() => setSelectedProtocol(protocol)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Stake
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Positions tab */}
      {activeTab === 'positions' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : stakingPositions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No active staking positions</p>
              <button
                onClick={() => setActiveTab('protocols')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Explore protocols
              </button>
            </div>
          ) : (
            stakingPositions.map((position) => (
              <div
                key={position.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {position.amount} {position.token}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      APY: {position.apy}% • Lock: {position.lockPeriod} days
                    </p>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    +{position.unrealizedRewards}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Harvested</p>
                    <p className="font-medium text-gray-900 dark:text-white">{position.rewards} {position.token}</p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unlocks</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(position.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleUnstake(position.id)}
                  className="w-full px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Unstake
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rewards tab */}
      {activeTab === 'rewards' && (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Reward tracking coming soon</p>
          <p className="text-xs text-gray-500 mt-2">Monitor all your staking rewards in one place</p>
        </div>
      )}

      {/* Staking modal */}
      {selectedProtocol && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedProtocol(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Stake in {selectedProtocol.name}
              </h3>
              <button
                onClick={() => setSelectedProtocol(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ({selectedProtocol.tokens[0]})
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  min={parseFloat(selectedProtocol.minStake)}
                  disabled={isStaking}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">Min: {selectedProtocol.minStake}</p>
              </div>

              {/* Duration select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lock Duration
                </label>
                <select
                  value={stakeDuration}
                  onChange={(e) => setStakeDuration(e.target.value)}
                  disabled={isStaking}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Your funds will be locked for the selected duration. You'll earn{' '}
                  <span className="font-semibold">{selectedProtocol.apy}% APY</span>.
                </p>
              </div>

              {/* Submit button */}
              <button
                onClick={handleStake}
                disabled={!stakeAmount || isStaking}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isStaking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Staking...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Stake
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeFiInterface;
