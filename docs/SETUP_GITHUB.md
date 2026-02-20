# Guía de Configuración para GitHub

Este documento te guía paso a paso para configurar este monorepo en GitHub.

## ✅ Lo que ya está hecho

1. ✅ Repositorio git inicializado en la raíz
2. ✅ README actualizado con disclaimer sobre los forks originales
3. ✅ `.gitignore` configurado para el monorepo
4. ✅ Documentación de repositorios originales creada (`ORIGINAL_REPOS.md`)
5. ✅ Estructura preparada para GitHub

## 📋 Pasos para configurar GitHub

### Paso 1: Crear el repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `node-netstats` (o el que prefieras)
3. Descripción: "Modernized Ethereum Network Stats monorepo - Dashboard for monitoring Ethereum and EVM-compatible nodes"
4. Visibilidad: Elige **Public** o **Private**
5. **NO marques** ninguna de estas opciones:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
   
   (Ya tenemos todos estos archivos)

6. Click en **"Create repository"**

### Paso 2: Configurar el remote local

Ejecuta estos comandos desde la raíz del proyecto:

```bash
cd /home/jschmucke/developer/temp/node-netstats

# Reemplaza TU_USUARIO con tu usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/node-netstats.git

# O si prefieres usar SSH (recomendado):
git remote add origin git@github.com:TU_USUARIO/node-netstats.git

# Verificar que se agregó correctamente
git remote -v
```

### Paso 3: Preparar el primer commit

```bash
# Ver el estado actual
git status

# Agregar todos los archivos (los .git de api/ y webstats/ se ignoran automáticamente)
git add .

# Ver qué se va a commitear
git status
```

### Paso 4: Hacer el primer commit

```bash
git commit -m "Initial commit: Modernized monorepo consolidating eth-net-intelligence-api and eth-netstats

- Modernized backend in packages/api/ (NestJS)
- Modernized agent in packages/agent/ (ethers.js v6)
- Modernized frontend in packages/web/ (React + Vite)
- Legacy code preserved in api/ and webstats/ for reference
- See ORIGINAL_REPOS.md for details about original forks"
```

### Paso 5: Push al repositorio

```bash
# Renombrar la rama principal a 'main' (si no está ya)
git branch -M main

# Hacer push al repositorio de GitHub
git push -u origin main
```

## 📝 Notas importantes

### Sobre los repositorios legacy (`api/` y `webstats/`)

Los directorios `api/` y `webstats/` ahora son parte del monorepo principal. Los repositorios git originales fueron consolidados en este repositorio único.

**Repositorios originales de referencia:**
- `api/` → Fork de `https://github.com/cubedro/eth-net-intelligence-api`
- `webstats/` → Fork de `https://github.com/cubedro/eth-netstats`

Estos directorios se mantienen solo como referencia histórica. El código activo está en `packages/`.

**Nota:** Si necesitas consultar el historial completo de los forks originales, puedes hacerlo directamente en los repositorios de GitHub mencionados arriba.

## 🔗 Enlaces útiles

- Repositorio original de eth-net-intelligence-api: https://github.com/ethereum/eth-net-intelligence-api
- Repositorio original de eth-netstats: https://github.com/ethereum/eth-netstats
- Fork de eth-net-intelligence-api usado: https://github.com/cubedro/eth-net-intelligence-api
- Fork de eth-netstats usado: https://github.com/cubedro/eth-netstats

## 📄 Licencia

Este proyecto mantiene la licencia GPL-3.0 de los proyectos originales. Ver:
- `api/LICENSE`
- `webstats/LICENSE`
