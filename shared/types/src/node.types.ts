// -----------------------------------------------
// Node info sent by the agent in the 'hello' event
// -----------------------------------------------

export interface NodeInfo {
  name: string;
  contact: string;
  coinbase: string | null;
  node: string | null;
  net: string | null;
  protocol: number | null;
  api: string | null;
  port: number;
  os: string;
  os_v: string;
  client: string;
  canUpdateHistory: boolean;
  ip?: string;
  chainId?: number; // sent by agent at connect time
}

// -----------------------------------------------
// Block data from Ethereum node
// -----------------------------------------------

export interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  sha3Uncles: string;
  transactionsRoot: string;
  stateRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  transactions: string[];
  uncles: string[];
  // Added by server after propagation tracking
  arrived?: number;
  received?: number;
  propagation?: number;
  time?: number;
  fork?: number;
  trusted?: boolean;
}

// -----------------------------------------------
// Stats sent by the agent in 'stats' / 'update'
// -----------------------------------------------

export interface SyncStatus {
  startingBlock: number;
  currentBlock: number;
  highestBlock: number;
  progress: number;
}

export interface NodeStats {
  active: boolean;
  mining: boolean;
  hashrate: number;
  peers: number;
  pending: number;
  gasPrice: string;
  block: BlockData;
  syncing: SyncStatus | false;
  uptime: number;
  propagationAvg: number;
  latency: number;
}

// -----------------------------------------------
// Full node entry (stored in server collection)
// -----------------------------------------------

export interface GeoInfo {
  range?: [number, number];
  country: string;
  region: string;
  eu: string;
  timezone: string;
  city: string;
  ll: [number, number];
  metro: number;
  area: number;
}

export interface NodeEntry {
  id: string;
  info: NodeInfo;
  stats: NodeStats;
  history: number[];  // 40-element array, -1 = no data for that block slot
  geo: GeoInfo | null;
  pinned?: boolean;   // client-side only
}

// -----------------------------------------------
// Miner count entry (for charts)
// -----------------------------------------------

export interface MinerEntry {
  miner: string;
  name: string | false;
  blocks: number;
}
