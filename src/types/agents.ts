export interface Agent {
  name: string;            // e.g. "arb-bot.samm.eth"
  address: string;
  status: 'active' | 'inactive';
  config: Record<string, string>;
  stats: Record<string, string>;
}

export interface AgentDetail extends Agent {
  allTextRecords: Record<string, string>;
  registryContractAddress: string;
}

export interface ShardRegistryEntry {
  ensName: string;         // e.g. "small.weth-usdc.samm.eth"
  address: string;
  tvl: string;
  tier: string;
  pair: string;
}
