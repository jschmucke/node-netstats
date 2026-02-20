FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/types ./shared/types
COPY packages/web ./packages/web
RUN npm ci --workspace=@eth-netstats/web --workspace=@eth-netstats/types --include-workspace-root
RUN npm run build --workspace=@eth-netstats/web

FROM nginx:alpine AS runner
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
