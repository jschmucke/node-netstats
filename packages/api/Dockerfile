FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/types ./shared/types
COPY packages/api ./packages/api
RUN npm ci --workspace=@eth-netstats/api --workspace=@eth-netstats/types --include-workspace-root
RUN npm run build --workspace=@eth-netstats/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/types ./shared/types
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/package.json ./packages/api/package.json

EXPOSE 3000
CMD ["node", "packages/api/dist/main.js"]
