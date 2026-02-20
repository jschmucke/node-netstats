FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/types ./shared/types
COPY packages/agent ./packages/agent
RUN npm ci --workspace=@eth-netstats/agent --workspace=@eth-netstats/types --include-workspace-root
RUN npm run build --workspace=@eth-netstats/agent

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/types ./shared/types
COPY --from=builder /app/packages/agent/dist ./packages/agent/dist
COPY --from=builder /app/packages/agent/package.json ./packages/agent/package.json

CMD ["node", "packages/agent/dist/index.js"]
