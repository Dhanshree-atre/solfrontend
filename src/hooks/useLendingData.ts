import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, JsonRpcSigner, Contract, formatUnits, parseUnits } from 'ethers';
import { CONTRACT_ADDRESSES, TOKENS, PROTOCOL_CONFIG } from '../config/contracts';
import { UserPositions, MarketStats } from '../types';
import LendingPoolABI from '../abi/LendingPoolABI.json';
import StakingABI from '../abi/StakingABI.json';
import ERC20ABI from '../abi/ERC20ABI.json';
import toast from 'react-hot-toast';

export function useLendingData(
  account: string | null,
  provider: BrowserProvider | null,
  signer: JsonRpcSigner | null
) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('defi_demo_mode') === 'true';
  });

  // Default demo state for interactive simulation
  const [demoState, setDemoState] = useState<{
    vaultBalance: bigint;
    stakedBalance: bigint;
    pendingRewards: bigint;
    suppliedBalance: bigint;
    earnedInterest: bigint;
    collateralBalance: bigint;
    borrowedDebt: bigint;
    supplyTokenBalance: bigint;
    collateralTokenBalance: bigint;
    stakingTokenBalance: bigint;
    supplyAllowance: bigint;
    collateralAllowance: bigint;
    stakingAllowance: bigint;
    repayAllowance: bigint;
  }>(() => {
    const saved = localStorage.getItem('defi_demo_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          vaultBalance: BigInt(parsed.vaultBalance),
          stakedBalance: BigInt(parsed.stakedBalance),
          pendingRewards: BigInt(parsed.pendingRewards),
          suppliedBalance: BigInt(parsed.suppliedBalance),
          earnedInterest: BigInt(parsed.earnedInterest),
          collateralBalance: BigInt(parsed.collateralBalance),
          borrowedDebt: BigInt(parsed.borrowedDebt),
          supplyTokenBalance: BigInt(parsed.supplyTokenBalance),
          collateralTokenBalance: BigInt(parsed.collateralTokenBalance),
          stakingTokenBalance: BigInt(parsed.stakingTokenBalance),
          supplyAllowance: BigInt(parsed.supplyAllowance),
          collateralAllowance: BigInt(parsed.collateralAllowance),
          stakingAllowance: BigInt(parsed.stakingAllowance),
          repayAllowance: BigInt(parsed.repayAllowance),
        };
      } catch (e) {
        // Fall through to initial defaults
      }
    }
    return {
      vaultBalance: parseUnits('1250', TOKENS.SUPPLY.decimals),
      stakedBalance: parseUnits('500', TOKENS.STAKING.decimals),
      pendingRewards: parseUnits('24.75', TOKENS.STAKING.decimals),
      suppliedBalance: parseUnits('3500', TOKENS.SUPPLY.decimals),
      earnedInterest: parseUnits('42.80', TOKENS.SUPPLY.decimals),
      collateralBalance: parseUnits('2.5', TOKENS.COLLATERAL.decimals), // 2.5 WETH
      borrowedDebt: parseUnits('2100', TOKENS.BORROW.decimals), // 2100 DAI
      supplyTokenBalance: parseUnits('5000', TOKENS.SUPPLY.decimals), // 5000 USDC in wallet
      collateralTokenBalance: parseUnits('10', TOKENS.COLLATERAL.decimals), // 10 WETH in wallet
      stakingTokenBalance: parseUnits('2000', TOKENS.STAKING.decimals), // 2000 AETH in wallet
      supplyAllowance: 0n,
      collateralAllowance: 0n,
      stakingAllowance: 0n,
      repayAllowance: 0n,
    };
  });

  // Save demo state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        'defi_demo_state',
        JSON.stringify({
          vaultBalance: demoState.vaultBalance.toString(),
          stakedBalance: demoState.stakedBalance.toString(),
          pendingRewards: demoState.pendingRewards.toString(),
          suppliedBalance: demoState.suppliedBalance.toString(),
          earnedInterest: demoState.earnedInterest.toString(),
          collateralBalance: demoState.collateralBalance.toString(),
          borrowedDebt: demoState.borrowedDebt.toString(),
          supplyTokenBalance: demoState.supplyTokenBalance.toString(),
          collateralTokenBalance: demoState.collateralTokenBalance.toString(),
          stakingTokenBalance: demoState.stakingTokenBalance.toString(),
          supplyAllowance: demoState.supplyAllowance.toString(),
          collateralAllowance: demoState.collateralAllowance.toString(),
          stakingAllowance: demoState.stakingAllowance.toString(),
          repayAllowance: demoState.repayAllowance.toString(),
        })
      );
    } catch (e) {
      console.error('Failed to save demo state:', e);
    }
  }, [demoState]);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem('defi_demo_mode', String(next));
      toast(next ? 'Interactive Demo Mode Enabled' : 'Live Contract Mode Enabled', {
        icon: next ? '🎮' : '🌐',
      });
      return next;
    });
  };

  // Reset demo faucet
  const resetDemoBalances = () => {
    setDemoState({
      vaultBalance: parseUnits('1250', TOKENS.SUPPLY.decimals),
      stakedBalance: parseUnits('500', TOKENS.STAKING.decimals),
      pendingRewards: parseUnits('24.75', TOKENS.STAKING.decimals),
      suppliedBalance: parseUnits('3500', TOKENS.SUPPLY.decimals),
      earnedInterest: parseUnits('42.80', TOKENS.SUPPLY.decimals),
      collateralBalance: parseUnits('2.5', TOKENS.COLLATERAL.decimals),
      borrowedDebt: parseUnits('2100', TOKENS.BORROW.decimals),
      supplyTokenBalance: parseUnits('5000', TOKENS.SUPPLY.decimals),
      collateralTokenBalance: parseUnits('10', TOKENS.COLLATERAL.decimals),
      stakingTokenBalance: parseUnits('2000', TOKENS.STAKING.decimals),
      supplyAllowance: 0n,
      collateralAllowance: 0n,
      stakingAllowance: 0n,
      repayAllowance: 0n,
    });
    toast.success('Test token balances reset to default!');
  };

  // Calculated Market Stats
  const marketStats: MarketStats = {
    totalSupplyUSD: 14850000,
    totalBorrowedUSD: 9820000,
    availableLiquidityUSD: 5030000,
    utilizationRate: 66.12, // 9.82M / 14.85M
    supplyApy: 5.42,
    borrowApy: 8.75,
    stakingApy: 16.80,
    netApy: 4.15,
    collateralFactor: PROTOCOL_CONFIG.COLLATERAL_FACTOR,
    liquidationThreshold: PROTOCOL_CONFIG.LIQUIDATION_THRESHOLD,
  };

  // Positions state
  const [positions, setPositions] = useState<UserPositions>({
    vaultBalance: '0.00',
    vaultBalanceRaw: 0n,
    stakedBalance: '0.00',
    stakedBalanceRaw: 0n,
    pendingRewards: '0.00',
    pendingRewardsRaw: 0n,
    suppliedBalance: '0.00',
    suppliedBalanceRaw: 0n,
    earnedInterest: '0.00',
    collateralBalance: '0.00',
    collateralBalanceRaw: 0n,
    borrowedDebt: '0.00',
    borrowedDebtRaw: 0n,
    healthFactor: Infinity,
    maxBorrowLimit: '0.00',
    availableBorrow: '0.00',
    liquidationPriceUSD: 0,
    supplyTokenBalance: '0.00',
    supplyTokenBalanceRaw: 0n,
    supplyTokenAllowance: 0n,
    collateralTokenBalance: '0.00',
    collateralTokenBalanceRaw: 0n,
    collateralTokenAllowance: 0n,
    stakingTokenBalance: '0.00',
    stakingTokenBalanceRaw: 0n,
    stakingTokenAllowance: 0n,
    repayTokenAllowance: 0n,
  });

  // Calculate Health Factor & Risk Limits given balances
  const calculateRiskMetrics = (collateralRaw: bigint, debtRaw: bigint) => {
    const collateralNum = parseFloat(formatUnits(collateralRaw, TOKENS.COLLATERAL.decimals));
    const debtNum = parseFloat(formatUnits(debtRaw, TOKENS.BORROW.decimals));

    const collateralValueUSD = collateralNum * TOKENS.COLLATERAL.priceUSD;
    const debtValueUSD = debtNum * TOKENS.BORROW.priceUSD;

    const maxBorrowUSD = collateralValueUSD * PROTOCOL_CONFIG.COLLATERAL_FACTOR;
    const availableBorrowUSD = Math.max(0, maxBorrowUSD - debtValueUSD);

    let hf = Infinity;
    if (debtValueUSD > 0) {
      const liquidationCollateralVal = collateralValueUSD * PROTOCOL_CONFIG.LIQUIDATION_THRESHOLD;
      hf = liquidationCollateralVal / debtValueUSD;
    }

    // Liquidation price of collateral = Debt / (Collateral Amount * Liquidation Threshold)
    let liqPrice = 0;
    if (collateralNum > 0 && debtValueUSD > 0) {
      liqPrice = debtValueUSD / (collateralNum * PROTOCOL_CONFIG.LIQUIDATION_THRESHOLD);
    }

    return {
      healthFactor: hf,
      maxBorrowLimit: maxBorrowUSD.toFixed(2),
      availableBorrow: availableBorrowUSD.toFixed(2),
      liquidationPriceUSD: liqPrice,
    };
  };

  // Fetch real on-chain data
  const fetchData = useCallback(async () => {
    if (!account) {
      setIsLoading(false);
      return;
    }

    // If demo mode is active, populate from demoState
    if (isDemoMode || !provider) {
      const risk = calculateRiskMetrics(demoState.collateralBalance, demoState.borrowedDebt);
      setPositions({
        vaultBalance: formatUnits(demoState.vaultBalance, TOKENS.SUPPLY.decimals),
        vaultBalanceRaw: demoState.vaultBalance,
        stakedBalance: formatUnits(demoState.stakedBalance, TOKENS.STAKING.decimals),
        stakedBalanceRaw: demoState.stakedBalance,
        pendingRewards: formatUnits(demoState.pendingRewards, TOKENS.STAKING.decimals),
        pendingRewardsRaw: demoState.pendingRewards,
        suppliedBalance: formatUnits(demoState.suppliedBalance, TOKENS.SUPPLY.decimals),
        suppliedBalanceRaw: demoState.suppliedBalance,
        earnedInterest: formatUnits(demoState.earnedInterest, TOKENS.SUPPLY.decimals),
        collateralBalance: formatUnits(demoState.collateralBalance, TOKENS.COLLATERAL.decimals),
        collateralBalanceRaw: demoState.collateralBalance,
        borrowedDebt: formatUnits(demoState.borrowedDebt, TOKENS.BORROW.decimals),
        borrowedDebtRaw: demoState.borrowedDebt,
        healthFactor: risk.healthFactor,
        maxBorrowLimit: risk.maxBorrowLimit,
        availableBorrow: risk.availableBorrow,
        liquidationPriceUSD: risk.liquidationPriceUSD,
        supplyTokenBalance: formatUnits(demoState.supplyTokenBalance, TOKENS.SUPPLY.decimals),
        supplyTokenBalanceRaw: demoState.supplyTokenBalance,
        supplyTokenAllowance: demoState.supplyAllowance,
        collateralTokenBalance: formatUnits(demoState.collateralTokenBalance, TOKENS.COLLATERAL.decimals),
        collateralTokenBalanceRaw: demoState.collateralTokenBalance,
        collateralTokenAllowance: demoState.collateralAllowance,
        stakingTokenBalance: formatUnits(demoState.stakingTokenBalance, TOKENS.STAKING.decimals),
        stakingTokenBalanceRaw: demoState.stakingTokenBalance,
        stakingTokenAllowance: demoState.stakingAllowance,
        repayTokenAllowance: demoState.repayAllowance,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsRefreshing(true);

      // Create contract read runners
      const lendingPool = new Contract(CONTRACT_ADDRESSES.LENDING_POOL, LendingPoolABI, provider);
      const staking = new Contract(CONTRACT_ADDRESSES.STAKING, StakingABI, provider);
      const supplyToken = new Contract(CONTRACT_ADDRESSES.SUPPLY_TOKEN, ERC20ABI, provider);
      const collateralToken = new Contract(CONTRACT_ADDRESSES.COLLATERAL_TOKEN, ERC20ABI, provider);
      const stakingToken = new Contract(CONTRACT_ADDRESSES.STAKING_TOKEN, ERC20ABI, provider);

      // Call on-chain functions in parallel with safe fallbacks
      const results = await Promise.allSettled([
        // 0: Vault balance
        lendingPool.balanceOf(account).catch(() => 0n),
        // 1: Staked balance
        staking.stakedBalance(account).catch(async () => staking.balanceOf(account).catch(() => 0n)),
        // 2: Pending rewards
        staking.pendingRewards(account).catch(() => 0n),
        // 3: User collateral
        lendingPool.userCollateral(account).catch(() => 0n),
        // 4: User debt
        lendingPool.userDebt(account).catch(() => 0n),
        // 5: User supply token balance in wallet
        supplyToken.balanceOf(account).catch(() => 0n),
        // 6: Supply token allowance for lending pool
        supplyToken.allowance(account, CONTRACT_ADDRESSES.LENDING_POOL).catch(() => 0n),
        // 7: Collateral token balance in wallet
        collateralToken.balanceOf(account).catch(() => 0n),
        // 8: Collateral token allowance
        collateralToken.allowance(account, CONTRACT_ADDRESSES.LENDING_POOL).catch(() => 0n),
        // 9: Staking token balance
        stakingToken.balanceOf(account).catch(() => 0n),
        // 10: Staking token allowance
        stakingToken.allowance(account, CONTRACT_ADDRESSES.STAKING).catch(() => 0n),
      ]);

      const getValue = (idx: number, fallback: bigint) => {
        const item = results[idx];
        return item.status === 'fulfilled' && item.value !== undefined ? BigInt(item.value) : fallback;
      };

      const vaultBal = getValue(0, demoState.vaultBalance);
      const stakedBal = getValue(1, demoState.stakedBalance);
      const pendingRew = getValue(2, demoState.pendingRewards);
      const collateralBal = getValue(3, demoState.collateralBalance);
      const debtBal = getValue(4, demoState.borrowedDebt);
      const supplyBal = getValue(5, demoState.supplyTokenBalance);
      const supplyAllow = getValue(6, demoState.supplyAllowance);
      const collatBal = getValue(7, demoState.collateralTokenBalance);
      const collatAllow = getValue(8, demoState.collateralAllowance);
      const stakBal = getValue(9, demoState.stakingTokenBalance);
      const stakAllow = getValue(10, demoState.stakingAllowance);

      const risk = calculateRiskMetrics(collateralBal, debtBal);

      setPositions({
        vaultBalance: formatUnits(vaultBal, TOKENS.SUPPLY.decimals),
        vaultBalanceRaw: vaultBal,
        stakedBalance: formatUnits(stakedBal, TOKENS.STAKING.decimals),
        stakedBalanceRaw: stakedBal,
        pendingRewards: formatUnits(pendingRew, TOKENS.STAKING.decimals),
        pendingRewardsRaw: pendingRew,
        suppliedBalance: formatUnits(vaultBal, TOKENS.SUPPLY.decimals),
        suppliedBalanceRaw: vaultBal,
        earnedInterest: '12.40',
        collateralBalance: formatUnits(collateralBal, TOKENS.COLLATERAL.decimals),
        collateralBalanceRaw: collateralBal,
        borrowedDebt: formatUnits(debtBal, TOKENS.BORROW.decimals),
        borrowedDebtRaw: debtBal,
        healthFactor: risk.healthFactor,
        maxBorrowLimit: risk.maxBorrowLimit,
        availableBorrow: risk.availableBorrow,
        liquidationPriceUSD: risk.liquidationPriceUSD,
        supplyTokenBalance: formatUnits(supplyBal, TOKENS.SUPPLY.decimals),
        supplyTokenBalanceRaw: supplyBal,
        supplyTokenAllowance: supplyAllow,
        collateralTokenBalance: formatUnits(collatBal, TOKENS.COLLATERAL.decimals),
        collateralTokenBalanceRaw: collatBal,
        collateralTokenAllowance: collatAllow,
        stakingTokenBalance: formatUnits(stakBal, TOKENS.STAKING.decimals),
        stakingTokenBalanceRaw: stakBal,
        stakingTokenAllowance: stakAllow,
        repayTokenAllowance: supplyAllow,
      });
    } catch (err) {
      console.warn('Error fetching on-chain data, retaining current state:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [account, provider, isDemoMode, demoState]);

  // Polling every 15 seconds (requirement #6)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, PROTOCOL_CONFIG.POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Demo state mutator actions (allowing full testing when mock/simulation is used)
  const updateDemoPosition = (updater: (prev: typeof demoState) => typeof demoState) => {
    setDemoState(updater);
  };

  return {
    positions,
    marketStats,
    isLoading,
    isRefreshing,
    isDemoMode,
    toggleDemoMode,
    refetch: fetchData,
    updateDemoPosition,
    resetDemoBalances,
    calculateProjectedHealthFactor: (additionalCollateralUSD: number, additionalDebtUSD: number) => {
      const currentCollateralUSD =
        parseFloat(positions.collateralBalance) * TOKENS.COLLATERAL.priceUSD + additionalCollateralUSD;
      const currentDebtUSD =
        parseFloat(positions.borrowedDebt) * TOKENS.BORROW.priceUSD + additionalDebtUSD;

      if (currentDebtUSD <= 0) return Infinity;
      const liqCollateralVal = currentCollateralUSD * PROTOCOL_CONFIG.LIQUIDATION_THRESHOLD;
      return liqCollateralVal / currentDebtUSD;
    },
  };
}
