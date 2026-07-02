'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { TrendingUp, Lock, Loader2, ArrowUpRight, Zap, Info, Check } from 'lucide-react';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';
import { InvestmentSearchBar, InvestmentItem } from './InvestmentSearchBar';
import { walletCache, walletCacheKeys, CACHE_TTL } from '@/utils/web3/walletCache';
import { createLogger } from '@/lib/logging';

const logger = createLogger('DeFiInterface');

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

const PROTOCOLS: DeFiProtocol[] = [
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
];

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
  const [filteredProtocols, setFilteredProtocols] = useState<DeFiProtocol[]>(PROTOCOLS);

  const fetchPositions = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) {
      setStakingPositions([]);
      return;
    }

    const cacheKey = walletCacheKeys.defiPositions(wallet.address);
    const cached = walletCache.get<StakingPosition[]>(cacheKey);
    if (cached) {
      setStakingPositions(cached);
      return;
    }

    setIsLoading(true);
    try {
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
      walletCache.set(cacheKey, positions, CACHE_TTL.DEFI_POSITIONS);
      setStakingPositions(positions);
    } catch (error) {
      logger.error('Error fetching positions', { error });
    } finally {
      setIsLoading(false);
    }
  }, [wallet.isConnected, wallet.address]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleStake = useCallback(async () => {
    if (!selectedProtocol || !stakeAmount) return;
    setIsStaking(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const duration = parseInt(stakeDuration, 10);
      const newPosition: StakingPosition = {
        id: `${Date.now()}`,
        token: selectedProtocol.tokens[0],
        amount: stakeAmount,
        apy: selectedProtocol.apy,
        lockPeriod: duration,
        rewards: '0',
        unrealizedRewards: '0',
        startDate: Date.now(),
        endDate: Date.now() + duration * 24 * 60 * 60 * 1000,
      };
      setStakingPositions((prev) => {
        const updated = [...prev, newPosition];
        if (wallet.address) {
          walletCache.set(
            walletCacheKeys.defiPositions(wallet.address),
            updated,
            CACHE_TTL.DEFI_POSITIONS,
          );
        }
        return updated;
      });
      onStake?.(selectedProtocol.id, stakeAmount, duration);
      setStakeAmount('');
      setSelectedProtocol(null);
      setActiveTab('positions');
    } catch (error) {
      logger.error('Staking failed', { error });
    } finally {
      setIsStaking(false);
    }
  }, [selectedProtocol, stakeAmount, stakeDuration, onStake, wallet.address]);

  const handleUnstake = useCallback(
    async (positionId: string) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStakingPositions((prev) => {
          const updated = prev.filter((p) => p.id !== positionId);
          if (wallet.address) {
            walletCache.set(
              walletCacheKeys.defiPositions(wallet.address),
              updated,
              CACHE_TTL.DEFI_POSITIONS,
            );
          }
          return updated;
        });
        onUnstake?.(positionId);
      } catch (error) {
        logger.error('Unstaking failed', { error });
      }
    },
    [onUnstake, wallet.address],
  );

  const investmentItems = React.useMemo<InvestmentItem[]>(() => {
    return PROTOCOLS.map((p) => ({
      id: p.id,
      name: p.name,
      symbol: p.tokens[0] || '',
      apy: p.apy,
      tvl: parseFloat(p.tvl.replace(/[^0-9.]/g, '')), // '$10.2B' -> 10.2
      riskLevel: (p.riskLevel.charAt(0).toUpperCase() + p.riskLevel.slice(1)) as
        | 'Low'
        | 'Medium'
        | 'High',
    }));
  }, []);

  const handleSearchResults = useCallback((results: InvestmentItem[]) => {
    const resultIds = new Set(results.map((r) => r.id));
    setFilteredProtocols(PROTOCOLS.filter((p) => resultIds.has(p.id)));
  }, []);

  const totalStaked = stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.amount), 0);
  const totalRewards = stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.rewards), 0);

  if (!wallet.isConnected) {
    return (
      <div
        className={`p-8 text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}
      >
        <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3 opacity-50" />
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          Connect wallet to access DeFi protocols
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {stakingPositions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Total Staked
              </p>
              <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalStaked.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Across {stakingPositions.length} positions</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Total Rewards
              </p>
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalRewards.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Earned to date</p>
          </div>
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
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['protocols', 'positions', 'rewards'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors capitalize -mb-[2px] ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'protocols' && (
        <div className="space-y-3">
          <InvestmentSearchBar items={investmentItems} onResultsChange={handleSearchResults} />
          {filteredProtocols.map((protocol) => (
            <div
              key={protocol.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{protocol.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {protocol.description}
                  </p>
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
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {protocol.apy}%
                  </p>
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
              <button
                onClick={() => setSelectedProtocol(protocol)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Stake
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : stakingPositions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No active staking positions</p>
            </div>
          ) : (
            stakingPositions.map((position) => (
              <div
                key={position.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between mb-3">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {position.amount} {position.token}
                  </p>
                  <span className="text-lg font-bold text-green-600">
                    +{position.unrealizedRewards}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Harvested</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {position.rewards} {position.token}
                    </p>
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
                  className="w-full px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium text-sm rounded-lg"
                >
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
          <p className="text-xs text-gray-500 mt-2">
            Monitor all your staking rewards in one place
          </p>
        </div>
      )}

      {/* Staking modal */}
      {selectedProtocol && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedProtocol(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Stake in {selectedProtocol.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount ({selectedProtocol.tokens[0]})
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (Days)</label>
                <select
                  value={stakeDuration}
                  onChange={(e) => setStakeDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">365 Days</option>
                </select>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg flex gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {"It's time to put your assets to work. Your funds will be locked at "}
                  <span className="font-semibold">{selectedProtocol.apy}% APY</span>.
                </p>
              </div>
              <button
                onClick={handleStake}
                disabled={!stakeAmount || isStaking}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
              >
                {isStaking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm Stake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeFiInterface;
