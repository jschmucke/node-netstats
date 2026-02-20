interface Props {
  data: number[];
  maxValue?: number;
  barWidth?: number;
  barGap?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function SparkBarChart({
  data,
  maxValue,
  barWidth = 6,
  barGap = 1,
  height = 24,
  color = '#10a0de',
  className,
}: Props) {
  if (!data.length) return null;
  const max = maxValue ?? Math.max(...data.filter(v => v > 0), 1);
  const width = data.length * (barWidth + barGap);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      {data.map((v, i) => {
        const barH = v > 0 ? Math.max(2, Math.round((v / max) * height)) : 2;
        return (
          <rect
            key={i}
            x={i * (barWidth + barGap)}
            y={height - barH}
            width={barWidth}
            height={barH}
            fill={v > 0 ? color : '#374151'}
          />
        );
      })}
    </svg>
  );
}
