interface Props {
  active: boolean;
  reverse: boolean;
}

export function SortIcon({ active, reverse }: Props) {
  if (!active) return <span className="ml-1 text-gray-600">↕</span>;
  return <span className="ml-1 text-gray-300">{reverse ? '↑' : '↓'}</span>;
}
