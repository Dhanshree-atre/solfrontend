import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  balance: string; // ETH balance
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (targetChainId?: number) => Promise<boolean>;
}

export interface TokenConfig {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  iconBg: string;
  priceUSD: number;
}

export interface UserPositions {
  // Vault
  vaultBalance: string;
  vaultBalanceRaw: bigint;
  
  // Staking
  stakedBalance: string;
  stakedBalanceRaw: bigint;
  pendingRewards: string;
  pendingRewardsRaw: bigint;
  
  // Lending & Collateral
  suppliedBalance: string;
  suppliedBalanceRaw: bigint;
  earnedInterest: string;
  
  collateralBalance: string;
  collateralBalanceRaw: bigint;
  
  // Borrow & Debt
  borrowedDebt: string;
  borrowedDebtRaw: bigint;
  
  // Risk metrics
  healthFactor: number;
  maxBorrowLimit: string;
  availableBorrow: string;
  liquidationPriceUSD: number;
  
  // Wallet Token Balances
  supplyTokenBalance: string;
  supplyTokenBalanceRaw: bigint;
  supplyTokenAllowance: bigint;
  
  collateralTokenBalance: string;
  collateralTokenBalanceRaw: bigint;
  collateralTokenAllowance: bigint;
  
  stakingTokenBalance: string;
  stakingTokenBalanceRaw: bigint;
  stakingTokenAllowance: bigint;
  
  repayTokenAllowance: bigint;
}

export interface MarketStats {
  totalSupplyUSD: number;
  totalBorrowedUSD: number;
  availableLiquidityUSD: number;
  utilizationRate: number; // 0 - 100 percentage
  supplyApy: number; // e.g. 5.2%
  borrowApy: number; // e.g. 8.4%
  stakingApy: number; // e.g. 15.0%
  netApy: number;
  collateralFactor: number; // 0.75 (75%)
  liquidationThreshold: number; // 0.80 (80%)
}

export type TabType = 'dashboard' | 'deposit' | 'stake' | 'lend' | 'borrow';
