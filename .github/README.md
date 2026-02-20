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

Los directorios `api/` y `webstats/` mantienen sus propios repositorios git como submódulos o directorios independientes para preservar el historial de los forks originales.

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

### 3. Verificar remotes de los forks originales

Los directorios `api/` y `webstats/` mantienen sus propios remotes:

```bash
# Ver remote de api/
cd api
git remote -v
# Debería mostrar: origin https://github.com/cubedro/eth-net-intelligence-api

# Ver remote de webstats/
cd ../webstats
git remote -v
# Debería mostrar: origin https://github.com/cubedro/eth-netstats
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

Los directorios `api/` y `webstats/` tienen sus propios repositorios git. Tienes dos opciones:

### Opción A: Mantener como directorios independientes (recomendado)

Los `.git` de `api/` y `webstats/` se mantienen separados. Esto preserva el historial completo de los forks originales.

**Ventajas:**
- Historial completo preservado
- Fácil sincronización con los forks originales si es necesario
- Separación clara entre código legacy y moderno

**Desventajas:**
- Git en la raíz no rastrea cambios dentro de `api/` y `webstats/`
- Necesitas hacer commits separados si modificas código legacy

### Opción B: Convertir en submódulos de Git

Si prefieres que Git maneje explícitamente estos como submódulos:

```bash
# Eliminar los .git de api/ y webstats/
rm -rf api/.git webstats/.git

# Agregar como submódulos (si quieres mantenerlos como referencias externas)
# Nota: Esto requiere que los repos estén en GitHub primero
git submodule add https://github.com/cubedro/eth-net-intelligence-api api
git submodule add https://github.com/cubedro/eth-netstats webstats
```

**Recomendación:** Mantener como directorios independientes (Opción A) ya que el código legacy no se modifica activamente.

## Licencia

Este proyecto mantiene la licencia GPL-3.0 de los proyectos originales. Ver:
- `api/LICENSE`
- `webstats/LICENSE`
