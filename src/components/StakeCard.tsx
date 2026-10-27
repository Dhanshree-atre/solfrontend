import React, { useState } from 'react';
import { UserPositions } from '../types';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { parseTokenAmount, formatUSD } from '../utils/formatters';
import { parseContractError } from '../utils/parseError';
import { getTxExplorerUrl } from '../utils/explorer';
import { BrowserProvider, JsonRpcSigner, Contract, MaxUint256 } from 'ethers';
import StakingABI from '../abi/StakingABI.json';
import ERC20ABI from '../abi/ERC20ABI.json';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Gift,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface StakeCardProps {
  positions: UserPositions;
  stakingApy: number;
  account: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isDemoMode: boolean;
  onRefresh: () => void;
  updateDemoPosition: (updater: any) => void;
}

export const StakeCard: React.FC<StakeCardProps> = ({
  positions,
  stakingApy,
  account,
  signer,
  provider,
  isDemoMode,
  onRefresh,
  updateDemoPosition,
}) => {
  const [tab, setTab] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const token = TOKENS.STAKING;
  const parsedAmount = parseTokenAmount(amount, token.decimals);

  const walletBalanceRaw = positions.stakingTokenBalanceRaw;
  const stakedBalanceRaw = positions.stakedBalanceRaw;
  const pendingRewardsRaw = positions.pendingRewardsRaw;

  // Check allowance for staking
  const hasAllowance = positions.stakingTokenAllowance >= parsedAmount && parsedAmount > 0n;

  // Validations
  const isValidAmount = parsedAmount > 0n;
  const isExceedingBalance = tab === 'stake'
    ? parsedAmount > walletBalanceRaw
    : parsedAmount > stakedBalanceRaw;

  const handleMax = () => {
    if (tab === 'stake') {
      setAmount(positions.stakingTokenBalance);
    } else {
      setAmount(positions.stakedBalance);
    }
  };

  // Step 1: Approve Staking Token
  const handleApprove = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!isValidAmount) {
      toast.error('Please enter an amount to approve');
      return;
    }

    setIsApproving(true);
    const toastId = toast.loading(`Approving ${token.symbol} for staking...`);

    try {
      if (isDemoMode || !signer) {
        await new Promise((r) => setTimeout(r, 1200));
        updateDemoPosition((prev: any) => ({
          ...prev,
          stakingAllowance: MaxUint256,
        }));
        toast.success(`Successfully approved ${token.symbol}!`, { id: toastId });
        return;
      }

      const erc20 = new Contract(token.address, ERC20ABI, signer);
      const tx = await erc20.approve(CONTRACT_ADDRESSES.STAKING, MaxUint256);
      toast.loading('Confirming approval on-chain...', { id: toastId });
      const receipt = await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Staking approval confirmed!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 underline flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId }
      );
      onRefresh();
    } catch (err: any) {
      console.error('Staking approve error:', err);
      toast.error(parseContractError(err), { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  // Step 2: Stake or Unstake
  const handleAction = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!isValidAmount) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (isExceedingBalance) {
      toast.error(tab === 'stake' ? 'Insufficient wallet balance' : 'Insufficient staked balance');
      return;
    }

    setIsTransacting(true);
    const actionName = tab === 'stake' ? 'Stake' : 'Unstake';
    const toastId = toast.loading(`Submitting ${actionName} transaction...`);

    try {
      if (isDemoMode || !signer) {
        await new Promise((r) => setTimeout(r, 1400));
        if (tab === 'stake') {
          updateDemoPosition((prev: any) => ({
            ...prev,
            stakedBalance: prev.stakedBalance + parsedAmount,
            stakingTokenBalance: prev.stakingTokenBalance - parsedAmount,
          }));
        } else {
          updateDemoPosition((prev: any) => ({
            ...prev,
            stakedBalance: prev.stakedBalance - parsedAmount,
            stakingTokenBalance: prev.stakingTokenBalance + parsedAmount,
          }));
        }
        setAmount('');
        toast.success(`Successfully ${tab === 'stake' ? 'staked' : 'unstaked'} ${amount} ${token.symbol}!`, { id: toastId });
        return;
      }

      const staking = new Contract(CONTRACT_ADDRESSES.STAKING, StakingABI, signer);
      let tx;
      if (tab === 'stake') {
        tx = await staking.stake(parsedAmount);
      } else {
        tx = await staking.unstake(parsedAmount);
      }

      toast.loading(`Waiting for block confirmation...`, { id: toastId });
      const receipt = await tx.wait();

      setAmount('');
      toast.success(
        <div className="flex flex-col gap-1">
          <span>{actionName} confirmed!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 underline flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId }
      );
      onRefresh();
    } catch (err: any) {
      console.error(`${actionName} error:`, err);
      toast.error(parseContractError(err), { id: toastId });
    } finally {
      setIsTransacting(false);
    }
  };

  // Claim Rewards
  const handleClaimRewards = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (pendingRewardsRaw <= 0n) {
      toast.error('No pending rewards available to claim');
      return;
    }

    setIsClaiming(true);
    const toastId = toast.loading('Claiming staking rewards...');

    try {
      if (isDemoMode || !signer) {
        await new Promise((r) => setTimeout(r, 1300));
        const claimed = positions.pendingRewards;
        updateDemoPosition((prev: any) => ({
          ...prev,
          stakingTokenBalance: prev.stakingTokenBalance + prev.pendingRewards,
          pendingRewards: 0n,
        }));
        toast.success(`Claimed ${claimed} ${token.symbol} rewards!`, { id: toastId });
        return;
      }

      const staking = new Contract(CONTRACT_ADDRESSES.STAKING, StakingABI, signer);
      const tx = await staking.claimRewards();
      toast.loading('Confirming reward payout...', { id: toastId });
      const receipt = await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Rewards claimed successfully!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 underline flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId }
      );
      onRefresh();
    } catch (err: any) {
      console.error('Claim rewards error:', err);
      toast.error(parseContractError(err), { id: toastId });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Rewards Accrual Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-surface to-surface border border-purple-500/30 shadow-glow-purple relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-purple-400">
                Unclaimed Rewards
              </span>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {positions.pendingRewards} <span className="text-xs font-normal text-slate-400">{token.symbol}</span>
              </div>
              <span className="text-xs text-slate-400">
                ≈ {formatUSD(parseFloat(positions.pendingRewards) * token.priceUSD)}
              </span>
            </div>
          </div>

          <button
            onClick={handleClaimRewards}
            disabled={pendingRewardsRaw <= 0n || isClaiming}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isClaiming ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Claiming...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim Rewards</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Stake/Unstake Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Staking Pool
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Stake {token.symbol} to secure protocol liquidity and earn governance yield.
            </p>
          </div>

          {/* APY Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>{stakingApy.toFixed(1)}% APR</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-2xl bg-surface-subtle border border-surface-border mb-6">
          <button
            onClick={() => {
              setTab('stake');
              setAmount('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              tab === 'stake'
                ? 'bg-surface-light text-purple-400 shadow-sm border border-surface-border'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => {
              setTab('unstake');
              setAmount('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              tab === 'unstake'
                ? 'bg-surface-light text-purple-400 shadow-sm border border-surface-border'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unstake
          </button>
        </div>

        {/* Balance Display */}
        <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-subtle border border-surface-border mb-4 font-mono">
          <span className="text-slate-400">
            {tab === 'stake' ? 'Available to Stake:' : 'Currently Staked:'}
          </span>
          <span className="text-slate-200 font-semibold">
            {tab === 'stake' ? positions.stakingTokenBalance : positions.stakedBalance} {token.symbol}
          </span>
        </div>

        {/* Input */}
        <div className="p-4 rounded-2xl bg-surface-light border border-surface-border mb-6 focus-within:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Amount</span>
            <span>
              ≈ {formatUSD((parseFloat(amount) || 0) * token.priceUSD)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isApproving || isTransacting}
              className="w-full bg-transparent text-2xl font-bold font-mono text-white outline-none placeholder:text-slate-600"
            />

            <button
              onClick={handleMax}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-border border border-surface-border text-purple-400 font-mono text-xs font-semibold transition-all active:scale-95"
            >
              MAX
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="text-xs font-bold text-slate-200">{token.symbol}</span>
            </div>
          </div>

          {isExceedingBalance && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Amount exceeds {tab === 'stake' ? 'wallet' : 'staked'} balance</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {tab === 'stake' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleApprove}
                disabled={hasAllowance || !isValidAmount || isExceedingBalance || isApproving || isTransacting}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  hasAllowance
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 cursor-default'
                    : 'bg-surface-light hover:bg-surface-border text-slate-100 border border-surface-border active:scale-98 disabled:opacity-40'
                }`}
              >
                {isApproving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : hasAllowance ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>1. Approved</span>
                  </>
                ) : (
                  <span>1. Approve {token.symbol}</span>
                )}
              </button>

              <button
                onClick={handleAction}
                disabled={!hasAllowance || !isValidAmount || isExceedingBalance || isTransacting}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white transition-all shadow-glow-purple active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTransacting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Staking...</span>
                  </>
                ) : (
                  <span>2. Stake</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAction}
            disabled={!isValidAmount || isExceedingBalance || isTransacting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white transition-all shadow-glow-purple active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isTransacting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Unstaking...</span>
              </>
            ) : (
              <span>Unstake {token.symbol}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
