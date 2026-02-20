import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { PropagationBin } from '@eth-netstats/types';

interface Props {
  histogram: PropagationBin[];
  avg: number;
}

export function PropagationHistogram({ histogram, avg }: Props) {
  const data = histogram.map(bin => ({
    x: bin.x,
    pct: Math.round(bin.cumpercent * 100),
    freq: bin.frequency,
  }));

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
        Block propagation — avg {avg} ms
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="x"
            tickFormatter={v => `${v / 1000}s`}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            interval={9}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 4, fontSize: 11 }}
            formatter={(v: number, name: string) => [
              name === 'pct' ? `${v}%` : v,
              name === 'pct' ? 'Cumulative' : 'Count',
            ]}
            labelFormatter={v => `${v} ms`}
          />
          <Bar dataKey="pct" fill="#10a0de" radius={[2, 2, 0, 0]} />
          {avg > 0 && (
            <ReferenceLine
              x={Math.round(avg / (histogram[1]?.x - histogram[0]?.x || 250)) * (histogram[1]?.x - histogram[0]?.x || 250)}
              stroke="#FFD162"
              strokeDasharray="3 3"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
