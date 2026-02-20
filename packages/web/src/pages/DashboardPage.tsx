import { useSocket } from '../socket/useSocket';
import { useInitialData } from '../hooks/useInitialData';
import { useNodesStore } from '../stores/nodesStore';
import { TopStatsRow } from '../components/organisms/TopStatsRow';
import { ChartsRow } from '../components/organisms/ChartsRow';
import { NodeTable } from '../components/organisms/NodeTable';

export function DashboardPage() {
  useSocket();
  const { isLoading } = useInitialData();

  const { nodes, bestBlock, nodesActive, nodesTotal } = useNodesStore();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Eth Network Stats</h1>
        <p className="text-sm text-gray-500 mt-1">
          This page does not represent the Ethereum network — it shows data from
          nodes that have opted in to share their information.
        </p>
      </header>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading initial data...</div>
      ) : (
        <>
          <TopStatsRow
            bestBlock={bestBlock}
            nodesActive={nodesActive}
            nodesTotal={nodesTotal}
          />
          <ChartsRow />
          <NodeTable nodes={nodes} bestBlock={bestBlock?.number ?? 0} />
        </>
      )}
    </div>
  );
}
