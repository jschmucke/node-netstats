import { propagationColor } from '../../lib/formatters';

interface Props {
  history: number[]; // 40-slot propagation array (-1 = no data)
  barWidth?: number;
  height?: number;
}

export function PropagationSparkChart({ history, barWidth = 6, height = 24 }: Props) {
  const barGap = 1;
  const width = history.length * (barWidth + barGap);
  const maxVal = Math.max(...history.filter(v => v >= 0), 1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {history.map((v, i) => {
        const barH = v < 0 ? 2 : Math.max(2, Math.round((v / maxVal) * height));
        const fill = propagationColor(v);
        return (
          <rect
            key={i}
            x={i * (barWidth + barGap)}
            y={height - barH}
            width={barWidth}
            height={barH}
            fill={fill}
          />
        );
      })}
    </svg>
  );
}
