# ── Build stage ──────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM nginx:alpine AS production

# Copiar build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Template de nginx — envsubst solo reemplaza $PORT, deja $uri intacto
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER=PORT
ENV PORT=80

EXPOSE 80
