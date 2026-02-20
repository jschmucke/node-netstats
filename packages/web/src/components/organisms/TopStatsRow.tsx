import type { BlockData } from '@eth-netstats/types';
import { formatHashrate, formatTotalDifficulty, formatAvgBlocktime } from '../../lib/formatters';
import { useChartsStore } from '../../stores/chartsStore';

interface Props {
  bestBlock: BlockData | null;
  nodesActive: number;
  nodesTotal: number;
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg px-4 py-3 flex flex-col gap-1 min-w-[120px]">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold text-gray-100">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

export function TopStatsRow({ bestBlock, nodesActive, nodesTotal }: Props) {
  const { avgBlocktime, avgHashrate, uncleCount } = useChartsStore();

  const uncleTotal = Array.isArray(uncleCount)
    ? uncleCount.reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <StatCard
        label="Best Block"
        value={bestBlock?.number ? `#${bestBlock.number.toLocaleString()}` : '—'}
      />
      <StatCard
        label="Uncle Count"
        value={uncleTotal}
        sub="last 1000 blocks"
      />
      <StatCard
        label="Last Block"
        value={bestBlock?.arrived ? `${Math.round((Date.now() - bestBlock.arrived) / 1000)} s ago` : '—'}
      />
      <StatCard
        label="Avg Block Time"
        value={formatAvgBlocktime(avgBlocktime)}
      />
      <StatCard
        label="Avg Network Hashrate"
        value={formatHashrate(avgHashrate, avgHashrate > 0)}
      />
      <StatCard
        label="Difficulty"
        value={bestBlock?.difficulty ? formatTotalDifficulty(bestBlock.difficulty) : '—'}
      />
      <StatCard
        label="Active Nodes"
        value={`${nodesActive} / ${nodesTotal}`}
      />
    </div>
  );
}
