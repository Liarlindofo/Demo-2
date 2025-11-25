#!/bin/bash

# Script de setup para Platefull WhatsApp Bot
# Execute: bash setup.sh

set -e

echo "🤖 Platefull WhatsApp Bot - Setup"
echo "=================================="
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js encontrado: $NODE_VERSION"

# Verifica npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado."
    exit 1
fi

echo "✅ npm encontrado"
echo ""

# Instala dependências
echo "📦 Instalando dependências..."
npm install
echo "✅ Dependências instaladas"
echo ""

# Verifica .env
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📝 Copiando .env.example para .env..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env criado. CONFIGURE AS VARIÁVEIS antes de continuar!"
        echo ""
        echo "Edite o arquivo .env com suas credenciais:"
        echo "  - DATABASE_URL"
        echo "  - OPENROUTER_API_KEY"
        echo "  - JWT_SECRET"
        echo ""
        read -p "Pressione ENTER quando terminar de configurar o .env..."
    else
        echo "❌ .env.example não encontrado!"
        exit 1
    fi
else
    echo "✅ .env encontrado"
fi

echo ""

# Gera cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate
echo "✅ Cliente Prisma gerado"
echo ""

# Pergunta se quer rodar migrations
read -p "🗄️  Deseja executar migrations do banco? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗄️  Executando migrations..."
    npx prisma migrate deploy
    echo "✅ Migrations executadas"
else
    echo "⚠️  Migrations não executadas. Execute manualmente: npm run db:deploy"
fi

echo ""
echo "✅ Setup concluído!"
echo ""
echo "🚀 Para iniciar o bot:"
echo "   npm start       (produção)"
echo "   npm run dev     (desenvolvimento)"
echo ""
echo "📝 Para usar PM2:"
echo "   pm2 start ecosystem.config.cjs"
echo ""
echo "📚 Leia o README.md para mais informações"
echo ""

