#!/bin/bash

echo "🚀 Aplicando correção DRÁSTICA para resolver browser travado..."
echo ""

# 1. Parar backend
echo "🛑 Parando backend..."
pm2 stop platefull-bot 2>/dev/null || true

# 2. Matar TODOS os processos Chrome
echo "💀 Matando TODOS os processos Chrome..."
pkill -9 -f chrome 2>/dev/null || true
pkill -9 -f chromium 2>/dev/null || true
sleep 3

# 3. DELETAR TODAS as sessões (reset completo)
echo "🗑️ DELETANDO todas as sessões (reset completo)..."
rm -rf /var/www/whatsapp-sessions/* 2>/dev/null || true

# 4. Recriar pasta
echo "📁 Recriando pasta de sessões..."
mkdir -p /var/www/whatsapp-sessions
chmod 755 /var/www/whatsapp-sessions

# 5. Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# 6. Reiniciar backend
echo "🔄 Reiniciando backend..."
pm2 restart platefull-bot

# 7. Ver logs
echo ""
echo "✅ Correção aplicada!"
echo ""
echo "📊 Logs em tempo real (Ctrl+C para sair):"
pm2 logs platefull-bot --lines 30

