import { SUPPORTED_CHAIN } from '../config/contracts';

/**
 * Generate Etherscan / block explorer link for transactions
 */
export function getTxExplorerUrl(hash: string, baseUrl?: string): string {
  const explorer = baseUrl || SUPPORTED_CHAIN.blockExplorerUrls[0];
  return `${explorer}/tx/${hash}`;
}

/**
 * Generate Etherscan / block explorer link for addresses / contracts
 */
export function getAddressExplorerUrl(address: string, baseUrl?: string): string {
  const explorer = baseUrl || SUPPORTED_CHAIN.blockExplorerUrls[0];
  return `${explorer}/address/${address}`;
}
