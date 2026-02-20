import { memo } from 'react';
import type { NodeEntry } from '@eth-netstats/types';
import { StatusBadge } from '../atoms/StatusBadge';
import { HashDisplay } from '../atoms/HashDisplay';
import { TimeAgo } from '../atoms/TimeAgo';
import { PropagationTime } from '../atoms/PropagationTime';
import { PropagationSparkChart } from './PropagationSparkChart';
import {
  formatHashrate,
  formatGasPrice,
  formatUptime,
  formatNodeVersion,
  peerClass,
  miningClass,
  uptimeClass,
  latencyClass,
  blockNumberClass,
} from '../../lib/formatters';
import { useUiStore } from '../../stores/uiStore';

interface Props {
  node: NodeEntry;
  bestBlock: number;
  rank: number;
}

export const NodeTableRow = memo(function NodeTableRow({ node, bestBlock, rank }: Props) {
  const { pinnedNodes, togglePin } = useUiStore();
  const isPinned = pinnedNodes.includes(node.id);
  const { stats, info, geo, history } = node;
  const { block, active } = stats;

  return (
    <tr className={`border-b border-gray-800 hover:bg-gray-900/50 transition-colors ${isPinned ? 'bg-gray-800/30' : ''}`}>
      {/* Rank / Pin */}
      <td className="px-2 py-1 text-center">
        <button
          onClick={() => togglePin(node.id)}
          className={`text-xs ${isPinned ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
          title={isPinned ? 'Unpin' : 'Pin'}
        >
          {isPinned ? '★' : '☆'}
        </button>
      </td>

      {/* Status */}
      <td className="px-2 py-1 text-center">
        <StatusBadge active={active} />
      </td>

      {/* Name */}
      <td className="px-3 py-1 max-w-[150px] truncate">
        <span className="text-sm text-gray-200" title={info.name}>
          {info.name}
        </span>
      </td>

      {/* Location */}
      <td className="px-2 py-1 text-xs text-gray-400">
        {geo ? `${geo.city || ''} ${geo.country || ''}`.trim() : '—'}
      </td>

      {/* Block */}
      <td className="px-2 py-1 text-right font-mono text-sm">
        <span className={blockNumberClass(block.number, bestBlock, active)}>
          {block.number || '—'}
        </span>
      </td>

      {/* Block hash */}
      <td className="px-2 py-1 hidden lg:table-cell">
        <HashDisplay hash={block.hash} className="text-gray-400" />
      </td>

      {/* Mining */}
      <td className="px-2 py-1 text-center text-sm">
        <span className={miningClass(stats.mining, active)}>
          {active ? (stats.mining ? '✓' : '✗') : '—'}
        </span>
      </td>

      {/* Peers */}
      <td className="px-2 py-1 text-right text-sm">
        <span className={peerClass(stats.peers, active)}>
          {active ? stats.peers : '—'}
        </span>
      </td>

      {/* Pending */}
      <td className="px-2 py-1 text-right text-sm text-gray-400">
        {active ? (stats.pending ?? 0) : '—'}
      </td>

      {/* Last block */}
      <td className="px-2 py-1 text-sm">
        {active && block.arrived
          ? <TimeAgo timestamp={block.arrived} active={active} />
          : <span className="text-gray-600">—</span>
        }
      </td>

      {/* Propagation */}
      <td className="px-2 py-1 text-right text-sm">
        <PropagationTime
          ms={block.propagation ?? 0}
          active={active}
          blockNum={block.number}
          bestBlock={bestBlock}
        />
      </td>

      {/* Avg propagation sparkline */}
      <td className="px-2 py-1">
        <PropagationSparkChart history={history ?? []} />
      </td>

      {/* Uptime */}
      <td className="px-2 py-1 text-right text-sm">
        <span className={uptimeClass(stats.uptime, active)}>
          {formatUptime(stats.uptime)}
        </span>
      </td>

      {/* Latency */}
      <td className="px-2 py-1 text-right text-sm">
        <span className={latencyClass(stats.latency, active)}>
          {active ? `${stats.latency} ms` : 'offline'}
        </span>
      </td>

      {/* Gas price */}
      <td className="px-2 py-1 text-right text-sm hidden xl:table-cell text-gray-400">
        {active ? formatGasPrice(stats.gasPrice) : '—'}
      </td>

      {/* Node client version */}
      <td className="px-2 py-1 text-xs text-gray-500 hidden 2xl:table-cell truncate max-w-[120px]">
        <span title={info.node ?? ''}>
          {formatNodeVersion(info.node)}
        </span>
      </td>
    </tr>
  );
});
