import * as os from 'os';
import { ethers } from 'ethers';
import { io, Socket } from 'socket.io-client';
import { config } from './config';
import type { BlockData } from '@eth-netstats/types';

const UPDATE_INTERVAL_MS = 5_000;
const PING_INTERVAL_MS = 3_000;
const MAX_BLOCKS_HISTORY = 40;
const MAX_HISTORY_UPDATE = 50;
const MAX_CONNECTION_ATTEMPTS = 50;
const PENDING_DEBOUNCE_MS = 5;

// Adaptive debounce constants (mirroring the original)
const CHAIN_MIN_TIME_INITIAL = 50;
const CHAIN_MIN_TIME_MAX = 200;
const MAX_CHAIN_DEBOUNCER_INITIAL = 20;
const MAX_CHAIN_DEBOUNCER_MIN = 5;
const CHAIN_DEBOUNCER_ADAPT_THRESHOLD = 100;
const STALE_BLOCK_FORCE_MS = 5_000;

export class Agent {
  private readonly info = {
    name: config.instanceName,
    contact: config.contact,
    coinbase: null as string | null,
    node: null as string | null,
    net: null as string | null,
    protocol: null as number | null,
    api: null as string | null,
    port: config.listeningPort,
    os: os.platform(),
    os_v: os.release(),
    client: '2.0.0',
    canUpdateHistory: true,
  };

  private stats = {
    active: false,
    mining: false,
    hashrate: 0,
    peers: 0,
    pending: 0,
    gasPrice: '0',
    block: this.emptyBlock(),
    syncing: false as boolean | object,
    uptime: 0,
  };

  private _lastBlock = 0;
  private _lastStats = '';
  private _lastPending = 0;
  private _lastBlockSentAt = 0;
  private _lastChainLog = 0;
  private _lastPendingLog = 0;
  private _tries = 0;
  private _down = 0;

  // Adaptive debouncer state
  private _chainDebouncer = 0;
  private _chanMinTime = CHAIN_MIN_TIME_INITIAL;
  private _maxChainDebouncer = MAX_CHAIN_DEBOUNCER_INITIAL;
  private _chainDebouncerCnt = 0;

  // Serial block queue
  private _blockQueue: number[] = [];
  private _processingBlock = false;

  // Pending debounce timer
  private _pendingTimer: ReturnType<typeof setTimeout> | null = null;

  // Reconnect state
  private _connectionAttempts = 0;
  private _rpcConnected = false;
  private _socketConnected = false;
  private _rpcReconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private provider: ethers.JsonRpcProvider | ethers.WebSocketProvider | null = null;
  private socket: Socket | null = null;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this._lastStats = JSON.stringify(this.stats);
  }

  start(): void {
    console.log('[Agent] Starting eth-netstats agent v2.0.0');
    this.connectRpc();
  }

  stop(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this._rpcReconnectTimer) clearTimeout(this._rpcReconnectTimer);
    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider = null;
    }
    console.log('[Agent] Stopped');
  }

  // -----------------------------------------------
  // RPC connection
  // -----------------------------------------------

  private createProvider(): ethers.JsonRpcProvider | ethers.WebSocketProvider {
    const url = config.rpcUrl;
    if (url.startsWith('wss://') || url.startsWith('ws://')) {
      return new ethers.WebSocketProvider(url);
    }
    return new ethers.JsonRpcProvider(url);
  }

  private connectRpc(): void {
    console.log(`[RPC] Connecting to ${config.rpcUrl}`);
    
    try {
      this.provider = this.createProvider();
    } catch (err) {
      this.handleRpcError(err as Error);
      return;
    }

    this.provider.getNetwork().then(network => {
      this.info.net = String(network.chainId);
      this.info.protocol = Number(network.chainId);
      this._rpcConnected = true;
      this._connectionAttempts = 0;
      console.log(`[RPC] Connected to chain ${network.chainId}`);
      this.init();
    }).catch(err => {
      this.handleRpcError(err as Error);
    });
  }

  private handleRpcError(err: Error): void {
    this._connectionAttempts++;
    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider = null;
    }
    
    if (this._connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const delay = Math.min(1000 * this._connectionAttempts, 30_000);
      const errorMsg = err.message || String(err);
      console.error(`[RPC] Connection attempt ${this._connectionAttempts} failed: ${errorMsg}. Retrying in ${delay}ms`);
      this._rpcReconnectTimer = setTimeout(() => this.connectRpc(), delay);
    } else {
      console.error('[RPC] Max connection attempts reached. Aborting.', err);
      process.exit(1);
    }
  }

  handleUncaughtError(err: Error): void {
    // Check if this is an RPC connection error (502, connection refused, etc.)
    const errorMsg = err.message || String(err);
    if (errorMsg.includes('502') || 
        errorMsg.includes('Unexpected server response') ||
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('ENOTFOUND') ||
        errorMsg.includes('ETIMEDOUT')) {
      console.error('[Agent] Uncaught RPC connection error, attempting to reconnect:', errorMsg);
      this.handleRpcError(err);
    } else {
      // For other errors, stop the agent
      console.error('[Agent] Uncaught exception:', err);
      this.stop();
      process.exit(1);
    }
  }

  private reconnectRpc(): void {
    this._rpcConnected = false;
    this._connectionAttempts = 0;
    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.connectRpc();
  }

  private async init(): Promise<void> {
    await this.getNodeInfo();
    this.connectSocket();
    this.setupBlockSubscription();
    this.updateInterval = setInterval(() => this.getStats(false), UPDATE_INTERVAL_MS);
  }

  // -----------------------------------------------
  // Node info (coinbase, client version)
  // -----------------------------------------------

  private async getNodeInfo(): Promise<void> {
    if (!this.provider) return;
    try {
      const [clientVersion, coinbase] = await Promise.allSettled([
        this.provider.send('web3_clientVersion', []),
        this.provider.send('eth_coinbase', []),
      ]);

      this.info.node = clientVersion.status === 'fulfilled' ? clientVersion.value as string : null;
      this.info.coinbase = coinbase.status === 'fulfilled' ? coinbase.value as string : null;
      this.info.api = 'ethers/6';
    } catch {
      // non-fatal
    }
  }

  // -----------------------------------------------
  // Socket connection
  // -----------------------------------------------

  private connectSocket(): void {
    console.log(`[WS] Connecting to ${config.wsServer}`);

    this.socket = io(`${config.wsServer}/api`, {
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      timeout: 120_000,
    });

    this.socket.on('connect', () => {
      this._socketConnected = false; // becomes true after 'ready'
      console.log('[WS] Connected, sending hello');
      this.socket!.emit('hello', {
        id: config.id,
        info: this.info,
        secret: config.wsSecret,
      });
    });

    this.socket.on('ready', () => {
      this._socketConnected = true;
      console.log('[WS] Ready');
      this.getLatestBlock();
      this.getPending();
      this.getStats(true);
      if (!this.pingInterval) {
        this.pingInterval = setInterval(() => this.ping(), PING_INTERVAL_MS);
      }
    });

    this.socket.on('history', (range: { list?: number[]; min?: number; max?: number }) => {
      console.log('[WS] History requested', range);
      this.getHistory(range);
    });

    this.socket.on('node-pong', (data: { clientTime?: number }) => {
      const latency = Math.ceil((Date.now() - (data.clientTime ?? 0)) / 2);
      this.socket!.emit('latency', { id: config.id, latency });
    });

    this.socket.on('disconnect', () => {
      this._socketConnected = false;
      console.warn('[WS] Disconnected');
    });

    this.socket.on('connect_error', err => {
      console.error('[WS] Connect error:', err.message);
    });
  }

  private emit(event: string, payload: unknown): void {
    if (this._socketConnected && this.socket) {
      this.socket.emit(event, payload);
    }
  }

  // -----------------------------------------------
  // Block subscription with adaptive debounce
  // -----------------------------------------------

  private setupBlockSubscription(): void {
    if (!this.provider) return;

    this.provider.on('block', (blockNumber: number) => {
      const now = Date.now();
      const timeSinceLast = now - this._lastChainLog;
      this._lastChainLog = now;

      // Adaptive debouncer logic (faithful port)
      if (timeSinceLast < this._chanMinTime) {
        this._chainDebouncer++;
        this._chainDebouncerCnt++;

        if (this._chainDebouncerCnt > CHAIN_DEBOUNCER_ADAPT_THRESHOLD) {
          this._chanMinTime = Math.min(this._chanMinTime + 1, CHAIN_MIN_TIME_MAX);
          this._maxChainDebouncer = Math.max(this._maxChainDebouncer - 1, MAX_CHAIN_DEBOUNCER_MIN);
        }
      } else {
        if (timeSinceLast > STALE_BLOCK_FORCE_MS) {
          this._chanMinTime = CHAIN_MIN_TIME_INITIAL;
          this._maxChainDebouncer = MAX_CHAIN_DEBOUNCER_INITIAL;
          this._chainDebouncerCnt = 0;
        }
        this._chainDebouncer = 0;
      }

      const forceByStale = now - this._lastBlockSentAt > STALE_BLOCK_FORCE_MS;

      if (this._chainDebouncer < this._maxChainDebouncer || forceByStale) {
        if (forceByStale) this._lastBlockSentAt = now;
        this.enqueueBlock(blockNumber);
      } else {
        // Debounce: only enqueue after idle
        this.debouncedEnqueue(blockNumber);
      }
    });
  }

  private _debouncedEnqueueTimer: ReturnType<typeof setTimeout> | null = null;
  private debouncedEnqueue(blockNumber: number): void {
    if (this._debouncedEnqueueTimer) clearTimeout(this._debouncedEnqueueTimer);
    this._debouncedEnqueueTimer = setTimeout(() => {
      this._debouncedEnqueueTimer = null;
      this.enqueueBlock(blockNumber);
    }, 120);
  }

  private enqueueBlock(blockNumber: number): void {
    this._blockQueue.push(blockNumber);
    if (!this._processingBlock) this.processBlockQueue();
  }

  private async processBlockQueue(): Promise<void> {
    if (this._processingBlock || this._blockQueue.length === 0) return;
    this._processingBlock = true;

    while (this._blockQueue.length > 0) {
      const blockNumber = this._blockQueue.shift()!;
      await this.fetchAndSendBlock(blockNumber);
      // After block is done, fetch pending
      this.debouncePending();
    }

    this._processingBlock = false;
  }

  // -----------------------------------------------
  // Latest block fetch
  // -----------------------------------------------

  private async getLatestBlock(): Promise<void> {
    if (!this.provider) return;
    try {
      const block = await this.provider.getBlock('latest');
      if (block) await this.processBlock(block);
    } catch (err) {
      console.error('[RPC] getLatestBlock error:', err);
    }
  }

  private async fetchAndSendBlock(blockNumber: number): Promise<void> {
    if (!this.provider) return;
    try {
      const block = await this.provider.getBlock(blockNumber);
      if (block) await this.processBlock(block);
    } catch (err) {
      console.error(`[RPC] getBlock(${blockNumber}) error:`, err);
    }
  }

  private async processBlock(block: ethers.Block): Promise<void> {
    const formatted = this.formatBlock(block);
    if (!formatted) return;

    if (
      this.stats.block.number === formatted.number &&
      this.stats.block.hash === formatted.hash
    ) {
      return; // same block
    }

    this.stats.block = formatted;
    this.sendBlockUpdate();

    // If we skipped blocks, fetch the gap
    if (formatted.number - this._lastBlock > 1) {
      const from = Math.max(this._lastBlock + 1, formatted.number - MAX_BLOCKS_HISTORY);
      const range = Array.from(
        { length: formatted.number - from },
        (_, i) => from + i,
      );
      if (range.length > 0 && this._blockQueue.length === 0) {
        await this.getHistory({ list: range });
      }
    }

    if (formatted.number > this._lastBlock) {
      this._lastBlock = formatted.number;
    }
  }

  private formatBlock(block: ethers.Block): BlockData | null {
    if (!block || block.number === null || block.number < 0) return null;

    return {
      number: block.number,
      hash: block.hash ?? '',
      parentHash: block.parentHash,
      sha3Uncles: (block as any).sha3Uncles ?? '',
      transactionsRoot: (block as any).transactionsRoot ?? '',
      stateRoot: (block as any).stateRoot ?? '',
      miner: block.miner ?? '',
      difficulty: block.difficulty?.toString() ?? '0',
      // totalDifficulty removed post-Merge → default '0'
      totalDifficulty: (block as any).totalDifficulty?.toString() ?? '0',
      gasLimit: Number(block.gasLimit),
      gasUsed: Number(block.gasUsed),
      timestamp: block.timestamp,
      transactions: block.transactions as string[],
      uncles: (block as any).uncles ?? [],
    };
  }

  // -----------------------------------------------
  // Stats
  // -----------------------------------------------

  private async getStats(forced: boolean): Promise<void> {
    if (!this.provider) return;
    const now = Date.now();

    this._lastStats = JSON.stringify(this.stats);

    try {
      const [peerCountHex, mining, hashrateHex, syncing, feeData] = await Promise.all([
        this.provider.send('net_peerCount', []),
        this.provider.send('eth_mining', []),
        this.provider.send('eth_hashrate', []),
        this.provider.send('eth_syncing', []),
        this.provider.getFeeData().catch(() => null),
      ]);

      this._tries++;
      this.stats.active = true;
      this.stats.peers = parseInt(peerCountHex, 16);
      this.stats.mining = Boolean(mining);
      this.stats.hashrate = parseInt(hashrateHex, 16);
      this.stats.gasPrice = feeData?.gasPrice?.toString() ?? '0';

      if (syncing && syncing !== false) {
        const progress =
          (parseInt(syncing.currentBlock, 16) - parseInt(syncing.startingBlock, 16)) /
          Math.max(
            1,
            parseInt(syncing.highestBlock, 16) - parseInt(syncing.startingBlock, 16),
          );
        this.stats.syncing = {
          startingBlock: parseInt(syncing.startingBlock, 16),
          currentBlock: parseInt(syncing.currentBlock, 16),
          highestBlock: parseInt(syncing.highestBlock, 16),
          progress,
        };
      } else {
        this.stats.syncing = false;
      }

      this.setUptime();
      this.sendStatsUpdate(forced);
    } catch (err) {
      console.error('[RPC] getStats error:', err);
      this._down++;
      this.setInactive();
    }
  }

  // -----------------------------------------------
  // Pending tx count
  // -----------------------------------------------

  private async getPending(): Promise<void> {
    if (!this.provider) return;
    try {
      const hex = await this.provider.send(
        'eth_getBlockTransactionCountByNumber',
        ['pending'],
      );
      const pending = parseInt(hex, 16);
      this.stats.pending = pending;
      if (pending !== this._lastPending) {
        this.sendPendingUpdate();
      }
      this._lastPending = pending;
    } catch {
      // non-fatal, pending data is optional
    }
  }

  private debouncePending(): void {
    if (this._pendingTimer) clearTimeout(this._pendingTimer);
    this._pendingTimer = setTimeout(() => {
      this._pendingTimer = null;
      this.getPending();
    }, PENDING_DEBOUNCE_MS);
  }

  // -----------------------------------------------
  // History fetch
  // -----------------------------------------------

  private async getHistory(range: { list?: number[]; min?: number; max?: number }): Promise<void> {
    if (!this.provider) return;

    let blockNumbers: number[];

    if (range.list && range.list.length > 0) {
      blockNumbers = range.list;
    } else if (range.min !== undefined && range.max !== undefined) {
      blockNumbers = Array.from(
        { length: range.max - range.min + 1 },
        (_, i) => range.min! + i,
      );
    } else {
      blockNumbers = Array.from(
        { length: MAX_HISTORY_UPDATE },
        (_, i) => this.stats.block.number - 1 - i,
      ).filter(n => n > 0);
    }

    const blocks: BlockData[] = [];
    for (const num of blockNumbers.slice(0, MAX_HISTORY_UPDATE)) {
      try {
        const block = await this.provider.getBlock(num);
        if (block) {
          const formatted = this.formatBlock(block);
          if (formatted) blocks.push(formatted);
        }
      } catch {
        // skip missing blocks
      }
    }

    this.emit('history', {
      id: config.id,
      history: blocks.reverse(),
    });
  }

  // -----------------------------------------------
  // Uptime / inactive
  // -----------------------------------------------

  private setUptime(): void {
    this.stats.uptime = this._tries > 0
      ? Math.round(((this._tries - this._down) / this._tries) * 100)
      : 100;
  }

  private setInactive(): void {
    this.stats.active = false;
    this.stats.peers = 0;
    this.stats.mining = false;
    this.stats.hashrate = 0;
    this.setUptime();
    this.sendStatsUpdate(true);
    this.reconnectRpc();
  }

  // -----------------------------------------------
  // Emit helpers
  // -----------------------------------------------

  private sendBlockUpdate(): void {
    this._lastBlockSentAt = Date.now();
    this.emit('block', { id: config.id, block: this.stats.block });
  }

  private sendPendingUpdate(): void {
    this.emit('pending', { id: config.id, stats: { pending: this.stats.pending } });
  }

  private sendStatsUpdate(force: boolean): void {
    const current = JSON.stringify(this.stats);
    if (force || current !== this._lastStats) {
      this.emit('stats', {
        id: config.id,
        stats: {
          active: this.stats.active,
          syncing: this.stats.syncing,
          mining: this.stats.mining,
          hashrate: this.stats.hashrate,
          peers: this.stats.peers,
          gasPrice: this.stats.gasPrice,
          uptime: this.stats.uptime,
        },
      });
      this._lastStats = current;
    }
  }

  private ping(): void {
    if (this._socketConnected && this.socket) {
      this.socket.emit('node-ping', { id: config.id, clientTime: Date.now() });
    }
  }

  // -----------------------------------------------
  // Helpers
  // -----------------------------------------------

  private emptyBlock(): BlockData {
    return {
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
    };
  }
}
