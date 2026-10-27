/**
 * Parses Ethereum and MetaMask transaction error objects into friendly user messages
 */
export function parseContractError(error: any): string {
  if (!error) return 'An unknown error occurred.';

  // If it's already a clean string
  if (typeof error === 'string') return error;

  // 1. User rejection
  if (
    error.code === 4001 ||
    error.code === 'ACTION_REJECTED' ||
    error.message?.includes('user rejected') ||
    error.message?.includes('User denied transaction signature')
  ) {
    return 'Transaction rejected by user in wallet.';
  }

  // 2. Insufficient funds
  if (
    error.code === 'INSUFFICIENT_FUNDS' ||
    error.message?.includes('insufficient funds') ||
    error.shortMessage?.includes('insufficient funds')
  ) {
    return 'Insufficient ETH balance for transaction gas and value.';
  }

  // 3. Ethers v6 shortMessage
  if (error.shortMessage) {
    // If it starts with "execution reverted: ..."
    const revertMatch = error.shortMessage.match(/execution reverted:? ?"?([^"]*)"?/i);
    if (revertMatch && revertMatch[1]) {
      return `Contract reverted: ${revertMatch[1]}`;
    }
    return error.shortMessage;
  }

  // 4. Contract revert reason in error.reason
  if (error.reason) {
    return `Transaction failed: ${error.reason}`;
  }

  // 5. Look for error inside error.info or error.data
  if (error.info?.error?.message) {
    return error.info.error.message;
  }

  // 6. Generic message extraction
  if (error.message) {
    // Check for common patterns
    if (error.message.includes('Internal JSON-RPC error')) {
      // Try to find reason in nested error
      if (error.data?.message) return error.data.message;
      return 'RPC execution reverted. Check your token allowance and balances.';
    }
    if (error.message.includes('network error') || error.message.includes('failed to fetch')) {
      return 'Network connection error. Please verify your internet and RPC provider.';
    }
    // Truncate overly long error traces
    if (error.message.length > 120) {
      return error.message.substring(0, 117) + '...';
    }
    return error.message;
  }

  return 'Transaction failed. Please try again.';
}
