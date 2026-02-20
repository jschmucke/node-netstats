import { useState, useEffect } from 'react';
import { formatTimeAgo, timeAgoClass } from '../../lib/formatters';

interface Props {
  timestamp: number;
  active: boolean;
  className?: string;
}

export function TimeAgo({ timestamp, active, className }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const cls = timeAgoClass(timestamp, active);
  return (
    <span className={`${cls} ${className ?? ''}`} title={new Date(timestamp).toISOString()}>
      {formatTimeAgo(timestamp)}
    </span>
  );
}
