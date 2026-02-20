# node-netstats

Dashboard en tiempo real para monitorear nodos de Ethereum y redes EVM compatibles (Polygon, BSC, Arbitrum, etc.).

## Disclaimer — Repositorios Originales

Este monorepo es una modernización y consolidación de dos proyectos legacy que fueron forkeados de los repositorios originales de Ethereum Network Stats:

- **`api/`** — Fork de [`cubedro/eth-net-intelligence-api`](https://github.com/cubedro/eth-net-intelligence-api)
  - Repositorio original: [`ethereum/eth-net-intelligence-api`](https://github.com/ethereum/eth-net-intelligence-api)
  - Código legacy mantenido solo como referencia. El código activo está en `packages/agent/`

- **`webstats/`** — Fork de [`cubedro/eth-netstats`](https://github.com/cubedro/eth-netstats)
  - Repositorio original: [`ethereum/eth-netstats`](https://github.com/ethereum/eth-netstats)
  - Código legacy mantenido solo como referencia. El código activo está en `packages/api/` y `packages/web/`

Este proyecto moderniza ambos componentes en un monorepo TypeScript con:
- NestJS backend (`packages/api/`)
- Agente modernizado con ethers.js v6 (`packages/agent/`)
- Dashboard React + Vite (`packages/web/`)

Los directorios `api/` y `webstats/` se mantienen únicamente para referencia histórica y no deben modificarse.

## Arquitectura

```
Tu nodo Ethereum/Polygon
    │  JSON-RPC (wss:// o http://)
    ▼
packages/agent      ← lee datos del nodo, los envía al servidor
    │  WebSocket /api
    ▼
packages/api        ← servidor NestJS, agrega datos de múltiples agentes
    │  HTTP + WebSocket /primus
    ▼
packages/web        ← dashboard React, se actualiza en tiempo real
```

---

## Requisitos

- **Node.js 20+** — verificar con `node --version`
- **pnpm 9+** — instalar con `npm install -g pnpm`

---

## Instalación (una sola vez)

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd node-netstats

# 2. Instalar todas las dependencias del monorepo
pnpm install

# 3. Compilar los tres paquetes
pnpm build
```

---

## Configuración

Todas las variables de entorno se definen en un solo archivo `.env` en la raíz del proyecto.

```bash
# Copiar el ejemplo y editarlo
cp .env.example .env
```

El `.env` mínimo para conectar tu nodo Polygon:

```env
WS_SECRET=cambia-esto-por-algo-seguro

RPC_URL=wss://rpc-read.cyberllia.io
INSTANCE_NAME=mi-nodo-polygon
NETWORK_CHAIN_ID=137
```

> Cambiá `WS_SECRET` por cualquier texto secreto. El agente y la API deben usar el mismo valor.

---

## Ejecución — Sin Docker

Necesitás **3 terminales** en la carpeta `node-netstats`.

### Terminal 1 — API (servidor backend)

```bash
pnpm start:api
```

Verás:
```
[Bootstrap] eth-netstats API running on port 3000 [development]
```

### Terminal 2 — Agente (conectado a tu nodo)

```bash
pnpm start:agent
```

Verás:
```
[RPC] Connecting to wss://rpc-read.cyberllia.io
[RPC] Connected to chain 137
[WS] Connected, sending hello
[WS] Ready
```

### Terminal 3 — Dashboard web

```bash
pnpm dev:web
```

Abrí el browser en **http://localhost:5173**

---

## Ejecución — Con Docker Compose

```bash
# 1. Configurar el .env (ver sección anterior)
cp .env.example .env
# editar .env

# 2. Levantar todo
docker compose up -d

# 3. Ver logs
docker compose logs -f

# 4. Detener
docker compose down
```

- Dashboard: **http://localhost:8080**
- API: **http://localhost:3000**

---

## Variables de entorno — referencia completa

Todas van en el `.env` raíz del proyecto.

### Compartidas

| Variable | Descripción | Default |
|----------|-------------|---------|
| `WS_SECRET` | Secreto entre agente y API. Separar con `\|` para aceptar múltiples | **requerido** |
| `NETWORK_CHAIN_ID` | Chain ID de la red (Polygon=137, Ethereum=1, BSC=56, Arbitrum=42161) | `1` |

### API

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto HTTP | `3000` |
| `NODE_ENV` | `development` o `production` | `development` |
| `ALLOWED_ORIGINS` | Orígenes CORS, separados por coma. `*` en dev | `*` |
| `TRUSTED_IPS` | IPs de agentes que pueden enviar historial | `127.0.0.1` |
| `BANNED_IPS` | IPs bloqueadas | vacío |

### Agente

| Variable | Descripción | Default |
|----------|-------------|---------|
| `RPC_URL` | URL completa del RPC del nodo (`wss://`, `ws://`, `https://`, `http://`) | — |
| `RPC_HOST` | Host del RPC (solo si no usás `RPC_URL`) | `localhost` |
| `RPC_PORT` | Puerto del RPC (solo si no usás `RPC_URL`) | `8545` |
| `WS_SERVER` | URL del servidor API | `http://localhost:3000` |
| `INSTANCE_NAME` | Nombre del nodo en el dashboard | hostname del sistema |
| `CONTACT_DETAILS` | Info de contacto del operador | vacío |
| `VERBOSITY` | Nivel de logs: 0=silencioso, 3=debug | `2` |

### Web (solo para producción/Docker)

Creá `packages/web/.env` con:

```env
VITE_API_URL=http://localhost:3000
```

En desarrollo no hace falta — el proxy de Vite redirige automáticamente `/api` y `/socket.io` a `localhost:3000`.

---

## Conectar múltiples nodos

Cada nodo necesita su propio proceso agente con un `INSTANCE_NAME` distinto. Podés usar `INSTANCE_NAME` como variable de entorno al correr:

```bash
# Nodo 1
INSTANCE_NAME=polygon-nodo-1 RPC_URL=wss://nodo1.ejemplo.com pnpm start:agent

# Nodo 2 (otra terminal)
INSTANCE_NAME=polygon-nodo-2 RPC_URL=wss://nodo2.ejemplo.com pnpm start:agent
```

Las variables inline sobreescriben las del `.env`.

---

## Redes EVM soportadas

| Red | NETWORK_CHAIN_ID |
|-----|-----------------|
| Ethereum | `1` |
| Polygon | `137` |
| BSC | `56` |
| Arbitrum One | `42161` |
| Optimism | `10` |
| Mumbai (testnet) | `80001` |
| Red privada/custom | cualquier número |

Para una red custom también podés configurar:
```env
NETWORK_NAME=Mi Red
NETWORK_NATIVE_SYMBOL=ETH
NETWORK_EXPECTED_BLOCK_TIME=2000
NETWORK_CONSENSUS=poa
```

---

## Solución de problemas

**El agente no conecta al nodo RPC**
```bash
# Verificar que el RPC responde
curl http://rpc-read.cyberllia.io \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**El agente conecta al RPC pero no al servidor API**
- Verificar que `WS_SECRET` sea idéntico en `.env` para API y agente
- Verificar que `WS_SERVER` apunte a donde corre la API

**El dashboard muestra el nodo como inactivo**
- Es normal cuando el agente se desconecta. Al reconectar vuelve a activo automáticamente.

**Puerto 3000 ya está en uso**
- Cambiá `PORT=3001` en el `.env` y también `WS_SERVER=http://localhost:3001`
