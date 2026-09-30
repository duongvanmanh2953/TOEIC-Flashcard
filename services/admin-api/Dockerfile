FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/admin-api ./services/admin-api
RUN npm --workspace=services/admin-api install
RUN npm --workspace=services/admin-api run prisma:generate
RUN npm --workspace=services/admin-api run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl netcat-openbsd wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/admin-api/node_modules ./services/admin-api/node_modules
COPY --from=builder /app/services/admin-api/dist ./dist
COPY --from=builder /app/services/admin-api/prisma ./prisma
COPY --from=builder /app/services/admin-api/package*.json ./
COPY services/admin-api/docker-entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 4200
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4200/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
