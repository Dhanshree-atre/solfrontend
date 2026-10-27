import React, { useState, useMemo } from 'react';
import { UserPositions, MarketStats } from '../types';
import { CONTRACT_ADDRESSES, TOKENS, PROTOCOL_CONFIG } from '../config/contracts';
import { parseTokenAmount, formatUSD, formatPercent } from '../utils/formatters';
import { parseContractError } from '../utils/parseError';
import { getTxExplorerUrl } from '../utils/explorer';
import { HealthFactorBar } from './HealthFactorBar';
import { BrowserProvider, JsonRpcSigner, Contract, MaxUint256 } from 'ethers';
import LendingPoolABI from '../abi/LendingPoolABI.json';
import ERC20ABI from '../abi/ERC20ABI.json';
import toast from 'react-hot-toast';
import {
  Coins,
  Shield,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';

interface BorrowCardProps {
  positions: UserPositions;
  marketStats: MarketStats;
  account: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isDemoMode: boolean;
  onRefresh: () => void;
  updateDemoPosition: (updater: any) => void;
}

type ModeType = 'borrow_repay' | 'collateral';
type BorrowSubTab = 'borrow' | 'repay';
type CollateralSubTab = 'deposit_collateral' | 'withdraw_collateral';

export const BorrowCard: React.FC<BorrowCardProps> = ({
  positions,
  marketStats,
  account,
  signer,
  provider,
  isDemoMode,
  onRefresh,
  updateDemoPosition,
}) => {
  const [mode, setMode] = useState<ModeType>('borrow_repay');
  const [borrowTab, setBorrowTab] = useState<BorrowSubTab>('borrow');
  const [collateralTab, setCollateralTab] = useState<CollateralSubTab>('deposit_collateral');
  const [amount, setAmount] = useState<string>('');
  
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);

  const borrowToken = TOKENS.BORROW;
  const collateralToken = TOKENS.COLLATERAL;

  // Active token for current context
  const activeToken = mode === 'borrow_repay' ? borrowToken : collateralToken;
  const parsedAmount = parseTokenAmount(amount, activeToken.decimals);
  const amountNumber = parseFloat(amount) || 0;

  // Collateral & Debt calculations
  const collateralBalanceNum = parseFloat(positions.collateralBalance);
  const debtBalanceNum = parseFloat(positions.borrowedDebt);
  const collateralValueUSD = collateralBalanceNum * collateralToken.priceUSD;
  const debtValueUSD = debtBalanceNum * borrowToken.priceUSD;

  // Max Borrow Limit & Available Borrow
  const maxBorrowLimitUSD = collateralValueUSD * PROTOCOL_CONFIG.COLLATERAL_FACTOR;
  const availableBorrowUSD = Math.max(0, maxBorrowLimitUSD - debtValueUSD);
  const availableBorrowTokens = (availableBorrowUSD / borrowToken.priceUSD).toFixed(2);

  // Projected Health Factor Calculation
  const projectedHF = useMemo(() => {
    if (!amountNumber || amountNumber <= 0) return undefined;

    let nextCollateralValUSD = collateralValueUSD;
    let nextDebtUSD = debtValueUSD;

    if (mode === 'borrow_repay') {
      if (borrowTab === 'borrow') {
        nextDebtUSD += amountNumber * borrowToken.priceUSD;
      } else {
        nextDebtUSD = Math.max(0, nextDebtUSD - amountNumber * borrowToken.priceUSD);
      }
    } else {
      if (collateralTab === 'deposit_collateral') {
        nextCollateralValUSD += amountNumber * collateralToken.priceUSD;
      } else {
        nextCollateralValUSD = Math.max(0, nextCollateralValUSD - amountNumber * collateralToken.priceUSD);
      }
    }

    if (nextDebtUSD <= 0) return Infinity;
    const liqThresholdVal = nextCollateralValUSD * PROTOCOL_CONFIG.LIQUIDATION_THRESHOLD;
    return liqThresholdVal / nextDebtUSD;
  }, [amountNumber, mode, borrowTab, collateralTab, collateralValueUSD, debtValueUSD, borrowToken.priceUSD, collateralToken.priceUSD]);

  // Allowance check:
  // - Collateral deposit needs Collateral Token allowance
  // - Repay needs Borrow Token allowance
  const hasAllowance = useMemo(() => {
    if (parsedAmount <= 0n) return true;
    if (mode === 'collateral' && collateralTab === 'deposit_collateral') {
      return positions.collateralTokenAllowance >= parsedAmount;
    }
    if (mode === 'borrow_repay' && borrowTab === 'repay') {
      return positions.repayTokenAllowance >= parsedAmount;
    }
    return true; // Borrowing & Withdrawing collateral don't require ERC20 approve
  }, [mode, collateralTab, borrowTab, parsedAmount, positions.collateralTokenAllowance, positions.repayTokenAllowance]);

  // Safety checks & blocking unsafe actions
  const isDangerousBorrow = projectedHF !== undefined && projectedHF < PROTOCOL_CONFIG.WARNING_HEALTH_FACTOR;
  const isCriticalLiquidation = projectedHF !== undefined && projectedHF < 1.05;

  const isExceedingAvailableBorrow = mode === 'borrow_repay' && borrowTab === 'borrow' && amountNumber > parseFloat(availableBorrowTokens);
  const isExceedingCollateralBalance = mode === 'collateral' && collateralTab === 'withdraw_collateral' && amountNumber > collateralBalanceNum;
  const isExceedingWalletCollateral = mode === 'collateral' && collateralTab === 'deposit_collateral' && amountNumber > parseFloat(positions.collateralTokenBalance);
  const isExceedingDebtRepay = mode === 'borrow_repay' && borrowTab === 'repay' && amountNumber > debtBalanceNum;

  // Max Button Handlers
  const handleMax = () => {
    if (mode === 'borrow_repay') {
      if (borrowTab === 'borrow') {
        // Safe max: borrow up to available limit while keeping HF >= 1.25
        setAmount(availableBorrowTokens);
      } else {
        // Repay All
        setAmount(positions.borrowedDebt);
      }
    } else {
      if (collateralTab === 'deposit_collateral') {
        setAmount(positions.collateralTokenBalance);
      } else {
        // Safe max withdraw collateral without dropping HF < 1.5
        if (debtValueUSD <= 0) {
          setAmount(positions.collateralBalance);
        } else {
          // Required collateral value to maintain HF 1.20 = (Debt * 1.20) / LiquidationThreshold
          const minRequiredUSD = (debtValueUSD * 1.20) / PROTOCOL_CONFIG.LIQUIDATION_THRESHOLD;
          const maxWithdrawableUSD = Math.max(0, collateralValueUSD - minRequiredUSD);
          const maxWithdrawableTokens = Math.min(
            collateralBalanceNum,
            maxWithdrawableUSD / collateralToken.priceUSD
          );
          setAmount(maxWithdrawableTokens.toFixed(4));
        }
      }
    }
  };

  // Step 1: Approve Token
  const handleApprove = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (parsedAmount <= 0n) {
      toast.error('Please enter an amount to approve');
      return;
    }

    setIsApproving(true);
    const toastId = toast.loading(`Approving ${activeToken.symbol}...`);

    try {
      if (isDemoMode || !signer) {
        await new Promise((r) => setTimeout(r, 1200));
        updateDemoPosition((prev: any) => {
          if (mode === 'collateral') {
            return { ...prev, collateralAllowance: MaxUint256 };
          } else {
            return { ...prev, repayAllowance: MaxUint256 };
          }
        });
        toast.success(`Approved ${activeToken.symbol}!`, { id: toastId });
        return;
      }

      const erc20 = new Contract(activeToken.address, ERC20ABI, signer);
      const tx = await erc20.approve(CONTRACT_ADDRESSES.LENDING_POOL, MaxUint256);
      toast.loading('Confirming approval...', { id: toastId });
      const receipt = await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <span>{activeToken.symbol} approval confirmed!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 underline flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId }
      );
      onRefresh();
    } catch (err: any) {
      console.error('Approval error:', err);
      toast.error(parseContractError(err), { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  // Step 2: Main Action Execution
  const handleAction = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (parsedAmount <= 0n) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Block unsafe operations
    if (isCriticalLiquidation && (borrowTab === 'borrow' || collateralTab === 'withdraw_collateral')) {
      toast.error('Action blocked: Health factor would drop below the safe liquidation threshold (< 1.05)!');
      return;
    }

    setIsTransacting(true);
    let actionLabel = '';
    if (mode === 'borrow_repay') {
      actionLabel = borrowTab === 'borrow' ? 'Borrow' : 'Repay';
    } else {
      actionLabel = collateralTab === 'deposit_collateral' ? 'Deposit Collateral' : 'Withdraw Collateral';
    }

    const toastId = toast.loading(`Executing ${actionLabel}...`);

    try {
      if (isDemoMode || !signer) {
        await new Promise((r) => setTimeout(r, 1400));
        
        updateDemoPosition((prev: any) => {
          if (mode === 'borrow_repay') {
            if (borrowTab === 'borrow') {
              return {
                ...prev,
                borrowedDebt: prev.borrowedDebt + parsedAmount,
              };
            } else {
              return {
                ...prev,
                borrowedDebt: prev.borrowedDebt > parsedAmount ? prev.borrowedDebt - parsedAmount : 0n,
              };
            }
          } else {
            if (collateralTab === 'deposit_collateral') {
              return {
                ...prev,
                collateralBalance: prev.collateralBalance + parsedAmount,
                collateralTokenBalance: prev.collateralTokenBalance - parsedAmount,
              };
            } else {
              return {
                ...prev,
                collateralBalance: prev.collateralBalance - parsedAmount,
                collateralTokenBalance: prev.collateralTokenBalance + parsedAmount,
              };
            }
          }
        });

        setAmount('');
        toast.success(`Successfully executed ${actionLabel} for ${amount} ${activeToken.symbol}!`, { id: toastId });
        return;
      }

      const lendingPool = new Contract(CONTRACT_ADDRESSES.LENDING_POOL, LendingPoolABI, signer);
      let tx;

      if (mode === 'borrow_repay') {
        if (borrowTab === 'borrow') {
          tx = await lendingPool.borrow(parsedAmount);
        } else {
          tx = await lendingPool.repay(parsedAmount);
        }
      } else {
        if (collateralTab === 'deposit_collateral') {
          tx = await lendingPool.depositCollateral(parsedAmount);
        } else {
          tx = await lendingPool.withdrawCollateral(parsedAmount);
        }
      }

      toast.loading(`Confirming on-chain...`, { id: toastId });
      const receipt = await tx.wait();

      setAmount('');
      toast.success(
        <div className="flex flex-col gap-1">
          <span>{actionLabel} transaction confirmed!</span>
          <a
            href={getTxExplorerUrl(receipt.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 underline flex items-center gap-1"
          >
            View on Etherscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId }
      );
      onRefresh();
    } catch (err: any) {
      console.error(`${actionLabel} error:`, err);
      toast.error(parseContractError(err), { id: toastId });
    } finally {
      setIsTransacting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Protocol Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-3xl bg-surface border border-surface-border">
        <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border/60">
          <span className="text-[11px] text-slate-400 block mb-1">Borrow APY</span>
          <span className="text-xl font-bold font-mono text-amber-400">
            {formatPercent(marketStats.borrowApy)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border/60">
          <span className="text-[11px] text-slate-400 block mb-1">Borrow Limit</span>
          <span className="text-xl font-bold font-mono text-white">
            {formatUSD(maxBorrowLimitUSD)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border/60">
          <span className="text-[11px] text-slate-400 block mb-1">Available to Borrow</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {formatUSD(availableBorrowUSD)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border/60">
          <span className="text-[11px] text-slate-400 block mb-1">Current Debt</span>
          <span className="text-xl font-bold font-mono text-rose-400">
            {positions.borrowedDebt} <span className="text-xs font-normal text-slate-400">DAI</span>
          </span>
        </div>
      </div>

      {/* Main Borrow / Collateral Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Selector (Borrow & Repay vs Collateral Management) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-surface-border">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              Borrow &amp; Collateral
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Lock collateral to borrow stable assets or manage existing loan health.
            </p>
          </div>

          <div className="flex p-1 rounded-2xl bg-surface-subtle border border-surface-border w-full sm:w-auto">
            <button
              onClick={() => {
                setMode('borrow_repay');
                setAmount('');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                mode === 'borrow_repay'
                  ? 'bg-surface-light text-amber-400 shadow-sm border border-surface-border'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Borrow &amp; Repay
            </button>
            <button
              onClick={() => {
                setMode('collateral');
                setAmount('');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                mode === 'collateral'
                  ? 'bg-surface-light text-purple-400 shadow-sm border border-surface-border'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Manage Collateral
            </button>
          </div>
        </div>

        {/* Sub-tabs for Current Mode */}
        {mode === 'borrow_repay' ? (
          <div className="flex p-1 rounded-2xl bg-surface-subtle border border-surface-border mb-6">
            <button
              onClick={() => {
                setBorrowTab('borrow');
                setAmount('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                borrowTab === 'borrow'
                  ? 'bg-surface-light text-amber-400 shadow-sm border border-surface-border'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Borrow {borrowToken.symbol}
            </button>
            <button
              onClick={() => {
                setBorrowTab('repay');
                setAmount('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                borrowTab === 'repay'
                  ? 'bg-surface-light text-emerald-400 shadow-sm border border-surface-border'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Repay Debt
            </button>
          </div>
        ) : (
          <div className="flex p-1 rounded-2xl bg-surface-subtle border border-surface-border mb-6">
            <button
              onClick={() => {
                setCollateralTab('deposit_collateral');
                setAmount('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                collateralTab === 'deposit_collateral'
                  ? 'bg-surface-light text-purple-400 shadow-sm border border-surface-border'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deposit Collateral ({collateralToken.symbol})
            </button>
            <button
              onClick={() => {
                setCollateralTab('withdraw_collateral');
                setAmount('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                collateralTab === 'withdraw_collateral'
                  ? 'bg-surface-light text-purple-400 shadow-sm border border-surface-border'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Withdraw Collateral
            </button>
          </div>
        )}

        {/* Dynamic Context Header Bar */}
        <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-subtle border border-surface-border mb-4 font-mono">
          <span className="text-slate-400">
            {mode === 'borrow_repay'
              ? borrowTab === 'borrow'
                ? 'Available Borrow Limit:'
                : 'Current Outstanding Debt:'
              : collateralTab === 'deposit_collateral'
              ? 'Wallet Collateral Available:'
              : 'Deposited Collateral:'}
          </span>
          <span className="text-slate-200 font-semibold">
            {mode === 'borrow_repay'
              ? borrowTab === 'borrow'
                ? `${availableBorrowTokens} ${borrowToken.symbol}`
                : `${positions.borrowedDebt} ${borrowToken.symbol}`
              : collateralTab === 'deposit_collateral'
              ? `${positions.collateralTokenBalance} ${collateralToken.symbol}`
              : `${positions.collateralBalance} ${collateralToken.symbol}`}
          </span>
        </div>

        {/* Input Box */}
        <div className="p-4 rounded-2xl bg-surface-light border border-surface-border mb-6 focus-within:border-amber-500/50 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Amount</span>
            <span>
              ≈ {formatUSD(amountNumber * activeToken.priceUSD)}
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
              className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-border border border-surface-border text-amber-400 font-mono text-xs font-semibold transition-all active:scale-95"
            >
              {mode === 'borrow_repay' && borrowTab === 'repay' ? 'REPAY ALL' : 'MAX'}
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                {activeToken.symbol[0]}
              </div>
              <span className="text-xs font-bold text-slate-200">{activeToken.symbol}</span>
            </div>
          </div>

          {/* Validation Warnings */}
          {isExceedingAvailableBorrow && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Borrow amount exceeds max available limit based on collateral factor (75% LTV)</span>
            </div>
          )}

          {isExceedingWalletCollateral && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Amount exceeds available collateral tokens in your wallet</span>
            </div>
          )}

          {isExceedingCollateralBalance && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Amount exceeds deposited collateral</span>
            </div>
          )}

          {isExceedingDebtRepay && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Repay amount exceeds total outstanding debt</span>
            </div>
          )}
        </div>

        {/* Real-time Health Factor Gauge with Dynamic Projection */}
        <div className="mb-6">
          <HealthFactorBar
            currentHF={positions.healthFactor}
            projectedHF={projectedHF}
            liquidationThreshold={marketStats.liquidationThreshold}
          />
        </div>

        {/* Critical Safety Liquidation Blocker Warning */}
        {isCriticalLiquidation && (borrowTab === 'borrow' || collateralTab === 'withdraw_collateral') && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <strong className="block text-rose-400 font-bold">Unsafe Action Blocked</strong>
              This transaction would reduce your Health Factor below 1.05, placing your loan in immediate liquidation. Reduce the amount or deposit collateral first.
            </div>
          </div>
        )}

        {/* Action Buttons: Handle Approve step if needed, else direct execution */}
        {!hasAllowance ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleApprove}
              disabled={isApproving || isTransacting}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-surface-light hover:bg-surface-border text-slate-100 border border-surface-border active:scale-98 disabled:opacity-40"
            >
              {isApproving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Approving {activeToken.symbol}...</span>
                </>
              ) : (
                <span>1. Approve {activeToken.symbol}</span>
              )}
            </button>

            <button
              disabled
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-surface-border/50 text-slate-500 cursor-not-allowed"
            >
              <span>2. {mode === 'borrow_repay' ? 'Repay' : 'Deposit'}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleAction}
            disabled={
              parsedAmount <= 0n ||
              isTransacting ||
              isExceedingAvailableBorrow ||
              isExceedingCollateralBalance ||
              isExceedingWalletCollateral ||
              (isCriticalLiquidation && (borrowTab === 'borrow' || collateralTab === 'withdraw_collateral'))
            }
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 transition-all shadow-md active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isTransacting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'borrow_repay' ? (
              borrowTab === 'borrow' ? (
                <span>Borrow {amount ? `${amount} ${borrowToken.symbol}` : borrowToken.symbol}</span>
              ) : (
                <span>Repay {amount ? `${amount} ${borrowToken.symbol}` : borrowToken.symbol}</span>
              )
            ) : collateralTab === 'deposit_collateral' ? (
              <span>Deposit {amount ? `${amount} ${collateralToken.symbol}` : collateralToken.symbol} Collateral</span>
            ) : (
              <span>Withdraw {amount ? `${amount} ${collateralToken.symbol}` : collateralToken.symbol} Collateral</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
