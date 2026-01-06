import { useState, useMemo } from "react";
import { useChainId, useAccount, useBalance } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { getTokensForChain } from "@/config/tokens";
import { Token as ConfigToken } from "@/types/tokens";
import { Address } from "viem";
import TokenLogo from "./TokenLogo";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { formatUSD } from "@/utils/formatters";

export interface Token {
  symbol: string;
  name: string;
  icon: string;
  address?: string;
  balance?: string;
  usdValue?: string;
}

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  excludeToken?: string;
}

// Component to display individual token with balance and price
const TokenRow = ({
  token,
  configToken,
  onClick,
  formatAddress
}: {
  token: Token & { logoURI?: string };
  configToken?: ConfigToken;
  onClick: () => void;
  formatAddress: (address: string) => string;
}) => {
  const { isConnected } = useAccount();

  // Fetch balance and price using the full config token
  const { balanceFormatted, isLoading: balanceLoading } = useTokenBalance(configToken);
  const { price } = useTokenPrice(configToken);

  // Calculate USD value
  const usdValue = balanceFormatted && price
    ? formatUSD(parseFloat(balanceFormatted) * price)
    : undefined;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <TokenLogo
          symbol={token.symbol}
          logoURI={token.logoURI}
          icon={token.icon}
          size="lg"
        />
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{token.symbol}</span>
            <span className="text-sm text-muted-foreground">{token.name}</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {token.address && formatAddress(token.address)}
          </div>
        </div>
      </div>
      {isConnected && (
        <div className="text-right">
          {balanceLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : balanceFormatted && parseFloat(balanceFormatted) > 0 ? (
            <>
              <div className="font-medium text-foreground">{parseFloat(balanceFormatted).toFixed(6)}</div>
              {usdValue && (
                <div className="text-xs text-muted-foreground">{usdValue}</div>
              )}
            </>
          ) : null}
        </div>
      )}
    </button>
  );
};

const TokenSelectModal = ({ isOpen, onClose, onSelect, excludeToken }: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const chainId = useChainId();
  const { address: userAddress } = useAccount();

  // Get all tokens for the current chain from configuration
  const availableTokens = useMemo(() => {
    return getTokensForChain(chainId);
  }, [chainId]);

  // Convert config tokens to modal token format with full config reference
  const allTokens: (Token & { logoURI?: string; configToken?: ConfigToken })[] = useMemo(() => {
    return availableTokens.map((token) => ({
      symbol: token.symbol,
      name: token.name,
      icon: token.icon || "🪙",
      logoURI: token.logoURI,
      address: token.address,
      balance: undefined, // Will be fetched per token if needed
      usdValue: undefined,
      configToken: token, // Store full config for hooks
    }));
  }, [availableTokens]);

  // Popular tokens (first 5 tokens from the list)
  const popularTokens = useMemo(() => {
    return allTokens.slice(0, 5);
  }, [allTokens]);

  // Filter tokens based on search query and exclude selected token
  const filteredTokens = useMemo(() => {
    return allTokens.filter(
      (token) =>
        token.symbol !== excludeToken &&
        (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.address?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allTokens, excludeToken, searchQuery]);

  const filteredPopular = useMemo(() => {
    return popularTokens.filter((token) => token.symbol !== excludeToken);
  }, [popularTokens, excludeToken]);

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearchQuery("");
  };

  // Format address for display (0x1234...5678)
  const formatAddress = (address: string) => {
    if (!address) return "";
    if (address.toLowerCase() === "0x0000000000000000000000000000000000000000") {
      return "Native";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Select a token
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredTokens.length} available)
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tokens"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Popular Tokens */}
        {!searchQuery && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {filteredPopular.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => handleSelect(token)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 transition-all"
                >
                  <TokenLogo
                    symbol={token.symbol}
                    logoURI={token.logoURI}
                    icon={token.icon}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-foreground">{token.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token List */}
        <div className="border-t border-border">
          <div className="px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {searchQuery ? "Search results" : "All tokens"}
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token, index) => (
                <TokenRow
                  key={`${token.symbol}-${token.address}-${index}`}
                  token={token}
                  configToken={token.configToken}
                  onClick={() => handleSelect(token)}
                  formatAddress={formatAddress}
                />
              ))
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No tokens found for this search
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectModal;
