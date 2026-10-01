FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/admin/package*.json ./apps/admin/
RUN npm install --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin

ARG VITE_API_BASE_URL
ARG VITE_ASSETS_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ASSETS_BASE_URL=$VITE_ASSETS_BASE_URL

RUN npm --workspace=apps/admin run build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
