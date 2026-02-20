interface Props {
  active: boolean;
}

export function StatusBadge({ active }: Props) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-400' : 'bg-red-500'}`}
      title={active ? 'Online' : 'Offline'}
    />
  );
}
