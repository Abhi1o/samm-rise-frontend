import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Search } from "lucide-react";

export interface Token {
  symbol: string;
  name: string;
  icon: string;
  address?: string;
  balance?: string;
  usdValue?: string;
}

const POPULAR_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠" },
  { symbol: "USDC", name: "USD Coin", icon: "💲" },
  { symbol: "USDT", name: "Tether", icon: "₮" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "₿" },
  { symbol: "WETH", name: "Wrapped Ether", icon: "◊" },
];

const ALL_TOKENS: Token[] = [
  { symbol: "USDC", name: "USD Coin", icon: "💲", address: "0xA0b8...eB48", balance: "3,900.91", usdValue: "3,900.55" },
  { symbol: "DAI", name: "Dai Stablecoin", icon: "◈", address: "0x6B17...1d0F", balance: "1,714", usdValue: "1,714.07" },
  { symbol: "ETH", name: "Ethereum", icon: "⟠", address: "0x0000...0000", balance: "0.00954", usdValue: "30.47" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "₿", address: "0x2260...C599", balance: "0.0012", usdValue: "85.20" },
  { symbol: "LINK", name: "Chainlink", icon: "⬡", address: "0x514...F9C5", balance: "45.5", usdValue: "682.50" },
  { symbol: "UNI", name: "Uniswap", icon: "🦄", address: "0x1f98...6f1E", balance: "120", usdValue: "720.00" },
  { symbol: "AAVE", name: "Aave", icon: "👻", address: "0x7Fc6...d2B1", balance: "5.2", usdValue: "520.00" },
  { symbol: "MATIC", name: "Polygon", icon: "⬡", address: "0x7D1A...5e7F", balance: "1500", usdValue: "1,050.00" },
];

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  excludeToken?: string;
}

const TokenSelectModal = ({ isOpen, onClose, onSelect, excludeToken }: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = ALL_TOKENS.filter(
    (token) =>
      token.symbol !== excludeToken &&
      (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPopular = POPULAR_TOKENS.filter((token) => token.symbol !== excludeToken);

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold text-foreground">Select a token</DialogTitle>
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
              {searchQuery ? "Search results" : "Your tokens"}
            </span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => handleSelect(token)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xl">
                      {token.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">{token.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {token.symbol}
                        {token.address && <span className="ml-2">{token.address}</span>}
                      </div>
                    </div>
                  </div>
                  {token.balance && (
                    <div className="text-right">
                      <div className="font-medium text-foreground">${token.usdValue}</div>
                      <div className="text-xs text-muted-foreground">{token.balance}</div>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No tokens found
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectModal;
