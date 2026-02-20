# Configuración de GitHub

Este documento contiene instrucciones para configurar el repositorio en GitHub.

## Estructura del Repositorio

Este monorepo contiene:

- **Código modernizado (activo):**
  - `packages/api/` — Backend NestJS
  - `packages/agent/` — Agente Ethereum modernizado
  - `packages/web/` — Frontend React + Vite
  - `packages/shared/` — Tipos compartidos

- **Código legacy (referencia):**
  - `api/` — Fork de [cubedro/eth-net-intelligence-api](https://github.com/cubedro/eth-net-intelligence-api)
  - `webstats/` — Fork de [cubedro/eth-netstats](https://github.com/cubedro/eth-netstats)

Los directorios `api/` y `webstats/` ahora son parte del monorepo principal. Los repositorios git originales fueron consolidados en este repositorio único.

## Configuración Inicial del Repositorio

### 1. Crear el repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio llamado `node-netstats` (o el nombre que prefieras)
3. **No** inicialices con README, .gitignore o licencia (ya los tenemos)

### 2. Configurar el remote

```bash
# Desde la raíz del proyecto
git remote add origin https://github.com/TU_USUARIO/node-netstats.git

# O si prefieres SSH:
git remote add origin git@github.com:TU_USUARIO/node-netstats.git
```

### 3. Verificar que todo está listo

```bash
# Ver el estado del repositorio
git status

# Deberías ver todos los archivos listos para commit, incluyendo api/ y webstats/
```

### 4. Primer commit y push

```bash
# Volver a la raíz
cd /home/jschmucke/developer/temp/node-netstats

# Agregar todos los archivos (excepto los .git de api/ y webstats/)
git add .

# Hacer el primer commit
git commit -m "Initial commit: Modernized monorepo consolidating eth-net-intelligence-api and eth-netstats

- Modernized backend in packages/api/ (NestJS)
- Modernized agent in packages/agent/ (ethers.js v6)
- Modernized frontend in packages/web/ (React + Vite)
- Legacy code preserved in api/ and webstats/ for reference
- See ORIGINAL_REPOS.md for details about original forks"

# Push al repositorio de GitHub
git branch -M main
git push -u origin main
```

## Manejo de los Repositorios Legacy

Los directorios `api/` y `webstats/` ahora son parte del monorepo principal. Los repositorios git originales fueron consolidados en este repositorio único.

**Repositorios originales de referencia:**
- `api/` → Fork de `https://github.com/cubedro/eth-net-intelligence-api`
- `webstats/` → Fork de `https://github.com/cubedro/eth-netstats`

Estos directorios se mantienen solo como referencia histórica. El código activo está en `packages/`.

## Licencia

Este proyecto mantiene la licencia GPL-3.0 de los proyectos originales. Ver:
- `api/LICENSE`
- `webstats/LICENSE`
