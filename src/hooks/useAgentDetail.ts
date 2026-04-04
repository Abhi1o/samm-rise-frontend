import { useQuery } from '@tanstack/react-query';
import { sammApi } from '@/services/sammApi';
import type { AgentDetail } from '@/types/agents';

export function useAgentDetail(name: string | null) {
  return useQuery<AgentDetail>({
    queryKey: ['agent', name],
    queryFn: () => sammApi.getAgent(name!),
    enabled: !!name,
    staleTime: 30_000,
    retry: 1,
  });
}
