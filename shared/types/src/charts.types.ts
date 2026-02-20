import type { MinerEntry } from './node.types';

// -----------------------------------------------
// Propagation histogram bin
// -----------------------------------------------

export interface PropagationBin {
  x: number;       // bin start (ms)
  dx: number;      // bin width (ms)
  y: number;       // relative frequency (0-1)
  frequency: number;  // absolute count in bin
  cumulative: number; // cumulative absolute count
  cumpercent: number; // cumulative percent (0-1)
}

export interface BlockPropagation {
  histogram: PropagationBin[];
  avg: number;  // average propagation in ms
}

// -----------------------------------------------
// Full charts payload sent to browser clients
// -----------------------------------------------

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
