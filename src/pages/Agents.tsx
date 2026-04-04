import { Helmet } from 'react-helmet-async';
import { AlertCircle, Info } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AgentCard } from '@/components/AgentCard';
import { ENSShardRegistry } from '@/components/ENSShardRegistry';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/useAgents';

// Update with real deployed contract address from backend team
const REGISTRY_CONTRACT = '0x...SAMMAgentRegistry';

export default function Agents() {
  const { data: agents, isLoading, isError, refetch } = useAgents();

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>Agent Registry | SAMM DEX</title>
        <meta
          name="description"
          content="SAMM autonomous agents identified and discoverable via ENS. On-chain agent reputation, config, and performance stats stored as ENS text records."
        />
        <link rel="canonical" href="https://samm.one/agents" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">

            {/* Page heading */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Agent Registry</h1>
              <p className="text-muted-foreground font-mono text-sm">
                <span className="text-primary/60">// </span>
                Autonomous agents identified & discoverable via ENS
              </p>
            </div>

            {/* Judge callout */}
            <Card className="border-primary/30 bg-primary/5 mb-8">
              <CardContent className="p-4 flex gap-3">
                <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>
                    <span className="text-foreground font-medium">ENS Integration:</span>{' '}
                    SAMM's two autonomous agents self-register on startup via{' '}
                    <span className="font-mono text-foreground">SAMMAgentRegistry.sol</span>. Their ENS subnames
                    ({' '}<span className="font-mono text-primary">arb-bot.samm.eth</span>,{' '}
                    <span className="font-mono text-primary">shard-manager.samm.eth</span>) resolve to their wallet
                    addresses. Configuration and live performance stats are stored as ENS text records — creating
                    verifiable, on-chain agent reputation without a centralised database.
                  </p>
                  <p>
                    <span className="text-foreground font-medium">Registry contract:</span>{' '}
                    <span className="font-mono">{REGISTRY_CONTRACT}</span>
                  </p>
                  <p>
                    <span className="text-foreground font-medium">Shard discovery:</span>{' '}
                    All SAMM liquidity pools are registered as ENS subnames under{' '}
                    <span className="font-mono text-foreground">*.samm.eth</span> — any protocol can discover
                    our pools via ENS without our JSON files.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agents section */}
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-foreground mb-4">Autonomous Agents</h2>

              {isLoading && (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full bg-secondary/50 rounded-xl" />
                  ))}
                </div>
              )}

              {isError && (
                <Card className="border-destructive/30 bg-destructive/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <span className="text-sm text-destructive flex-1">Failed to load agents</span>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {agents && agents.length > 0 && (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <AgentCard key={agent.name} agent={agent} />
                  ))}
                </div>
              )}

              {agents && agents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No agents registered yet
                </p>
              )}
            </section>

            {/* ENS Shard Registry */}
            <ENSShardRegistry />

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
