import React, { useState } from 'react';
import { TabType } from '../types';
import { ConnectButton } from './ConnectButton';
import { SUPPORTED_CHAIN } from '../config/contracts';
import { 
  Layers, 
  Coins, 
  ArrowDownCircle, 
  TrendingUp, 
  Sparkles, 
  Menu, 
  X, 
  Droplets,
  Sliders,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  account: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  isCorrectNetwork: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenFaucet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  account,
  balance,
  isConnected,
  isConnecting,
  isMetaMaskInstalled,
  isCorrectNetwork,
  onConnect,
  onDisconnect,
  isDemoMode,
  onToggleDemoMode,
  onOpenFaucet,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'deposit', label: 'Deposit / Withdraw', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { id: 'stake', label: 'Stake & Earn', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'lend', label: 'Lend (Supply)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'borrow', label: 'Borrow & Collateral', icon: <Coins className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-glow-primary transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    Aether<span className="text-emerald-400">DeFi</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    v2.5
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:block">
                  Lending & Staking Protocol
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-surface-subtle p-1 rounded-2xl border border-surface-border">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-surface-light text-emerald-400 shadow-sm border border-surface-border'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Switch Pill */}
            <button
              onClick={onToggleDemoMode}
              title="Toggle between Live On-chain contracts and Interactive Simulation mode"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isDemoMode
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isDemoMode ? 'Demo Sandbox' : 'Live Contract'}</span>
            </button>

            {/* Test Faucet Button */}
            <button
              onClick={onOpenFaucet}
              title="Get test tokens for supply, stake, collateral"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-medium transition-all"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Faucet</span>
            </button>

            {/* Network Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface border border-surface-border text-xs text-slate-300 font-mono">
              <span className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{SUPPORTED_CHAIN.chainName.split(' ')[0]}</span>
            </div>

            {/* Connect Wallet Button */}
            <ConnectButton
              account={account}
              balance={balance}
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMetaMaskInstalled={isMetaMaskInstalled}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-surface border border-surface-border text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-surface-border animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-left ${
                      isActive
                        ? 'bg-surface-light text-emerald-400 border border-surface-border'
                        : 'bg-surface text-slate-300 hover:bg-surface-light'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs">
              <button
                onClick={onToggleDemoMode}
                className="flex items-center gap-1 text-slate-400 hover:text-white"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Mode: {isDemoMode ? 'Demo Sandbox' : 'Live Contract'}</span>
              </button>
              <div className="text-slate-400 font-mono">
                {SUPPORTED_CHAIN.chainName}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
