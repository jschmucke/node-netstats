import { useEffect } from 'react';
import type { NodeEntry, ServerChartsPayload, BlockData, NodeStats } from '@eth-netstats/types';
import { socket } from './socket';
import { useNodesStore } from '../stores/nodesStore';
import { useChartsStore } from '../stores/chartsStore';
import { useUiStore } from '../stores/uiStore';

export function useSocket() {
  const { initNodes, addOrUpdateNode, updateBlock, updateStats, updatePending, setInactive } =
    useNodesStore();
  const updateCharts = useChartsStore(s => s.updateCharts);
  const setClientLatency = useUiStore(s => s.setClientLatency);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      socket.emit('ready');
    });

    socket.on('init', (data: { nodes: NodeEntry[] }) => {
      initNodes(data.nodes ?? []);
    });

    socket.on('add', (node: NodeEntry) => {
      addOrUpdateNode(node);
    });

    socket.on('block', (data: { id: string; block: BlockData; propagationAvg: number; history: number[] }) => {
      updateBlock(data.id, data.block, data.propagationAvg, data.history);
    });

    socket.on('update', (data: { id: string; block: BlockData; propagationAvg: number; history: number[] }) => {
      updateBlock(data.id, data.block, data.propagationAvg, data.history);
    });

    socket.on('stats', (data: { id: string; stats: Partial<NodeStats> }) => {
      updateStats(data.id, data.stats);
    });

    socket.on('pending', (data: { id: string; pending: number }) => {
      updatePending(data.id, data.pending);
    });

    socket.on('inactive', (data: { id: string; stats: Partial<NodeStats> }) => {
      setInactive(data.id, data.stats);
    });

    socket.on('charts', (data: ServerChartsPayload) => {
      updateCharts(data);
    });

    socket.on('client-ping', (data: { serverTime: number }) => {
      socket.emit('client-pong', { serverTime: data.serverTime });
    });

    socket.on('client-latency', (data: { latency: number }) => {
      setClientLatency(data.latency);
    });

    return () => {
      socket.off('connect');
      socket.off('init');
      socket.off('add');
      socket.off('block');
      socket.off('update');
      socket.off('stats');
      socket.off('pending');
      socket.off('inactive');
      socket.off('charts');
      socket.off('client-ping');
      socket.off('client-latency');
      socket.disconnect();
    };
  }, []);
}
