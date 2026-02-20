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
    chainId?: number;
}
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
    arrived?: number;
    received?: number;
    propagation?: number;
    time?: number;
    fork?: number;
    trusted?: boolean;
}
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
    history: number[];
    geo: GeoInfo | null;
    pinned?: boolean;
}
export interface MinerEntry {
    miner: string;
    name: string | false;
    blocks: number;
}
//# sourceMappingURL=node.types.d.ts.map