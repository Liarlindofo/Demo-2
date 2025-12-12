#!/bin/bash

# Script para limpar todas as sessões do WhatsApp e processos órfãos
# Use este script quando houver problemas de isolamento entre usuários

echo "🧹 Iniciando limpeza de sessões WhatsApp..."

# 1. Parar todos os processos do bot
echo "📌 Parando processos do bot..."
pm2 stop bot-whatsapp 2>/dev/null || true
pm2 delete bot-whatsapp 2>/dev/null || true

# 2. Matar todos os processos Chrome/Chromium relacionados ao WhatsApp
echo "📌 Finalizando processos Chrome/Chromium..."
pkill -9 -f "chrome.*whatsapp" 2>/dev/null || true
pkill -9 -f "chromium.*whatsapp" 2>/dev/null || true
pkill -9 -f "wppconnect" 2>/dev/null || true

# Aguardar processos encerrarem
sleep 3

# 3. Limpar diretório de sessões
SESSIONS_DIR="/var/www/whatsapp-sessions"
if [ -d "$SESSIONS_DIR" ]; then
    echo "📌 Limpando diretório de sessões: $SESSIONS_DIR"
    # Fazer backup antes de deletar (opcional)
    BACKUP_DIR="/var/www/whatsapp-sessions-backup-$(date +%Y%m%d-%H%M%S)"
    if [ "$1" != "--no-backup" ]; then
        echo "📦 Criando backup em: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        cp -r "$SESSIONS_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    fi
    
    # Deletar todas as sessões
    rm -rf "$SESSIONS_DIR"/*
    echo "✅ Diretório de sessões limpo"
else
    echo "⚠️  Diretório de sessões não encontrado: $SESSIONS_DIR"
    mkdir -p "$SESSIONS_DIR"
    chmod 755 "$SESSIONS_DIR"
    echo "✅ Diretório criado: $SESSIONS_DIR"
fi

# 4. Limpar lock files do Puppeteer
echo "📌 Limpando lock files..."
find /tmp -name "puppeteer*" -type f -delete 2>/dev/null || true
find /tmp -name ".puppeteer*" -type d -exec rm -rf {} + 2>/dev/null || true

# 5. Limpar processos órfãos restantes
echo "📌 Verificando processos órfãos restantes..."
ORPHAN_PIDS=$(ps aux | grep -E "chrome|chromium|puppeteer" | grep -v grep | awk '{print $2}')
if [ -n "$ORPHAN_PIDS" ]; then
    echo "⚠️  Encontrados processos órfãos: $ORPHAN_PIDS"
    echo "$ORPHAN_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 6. Limpar cache do Node.js (opcional)
echo "📌 Limpando cache do Node.js..."
npm cache clean --force 2>/dev/null || true

# 7. Verificar se há processos restantes
echo "📌 Verificando processos restantes..."
REMAINING=$(ps aux | grep -E "chrome|chromium|puppeteer|wppconnect" | grep -v grep | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Ainda há $REMAINING processos relacionados ao WhatsApp"
    echo "📋 Listando processos:"
    ps aux | grep -E "chrome|chromium|puppeteer|wppconnect" | grep -v grep
else
    echo "✅ Nenhum processo órfão encontrado"
fi

# 8. Reiniciar o bot (se solicitado)
if [ "$1" == "--restart" ] || [ "$2" == "--restart" ]; then
    echo "🔄 Reiniciando bot..."
    cd /var/www/drin-platform || cd ~/drin-platform || exit 1
    pm2 start ecosystem.config.cjs --name bot-whatsapp || pm2 start index.js --name bot-whatsapp
    pm2 save
    echo "✅ Bot reiniciado"
fi

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Reinicie o bot: pm2 restart bot-whatsapp"
echo "   2. Teste gerar QR code para diferentes usuários"
echo "   3. Verifique os logs: pm2 logs bot-whatsapp"
echo ""

