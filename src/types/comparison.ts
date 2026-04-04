export interface ComparisonSide {
  amountOut: string;
  fee: string;
  route: string;
  priceImpact: string;
}

export interface ComparisonResult {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  samm: ComparisonSide;
  uniswap: ComparisonSide;
  delta: {
    percentage: string;
    absolute: string;
  };
  winner: 'samm' | 'uniswap' | 'equal';
}

export interface MatrixCell {
  samm: string;
  uniswap: string;
  delta: string;
  winner: 'samm' | 'uniswap' | 'equal';
}

export type MatrixResult = Record<string, Record<string, MatrixCell>>;
// e.g. { "WETH-USDC": { "$10": { samm, uniswap, delta, winner }, ... } }
