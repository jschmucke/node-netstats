import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { NodeEntry, ServerChartsPayload } from '@eth-netstats/types';
import { useNodesStore } from '../stores/nodesStore';
import { useChartsStore } from '../stores/chartsStore';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

export function useInitialData() {
  const initNodes = useNodesStore(s => s.initNodes);
  const updateCharts = useChartsStore(s => s.updateCharts);

  const nodesQuery = useQuery({
    queryKey: ['nodes'],
    queryFn: () => fetchJson<{ nodes: NodeEntry[] }>('/api/nodes'),
    staleTime: Infinity,
    retry: 3,
  });

  const chartsQuery = useQuery({
    queryKey: ['charts'],
    queryFn: () => fetchJson<ServerChartsPayload>('/api/charts'),
    staleTime: Infinity,
    retry: 3,
  });

  useEffect(() => {
    if (nodesQuery.data?.nodes) {
      initNodes(nodesQuery.data.nodes);
    }
  }, [nodesQuery.data]);

  useEffect(() => {
    if (chartsQuery.data) {
      updateCharts(chartsQuery.data);
    }
  }, [chartsQuery.data]);

  return {
    isLoading: nodesQuery.isLoading || chartsQuery.isLoading,
    error: nodesQuery.error ?? chartsQuery.error,
  };
}
