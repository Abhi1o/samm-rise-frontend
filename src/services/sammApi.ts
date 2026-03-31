/**
 * SAMM API Service
 * Connects to the SAMM DEX backend API
 * Updated to match actual backend endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TokenInfo {
  symbol: string;
  address: string;
  name?: string;
  decimals: number;
  price?: number;
}

export interface ShardInfo {
  address: string;
  name?: string;
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  liquidityUSD: number | string;
}

export interface SwapQuote {
  tokenIn?: string;
  tokenOut?: string;
  route: string[];
  amountOut: string;
  expectedAmountIn: string;
  totalFee: string;
  hops: number;
  selectedShards: string[];
  selectedShard?: string;
  shardsData: Array<{
    address: string;
    tokenIn: string;
    tokenOut: string;
    tokenA: string;
    tokenB: string;
    reserveA: string;
    reserveB: string;
    liquidityUSD: number;
    fee: string;
    priceImpact: string;
  }>;
  shardData?: any;
  fee?: string;
  priceImpact?: string;
  priceImpacts: string[];
}

export interface PoolData {
  pair: string;
  shards: ShardInfo[];
}

export interface StatsData {
  totalPools: number;
  totalPairs: number;
  totalLiquidityUSD: string;
  tokens: number;
  router: string;
  factory: string;
}

class SAMMApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<{ status: string; deployment: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('API health check failed');
    return response.json();
  }

  /**
   * Get all tokens
   */
  async getTokens(): Promise<{ tokens: TokenInfo[] }> {
    const response = await fetch(`${this.baseUrl}/tokens`);
    if (!response.ok) throw new Error('Failed to fetch tokens');
    return response.json();
  }

  /**
   * Get all pools with real-time data
   */
  async getPools(): Promise<{ pools: Array<{ pair: string; shards: ShardInfo[] }> }> {
    const response = await fetch(`${this.baseUrl}/pools`);
    if (!response.ok) throw new Error('Failed to fetch pools');
    return response.json();
  }

  /**
   * Get pools for a specific token pair
   */
  async getPoolsForPair(tokenA: string, tokenB: string): Promise<PoolData> {
    const response = await fetch(`${this.baseUrl}/pools/${tokenA}/${tokenB}`);
    if (!response.ok) throw new Error(`Failed to fetch pools for ${tokenA}-${tokenB}`);
    return response.json();
  }

  /**
   * Get all shards for a token pair from blockchain (real-time)
   */
  async getShards(tokenA: string, tokenB: string): Promise<{
    tokenA: string;
    tokenB: string;
    shards: ShardInfo[];
    totalShards: number;
    totalLiquidityUSD: number;
  }> {
    const response = await fetch(`${this.baseUrl}/shards/${tokenA}/${tokenB}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch shards for ${tokenA}-${tokenB}`);
    }
    return response.json();
  }

  /**
   * Find best route between two tokens
   * Checks for direct pool first, then tries common intermediary tokens
   */
  private async findRoute(tokenIn: string, tokenOut: string): Promise<string[]> {
    // Try direct pool first
    try {
      await this.getPoolsForPair(tokenIn, tokenOut);
      return [tokenIn, tokenOut]; // Direct pool exists
    } catch {
      // No direct pool, try multi-hop through common tokens
    }

    // Common intermediary tokens (most liquid)
    const intermediaries = ['USDC', 'WETH', 'USDT'];
    
    for (const intermediate of intermediaries) {
      if (intermediate === tokenIn || intermediate === tokenOut) continue;
      
      try {
        // Check if both legs exist
        await this.getPoolsForPair(tokenIn, intermediate);
        await this.getPoolsForPair(intermediate, tokenOut);
        return [tokenIn, intermediate, tokenOut]; // Multi-hop route found
      } catch {
        continue;
      }
    }

    // If no route found, return direct and let backend handle the error
    return [tokenIn, tokenOut];
  }

  /**
   * Get swap quote (single or multi-hop)
   * @param tokenIn - Input token symbol
   * @param tokenOut - Output token symbol
   * @param amountOut - Desired output amount
   * @param route - Optional: array of tokens for multi-hop [token1, token2, token3]
   */
  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountOut: string,
    route?: string[]
  ): Promise<SwapQuote & { steps?: any[]; amountIn?: string }> {
    // If no route provided, find the best route automatically
    if (!route) {
      route = await this.findRoute(tokenIn, tokenOut);
      console.log(`Auto-detected route: ${route.join(' → ')}`);
    }

    // Always use route format for consistency
    const body = { route, amountOut };

    const response = await fetch(`${this.baseUrl}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get swap quote');
    }

    const data = await response.json();
    
    console.log('Raw backend response:', data);
    
    // CRITICAL FIX: Backend returns 'amountIn' not 'expectedAmountIn'
    // Normalize the field names for frontend compatibility
    if (data.amountIn && !data.expectedAmountIn) {
      data.expectedAmountIn = data.amountIn;
    }
    
    // Transform backend response to include 'steps' format expected by frontend
    // Backend returns 'hops', we need to convert it to 'steps' and 'shardsData'
    if (data.hops && Array.isArray(data.hops)) {
      // Always fetch token list to get addresses, decimals, and USD prices
      const tokensResponse = await this.getTokens();
      const tokenMap = new Map(tokensResponse.tokens.map(t => [t.symbol, { address: t.address, decimals: t.decimals, price: t.price ?? 0 }]));

      // Save original hops array before transforming
      const originalHops = data.hops;

      // Create shardsData from hops for compatibility
      data.shardsData = originalHops.map((hop: any) => ({
        address: hop.shardAddress,
        tokenIn: hop.tokenIn,
        tokenOut: hop.tokenOut,
        tokenA: hop.tokenIn,
        tokenB: hop.tokenOut,
        reserveA: '0', // Not provided by backend
        reserveB: '0', // Not provided by backend
        liquidityUSD: 0,
        fee: hop.fee,
        priceImpact: hop.priceImpact
      }));

      // Create selectedShards array
      data.selectedShards = originalHops.map((hop: any) => hop.shardAddress);

      // Compute totalFeeUSD: each hop's fee is in that hop's tokenIn, so convert each to USD.
      // This is the only correct way to sum fees across hops that use different tokens.
      const totalFeeUSD = originalHops.reduce((sum: number, hop: any) => {
        const info = tokenMap.get(hop.tokenIn);
        const price = info?.price ?? 0;
        return sum + parseFloat(hop.fee || '0') * price;
      }, 0);
      data.totalFeeUSD = totalFeeUSD;

      // Convert total fee to fromToken for on-chain/display compatibility
      const fromTokenInfo = tokenMap.get(route[0]);
      const fromTokenPrice = fromTokenInfo?.price ?? 0;
      data.totalFee = fromTokenPrice > 0
        ? (totalFeeUSD / fromTokenPrice).toString()
        : originalHops.reduce((sum: number, hop: any) => sum + parseFloat(hop.fee || '0'), 0).toString();

      // Set hops count (after calculating totalFee)
      data.hops = originalHops.length;
      
      data.steps = data.shardsData.map((shard: any, index: number) => {
        // Get token info from map
        const fromInfo = tokenMap.get(shard.tokenIn);
        const toInfo = tokenMap.get(shard.tokenOut);
        
        if (!fromInfo || !toInfo) {
          throw new Error(`Token info not found for ${shard.tokenIn} or ${shard.tokenOut}`);
        }
        
        // CRITICAL FIX: Backend's amountOut is already in decimal format (e.g., "0.1")
        // We need to convert it to wei format for the contract
        // But ONLY for the final hop - intermediate hops are calculated by the contract
        let hopAmountOut: string;
        if (index === data.shardsData.length - 1) {
          // Last hop: convert decimal amountOut to wei format
          // data.amountOut is a decimal string like "0.1" or "11.848265"
          const amountOutDecimal = parseFloat(data.amountOut);
          
          // Use BigInt for precision with high-decimal tokens
          if (toInfo.decimals <= 8) {
            // Safe to use Math for low-decimal tokens
            const amountOutWei = Math.floor(amountOutDecimal * Math.pow(10, toInfo.decimals));
            hopAmountOut = amountOutWei.toString();
          } else {
            // Use string manipulation for high-decimal tokens to avoid precision loss
            const [whole = '0', fraction = ''] = data.amountOut.split('.');
            const paddedFraction = fraction.padEnd(toInfo.decimals, '0').slice(0, toInfo.decimals);
            hopAmountOut = BigInt(whole + paddedFraction).toString();
          }
        } else {
          // Intermediate hops: contract will calculate, use 0
          hopAmountOut = '0';
        }
        
        return {
          fromSymbol: shard.tokenIn,
          toSymbol: shard.tokenOut,
          fromAddress: fromInfo.address,
          toAddress: toInfo.address,
          amountOut: hopAmountOut, // Now in wei format (integer string)
          pool: shard.address,
          fee: shard.fee,
          priceImpact: shard.priceImpact
        };
      });
    }
    
    // Ensure amountIn is set for easier access
    data.amountIn = data.expectedAmountIn;
    
    console.log('Transformed quote data:', {
      amountIn: data.amountIn,
      amountOut: data.amountOut,
      expectedAmountIn: data.expectedAmountIn,
      hops: data.hops,
      steps: data.steps?.map((s: any) => ({
        from: s.fromSymbol,
        to: s.toSymbol,
        amountOut: s.amountOut,
        pool: s.pool
      }))
    });
    
    return data;
  }

  /**
   * Get token balance for an address
   */
  async getBalance(address: string, token: string): Promise<{
    address: string;
    token: string;
    balance: string;
    balanceRaw: string;
  }> {
    const response = await fetch(`${this.baseUrl}/balance/${address}/${token}`);
    if (!response.ok) throw new Error(`Failed to fetch balance for ${token}`);
    return response.json();
  }

  /**
   * Get all token balances for an address
   */
  async getBalances(address: string): Promise<{
    address: string;
    balances: Record<string, {
      balance: string;
      balanceRaw: string;
      decimals: number;
      address: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/balances/${address}`);
    if (!response.ok) throw new Error('Failed to fetch balances');
    return response.json();
  }

  /**
   * Get DEX statistics
   */
  async getStats(): Promise<StatsData> {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  /**
   * Get current price for a token pair
   */
  async getPrice(tokenA: string, tokenB: string): Promise<{
    pair: string;
    price: string;
    description: string;
    pool: string;
    note: string;
  }> {
    const response = await fetch(`${this.baseUrl}/price/${tokenA}/${tokenB}`);
    if (!response.ok) throw new Error(`Failed to fetch price for ${tokenA}/${tokenB}`);
    return response.json();
  }

  // Legacy methods for backward compatibility
  
  /**
   * @deprecated Use getShards() instead
   */
  async getBestShard(
    chain: string,
    amountIn: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<any> {
    console.warn('getBestShard is deprecated, use getSwapQuote instead');
    return this.getSwapQuote(tokenIn, tokenOut, amountIn);
  }

  /**
   * @deprecated Use getSwapQuote() with route parameter instead
   */
  async getMultiHopRoute(
    chain: string,
    amountIn: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<any> {
    console.warn('getMultiHopRoute is deprecated, use getSwapQuote instead');
    return this.getSwapQuote(tokenIn, tokenOut, amountIn);
  }
}

// Export singleton instance
export const sammApi = new SAMMApiService();

// Export class for testing
export default SAMMApiService;
