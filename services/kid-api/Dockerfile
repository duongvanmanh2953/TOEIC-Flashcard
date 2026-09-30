FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/kid-api ./services/kid-api
RUN npm --workspace=services/kid-api install
RUN npm --workspace=services/kid-api run prisma:generate
RUN npm --workspace=services/kid-api run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl netcat-openbsd wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/kid-api/node_modules ./services/kid-api/node_modules
COPY --from=builder /app/services/kid-api/dist ./dist
COPY --from=builder /app/services/kid-api/prisma ./prisma
COPY --from=builder /app/services/kid-api/package*.json ./
COPY services/kid-api/docker-entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 4100
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4100/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
