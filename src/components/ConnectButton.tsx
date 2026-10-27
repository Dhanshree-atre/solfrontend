import React, { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, ExternalLink, Copy, Check, LogOut, Download } from 'lucide-react';
import { shortenAddress } from '../utils/formatters';
import { getAddressExplorerUrl } from '../utils/explorer';
import { SUPPORTED_CHAIN } from '../config/contracts';
import toast from 'react-hot-toast';

interface ConnectButtonProps {
  account: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  account,
  balance,
  isConnected,
  isConnecting,
  isMetaMaskInstalled,
  onConnect,
  onDisconnect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Case 1: MetaMask not installed
  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-sm font-medium transition-all"
      >
        <Download className="w-4 h-4" />
        <span>Install MetaMask</span>
      </a>
    );
  }

  // Case 2: Not connected
  if (!isConnected || !account) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-sm transition-all shadow-glow-primary active:scale-95 disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    );
  }

  // Case 3: Connected state with account pill and dropdown menu
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-light hover:bg-surface-border/60 border border-surface-border text-slate-200 text-sm font-medium transition-all"
      >
        {/* Balance chip */}
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-surface text-slate-300 font-mono text-xs">
          {balance} {SUPPORTED_CHAIN.nativeCurrency.symbol}
        </span>

        {/* Status dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        {/* Address */}
        <span className="font-mono text-xs font-semibold">{shortenAddress(account)}</span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-surface-border shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-surface-border/60 mb-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Connected Account</span>
            <span className="font-mono text-xs text-slate-200 break-all">{account}</span>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>Balance:</span>
              <span className="font-mono text-slate-200 font-medium">{balance} ETH</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 text-sm">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-light transition-colors text-left"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Address'}</span>
            </button>

            <a
              href={getAddressExplorerUrl(account)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-light transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>View on Etherscan</span>
            </a>

            <div className="h-px bg-surface-border/50 my-1"></div>

            <button
              onClick={() => {
                setIsOpen(false);
                onDisconnect();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
