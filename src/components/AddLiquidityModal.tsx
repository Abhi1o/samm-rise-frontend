import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";
import { getTokensForChain } from "@/config/tokens";
import TokenLogo from "./TokenLogo";
import { usePoolData } from "@/hooks/usePoolData";
import { useAccount, useReadContract } from "wagmi";
import { SAMMPoolABI } from "@/config/abis";
import { formatUnits, parseUnits, Address } from "viem";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useBatchAddLiquidity } from "@/hooks/useBatchAddLiquidity";
import { useToast } from "@/hooks/use-toast";

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShardSize = "Small" | "Medium" | "Large";

/**
 * Format a number for display, avoiding scientific notation
 * @param num - Number to format
 * @param maxDecimals - Maximum decimal places (default: 6)
 */
const formatDisplayNumber = (num: number, maxDecimals: number = 6): string => {
  if (num === 0) return '0';
  if (!isFinite(num)) return '0';

  // For extremely large numbers (> 1 quadrillion), use exponential notation
  if (Math.abs(num) > 1e12) {
    return num.toExponential(2);
  }

  // For large numbers (thousands+), format with comma separators
  if (Math.abs(num) >= 1) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(maxDecimals, 4),
    });
  }

  // For numbers between 0 and 1, show more decimal places
  if (Math.abs(num) >= 0.0001) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    });
  }

  // For very small numbers, use exponential notation
  return num.toExponential(2);
};

const AddLiquidityModal = ({ isOpen, onClose }: AddLiquidityModalProps) => {
  const { selectedNetwork } = useNetwork();
  const { address: userAddress } = useAccount();
  const { pools, isLoading: poolsLoading } = usePoolData();
  const { toast } = useToast();
  const successToastShown = useRef(false);

  // Get tokens for current network
  const tokens = selectedNetwork ? getTokensForChain(selectedNetwork.chainId) : [];

  // State
  const [selectedToken0, setSelectedToken0] = useState(tokens[0]);
  const [selectedToken1, setSelectedToken1] = useState(tokens[1]);
  const [token0DropdownOpen, setToken0DropdownOpen] = useState(false);
  const [token1DropdownOpen, setToken1DropdownOpen] = useState(false);
  const [shardSize, setShardSize] = useState<ShardSize>("Medium");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  // Update tokens when network changes
  useEffect(() => {
    if (tokens.length >= 2) {
      setSelectedToken0(tokens[0]);
      setSelectedToken1(tokens[1]);
    }
  }, [selectedNetwork]);

  // Find matching pool for selected tokens and shard size
  const selectedPool = useMemo(() => {
    if (!selectedToken0 || !selectedToken1) return null;
    
    const pairName1 = `${selectedToken0.symbol}-${selectedToken1.symbol}`;
    const pairName2 = `${selectedToken1.symbol}-${selectedToken0.symbol}`;
    
    return pools.find(pool => {
      const matchesPair = pool.pairName === pairName1 || pool.pairName === pairName2;
      const matchesSize = pool.name.includes(shardSize);
      return matchesPair && matchesSize;
    });
  }, [pools, selectedToken0, selectedToken1, shardSize]);

  // Fetch pool state
  const { data: poolState, isLoading: poolStateLoading } = useReadContract({
    address: selectedPool?.address as Address,
    abi: SAMMPoolABI,
    functionName: 'getPoolState',
    query: {
      enabled: !!selectedPool,
    },
  });

  // Get token balances
  const { 
    balanceBigInt: balance0, 
    isLoading: balance0Loading,
    refetch: refetchBalance0 
  } = useTokenBalance(selectedToken0);
  
  const { 
    balanceBigInt: balance1, 
    isLoading: balance1Loading,
    refetch: refetchBalance1 
  } = useTokenBalance(selectedToken1);

  // Calculate minimum amounts with slippage
  const amountAMin = amount0 && slippage
    ? (parseFloat(amount0) * (1 - parseFloat(slippage) / 100)).toString()
    : '0';
  const amountBMin = amount1 && slippage
    ? (parseFloat(amount1) * (1 - parseFloat(slippage) / 100)).toString()
    : '0';

  // Batch add liquidity hook - handles both approvals + add liquidity in single user action
  const batchLiquidity = useBatchAddLiquidity({
    poolAddress: selectedPool?.address as Address,
    poolTokenA: poolState?.tokenA as Address, // Pool's canonical tokenA from getReserves
    poolTokenB: poolState?.tokenB as Address, // Pool's canonical tokenB from getReserves
    token0: selectedToken0,
    token1: selectedToken1,
    amount0: amount0,
    amount1: amount1,
    amount0Min: amountAMin,
    amount1Min: amountBMin,
  });

  // Handle success state - refresh balances, show success inline (no auto-close)
  useEffect(() => {
    if (batchLiquidity.currentStep === 'success') {
      // Refresh balances immediately
      console.log('Refreshing balances after successful liquidity addition...');
      refetchBalance0();
      refetchBalance1();

      // Show success toast only once
      if (!successToastShown.current) {
        successToastShown.current = true;
        toast({
          title: "Liquidity Added Successfully!",
          description: "Your liquidity has been added to the pool",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchLiquidity.currentStep, toast]);

  // Reset state when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      batchLiquidity.reset();
      successToastShown.current = false;
      setAmount0("");
      setAmount1("");
    } else {
      batchLiquidity.reset();
      successToastShown.current = false;
      setAmount0("");
      setAmount1("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Calculate pool price and reserves
  const poolInfo = useMemo(() => {
    if (!poolState || !selectedToken0 || !selectedToken1) return null;

    // Get token addresses from pool state
    const poolTokenA = poolState.tokenA?.toLowerCase();
    const poolTokenB = poolState.tokenB?.toLowerCase();
    const token0Addr = selectedToken0.address.toLowerCase();
    const token1Addr = selectedToken1.address.toLowerCase();

    // Determine which reserve corresponds to which selected token
    let reserve0: bigint, reserve1: bigint;
    if (poolTokenA === token0Addr) {
      // selectedToken0 is tokenA in the pool
      reserve0 = poolState.reserveA;
      reserve1 = poolState.reserveB;
    } else if (poolTokenB === token0Addr) {
      // selectedToken0 is tokenB in the pool
      reserve0 = poolState.reserveB;
      reserve1 = poolState.reserveA;
    } else {
      // Fallback: token not found in pool (shouldn't happen)
      console.error('[AddLiquidityModal] Token mismatch in pool', {
        poolTokenA,
        poolTokenB,
        token0Addr,
        token1Addr,
      });
      return null;
    }

    // Format reserves with correct decimals
    const reserve0Formatted = parseFloat(formatUnits(reserve0, selectedToken0.decimals));
    const reserve1Formatted = parseFloat(formatUnits(reserve1, selectedToken1.decimals));

    // Calculate price with safeguards
    let price = 0;
    if (reserve0Formatted > 0 && reserve1Formatted > 0) {
      price = reserve1Formatted / reserve0Formatted;
    }

    // Debug logging
    console.log('[AddLiquidityModal] Pool Info:', {
      pool: selectedPool?.name,
      poolTokenA,
      poolTokenB,
      token0: `${selectedToken0.symbol} (${token0Addr})`,
      token1: `${selectedToken1.symbol} (${token1Addr})`,
      reserveA: poolState.reserveA.toString(),
      reserveB: poolState.reserveB.toString(),
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      reserve0Formatted,
      reserve1Formatted,
      price,
    });

    return {
      reserve0,
      reserve1,
      reserve0Formatted,
      reserve1Formatted,
      price,
      totalSupply: poolState.totalSupply,
    };
  }, [poolState, selectedToken0, selectedToken1, selectedPool]);

  // Auto-calculate amount1 when amount0 changes
  useEffect(() => {
    if (amount0 && poolInfo && !poolStateLoading) {
      const amount0Num = parseFloat(amount0);
      if (!isNaN(amount0Num) && amount0Num > 0) {
        const calculatedAmount1 = amount0Num * poolInfo.price;
        setAmount1(calculatedAmount1.toFixed(6));
      }
    }
  }, [amount0, poolInfo, poolStateLoading]);

  // Handle add liquidity with proper approval flow
  const handleAddLiquidity = async () => {
    if (!selectedPool || !selectedToken0 || !selectedToken1 || !amount0 || !amount1) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!userAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to add liquidity",
        variant: "destructive",
      });
      return;
    }

    try {
      // Execute batch add liquidity (all approvals + add in single user action)
      await batchLiquidity.executeBatchAddLiquidity();
      // Success handled by useEffect above
    } catch (error: any) {
      console.error("Batch add liquidity error:", error);
      // Error is shown in BatchProgressModal
    }
  };

  // Get button text based on current state - Premium UX with detailed status
  const getButtonText = () => {
    if (!userAddress) return "Connect Wallet";
    if (!selectedPool) return "Select Pool";
    if (!amount0 || !amount1) return "Enter Amounts";

    // Batch liquidity states - Show signing, processing, and completion states
    switch (batchLiquidity.currentStep) {
      case 'checking':
        return "Sign Transaction";
      case 'approving_token0':
        return `Processing Approval (${selectedToken0?.symbol})...`;
      case 'approved_token0':
        return batchLiquidity.steps.filter(s => s.label.includes('Approve')).length > 1
          ? "Sign Next Transaction"
          : "Sign Transaction";
      case 'approving_token1':
        return `Processing Approval (${selectedToken1?.symbol})...`;
      case 'approved_token1':
        return "Sign Transaction";
      case 'adding_liquidity':
        return "Processing Transaction...";
      case 'success':
        return "Transaction Complete ✓";
      case 'error':
        return "Try Again";
      default:
        // Show appropriate text based on what approvals are needed
        const needsApprovals = batchLiquidity.steps.filter(s => s.label.includes('Approve')).length;
        return needsApprovals > 0 ? "Approve & Add Liquidity" : "Add Liquidity";
    }
  };

  // Get the active transaction hash for display
  const getActiveTransactionHash = () => {
    const activeStep = batchLiquidity.steps.find(s => s.status === 'active' || s.status === 'complete');
    return activeStep?.hash;
  };

  // Get error message from batch liquidity
  const getErrorMessage = () => {
    if (batchLiquidity.currentStep === 'error' && batchLiquidity.error) {
      return batchLiquidity.error.message || 'Transaction failed';
    }
    return null;
  };

  const isLoading = poolsLoading || poolStateLoading || balance0Loading || balance1Loading;
  const isButtonDisabled =
    !selectedPool ||
    !amount0 ||
    !amount1 ||
    !userAddress ||
    isLoading ||
    batchLiquidity.isLoading ||
    batchLiquidity.currentStep === 'success';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Liquidity to SAMM Pool</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Network Display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Network:</span>
            <span className="font-semibold text-foreground">
              {selectedNetwork?.displayName || "Not Connected"}
            </span>
          </div>

          {/* Token Pair Selection */}
          <div>
            <p className="text-sm text-primary font-semibold mb-3">SELECT TOKEN PAIR</p>
            <div className="flex items-center gap-3">
              {/* Token 0 Selector */}
              <div className="relative flex-1">
                <button
                  onClick={() => setToken0DropdownOpen(!token0DropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                  disabled={isLoading || batchLiquidity.currentStep !== 'idle'}
                >
                  <TokenLogo
                    symbol={selectedToken0?.symbol || ""}
                    logoURI={selectedToken0?.logoURI}
                    icon={selectedToken0?.icon}
                    size="sm"
                  />
                  <span className="flex-1 text-left font-bold">{selectedToken0?.symbol}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
                {token0DropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {tokens.filter(t => t.symbol !== selectedToken1?.symbol).map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          setSelectedToken0(token);
                          setToken0DropdownOpen(false);
                          setAmount0("");
                          setAmount1("");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <TokenLogo
                          symbol={token.symbol}
                          logoURI={token.logoURI}
                          icon={token.icon}
                          size="sm"
                        />
                        <span className="font-medium">{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-muted-foreground text-xl">+</span>

              {/* Token 1 Selector */}
              <div className="relative flex-1">
                <button
                  onClick={() => setToken1DropdownOpen(!token1DropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                  disabled={isLoading || batchLiquidity.currentStep !== 'idle'}
                >
                  <TokenLogo
                    symbol={selectedToken1?.symbol || ""}
                    logoURI={selectedToken1?.logoURI}
                    icon={selectedToken1?.icon}
                    size="sm"
                  />
                  <span className="flex-1 text-left font-bold">{selectedToken1?.symbol}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
                {token1DropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {tokens.filter(t => t.symbol !== selectedToken0?.symbol).map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          setSelectedToken1(token);
                          setToken1DropdownOpen(false);
                          setAmount0("");
                          setAmount1("");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <TokenLogo
                          symbol={token.symbol}
                          logoURI={token.logoURI}
                          icon={token.icon}
                          size="sm"
                        />
                        <span className="font-medium">{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shard Size Selection */}
          <div>
            <p className="text-sm text-primary font-semibold mb-3">SELECT SHARD SIZE</p>
            <div className="flex gap-2">
              {(["Small", "Medium", "Large"] as ShardSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setShardSize(size);
                    setAmount0("");
                    setAmount1("");
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    shardSize === size
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                  disabled={isLoading || batchLiquidity.currentStep !== 'idle'}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Pool Info */}
          {selectedPool && poolInfo && (
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Pool Reserves</p>
                  <p className="font-semibold">
                    {formatDisplayNumber(poolInfo.reserve0Formatted, 4)} {selectedToken0?.symbol}
                  </p>
                  <p className="font-semibold">
                    {formatDisplayNumber(poolInfo.reserve1Formatted, 4)} {selectedToken1?.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Current Price</p>
                  <p className="font-semibold">
                    1 {selectedToken0?.symbol} = {formatDisplayNumber(poolInfo.price, 6)} {selectedToken1?.symbol}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Pool Warning */}
          {!selectedPool && !isLoading && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Pool Not Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No {shardSize} shard exists for this token pair. Try a different shard size or token pair.
                </p>
              </div>
            </div>
          )}

          {/* Amount Inputs */}
          {selectedPool && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-primary font-semibold">DEPOSIT AMOUNTS</p>
              </div>

              {/* Token 0 Input */}
              <div className="bg-secondary/30 rounded-xl p-4 mb-3 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TokenLogo
                      symbol={selectedToken0?.symbol || ""}
                      logoURI={selectedToken0?.logoURI}
                      icon={selectedToken0?.icon}
                      size="sm"
                    />
                    <span className="font-bold">{selectedToken0?.symbol}</span>
                  </div>
                  <div className="text-right">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount0}
                      onChange={(e) => setAmount0(e.target.value)}
                      className="w-32 text-right text-lg font-semibold bg-transparent border-none focus-visible:ring-0 p-0"
                      disabled={isLoading || !poolInfo || batchLiquidity.currentStep !== 'idle'}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Balance: {balance0 ? parseFloat(formatUnits(balance0, selectedToken0?.decimals || 18)).toFixed(4) : "0.00"}</span>
                  {balance0 && batchLiquidity.currentStep === 'idle' && (
                    <button
                      onClick={() => {
                        const maxAmount = parseFloat(formatUnits(balance0, selectedToken0?.decimals || 18));
                        setAmount0(maxAmount.toString());
                      }}
                      className="text-primary hover:underline"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* Token 1 Input */}
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TokenLogo
                      symbol={selectedToken1?.symbol || ""}
                      logoURI={selectedToken1?.logoURI}
                      icon={selectedToken1?.icon}
                      size="sm"
                    />
                    <span className="font-bold">{selectedToken1?.symbol}</span>
                  </div>
                  <div className="text-right">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount1}
                      onChange={(e) => setAmount1(e.target.value)}
                      className="w-32 text-right text-lg font-semibold bg-transparent border-none focus-visible:ring-0 p-0"
                      disabled={isLoading || !poolInfo || batchLiquidity.currentStep !== 'idle'}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Balance: {balance1 ? parseFloat(formatUnits(balance1, selectedToken1?.decimals || 18)).toFixed(4) : "0.00"}</span>
                  {balance1 && batchLiquidity.currentStep === 'idle' && (
                    <button
                      onClick={() => {
                        const maxAmount1 = parseFloat(formatUnits(balance1, selectedToken1?.decimals || 18));
                        setAmount1(maxAmount1.toString());
                        // Calculate corresponding amount0
                        if (poolInfo) {
                          const calculatedAmount0 = maxAmount1 / poolInfo.price;
                          setAmount0(calculatedAmount0.toFixed(6));
                        }
                      }}
                      className="text-primary hover:underline"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Slippage Tolerance */}
          {selectedPool && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Slippage Tolerance</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20 text-right"
                  step="0.1"
                  min="0.1"
                  max="50"
                  disabled={batchLiquidity.currentStep !== 'idle'}
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          )}

          {/* Transaction Progress Status - Inline Display */}
          {batchLiquidity.currentStep !== 'idle' && batchLiquidity.currentStep !== 'success' && batchLiquidity.currentStep !== 'error' && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="space-y-3">
                {batchLiquidity.steps.map((step, index) => (
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
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.status === 'active' ? 'text-primary' :
                        step.status === 'complete' ? 'text-green-500' :
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
              {batchLiquidity.steps.some(s => s.status === 'active') && (
                <p className="text-xs text-primary/70 mt-3 text-center">
                  Please confirm the transaction in your wallet
                </p>
              )}
            </div>
          )}

          {/* Transaction Success Display */}
          {batchLiquidity.currentStep === 'success' && (
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-500 mb-1">Transaction Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your liquidity has been successfully added to the pool
                  </p>
                </div>
              </div>
              {batchLiquidity.steps.filter(s => s.hash).map((step, index) => (
                <div key={index} className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">{step.label}</p>
                  <a
                    href={`https://explorer.testnet.riselabs.xyz/tx/${step.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-primary hover:underline break-all"
                  >
                    {step.hash}
                  </a>
                </div>
              ))}
              <Button
                onClick={() => {
                  batchLiquidity.reset();
                  successToastShown.current = false;
                  setAmount0("");
                  setAmount1("");
                  onClose();
                }}
                className="w-full mt-4"
                variant="default"
              >
                Done
              </Button>
            </div>
          )}

          {/* Transaction Error Display */}
          {batchLiquidity.currentStep === 'error' && (
            <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-destructive mb-1">Transaction Failed</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {getErrorMessage() || 'An error occurred while processing your transaction'}
                  </p>
                  {batchLiquidity.steps.find(s => s.hash) && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {batchLiquidity.steps.find(s => s.hash)?.hash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => {
                  batchLiquidity.reset();
                }}
                className="w-full"
                variant="destructive"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Add Liquidity Button - Only show when not in success/error state */}
          {batchLiquidity.currentStep !== 'success' && batchLiquidity.currentStep !== 'error' && (
            <Button
              variant="swap"
              size="lg"
              className="w-full rounded-xl py-6 text-lg font-bold"
              onClick={handleAddLiquidity}
              disabled={isButtonDisabled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {batchLiquidity.isLoading && (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  )}
                  {getButtonText()}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLiquidityModal;
