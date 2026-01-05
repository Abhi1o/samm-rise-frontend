import { useState, useEffect } from "react";
import { ArrowDown, Settings, RefreshCw, Info, Zap, Check, AlertCircle } from "lucide-react";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token } from "./TokenSelectModal";
import { Button } from "./ui/button";
import { sammApi } from "@/services/sammApi";
import { useToast } from "@/hooks/use-toast";
import { riseChain } from "@/config/chains";
import { commonTokens, isNativeToken } from "@/config/tokens";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { getCrossPoolRouter } from "@/config/contracts";
import { useChainId } from "wagmi";
import { parseUnits, Address } from "viem";

const EnhancedSwapCard = () => {
  const { toast } = useToast();
  const chainId = useChainId();
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [loading, setLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<string>("");

  // Get RiseChain tokens
  const riseChainTokens = commonTokens[riseChain.id] || [];

  const [fromToken, setFromToken] = useState({
    symbol: riseChainTokens[3]?.symbol || "USDC",
    icon: riseChainTokens[3]?.icon || "💲",
    balance: "0.00",
    address: riseChainTokens[3]?.address || "",
    decimals: riseChainTokens[3]?.decimals || 6,
  });

  const [toToken, setToToken] = useState({
    symbol: riseChainTokens[4]?.symbol || "USDT",
    icon: riseChainTokens[4]?.icon || "💵",
    balance: "0.00",
    address: riseChainTokens[4]?.address || "",
    decimals: riseChainTokens[4]?.decimals || 6,
  });

  // Get router address
  const routerAddress = getCrossPoolRouter(chainId);

  // Check if token needs approval (native tokens don't need approval)
  const needsTokenApproval = fromToken.address && !isNativeToken(fromToken.address);
  const amountInBigInt = fromValue ? parseUnits(fromValue, fromToken.decimals) : BigInt(0);

  // Token approval hook
  const {
    needsApproval,
    approvalState,
    approveToken,
    isApproving,
  } = useTokenApproval({
    tokenAddress: fromToken.address as Address,
    spenderAddress: routerAddress,
    amountNeeded: amountInBigInt,
    enabled: needsTokenApproval && !!fromValue,
  });

  // Swap execution hook
  const { executeSwap, swapState, isLoading: isSwapping, reset: resetSwap } = useSwapExecution();

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

  const fetchQuote = async () => {
    try {
      setLoading(true);
      
      // Convert amount to smallest unit based on token decimals
      const amountInSmallestUnit = (parseFloat(fromValue) * Math.pow(10, fromToken.decimals)).toString();
      
      console.log('Fetching quote:', {
        chain: 'risechain',
        amount: amountInSmallestUnit,
        fromToken: fromToken.symbol,
        fromAddress: fromToken.address,
        toToken: toToken.symbol,
        toAddress: toToken.address
      });
      
      // Try to get quote from backend
      const quote = await sammApi.getSwapQuote(
        'risechain',
        amountInSmallestUnit,
        fromToken.address,
        toToken.address
      );

      setQuoteData(quote);

      console.log('Quote received:', quote);

      // Check if it's a direct swap or multi-hop
      if ('bestShard' in quote) {
        // Direct swap
        const outputAmount = parseFloat(quote.bestShard.amountOut) / Math.pow(10, toToken.decimals);
        setToValue(outputAmount.toFixed(6));
        setRouteInfo(`Direct swap via ${quote.bestShard.shardName}`);
        console.log('Direct swap:', outputAmount, toToken.symbol);
      } else if ('route' in quote) {
        // Multi-hop
        const outputAmount = parseFloat(quote.amountOut) / Math.pow(10, toToken.decimals);
        setToValue(outputAmount.toFixed(6));
        setRouteInfo(`Multi-hop: ${quote.path.join(' → ')}`);
        console.log('Multi-hop swap:', outputAmount, toToken.symbol);
      }
    } catch (error: any) {
      console.error('Failed to fetch quote:', error);
      console.error('Error details:', {
        message: error.message,
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

  const handleSwap = async () => {
    if (!fromToken.address || !toToken.address || !quoteData) return;

    try {
      // Step 1: Approve token if needed
      if (needsTokenApproval && needsApproval) {
        await approveToken();
        return; // User will click swap again after approval
      }

      // Step 2: Execute swap
      await executeSwap({
        fromToken: fromToken.address as Address,
        toToken: toToken.address as Address,
        amountIn: fromValue,
        amountOut: toValue,
        fromDecimals: fromToken.decimals,
        toDecimals: toToken.decimals,
        quoteData,
      });

      // Reset form on success
      if (swapState.status === 'success') {
        setFromValue('');
        setToValue('');
        setQuoteData(null);
        setRouteInfo('');
      }
    } catch (error) {
      console.error('Swap failed:', error);
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
    const selectedToken = riseChainTokens.find(t => t.symbol === token.symbol);
    if (!selectedToken) return;

    const tokenData = {
      symbol: selectedToken.symbol,
      icon: selectedToken.icon || token.icon,
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

  const formatFee = (fee: string, decimals: number) => {
    const feeAmount = parseFloat(fee) / Math.pow(10, decimals);
    return feeAmount.toFixed(6);
  };

  const getRate = () => {
    if (!fromValue || !toValue || parseFloat(fromValue) === 0) return null;
    const rate = parseFloat(toValue) / parseFloat(fromValue);
    return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
  };

  return (
    <>
      <div className="w-full max-w-[420px] mx-auto">
        <div className="glass-card rounded-3xl p-5 md:p-6 metal-shine">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Swap</h2>
              <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                RiseChain
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
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Rate</span>
                <span className="text-foreground font-mono text-xs">{getRate()}</span>
              </div>
              
              {'bestShard' in quoteData && (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Shard</span>
                    <span className="text-chrome font-mono text-xs">{quoteData.bestShard.shardName}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="text-foreground font-mono text-xs">
                      {formatFee(quoteData.bestShard.tradeFee, fromToken.decimals)} {fromToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span className={`font-mono text-xs ${parseFloat(quoteData.bestShard.priceImpact) > 1 ? 'text-red-500' : 'text-green-500'}`}>
                      {quoteData.bestShard.priceImpact}%
                    </span>
                  </div>
                </>
              )}

              {'steps' in quoteData && (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Hops</span>
                    <span className="text-chrome font-mono text-xs">{quoteData.steps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Fee</span>
                    <span className="text-foreground font-mono text-xs">
                      {formatFee(quoteData.totalFee, fromToken.decimals)} {fromToken.symbol}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Transaction Status */}
          {swapState.status === 'confirming' && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Transaction confirming...</span>
              </div>
            </div>
          )}

          {swapState.status === 'success' && (
            <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Check className="w-4 h-4" />
                <span>Swap successful!</span>
              </div>
            </div>
          )}

          {swapState.status === 'error' && swapState.error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span>{swapState.error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  resetSwap();
                  handleSwap();
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Swap Action Button */}
          <Button
            variant="swap"
            size="xl"
            className="w-full mt-5 liquid-metal-cursor"
            onMouseMove={handleMouseMove}
            onClick={handleSwap}
            disabled={!fromValue || loading || !toValue || isApproving || isSwapping}
            style={{
              '--mouse-x': `${mousePos.x}%`,
              '--mouse-y': `${mousePos.y}%`,
            } as React.CSSProperties}
          >
            {isApproving
              ? "Approving..."
              : isSwapping
              ? swapState.status === 'signing'
                ? "Sign in wallet..."
                : "Confirming..."
              : needsTokenApproval && needsApproval
              ? `Approve ${fromToken.symbol}`
              : loading
              ? "Fetching quote..."
              : fromValue && toValue
              ? "Swap"
              : "Enter an amount"}
          </Button>

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
