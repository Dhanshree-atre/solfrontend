import React, { useState } from 'react';
import { X, Droplets, RotateCcw, Check, Sparkles, ExternalLink } from 'lucide-react';
import { TOKENS, SUPPORTED_CHAIN } from '../config/contracts';
import { parseUnits } from 'ethers';
import toast from 'react-hot-toast';

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateDemoPosition: (updater: any) => void;
  onReset: () => void;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  updateDemoPosition,
  onReset,
}) => {
  const [mintingToken, setMintingToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMintTestTokens = (symbol: string, amount: string, decimals: number) => {
    setMintingToken(symbol);
    setTimeout(() => {
      const added = parseUnits(amount, decimals);
      updateDemoPosition((prev: any) => {
        if (symbol === 'USDC') {
          return { ...prev, supplyTokenBalance: prev.supplyTokenBalance + added };
        } else if (symbol === 'WETH') {
          return { ...prev, collateralTokenBalance: prev.collateralTokenBalance + added };
        } else if (symbol === 'AETH') {
          return { ...prev, stakingTokenBalance: prev.stakingTokenBalance + added };
        }
        return prev;
      });
      setMintingToken(null);
      toast.success(`Minted +${amount} ${symbol} test tokens to your balance!`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-surface border border-surface-border shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-surface-subtle hover:bg-surface-border text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Testnet &amp; Demo Faucet</h3>
            <p className="text-xs text-slate-400">Claim mock tokens to test deposits, staking, lending and collateral</p>
          </div>
        </div>

        {/* Token Faucet List */}
        <div className="space-y-3 mb-6">
          {/* USDC */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                $
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">USD Coin (USDC)</span>
                <span className="text-[11px] text-slate-400">Used for Deposit &amp; Supply</span>
              </div>
            </div>
            <button
              onClick={() => handleMintTestTokens('USDC', '2500', TOKENS.SUPPLY.decimals)}
              disabled={mintingToken === 'USDC'}
              className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {mintingToken === 'USDC' ? 'Minting...' : '+2,500 USDC'}
            </button>
          </div>

          {/* WETH */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                Ξ
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Wrapped Ether (WETH)</span>
                <span className="text-[11px] text-slate-400">Used for Borrow Collateral</span>
              </div>
            </div>
            <button
              onClick={() => handleMintTestTokens('WETH', '5', TOKENS.COLLATERAL.decimals)}
              disabled={mintingToken === 'WETH'}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {mintingToken === 'WETH' ? 'Minting...' : '+5.0 WETH'}
            </button>
          </div>

          {/* AETH */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Aether Protocol (AETH)</span>
                <span className="text-[11px] text-slate-400">Used for Staking Pool</span>
              </div>
            </div>
            <button
              onClick={() => handleMintTestTokens('AETH', '1000', TOKENS.STAKING.decimals)}
              disabled={mintingToken === 'AETH'}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {mintingToken === 'AETH' ? 'Minting...' : '+1,000 AETH'}
            </button>
          </div>
        </div>

        {/* Testnet Sepolia ETH link */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 mb-5 text-xs">
          <div className="text-slate-300 font-medium mb-1">Need Sepolia ETH for Gas?</div>
          <p className="text-[11px] text-slate-400 mb-2">
            Get free Sepolia testnet ETH from official faucets to broadcast live smart contract transactions.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://sepoliafaucet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              Alchemy Sepolia Faucet <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              Google Cloud Faucet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-border">
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Balances</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border text-slate-200 text-xs font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
