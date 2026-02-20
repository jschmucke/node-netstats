import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SortKey = 'id' | 'block' | 'peers' | 'mining' | 'hashrate' | 'gasPrice' | 'uptime' | 'propagation' | 'latency';

interface UiState {
  pinnedNodes: string[];
  sortKey: SortKey;
  sortReverse: boolean;
  clientLatency: number;

  togglePin: (id: string) => void;
  setSortKey: (key: SortKey) => void;
  setClientLatency: (ms: number) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      pinnedNodes: [],
      sortKey: 'block',
      sortReverse: false,
      clientLatency: 0,

      togglePin: (id) =>
        set((state) => ({
          pinnedNodes: state.pinnedNodes.includes(id)
            ? state.pinnedNodes.filter(p => p !== id)
            : [...state.pinnedNodes, id],
        })),

      setSortKey: (key) =>
        set((state) => ({
          sortKey: key,
          sortReverse: state.sortKey === key ? !state.sortReverse : false,
        })),

      setClientLatency: (ms) => set({ clientLatency: ms }),
    }),
    {
      name: 'eth-netstats-ui',
      partialize: (state) => ({
        pinnedNodes: state.pinnedNodes,
        sortKey: state.sortKey,
        sortReverse: state.sortReverse,
      }),
    },
  ),
);
