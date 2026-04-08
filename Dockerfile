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

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
