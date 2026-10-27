import { useMemo } from 'react';
import { Contract, BrowserProvider, JsonRpcSigner } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import LendingPoolABI from '../abi/LendingPoolABI.json';
import StakingABI from '../abi/StakingABI.json';
import ERC20ABI from '../abi/ERC20ABI.json';

export function useContract(
  provider: BrowserProvider | null,
  signer: JsonRpcSigner | null
) {
  // Read runner or write runner
  const runner = signer || provider;

  const lendingPoolContract = useMemo(() => {
    if (!runner || !CONTRACT_ADDRESSES.LENDING_POOL) return null;
    try {
      return new Contract(CONTRACT_ADDRESSES.LENDING_POOL, LendingPoolABI, runner);
    } catch (e) {
      console.warn('Failed to initialize LendingPool contract:', e);
      return null;
    }
  }, [runner]);

  const stakingContract = useMemo(() => {
    if (!runner || !CONTRACT_ADDRESSES.STAKING) return null;
    try {
      return new Contract(CONTRACT_ADDRESSES.STAKING, StakingABI, runner);
    } catch (e) {
      console.warn('Failed to initialize Staking contract:', e);
      return null;
    }
  }, [runner]);

  // Dynamic ERC20 contract factory
  const getErc20Contract = useMemo(() => {
    return (tokenAddress: string) => {
      if (!runner || !tokenAddress) return null;
      try {
        return new Contract(tokenAddress, ERC20ABI, runner);
      } catch (e) {
        console.warn(`Failed to initialize ERC20 contract for ${tokenAddress}:`, e);
        return null;
      }
    };
  }, [runner]);

  return {
    lendingPoolContract,
    stakingContract,
    getErc20Contract,
  };
}
