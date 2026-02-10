import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";
import { getTokensForChain } from "@/config/tokens";
import TokenLogo from "./TokenLogo";
import { usePoolData } from "@/hooks/usePoolData";
import { useAccount, useReadContract } from "wagmi";
import { SAMMPoolABI } from "@/config/abis";
import { formatUnits, parseUnits, Address } from "viem";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useAddLiquidity } from "@/hooks/useAddLiquidity";
import { useToast } from "@/hooks/use-toast";

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShardSize = "Small" | "Medium" | "Large";

const AddLiquidityModal = ({ isOpen, onClose }: AddLiquidityModalProps) => {
  const { selectedNetwork } = useNetwork();
  const { address: userAddress } = useAccount();
  const { pools, isLoading: poolsLoading } = usePoolData();
  const { toast } = useToast();

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
  const { balance: balance0, isLoading: balance0Loading } = useTokenBalance(
    selectedToken0?.address as Address,
    userAddress
  );
  const { balance: balance1, isLoading: balance1Loading } = useTokenBalance(
    selectedToken1?.address as Address,
    userAddress
  );

  // Token approvals
  const {
    needsApproval: needsApproval0,
    approve: approve0,
    isApproving: isApproving0,
  } = useTokenApproval(
    selectedToken0?.address as Address,
    selectedPool?.address as Address,
    amount0 ? parseUnits(amount0, selectedToken0?.decimals || 18) : 0n
  );

  const {
    needsApproval: needsApproval1,
    approve: approve1,
    isApproving: isApproving1,
  } = useTokenApproval(
    selectedToken1?.address as Address,
    selectedPool?.address as Address,
    amount1 ? parseUnits(amount1, selectedToken1?.decimals || 18) : 0n
  );

  // Add liquidity hook
  const { addLiquidity, isLoading: isAddingLiquidity } = useAddLiquidity();

  // Calculate pool price and reserves
  const poolInfo = useMemo(() => {
    if (!poolState || !selectedToken0 || !selectedToken1) return null;

    const [pairToken0, pairToken1] = selectedPool?.pairName.split('-') || [];
    const isToken0First = pairToken0 === selectedToken0.symbol;

    const reserveA = poolState.reserveA;
    const reserveB = poolState.reserveB;

    const reserve0 = isToken0First ? reserveA : reserveB;
    const reserve1 = isToken0First ? reserveB : reserveA;

    const reserve0Formatted = parseFloat(formatUnits(reserve0, selectedToken0.decimals));
    const reserve1Formatted = parseFloat(formatUnits(reserve1, selectedToken1.decimals));

    const price = reserve1Formatted / reserve0Formatted;

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

  // Handle add liquidity
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
      // Check if approvals are needed
      if (needsApproval0) {
        await approve0();
        return;
      }

      if (needsApproval1) {
        await approve1();
        return;
      }

      // Calculate minimum amounts with slippage
      const slippageMultiplier = 1 - parseFloat(slippage) / 100;
      const amountAMin = (parseFloat(amount0) * slippageMultiplier).toFixed(selectedToken0.decimals);
      const amountBMin = (parseFloat(amount1) * slippageMultiplier).toFixed(selectedToken1.decimals);

      // Determine which token is A and which is B based on pool
      const [pairToken0, pairToken1] = selectedPool.pairName.split('-');
      const isToken0First = pairToken0 === selectedToken0.symbol;

      await addLiquidity({
        poolAddress: selectedPool.address as Address,
        tokenA: (isToken0First ? selectedToken0.address : selectedToken1.address) as Address,
        tokenB: (isToken0First ? selectedToken1.address : selectedToken0.address) as Address,
        amountADesired: isToken0First ? amount0 : amount1,
        amountBDesired: isToken0First ? amount1 : amount0,
        amountAMin: isToken0First ? amountAMin : amountBMin,
        amountBMin: isToken0First ? amountBMin : amountAMin,
        decimalsA: isToken0First ? selectedToken0.decimals : selectedToken1.decimals,
        decimalsB: isToken0First ? selectedToken1.decimals : selectedToken0.decimals,
      });

      // Reset form on success
      setAmount0("");
      setAmount1("");
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Add liquidity error:", error);
    }
  };

  const isLoading = poolsLoading || poolStateLoading || balance0Loading || balance1Loading;
  const canAddLiquidity = selectedPool && amount0 && amount1 && userAddress && !isLoading;
  const needsAnyApproval = needsApproval0 || needsApproval1;

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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                    {poolInfo.reserve0Formatted.toFixed(4)} {selectedToken0?.symbol}
                  </p>
                  <p className="font-semibold">
                    {poolInfo.reserve1Formatted.toFixed(4)} {selectedToken1?.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Current Price</p>
                  <p className="font-semibold">
                    1 {selectedToken0?.symbol} = {poolInfo.price.toFixed(6)} {selectedToken1?.symbol}
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
                      disabled={isLoading || !poolInfo}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Balance: {balance0 ? parseFloat(formatUnits(balance0, selectedToken0?.decimals || 18)).toFixed(4) : "0.00"}</span>
                  {balance0 && (
                    <button
                      onClick={() => setAmount0(formatUnits(balance0, selectedToken0?.decimals || 18))}
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
                      disabled={isLoading || !poolInfo}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Balance: {balance1 ? parseFloat(formatUnits(balance1, selectedToken1?.decimals || 18)).toFixed(4) : "0.00"}</span>
                  {balance1 && (
                    <button
                      onClick={() => {
                        const maxAmount1 = formatUnits(balance1, selectedToken1?.decimals || 18);
                        setAmount1(maxAmount1);
                        // Calculate corresponding amount0
                        if (poolInfo) {
                          const calculatedAmount0 = parseFloat(maxAmount1) / poolInfo.price;
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
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          )}

          {/* Add Liquidity Button */}
          <Button
            variant="swap"
            size="lg"
            className="w-full rounded-xl py-6 text-lg font-bold"
            onClick={handleAddLiquidity}
            disabled={!canAddLiquidity || isAddingLiquidity || isApproving0 || isApproving1}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : !userAddress ? (
              "Connect Wallet"
            ) : !selectedPool ? (
              "Select Pool"
            ) : !amount0 || !amount1 ? (
              "Enter Amounts"
            ) : isApproving0 || isApproving1 ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Approving...
              </>
            ) : needsApproval0 ? (
              `Approve ${selectedToken0?.symbol}`
            ) : needsApproval1 ? (
              `Approve ${selectedToken1?.symbol}`
            ) : isAddingLiquidity ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Adding Liquidity...
              </>
            ) : (
              "Add Liquidity"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLiquidityModal;
