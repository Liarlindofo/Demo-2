#!/bin/bash

# Script para limpar TODAS as sessões Chrome e processos antes de atualizar o código

echo "========================================="
echo "🧹 LIMPEZA COMPLETA DE SESSÕES CHROME"
echo "========================================="

# 1. Parar TODOS os processos PM2
echo ""
echo "1️⃣ Parando todos os processos PM2..."
pm2 delete all 2>/dev/null || echo "Nenhum processo PM2 ativo"

# 2. Aguardar processos PM2 encerrarem
echo ""
echo "⏳ Aguardando 5 segundos..."
sleep 5

# 3. Matar TODOS os processos Chrome/Chromium
echo ""
echo "2️⃣ Matando TODOS os processos Chrome/Chromium..."
ps aux | grep -iE "chrome|chromium" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
echo "✅ Processos Chrome mortos"

# 4. Aguardar processos Chrome encerrarem
echo ""
echo "⏳ Aguardando 5 segundos..."
sleep 5

# 5. Deletar TODAS as pastas de sessão
echo ""
echo "3️⃣ Deletando TODAS as pastas de sessão WhatsApp..."
rm -rf /var/www/whatsapp-sessions/*
echo "✅ Pastas deletadas"

# 6. Limpar pastas temporárias do Chrome
echo ""
echo "4️⃣ Limpando pastas temporárias do Chrome..."
rm -rf /tmp/.org.chromium.* 2>/dev/null
rm -rf /tmp/puppeteer_* 2>/dev/null
rm -rf /tmp/*chromium* 2>/dev/null
rm -rf /tmp/*chrome* 2>/dev/null
echo "✅ Pastas temporárias limpas"

# 7. Verificação final
echo ""
echo "========================================="
echo "✅ LIMPEZA CONCLUÍDA!"
echo "========================================="
echo ""
echo "Verificando processos Chrome restantes:"
chrome_count=$(ps aux | grep -iE "chrome|chromium" | grep -v grep | wc -l)
echo "Processos Chrome rodando: $chrome_count"

if [ $chrome_count -gt 0 ]; then
  echo ""
  echo "⚠️ Ainda há processos Chrome rodando:"
  ps aux | grep -iE "chrome|chromium" | grep -v grep
else
  echo "✅ Nenhum processo Chrome rodando"
fi

echo ""
echo "Verificando pastas de sessão:"
session_count=$(ls -1 /var/www/whatsapp-sessions/ 2>/dev/null | wc -l)
echo "Pastas em /var/www/whatsapp-sessions/: $session_count"

if [ $session_count -gt 0 ]; then
  echo ""
  echo "⚠️ Ainda há pastas de sessão:"
  ls -la /var/www/whatsapp-sessions/
else
  echo "✅ Diretório de sessões vazio"
fi

echo ""
echo "========================================="
echo "Próximos passos:"
echo "========================================="
echo "1. cd /var/www/Demo-2"
echo "2. git pull"
echo "3. pm2 start ecosystem.config.cjs --env production"
echo "4. pm2 list"
echo "========================================="

