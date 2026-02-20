export type Consensus = 'pow' | 'pos' | 'poa';

export interface NetworkProfile {
  chainId: number;
  name: string;
  shortName: string;
  nativeSymbol: string;       // ETH, MATIC, BNB, AVAX…
  expectedBlockTime: number;  // ms — used for color thresholds
  consensus: Consensus;       // affects mining/hashrate column visibility
  explorerUrl: string;        // https://etherscan.io (empty for custom/private)
  maxPropagationMs: number;   // X-axis limit for propagation histogram
}

export interface BlockTimeThresholds {
  good: number;     // ms — green
  warning: number;  // ms — yellow
  danger: number;   // ms — orange (above this → red)
}
