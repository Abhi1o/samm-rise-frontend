import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Plus, ExternalLink, Loader2, RefreshCw, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import AddLiquidityModal from "@/components/AddLiquidityModal";
import RemoveLiquidityModal from "@/components/RemoveLiquidityModal";
import CreatePoolModal from "@/components/CreatePoolModal";
import { usePoolData } from "@/hooks/usePoolData";
import { useUserPositions, UserPosition } from "@/hooks/useUserPositions";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAccount, usePublicClient } from "wagmi";
import TokenLogo from "@/components/TokenLogo";
import { getTokensForChain } from "@/config/tokens";
import { formatUnits } from "viem";
import { useToast } from "@/hooks/use-toast";

const TOKEN_ICONS: Record<string, string> = {
  ETH: "⟠",
  USDC: "💲",
  USDT: "💵",
  WBTC: "₿",
  DAI: "◈",
  ARB: "🔵",
  OP: "🔴",
  MATIC: "🟣",
  LINK: "⬡",
};

interface PoolDetails {
  reserves: { reserveA: string; reserveB: string };
  totalSupply: string;
  sammParams: { beta1: string; rmin: string; rmax: string; c: string };
  feeParams: { tradeFeePercent: string; ownerFeePercent: string };
  loading: boolean;
  error?: string;
}

const Pools = () => {
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addLiquidityOpen, setAddLiquidityOpen] = useState(false);
  const [removeLiquidityOpen, setRemoveLiquidityOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const [expandedPoolId, setExpandedPoolId] = useState<number | null>(null);
  const [poolDetails, setPoolDetails] = useState<Record<number, PoolDetails>>({});

  const { toast } = useToast();
  const publicClient = usePublicClient();

  // Get current network from context
  const { selectedNetwork: currentNetwork } = useNetwork();
  const { address: userAddress } = useAccount();

  // Fetch real pool data from backend for current network
  const { pools, chainName, isLoading, error, refetch } = usePoolData();

  // Fetch user positions
  const { positions: userPositions, isLoading: positionsLoading, hasPositions, refetch: refetchPositions } = useUserPositions();

  // Get tokens for current network to fetch logoURIs
  const networkTokens = currentNetwork ? getTokensForChain(currentNetwork.chainId) : [];

  // Helper to get token logo URI
  const getTokenLogoURI = (symbol: string) => {
    const token = networkTokens.find(t => t.symbol === symbol);
    return token?.logoURI;
  };

  // Helper to get token icon
  const getTokenIcon = (symbol: string) => {
    const token = networkTokens.find(t => t.symbol === symbol);
    return token?.icon || TOKEN_ICONS[symbol] || "🪙";
  };

  // Fetch detailed pool data from blockchain
  const fetchPoolDetails = async (poolId: number, poolAddress: string, token0Symbol: string, token1Symbol: string) => {
    if (poolDetails[poolId] && !poolDetails[poolId].error) {
      return; // Already fetched
    }

    if (!publicClient) {
      console.error('Public client not available');
      return;
    }

    setPoolDetails(prev => ({
      ...prev,
      [poolId]: { ...prev[poolId], loading: true }
    }));

    try {
      const poolAbi = [
        {
          name: 'getReserves',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [
            { name: '_reserveA', type: 'uint256' },
            { name: '_reserveB', type: 'uint256' }
          ]
        },
        {
          name: 'totalSupply',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }]
        },
        {
          name: 'sammParams',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [
            { name: 'beta1', type: 'int256' },
            { name: 'rmin', type: 'uint256' },
            { name: 'rmax', type: 'uint256' },
            { name: 'c', type: 'uint256' }
          ]
        },
        {
          name: 'feeParams',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [
            { name: 'tradeFeeNumerator', type: 'uint256' },
            { name: 'tradeFeeDenominator', type: 'uint256' },
            { name: 'ownerFeeNumerator', type: 'uint256' },
            { name: 'ownerFeeDenominator', type: 'uint256' }
          ]
        }
      ] as const;

      // Fetch reserves and totalSupply (these should always work)
      // @ts-ignore - viem type issue
      const reserves = await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'getReserves'
      });

      // @ts-ignore - viem type issue
      const totalSupply = await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'totalSupply'
      });

      // Try to fetch sammParams and feeParams, but don't fail if they don't exist
      let sammParams = null;
      let feeParams = null;

      try {
        // @ts-ignore - viem type issue
        sammParams = await publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: poolAbi,
          functionName: 'sammParams'
        });
      } catch (err) {
        console.warn('sammParams not available for this pool:', err);
      }

      try {
        // @ts-ignore - viem type issue
        feeParams = await publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: poolAbi,
          functionName: 'feeParams'
        });
      } catch (err) {
        console.warn('feeParams not available for this pool:', err);
      }

      const token0 = networkTokens.find(t => t.symbol === token0Symbol);
      const token1 = networkTokens.find(t => t.symbol === token1Symbol);

      const reserveAFormatted = token0 ? parseFloat(formatUnits(reserves[0], token0.decimals)).toFixed(4) : '0';
      const reserveBFormatted = token1 ? parseFloat(formatUnits(reserves[1], token1.decimals)).toFixed(4) : '0';
      const totalSupplyFormatted = parseFloat(formatUnits(totalSupply, 18)).toFixed(4);

      let tradeFeePercent = 'N/A';
      let ownerFeePercent = 'N/A';
      
      if (feeParams) {
        tradeFeePercent = ((Number(feeParams[0]) / Number(feeParams[1])) * 100).toFixed(2);
        ownerFeePercent = ((Number(feeParams[2]) / Number(feeParams[3])) * 100).toFixed(2);
      }

      setPoolDetails(prev => ({
        ...prev,
        [poolId]: {
          reserves: {
            reserveA: reserveAFormatted,
            reserveB: reserveBFormatted
          },
          totalSupply: totalSupplyFormatted,
          sammParams: sammParams ? {
            beta1: (Number(sammParams[0]) / 1e6).toFixed(6),
            rmin: (Number(sammParams[1]) / 1e6).toFixed(6),
            rmax: (Number(sammParams[2]) / 1e6).toFixed(6),
            c: (Number(sammParams[3]) / 1e6).toFixed(6)
          } : {
            beta1: 'N/A',
            rmin: 'N/A',
            rmax: 'N/A',
            c: 'N/A'
          },
          feeParams: {
            tradeFeePercent: `${tradeFeePercent}%`,
            ownerFeePercent: `${ownerFeePercent}%`
          },
          loading: false
        }
      }));
    } catch (error: any) {
      console.error('Error fetching pool details:', error);
      setPoolDetails(prev => ({
        ...prev,
        [poolId]: {
          ...prev[poolId],
          loading: false,
          error: error.message || 'Failed to fetch pool details'
        }
      }));
    }
  };

  // Toggle expand row
  const toggleExpand = async (poolId: number, poolAddress: string, token0: string, token1: string) => {
    if (expandedPoolId === poolId) {
      setExpandedPoolId(null);
    } else {
      setExpandedPoolId(poolId);
      await fetchPoolDetails(poolId, poolAddress, token0, token1);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  // Refetch pools when network changes
  useEffect(() => {
    if (currentNetwork) {
      refetch();
    }
  }, [currentNetwork, refetch]);

  // Transform pools to display format
  const displayPools = pools.map((pool, index) => {
    const [token0Symbol, token1Symbol] = pool.pairName.split('-');
    const tvl = pool.liquidityUSD ? `$${Number(pool.liquidityUSD).toLocaleString()}` : '$0';

    return {
      id: index + 1,
      token0: token0Symbol,
      token1: token1Symbol,
      token0LogoURI: getTokenLogoURI(token0Symbol),
      token1LogoURI: getTokenLogoURI(token1Symbol),
      token0Icon: getTokenIcon(token0Symbol),
      token1Icon: getTokenIcon(token1Symbol),
      network: currentNetwork?.displayName || chainName,
      feeTier: '0.25%', // SAMM default fee tier
      apr: '0%', // TODO: Calculate from stats
      tvl,
      volume24h: '$0', // TODO: Get from stats endpoint
      type: 'SAMM',
      address: pool.address,
    };
  });

  const filteredPools = displayPools.filter((pool) => {
    const matchesSearch =
      pool.token0.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.token1.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>Liquidity Pools - SAMM</title>
        <meta
          name="description"
          content="Add liquidity to SAMM pools and earn trading fees. Explore high-yield liquidity pools on Ethereum, Arbitrum, Optimism, and more."
        />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-light to-primary">
                  Earn from LP
                </span>
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Liquidity Pools & Farms
              </p>
              <div className="flex gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <a href="#" className="text-primary hover:underline font-medium">Learn How</a>
                <span className="text-border">|</span>
                <a href="#" className="text-primary hover:underline font-medium">Legacy Farm Page</a>
              </div>
            </div>

            {/* Tabs and Actions */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All Pools
                </button>
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "my"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  My Positions
                </button>
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 md:justify-end">
                <Button variant="outline" size="lg" className="rounded-xl flex-1 sm:flex-none" onClick={() => setCreatePoolOpen(true)}>
                  Create Pool
                </Button>
                <Button variant="swap" size="lg" className="rounded-xl flex-1 sm:flex-none" onClick={() => setAddLiquidityOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Liquidity
                </Button>
              </div>
            </div>

            

            {/* Pools Table */}
            <div className="glass-card rounded-2xl border border-glass-border overflow-hidden ">
              {/* Table Header - Different for All Pools vs My Positions */}
              {activeTab === "all" ? (
                <div className="hidden md:grid grid-cols-10 gap-4 px-6 py-4 border-b border-border text-sm text-muted-foreground font-medium">
                  <div className="col-span-3">ALL POOLS</div>
                  <div className="col-span-1">FEE TIER</div>
                  <div className="col-span-4">TVL ↓</div>
                  <div className="col-span-1">TYPE</div>
                  <div className="col-span-1"></div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">MY LIQUIDITY POSITIONS</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchPositions()}
                    disabled={positionsLoading}
                    className="rounded-lg"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${positionsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              )}

              {/* Table Body */}
              {activeTab === "all" ? (
                <>
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading pools...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isLoading && (
                    <div className="p-6">
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-destructive mb-2">Failed to load pools. Please try again.</p>
                        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && !error && filteredPools.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <p className="text-lg">No pools available</p>
                      <p className="text-sm">Check back later or create a new pool</p>
                    </div>
                  )}

                  {/* Pools List */}
                  {!isLoading && !error && filteredPools.map((pool, index) => (
                  <>
                    {/* Mobile Card - visible on small screens only */}
                    <div
                      className="md:hidden px-4 py-4 border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => toggleExpand(pool.id, pool.address, pool.token0, pool.token1)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(pool.id, pool.address, pool.token0, pool.token1); }}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          >
                            {expandedPoolId === pool.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div className="flex -space-x-2 flex-shrink-0">
                            <TokenLogo symbol={pool.token0} logoURI={pool.token0LogoURI} icon={pool.token0Icon} size="sm" className="border-2 border-background" />
                            <TokenLogo symbol={pool.token1} logoURI={pool.token1LogoURI} icon={pool.token1Icon} size="sm" className="border-2 border-background" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{pool.token0} / {pool.token1}</p>
                            <p className="text-xs text-muted-foreground">{pool.network}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-medium">{pool.tvl}</p>
                            <p className="text-xs text-muted-foreground">TVL</p>
                          </div>
                          <button
                            className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
                            onClick={(e) => { e.stopPropagation(); window.open(`https://explorer.testnet.riselabs.xyz/address/${pool.address}`, '_blank'); }}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 ml-8">
                        <span className="px-2 py-0.5 rounded bg-secondary/50 text-xs">{pool.type} | {pool.feeTier}</span>
                      </div>
                    </div>
                    {/* Desktop Row - hidden on mobile */}
                    <div
                      key={pool.id}
                      className="hidden md:grid grid-cols-10 gap-4 px-6 py-4 border-b border-border/50 hover:bg-secondary/20 transition-colors items-center animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => toggleExpand(pool.id, pool.address, pool.token0, pool.token1)}
                    >
                      <div className="col-span-3 flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(pool.id, pool.address, pool.token0, pool.token1);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expandedPoolId === pool.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex -space-x-2">
                          <TokenLogo
                            symbol={pool.token0}
                            logoURI={pool.token0LogoURI}
                            icon={pool.token0Icon}
                            size="md"
                            className="border-2 border-background"
                          />
                          <TokenLogo
                            symbol={pool.token1}
                            logoURI={pool.token1LogoURI}
                            icon={pool.token1Icon}
                            size="md"
                            className="border-2 border-background"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{pool.token0} / {pool.token1}</p>
                          <p className="text-xs text-muted-foreground">{pool.network}</p>
                        </div>
                      </div>
                      <div className="col-span-1">
                        <span className="px-2 py-1 rounded bg-secondary/50 text-xs">{pool.type} | {pool.feeTier}</span>
                      </div>
                      <div className="col-span-4">{pool.tvl}</div>
                      <div className="col-span-1">
                        <span className="px-2 py-1 rounded bg-secondary/30 text-xs">{pool.type}</span>
                      </div>
                      <div className="col-span-1">
                        <button 
                          className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://explorer.testnet.riselabs.xyz/address/${pool.address}`, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Row - visible on all screen sizes */}
                    {expandedPoolId === pool.id && (
                      <div className="border-b border-border/50 bg-muted/20 px-4 sm:px-6 py-4">
                        <div className="max-w-5xl">
                          {poolDetails[pool.id]?.loading && (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                              <span className="text-muted-foreground">Loading pool details...</span>
                            </div>
                          )}

                          {poolDetails[pool.id]?.error && (
                            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                              <p className="text-destructive text-sm">{poolDetails[pool.id].error}</p>
                            </div>
                          )}

                          {poolDetails[pool.id] && !poolDetails[pool.id].loading && !poolDetails[pool.id].error && (
                            <div className="space-y-4">
                              {/* Pool Info Row */}
                              <div className="text-sm">
                                <span className="text-muted-foreground">Pool Address: </span>
                                <span className="font-mono text-xs text-primary">{pool.address.slice(0, 6)}...{pool.address.slice(-4)}</span>
                                <button
                                  onClick={() => copyToClipboard(pool.address, 'Pool address')}
                                  className="text-primary hover:text-primary/80 p-1 ml-1"
                                >
                                  <Copy className="w-3 h-3 inline" />
                                </button>
                                <button
                                  onClick={() => window.open(`https://explorer.testnet.riselabs.xyz/address/${pool.address}`, '_blank')}
                                  className="text-primary hover:text-primary/80 p-1"
                                >
                                  <ExternalLink className="w-3 h-3 inline" />
                                </button>
                              </div>

                              {/* Reserves - Compact Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">{pool.token0} Reserve</p>
                                  <p className="font-semibold">{poolDetails[pool.id].reserves.reserveA}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">{pool.token1} Reserve</p>
                                  <p className="font-semibold">{poolDetails[pool.id].reserves.reserveB}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">LP Token Supply</p>
                                  <p className="font-semibold">{poolDetails[pool.id].totalSupply}</p>
                                </div>
                              </div>

                              {/* Price Ratio */}
                              <div className="text-sm">
                                <span className="text-muted-foreground">Price: </span>
                                <span className="font-semibold">
                                  1 {pool.token0} = {(parseFloat(poolDetails[pool.id].reserves.reserveB) / parseFloat(poolDetails[pool.id].reserves.reserveA)).toFixed(6)} {pool.token1}
                                </span>
                              </div>

                              {/* Only show SAMM params if available */}
                              {poolDetails[pool.id].sammParams.beta1 !== 'N/A' && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">SAMM Parameters</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Beta1: </span>
                                      <span className="font-mono">{poolDetails[pool.id].sammParams.beta1}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">R Min: </span>
                                      <span className="font-mono">{poolDetails[pool.id].sammParams.rmin}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">R Max: </span>
                                      <span className="font-mono">{poolDetails[pool.id].sammParams.rmax}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">C: </span>
                                      <span className="font-mono">{poolDetails[pool.id].sammParams.c}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Only show fees if available */}
                              {poolDetails[pool.id].feeParams.tradeFeePercent !== 'N/A%' && (
                                <div className="flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Trade Fee: </span>
                                    <span className="font-semibold text-primary">{poolDetails[pool.id].feeParams.tradeFeePercent}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Owner Fee: </span>
                                    <span className="font-semibold text-primary">{poolDetails[pool.id].feeParams.ownerFeePercent}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                  ))}
                </>
              ) : (
                <div>
                  {/* Loading State */}
                  {positionsLoading && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading positions...</span>
                    </div>
                  )}

                  {/* Not Connected State */}
                  {!userAddress && !positionsLoading && (
                    <div className="px-6 py-16 text-center">
                      <p className="text-muted-foreground mb-4">Wallet not connected</p>
                      <p className="text-sm text-muted-foreground mb-6">Connect your wallet to view your liquidity positions</p>
                    </div>
                  )}

                  {/* Empty State - No Positions */}
                  {userAddress && !positionsLoading && !hasPositions && (
                    <div className="px-6 py-16 text-center">
                      <p className="text-muted-foreground mb-4">No positions found</p>
                      <p className="text-sm text-muted-foreground mb-6">Add liquidity to a pool to start earning fees</p>
                      <Button variant="swap" onClick={() => setAddLiquidityOpen(true)}>Add Liquidity</Button>
                    </div>
                  )}

                  {/* User Positions List */}
                  {userAddress && !positionsLoading && hasPositions && (
                    <div>
                      <div className="px-6 py-3 bg-secondary/20 text-sm text-muted-foreground">
                        Showing {userPositions.length} position{userPositions.length !== 1 ? 's' : ''}
                      </div>
                      {userPositions.map((position, index) => {
                        const token0 = networkTokens.find(t => t.symbol === position.token0Symbol);
                        const token1 = networkTokens.find(t => t.symbol === position.token1Symbol);

                        // Format token amounts
                        const token0AmountFormatted = token0 
                          ? parseFloat(formatUnits(BigInt(position.token0Amount), token0.decimals)).toFixed(4)
                          : '0';
                        const token1AmountFormatted = token1
                          ? parseFloat(formatUnits(BigInt(position.token1Amount), token1.decimals)).toFixed(4)
                          : '0';

                        return (
                          <div
                            key={position.poolAddress}
                            className="px-6 py-6 border-b border-border/50 hover:bg-secondary/20 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex -space-x-2 flex-shrink-0">
                                  <TokenLogo
                                    symbol={position.token0Symbol}
                                    logoURI={token0?.logoURI}
                                    icon={token0?.icon || getTokenIcon(position.token0Symbol)}
                                    size="md"
                                    className="border-2 border-background"
                                  />
                                  <TokenLogo
                                    symbol={position.token1Symbol}
                                    logoURI={token1?.logoURI}
                                    icon={token1?.icon || getTokenIcon(position.token1Symbol)}
                                    size="md"
                                    className="border-2 border-background"
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold text-lg">{position.pairName}</p>
                                  <p className="text-xs text-muted-foreground">{position.poolName}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-lg"
                                  onClick={() => {
                                    setSelectedPosition(position);
                                    setRemoveLiquidityOpen(true);
                                  }}
                                >
                                  Remove
                                </Button>
                                <Button variant="swap" size="sm" className="rounded-lg" onClick={() => setAddLiquidityOpen(true)}>
                                  Add More
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">LP Tokens</p>
                                <p className="font-semibold">{position.lpBalanceFormatted}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Share of Pool</p>
                                <p className="font-semibold text-primary">{position.shareOfPool.toFixed(4)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">{position.token0Symbol} Amount</p>
                                <p className="font-semibold">{token0AmountFormatted}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">{position.token1Symbol} Amount</p>
                                <p className="font-semibold">{token1AmountFormatted}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />

        <AddLiquidityModal 
          isOpen={addLiquidityOpen} 
          onClose={() => {
            setAddLiquidityOpen(false);
            // Refetch positions after modal closes (in case liquidity was added)
            refetchPositions();
          }} 
        />
        <RemoveLiquidityModal 
          isOpen={removeLiquidityOpen} 
          onClose={() => {
            setRemoveLiquidityOpen(false);
            setSelectedPosition(null);
            refetchPositions();
          }} 
          position={selectedPosition}
        />
        <CreatePoolModal 
          isOpen={createPoolOpen} 
          onClose={() => {
            setCreatePoolOpen(false);
            // Refetch pools after modal closes (in case a new pool was created)
            refetch();
          }} 
        />
      </div>
    </>
  );
};

export default Pools;
