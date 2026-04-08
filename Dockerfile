# ── Build stage ──────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# VITE_API_URL se inyecta en build time — Vite lo reemplaza en el bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Cache buster — Railway cambia esto para forzar rebuild
ARG CACHEBUST=1
RUN echo "VITE_API_URL=$VITE_API_URL" && npm run build

# ── Production stage ─────────────────────────────────────────
FROM nginx:alpine AS production

# Copiar build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Template de nginx — envsubst solo reemplaza $PORT, deja $uri intacto
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Railway inyecta PORT en runtime; NGINX_ENVSUBST_FILTER limita envsubst a solo $PORT
ENV NGINX_ENVSUBST_FILTER=PORT
