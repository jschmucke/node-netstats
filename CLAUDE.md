# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository is being modernized from a legacy dual-package setup into a TypeScript monorepo. It contains:

### Legacy code (reference only — do not modify)

- **`api/`** (formerly `eth-net-intelligence-api`) — Legacy agent that runs alongside an Ethereum node, fetches stats via JSON-RPC (web3 v0.15.3), and streams them via Primus WebSocket.
- **`webstats/`** (formerly `eth-netstats`) — Legacy dashboard server: Express + Primus + AngularJS frontend compiled with Grunt.

### New monorepo (active development)

- **`packages/api/`** — New NestJS backend (replaces `webstats/app.js` + Primus)
- **`packages/agent/`** — New modernized agent with ethers.js v6 + socket.io-client (replaces `api/`)
- **`packages/web/`** — New React + Vite + TypeScript frontend (replaces `webstats/src/`)
- **`shared/types/`** — Shared TypeScript types (`@webstats/types`)

See `docs/plan-modernizacion.md` for the full modernization plan.

---

## Commands

### New monorepo (packages/)

```bash
# Install all workspaces from root
npm install

# Run dev servers
npm run dev:api      # NestJS backend (port 3000)
npm run dev:agent    # Ethereum agent
npm run dev:web      # React frontend (Vite)

# Build all
npm run build
```

### Legacy: webstats/ (dashboard server)

```bash
cd webstats
npm install
sudo npm install -g grunt-cli

# Build frontend assets (required before running)
grunt          # full version → dist/
grunt lite     # lite version → dist-lite/

# Run the server (default port 3000)
npm start
```

### Legacy: api/ (node agent)

```bash
cd api
npm install

# Configure via app.json (copy from app.json.example)
cp app.json.example app.json
# Edit app.json with your RPC host, WS_SERVER URL, WS_SECRET, INSTANCE_NAME

# Run directly
node app.js

# Run with pm2 (recommended for production)
pm2 start app.json
```

---

## Architecture

### Current (legacy) data flow

```
Ethereum Node (geth/eth)
    ↓ JSON-RPC (web3, port 8545)
api/ (Node agent — Primus WS client)
    ↓ WebSocket /api (Primus, WS_SECRET auth)
webstats/ server (app.js)
    ├── /api     ← agents connect here
    ├── /primus  ← browser clients connect here
    └── /external ← external API consumers
    ↓ WebSocket /primus
Browser (AngularJS dashboard)
```

### Target (new) data flow

```
EVM Node (any network)
    ↓ JSON-RPC (ethers.js, RPC_URL)
packages/agent/ (socket.io-client)
    ↓ Socket.IO /api (WS_SECRET auth)
packages/api/ (NestJS + Socket.IO)
    ├── /api      ← agents connect here
    ├── /primus   ← browser clients connect here (same path for compat)
    └── /external ← external API consumers
    ↓ Socket.IO /primus
packages/web/ (React + Zustand)
```

---

## Key source files for reference

| New file | Ported from |
|---|---|
| `packages/api/src/nodes/history.service.ts` | `webstats/lib/history.js` |
| `packages/api/src/nodes/node.model.ts` | `webstats/lib/node.js` |
| `packages/api/src/nodes/nodes.service.ts` | `webstats/lib/collection.js` |
| `packages/api/src/gateways/agent.gateway.ts` | `webstats/app.js` (api.on block) |
| `packages/agent/src/agent.ts` | `api/lib/node.js` |
| `packages/web/src/lib/formatters.ts` | `webstats/src/js/filters.js` |
| `packages/web/src/stores/nodesStore.ts` | `webstats/src/js/controllers.js` |

---

### WebSocket Protocol (agent → server events)

| Event | Payload | Description |
|-------|---------|-------------|
| `hello` | `{id, info, secret}` | Auth handshake |
| `block` | `{id, block}` | New block |
| `update` | `{id, stats}` | Full stats update |
| `pending` | `{id, stats}` | Pending tx count |
| `stats` | `{id, stats}` | Node stats (peers, mining, etc.) |
| `history` | `{id, history}` | Historical blocks |
| `node-ping` | `{id, clientTime}` | Latency ping |
| `latency` | `{id, latency}` | Measured latency |

---

### Key Environment Variables

**packages/agent:**
- `RPC_URL` — Full RPC URL (e.g. `https://polygon-rpc.com`), takes priority over HOST+PORT
- `RPC_HOST` / `RPC_PORT` — Fallback RPC endpoint (default: `localhost:8545`)
- `WS_SERVER` — Dashboard WebSocket URL (required)
- `WS_SECRET` — Shared secret for authentication (required)
- `INSTANCE_NAME` — Display name for this node (required in production)
- `EXPECTED_CHAIN_ID` — Warns if connected node is on a different chain
- `LISTENING_PORT` — Ethereum P2P port (display only, default: 30303)
- `VERBOSITY` — Log level 0–3

**packages/api:**
- `WS_SECRET` — Secret(s) accepted from agents (pipe-separated for multiple); required in production
- `PORT` — HTTP server port (default: 3000)
- `NODE_ENV` — `production` enables strict security checks
- `ALLOWED_ORIGINS` — CORS allowed origins (CSV)
- `TRUSTED_IPS` — Trusted node IPs (CSV), replaces hardcoded list
- `BANNED_IPS` — Banned IPs (CSV)
- `NETWORK_CHAIN_ID` — ChainId to configure network profile (1=ETH, 137=Polygon, etc.)
- `NETWORK_*` — Custom network profile for private/unknown chains
