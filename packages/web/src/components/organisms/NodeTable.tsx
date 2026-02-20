import { useMemo } from 'react';
import type { NodeEntry } from '@eth-netstats/types';
import { NodeTableRow } from '../molecules/NodeTableRow';
import { SortIcon } from '../atoms/SortIcon';
import { useUiStore } from '../../stores/uiStore';

type SortKey = 'id' | 'block' | 'peers' | 'mining' | 'hashrate' | 'gasPrice' | 'uptime' | 'propagation' | 'latency';

interface Props {
  nodes: NodeEntry[];
  bestBlock: number;
}

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'id', label: 'Node', className: '' },
  { key: 'block', label: 'Block', className: 'text-right' },
  { key: 'peers', label: 'Peers', className: 'text-right' },
  { key: 'mining', label: 'Mining', className: 'text-center' },
  { key: 'uptime', label: 'Uptime', className: 'text-right' },
  { key: 'latency', label: 'Latency', className: 'text-right' },
  { key: 'propagation', label: 'Propagation', className: 'text-right' },
];

function sortNodes(nodes: NodeEntry[], key: SortKey, reverse: boolean, pinned: string[]): NodeEntry[] {
  const sorted = [...nodes].sort((a, b) => {
    const pinA = pinned.includes(a.id) ? -1 : 0;
    const pinB = pinned.includes(b.id) ? -1 : 0;
    if (pinA !== pinB) return pinA - pinB;

    let cmp = 0;
    switch (key) {
      case 'id': cmp = a.id.localeCompare(b.id); break;
      case 'block': cmp = (b.stats.block.number ?? 0) - (a.stats.block.number ?? 0); break;
      case 'peers': cmp = (b.stats.peers ?? 0) - (a.stats.peers ?? 0); break;
      case 'mining': cmp = Number(b.stats.mining) - Number(a.stats.mining); break;
      case 'hashrate': cmp = (b.stats.hashrate ?? 0) - (a.stats.hashrate ?? 0); break;
      case 'gasPrice': cmp = Number(b.stats.gasPrice ?? 0) - Number(a.stats.gasPrice ?? 0); break;
      case 'uptime': cmp = (b.stats.uptime ?? 0) - (a.stats.uptime ?? 0); break;
      case 'propagation': cmp = (a.stats.propagationAvg ?? 0) - (b.stats.propagationAvg ?? 0); break;
      case 'latency': cmp = (a.stats.latency ?? 0) - (b.stats.latency ?? 0); break;
    }
    return reverse ? -cmp : cmp;
  });
  return sorted;
}

export function NodeTable({ nodes, bestBlock }: Props) {
  const { sortKey, sortReverse, pinnedNodes, setSortKey } = useUiStore();

  const sorted = useMemo(
    () => sortNodes(nodes, sortKey, sortReverse, pinnedNodes),
    [nodes, sortKey, sortReverse, pinnedNodes],
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="bg-gray-900 text-gray-500 text-xs uppercase tracking-wider">
            <th className="px-2 py-2 w-8" />
            <th className="px-2 py-2 w-8">St.</th>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`px-3 py-2 cursor-pointer select-none hover:text-gray-300 ${col.className ?? ''}`}
                onClick={() => setSortKey(col.key)}
              >
                {col.label}
                <SortIcon active={sortKey === col.key} reverse={sortReverse} />
              </th>
            ))}
            <th className="px-2 py-2 hidden lg:table-cell">Hash</th>
            <th className="px-2 py-2">Pending</th>
            <th className="px-2 py-2">Last block</th>
            <th className="px-2 py-2 hidden xl:table-cell">Gas price</th>
            <th className="px-2 py-2">History</th>
            <th className="px-2 py-2 hidden 2xl:table-cell">Client</th>
            <th className="px-2 py-2 hidden lg:table-cell">Location</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={20} className="text-center py-8 text-gray-600">
                Waiting for nodes to connect...
              </td>
            </tr>
          )}
          {sorted.map((node, i) => (
            <NodeTableRow key={node.id} node={node} bestBlock={bestBlock} rank={i + 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
