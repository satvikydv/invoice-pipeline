FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# Use Caddy to serve the static frontend and handle auto-HTTPS
FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443
