import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Wallet, Layers } from 'lucide-react';
import { formatUSD } from '@/utils/formatters';

interface PortfolioOverviewProps {
  totalValueUSD: number;
  tokensCount: number;
  positionsCount: number;
  tokensValueUSD: number;
  lpValueUSD: number;
  isLoading?: boolean;
}

export function PortfolioOverview({
  totalValueUSD,
  tokensCount,
  positionsCount,
  tokensValueUSD,
  lpValueUSD,
  isLoading,
}: PortfolioOverviewProps) {
  // Calculate percentage breakdown
  const tokensPercentage = useMemo(() => {
    if (totalValueUSD === 0) return 0;
    return ((tokensValueUSD / totalValueUSD) * 100).toFixed(1);
  }, [totalValueUSD, tokensValueUSD]);

  const lpPercentage = useMemo(() => {
    if (totalValueUSD === 0) return 0;
    return ((lpValueUSD / totalValueUSD) * 100).toFixed(1);
  }, [totalValueUSD, lpValueUSD]);

  if (isLoading) {
    return (
      <Card className="glass-card border-glass-border">
        <CardContent className="pt-8 pb-6">
          <div className="space-y-6 animate-pulse">
            <div>
              <div className="h-4 bg-muted rounded w-32 mb-4"></div>
              <div className="h-12 bg-muted rounded w-48"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-glass-border">
      <CardContent className="pt-8 pb-6">
        <div className="space-y-6">
          {/* Total Portfolio Value */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              {formatUSD(totalValueUSD)}
            </h2>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tokens Value */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tokens</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatUSD(tokensValueUSD)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tokensCount} {tokensCount === 1 ? 'asset' : 'assets'} • {tokensPercentage}%
                </p>
              </div>
            </div>

            {/* LP Positions Value */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">LP Positions</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatUSD(lpValueUSD)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {positionsCount} {positionsCount === 1 ? 'position' : 'positions'} • {lpPercentage}%
                </p>
              </div>
            </div>

            {/* Total Assets */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-green-500/10 text-green-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
                <p className="text-2xl font-semibold text-foreground">
                  {tokensCount + positionsCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tokens & LP positions
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
