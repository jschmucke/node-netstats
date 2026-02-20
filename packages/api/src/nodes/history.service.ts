import { Injectable } from '@nestjs/common';
import type { BlockData, ServerChartsPayload, PropagationBin, MinerEntry } from '@eth-netstats/types';
import { NetworkService } from '../network/network.service';

const MAX_HISTORY = 2000;
const MAX_PEER_PROPAGATION = 40;
const MAX_BINS = 40;
const MAX_UNCLES = 1000;
const MAX_UNCLES_PER_BIN = 25;

interface PropagTime {
  node: string;
  trusted: boolean;
  fork: number;
  received: number;
  propagation: number;
}

interface HistoryItem {
  height: number;
  block: BlockData;
  forks: BlockData[];
  propagTimes: PropagTime[];
}

function compareBlocks(b1: BlockData, b2: BlockData): boolean {
  return (
    b1.hash === b2.hash &&
    b1.parentHash === b2.parentHash &&
    b1.sha3Uncles === b2.sha3Uncles &&
    b1.transactionsRoot === b2.transactionsRoot &&
    b1.stateRoot === b2.stateRoot &&
    b1.miner === b2.miner &&
    b1.difficulty === b2.difficulty &&
    b1.totalDifficulty === b2.totalDifficulty
  );
}

function compareForks(item: HistoryItem, block: BlockData): number {
  if (!item?.forks?.length) return -1;
  for (let x = 0; x < item.forks.length; x++) {
    if (compareBlocks(item.forks[x], block)) return x;
  }
  return -1;
}

@Injectable()
export class HistoryService {
  private _items: HistoryItem[] = [];
  private _callback: ((charts: ServerChartsPayload) => void) | null = null;

  constructor(private readonly networkService: NetworkService) {}

  // -----------------------------------------------
  // Add block (faithful port of history.js#add)
  // -----------------------------------------------
  add(
    block: BlockData,
    nodeId: string,
    trusted: boolean,
    addingHistory = false,
  ): { block: BlockData; changed: boolean } | false {
    if (
      !block ||
      block.number === undefined ||
      !block.uncles ||
      !block.transactions ||
      !block.difficulty ||
      block.number <= 0
    ) {
      return false;
    }

    if (process.env.LITE === 'true') trusted = true;

    const now = Date.now();
    block = {
      ...block,
      trusted,
      arrived: now,
      received: now,
      propagation: 0,
      fork: 0,
    };

    let changed = false;
    const historyBlock = this.search(block.number);

    if (historyBlock) {
      const propIndex = historyBlock.propagTimes.findIndex(p => p.node === nodeId);
      let forkIndex = compareForks(historyBlock, block);

      if (propIndex === -1) {
        // Node hasn't submitted this block before
        if (forkIndex >= 0 && historyBlock.forks[forkIndex]) {
          block.arrived = historyBlock.forks[forkIndex].arrived!;
          block.propagation = now - historyBlock.forks[forkIndex].received!;
        } else {
          const prevBlock = this.prevMaxBlock(block.number);
          if (prevBlock) {
            block.time = Math.max(block.arrived! - prevBlock.block.arrived!, 0);
            if (block.number < this.bestBlockNumber()) {
              block.time = Math.max((block.timestamp - prevBlock.block.timestamp) * 1000, 0);
            }
          } else {
            block.time = 0;
          }
          forkIndex = historyBlock.forks.push(block) - 1;
          historyBlock.forks[forkIndex].fork = forkIndex;
        }

        historyBlock.propagTimes.push({
          node: nodeId,
          trusted,
          fork: forkIndex,
          received: now,
          propagation: block.propagation!,
        });
      } else {
        // Node already submitted this block
        if (forkIndex >= 0 && historyBlock.forks[forkIndex]) {
          block.arrived = historyBlock.forks[forkIndex].arrived!;
          if (forkIndex === historyBlock.propagTimes[propIndex].fork) {
            block.received = historyBlock.propagTimes[propIndex].received;
            block.propagation = historyBlock.propagTimes[propIndex].propagation;
          } else {
            historyBlock.propagTimes[propIndex].fork = forkIndex;
            historyBlock.propagTimes[propIndex].propagation = block.propagation =
              now - historyBlock.forks[forkIndex].received!;
          }
        } else {
          block.received = historyBlock.propagTimes[propIndex].received;
          block.propagation = historyBlock.propagTimes[propIndex].propagation;
          const prevBlock = this.prevMaxBlock(block.number);
          if (prevBlock) {
            block.time = Math.max(block.arrived! - prevBlock.block.arrived!, 0);
            if (block.number < this.bestBlockNumber()) {
              block.time = Math.max((block.timestamp - prevBlock.block.timestamp) * 1000, 0);
            }
          } else {
            block.time = 0;
          }
          forkIndex = historyBlock.forks.push(block) - 1;
          historyBlock.forks[forkIndex].fork = forkIndex;
        }
      }

      if (trusted && !compareBlocks(historyBlock.block, historyBlock.forks[forkIndex])) {
        historyBlock.forks[forkIndex].trusted = trusted;
        historyBlock.block = historyBlock.forks[forkIndex];
      }

      block.fork = forkIndex;
      changed = true;
    } else {
      // New block height
      const prevBlock = this.prevMaxBlock(block.number);
      if (prevBlock) {
        block.time = Math.max(block.arrived! - prevBlock.block.arrived!, 0);
        if (block.number < this.bestBlockNumber()) {
          block.time = Math.max((block.timestamp - prevBlock.block.timestamp) * 1000, 0);
        }
      } else {
        block.time = 0;
      }

      const item: HistoryItem = { height: block.number, block, forks: [block], propagTimes: [] };

      const shouldSave =
        this._items.length === 0 ||
        (this._items.length === MAX_HISTORY && block.number > this.worstBlockNumber()) ||
        (this._items.length < MAX_HISTORY && block.number < this.bestBlockNumber() && addingHistory);

      if (shouldSave) {
        item.propagTimes.push({ node: nodeId, trusted, fork: 0, received: now, propagation: 0 });
        this._save(item);
        changed = true;
      }
    }

    return { block, changed };
  }

  // -----------------------------------------------
  // Internal storage
  // -----------------------------------------------
  private _save(item: HistoryItem): void {
    this._items.unshift(item);
    this._items.sort((a, b) => b.height - a.height);
    if (this._items.length > MAX_HISTORY) this._items.pop();
  }

  search(number: number): HistoryItem | null {
    return this._items.find(i => i.height === number) ?? null;
  }

  prevMaxBlock(number: number): HistoryItem | null {
    return this._items.find(i => i.height < number) ?? null;
  }

  bestBlock(): HistoryItem | null {
    return this._items[0] ?? null;
  }

  bestBlockNumber(): number {
    return this._items[0]?.height ?? 0;
  }

  worstBlockNumber(): number {
    return this._items[this._items.length - 1]?.height ?? 0;
  }

  requiresUpdate(): boolean {
    return this._items.length < MAX_HISTORY;
  }

  getHistoryRequestRange(): { min: number; max: number; list: number[] } | false {
    if (this._items.length < 2) return false;
    const heights = this._items.map(i => i.height);
    const best = Math.max(...heights);
    const range = Array.from({ length: MAX_HISTORY }, (_, i) => Math.max(0, best - MAX_HISTORY) + i + 1);
    const missing = range.filter(n => !heights.includes(n));
    const max = Math.max(...missing);
    const min = max - Math.min(50, MAX_HISTORY - this._items.length + 1) + 1;
    return {
      max,
      min,
      list: missing.slice(-50),
    };
  }

  // -----------------------------------------------
  // Per-node propagation array (40 slots)
  // -----------------------------------------------
  getNodePropagation(nodeId: string): number[] {
    const propagation = new Array(MAX_PEER_PROPAGATION).fill(-1);
    const bestBlock = this.bestBlockNumber();
    let lastBlocktime = Date.now();

    const sorted = [...this._items]
      .sort((a, b) => b.height - a.height)
      .slice(0, MAX_PEER_PROPAGATION);

    for (const item of sorted) {
      const index = MAX_PEER_PROPAGATION - 1 - bestBlock + item.height;
      if (index < 0) continue;

      const propEntry = item.propagTimes.find(p => p.node === nodeId);
      if (propEntry !== undefined) {
        propagation[index] = propEntry.propagation;
        lastBlocktime = item.block.arrived!;
      } else {
        propagation[index] = Math.max(0, lastBlocktime - item.block.arrived!);
      }
    }

    return propagation;
  }

  // -----------------------------------------------
  // Propagation histogram (manual binning — replaces d3.layout.histogram)
  // -----------------------------------------------
  getBlockPropagation(): { histogram: PropagationBin[]; avg: number } {
    const propagations: number[] = [];
    const maxProp = this.networkService.getProfile().maxPropagationMs;
    const binWidth = this.networkService.getBinWidth(MAX_BINS);

    for (const item of this._items) {
      for (const p of item.propagTimes) {
        const val = p.propagation;
        if (val >= 0) propagations.push(Math.min(maxProp, val));
      }
    }

    const avgPropagation =
      propagations.length > 0
        ? Math.round(propagations.reduce((a, b) => a + b, 0) / propagations.length)
        : 0;

    const bins: PropagationBin[] = Array.from({ length: MAX_BINS }, (_, i) => ({
      x: i * binWidth,
      dx: binWidth,
      y: 0,
      frequency: 0,
      cumulative: 0,
      cumpercent: 0,
    }));

    for (const p of propagations) {
      const idx = Math.min(Math.floor(p / binWidth), MAX_BINS - 1);
      bins[idx].frequency++;
    }

    let cumFreq = 0;
    const total = Math.max(1, propagations.length);
    for (const bin of bins) {
      cumFreq += bin.frequency;
      bin.y = bin.frequency / total;
      bin.cumulative = cumFreq;
      bin.cumpercent = cumFreq / total;
    }

    return { histogram: bins, avg: avgPropagation };
  }

  // -----------------------------------------------
  // Chart data methods
  // -----------------------------------------------
  getBlockTimes(): number[] {
    return [...this._items]
      .sort((a, b) => b.height - a.height)
      .slice(0, MAX_BINS)
      .reverse()
      .map(i => i.block.time! / 1000);
  }

  getAvgBlocktime(): number {
    const times = [...this._items]
      .sort((a, b) => b.height - a.height)
      .map(i => i.block.time! / 1000);
    return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getDifficulty(): string[] {
    return [...this._items]
      .sort((a, b) => b.height - a.height)
      .filter(i => i.block.trusted)
      .slice(0, MAX_BINS)
      .reverse()
      .map(i => i.block.difficulty);
  }

  getTransactionsCount(): number[] {
    return [...this._items]
      .sort((a, b) => b.height - a.height)
      .filter(i => i.block.trusted)
      .slice(0, MAX_BINS)
      .reverse()
      .map(i => i.block.transactions?.length ?? 0);
  }

  getGasSpending(): number[] {
    return [...this._items]
      .sort((a, b) => b.height - a.height)
      .filter(i => i.block.trusted)
      .slice(0, MAX_BINS)
      .reverse()
      .map(i => i.block.gasUsed ?? 0);
  }

  getGasLimit(): number[] {
    return [...this._items]
      .sort((a, b) => b.height - a.height)
      .slice(0, MAX_BINS)
      .reverse()
      .map(i => i.block.gasLimit ?? 0);
  }

  getUncleCount(): number[] {
    const uncles = [...this._items]
      .sort((a, b) => b.height - a.height)
      .slice(0, MAX_UNCLES)
      .map(i => i.block.uncles?.length ?? 0);

    const bins = new Array(MAX_BINS).fill(0);
    const chunks: number[][] = [];
    for (let i = 0; i < uncles.length; i += MAX_UNCLES_PER_BIN) {
      chunks.push(uncles.slice(i, i + MAX_UNCLES_PER_BIN));
    }
    chunks.forEach((chunk, idx) => {
      if (idx < MAX_BINS) bins[idx] = chunk.reduce((a, b) => a + b, 0);
    });
    return bins;
  }

  getAvgHashrate(): number {
    if (!this._items.length) return 0;
    const best = this.bestBlock();
    if (!best) return 0;

    const times = [...this._items]
      .sort((a, b) => b.height - a.height)
      .slice(0, 64)
      .map(i => i.block.time ?? 0);

    const avgBlocktime = times.reduce((a, b) => a + b, 0) / times.length / 1000;
    if (avgBlocktime === 0) return 0;
    return Number(BigInt(best.block.difficulty ?? '0')) / avgBlocktime;
  }

  getMinersCount(): MinerEntry[] {
    const miners = [...this._items]
      .sort((a, b) => b.height - a.height)
      .slice(0, MAX_BINS)
      .map(i => i.block.miner ?? '');

    const counts: Record<string, number> = {};
    for (const m of miners) {
      counts[m] = (counts[m] ?? 0) + 1;
    }

    return Object.entries(counts)
      .map(([miner, blocks]) => ({ miner, name: false as false, blocks }))
      .sort((a, b) => b.blocks - a.blocks)
      .slice(0, 2);
  }

  getHeights(): number[] {
    return [...this._items]
      .sort((a, b) => b.height - a.height)
      .slice(0, MAX_BINS)
      .reverse()
      .map(i => i.height);
  }

  // -----------------------------------------------
  // Charts callback (debounced via NodesService)
  // -----------------------------------------------
  setCallback(cb: (charts: ServerChartsPayload) => void): void {
    this._callback = cb;
  }

  getCharts(): void {
    if (!this._callback) return;
    this._callback(this.buildChartsPayload());
  }

  buildChartsPayload(): ServerChartsPayload {
    return {
      height: this.getHeights(),
      blocktime: this.getBlockTimes(),
      avgBlocktime: this.getAvgBlocktime(),
      difficulty: this.getDifficulty(),
      uncles: this.getUncleCount(),
      transactions: this.getTransactionsCount(),
      gasSpending: this.getGasSpending(),
      gasLimit: this.getGasLimit(),
      miners: this.getMinersCount(),
      propagation: this.getBlockPropagation(),
      uncleCount: this.getUncleCount(),
      avgHashrate: this.getAvgHashrate(),
    };
  }
}
