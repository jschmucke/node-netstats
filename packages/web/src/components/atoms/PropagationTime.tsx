import { formatPropagation, propagationClass } from '../../lib/formatters';

interface Props {
  ms: number;
  active: boolean;
  blockNum: number;
  bestBlock: number;
  className?: string;
}

export function PropagationTime({ ms, active, blockNum, bestBlock, className }: Props) {
  const cls = propagationClass(ms, active, blockNum, bestBlock);
  return (
    <span className={`${cls} ${className ?? ''}`}>
      {active && blockNum >= bestBlock ? formatPropagation(ms) : '—'}
    </span>
  );
}
