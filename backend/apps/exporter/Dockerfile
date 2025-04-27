# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Этап выполнения
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Установка docker, iptables и bash
RUN apk add docker iptables bash conntrack-tools

COPY --from=builder /app/dist ./dist

CMD ["npm", "start"]