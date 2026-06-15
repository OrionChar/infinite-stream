# === Этап 1: Сборка Node.js приложения ===
FROM node:24-slim AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем исходный код и конфиги
COPY . .

# Компилируем TypeScript
RUN npx tsc -p tsconfig.json

# Удаляем devDependencies
RUN npm prune --production


# === Этап 2: Подготовка бинарных файлов ===
FROM node:24-slim AS binaries

# Утилиты unzip и xz-utils нужны для распаковки, ca-certificates можно убрать, 
# так как мы больше не используем curl, но оставим для совместимости
RUN apt-get update && \
    apt-get install -y --no-install-recommends unzip xz-utils ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /tmp

# 1. Копируем и распаковываем статический бинарник FFmpeg
COPY docker-cache/ffmpeg.tar.xz /tmp/ffmpeg.tar.xz

RUN tar -xf /tmp/ffmpeg.tar.xz && \
    mv ffmpeg-master-latest-linux64-gpl/bin/ffmpeg /tmp/ffmpeg && \
    rm -rf /tmp/ffmpeg.tar.xz ffmpeg-master-latest-linux64-gpl

# 2. Копируем и распаковываем rhubarb-lip-sync
COPY docker-cache/Rhubarb-Lip-Sync-1.14.0-Linux.zip /tmp/Rhubarb-Lip-Sync-1.14.0-Linux.zip

# ИСПРАВЛЕНИЕ: Распаковываем архив и переименовываем папку в /tmp/rhubarb-lip-sync,
# чтобы Этап 3 мог найти её по ожидаемому пути.
RUN unzip /tmp/Rhubarb-Lip-Sync-1.14.0-Linux.zip -d /tmp/ && \
    mv /tmp/Rhubarb-Lip-Sync-1.14.0-Linux /tmp/rhubarb-lip-sync && \
    rm -f /tmp/Rhubarb-Lip-Sync-1.14.0-Linux.zip


# === Этап 3: Финальный production-образ ===
FROM node:24-slim

WORKDIR /app

# Устанавливаем libstdc++ (необходим для работы rhubarb) и удаляем кэш apt
RUN apt-get update && \
    apt-get install -y --no-install-recommends libstdc++6 && \
    rm -rf /var/lib/apt/lists/*

# Создаем требуемые директории
RUN mkdir -p /app/bin/rhubarb-lip-sync /app/storage/articles /app/storage/audio /app/storage/scripts

# Копируем СКОМПИЛИРОВАННЫЕ бинарные файлы из этапа 2 (без утилит скачивания)
COPY --from=binaries /tmp/ffmpeg /app/bin/ffmpeg
COPY --from=binaries /tmp/rhubarb-lip-sync /app/bin/rhubarb-lip-sync/

# Делаем бинарные файлы исполняемыми
RUN chmod +x /app/bin/ffmpeg /app/bin/rhubarb-lip-sync/rhubarb

# Добавляем пути к бинарникам в PATH, чтобы Node.js мог их находить
ENV PATH="/app/bin/rhubarb-lip-sync:/app/bin:${PATH}"

# Копируем скомпилированный код и production-зависимости из этапа 1
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Указываем том для хранения данных
VOLUME ["/app/storage"]

# Запускаем приложение
CMD ["npm", "start"]