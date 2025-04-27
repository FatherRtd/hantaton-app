# Базовый образ с Node.js (LTS версия)
FROM node:18-alpine AS builder

# Установка зависимостей для сборки (закомментировано, т.к. в alpine обычно не требуется)
# RUN apk add --no-cache python3 make g++

# Создание рабочей директории
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем все файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Удаляем devDependencies после сборки
RUN npm prune --production

# Финальный образ
FROM node:18-alpine

WORKDIR /app

# Копируем только необходимые файлы из builder-стадии
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/static ./static

# Устанавливаем только необходимые пакеты для работы
RUN apk add --no-cache curl

# Открываем порт, который использует приложение
EXPOSE 3001

# Команда запуска приложения
CMD ["npm", "run", "start:prod"]