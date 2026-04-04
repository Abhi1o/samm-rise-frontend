import { useQuery } from '@tanstack/react-query';
import { sammApi } from '@/services/sammApi';
import type { Agent, ShardRegistryEntry } from '@/types/agents';

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: () => sammApi.getAgents(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useShardRegistry() {
  return useQuery<ShardRegistryEntry[]>({
    queryKey: ['shard-registry'],
    queryFn: () => sammApi.getShardRegistry(),
    staleTime: 60_000,
    retry: 1,
  });
}
