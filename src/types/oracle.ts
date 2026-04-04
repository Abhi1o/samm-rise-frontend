export interface OracleRow {
  token: string;           // e.g. "ETH"
  chainlinkPrice: number;
  coingeckoPrice: number;
  onchainPrice: number;
  deviationPct: string;    // e.g. "0.05"
  isHighDeviation: boolean;
  usingFallback: boolean;
}

export interface OracleComparisonResult {
  rows: OracleRow[];
  lastUpdated: string;          // ISO timestamp
  creWorkflowStatus: 'active' | 'inactive';
  lastTriggered: string;        // ISO timestamp
  shardsMonitored: number;
}
