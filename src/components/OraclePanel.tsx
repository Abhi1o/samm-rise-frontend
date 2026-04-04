import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useOracleData } from '@/hooks/useOracleData';

function formatPrice(price: number): string {
  if (!price || price === 0) return '—';
  if (price > 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price > 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function DeviationBadge({ pct, isHigh, fallback }: { pct: string; isHigh: boolean; fallback: boolean }) {
  const val = parseFloat(pct);

  if (fallback) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        <WifiOff className="w-2.5 h-2.5" />
        Fallback
      </span>
    );
  }

  const color = isHigh
    ? 'bg-red-500/15 text-red-400 border-red-500/20'
    : val > 0.1
    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : 'bg-green-500/10 text-green-400 border-green-500/20';

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${color}`}>
      {val === 0 ? '0.00%' : `${val > 0 ? '+' : ''}${val.toFixed(2)}%`}
    </span>
  );
}

function TimeSince({ isoTimestamp }: { isoTimestamp: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000);
      setSeconds(Math.max(0, diff));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isoTimestamp]);

  if (seconds < 60) return <>{seconds}s ago</>;
  if (seconds < 3600) return <>{Math.floor(seconds / 60)}m ago</>;
  return <>{Math.floor(seconds / 3600)}h ago</>;
}

export function OraclePanel() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useOracleData();

  return (
    <Card className="border-border bg-secondary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              Oracle Prices
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chainlink AggregatorV3 (Sepolia) · CoinGecko fallback
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dataUpdatedAt > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                Updated <TimeSince isoTimestamp={new Date(dataUpdatedAt).toISOString()} />
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-7 w-7 p-0"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full bg-secondary/50" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive flex-1">Failed to fetch oracle data</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs h-7">
              Retry
            </Button>
          </div>
        )}

        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium text-xs">Pair</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Chainlink</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">CoinGecko</th>
                    <th className="text-right py-2 pl-3 text-muted-foreground font-medium text-xs">Deviation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.rows.map((row) => (
                    <tr key={row.token} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-foreground">
                        {row.token}/USD
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-foreground">
                        {formatPrice(row.chainlinkPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-muted-foreground">
                        {formatPrice(row.coingeckoPrice)}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <DeviationBadge
                          pct={row.deviationPct}
                          isHigh={row.isHighDeviation}
                          fallback={row.usingFallback}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CRE Status */}
            <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    data.creWorkflowStatus === 'active' ? 'bg-green-400' : 'bg-muted-foreground'
                  }`}
                />
                <span>
                  Chainlink CRE:{' '}
                  <span
                    className={
                      data.creWorkflowStatus === 'active' ? 'text-green-400 font-medium' : 'text-muted-foreground'
                    }
                  >
                    {data.creWorkflowStatus === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
              {data.lastTriggered && (
                <span>
                  Last rebalance: <TimeSince isoTimestamp={data.lastTriggered} />
                </span>
              )}
              <span>Shards monitored: {data.shardsMonitored}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
