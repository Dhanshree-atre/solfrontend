import React, { useState } from 'react';
import { UserPositions } from '../types';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { parseTokenAmount, formatUSD } from '../utils/formatters';
import { parseContractError } from '../utils/parseError';
import { getTxExplorerUrl } from '../utils/explorer';
import { BrowserProvider, JsonRpcSigner, Contract, MaxUint256 } from 'ethers';
import LendingPoolABI from '../abi/LendingPoolABI.json';
import ERC20ABI from '../abi/ERC20ABI.json';
import toast from 'react-hot-toast';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

interface DepositCardProps {
  positions: UserPositions;
  account: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isDemoMode: boolean;
  onRefresh: () => void;
  updateDemoPosition: (updater: any) => void;
}

export const DepositCard: React.FC<DepositCardProps> = ({
  positions,
  account,
  signer,
  provider,
  isDemoMode,
  onRefresh,
  updateDemoPosition,
}) => {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);

  const token = TOKENS.SUPPLY;
  const parsedAmount = parseTokenAmount(amount, token.decimals);
  
  // Balances
  const walletBalanceRaw = positions.supplyTokenBalanceRaw;
  const vaultBalanceRaw = positions.vaultBalanceRaw;
  
  // Allowance check: needed for deposit
  const hasAllowance = positions.supplyTokenAllowance >= parsedAmount && parsedAmount > 0n;

  // Validation
  const isValidAmount = parsedAmount > 0n;
  const isExceedingBalance = tab === 'deposit' 
    ? parsedAmount > walletBalanceRaw 
    : parsedAmount > vaultBalanceRaw;

  // Handle Max button
  const handleMax = () => {
    if (tab === 'deposit') {
      setAmount(positions.supplyTokenBalance);
    } else {
      setAmount(positions.vaultBalance);
    }
  };

  // Step 1: Approve Token
  const handleApprove = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!isValidAmount) {
      toast.error('Please enter a valid amount to approve');
      return;
    }

    setIsApproving(true);
    const toastId = toast.loading(`Approving ${token.symbol}...`);

    try {
      if (isDemoMode || !signer) {
        // Simulated approval
        await new Promise((r) => setTimeout(r, 1200));
        updateDemoPosition((prev: any) => ({
          ...prev,
          supplyAllowance: MaxUint256,
        }));
        toast.success(`Successfully approved ${token.symbol}! You can now proceed to deposit.`, { id: toastId });
        return;
      }

      const erc20 = new Contract(token.address, ERC20ABI, signer);
      const tx = await erc20.approve(CONTRACT_ADDRESSES.LENDING_POOL, MaxUint256);
      toast.loading('Waiting for confirmation on-chain...', { id: toastId });
      
      const receipt = await tx.wait();
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Approval confirmed!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 underline flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId }
      );
      onRefresh();
    } catch (err: any) {
      console.error('Approve error:', err);
      toast.error(parseContractError(err), { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  // Step 2: Deposit or Withdraw
  const handleAction = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!isValidAmount) {
      toast.error('Please enter an amount');
      return;
    }
    if (isExceedingBalance) {
      toast.error(tab === 'deposit' ? 'Insufficient wallet balance' : 'Insufficient vault balance');
      return;
    }

    setIsTransacting(true);
    const actionName = tab === 'deposit' ? 'Deposit' : 'Withdraw';
    const toastId = toast.loading(`Submitting ${actionName} transaction...`);

    try {
      if (isDemoMode || !signer) {
        // Simulated execution
        await new Promise((r) => setTimeout(r, 1400));
        if (tab === 'deposit') {
          updateDemoPosition((prev: any) => ({
            ...prev,
            vaultBalance: prev.vaultBalance + parsedAmount,
            supplyTokenBalance: prev.supplyTokenBalance - parsedAmount,
          }));
        } else {
          updateDemoPosition((prev: any) => ({
            ...prev,
            vaultBalance: prev.vaultBalance - parsedAmount,
            supplyTokenBalance: prev.supplyTokenBalance + parsedAmount,
          }));
        }
        setAmount('');
        toast.success(`Successfully ${tab === 'deposit' ? 'deposited' : 'withdrawn'} ${amount} ${token.symbol}!`, { id: toastId });
        return;
      }

      const lendingPool = new Contract(CONTRACT_ADDRESSES.LENDING_POOL, LendingPoolABI, signer);
      let tx;
      if (tab === 'deposit') {
        tx = await lendingPool.deposit(parsedAmount);
      } else {
        tx = await lendingPool.withdraw(parsedAmount);
      }

      toast.loading(`Confirming ${actionName} on Sepolia...`, { id: toastId });
      const receipt = await tx.wait();

      setAmount('');
      toast.success(
        <div className="flex flex-col gap-1">
          <span>{actionName} successful!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 underline flex items-center gap-1"
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
    <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            Vault Deposit &amp; Withdraw
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deposit {token.symbol} into the primary liquidity vault or withdraw existing funds.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 rounded-2xl bg-surface-subtle border border-surface-border mb-6">
        <button
          onClick={() => {
            setTab('deposit');
            setAmount('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            tab === 'deposit'
              ? 'bg-surface-light text-emerald-400 shadow-sm border border-surface-border'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => {
            setTab('withdraw');
            setAmount('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            tab === 'withdraw'
              ? 'bg-surface-light text-emerald-400 shadow-sm border border-surface-border'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Balance Stats Bar */}
      <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-subtle border border-surface-border mb-4 font-mono">
        <span className="text-slate-400">
          {tab === 'deposit' ? 'Wallet Available:' : 'Vault Balance:'}
        </span>
        <span className="text-slate-200 font-semibold">
          {tab === 'deposit' ? positions.supplyTokenBalance : positions.vaultBalance} {token.symbol}
        </span>
      </div>

      {/* Amount Input Card */}
      <div className="p-4 rounded-2xl bg-surface-light border border-surface-border mb-6 focus-within:border-emerald-500/50 transition-colors">
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
            className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-border border border-surface-border text-emerald-400 font-mono text-xs font-semibold transition-all active:scale-95"
          >
            MAX
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              $
            </div>
            <span className="text-xs font-bold text-slate-200">{token.symbol}</span>
          </div>
        </div>

        {/* Input Validation Feedback */}
        {isExceedingBalance && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Amount exceeds {tab === 'deposit' ? 'wallet' : 'vault'} balance</span>
          </div>
        )}
      </div>

      {/* Two-step Action Area for Deposit (Approve -> Deposit) */}
      {tab === 'deposit' ? (
        <div className="space-y-3">
          {/* Visual Step Indicator if allowance needed */}
          {!hasAllowance && isValidAmount && !isExceedingBalance && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-surface-border text-xs">
              <span className="text-slate-400">Step 1 of 2: Approval required</span>
              <span className="text-emerald-400 font-medium">Grant permission to contract</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Step 1: Approve Button */}
            <button
              onClick={handleApprove}
              disabled={hasAllowance || !isValidAmount || isExceedingBalance || isApproving || isTransacting}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                hasAllowance
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1. Approved</span>
                </>
              ) : (
                <span>1. Approve {token.symbol}</span>
              )}
            </button>

            {/* Step 2: Deposit Button */}
            <button
              onClick={handleAction}
              disabled={!hasAllowance || !isValidAmount || isExceedingBalance || isTransacting}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 transition-all shadow-glow-primary active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isTransacting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Depositing...</span>
                </>
              ) : (
                <span>2. Deposit</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Single Step for Withdraw */
        <button
          onClick={handleAction}
          disabled={!isValidAmount || isExceedingBalance || isTransacting}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 transition-all shadow-glow-primary active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Non-custodial smart contract</span>
        </span>
        <span className="font-mono">Gas optimized</span>
      </div>
    </div>
  );
};
