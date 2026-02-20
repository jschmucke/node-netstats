import { SparkBarChart } from '../molecules/SparkBarChart';
import { PropagationHistogram } from './PropagationHistogram';
import { MinersPanel } from './MinersPanel';
import { useChartsStore } from '../../stores/chartsStore';

interface ChartPanelProps {
  label: string;
  children: React.ReactNode;
}

function ChartPanel({ label, children }: ChartPanelProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{label}</div>
      {children}
    </div>
  );
}

export function ChartsRow() {
  const {
    blocktime,
    difficulty,
    uncles,
    transactions,
    gasSpending,
    gasLimit,
    miners,
    propagation,
  } = useChartsStore();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
      <ChartPanel label="Block Time">
        <SparkBarChart data={blocktime} color="#7bcc3a" />
      </ChartPanel>

      <ChartPanel label="Difficulty">
        <SparkBarChart
          data={difficulty.map(d => Number(BigInt(d || '0') / BigInt(1e9)))}
          color="#10a0de"
        />
      </ChartPanel>

      <ChartPanel label="Transactions">
        <SparkBarChart data={transactions} color="#FFD162" />
      </ChartPanel>

      <ChartPanel label="Gas Spending">
        <SparkBarChart data={gasSpending} color="#ff8a00" />
      </ChartPanel>

      <ChartPanel label="Gas Limit">
        <SparkBarChart data={gasLimit} color="#6366f1" />
      </ChartPanel>

      <ChartPanel label="Uncle Count">
        <SparkBarChart data={uncles} color="#F74B4B" />
      </ChartPanel>

      <div className="col-span-2">
        <PropagationHistogram
          histogram={propagation?.histogram ?? []}
          avg={propagation?.avg ?? 0}
        />
      </div>

      <div className="col-span-2">
        <MinersPanel miners={miners ?? []} total={40} />
      </div>
    </div>
  );
}
