import { useState, useMemo } from "react";
import { useChainId, useAccount, useBalance } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Search } from "lucide-react";
import { getTokensForChain } from "@/config/tokens";
import { Token as ConfigToken } from "@/types/tokens";
import { Address } from "viem";

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

const TokenSelectModal = ({ isOpen, onClose, onSelect, excludeToken }: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const chainId = useChainId();
  const { address: userAddress } = useAccount();

  // Get all tokens for the current chain from configuration
  const availableTokens = useMemo(() => {
    return getTokensForChain(chainId);
  }, [chainId]);

  // Convert config tokens to modal token format
  const allTokens: Token[] = useMemo(() => {
    return availableTokens.map((token) => ({
      symbol: token.symbol,
      name: token.name,
      icon: token.icon || "🪙",
      address: token.address,
      balance: undefined, // Will be fetched per token if needed
      usdValue: undefined,
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
                  <span className="text-lg">{token.icon}</span>
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
                <button
                  key={`${token.symbol}-${token.address}-${index}`}
                  onClick={() => handleSelect(token)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary group-hover:bg-secondary/80 flex items-center justify-center text-xl border border-border">
                      {token.icon}
                    </div>
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
                  {token.balance && (
                    <div className="text-right">
                      <div className="font-medium text-foreground">{token.balance}</div>
                      {token.usdValue && (
                        <div className="text-xs text-muted-foreground">${token.usdValue}</div>
                      )}
                    </div>
                  )}
                </button>
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
