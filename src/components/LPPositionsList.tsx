import { LPPositionWithValue } from '@/types/portfolio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUSD } from '@/utils/formatters';
import { formatUnits } from 'viem';
import { getTokensForChain } from '@/config/tokens';
import { useChainId } from 'wagmi';

interface LPPositionsListProps {
  positions: LPPositionWithValue[];
  isLoading?: boolean;
}

export function LPPositionsList({ positions, isLoading }: LPPositionsListProps) {
  const chainId = useChainId();
  const tokens = getTokensForChain(chainId);

  if (isLoading) {
    return (
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>LP Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50">
                <div className="h-4 bg-muted rounded w-32 mb-3"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>LP Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <span className="text-3xl">💧</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No LP Positions</h3>
            <p className="text-sm text-muted-foreground">
              Add liquidity to a pool to start earning fees
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle>LP Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Pool
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  LP Tokens
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Share
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Token Amounts
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                // Get token objects for decimals
                const token0 = tokens.find(t => t.symbol === position.token0Symbol);
                const token1 = tokens.find(t => t.symbol === position.token1Symbol);

                // Format token amounts
                const token0Formatted = token0
                  ? parseFloat(formatUnits(BigInt(position.token0Amount), token0.decimals)).toFixed(4)
                  : position.token0Amount;
                const token1Formatted = token1
                  ? parseFloat(formatUnits(BigInt(position.token1Amount), token1.decimals)).toFixed(4)
                  : position.token1Amount;

                return (
                  <tr
                    key={position.poolAddress}
                    className="border-b border-glass-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{position.pairName}</p>
                        <p className="text-xs text-muted-foreground">{position.poolName}</p>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <p className="font-medium">{position.lpBalanceFormatted}</p>
                    </td>
                    <td className="text-right py-4 px-4">
                      <p className="text-muted-foreground">{position.shareOfPool.toFixed(2)}%</p>
                    </td>
                    <td className="text-right py-4 px-4">
                      <div className="text-sm">
                        <p className="font-medium">
                          {token0Formatted} {position.token0Symbol}
                        </p>
                        <p className="text-muted-foreground">
                          {token1Formatted} {position.token1Symbol}
                        </p>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <p className="font-semibold">{formatUSD(position.totalValueUSD)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatUSD(position.token0ValueUSD)} + {formatUSD(position.token1ValueUSD)}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {positions.map((position) => {
            // Get token objects for decimals
            const token0 = tokens.find(t => t.symbol === position.token0Symbol);
            const token1 = tokens.find(t => t.symbol === position.token1Symbol);

            // Format token amounts
            const token0Formatted = token0
              ? parseFloat(formatUnits(BigInt(position.token0Amount), token0.decimals)).toFixed(4)
              : position.token0Amount;
            const token1Formatted = token1
              ? parseFloat(formatUnits(BigInt(position.token1Amount), token1.decimals)).toFixed(4)
              : position.token1Amount;

            return (
              <div
                key={position.poolAddress}
                className="p-4 rounded-lg border border-glass-border bg-card/50 hover:bg-muted/30 transition-colors"
              >
                <div className="mb-3">
                  <p className="font-medium">{position.pairName}</p>
                  <p className="text-xs text-muted-foreground">{position.poolName}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LP Tokens</span>
                    <span className="font-medium">{position.lpBalanceFormatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Share</span>
                    <span>{position.shareOfPool.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tokens</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {token0Formatted} {position.token0Symbol}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {token1Formatted} {position.token1Symbol}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-glass-border/50">
                    <span className="text-muted-foreground font-medium">Value</span>
                    <span className="font-semibold">{formatUSD(position.totalValueUSD)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
