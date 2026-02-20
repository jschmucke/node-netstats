import type { BlockData, NodeStats, NodeEntry } from './node.types';
import type { NetworkProfile } from './network.types';
export interface HelloPayload {
    id: string;
    info: import('./node.types').NodeInfo;
    secret: string;
    ip?: string;
    spark?: string;
    latency?: number;
}
export interface BlockPayload {
    id: string;
    block: BlockData;
}
export interface StatsPayload {
    id: string;
    stats: NodeStats;
}
export interface PendingPayload {
    id: string;
    stats: {
        pending: number;
    };
}
export interface HistoryPayload {
    id: string;
    history: BlockData[];
}
export interface NodePingPayload {
    id: string;
    clientTime: number;
}
export interface LatencyPayload {
    id: string;
    latency: number;
}
export interface NodePongPayload {
    clientTime: number;
    serverTime: number;
}
export interface HistoryRequestPayload {
    min: number;
    max: number;
    list: number[];
}
export type ServerAction = 'init' | 'add' | 'update' | 'block' | 'pending' | 'stats' | 'inactive' | 'charts' | 'client-ping';
export interface InitPayload {
    nodes: NodeEntry[];
    network: NetworkProfile;
}
export interface AddPayload extends NodeEntry {
}
export interface BlockUpdatePayload {
    id: string;
    block: BlockData;
    propagationAvg: number;
    history: number[];
}
export interface StatsUpdatePayload {
    id: string;
    stats: {
        active: boolean;
        mining: boolean;
        syncing: import('./node.types').SyncStatus | false;
        hashrate: number;
        peers: number;
        gasPrice: string;
        uptime: number;
        latency: number;
    };
}
export interface PendingUpdatePayload {
    id: string;
    pending: number;
}
export interface InactivePayload {
    id: string;
    stats: NodeStats;
    history: number[];
}
export interface ClientPingPayload {
    serverTime: number;
}
export interface ClientPongPayload {
    serverTime: number;
}
//# sourceMappingURL=events.types.d.ts.map