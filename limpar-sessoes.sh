#!/bin/bash

# Script para limpar sessões travadas do WhatsApp
# Execute com: bash limpar-sessoes.sh

echo "🧹 Limpando sessões WhatsApp travadas..."
echo ""

# 1. Matar TODOS os processos Chrome
echo "💀 Finalizando processos Chrome..."
pkill -9 -f chrome || echo "Nenhum processo Chrome encontrado"
pkill -9 -f chromium || echo "Nenhum processo Chromium encontrado"
sleep 2

# 2. Limpar lock files
echo "🗑️ Removendo lock files..."
find /var/www/whatsapp-sessions -name "SingletonLock" -delete 2>/dev/null || true
find /var/www/whatsapp-sessions -name "SingletonSocket" -delete 2>/dev/null || true
find /var/www/whatsapp-sessions -name "SingletonCookie" -delete 2>/dev/null || true
find /var/www/whatsapp-sessions -name ".lock" -delete 2>/dev/null || true

# 3. Mostrar sessões ativas
echo ""
echo "📁 Sessões existentes:"
ls -la /var/www/whatsapp-sessions/ | grep slot || echo "Nenhuma sessão encontrada"

echo ""
echo "✅ Limpeza concluída!"
echo "Agora você pode tentar gerar o QR Code novamente."

