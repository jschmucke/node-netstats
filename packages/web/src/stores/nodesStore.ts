import { create } from 'zustand';
import type { NodeEntry, BlockData, NodeStats } from '@eth-netstats/types';

interface NodesState {
  nodes: NodeEntry[];
  bestBlock: BlockData | null;
  nodesActive: number;
  nodesTotal: number;
  upTimeTotal: number;

  // Actions
  initNodes: (nodes: NodeEntry[]) => void;
  addOrUpdateNode: (node: NodeEntry) => void;
  updateBlock: (id: string, block: BlockData, propagationAvg: number, history: number[]) => void;
  updateStats: (id: string, stats: Partial<NodeStats>) => void;
  updatePending: (id: string, pending: number) => void;
  setInactive: (id: string, stats: Partial<NodeStats>) => void;
}

function findBestBlock(nodes: NodeEntry[]): BlockData | null {
  const active = nodes.filter(n => n.stats.active);
  if (!active.length) return null;
  return active.reduce((best, n) => {
    return !best || n.stats.block.number > best.number ? n.stats.block : best;
  }, null as BlockData | null);
}

function computeDerived(nodes: NodeEntry[]) {
  const nodesActive = nodes.filter(n => n.stats.active).length;
  const nodesTotal = nodes.length;
  const upTimeTotal = nodes.length
    ? Math.round(nodes.reduce((sum, n) => sum + (n.stats.uptime ?? 0), 0) / nodes.length)
    : 0;
  const bestBlock = findBestBlock(nodes);
  return { nodesActive, nodesTotal, upTimeTotal, bestBlock };
}

export const useNodesStore = create<NodesState>((set) => ({
  nodes: [],
  bestBlock: null,
  nodesActive: 0,
  nodesTotal: 0,
  upTimeTotal: 0,

  initNodes: (nodes) =>
    set({ nodes, ...computeDerived(nodes) }),

  addOrUpdateNode: (node) =>
    set((state) => {
      const idx = state.nodes.findIndex(n => n.id === node.id);
      const nodes = idx >= 0
        ? state.nodes.map((n, i) => (i === idx ? { ...n, ...node } : n))
        : [...state.nodes, node];
      return { nodes, ...computeDerived(nodes) };
    }),

  updateBlock: (id, block, propagationAvg, history) =>
    set((state) => {
      const nodes = state.nodes.map(n =>
        n.id === id
          ? { ...n, stats: { ...n.stats, block, propagationAvg }, history }
          : n,
      );
      return { nodes, ...computeDerived(nodes) };
    }),

  updateStats: (id, stats) =>
    set((state) => {
      const nodes = state.nodes.map(n =>
        n.id === id ? { ...n, stats: { ...n.stats, ...stats } } : n,
      );
      return { nodes, ...computeDerived(nodes) };
    }),

  updatePending: (id, pending) =>
    set((state) => {
      const nodes = state.nodes.map(n =>
        n.id === id ? { ...n, stats: { ...n.stats, pending } } : n,
      );
      return { nodes };
    }),

  setInactive: (id, stats) =>
    set((state) => {
      const nodes = state.nodes.map(n =>
        n.id === id ? { ...n, stats: { ...n.stats, ...stats, active: false } } : n,
      );
      return { nodes, ...computeDerived(nodes) };
    }),
}));
