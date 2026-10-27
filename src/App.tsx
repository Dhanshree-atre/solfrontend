import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWallet } from './hooks/useWallet';
import { useLendingData } from './hooks/useLendingData';
import { TabType } from './types';
import { Header } from './components/Header';
import { NetworkBanner } from './components/NetworkBanner';
import { Dashboard } from './components/Dashboard';
import { DepositCard } from './components/DepositCard';
import { StakeCard } from './components/StakeCard';
import { LendCard } from './components/LendCard';
import { BorrowCard } from './components/BorrowCard';
import { FaucetModal } from './components/FaucetModal';
import { SUPPORTED_CHAIN, CONTRACT_ADDRESSES } from './config/contracts';
import { getAddressExplorerUrl } from './utils/explorer';
import { ShieldCheck, ExternalLink, Code2, Globe2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [faucetOpen, setFaucetOpen] = useState<boolean>(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState<boolean>(false);

  // Wallet Connection
  const {
    account,
    chainId,
    balance: ethBalance,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    isMetaMaskInstalled,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  // Lending & Staking Protocol Data
  const {
    positions,
    marketStats,
    isLoading,
    isRefreshing,
    isDemoMode,
    toggleDemoMode,
    refetch,
    updateDemoPosition,
    resetDemoBalances,
  } = useLendingData(account, provider, signer);

  const handleSwitchNetwork = async () => {
    setIsSwitchingNetwork(true);
    await switchNetwork(SUPPORTED_CHAIN.chainId);
    setIsSwitchingNetwork(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100 font-sans selection:bg-emerald-500/20">
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          style: {
            background: '#121721',
            color: '#f8fafc',
            border: '1px solid #242F44',
            borderRadius: '1rem',
            padding: '12px 16px',
            fontSize: '0.875rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#121721',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#121721',
            },
          },
        }}
      />

      {/* Wrong Network Notification Banner */}
      <NetworkBanner
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
        currentChainId={chainId}
        onSwitchNetwork={handleSwitchNetwork}
        isSwitching={isSwitchingNetwork}
      />

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        account={account}
        balance={ethBalance}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isMetaMaskInstalled={isMetaMaskInstalled}
        isCorrectNetwork={isCorrectNetwork}
        onConnect={connect}
        onDisconnect={disconnect}
        isDemoMode={isDemoMode}
        onToggleDemoMode={toggleDemoMode}
        onOpenFaucet={() => setFaucetOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            positions={positions}
            marketStats={marketStats}
            account={account}
            ethBalance={ethBalance}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={refetch}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'deposit' && (
          <DepositCard
            positions={positions}
            account={account}
            signer={signer}
            provider={provider}
            isDemoMode={isDemoMode}
            onRefresh={refetch}
            updateDemoPosition={updateDemoPosition}
          />
        )}

        {activeTab === 'stake' && (
          <StakeCard
            positions={positions}
            stakingApy={marketStats.stakingApy}
            account={account}
            signer={signer}
            provider={provider}
            isDemoMode={isDemoMode}
            onRefresh={refetch}
            updateDemoPosition={updateDemoPosition}
          />
        )}

        {activeTab === 'lend' && (
          <LendCard
            positions={positions}
            marketStats={marketStats}
            account={account}
            signer={signer}
            provider={provider}
            isDemoMode={isDemoMode}
            onRefresh={refetch}
            updateDemoPosition={updateDemoPosition}
          />
        )}

        {activeTab === 'borrow' && (
          <BorrowCard
            positions={positions}
            marketStats={marketStats}
            account={account}
            signer={signer}
            provider={provider}
            isDemoMode={isDemoMode}
            onRefresh={refetch}
            updateDemoPosition={updateDemoPosition}
          />
        )}
      </main>

      {/* Test Faucet Modal */}
      <FaucetModal
        isOpen={faucetOpen}
        onClose={() => setFaucetOpen(false)}
        updateDemoPosition={updateDemoPosition}
        onReset={resetDemoBalances}
      />

      {/* Bottom Footer */}
      <footer className="w-full border-t border-surface-border bg-surface-subtle mt-12 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              AetherDeFi &bull; Decentralized Non-Custodial Smart Contract Protocol
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <a
              href={getAddressExplorerUrl(CONTRACT_ADDRESSES.LENDING_POOL)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <span>Lending Pool Contract</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <span>•</span>

            <a
              href={getAddressExplorerUrl(CONTRACT_ADDRESSES.STAKING)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <span>Staking Contract</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <span>•</span>

            <span className="flex items-center gap-1 text-slate-400">
              <Globe2 className="w-3 h-3 text-cyan-400" />
              <span>{SUPPORTED_CHAIN.chainName} ({SUPPORTED_CHAIN.chainId})</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
