/**
 * SAMM API Service
 * Connects to the unified multi-chain backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TokenInfo {
  symbol: string;
  address: string;
  name: string;
  decimals: number;
}

export interface ShardInfo {
  pair: string;
  name: string;
  address: string;
  liquidity: string;
  reserves?: {
    reserveA: string;
    reserveB: string;
  };
  sammParams?: {
    beta1: string;
    rmin: string;
    rmax: string;
    c: string;
  };
}

export interface SwapQuote {
  chain: string;
  chainId: number;
  bestShard: {
    shardName: string;
    shardAddress: string;
    liquidity: string;
    amountIn: string;
    amountOut: string;
    tradeFee: string;
    ownerFee: string;
    totalCost: string;
    priceImpact: string;
  };
  allShards: Array<{
    shardName: string;
    shardAddress: string;
    liquidity: string;
    amountIn: string;
    amountOut: string;
    tradeFee: string;
    totalCost: string;
    priceImpact: string;
  }>;
  cSmallerBetterDemonstrated: boolean;
}

export interface MultiHopRoute {
  chain: string;
  chainId: number;
  route: string;
  path: string[];
  shards: string[];
  amountIn: string;
  amountOut: string;
  totalFee: string;
  steps: Array<{
    from: string;
    to: string;
    shard: string;
    amountIn: string;
    amountOut: string;
    tradeFee?: string;
  }>;
}

export interface ChainInfo {
  name: string;
  chainId: number;
  displayName: string;
  nativeToken: {
    symbol: string;
    decimals: number;
  };
  status: {
    status: string;
    chainId: number;
    blockNumber: number;
    lastChecked: string;
    totalShards: number;
  };
  endpoints: {
    info: string;
    shards: string;
    swap: string;
    bestShard: string;
    crossPool: string;
  };
}

export interface ShardDetailedInfo extends ShardInfo {
  volume24h?: string;
  fees24h?: string;
  apr?: string;
  utilization?: string;
}

export interface PoolStats {
  tvl: string;
  volume24h: string;
  fees24h: string;
  apr: string;
  utilization: string;
}

class SAMMApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('API health check failed');
    return response.json();
  }

  /**
   * Get all supported chains
   */
  async getChains(): Promise<{ totalChains: number; chains: ChainInfo[] }> {
    const response = await fetch(`${this.baseUrl}/api/chains`);
    if (!response.ok) throw new Error('Failed to fetch chains');
    return response.json();
  }

  /**
   * Get chain info
   */
  async getChainInfo(chain: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/${chain}/info`);
    if (!response.ok) throw new Error(`Failed to fetch ${chain} info`);
    return response.json();
  }

  /**
   * Get all shards for a chain
   */
  async getShards(chain: string): Promise<{
    chain: string;
    chainId: number;
    shards: Record<string, ShardInfo[]>;
    totalShards: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/${chain}/shards`);
    if (!response.ok) throw new Error(`Failed to fetch ${chain} shards`);
    return response.json();
  }

  /**
   * Get best shard for a swap (c-smaller-better)
   * Backend now supports both amountIn and amountOut
   */
  async getBestShard(
    chain: string,
    amountIn: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<SwapQuote> {
    const response = await fetch(`${this.baseUrl}/api/${chain}/swap/best-shard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amountIn, // Send as amountIn (backend now supports both)
        tokenIn,
        tokenOut,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get best shard');
    }

    return response.json();
  }

  /**
   * Get multi-hop route (cross-pool routing)
   */
  async getMultiHopRoute(
    chain: string,
    amountIn: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<MultiHopRoute> {
    const response = await fetch(`${this.baseUrl}/api/${chain}/swap/cross-pool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amountIn,
        tokenIn,
        tokenOut,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get multi-hop route');
    }

    return response.json();
  }

  /**
   * Get specific shard info
   */
  async getShardInfo(chain: string, address: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/${chain}/shard/${address}`);
    if (!response.ok) throw new Error('Failed to fetch shard info');
    return response.json();
  }

  /**
   * Calculate swap quote (uses cross-pool endpoint which handles both direct and multi-hop)
   */
  async getSwapQuote(
    chain: string,
    amountIn: string,
    tokenIn: string,
    tokenOut: string
  ): Promise<MultiHopRoute> {
    // Use cross-pool endpoint directly - it handles both direct and multi-hop swaps
    return await this.getMultiHopRoute(chain, amountIn, tokenIn, tokenOut);
  }

  /**
   * Get detailed pool/shard information with statistics
   * Note: This endpoint may not be available in all backends
   */
  async getDetailedShards(chain: string): Promise<{
    chain: string;
    chainId: number;
    shards: Record<string, ShardDetailedInfo[]>;
    totalShards: number;
    totalTVL: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${chain}/shards/detailed`);
      if (!response.ok) {
        // Fall back to regular shards endpoint if detailed not available
        const regularShards = await this.getShards(chain);
        return {
          ...regularShards,
          totalTVL: '0',
        };
      }
      return response.json();
    } catch (error) {
      // Fall back to regular shards endpoint
      const regularShards = await this.getShards(chain);
      return {
        ...regularShards,
        totalTVL: '0',
      };
    }
  }

  /**
   * Get pool statistics for a specific pool/shard
   * Note: This endpoint may not be available in all backends
   */
  async getPoolStats(chain: string, poolAddress: string): Promise<PoolStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/${chain}/pool/${poolAddress}/stats`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn(`Pool stats not available for ${poolAddress}`);
      return null;
    }
  }
}

// Export singleton instance
export const sammApi = new SAMMApiService();

// Export class for testing
export default SAMMApiService;
