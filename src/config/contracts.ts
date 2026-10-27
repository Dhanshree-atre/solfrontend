/**
 * ============================================================================================
 * CONTRACT & NETWORK CONFIGURATION
 * ============================================================================================
 * Update the contract addresses and chain settings below with your deployed addresses.
 * You can also specify environment variables in a .env file (see .env.example).
 * ============================================================================================
 */

export interface ChainConfig {
  chainId: number;
  chainHex: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const SUPPORTED_CHAIN: ChainConfig = {
  chainId: 11155111, // Sepolia Testnet (Change to 1 for Ethereum Mainnet, 137 for Polygon, etc.)
  chainHex: '0xaa36a7',
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.org',
    'https://ethereum-sepolia-rpc.publicnode.com',
  ],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

/**
 * SMART CONTRACT ADDRESSES
 * -------------------------------------------------------------
 * 1. Replace the addresses below with your deployed contract addresses on Sepolia (or your network).
 * 2. If left as default mock addresses or if contracts don't exist on-chain,
 *    the dApp automatically activates Demo/Simulation Mode so you can test all features!
 */
export const CONTRACT_ADDRESSES = {
  // Staking Contract address (stake, unstake, claimRewards, stakedBalance, pendingRewards)
  STAKING: import.meta.env.VITE_STAKING_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',

  // Lending Pool Contract address (deposit, withdraw, supply, withdrawSupply, depositCollateral, withdrawCollateral, borrow, repay)
  LENDING_POOL: import.meta.env.VITE_LENDING_POOL_ADDRESS || '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',

  // Supply / Deposit Token (e.g. USDC, 6 decimals or 18 decimals)
  SUPPLY_TOKEN: import.meta.env.VITE_SUPPLY_TOKEN_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC

  // Collateral Token (e.g. WETH, 18 decimals)
  COLLATERAL_TOKEN: import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS || '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // Sepolia WETH

  // Borrow Token (e.g. DAI / USDC, 18 decimals)
  BORROW_TOKEN: import.meta.env.VITE_BORROW_TOKEN_ADDRESS || '0x3e622317f8C93f7328350cF0B56318C818855829', // Sepolia DAI

  // Staking Token (e.g. AETH / GOV token)
  STAKING_TOKEN: import.meta.env.VITE_STAKING_TOKEN_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
};

/**
 * TOKEN METADATA & CONFIGURATIONS
 */
export const TOKENS = {
  SUPPLY: {
    address: CONTRACT_ADDRESSES.SUPPLY_TOKEN,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1.0,
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  COLLATERAL: {
    address: CONTRACT_ADDRESSES.COLLATERAL_TOKEN,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2850.0,
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  BORROW: {
    address: CONTRACT_ADDRESSES.BORROW_TOKEN,
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    priceUSD: 1.0,
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  STAKING: {
    address: CONTRACT_ADDRESSES.STAKING_TOKEN,
    name: 'Aether Protocol Token',
    symbol: 'AETH',
    decimals: 18,
    priceUSD: 12.5,
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
};

/**
 * PROTOCOL PARAMETERS
 */
export const PROTOCOL_CONFIG = {
  COLLATERAL_FACTOR: 0.75, // 75% max LTV
  LIQUIDATION_THRESHOLD: 0.80, // 80% liquidation threshold
  LIQUIDATION_PENALTY: 0.05, // 5% liquidation bonus
  SAFE_HEALTH_FACTOR: 1.5,
  WARNING_HEALTH_FACTOR: 1.1,
  POLLING_INTERVAL_MS: 15000, // 15 seconds polling for fresh stats
};
