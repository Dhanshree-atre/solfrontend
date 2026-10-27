import { formatUnits as ethersFormatUnits, parseUnits as ethersParseUnits } from 'ethers';

/**
 * Truncate Ethereum address: 0x1234...abcd
 */
export function shortenAddress(address: string | null | undefined, chars: number = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Safe conversion from raw BigInt to human-readable string
 */
export function formatTokenAmount(
  value: bigint | string | number | undefined | null,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  if (value === undefined || value === null) return '0.00';
  try {
    const rawBigInt = typeof value === 'bigint' ? value : BigInt(value.toString());
    const formatted = ethersFormatUnits(rawBigInt, decimals);
    const num = parseFloat(formatted);
    if (isNaN(num)) return '0.00';
    if (num === 0) return '0.00';
    if (num < 0.0001 && num > 0) return '< 0.0001';
    
    // Trim to display decimals
    const parts = formatted.split('.');
    if (parts.length === 1) return parts[0];
    const dec = parts[1].substring(0, displayDecimals);
    return `${parts[0]}.${dec}`.replace(/\.?0+$/, '') || '0';
  } catch (err) {
    return '0.00';
  }
}

/**
 * Safe conversion from user input string to BigInt
 */
export function parseTokenAmount(value: string, decimals: number = 18): bigint {
  if (!value || isNaN(Number(value)) || Number(value) <= 0) {
    return 0n;
  }
  try {
    // Sanitize input: only keep numbers and single decimal point
    const sanitized = value.trim().replace(/,/g, '');
    const parts = sanitized.split('.');
    let clean = sanitized;
    if (parts.length > 1 && parts[1].length > decimals) {
      clean = `${parts[0]}.${parts[1].substring(0, decimals)}`;
    }
    return ethersParseUnits(clean, decimals);
  } catch (err) {
    return 0n;
  }
}

/**
 * Format currency with commas and dollar symbol: $1,234.56
 */
export function formatUSD(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage: 5.25%
 */
export function formatPercent(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Health factor categories:
 * Green: > 1.5 (Safe)
 * Yellow: 1.1 - 1.5 (Moderate risk)
 * Red: < 1.1 (Danger / High risk of liquidation)
 */
export function getHealthFactorStatus(hf: number) {
  if (!isFinite(hf) || hf >= 999) {
    return {
      status: 'infinite',
      label: '∞ Safe',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      barColor: 'bg-emerald-500',
      description: 'Zero borrow debt active. Your collateral is 100% secure.',
    };
  }

  if (hf >= 1.5) {
    return {
      status: 'safe',
      label: 'Healthy',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      barColor: 'bg-emerald-500',
      description: 'Health factor is safe. Low risk of liquidation.',
    };
  }

  if (hf >= 1.1) {
    return {
      status: 'warning',
      label: 'Moderate',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      barColor: 'bg-amber-500',
      description: 'Moderate liquidation risk. Consider depositing collateral or repaying debt.',
    };
  }

  return {
    status: 'danger',
    label: 'High Risk',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    barColor: 'bg-rose-500',
    description: 'Danger of liquidation! Position can be liquidated if HF drops below 1.0.',
  };
}
