import type { NodeInfo, NodeStats, BlockData, GeoInfo } from '@eth-netstats/types';

const MAX_HISTORY = 40;
const MAX_INACTIVE_TIME = 1000 * 60 * 60 * 4; // 4 hours

interface UptimeTracker {
  started: number | null;
  up: number;
  down: number;
  lastStatus: boolean | null;
  lastUpdate: number | null;
}

const defaultBlock = (): BlockData => ({
  number: 0,
  hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  parentHash: '',
  sha3Uncles: '',
  transactionsRoot: '',
  stateRoot: '',
  miner: '',
  difficulty: '0',
  totalDifficulty: '0',
  gasLimit: 0,
  gasUsed: 0,
  timestamp: 0,
  transactions: [],
  uncles: [],
  arrived: 0,
  received: 0,
  propagation: 0,
  time: 0,
});

export class NodeModel {
  id: string;
  trusted: boolean;
  info: NodeInfo;
  geo: GeoInfo | null;
  stats: NodeStats;
  history: number[];
  spark: string | null;

  private uptime: UptimeTracker;

  constructor(data: { id: string; info?: Partial<NodeInfo>; ip?: string; spark?: string; latency?: number }) {
    this.id = data.id ?? '';
    this.trusted = false;
    this.info = {} as NodeInfo;
    this.geo = null;
    this.spark = data.spark ?? null;
    this.history = new Array(MAX_HISTORY).fill(-1);
    this.uptime = { started: null, up: 0, down: 0, lastStatus: null, lastUpdate: null };

    this.stats = {
      active: false,
      mining: false,
      hashrate: 0,
      peers: 0,
      pending: 0,
      gasPrice: '0',
      block: defaultBlock(),
      syncing: false,
      uptime: 100,
      propagationAvg: 0,
      latency: data.latency ?? 0,
    };

    // State is set in init()
    this.setState(true);
  }

  // -----------------------------------------------
  // Init / info
  // -----------------------------------------------

  setInfo(
    data: { id?: string; info?: Partial<NodeInfo>; ip?: string; spark?: string; latency?: number; trusted?: boolean },
    geoLookup: (ip: string) => GeoInfo | null,
    trustedIps: string[],
  ): void {
    if (data.id) this.id = data.id;
    if (data.info) this.info = { ...this.info, ...data.info } as NodeInfo;
    if (data.spark) this.spark = data.spark;
    if (data.latency !== undefined) this.stats.latency = data.latency;

    if (data.ip) {
      this.info.ip = data.ip;
      if (trustedIps.includes(data.ip) || process.env.LITE === 'true') {
        this.trusted = true;
      }
      this.geo = geoLookup(data.ip);
    }

    this.setState(true);
  }

  // -----------------------------------------------
  // Block update
  // -----------------------------------------------

  setBlock(
    block: BlockData,
    propagationHistory: number[],
  ): { id: string; block: BlockData; propagationAvg: number; history: number[] } | null {
    if (!block || block.number === undefined) return null;

    const changed =
      !this.arraysEqual(propagationHistory, this.history) ||
      block.number !== this.stats.block.number ||
      block.hash !== this.stats.block.hash;

    if (!changed) return null;

    if (block.number !== this.stats.block.number || block.hash !== this.stats.block.hash) {
      this.stats.block = block;
    }

    this.setHistory(propagationHistory);

    return this.getBlockStats();
  }

  // -----------------------------------------------
  // Stats update
  // -----------------------------------------------

  setBasicStats(stats: Partial<NodeStats>): { id: string; stats: Partial<NodeStats> } | null {
    const prev = this.stats;
    const changed =
      stats.active !== prev.active ||
      stats.mining !== prev.mining ||
      stats.hashrate !== prev.hashrate ||
      stats.peers !== prev.peers ||
      stats.gasPrice !== prev.gasPrice ||
      stats.uptime !== prev.uptime;

    if (!changed) return null;

    if (stats.active !== undefined) this.stats.active = stats.active;
    if (stats.mining !== undefined) this.stats.mining = stats.mining;
    if (stats.syncing !== undefined) this.stats.syncing = stats.syncing;
    if (stats.hashrate !== undefined) this.stats.hashrate = stats.hashrate;
    if (stats.peers !== undefined) this.stats.peers = stats.peers;
    if (stats.gasPrice !== undefined) this.stats.gasPrice = stats.gasPrice;
    if (stats.uptime !== undefined) this.stats.uptime = stats.uptime;

    return this.getBasicStats();
  }

  setPending(pending: number): { id: string; pending: number } | null {
    if (pending === this.stats.pending) return null;
    this.stats.pending = pending;
    return { id: this.id, pending };
  }

  setLatency(latency: number): { id: string; latency: number } | null {
    if (latency === this.stats.latency) return null;
    this.stats.latency = latency;
    return { id: this.id, latency };
  }

  // -----------------------------------------------
  // History / propagation
  // -----------------------------------------------

  private setHistory(history: number[]): void {
    if (this.arraysEqual(history, this.history)) return;

    if (!Array.isArray(history)) {
      this.history = new Array(MAX_HISTORY).fill(-1);
      this.stats.propagationAvg = 0;
      return;
    }

    this.history = history;
    const positives = history.filter(p => p >= 0);
    this.stats.propagationAvg =
      positives.length > 0 ? Math.round(positives.reduce((a, b) => a + b, 0) / positives.length) : 0;
  }

  // -----------------------------------------------
  // Uptime
  // -----------------------------------------------

  setState(active: boolean): void {
    const now = Date.now();

    if (this.uptime.started !== null && this.uptime.lastUpdate !== null) {
      const delta = now - this.uptime.lastUpdate;
      if (this.uptime.lastStatus === active) {
        this.uptime[active ? 'up' : 'down'] += delta;
      } else {
        this.uptime[active ? 'down' : 'up'] += delta;
      }
    } else {
      this.uptime.started = now;
    }

    this.stats.active = active;
    this.uptime.lastStatus = active;
    this.uptime.lastUpdate = now;
    this.stats.uptime = this.calculateUptime();
  }

  private calculateUptime(): number {
    if (!this.uptime.lastUpdate || !this.uptime.started) return 100;
    if (this.uptime.lastUpdate === this.uptime.started) return 100;
    return Math.round((this.uptime.up / (this.uptime.lastUpdate - this.uptime.started)) * 100);
  }

  // -----------------------------------------------
  // Eligibility checks
  // -----------------------------------------------

  canUpdate(): boolean {
    if (this.trusted) return true;
    return this.info.canUpdateHistory || (this.stats.syncing === false && this.stats.peers > 0) || false;
  }

  getBlockNumber(): number {
    return this.stats.block.number;
  }

  isInactiveAndOld(): boolean {
    return (
      this.uptime.lastStatus === false &&
      this.uptime.lastUpdate !== null &&
      Date.now() - this.uptime.lastUpdate > MAX_INACTIVE_TIME
    );
  }

  // -----------------------------------------------
  // Serialization helpers
  // -----------------------------------------------

  getInfo() {
    return {
      id: this.id,
      info: this.info,
      stats: this.getPublicStats(),
      history: this.history,
      geo: this.geo,
    };
  }

  getStats() {
    return { id: this.id, stats: this.getPublicStats(), history: this.history };
  }

  getBlockStats() {
    return {
      id: this.id,
      block: this.stats.block,
      propagationAvg: this.stats.propagationAvg,
      history: this.history,
    };
  }

  getBasicStats() {
    return {
      id: this.id,
      stats: {
        active: this.stats.active,
        mining: this.stats.mining,
        syncing: this.stats.syncing,
        hashrate: this.stats.hashrate,
        peers: this.stats.peers,
        gasPrice: this.stats.gasPrice,
        uptime: this.stats.uptime,
        latency: this.stats.latency,
      },
    };
  }

  private getPublicStats(): NodeStats {
    return {
      active: this.stats.active,
      mining: this.stats.mining,
      syncing: this.stats.syncing,
      hashrate: this.stats.hashrate,
      peers: this.stats.peers,
      gasPrice: this.stats.gasPrice,
      block: this.stats.block,
      propagationAvg: this.stats.propagationAvg,
      uptime: this.stats.uptime,
      latency: this.stats.latency,
      pending: this.stats.pending,
    };
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
}
