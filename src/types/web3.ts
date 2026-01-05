import { Address } from 'viem';

export interface ChainMetadata {
  id: number;
  name: string;
  icon: string;
  color: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface SwapRoute {
  from: Address;
  to: Address;
  fromToken: Address;
  toToken: Address;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  priceImpact: number;
  gasEstimate: string;
  route: string[];
  protocol: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type: 'swap' | 'approval' | 'bridge';
  status: 'pending' | 'success' | 'failed';
  fromToken: {
    symbol: string;
    address: Address;
    chainId: number;
  };
  toToken: {
    symbol: string;
    address: Address;
    chainId: number;
  };
  fromAmount: string;
  toAmount: string;
  timestamp: number;
  chainId: number;
  explorerUrl: string;
}

export interface SwapQuote {
  fromToken: Address;
  toToken: Address;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  priceImpact: number;
  gasEstimate: string;
  route: SwapRoute;
  estimatedGas: bigint;
  estimatedGasUSD: string;
}

export interface ApprovalState {
  isApproved: boolean;
  allowance: bigint;
  needsApproval: boolean;
}
