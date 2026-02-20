export type Consensus = 'pow' | 'pos' | 'poa';
export interface NetworkProfile {
    chainId: number;
    name: string;
    shortName: string;
    nativeSymbol: string;
    expectedBlockTime: number;
    consensus: Consensus;
    explorerUrl: string;
    maxPropagationMs: number;
}
export interface BlockTimeThresholds {
    good: number;
    warning: number;
    danger: number;
}
//# sourceMappingURL=network.types.d.ts.map