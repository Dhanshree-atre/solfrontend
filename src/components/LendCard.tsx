import React, { useState } from 'react';
import { UserPositions, MarketStats } from '../types';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { parseTokenAmount, formatUSD, formatPercent } from '../utils/formatters';
import { parseContractError } from '../utils/parseError';
import { getTxExplorerUrl } from '../utils/explorer';
import { BrowserProvider, JsonRpcSigner, Contract, MaxUint256 } from 'ethers';
import LendingPoolABI from '../abi/LendingPoolABI.json';
import ERC20ABI from '../abi/ERC20ABI.json';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Coins,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

interface LendCardProps {
  positions: UserPositions;
  marketStats: MarketStats;
  account: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isDemoMode: boolean;
  onRefresh: () => void;
  updateDemoPosition: (updater: any) => void;
}

export const LendCard: React.FC<LendCardProps> = ({
  positions,
  marketStats,
  account,
  signer,
  provider,
  isDemoMode,
  onRefresh,
  updateDemoPosition,
}) => {
  const [tab, setTab] = useState<'supply' | 'withdraw'>('supply');
  const [amount, setAmount] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);

  const token = TOKENS.SUPPLY;
  const parsedAmount = parseTokenAmount(amount, token.decimals);

  const walletBalanceRaw = positions.supplyTokenBalanceRaw;
  const suppliedBalanceRaw = positions.suppliedBalanceRaw;

  // Check allowance for supply
  const hasAllowance = positions.supplyTokenAllowance >= parsedAmount && parsedAmount > 0n;

  // Validations
  const isValidAmount = parsedAmount > 0n;
  const isExceedingBalance = tab === 'supply'
    ? parsedAmount > walletBalanceRaw
    : parsedAmount > suppliedBalanceRaw;

  const handleMax = () => {
    if (tab === 'supply') {
      setAmount(positions.supplyTokenBalance);
    } else {
      setAmount(positions.suppliedBalance);
    }
  };

  // Step 1: Approve Supply Token
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
    const toastId = toast.loading(`Approving ${token.symbol} for lending...`);

    try {
      if (isDemoMode || !signer) {
        await new Promise((r) => setTimeout(r, 1200));
        updateDemoPosition((prev: any) => ({
          ...prev,
          supplyAllowance: MaxUint256,
        }));
        toast.success(`Successfully approved ${token.symbol}!`, { id: toastId });
        return;
      }

      const erc20 = new Contract(token.address, ERC20ABI, signer);
      const tx = await erc20.approve(CONTRACT_ADDRESSES.LENDING_POOL, MaxUint256);
      toast.loading('Confirming approval...', { id: toastId });
      const receipt = await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Supply allowance approved!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 underline flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId }
      );
      onRefresh();
    } catch (err: any) {
      console.error('Supply approve error:', err);
      toast.error(parseContractError(err), { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  // Step 2: Supply or Withdraw Supply
  const handleAction = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!isValidAmount) {
      toast.error('Please enter an amount');
      return;
    }
    if (isExceedingBalance) {
      toast.error(tab === 'supply' ? 'Insufficient wallet balance' : 'Insufficient supplied balance');
      return;
    }

    setIsTransacting(true);
    const actionName = tab === 'supply' ? 'Supply' : 'Withdraw Supply';
    const toastId = toast.loading(`Submitting ${actionName}...`);

    try {
      if (isDemoMode || !signer) {
        await new Promise((r) => setTimeout(r, 1400));
        if (tab === 'supply') {
          updateDemoPosition((prev: any) => ({
            ...prev,
            suppliedBalance: prev.suppliedBalance + parsedAmount,
            supplyTokenBalance: prev.supplyTokenBalance - parsedAmount,
          }));
        } else {
          updateDemoPosition((prev: any) => ({
            ...prev,
            suppliedBalance: prev.suppliedBalance - parsedAmount,
            supplyTokenBalance: prev.supplyTokenBalance + parsedAmount,
          }));
        }
        setAmount('');
        toast.success(`Successfully ${tab === 'supply' ? 'supplied' : 'withdrawn'} ${amount} ${token.symbol}!`, { id: toastId });
        return;
      }

      const lendingPool = new Contract(CONTRACT_ADDRESSES.LENDING_POOL, LendingPoolABI, signer);
      let tx;
      if (tab === 'supply') {
        tx = await lendingPool.supply(parsedAmount);
      } else {
        tx = await lendingPool.withdrawSupply(parsedAmount);
      }

      toast.loading(`Confirming on-chain...`, { id: toastId });
      const receipt = await tx.wait();

      setAmount('');
      toast.success(
        <div className="flex flex-col gap-1">
          <span>{actionName} confirmed!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 underline flex items-center gap-1"
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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 rounded-3xl bg-surface border border-surface-border">
        <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border/60">
          <span className="text-[11px] text-slate-400 block mb-1">Supply APY</span>
          <span className="text-xl font-bold font-mono text-cyan-400">
            {formatPercent(marketStats.supplyApy)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border/60">
          <span className="text-[11px] text-slate-400 block mb-1">Your Total Supply</span>
          <span className="text-xl font-bold font-mono text-white">
            {positions.suppliedBalance} <span className="text-xs font-normal text-slate-400">{token.symbol}</span>
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-surface-subtle border border-surface-border/60">
          <span className="text-[11px] text-slate-400 block mb-1">Earned Interest</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            +{positions.earnedInterest} <span className="text-xs font-normal text-slate-400">{token.symbol}</span>
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Lending Pool (Supply)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supply stable assets to earn dynamic lending APY and protocol yield.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-2xl bg-surface-subtle border border-surface-border mb-6">
          <button
            onClick={() => {
              setTab('supply');
              setAmount('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              tab === 'supply'
                ? 'bg-surface-light text-cyan-400 shadow-sm border border-surface-border'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Supply
          </button>
          <button
            onClick={() => {
              setTab('withdraw');
              setAmount('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              tab === 'withdraw'
                ? 'bg-surface-light text-cyan-400 shadow-sm border border-surface-border'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Withdraw Supply
          </button>
        </div>

        {/* Balance Bar */}
        <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-subtle border border-surface-border mb-4 font-mono">
          <span className="text-slate-400">
            {tab === 'supply' ? 'Wallet Available:' : 'Supplied Liquidity:'}
          </span>
          <span className="text-slate-200 font-semibold">
            {tab === 'supply' ? positions.supplyTokenBalance : positions.suppliedBalance} {token.symbol}
          </span>
        </div>

        {/* Input */}
        <div className="p-4 rounded-2xl bg-surface-light border border-surface-border mb-6 focus-within:border-cyan-500/50 transition-colors">
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
              className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-border border border-surface-border text-cyan-400 font-mono text-xs font-semibold transition-all active:scale-95"
            >
              MAX
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                $
              </div>
              <span className="text-xs font-bold text-slate-200">{token.symbol}</span>
            </div>
          </div>

          {isExceedingBalance && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Amount exceeds {tab === 'supply' ? 'wallet' : 'supplied'} balance</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {tab === 'supply' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleApprove}
                disabled={hasAllowance || !isValidAmount || isExceedingBalance || isApproving || isTransacting}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  hasAllowance
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 cursor-default'
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
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>1. Approved</span>
                  </>
                ) : (
                  <span>1. Approve {token.symbol}</span>
                )}
              </button>

              <button
                onClick={handleAction}
                disabled={!hasAllowance || !isValidAmount || isExceedingBalance || isTransacting}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-glow-cyan active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTransacting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Supplying...</span>
                  </>
                ) : (
                  <span>2. Supply</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAction}
            disabled={!isValidAmount || isExceedingBalance || isTransacting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-glow-cyan active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isTransacting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Withdrawing...</span>
              </>
            ) : (
              <span>Withdraw {token.symbol}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
