# Dockerfile para Platefull WhatsApp Bot
# Opcional - Use se preferir Docker ao invés de PM2

FROM node:18-slim

# Instala dependências do Puppeteer/Chrome
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Cria diretório da aplicação
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN npm ci --only=production

# Gera cliente Prisma
RUN npx prisma generate

# Copia código fonte
COPY . .

# Cria diretório para logs
RUN mkdir -p logs

# Expõe porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "index.js"]

