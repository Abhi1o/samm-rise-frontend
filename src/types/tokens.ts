export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  icon?: string;
  balance?: string;
  usdValue?: string;
  coingeckoId?: string;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceFormatted: string;
  usdValue?: string;
}

export interface TokenPrice {
  token: Token;
  usd: number;
  usd_24h_change?: number;
  last_updated?: string;
}

export interface TokenList {
  name: string;
  tokens: Token[];
}
