#!/bin/bash

# Script para resetar TUDO relacionado ao WhatsApp
# ⚠️ USE COM CUIDADO - Isso vai parar todos os workers e limpar todas as sessões

echo "⚠️  RESETAR TUDO - WHATSAPP"
echo "============================"
echo ""
echo "Este script vai:"
echo "  1. Parar todos os workers PM2 do WhatsApp"
echo "  2. Limpar todos os locks"
echo "  3. Limpar todas as sessões do banco"
echo "  4. Matar todos os processos Chrome do WhatsApp"
echo ""
read -p "Tem certeza? (digite 'sim' para continuar): " confirmacao

if [ "$confirmacao" != "sim" ]; then
  echo "❌ Cancelado"
  exit 0
fi

echo ""
echo "🛑 Parando todos os workers PM2..."
pm2 list | grep whatsapp | awk '{print $2}' | xargs -r pm2 delete
sleep 2

echo ""
echo "🧹 Limpando locks..."
rm -rf /tmp/whatsapp-locks/*.lock
echo "✅ Locks removidos"

echo ""
echo "💀 Matando processos Chrome do WhatsApp..."
ps aux | grep -iE "chrome|chromium" | grep whatsapp | grep -v grep | awk '{print $2}' | xargs -r kill -9
sleep 2
echo "✅ Processos Chrome finalizados"

echo ""
echo "🗑️  Limpando sessões do disco..."
rm -rf /var/www/whatsapp-sessions/whatsapp_*
echo "✅ Sessões removidas"

echo ""
echo "🗄️  Limpando sessões do banco de dados..."
echo "Para limpar o banco, execute:"
echo "  psql -d <seu_database> -c \"UPDATE whatsapp_bots SET is_connected = false, qr_code = NULL, connected_number = NULL;\""
echo ""

echo "✅ Reset concluído!"
echo ""
echo "🚀 Para iniciar novamente:"
echo "  pm2 start ecosystem.config.cjs"

