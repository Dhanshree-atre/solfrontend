# AetherDeFi — Modern Responsive DeFi Frontend dApp

A modern, responsive, non-custodial decentralized finance (DeFi) web application built with **React**, **Vite**, **TypeScript**, **ethers.js v6**, and **Tailwind CSS**.

Supports complete DeFi primitives: **Vault Deposit & Withdraw**, **Staking Pool & Claim Yield**, **Lending (Supply)**, and **Collateralized Borrow & Repay** with live **Health Factor liquidation risk analysis**.

---

## 🌟 Key Features

1. **MetaMask Wallet Integration (ethers.js v6 `BrowserProvider`)**
   - Seamless connect / disconnect flow.
   - Displays shortened address (`0x1234...abcd`) and native ETH balance.
   - Automatically detects if MetaMask is not installed and provides an "Install MetaMask" button.
   - Reacts to `accountsChanged` and `chainChanged` events.
   - **Wrong Network Banner**: Displays when on an incorrect chain with a 1-click **"Switch Network"** button (`wallet_switchEthereumChain` / `wallet_addEthereumChain`).
   - Persists wallet connection across browser refreshes via `localStorage`.

2. **Deposit / Withdraw (Vault)**
   - Deposit and Withdraw tabs.
   - Input amount validation with **MAX** button and real-time USD conversion.
   - **Two-Step Approval Flow**: Clearly displays Step 1 (Approve Token) followed by Step 2 (Deposit).

3. **Staking & Reward Pool**
   - Stake and Unstake tabs with APR badge.
   - Real-time pending rewards accrual counter.
   - **Claim Rewards** button with transaction toast and Etherscan link.

4. **Lend (Supply) Pool**
   - Supply liquidity to earn dynamic lending APY.
   - Displays pool Supply APY, total pool liquidity, your supplied balance, and interest accrued.
   - Two-step approve & supply flow.

5. **Borrow & Collateral Management**
   - **Borrow & Repay** tabs: Borrow stable assets against your collateral; "Repay All" 1-click option.
   - **Manage Collateral** section: Deposit or withdraw collateral (e.g., WETH).
   - Displays borrow APY, available borrow limit, current debt, and collateral value.
   - **Dynamic Health Factor Gauge**:
     - 🟢 **Healthy / Safe** (> 1.5)
     - 🟡 **Moderate Risk** (1.1 – 1.5)
     - 🔴 **Danger / High Risk** (< 1.1)
   - **Projected Health Factor**: Dynamically projects what your Health Factor will become *before* you confirm a transaction!
   - **Liquidation Safety Blocker**: Prevents borrow or collateral withdrawal actions that would drop the Health Factor below 1.05.

6. **Dashboard & Markets Overview**
   - Total Net Portfolio Worth, Blended Net APY, Assets vs. Debt.
   - Global Protocol Statistics: Total Supplied, Total Borrowed, Pool Utilization progress bar.
   - Auto-refreshes after every transaction and polls automatically every **15 seconds**.

7. **Interactive Demo Sandbox & Built-in Faucet**
   - Switch between **Live Contract Mode** and **Demo Sandbox Mode** with one click.
   - Includes a built-in **Test Faucet** to mint mock USDC, WETH, and AETH tokens for risk-free testing.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Web3**: ethers.js v6 (`BrowserProvider`, `JsonRpcSigner`, `Contract`)
- **Styling**: Tailwind CSS (Dark theme with custom color palette & glow effects)
- **Icons**: Lucide React
- **Notifications**: `react-hot-toast` with clickable Etherscan transaction links

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or navigate into the repository
cd solfrontend

# Install dependencies
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
npm run preview
```

---

## ⚙️ How to Configure Contract Addresses and ABIs

### Contract Addresses & Chain Settings

You can customize contract addresses in either **`src/config/contracts.ts`** or by creating a **`.env`** file.

#### Option A: Using `.env` (Recommended)

Copy `.env.example` to `.env` and fill in your deployed contract addresses:

```env
# Network RPC URL (Sepolia Testnet)
VITE_RPC_URL=https://rpc.sepolia.org

# Smart Contract Addresses
VITE_STAKING_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e
VITE_LENDING_POOL_ADDRESS=0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE
VITE_SUPPLY_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
VITE_COLLATERAL_TOKEN_ADDRESS=0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9
VITE_BORROW_TOKEN_ADDRESS=0x3e622317f8C93f7328350cF0B56318C818855829
VITE_STAKING_TOKEN_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

#### Option B: Directly in `src/config/contracts.ts`

Open [src/config/contracts.ts](file:///d:/solfrontend/src/config/contracts.ts):

```typescript
export const SUPPORTED_CHAIN: ChainConfig = {
  chainId: 11155111, // Sepolia Testnet (Change to 1 for Mainnet, 137 for Polygon, etc.)
  chainHex: '0xaa36a7',
  chainName: 'Sepolia Testnet',
  ...
};

export const CONTRACT_ADDRESSES = {
  STAKING: '0x...',          // Your deployed Staking contract
  LENDING_POOL: '0x...',     // Your deployed Lending Pool contract
  SUPPLY_TOKEN: '0x...',     // Your ERC20 supply token
  COLLATERAL_TOKEN: '0x...', // Your ERC20 collateral token (e.g. WETH)
  BORROW_TOKEN: '0x...',     // Your ERC20 borrow token (e.g. DAI)
  STAKING_TOKEN: '0x...',    // Your Staking token
};
```

---

### Contract ABIs

All ABI JSON files are located in `src/abi/`:

- [src/abi/LendingPoolABI.json](file:///d:/solfrontend/src/abi/LendingPoolABI.json):
  - `deposit(uint256)`, `withdraw(uint256)`
  - `supply(uint256)`, `withdrawSupply(uint256)`
  - `depositCollateral(uint256)`, `withdrawCollateral(uint256)`
  - `borrow(uint256)`, `repay(uint256)`
  - View functions: `balanceOf`, `userCollateral`, `userDebt`, `getHealthFactor`, `borrowRate`, `supplyRate`, `totalSupply`, `totalBorrowed`
- [src/abi/StakingABI.json](file:///d:/solfrontend/src/abi/StakingABI.json):
  - `stake(uint256)`, `unstake(uint256)`, `claimRewards()`
  - View functions: `stakedBalance(address)`, `balanceOf(address)`, `pendingRewards(address)`, `rewardRate()`
- [src/abi/ERC20ABI.json](file:///d:/solfrontend/src/abi/ERC20ABI.json):
  - Standard ERC20: `approve`, `allowance`, `balanceOf`, `transfer`, `transferFrom`, `mint`

Simply replace the JSON content in these files if your contract has custom parameters or event definitions.

---

## 📁 Project Structure

```
solfrontend/
├── index.html                  # HTML entry point with fonts & dark theme
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS theme extension
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite configuration
├── .env.example                # Environment variables template
├── src/
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Root component & tab router
│   ├── index.css               # Global Tailwind directives & scrollbars
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces (WalletState, UserPositions, MarketStats)
│   ├── config/
│   │   └── contracts.ts        # Contract addresses, token metadata & chain configs
│   ├── abi/
│   │   ├── ERC20ABI.json       # ERC20 interface
│   │   ├── LendingPoolABI.json # Lending & borrowing pool interface
│   │   └── StakingABI.json     # Staking & rewards pool interface
│   ├── utils/
│   │   ├── formatters.ts       # shortenAddress, formatUSD, formatPercent, getHealthFactorStatus
│   │   ├── parseError.ts       # Friendly MetaMask / revert error message parser
│   │   └── explorer.ts         # Etherscan link generators
│   ├── hooks/
│   │   ├── useWallet.tsx       # MetaMask provider, signer, account listeners, network switch
│   │   ├── useContract.ts      # Typed ethers.js Contract instances
│   │   └── useLendingData.ts   # On-chain queries, 15s polling & interactive simulation
│   └── components/
│       ├── Header.tsx          # Top navigation, mode switch, faucet trigger, ConnectButton
│       ├── ConnectButton.tsx   # MetaMask connect dropdown with balance, copy & explorer
│       ├── NetworkBanner.tsx   # Wrong-network warning banner with 1-click switch
│       ├── HealthFactorBar.tsx # Dynamic health factor visual gauge & projection
│       ├── Dashboard.tsx       # Portfolio overview, market stats & pool utilization bar
│       ├── DepositCard.tsx     # Vault deposit/withdraw with two-step approval
│       ├── StakeCard.tsx       # Staking pool, APY badge & claim rewards
│       ├── LendCard.tsx        # Lending supply & withdraw with APY tracking
│       ├── BorrowCard.tsx      # Borrow, repay, collateral management & safety blockers
│       └── FaucetModal.tsx     # Testnet faucet for instant testing
```

---

## 🛡️ Error Handling & UX Highlights

- **User Rejected Signature (Error 4001)**: Intercepted and surfaced as a clean toast: *"Transaction rejected by user in wallet."*
- **Insufficient Funds**: Detects when wallet lacks ETH for gas and alerts the user immediately.
- **Smart Contract Reverts**: Extracts revert reasons from ethers v6 exceptions (`execution reverted: <reason>`).
- **Interactive Sandbox / Live Toggle**: When testing locally without deployed contracts or testnet gas, toggle to "Demo Sandbox" to test the complete user experience end-to-end.
- **Auto-Refresh**: Positions refresh automatically after every confirmed transaction and poll every 15 seconds.

---

## 📄 License
MIT License. Free to use and modify for your decentralized finance projects.
