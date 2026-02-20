import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BlockData, NodeInfo, NodeStats, ServerChartsPayload } from '@eth-netstats/types';
import type { AppConfig } from '../config/configuration';
import { GeoService } from '../geo/geo.service';
import { NodeModel } from './node.model';
import { HistoryService } from './history.service';

const HISTORY_THROTTLE_MS = 2 * 60 * 1000; // 2 minutes
const CHARTS_DEBOUNCE_MS = 1000;
const CHARTS_MAX_WAIT_MS = 5000;

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  private readonly _nodes = new Map<string, NodeModel>();
  private readonly _sparkToNode = new Map<string, string>(); // sparkId → nodeId
  private _askedForHistory = false;
  private _askedForHistoryTime = 0;
  private _chartsDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _chartsMaxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  private _chartsCallback: ((charts: ServerChartsPayload) => void) | null = null;

  constructor(
    private readonly config: ConfigService<AppConfig>,
    private readonly geoService: GeoService,
    private readonly historyService: HistoryService,
  ) {
    this.historyService.setCallback(charts => {
      if (this._chartsCallback) this._chartsCallback(charts);
    });
  }

  // -----------------------------------------------
  // Node registry
  // -----------------------------------------------

  private getOrCreate(id: string, data: { spark?: string; latency?: number }): NodeModel {
    if (!this._nodes.has(id)) {
      this._nodes.set(id, new NodeModel({ id, ...data }));
    }
    return this._nodes.get(id)!;
  }

  private getById(id: string): NodeModel | null {
    return this._nodes.get(id) ?? null;
  }

  getBySpark(sparkId: string): NodeModel | null {
    const nodeId = this._sparkToNode.get(sparkId);
    if (!nodeId) return null;
    return this._nodes.get(nodeId) ?? null;
  }

  // -----------------------------------------------
  // Protocol event handlers
  // -----------------------------------------------

  /**
   * hello event — register or update node info.
   * Returns the node's public info if successful, null if rejected.
   */
  addNode(data: {
    id: string;
    info: Partial<NodeInfo>;
    spark: string;
    ip: string;
    latency?: number;
  }): ReturnType<NodeModel['getInfo']> | null {
    const node = this.getOrCreate(data.id, { spark: data.spark, latency: data.latency });

    this._sparkToNode.set(data.spark, data.id);

    const trustedIps = this.config.get<string[]>('trustedIps') ?? [];

    node.setInfo(
      {
        id: data.id,
        info: data.info,
        ip: data.ip,
        spark: data.spark,
        latency: data.latency,
      },
      (ip: string) => this.geoService.lookup(ip),
      trustedIps,
    );

    this.logger.log(`Node connected: ${data.id} from ${data.ip}`);
    return node.getInfo();
  }

  /**
   * block event — add block to history, update node block stats.
   */
  addBlock(
    id: string,
    blockData: BlockData,
  ): ReturnType<NodeModel['getBlockStats']> | null {
    const node = this.getById(id);
    if (!node) {
      this.logger.warn(`addBlock: node not found: ${id}`);
      return null;
    }

    const result = this.historyService.add(blockData, id, node.trusted);
    if (!result) {
      this.logger.warn(`addBlock: invalid block from ${id}`);
      return null;
    }

    const { block, changed } = result;
    if (!changed) return null;

    const propagationHistory = this.historyService.getNodePropagation(id);

    block.arrived = result.block.arrived;
    block.received = result.block.received;
    block.propagation = result.block.propagation;

    return node.setBlock(block, propagationHistory);
  }

  /**
   * update event — combined block + stats.
   */
  updateNode(
    id: string,
    stats: { block: BlockData } & Partial<NodeStats>,
  ): ReturnType<NodeModel['getBlockStats']> | null {
    const node = this.getById(id);
    if (!node) {
      this.logger.warn(`updateNode: node not found: ${id}`);
      return null;
    }

    if (!stats.block) return null;

    const result = this.historyService.add(stats.block, id, node.trusted);
    if (!result) return null;

    const { block } = result;
    const propagationHistory = this.historyService.getNodePropagation(id);

    stats.block.arrived = block.arrived;
    stats.block.received = block.received;
    stats.block.propagation = block.propagation;

    return node.setBlock(stats.block, propagationHistory);
  }

  /**
   * stats event — update node operational stats.
   */
  updateStats(id: string, stats: Partial<NodeStats>): { id: string; stats: Partial<NodeStats> } | null {
    const node = this.getById(id);
    if (!node) {
      this.logger.warn(`updateStats: node not found: ${id}`);
      return null;
    }
    return node.setBasicStats(stats) as { id: string; stats: Partial<NodeStats> } | null;
  }

  /**
   * pending event.
   */
  updatePending(id: string, pending: number): ReturnType<NodeModel['setPending']> | null {
    const node = this.getById(id);
    if (!node) return null;
    return node.setPending(pending);
  }

  /**
   * latency event.
   */
  updateLatency(id: string, latency: number): ReturnType<NodeModel['setLatency']> | null {
    const node = this.getById(id);
    if (!node) return null;
    return node.setLatency(latency);
  }

  /**
   * history event — feed historical blocks into history service.
   */
  addHistory(id: string, blocks: BlockData[]): void {
    const node = this.getById(id);
    if (!node) {
      this.logger.warn(`addHistory: node not found: ${id}`);
      return;
    }

    // Process oldest→newest
    const sorted = [...blocks].reverse();
    for (const block of sorted) {
      this.historyService.add(block, id, node.trusted, true);
    }

    this.scheduleCharts();
    this.askedForHistory(false);
  }

  /**
   * Disconnection — mark node inactive by sparkId.
   */
  markInactive(sparkId: string): ReturnType<NodeModel['getStats']> | null {
    const node = this.getBySpark(sparkId);
    if (!node) {
      this.logger.warn(`markInactive: spark not found: ${sparkId}`);
      return null;
    }
    node.setState(false);
    this._sparkToNode.delete(sparkId);
    return node.getStats();
  }

  // -----------------------------------------------
  // History request throttling
  // -----------------------------------------------

  requiresUpdate(id: string): boolean {
    const node = this.getById(id);
    if (!node || !node.canUpdate()) return false;

    const diff = node.getBlockNumber() - this.historyService.bestBlockNumber();
    if (diff < 0) return false;

    return (
      this.historyService.requiresUpdate() &&
      (!this._askedForHistory || Date.now() - this._askedForHistoryTime > HISTORY_THROTTLE_MS)
    );
  }

  askedForHistory(set?: boolean): boolean {
    if (set !== undefined) {
      this._askedForHistory = set;
      if (set) this._askedForHistoryTime = Date.now();
    }
    return this._askedForHistory || Date.now() - this._askedForHistoryTime < HISTORY_THROTTLE_MS;
  }

  getHistoryRequestRange() {
    return this.historyService.getHistoryRequestRange();
  }

  // -----------------------------------------------
  // Node collection queries
  // -----------------------------------------------

  all(): ReturnType<NodeModel['getInfo']>[] {
    this.removeOldNodes();
    return Array.from(this._nodes.values()).map(n => n.getInfo());
  }

  private removeOldNodes(): void {
    for (const [id, node] of this._nodes) {
      if (node.isInactiveAndOld()) {
        this._nodes.delete(id);
        this.logger.log(`Removed stale node: ${id}`);
      }
    }
  }

  // -----------------------------------------------
  // Charts scheduling (debounced 1s, maxWait 5s)
  // -----------------------------------------------

  setChartsCallback(cb: (charts: ServerChartsPayload) => void): void {
    this._chartsCallback = cb;
  }

  scheduleCharts(): void {
    // Start max-wait timer on first call in a burst
    if (!this._chartsMaxWaitTimer) {
      this._chartsMaxWaitTimer = setTimeout(() => {
        this._chartsMaxWaitTimer = null;
        if (this._chartsDebounceTimer) {
          clearTimeout(this._chartsDebounceTimer);
          this._chartsDebounceTimer = null;
        }
        this.historyService.getCharts();
      }, CHARTS_MAX_WAIT_MS);
    }

    // Reset trailing debounce
    if (this._chartsDebounceTimer) {
      clearTimeout(this._chartsDebounceTimer);
    }
    this._chartsDebounceTimer = setTimeout(() => {
      this._chartsDebounceTimer = null;
      if (this._chartsMaxWaitTimer) {
        clearTimeout(this._chartsMaxWaitTimer);
        this._chartsMaxWaitTimer = null;
      }
      this.historyService.getCharts();
    }, CHARTS_DEBOUNCE_MS);
  }

  getCharts(): ServerChartsPayload {
    return this.historyService.buildChartsPayload();
  }
}
