import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowDown, Settings, RefreshCw, Info, Zap, CheckCircle2, AlertCircle, Loader2, XCircle, TriangleAlert, TrendingUp } from "lucide-react";
import { useAccount, useChainId, useSignTypedData, useSendTransaction, useSwitchChain, useWriteContract, usePublicClient } from "wagmi";
import { Address, formatUnits, erc20Abi } from "viem";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token } from "./TokenSelectModal";
import { Button } from "./ui/button";
import { sammApi } from "@/services/sammApi";
import { useToast } from "@/hooks/use-toast";
import { useNetwork } from "@/contexts/NetworkContext";
import { commonTokens } from "@/config/tokens";
import { useBatchSwap } from "@/hooks/useBatchSwap";
import { getCrossPoolRouter } from "@/config/contracts";
import { riseChain } from "@/config/chains";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { Token as ConfigToken } from "@/types/tokens";
import { formatUSD } from "@/utils/formatters";
import { QUOTE_DEBOUNCE_DELAY, PRICE_IMPACT_WARNING, PRICE_IMPACT_CRITICAL } from "@/utils/constants";

const EnhancedSwapCard = () => {
  const { toast } = useToast();
  const { selectedNetwork, selectedRoute, setSelectedRoute } = useNetwork();
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  // Sepolia public client — uses wagmi transport (Alchemy if configured, else public RPC)
  // This avoids CORS issues that `createPublicClient` with public RPCs has in the browser
  const sepoliaPublicClient = usePublicClient({ chainId: 11155111 });

  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [loading, setLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Route selection is now shared via NetworkContext so the header reflects it too
  const [uniswapStep, setUniswapStep] = useState<'idle' | 'preparing' | 'switching' | 'approving' | 'signing' | 'executing' | 'sending' | 'success' | 'error'>('idle');
  const [uniswapHash, setUniswapHash] = useState<string | null>(null);
  const [uniswapError, setUniswapError] = useState<string | null>(null);
  // Cached prepareSepolia result — reused by handleUniswapSwap to avoid a double API call
  const [preparedSepoliaData, setPreparedSepoliaData] = useState<any>(null);
  // Parsed Uniswap quote: { amountOut, gasFeeUsd, routing }
  const [uniswapQuoteData, setUniswapQuoteData] = useState<any>(null);
  // Sepolia balances: symbol → formatted amount (e.g. { USDC: "10.50", WETH: "0.05" })
  const [sepoliaBalances, setSepoliaBalances] = useState<Record<string, string>>({});
  const [sepoliaBalancesLoading, setSepoliaBalancesLoading] = useState(false);
  const [sepoliaRefreshTick, setSepoliaRefreshTick] = useState(0);

  // Get tokens for selected network
  // CRITICAL: Use wallet chainId directly instead of selectedNetwork context
  // This allows Sepolia tokens to show when wallet is on Sepolia (for Uniswap swaps)
  const networkTokens = chainId ? commonTokens[chainId] || [] : [];


  const [fromToken, setFromToken] = useState({
    symbol: networkTokens[2]?.symbol || "USDC",
    icon: networkTokens[2]?.icon || "💲",
    logoURI: networkTokens[2]?.logoURI,
    balance: "0.00",
    address: networkTokens[2]?.address || "",
    decimals: networkTokens[2]?.decimals || 6,
  });

  const [toToken, setToToken] = useState({
    symbol: networkTokens[3]?.symbol || "USDT",
    icon: networkTokens[3]?.icon || "💵",
    logoURI: networkTokens[3]?.logoURI,
    balance: "0.00",
    address: networkTokens[3]?.address || "",
    decimals: networkTokens[3]?.decimals || 6,
  });

  // Check if token is native (doesn't need approval)
  const isNativeToken = (address: string) => {
    return !address || address === "0x0000000000000000000000000000000000000000";
  };

  const needsTokenApproval = !isNativeToken(fromToken.address);

  // Get router address for approval — only valid on RiseChain, never on Sepolia or other chains
  const routerAddress = chainId === riseChain.id ? getCrossPoolRouter(riseChain.id) : undefined;

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
    // Don't reset tokens during an active Uniswap swap flow
    if (uniswapStep !== 'idle' && uniswapStep !== 'success' && uniswapStep !== 'error') {
      return;
    }
    
    if (selectedNetwork && networkTokens.length > 0) {
      setFromToken({
        symbol: networkTokens[2]?.symbol || networkTokens[0]?.symbol || "USDC",
        icon: networkTokens[2]?.icon || networkTokens[0]?.icon || "💲",
        logoURI: networkTokens[2]?.logoURI || networkTokens[0]?.logoURI,
        balance: "0.00",
        address: networkTokens[2]?.address || networkTokens[0]?.address || "",
        decimals: networkTokens[2]?.decimals || networkTokens[0]?.decimals || 6,
      });
      setToToken({
        symbol: networkTokens[3]?.symbol || networkTokens[1]?.symbol || "USDT",
        icon: networkTokens[3]?.icon || networkTokens[1]?.icon || "💵",
        logoURI: networkTokens[3]?.logoURI || networkTokens[1]?.logoURI,
        balance: "0.00",
        address: networkTokens[3]?.address || networkTokens[1]?.address || "",
        decimals: networkTokens[3]?.decimals || networkTokens[1]?.decimals || 6,
      });
      // Clear quote when network changes
      setFromValue("");
      setToValue("");
      setQuoteData(null);
      setRouteInfo("");
    }
  }, [selectedNetwork, uniswapStep]);

  // Fetch both SAMM and Uniswap quotes whenever amount or tokens change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!fromValue || parseFloat(fromValue) <= 0) {
      setToValue(""); setQuoteData(null); setUniswapQuoteData(null); setRouteInfo(""); setPreparedSepoliaData(null);
      return;
    }
    if (!fromToken.address || !toToken.address) {
      setToValue(""); setQuoteData(null); setUniswapQuoteData(null); setRouteInfo(""); return;
    }

    debounceRef.current = setTimeout(() => { fetchQuote(); }, QUOTE_DEBOUNCE_DELAY);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromValue, fromToken.address, toToken.address, userAddress]);


  // Fetch Sepolia token balances directly from Sepolia blockchain
  // NOTE: Backend /balances/:address returns RiseChain balances, not Sepolia
  // We must read directly from Sepolia chain using the token addresses from commonTokens[11155111]
  useEffect(() => {
    if (selectedRoute !== 'uniswap' || !userAddress || !sepoliaPublicClient) {
      setSepoliaBalances({});
      return;
    }
    let cancelled = false;
    setSepoliaBalancesLoading(true);

    const sepoliaTokens = commonTokens[11155111] || [];

    const fetchAll = async () => {
      const result: Record<string, string> = {};
      await Promise.all(
        sepoliaTokens.map(async (token) => {
          try {
            // Native ETH - check for both zero address and NATIVE_TOKEN_ADDRESS constant
            if (!token.address || 
                token.address === '0x0000000000000000000000000000000000000000' ||
                token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
              const bal = await sepoliaPublicClient.getBalance({ address: userAddress as Address });
              result[token.symbol] = formatUnits(bal, 18);
            } else {
              // @ts-ignore — viem version type mismatch with authorizationList
              const bal = await sepoliaPublicClient.readContract({
                address: token.address as Address,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [userAddress as Address],
              }) as bigint;
              result[token.symbol] = formatUnits(bal, token.decimals);
            }
          } catch {
            result[token.symbol] = '0.00';
          }
        })
      );
      return result;
    };

    fetchAll()
      .then((balances) => { if (!cancelled) setSepoliaBalances(balances); })
      .catch(() => { if (!cancelled) setSepoliaBalances({}); })
      .finally(() => { if (!cancelled) setSepoliaBalancesLoading(false); });

    return () => { cancelled = true; };
  }, [selectedRoute, userAddress, sepoliaPublicClient, sepoliaRefreshTick]);

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
    if (!fromValue || parseFloat(fromValue) <= 0) return;
    if (!fromToken.address || !toToken.address) return;

    setLoading(true);

    // ── Helper: SAMM (RiseChain) quote ──────────────────────────────────────
    const doSammFetch = async (): Promise<string | null> => {
      if (!selectedNetwork) return null;
      try {
        let amountInSmallestUnit: string;
        if (fromToken.decimals <= 8) {
          amountInSmallestUnit = Math.floor(parseFloat(fromValue) * Math.pow(10, fromToken.decimals)).toString();
        } else {
          const [whole = '0', fraction = ''] = fromValue.split('.');
          const paddedFraction = fraction.padEnd(fromToken.decimals, '0').slice(0, fromToken.decimals);
          amountInSmallestUnit = BigInt(whole + paddedFraction).toString();
        }

        const amountInHuman = formatUnits(BigInt(amountInSmallestUnit), fromToken.decimals);
        let estimatedOut: number;

        try {
          const poolsResponse = await sammApi.getPoolsForPair(fromToken.symbol, toToken.symbol);
          if (poolsResponse.shards && poolsResponse.shards.length > 0) {
            const largestPool = poolsResponse.shards[poolsResponse.shards.length - 1];
            let reserveIn: number, reserveOut: number;
            if (largestPool.tokenA === fromToken.symbol) {
              reserveIn = parseFloat(largestPool.reserveA);
              reserveOut = parseFloat(largestPool.reserveB);
            } else {
              reserveIn = parseFloat(largestPool.reserveB);
              reserveOut = parseFloat(largestPool.reserveA);
            }
            const amountInFloat = parseFloat(amountInHuman);
            estimatedOut = (amountInFloat * reserveOut) / (reserveIn + amountInFloat);
          } else {
            throw new Error('No direct pool');
          }
        } catch {
          const amountInFloat = parseFloat(amountInHuman);
          const intermediaries = ['USDC', 'WETH', 'USDT'];
          let foundRoute = false;
          estimatedOut = amountInFloat;

          for (const intermediate of intermediaries) {
            if (intermediate === fromToken.symbol || intermediate === toToken.symbol) continue;
            try {
              const leg1Response = await sammApi.getPoolsForPair(fromToken.symbol, intermediate);
              const leg2Response = await sammApi.getPoolsForPair(intermediate, toToken.symbol);
              if (leg1Response.shards?.length > 0 && leg2Response.shards?.length > 0) {
                const pool1 = leg1Response.shards[leg1Response.shards.length - 1];
                const pool2 = leg2Response.shards[leg2Response.shards.length - 1];
                let reserve1In: number, reserve1Out: number;
                if (pool1.tokenA === fromToken.symbol) {
                  reserve1In = parseFloat(pool1.reserveA); reserve1Out = parseFloat(pool1.reserveB);
                } else {
                  reserve1In = parseFloat(pool1.reserveB); reserve1Out = parseFloat(pool1.reserveA);
                }
                const intermediateAmount = (amountInFloat * reserve1Out) / (reserve1In + amountInFloat);
                let reserve2In: number, reserve2Out: number;
                if (pool2.tokenA === intermediate) {
                  reserve2In = parseFloat(pool2.reserveA); reserve2Out = parseFloat(pool2.reserveB);
                } else {
                  reserve2In = parseFloat(pool2.reserveB); reserve2Out = parseFloat(pool2.reserveA);
                }
                estimatedOut = (intermediateAmount * reserve2Out) / (reserve2In + intermediateAmount);
                foundRoute = true;
                break;
              }
            } catch { continue; }
          }
          if (!foundRoute) estimatedOut = amountInFloat;
        }

        const quote = await sammApi.getSwapQuote(fromToken.symbol, toToken.symbol, estimatedOut.toFixed(6));
        if (!quote || !quote.expectedAmountIn || !quote.amountOut) return null;

        setQuoteData(quote);
        if (quote.hops === 1) {
          setRouteInfo(`Direct swap via ${quote.selectedShards?.[0]?.slice(0, 10) || 'pool'}...`);
        } else {
          setRouteInfo(`Multi-hop: ${quote.route?.join(' → ') || 'Unknown route'}`);
        }
        return quote.amountOut as string;
      } catch (err: any) {
        console.error('[SAMM quote]', err);
        setQuoteData(null);
        return null;
      }
    };

    // ── Helper: Uniswap (Sepolia) quote ─────────────────────────────────────
    // Use EXACT_INPUT mode (user specifies input amount)
    // But validate against /compare endpoint which uses EXACT_OUTPUT (more reliable on Sepolia)
    const doUniswapFetch = async (): Promise<string | null> => {
      if (!userAddress) return null;
      try {
        // Get quote using EXACT_INPUT (user enters input amount)
        const prepared = await sammApi.prepareSepolia(
          fromToken.symbol, 
          toToken.symbol, 
          fromValue,
          userAddress,
          'EXACT_INPUT'  // User specifies input amount
        );
        
        const outputRaw: string = prepared.quote?.output?.amount ?? '0';
        const outputAmount = parseFloat(formatUnits(BigInt(outputRaw), toToken.decimals));
        
        setPreparedSepoliaData(prepared);
        setUniswapQuoteData({
          amountOut: outputAmount.toFixed(6),
          gasFeeUsd: prepared.quote?.gasFeeUSD,
          routing: prepared.routing ?? 'CLASSIC',
        });
        return outputAmount.toFixed(6);
      } catch (err: any) {
        console.error('[Uniswap quote]', err);
        setUniswapQuoteData(null);
        setPreparedSepoliaData(null);
        return null;
      }
    };

    try {
      const [sammOut, uniOut] = await Promise.all([doSammFetch(), doUniswapFetch()]);

      if (!sammOut && !uniOut) {
        setToValue('');
        toast({ title: "Quote Error", description: "Unable to get a quote for this pair", variant: "destructive" });
        return;
      }

      // Auto-select: more output = better for the user
      let bestRoute: 'samm' | 'uniswap' = 'samm';
      let bestOut = sammOut || uniOut || '';
      if (sammOut && uniOut) {
        bestRoute = parseFloat(uniOut) > parseFloat(sammOut) ? 'uniswap' : 'samm';
        bestOut = bestRoute === 'uniswap' ? uniOut : sammOut;
      } else if (uniOut && !sammOut) {
        bestRoute = 'uniswap';
        bestOut = uniOut;
      }

      setSelectedRoute(bestRoute);
      setToValue(bestOut);
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

  // Price impact: how much worse the swap rate is vs the market price
  const priceImpact = useMemo(() => {
    if (!fromValue || !toValue || !fromPrice || !toPrice) return null;
    const inputUSD = parseFloat(fromValue) * fromPrice;
    const outputUSD = parseFloat(toValue) * toPrice;
    if (inputUSD === 0) return null;
    return ((inputUSD - outputUSD) / inputUSD) * 100;
  }, [fromValue, toValue, fromPrice, toPrice]);

  // Derive best-route badge directly from both quotes (no broken /compare endpoint needed)
  const sammAmountFloat = quoteData?.amountOut ? parseFloat(quoteData.amountOut) : 0;
  const uniAmountFloat = uniswapQuoteData?.amountOut ? parseFloat(uniswapQuoteData.amountOut) : 0;
  const bothQuotesReady = sammAmountFloat > 0 && uniAmountFloat > 0;
  const sammIsBest = !bothQuotesReady ? sammAmountFloat > 0 : sammAmountFloat >= uniAmountFloat;
  const uniIsBest = bothQuotesReady && uniAmountFloat > sammAmountFloat;

  // Reset route selection and uniswap state when user changes tokens or amount
  useEffect(() => {
    setUniswapStep('idle');
    setUniswapHash(null);
    setUniswapError(null);
    setPreparedSepoliaData(null);
    setUniswapQuoteData(null);
  }, [fromToken.symbol, toToken.symbol, fromValue]);

  // Uniswap Permit2 swap flow
  const handleUniswapSwap = async () => {
    if (!isConnected || !userAddress || !fromValue) return;
    setUniswapStep('preparing');
    setUniswapError(null);
    setUniswapHash(null);
    try {
      // 1. CRITICAL: Always fetch a FRESH quote right before swapping
      // Permit2 signatures are time-sensitive and tied to a specific quote.
      // Reusing cached/stale signatures causes transaction failures.
      // See: https://api-docs.uniswap.org/guides/permit2
      console.log('[Uniswap] Fetching fresh quote for swap...');
      const prepared = await sammApi.prepareSepolia(fromToken.symbol, toToken.symbol, fromValue, userAddress);
      setPreparedSepoliaData(prepared); // Update cache for display

      // 2. Always force-switch to Sepolia.
      // Wagmi can cache stale chain state across page refreshes — if the cached
      // chainId is already 11155111 but MetaMask is on RiseChain, skipping the
      // switch causes a connector/connection chain mismatch on sendTransaction.
      // Calling switchChainAsync unconditionally forces MetaMask to be in sync.
      setUniswapStep('switching');
      await switchChainAsync({ chainId: 11155111 });

      // 3. ERC-20 one-time approval for Permit2 contract (if required)
      // The backend signals this via needsTokenApproval. This is a one-time tx per token.
      // Uses prepared.tokenIn (Sepolia ERC-20 address) — NOT fromToken.address (RiseChain address).
      // CRITICAL FIX: Check current allowance before attempting approval to avoid unnecessary transactions
      if (prepared.needsTokenApproval && prepared.permit2Address && prepared.tokenIn) {
        // Check current allowance first
        // @ts-ignore — viem version type mismatch with authorizationList
        const currentAllowance = await sepoliaPublicClient!.readContract({
          address: prepared.tokenIn as Address,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [userAddress as Address, prepared.permit2Address as Address],
        }) as bigint;

        // Parse the input amount from the quote to compare with allowance
        // The quote.input.amount contains the input amount in wei
        const inputAmountWei = BigInt(prepared.quote?.input?.amount || '0');

        // Only approve if current allowance is insufficient
        if (currentAllowance < inputAmountWei) {
          console.log(`[Uniswap] Token approval needed. Current: ${currentAllowance.toString()}, Required: ${inputAmountWei.toString()}`);
          setUniswapStep('approving');
          const ERC20_APPROVE_ABI = [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            },
          ] as const;
          // @ts-ignore — wagmi v2 type inference issue with inline const ABI + chainId
          await writeContractAsync({
            address: prepared.tokenIn as `0x${string}`,
            abi: ERC20_APPROVE_ABI,
            functionName: 'approve',
            args: [prepared.permit2Address as `0x${string}`, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
            chainId: 11155111,
          });
          console.log('[Uniswap] Token approved for Permit2');
        } else {
          console.log(`[Uniswap] Token already approved. Allowance: ${currentAllowance.toString()}`);
        }
      }

      // 4. Sign permit data (if present — native ETH swaps may not need it)
      // IMPORTANT: This signature MUST be from the fresh quote we just fetched
      setUniswapStep('signing');
      let signature: string | undefined;
      if (prepared.permitData) {
        // Uniswap API returns { domain, types, values } but wagmi needs { domain, types, primaryType, message }
        const { domain, types, values } = prepared.permitData;
        const primaryType = Object.keys(types).find(
          k => !['EIP712Domain', 'TokenPermissions', 'PermitDetails'].includes(k)
        ) || 'PermitSingle';
        signature = await signTypedDataAsync({ domain, types, primaryType, message: values } as any);
      }

      // 5. Get unsigned calldata (routing is required by backend)
      // IMPORTANT: Use the SAME quote and signature we just obtained
      setUniswapStep('executing');
      const execResult = await sammApi.executeSepolia(prepared.quote, signature, prepared.permitData, prepared.routing);

      // 6. Broadcast transaction (response is nested under unsignedTransaction)
      const utx = execResult.unsignedTransaction;
      setUniswapStep('sending');
      const hash = await sendTransactionAsync({
        to: utx.to as `0x${string}`,
        data: utx.data as `0x${string}`,
        value: BigInt(utx.value || '0'),
        ...(utx.gasLimit ? { gas: BigInt(utx.gasLimit) } : {}),
        chainId: 11155111,
      });

      setUniswapHash(hash);
      setUniswapStep('success');

      // Show success toast with transaction hash
      toast({
        title: "Swap Successful!",
        description: (
          <div className="flex flex-col gap-2">
            <p>Your Uniswap swap on Sepolia completed successfully.</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm font-mono truncate"
            >
              View on Etherscan →
            </a>
          </div>
        ),
      });

      // Refresh Sepolia balances
      setSepoliaRefreshTick(t => t + 1);

      // Silently attempt to switch the wallet back to RiseChain.
      // If the user dismisses the MetaMask prompt, the Done button will retry.
      switchChainAsync({ chainId: riseChain.id }).catch(() => {
        // non-fatal — Done button provides a second chance
      });
    } catch (err: any) {
      console.error('[Uniswap] Swap failed:', err);
      setUniswapError(err.message || 'Uniswap swap failed');
      setUniswapStep('error');
      toast({
        title: 'Swap Failed',
        description: err.message || 'Uniswap swap failed. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle swap execution
   * Routes to SAMM (RiseChain) or Uniswap (Sepolia Permit2) based on selectedRoute
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

    // Validate based on selected route
    const hasValidQuote = selectedRoute === 'uniswap' 
      ? (uniswapQuoteData && preparedSepoliaData) 
      : quoteData;

    if (!fromToken.address || !toToken.address || !hasValidQuote) {
      toast({
        title: "Invalid Swap",
        description: "Please ensure all fields are filled",
        variant: "destructive",
      });
      return;
    }

    if (selectedRoute === 'uniswap') {
      await handleUniswapSwap();
      return;
    }

    try {
      // SAMM: Execute batch swap (approval + swap in single user action)
      await batchSwap.executeBatchSwap();
    } catch (error: any) {
      console.error('Batch swap failed:', error);
    }
  };

  // When Uniswap route is selected, use Sepolia balances instead of RiseChain balances.
  // RiseChain token addresses don't exist on Sepolia, so useTokenBalance returns 0 there.
  const displayFromBalance = selectedRoute === 'uniswap'
    ? (sepoliaBalancesLoading ? '...' : (sepoliaBalances[fromToken.symbol] ?? '0.00'))
    : fromToken.balance;
  const displayToBalance = selectedRoute === 'uniswap'
    ? (sepoliaBalancesLoading ? '...' : (sepoliaBalances[toToken.symbol] ?? '0.00'))
    : toToken.balance;

  // Check if user has insufficient balance
  const isInsufficientBalance =
    !!fromValue &&
    parseFloat(fromValue) > 0 &&
    !fromBalanceLoading &&
    !sepoliaBalancesLoading &&
    parseFloat(displayFromBalance) >= 0 &&
    parseFloat(fromValue) > parseFloat(displayFromBalance);

  // Get button text based on current state
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (!fromValue) return "Enter an amount";
    if (isInsufficientBalance) return `Insufficient ${fromToken.symbol} Balance`;
    if (loading) return "Fetching quote...";
    if (!toValue) return "Enter an amount";

    // Uniswap Permit2 route states
    if (selectedRoute === 'uniswap') {
      switch (uniswapStep) {
        case 'preparing': return 'Preparing Uniswap swap...';
        case 'switching': return 'Switch to Sepolia in wallet...';
        case 'approving': return 'Approve token for Permit2...';
        case 'signing': return 'Sign Permit2 in wallet...';
        case 'executing': return 'Getting calldata...';
        case 'sending': return 'Confirm in wallet...';
        case 'success': return 'Swap Successful!';
        case 'error': return 'Try Again';
        default: return 'Swap via Uniswap (Sepolia)';
      }
    }

    // SAMM batch swap states
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
      default: {
        const needsApproval = batchSwap.steps.some(step => step.label.includes('Approve') && step.status === 'pending');
        return needsApproval ? `Approve & Swap` : "Swap";
      }
    }
  };

  // Button should be disabled during loading or transaction states
  // BUT: Don't disable while fetching quote - show "Fetching quote..." text instead
  const isUniswapSwapping = ['preparing', 'switching', 'approving', 'signing', 'executing', 'sending'].includes(uniswapStep);
  
  // Check if we have a valid quote based on selected route
  const hasValidQuote = selectedRoute === 'uniswap' 
    ? (uniswapQuoteData && preparedSepoliaData)
    : quoteData;
  
  const isButtonDisabled =
    !isConnected ||
    !fromValue ||
    isInsufficientBalance ||
    (!hasValidQuote && !loading) ||
    (selectedRoute === 'samm' && (batchSwap.isLoading || batchSwap.currentStep === 'success')) ||
    (selectedRoute === 'uniswap' && (isUniswapSwapping || uniswapStep === 'success'));

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
                {selectedRoute === 'uniswap' ? 'Sepolia Testnet' : (selectedNetwork?.displayName || "Loading...")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchQuote}
                disabled={loading || !fromValue || isInsufficientBalance}
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
            token={{ ...fromToken, balance: displayFromBalance }}
            value={fromValue}
            onChange={setFromValue}
            usdValue={fromValueUSD}
            isInsufficient={isInsufficientBalance}
            onMax={() => setFromValue(
              selectedRoute === 'uniswap'
                ? (sepoliaBalances[fromToken.symbol] ?? '')
                : (fromToken.balance || '')
            )}
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
            token={{ ...toToken, balance: displayToBalance }}
            value={toValue}
            onChange={setToValue}
            usdValue={toValueUSD}
            isOutput
            isLoading={loading}
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

          {/* Price Info — SAMM route */}
          {selectedRoute === 'samm' && quoteData && fromValue && (
            <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex justify-between gap-2 text-sm mb-2">
                <span className="text-muted-foreground flex-shrink-0">Rate</span>
                <span className="text-foreground font-mono text-xs text-right min-w-0 break-all">{getRate()}</span>
              </div>

              {quoteData.hops === 1 && quoteData.selectedShards && quoteData.selectedShards.length > 0 && (
                <div className="flex justify-between gap-2 text-sm mb-2">
                  <span className="text-muted-foreground flex-shrink-0">Shard</span>
                  <span className="text-chrome font-mono text-xs text-right">{quoteData.selectedShards[0].slice(0, 10)}...</span>
                </div>
              )}

              {quoteData.hops > 1 && quoteData.route && (
                <div className="flex justify-between gap-2 text-sm mb-2">
                  <span className="text-muted-foreground flex-shrink-0">Route</span>
                  <span className="text-chrome font-mono text-xs text-right min-w-0 break-all">{quoteData.route.join(' → ')}</span>
                </div>
              )}

              {quoteData.totalFee && (
                <div className="flex justify-between gap-2 text-sm mb-2">
                  <span className="text-muted-foreground flex-shrink-0">Total Fee</span>
                  <span className="text-foreground font-mono text-xs text-right">
                    {formatFee(quoteData.totalFee)} {fromToken.symbol}
                  </span>
                </div>
              )}

              {priceImpact !== null && priceImpact > 0.1 && (
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground flex-shrink-0">Price Impact</span>
                  <span className={`font-mono text-xs text-right font-semibold ${
                    priceImpact >= PRICE_IMPACT_CRITICAL ? "text-destructive"
                    : priceImpact >= PRICE_IMPACT_WARNING ? "text-yellow-500"
                    : "text-green-500"
                  }`}>
                    {priceImpact >= PRICE_IMPACT_CRITICAL ? "⚠ " : ""}
                    {priceImpact.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Price Info — Uniswap route */}
          {selectedRoute === 'uniswap' && uniswapQuoteData && fromValue && (
            <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex justify-between gap-2 text-sm mb-2">
                <span className="text-muted-foreground flex-shrink-0">Rate</span>
                <span className="text-foreground font-mono text-xs text-right min-w-0 break-all">{getRate()}</span>
              </div>

              {uniswapQuoteData.gasFeeUsd && (
                <div className="flex justify-between gap-2 text-sm mb-2">
                  <span className="text-muted-foreground flex-shrink-0">Gas Fee</span>
                  <span className="text-foreground font-mono text-xs text-right">
                    ~${parseFloat(uniswapQuoteData.gasFeeUsd).toFixed(4)}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-2 text-sm mb-2">
                <span className="text-muted-foreground flex-shrink-0">Routing</span>
                <span className="text-foreground font-mono text-xs text-right">{uniswapQuoteData.routing}</span>
              </div>

              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground flex-shrink-0">Network</span>
                <span className="text-foreground font-mono text-xs text-right">Sepolia · Permit2</span>
              </div>
            </div>
          )}

          {/* Route Selector — both quotes fetched in parallel, best auto-selected, user can override */}
          {(quoteData || uniswapQuoteData) && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium px-0.5">Select Route</p>
              <div className="grid grid-cols-2 gap-2">
                {/* SAMM */}
                <button
                  onClick={() => {
                    setSelectedRoute('samm');
                    if (quoteData?.amountOut) setToValue(quoteData.amountOut);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedRoute === 'samm'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/20 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">SAMM</span>
                    {sammIsBest && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 font-mono flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" /> Best
                      </span>
                    )}
                  </div>
                  {loading && !quoteData ? (
                    <p className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                    </p>
                  ) : quoteData?.amountOut ? (
                    <>
                      <p className="font-mono text-sm font-bold text-foreground">
                        {parseFloat(quoteData.amountOut).toFixed(4)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">RiseChain · SAMM</p>
                    </>
                  ) : (
                    <p className="font-mono text-xs text-foreground/40">N/A</p>
                  )}
                </button>

                {/* Uniswap */}
                <button
                  onClick={() => {
                    setSelectedRoute('uniswap');
                    if (uniswapQuoteData?.amountOut) setToValue(uniswapQuoteData.amountOut);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedRoute === 'uniswap'
                      ? 'border-orange-500/70 bg-orange-500/10'
                      : 'border-border bg-secondary/20 hover:border-orange-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">Uniswap</span>
                    {uniIsBest && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 font-mono flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" /> Best
                      </span>
                    )}
                  </div>
                  {loading && !uniswapQuoteData ? (
                    <p className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                    </p>
                  ) : uniswapQuoteData?.amountOut ? (
                    <>
                      <p className="font-mono text-sm font-bold text-foreground">
                        {parseFloat(uniswapQuoteData.amountOut).toFixed(4)}
                      </p>
                      {uniswapQuoteData.gasFeeUsd && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Gas ~${parseFloat(uniswapQuoteData.gasFeeUsd).toFixed(2)}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">Sepolia · Permit2</p>
                    </>
                  ) : !userAddress ? (
                    <p className="font-mono text-[10px] text-foreground/40">Connect wallet</p>
                  ) : (
                    <p className="font-mono text-xs text-foreground/40">N/A</p>
                  )}
                </button>
              </div>

              {/* Delta line — shown when both quotes are available */}
              {bothQuotesReady && Math.abs(sammAmountFloat - uniAmountFloat) / Math.max(sammAmountFloat, uniAmountFloat) >= 0.0001 && (
                <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className={`w-3 h-3 ${sammIsBest ? 'text-green-400' : 'text-orange-400'}`} />
                  {sammIsBest
                    ? `SAMM gives ${((sammAmountFloat - uniAmountFloat) / uniAmountFloat * 100).toFixed(2)}% more ${toToken.symbol}`
                    : `Uniswap gives ${((uniAmountFloat - sammAmountFloat) / sammAmountFloat * 100).toFixed(2)}% more ${toToken.symbol}`}
                </p>
              )}

              {/* Sepolia info banner — shown when Uniswap route is selected */}
              {selectedRoute === 'uniswap' && uniswapStep === 'idle' && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400/90 space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Uniswap runs on Sepolia testnet
                    {sepoliaBalancesLoading && (
                      <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                    )}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Balances shown are your <span className="text-blue-300 font-semibold">Sepolia</span> balances.
                    You need <span className="text-blue-300 font-mono">Sepolia ETH</span> for gas.
                    Get tokens from{' '}
                    <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer"
                      className="underline hover:text-blue-300 transition-colors">
                      sepoliafaucet.com
                    </a>.
                  </p>
                  {fromToken.symbol === 'WETH' && (
                    <p className="text-blue-300 leading-relaxed font-semibold mt-2 flex items-start gap-1">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      WETH balance 
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* High price impact banner */}
          {priceImpact !== null && priceImpact >= PRICE_IMPACT_WARNING && toValue && (
            <div
              className={`mt-3 p-2.5 rounded-lg border flex items-start gap-2 text-xs ${
                priceImpact >= PRICE_IMPACT_CRITICAL
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
              }`}
            >
              <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                {priceImpact >= PRICE_IMPACT_CRITICAL
                  ? `High price impact (${priceImpact.toFixed(2)}%). You may receive significantly less than market value.`
                  : `Price impact (${priceImpact.toFixed(2)}%) is above average. Consider swapping a smaller amount.`}
              </span>
            </div>
          )}


          {/* Swap Action Button */}
          {(selectedRoute === 'samm'
            ? batchSwap.currentStep !== 'success' && batchSwap.currentStep !== 'error'
            : uniswapStep !== 'success' && uniswapStep !== 'error'
          ) && (
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

          {/* SAMM Transaction Progress Status */}
          {selectedRoute === 'samm' && batchSwap.currentStep !== 'idle' && batchSwap.currentStep !== 'success' && batchSwap.currentStep !== 'error' && (
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

          {/* SAMM Transaction Success Display */}
          {selectedRoute === 'samm' && batchSwap.currentStep === 'success' && (
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

          {/* SAMM Transaction Error Display */}
          {selectedRoute === 'samm' && batchSwap.currentStep === 'error' && (
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

          {/* Uniswap Permit2 — In-progress */}
          {selectedRoute === 'uniswap' && isUniswapSwapping && (
            <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="space-y-3">
                {(['preparing', 'switching', 'approving', 'signing', 'executing', 'sending'] as const).map((step) => {
                  const labels: Record<string, string> = {
                    preparing: 'Preparing Uniswap swap',
                    switching: 'Switch to Sepolia',
                    approving: 'Approve token for Permit2',
                    signing: 'Sign Permit2 in wallet',
                    executing: 'Getting calldata',
                    sending: 'Confirm transaction in wallet',
                  };
                  const steps = ['preparing', 'switching', 'approving', 'signing', 'executing', 'sending'];
                  const currentIdx = steps.indexOf(uniswapStep);
                  const stepIdx = steps.indexOf(step);
                  const isDone = stepIdx < currentIdx;
                  const isActive = stepIdx === currentIdx;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isDone && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {isActive && <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />}
                        {!isDone && !isActive && <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />}
                      </div>
                      <p className={`text-sm font-medium ${isActive ? 'text-orange-400' : isDone ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {labels[step]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Uniswap — Success */}
          {selectedRoute === 'uniswap' && uniswapStep === 'success' && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-green-500 mb-1">Swap Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your Uniswap swap on Sepolia completed successfully
                  </p>
                </div>
              </div>

              {/* Transaction Hash */}
              {uniswapHash && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold">Transaction Hash:</p>
                  <div className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono text-foreground flex-1 truncate"
                        title={uniswapHash}
                      >
                        {uniswapHash.slice(0, 20)}...{uniswapHash.slice(-8)}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(uniswapHash || '');
                          toast({ title: "Copied!", description: "Transaction hash copied to clipboard" });
                        }}
                        className="text-xs text-primary hover:text-primary/80 flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${uniswapHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium py-1"
                  >
                    View on Sepolia Etherscan →
                  </a>
                </div>
              )}
              <Button
                onClick={async () => {
                  // Reset all Uniswap state
                  setUniswapStep('idle');
                  setUniswapHash(null);
                  setUniswapError(null);
                  setFromValue('');
                  setToValue('');
                  setQuoteData(null);
                  setUniswapQuoteData(null);
                  setPreparedSepoliaData(null);
                  setRouteInfo('');
                  // Switch route badge back to SAMM immediately (header updates instantly)
                  setSelectedRoute('samm');
                  // Switch wallet to RiseChain — NetworkContext sync effect will update
                  // selectedNetwork automatically when walletChainId changes
                  try {
                    await switchChainAsync({ chainId: riseChain.id });
                  } catch {
                    // User dismissed — they can switch manually; route badge is already correct
                  }
                }}
                className="w-full mt-3"
                variant="default"
              >
                Done
              </Button>
            </div>
          )}

          {/* Uniswap — Error */}
          {selectedRoute === 'uniswap' && uniswapStep === 'error' && (
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
                    {uniswapError || 'An error occurred while processing your Uniswap swap'}
                  </p>
                  {uniswapHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${uniswapHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      View failed tx on Sepolia Etherscan →
                    </a>
                  )}
                </div>
              </div>
              <Button
                onClick={async () => {
                  setUniswapStep('idle');
                  setUniswapError(null);
                  setUniswapHash(null);
                  // Reset route badge (header updates instantly)
                  setSelectedRoute('samm');
                  // Switch wallet back to RiseChain
                  try {
                    await switchChainAsync({ chainId: riseChain.id });
                  } catch { /* ignore — badge already correct */ }
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
