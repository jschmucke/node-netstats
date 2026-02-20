import type { MinerEntry } from '@eth-netstats/types';
import { formatMinerAddress, minerBlocksClass } from '../../lib/formatters';

interface Props {
  miners: MinerEntry[];
  total: number;
}

export function MinersPanel({ miners, total }: Props) {
  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Last blocks miners</div>
      <div className="flex gap-1 flex-wrap">
        {miners.map(miner => (
          <div
            key={miner.miner}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${minerBlocksClass(miner.blocks)}`}
            title={miner.miner}
          >
            <span className="font-mono">{formatMinerAddress(miner.miner, miner.name)}</span>
            <span className="font-bold">{miner.blocks}</span>
          </div>
        ))}
        {miners.length === 0 && (
          <span className="text-gray-600 text-xs">No data</span>
        )}
      </div>
    </div>
  );
}
