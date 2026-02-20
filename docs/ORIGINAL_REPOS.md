# Repositorios Originales

Este documento contiene información sobre los repositorios originales de los cuales este monorepo fue derivado.

## Repositorios Forkeados

### 1. eth-net-intelligence-api

**Ubicación en este repo:** `api/`

**Fork original:**
- URL: https://github.com/cubedro/eth-net-intelligence-api
- Mantenedor: cubedro

**Repositorio upstream original:**
- URL: https://github.com/ethereum/eth-net-intelligence-api
- Mantenedor: Ethereum Foundation

**Estado:** Código legacy mantenido solo como referencia. El código activo modernizado está en `packages/agent/`.

**Última sincronización:** Este fork fue utilizado como base para la modernización, pero el código legacy no se actualiza activamente.

---

### 2. eth-netstats

**Ubicación en este repo:** `webstats/`

**Fork original:**
- URL: https://github.com/cubedro/eth-netstats
- Mantenedor: cubedro

**Repositorio upstream original:**
- URL: https://github.com/ethereum/eth-netstats
- Mantenedor: Ethereum Foundation

**Estado:** Código legacy mantenido solo como referencia. El código activo modernizado está en `packages/api/` (backend) y `packages/web/` (frontend).

**Última sincronización:** Este fork fue utilizado como base para la modernización, pero el código legacy no se actualiza activamente.

---

## Licencias

Ambos repositorios originales están bajo la licencia GPL-3.0. Ver:
- `api/LICENSE` — Licencia del fork de eth-net-intelligence-api
- `webstats/LICENSE` — Licencia del fork de eth-netstats

Este monorepo mantiene la misma licencia GPL-3.0 en respeto a los proyectos originales.

---

## Notas sobre la Modernización

Este monorepo consolida y moderniza ambos proyectos en:

- **`packages/api/`** — Backend NestJS que reemplaza `webstats/app.js` + Primus
- **`packages/agent/`** — Agente modernizado con ethers.js v6 que reemplaza `api/`
- **`packages/web/`** — Frontend React + Vite que reemplaza `webstats/src/`

Los directorios `api/` y `webstats/` se mantienen únicamente para:
- Referencia histórica
- Comparación durante el desarrollo
- Documentación de la migración

**No deben modificarse** — todo el desarrollo activo ocurre en `packages/`.
