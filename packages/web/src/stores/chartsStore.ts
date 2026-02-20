import { create } from 'zustand';
import type { ServerChartsPayload, PropagationBin, MinerEntry } from '@eth-netstats/types';

interface ChartsState extends ServerChartsPayload {
  updateCharts: (data: ServerChartsPayload) => void;
}

export const useChartsStore = create<ChartsState>((set) => ({
  height: [],
  blocktime: [],
  avgBlocktime: 0,
  difficulty: [],
  uncles: [],
  transactions: [],
  gasSpending: [],
  gasLimit: [],
  miners: [],
  propagation: { histogram: [], avg: 0 },
  uncleCount: [],
  avgHashrate: 0,

  updateCharts: (data) => set({ ...data }),
}));
