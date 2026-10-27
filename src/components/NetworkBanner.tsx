import React from 'react';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { SUPPORTED_CHAIN } from '../config/contracts';

interface NetworkBannerProps {
  isCorrectNetwork: boolean;
  isConnected: boolean;
  currentChainId: number | null;
  onSwitchNetwork: () => void;
  isSwitching?: boolean;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({
  isCorrectNetwork,
  isConnected,
  currentChainId,
  onSwitchNetwork,
  isSwitching = false,
}) => {
  if (!isConnected || isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>
            You are connected to an unsupported network (Chain ID: <span className="font-mono">{currentChainId || 'Unknown'}</span>).
            Please switch to <strong>{SUPPORTED_CHAIN.chainName}</strong> (Chain ID: {SUPPORTED_CHAIN.chainId}) to execute transactions.
          </span>
        </div>
        <button
          onClick={onSwitchNetwork}
          disabled={isSwitching}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isSwitching ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Switching...
            </>
          ) : (
            <>
              Switch Network
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
