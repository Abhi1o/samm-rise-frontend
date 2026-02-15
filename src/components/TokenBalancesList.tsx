import { TokenBalanceWithValue } from '@/types/portfolio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUSD } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';
import TokenLogo from './TokenLogo';

interface TokenBalancesListProps {
  balances: TokenBalanceWithValue[];
  isLoading?: boolean;
}

export function TokenBalancesList({ balances, isLoading }: TokenBalancesListProps) {
  if (isLoading) {
    return (
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
                <div className="h-4 bg-muted rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balances.length === 0) {
    return (
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Token Balances</h3>
            <p className="text-sm text-muted-foreground">
              Get started by claiming test tokens from the faucet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle>Token Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Token
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Balance
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Price
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Value
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  24h Change
                </th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance, index) => (
                <tr
                  key={balance.token.address}
                  className="border-b border-glass-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <TokenLogo token={balance.token} size="md" />
                      <div>
                        <p className="font-medium">{balance.token.symbol}</p>
                        <p className="text-xs text-muted-foreground">{balance.token.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <p className="font-medium">{balance.balanceFormatted}</p>
                  </td>
                  <td className="text-right py-4 px-4">
                    <p className="text-muted-foreground">
                      {balance.priceUSD > 0 ? formatUSD(balance.priceUSD) : '-'}
                    </p>
                  </td>
                  <td className="text-right py-4 px-4">
                    <p className="font-semibold">{formatUSD(balance.valueUSD)}</p>
                  </td>
                  <td className="text-right py-4 px-4">
                    {balance.priceChange24h !== undefined ? (
                      <div
                        className={`inline-flex items-center gap-1 ${
                          balance.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {balance.priceChange24h >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(balance.priceChange24h).toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {balances.map((balance) => (
            <div
              key={balance.token.address}
              className="p-4 rounded-lg border border-glass-border bg-card/50 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TokenLogo token={balance.token} size="md" />
                  <div>
                    <p className="font-medium">{balance.token.symbol}</p>
                    <p className="text-xs text-muted-foreground">{balance.token.name}</p>
                  </div>
                </div>
                {balance.priceChange24h !== undefined && (
                  <div
                    className={`flex items-center gap-1 ${
                      balance.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {balance.priceChange24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {Math.abs(balance.priceChange24h).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Balance</p>
                  <p className="font-medium">{balance.balanceFormatted}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs mb-1">Value</p>
                  <p className="font-semibold">{formatUSD(balance.valueUSD)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
