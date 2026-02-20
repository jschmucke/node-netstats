/** Pure formatting utilities — port of webstats/src/js/filters.js */

// -----------------------------------------------
// Hash display
// -----------------------------------------------

export function formatHash(hash: string | undefined): string {
  if (!hash) return '?';
  const h = hash.startsWith('0x') ? hash.slice(2) : hash;
  return h.slice(0, 8) + '...' + h.slice(-8);
}

// -----------------------------------------------
// Gas
// -----------------------------------------------

export function formatGasPrice(price: string | number | undefined): string {
  if (price === undefined || price === null) return '0 wei';
  const p = price.toString();
  if (p.length < 4) return `${p} wei`;
  if (p.length < 7) return `${(Number(p) / 1_000).toFixed(2)} kwei`;
  if (p.length < 10) return `${(Number(p) / 1_000_000).toFixed(2)} mwei`;
  if (p.length < 13) return `${(Number(p) / 1_000_000_000).toFixed(2)} gwei`;
  if (p.length < 16) return `${(Number(p) / 1_000_000_000_000).toFixed(2)} szabo`;
  if (p.length < 19) return `${p.slice(0, p.length - 15)} finney`;
  return `${p.slice(0, p.length - 18)} ether`;
}

export function formatGas(gas: number | undefined): string {
  return gas !== undefined ? String(Math.round(gas)) : '?';
}

// -----------------------------------------------
// Hashrate / difficulty
// -----------------------------------------------

const UNITS = ['', 'K', 'M', 'G', 'T', 'P'];

function scaleValue(value: number): { result: number; unit: string } {
  for (let i = UNITS.length - 1; i >= 0; i--) {
    const threshold = Math.pow(1000, i);
    if (value >= threshold) {
      return { result: value / threshold, unit: UNITS[i] };
    }
  }
  return { result: value, unit: '' };
}

export function formatHashrate(hashes: number, isMining: boolean): string {
  if (!isMining) return '—';
  const { result, unit } = scaleValue(hashes);
  return `${result.toFixed(1)} ${unit}H/s`;
}

export function formatTotalDifficulty(hashes: string | number): string {
  const n = typeof hashes === 'string' ? Number(BigInt(hashes)) : hashes;
  const { result, unit } = scaleValue(n);
  return `${result.toFixed(2)} ${unit}H`;
}

// -----------------------------------------------
// Propagation time
// -----------------------------------------------

export function formatPropagation(ms: number, prefix = '+'): string {
  if (ms === 0) return '0 ms';
  if (ms < 1_000) return `${prefix}${ms} ms`;
  if (ms < 60_000) return `${prefix}${(ms / 1000).toFixed(1)} s`;
  if (ms < 3_600_000) return `${prefix}${Math.round(ms / 60_000)} min`;
  if (ms < 86_400_000) return `${prefix}${Math.round(ms / 3_600_000)} h`;
  return `${prefix}${Math.round(ms / 86_400_000)} days`;
}

// -----------------------------------------------
// Block time (seconds since block arrived)
// -----------------------------------------------

export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return '∞';
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `${diff} s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return `${Math.round(diff / 86400)} days ago`;
}

export function formatAvgBlocktime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)} s`;
  return `${Math.round(seconds / 60)} min`;
}

// -----------------------------------------------
// Uptime
// -----------------------------------------------

export function formatUptime(uptime: number): string {
  return `${Math.round(uptime)}%`;
}

// -----------------------------------------------
// Node version string
// -----------------------------------------------

export function formatNodeVersion(version: string | undefined | null): string {
  if (!version) return '';
  const parts = version.split('/');
  parts[0] = parts[0]
    .replace('Ethereum(++)', 'Eth')
    .replace(/^pyethapp/, 'pyeth');

  if (parts[1] && parts[1][0] !== 'v' && parts[1][2] !== '.') {
    parts.splice(1, 1);
  }
  if (parts[2] === 'Release') parts.splice(2, 1);
  if (parts[2]?.startsWith('Linux')) parts[2] = 'linux';
  if (parts[2]?.startsWith('Darwin')) parts[2] = 'darwin';

  return parts.join('/');
}

// -----------------------------------------------
// Miner display
// -----------------------------------------------

export function formatMinerAddress(address: string, name?: string | false): string {
  if (name && name.length > 0) return name;
  return address.replace('0x', '');
}

// -----------------------------------------------
// Color classes (Tailwind)
// -----------------------------------------------

export function propagationColor(ms: number): string {
  if (ms < 0) return '#7f7f7f';   // gray — no data
  if (ms === 0) return '#10a0de'; // blue — first
  if (ms < 1_000) return '#7bcc3a'; // green
  if (ms < 3_000) return '#FFD162'; // yellow
  if (ms < 7_000) return '#ff8a00'; // orange
  return '#F74B4B';               // red
}

export function propagationClass(ms: number, active: boolean, blockNum: number, bestBlock: number): string {
  if (!active) return 'text-gray-500';
  if (blockNum < bestBlock) return 'text-gray-500';
  if (ms === 0) return 'text-blue-400';
  if (ms < 1_000) return 'text-green-400';
  if (ms < 3_000) return 'text-yellow-400';
  if (ms < 7_000) return 'text-orange-400';
  return 'text-red-400';
}

export function blockNumberClass(blockNum: number, bestBlock: number, active: boolean): string {
  if (!active) return 'text-gray-500';
  const diff = bestBlock - blockNum;
  if (diff < 1) return 'text-green-400';
  if (diff === 1) return 'text-yellow-400';
  if (diff < 4) return 'text-orange-400';
  return 'text-red-400';
}

export function peerClass(peers: number, active: boolean): string {
  if (!active) return 'text-gray-500';
  if (peers <= 1) return 'text-red-400';
  if (peers < 4) return 'text-yellow-400';
  return 'text-green-400';
}

export function miningClass(mining: boolean, active: boolean): string {
  if (!active) return 'text-gray-500';
  return mining ? 'text-green-400' : 'text-red-400';
}

export function uptimeClass(uptime: number, active: boolean): string {
  if (!active) return 'text-gray-500';
  if (uptime >= 90) return 'text-green-400';
  if (uptime >= 75) return 'text-yellow-400';
  return 'text-red-400';
}

export function latencyClass(latency: number, active: boolean): string {
  if (!active) return 'text-red-400';
  if (latency <= 100) return 'text-green-400';
  if (latency <= 1000) return 'text-yellow-400';
  return 'text-red-400';
}

export function timeAgoClass(timestamp: number, active: boolean): string {
  if (!active) return 'text-gray-500';
  const diff = (Date.now() - timestamp) / 1000;
  if (diff <= 13) return 'text-green-400';
  if (diff <= 20) return 'text-yellow-400';
  if (diff <= 30) return 'text-orange-400';
  return 'text-red-400';
}

export function nodesActiveClass(active: number, total: number): string {
  if (total === 0) return 'text-gray-500';
  const ratio = active / total;
  if (ratio >= 0.9) return 'text-green-400';
  if (ratio >= 0.75) return 'text-blue-400';
  if (ratio >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

export function minerBlocksClass(blocks: number): string {
  if (blocks <= 6) return 'bg-green-600';
  if (blocks <= 12) return 'bg-blue-600';
  if (blocks <= 18) return 'bg-yellow-500';
  return 'bg-red-600';
}

// -----------------------------------------------
// Version comparison (replaces eval-based version)
// -----------------------------------------------

export function compareVersions(v1: string, op: '<' | '>' | '==' | '<=', v2: string): boolean {
  const parse = (v: string) => v.split('.').map(p => parseInt(p, 10) || 0);
  const a = parse(v1);
  const b = parse(v2);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x < y) return op === '<' || op === '<=';
    if (x > y) return op === '>';
  }
  return op === '==' || op === '<=';
}
