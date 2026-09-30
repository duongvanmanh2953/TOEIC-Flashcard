FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/app-api ./services/app-api
RUN npm --workspace=services/app-api install
RUN npm --workspace=services/app-api run prisma:generate
RUN npm --workspace=services/app-api run build
RUN cd services/app-api && npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --target ES2021 --skipLibCheck || true

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl netcat-openbsd wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/app-api/node_modules ./services/app-api/node_modules
COPY --from=builder /app/services/app-api/dist ./dist
COPY --from=builder /app/services/app-api/prisma ./prisma
COPY --from=builder /app/services/app-api/package*.json ./
COPY --from=builder /app/services/app-api/assets ./assets
COPY services/app-api/docker-entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
