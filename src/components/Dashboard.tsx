import React from 'react';
import { UserPositions, MarketStats, TabType } from '../types';
import { TOKENS } from '../config/contracts';
import { formatUSD, formatPercent } from '../utils/formatters';
import { HealthFactorBar } from './HealthFactorBar';
import {
  TrendingUp,
  Coins,
  Sparkles,
  ArrowDownCircle,
  RefreshCw,
  Wallet,
  Shield,
  Layers,
  ArrowUpRight,
  PieChart,
  Percent,
} from 'lucide-react';

interface DashboardProps {
  positions: UserPositions;
  marketStats: MarketStats;
  account: string | null;
  ethBalance: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  setActiveTab: (tab: TabType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  positions,
  marketStats,
  account,
  ethBalance,
  isLoading,
  isRefreshing,
  onRefresh,
  setActiveTab,
}) => {
  // Calculate total net worth & position values in USD
  const vaultValUSD = parseFloat(positions.vaultBalance) * TOKENS.SUPPLY.priceUSD;
  const stakedValUSD = parseFloat(positions.stakedBalance) * TOKENS.STAKING.priceUSD;
  const rewardsValUSD = parseFloat(positions.pendingRewards) * TOKENS.STAKING.priceUSD;
  const suppliedValUSD = parseFloat(positions.suppliedBalance) * TOKENS.SUPPLY.priceUSD;
  const collateralValUSD = parseFloat(positions.collateralBalance) * TOKENS.COLLATERAL.priceUSD;
  const debtValUSD = parseFloat(positions.borrowedDebt) * TOKENS.BORROW.priceUSD;

  const totalAssetsUSD = vaultValUSD + stakedValUSD + rewardsValUSD + suppliedValUSD + collateralValUSD;
  const netWorthUSD = totalAssetsUSD - debtValUSD;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-surface to-surface-light border border-surface-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Overview &amp; Portfolio
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Protocol Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor your deposits, staked yields, supplied liquidity, collateral health, and active debt.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-border text-slate-300 text-xs font-medium border border-surface-border transition-all active:scale-95"
            title="Refresh positions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Net Worth & Net APY Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Worth */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between hover:border-surface-border/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Net Portfolio Worth</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatUSD(netWorthUSD)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span>Assets: <strong className="text-slate-200">{formatUSD(totalAssetsUSD)}</strong></span>
              <span>•</span>
              <span>Debt: <strong className="text-rose-400">{formatUSD(debtValUSD)}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Net APY */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between hover:border-surface-border/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Blended Net APY</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400 font-mono tracking-tight">
              {formatPercent(marketStats.netApy)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Estimated annual return across positions
            </div>
          </div>
        </div>

        {/* Card 3: Total Supplied */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between hover:border-surface-border/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Supplied &amp; Staked</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatUSD(suppliedValUSD + stakedValUSD + vaultValUSD)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Earned Rewards:</span>
              <span className="text-emerald-400 font-mono font-medium">+{positions.pendingRewards} AETH</span>
            </div>
          </div>
        </div>

        {/* Card 4: Borrow & Collateral */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between hover:border-surface-border/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Collateral &amp; Debt</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatUSD(debtValUSD)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Collateral Value:</span>
              <span className="text-slate-200 font-mono">{formatUSD(collateralValUSD)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Protocol Market Overview & Health Factor Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Stats Box (2 Columns on large) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Global Protocol Market Stats
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated liquidity pools, interest rates, and utilization
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Live Liquidity
            </span>
          </div>

          {/* Utilization Progress Bar */}
          <div className="mb-6 p-4 rounded-2xl bg-surface-subtle border border-surface-border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Pool Utilization Rate</span>
              <span className="font-mono font-bold text-emerald-400">{marketStats.utilizationRate.toFixed(2)}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${marketStats.utilizationRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
              <span>Borrowed: {formatUSD(marketStats.totalBorrowedUSD)}</span>
              <span>Total Pool: {formatUSD(marketStats.totalSupplyUSD)}</span>
            </div>
          </div>

          {/* Rate Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border/60">
              <span className="text-[11px] text-slate-400 block mb-1">Supply APY</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {formatPercent(marketStats.supplyApy)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border/60">
              <span className="text-[11px] text-slate-400 block mb-1">Borrow APY</span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {formatPercent(marketStats.borrowApy)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border/60">
              <span className="text-[11px] text-slate-400 block mb-1">Staking APR</span>
              <span className="text-base font-bold text-purple-400 font-mono">
                {formatPercent(marketStats.stakingApy)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border/60">
              <span className="text-[11px] text-slate-400 block mb-1">Max LTV</span>
              <span className="text-base font-bold text-cyan-400 font-mono">
                {(marketStats.collateralFactor * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Health Factor Widget (1 Column) */}
        <div className="flex flex-col justify-between">
          <HealthFactorBar
            currentHF={positions.healthFactor}
            liquidationThreshold={marketStats.liquidationThreshold}
            className="h-full flex flex-col justify-between"
          />
        </div>
      </div>

      {/* Your Positions Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Your Positions Breakdown
          </h2>
          <span className="text-xs text-slate-400">
            Select a card to manage position
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Position: Vault Deposit */}
          <div
            onClick={() => setActiveTab('deposit')}
            className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-emerald-500/50 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">Vault Balance</span>
                <span className="p-1 rounded-lg bg-surface-light text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {positions.vaultBalance} <span className="text-xs text-slate-400 font-normal">{TOKENS.SUPPLY.symbol}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Value: {formatUSD(vaultValUSD)}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/50 text-[11px] text-emerald-400 font-medium">
              Deposit / Withdraw &rarr;
            </div>
          </div>

          {/* Position: Staked Tokens */}
          <div
            onClick={() => setActiveTab('stake')}
            className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-purple-500/50 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">Staked Yield</span>
                <span className="p-1 rounded-lg bg-surface-light text-slate-400 group-hover:text-purple-400 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {positions.stakedBalance} <span className="text-xs text-slate-400 font-normal">{TOKENS.STAKING.symbol}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Pending: <span className="text-emerald-400 font-mono">+{positions.pendingRewards} AETH</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/50 text-[11px] text-purple-400 font-medium">
              Stake & Claim &rarr;
            </div>
          </div>

          {/* Position: Lending (Supply) */}
          <div
            onClick={() => setActiveTab('lend')}
            className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-cyan-500/50 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">Supplied Liquidity</span>
                <span className="p-1 rounded-lg bg-surface-light text-slate-400 group-hover:text-cyan-400 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {positions.suppliedBalance} <span className="text-xs text-slate-400 font-normal">{TOKENS.SUPPLY.symbol}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Interest Earned: <span className="text-cyan-400 font-mono">+{positions.earnedInterest} USDC</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/50 text-[11px] text-cyan-400 font-medium">
              Manage Supply &rarr;
            </div>
          </div>

          {/* Position: Borrowed Debt */}
          <div
            onClick={() => setActiveTab('borrow')}
            className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-amber-500/50 cursor-pointer transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">Collateral &amp; Debt</span>
                <span className="p-1 rounded-lg bg-surface-light text-slate-400 group-hover:text-amber-400 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {positions.borrowedDebt} <span className="text-xs text-slate-400 font-normal">{TOKENS.BORROW.symbol}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Collateral: <span className="text-slate-200 font-mono">{positions.collateralBalance} WETH</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/50 text-[11px] text-amber-400 font-medium">
              Borrow & Repay &rarr;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
