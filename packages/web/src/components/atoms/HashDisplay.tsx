import { formatHash } from '../../lib/formatters';

interface Props {
  hash: string | undefined;
  className?: string;
}

export function HashDisplay({ hash, className }: Props) {
  return (
    <span className={`font-mono text-xs ${className ?? ''}`} title={hash}>
      {formatHash(hash)}
    </span>
  );
}
