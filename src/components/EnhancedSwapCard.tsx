import { useState, useEffect } from "react";
import { ArrowDown, Settings, RefreshCw, Info, Zap, CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { Address, formatUnits } from "viem";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token } from "./TokenSelectModal";
import { Button } from "./ui/button";
import { sammApi } from "@/services/sammApi";
import { useToast } from "@/hooks/use-toast";
import { useNetwork } from "@/contexts/NetworkContext";
import { commonTokens } from "@/config/tokens";
import { useBatchSwap } from "@/hooks/useBatchSwap";
import { getCrossPoolRouter } from "@/config/contracts";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { Token as ConfigToken } from "@/types/tokens";
import { formatUSD } from "@/utils/formatters";

const EnhancedSwapCard = () => {
  const { toast } = useToast();
  const { selectedNetwork } = useNetwork();
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();

  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [loading, setLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<string>("");

  // Get tokens for selected network
  const networkTokens = selectedNetwork ? commonTokens[selectedNetwork.chainId] || [] : [];

  const [fromToken, setFromToken] = useState({
    symbol: networkTokens[3]?.symbol || "USDC",
    icon: networkTokens[3]?.icon || "💲",
    logoURI: networkTokens[3]?.logoURI,
    balance: "0.00",
    address: networkTokens[3]?.address || "",
    decimals: networkTokens[3]?.decimals || 6,
  });

  const [toToken, setToToken] = useState({
    symbol: networkTokens[4]?.symbol || "USDT",
    icon: networkTokens[4]?.icon || "💵",
    logoURI: networkTokens[4]?.logoURI,
    balance: "0.00",
    address: networkTokens[4]?.address || "",
    decimals: networkTokens[4]?.decimals || 6,
  });

  // Check if token is native (doesn't need approval)
  const isNativeToken = (address: string) => {
    return !address || address === "0x0000000000000000000000000000000000000000";
  };

  const needsTokenApproval = !isNativeToken(fromToken.address);

  // Get router address for approval
  const routerAddress = chainId ? getCrossPoolRouter(chainId) : undefined;

  // Create ConfigToken objects for balance/price hooks (MUST be before useBatchSwap)
  const fromTokenConfig: ConfigToken | undefined = networkTokens.find(t => t.address === fromToken.address);
  const toTokenConfig: ConfigToken | undefined = networkTokens.find(t => t.address === toToken.address);

  // Batch swap hook - handles approval + swap in single user action
  const batchSwap = useBatchSwap({
    fromToken: fromTokenConfig,
    toToken: toTokenConfig,
    amountIn: quoteData?.amountIn,
    amountOut: quoteData?.amountOut,
    fromDecimals: fromToken.decimals,
    toDecimals: toToken.decimals,
    quoteData: quoteData,
    slippageBps: undefined, // Use default slippage from quote
    deadline: undefined, // Use default deadline
  });

  // Fetch balances for from and to tokens
  const {
    formattedBalance: fromBalanceFormatted,
    isLoading: fromBalanceLoading,
    refetch: refetchFromBalance,
  } = useTokenBalance({
    tokenAddress: fromTokenConfig?.address as Address,
    userAddress: userAddress as Address,
    enabled: !!fromTokenConfig && !!userAddress,
  });
  const {
    formattedBalance: toBalanceFormatted,
    isLoading: toBalanceLoading,
    refetch: refetchToBalance,
  } = useTokenBalance({
    tokenAddress: toTokenConfig?.address as Address,
    userAddress: userAddress as Address,
    enabled: !!toTokenConfig && !!userAddress,
  });

  // Fetch prices for from and to tokens
  const { price: fromPrice, isLoading: fromPriceLoading } = useTokenPrice(fromTokenConfig);
  const { price: toPrice, isLoading: toPriceLoading } = useTokenPrice(toTokenConfig);

  // Calculate USD values
  const fromValueUSD = fromValue && fromPrice ? formatUSD(parseFloat(fromValue) * fromPrice) : undefined;
  const toValueUSD = toValue && toPrice ? formatUSD(parseFloat(toValue) * toPrice) : undefined;

  // Update token balances when they change
  useEffect(() => {
    if (fromBalanceFormatted !== undefined && fromBalanceFormatted !== fromToken.balance) {
      setFromToken(prev => ({ ...prev, balance: fromBalanceFormatted }));
    }
  }, [fromBalanceFormatted]);

  useEffect(() => {
    if (toBalanceFormatted !== undefined && toBalanceFormatted !== toToken.balance) {
      setToToken(prev => ({ ...prev, balance: toBalanceFormatted }));
    }
  }, [toBalanceFormatted]);

  // Reset tokens when network changes
  useEffect(() => {
    if (selectedNetwork && networkTokens.length > 0) {
      setFromToken({
        symbol: networkTokens[3]?.symbol || networkTokens[0]?.symbol || "USDC",
        icon: networkTokens[3]?.icon || networkTokens[0]?.icon || "💲",
        logoURI: networkTokens[3]?.logoURI || networkTokens[0]?.logoURI,
        balance: "0.00",
        address: networkTokens[3]?.address || networkTokens[0]?.address || "",
        decimals: networkTokens[3]?.decimals || networkTokens[0]?.decimals || 6,
      });
      setToToken({
        symbol: networkTokens[4]?.symbol || networkTokens[1]?.symbol || "USDT",
        icon: networkTokens[4]?.icon || networkTokens[1]?.icon || "💵",
        logoURI: networkTokens[4]?.logoURI || networkTokens[1]?.logoURI,
        balance: "0.00",
        address: networkTokens[4]?.address || networkTokens[1]?.address || "",
        decimals: networkTokens[4]?.decimals || networkTokens[1]?.decimals || 6,
      });
      // Clear quote when network changes
      setFromValue("");
      setToValue("");
      setQuoteData(null);
      setRouteInfo("");
    }
  }, [selectedNetwork]);

  // Fetch quote when amount changes
  useEffect(() => {
    if (fromValue && parseFloat(fromValue) > 0 && fromToken.address && toToken.address) {
      fetchQuote();
    } else {
      setToValue("");
      setQuoteData(null);
      setRouteInfo("");
    }
  }, [fromValue, fromToken.address, toToken.address]);

  // Refresh balances when swap succeeds (but don't auto-reset, let user click "Done")
  useEffect(() => {
    if (batchSwap.currentStep === 'success') {
      // Refresh token balances immediately
      console.log('Refreshing balances after successful swap...');
      refetchFromBalance();
      refetchToBalance();
    }
  }, [batchSwap.currentStep, refetchFromBalance, refetchToBalance]);



  const fetchQuote = async () => {
    if (!selectedNetwork) {
      toast({
        title: "Network Not Selected",
        description: "Please select a network first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validate inputs
      if (!fromValue || parseFloat(fromValue) <= 0) {
        console.log('Invalid amount:', fromValue);
        setToValue("");
        setQuoteData(null);
        return;
      }

      if (!fromToken.address || !toToken.address) {
        console.error('Missing token addresses:', { fromToken, toToken });
        throw new Error('Token addresses not configured');
      }

      // Convert amount to smallest unit based on token decimals
      // IMPORTANT: Use string manipulation to avoid JavaScript number precision loss
      // For 18-decimal tokens, Math.floor(parseFloat(value) * 10^18) loses precision
      let amountInSmallestUnit: string;
      
      if (fromToken.decimals <= 8) {
        // For tokens with ≤8 decimals (like USDC, USDT, WBTC), Math is safe
        amountInSmallestUnit = Math.floor(parseFloat(fromValue) * Math.pow(10, fromToken.decimals)).toString();
      } else {
        // For tokens with >8 decimals (like WETH, DAI, LINK), use string manipulation
        const [whole = '0', fraction = ''] = fromValue.split('.');
        const paddedFraction = fraction.padEnd(fromToken.decimals, '0').slice(0, fromToken.decimals);
        amountInSmallestUnit = whole + paddedFraction;
        // Remove leading zeros
        amountInSmallestUnit = BigInt(amountInSmallestUnit).toString();
      }
      
      console.log('Fetching quote:', {
        chainId: selectedNetwork.chainId,
        amount: amountInSmallestUnit,
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromDecimals: fromToken.decimals,
        toDecimals: toToken.decimals
      });
      
      // Convert amountIn to human-readable format
      // CRITICAL FIX: Use formatUnits for precision with high-decimal tokens
      // parseFloat loses precision for 18-decimal tokens like WETH
      const amountInHuman = formatUnits(BigInt(amountInSmallestUnit), fromToken.decimals);
      
      // CRITICAL: Backend uses "exact output" model, but UI is "exact input"
      // Solution: Use a simple estimation for the output amount
      // The backend will calculate the exact quote based on actual pool reserves
      
      // Simple estimation: assume 1:1 ratio for stablecoins, use price ratios for others
      // This is just for the initial quote request - backend will return accurate values
      let estimatedOut: number;
      
      // Try to get a rough estimate based on token prices or direct pool
      try {
        // Try to get pool reserves for direct estimation
        const poolsResponse = await sammApi.getPoolsForPair(fromToken.symbol, toToken.symbol);
        if (poolsResponse.shards && poolsResponse.shards.length > 0) {
          // Use the largest pool for estimation (most accurate pricing)
          const largestPool = poolsResponse.shards[poolsResponse.shards.length - 1];
          
          // CRITICAL FIX: Check which reserve corresponds to which token
          // The pool might be inverted (tokenA/tokenB order doesn't match our fromToken/toToken order)
          let reserveIn, reserveOut;
          if (largestPool.tokenA === fromToken.symbol) {
            // Pool is: fromToken (A) / toToken (B)
            reserveIn = parseFloat(largestPool.reserveA);
            reserveOut = parseFloat(largestPool.reserveB);
          } else {
            // Pool is inverted: toToken (A) / fromToken (B)
            reserveIn = parseFloat(largestPool.reserveB);
            reserveOut = parseFloat(largestPool.reserveA);
          }
          
          // Constant product formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
          const amountInFloat = parseFloat(amountInHuman);
          estimatedOut = (amountInFloat * reserveOut) / (reserveIn + amountInFloat);
          
          console.log('Direct pool estimation:', {
            amountIn: amountInFloat,
            reserveIn,
            reserveOut,
            estimatedOut
          });
        } else {
          throw new Error('No direct pool, will use multi-hop estimation');
        }
      } catch (error) {
        // No direct pool exists, calculate multi-hop estimation using actual pool reserves
        console.log('No direct pool found, calculating multi-hop estimation from pool reserves');
        
        const amountInFloat = parseFloat(amountInHuman);
        
        // Try common intermediary tokens (USDC, WETH, USDT)
        const intermediaries = ['USDC', 'WETH', 'USDT'];
        let foundRoute = false;
        
        for (const intermediate of intermediaries) {
          if (intermediate === fromToken.symbol || intermediate === toToken.symbol) continue;
          
          try {
            // Check if both legs exist and get their reserves
            const leg1Response = await sammApi.getPoolsForPair(fromToken.symbol, intermediate);
            const leg2Response = await sammApi.getPoolsForPair(intermediate, toToken.symbol);
            
            if (leg1Response.shards?.length > 0 && leg2Response.shards?.length > 0) {
              // Calculate output through this route
              const pool1 = leg1Response.shards[leg1Response.shards.length - 1];
              const pool2 = leg2Response.shards[leg2Response.shards.length - 1];
              
              // CRITICAL FIX: Check which reserve corresponds to which token
              // The pool might be inverted (tokenA/tokenB order doesn't match our fromToken/toToken order)
              
              // First hop: fromToken → intermediate
              let reserve1In, reserve1Out;
              if (pool1.tokenA === fromToken.symbol) {
                // Pool is: fromToken (A) / intermediate (B)
                reserve1In = parseFloat(pool1.reserveA);
                reserve1Out = parseFloat(pool1.reserveB);
              } else {
                // Pool is inverted: intermediate (A) / fromToken (B)
                reserve1In = parseFloat(pool1.reserveB);
                reserve1Out = parseFloat(pool1.reserveA);
              }
              const intermediateAmount = (amountInFloat * reserve1Out) / (reserve1In + amountInFloat);
              
              // Second hop: intermediate → toToken
              let reserve2In, reserve2Out;
              if (pool2.tokenA === intermediate) {
                // Pool is: intermediate (A) / toToken (B)
                reserve2In = parseFloat(pool2.reserveA);
                reserve2Out = parseFloat(pool2.reserveB);
              } else {
                // Pool is inverted: toToken (A) / intermediate (B)
                reserve2In = parseFloat(pool2.reserveB);
                reserve2Out = parseFloat(pool2.reserveA);
              }
              estimatedOut = (intermediateAmount * reserve2Out) / (reserve2In + intermediateAmount);
              
              console.log('Multi-hop estimation via', intermediate, ':', {
                amountIn: amountInFloat,
                intermediateAmount,
                estimatedOut,
                route: `${fromToken.symbol} → ${intermediate} → ${toToken.symbol}`
              });
              
              foundRoute = true;
              break;
            }
          } catch (err) {
            continue;
          }
        }
        
        if (!foundRoute) {
          // Fallback to simple price-based estimation
          console.log('Could not find route, using fallback estimation');
          estimatedOut = amountInFloat; // Assume 1:1 as last resort
        }
      }
      
      // Step 2: Iteratively find the correct output amount
      // The backend uses "exact output" mode, but we have "exact input"
      // We need to find the output amount where backend's expectedAmountIn matches our input
      
      let targetOutput = estimatedOut;
      let iterations = 0;
      const maxIterations = 5;
      const tolerance = 0.01; // 1% tolerance
      
      console.log('Starting iterative quote search...');
      console.log('  Target input:', amountInHuman, fromToken.symbol);
      console.log('  Initial estimate:', targetOutput.toFixed(6), toToken.symbol);
      
      let quote;
      let bestQuote = null;
      let bestDiff = Infinity;
      
      while (iterations < maxIterations) {
        // Get quote for current target output
        quote = await sammApi.getSwapQuote(
          fromToken.symbol,
          toToken.symbol,
          targetOutput.toFixed(6)
        );
        
        const quotedInput = parseFloat(quote.expectedAmountIn);
        const userInput = parseFloat(amountInHuman);
        const diff = Math.abs(quotedInput - userInput);
        const diffPercent = (diff / userInput) * 100;
        
        console.log(`  Iteration ${iterations + 1}:`, {
          targetOutput: targetOutput.toFixed(6),
          quotedInput: quotedInput.toFixed(6),
          userInput: userInput.toFixed(6),
          diff: diff.toFixed(6),
          diffPercent: diffPercent.toFixed(2) + '%'
        });
        
        // Track best quote
        if (diff < bestDiff) {
          bestDiff = diff;
          bestQuote = quote;
        }
        
        // Check if we're close enough
        if (diffPercent < tolerance) {
          console.log('  ✅ Converged! Using this quote.');
          break;
        }
        
        // Adjust target output based on the difference
        // If backend needs more input than user has, reduce output
        // If backend needs less input than user has, increase output
        const ratio = userInput / quotedInput;
        targetOutput = targetOutput * ratio;
        
        // Safety check: don't let output go negative or too large
        if (targetOutput <= 0 || targetOutput > estimatedOut * 10) {
          console.log('  ⚠️  Target output out of bounds, using best quote so far');
          quote = bestQuote;
          break;
        }
        
        iterations++;
      }
      
      // Use the best quote we found
      if (!quote && bestQuote) {
        quote = bestQuote;
      }
      
      console.log('Final quote:', {
        expectedInput: quote.expectedAmountIn,
        output: quote.amountOut,
        iterations
      });

      // Validate quote response
      if (!quote || typeof quote !== 'object') {
        throw new Error('Invalid quote response from backend');
      }

      setQuoteData(quote);

      // Display the output amount from the quote
      if (quote.expectedAmountIn && quote.amountOut) {
        const outputAmount = parseFloat(quote.amountOut);
        setToValue(outputAmount.toFixed(6));
        
        if (quote.hops === 1) {
          setRouteInfo(`Direct swap via ${quote.selectedShards?.[0]?.slice(0, 10) || 'pool'}...`);
        } else {
          setRouteInfo(`Multi-hop: ${quote.route?.join(' → ') || 'Unknown route'}`);
        }
        
        console.log(`${quote.hops === 1 ? 'Direct' : 'Multi-hop'} swap:`, outputAmount, toToken.symbol);
      } else {
        throw new Error('Quote missing expectedAmountIn or amountOut field');
      }
    } catch (error: any) {
      console.error('Failed to fetch quote:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        fromToken: fromToken.symbol,
        fromAddress: fromToken.address,
        toToken: toToken.symbol,
        toAddress: toToken.address,
        amount: fromValue
      });
      toast({
        title: "Quote Error",
        description: error.message || "Failed to fetch swap quote",
        variant: "destructive",
      });
      setToValue("");
      setQuoteData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    const tempValue = fromValue;
    setFromValue(toValue);
    setToValue(tempValue);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const openTokenModal = (type: "from" | "to") => {
    setSelectingFor(type);
    setModalOpen(true);
  };

  const handleTokenSelect = (token: Token) => {
    const selectedToken = networkTokens.find(t => t.symbol === token.symbol);
    if (!selectedToken) return;

    const tokenData = {
      symbol: selectedToken.symbol,
      icon: selectedToken.icon || token.icon,
      logoURI: selectedToken.logoURI,
      balance: token.balance || "0.00",
      address: selectedToken.address,
      decimals: selectedToken.decimals,
    };

    if (selectingFor === "from") {
      setFromToken(tokenData);
    } else {
      setToToken(tokenData);
    }
  };

  const formatFee = (fee: string) => {
    // Backend returns fee as decimal string (e.g., "0.000044"), not wei
    const feeAmount = parseFloat(fee);
    if (feeAmount === 0) return '0.000000';
    if (feeAmount < 0.000001) return '< 0.000001';
    return feeAmount.toFixed(6);
  };

  const getRate = () => {
    if (!fromValue || !toValue || parseFloat(fromValue) === 0) return null;
    const rate = parseFloat(toValue) / parseFloat(fromValue);
    return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
  };

  /**
   * Handle swap execution
   * Two-step process: approve token (if needed) → execute swap
   */
  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }

    if (!fromToken.address || !toToken.address || !quoteData) {
      toast({
        title: "Invalid Swap",
        description: "Please ensure all fields are filled",
        variant: "destructive",
      });
      return;
    }

    try {
      // Execute batch swap (approval + swap in single user action)
      await batchSwap.executeBatchSwap();
      // Success! Inline display will show complete state with "Done" button
    } catch (error: any) {
      console.error('Batch swap failed:', error);
      // Error is shown inline
    }
  };

  // Get button text based on current state
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (!fromValue) return "Enter an amount";
    if (loading) return "Fetching quote...";
    if (!toValue) return "Enter an amount";

    // Batch swap states
    switch (batchSwap.currentStep) {
      case 'checking':
        return "Checking approval...";
      case 'approving':
        return `Approving ${fromToken.symbol}...`;
      case 'approved':
        return "Approved!";
      case 'swapping':
        return "Swapping...";
      case 'success':
        return "Swap Successful!";
      case 'error':
        return "Try Again";
      default:
        // Show "Approve & Swap" if approval needed, otherwise "Swap"
        const needsApproval = batchSwap.steps.some(step => step.label.includes('Approve') && step.status === 'pending');
        return needsApproval ? `Approve & Swap` : "Swap";
    }
  };

  // Button should be disabled during loading or transaction states
  // BUT: Don't disable while fetching quote - show "Fetching quote..." text instead
  const isButtonDisabled =
    !isConnected ||
    !fromValue ||
    (!toValue && !loading) ||  // Allow button to show "Fetching quote..." when loading
    batchSwap.isLoading ||
    batchSwap.currentStep === 'success';

  return (
    <>
      <div className="w-full max-w-[95vw] sm:max-w-[420px] mx-auto px-2 sm:px-0">
        <div className="glass-card rounded-3xl p-4 sm:p-5 md:p-6 metal-shine">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Swap</h2>
              <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {selectedNetwork?.displayName || "Loading..."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchQuote}
                disabled={loading || !fromValue}
                className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* From Token */}
          <TokenInput
            label="You pay"
            token={fromToken}
            value={fromValue}
            onChange={setFromValue}
            usdValue={fromValueUSD}
            onTokenClick={() => openTokenModal("from")}
          />

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 rounded-xl bg-secondary border-4 border-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
            >
              <ArrowDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* To Token */}
          <TokenInput
            label="You receive"
            token={toToken}
            value={loading ? "Loading..." : toValue}
            onChange={setToValue}
            usdValue={toValueUSD}
            isOutput
            onTokenClick={() => openTokenModal("to")}
          />

          {/* Route Info */}
          {routeInfo && (
            <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Info className="w-3 h-3" />
                <span>{routeInfo}</span>
              </div>
            </div>
          )}

          {/* Price Info */}
          {quoteData && fromValue && (
            <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex justify-between gap-2 text-sm mb-2">
                <span className="text-muted-foreground flex-shrink-0">Rate</span>
                <span className="text-foreground font-mono text-xs text-right min-w-0 break-all">{getRate()}</span>
              </div>

              {/* Show shard info for direct swaps */}
              {quoteData.hops === 1 && quoteData.selectedShards && quoteData.selectedShards.length > 0 && (
                <div className="flex justify-between gap-2 text-sm mb-2">
                  <span className="text-muted-foreground flex-shrink-0">Shard</span>
                  <span className="text-chrome font-mono text-xs text-right">{quoteData.selectedShards[0].slice(0, 10)}...</span>
                </div>
              )}

              {/* Show hops for multi-hop swaps */}
              {quoteData.hops > 1 && quoteData.route && (
                <div className="flex justify-between gap-2 text-sm mb-2">
                  <span className="text-muted-foreground flex-shrink-0">Route</span>
                  <span className="text-chrome font-mono text-xs text-right min-w-0 break-all">{quoteData.route.join(' → ')}</span>
                </div>
              )}

              {/* Show total fee */}
              {quoteData.totalFee && (
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground flex-shrink-0">Total Fee</span>
                  <span className="text-foreground font-mono text-xs text-right">
                    {formatFee(quoteData.totalFee)} {fromToken.symbol}
                  </span>
                </div>
              )}
            </div>
          )}


          {/* Swap Action Button - Only show when not in success/error state */}
          {batchSwap.currentStep !== 'success' && batchSwap.currentStep !== 'error' && (
            <Button
              variant="swap"
              size="xl"
              className="w-full mt-5 liquid-metal-cursor"
              onMouseMove={handleMouseMove}
              onClick={handleSwap}
              disabled={isButtonDisabled}
              style={{
                '--mouse-x': `${mousePos.x}%`,
                '--mouse-y': `${mousePos.y}%`,
              } as React.CSSProperties}
            >
              {getButtonText()}
            </Button>
          )}

          {/* Transaction Progress Status - Inline Display */}
          {batchSwap.currentStep !== 'idle' && batchSwap.currentStep !== 'success' && batchSwap.currentStep !== 'error' && (
            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="space-y-3">
                {batchSwap.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {step.status === 'complete' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {step.status === 'active' && (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      {step.status === 'error' && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.status === 'active' ? 'text-primary' :
                        step.status === 'complete' ? 'text-green-500' :
                        step.status === 'error' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                      {step.hash && step.status === 'active' && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {step.hash.slice(0, 10)}...{step.hash.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {batchSwap.steps.some(s => s.status === 'active') && (
                <p className="text-xs text-primary/70 mt-3 text-center">
                  Please confirm the transaction in your wallet
                </p>
              )}
            </div>
          )}

          {/* Transaction Success Display */}
          {batchSwap.currentStep === 'success' && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-green-500 mb-1">Swap Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your swap has been completed successfully
                  </p>
                </div>
              </div>

              {/* Transaction Hashes */}
              {batchSwap.steps.filter(s => s.hash).length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold">Transaction Hash:</p>
                  {batchSwap.steps.filter(s => s.hash).map((step, index) => (
                    <div key={index} className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://explorer.testnet.riselabs.xyz/tx/${step.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-primary hover:underline flex-1 truncate"
                          title={step.hash}
                        >
                          {step.hash}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(step.hash || '');
                            toast({ title: "Copied!", description: "Transaction hash copied to clipboard" });
                          }}
                          className="text-xs text-primary hover:text-primary/80 flex-shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => {
                  batchSwap.reset();
                  setFromValue("");
                  setToValue("");
                  setQuoteData(null);
                  setRouteInfo("");
                }}
                className="w-full mt-3"
                variant="default"
              >
                Done
              </Button>
            </div>
          )}

          {/* Transaction Error Display */}
          {batchSwap.currentStep === 'error' && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 min-w-0">
              <div className="flex items-start gap-3 mb-3 min-w-0">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-destructive mb-1">Transaction Failed</h3>
                  <p 
                    className="text-sm text-muted-foreground min-w-0"
                    style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'break-word'
                    }}
                  >
                    {batchSwap.error?.message || 'An error occurred while processing your transaction'}
                  </p>
                  {batchSwap.steps.find(s => s.hash) && (
                    <div className="mt-2 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                      <p 
                        className="text-xs font-mono text-muted-foreground min-w-0"
                        style={{ 
                          wordBreak: 'break-all', 
                          overflowWrap: 'anywhere'
                        }}
                      >
                        {batchSwap.steps.find(s => s.hash)?.hash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => {
                  batchSwap.reset();
                }}
                className="w-full"
                variant="destructive"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* c-smaller-better indicator */}
          {quoteData && 'cSmallerBetterDemonstrated' in quoteData && quoteData.cSmallerBetterDemonstrated && (
            <div className="mt-3 text-center">
              <span className="text-xs text-muted-foreground">
                ✨ Optimized with c-smaller-better property
              </span>
            </div>
          )}
        </div>
      </div>

      <TokenSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleTokenSelect}
        excludeToken={selectingFor === "from" ? toToken.symbol : fromToken.symbol}
      />
    </>
  );
};

export default EnhancedSwapCard;
