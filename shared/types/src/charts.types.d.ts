import type { MinerEntry } from './node.types';
export interface PropagationBin {
    x: number;
    dx: number;
    y: number;
    frequency: number;
    cumulative: number;
    cumpercent: number;
}
export interface BlockPropagation {
    histogram: PropagationBin[];
    avg: number;
}
export interface ServerChartsPayload {
    height: number[];
    blocktime: number[];
    avgBlocktime: number;
    difficulty: (string | number)[];
    uncles: number[];
    transactions: number[];
    gasSpending: number[];
    gasLimit: number[];
    miners: MinerEntry[];
    propagation: BlockPropagation;
    uncleCount: number[];
    avgHashrate: number;
}
//# sourceMappingURL=charts.types.d.ts.map