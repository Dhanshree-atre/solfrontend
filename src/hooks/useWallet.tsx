import React, { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner, formatEther } from 'ethers';
import { SUPPORTED_CHAIN } from '../config/contracts';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum);

  // Check if current chain matches the supported chain
  const isCorrectNetwork = chainId === SUPPORTED_CHAIN.chainId;

  // Refresh native ETH balance
  const refreshBalance = useCallback(async (userAddress: string, activeProvider: BrowserProvider) => {
    try {
      const bal = await activeProvider.getBalance(userAddress);
      setBalance(parseFloat(formatEther(bal)).toFixed(4));
    } catch (err) {
      console.warn('Failed to fetch ETH balance:', err);
    }
  }, []);

  // Switch network helper
  const switchNetwork = useCallback(async (targetChainId: number = SUPPORTED_CHAIN.chainId): Promise<boolean> => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed');
      return false;
    }

    const hexChainId = `0x${targetChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      return true;
    } catch (switchError: any) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: SUPPORTED_CHAIN.chainName,
                nativeCurrency: SUPPORTED_CHAIN.nativeCurrency,
                rpcUrls: SUPPORTED_CHAIN.rpcUrls,
                blockExplorerUrls: SUPPORTED_CHAIN.blockExplorerUrls,
              },
            ],
          });
          return true;
        } catch (addError) {
          toast.error('Failed to add network to MetaMask');
          return false;
        }
      }
      toast.error(switchError.message || 'Failed to switch network');
      return false;
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not found. Please install MetaMask to connect your wallet.');
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected');
      }

      const activeAccount = accounts[0];
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      const activeSigner = await browserProvider.getSigner();

      setAccount(activeAccount);
      setChainId(currentChainId);
      setProvider(browserProvider);
      setSigner(activeSigner);
      localStorage.setItem('defi_wallet_connected', 'true');

      await refreshBalance(activeAccount, browserProvider);

      if (currentChainId !== SUPPORTED_CHAIN.chainId) {
        toast(
          () => (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-amber-400">Wrong Network Detected</span>
              <span className="text-xs text-slate-300">
                Please switch to {SUPPORTED_CHAIN.chainName} (Chain ID: {SUPPORTED_CHAIN.chainId})
              </span>
            </div>
          ),
          { icon: '⚠️', duration: 5000 }
        );
      } else {
        toast.success(`Connected to ${activeAccount.substring(0, 6)}...${activeAccount.substring(38)}`);
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        toast.error('Connection request rejected');
      } else {
        toast.error(error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [refreshBalance]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalance('0.00');
    setProvider(null);
    setSigner(null);
    localStorage.removeItem('defi_wallet_connected');
    toast.success('Wallet disconnected');
  }, []);

  // Initialize and persist connection
  useEffect(() => {
    if (!window.ethereum) return;

    const autoConnect = async () => {
      const previouslyConnected = localStorage.getItem('defi_wallet_connected') === 'true';
      if (!previouslyConnected) return;

      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        
        if (accounts && accounts.length > 0) {
          const activeAccount = accounts[0];
          const network = await browserProvider.getNetwork();
          const currentChainId = Number(network.chainId);
          const activeSigner = await browserProvider.getSigner();

          setAccount(activeAccount);
          setChainId(currentChainId);
          setProvider(browserProvider);
          setSigner(activeSigner);
          await refreshBalance(activeAccount, browserProvider);
        } else {
          localStorage.removeItem('defi_wallet_connected');
        }
      } catch (err) {
        console.warn('Auto-reconnect error:', err);
      }
    };

    autoConnect();

    // Event listeners
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        if (provider) {
          provider.getSigner().then(setSigner);
          refreshBalance(accounts[0], provider);
        }
        toast(`Account switched to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`, { icon: '🔄' });
      }
    };

    const handleChainChanged = (chainHex: string) => {
      const newChainId = parseInt(chainHex, 16);
      setChainId(newChainId);
      if (provider && account) {
        refreshBalance(account, provider);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnect, provider, refreshBalance, account]);

  return {
    account,
    chainId,
    balance,
    isConnected: Boolean(account),
    isConnecting,
    isCorrectNetwork,
    isMetaMaskInstalled,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance: () => {
      if (account && provider) refreshBalance(account, provider);
    },
  };
}
