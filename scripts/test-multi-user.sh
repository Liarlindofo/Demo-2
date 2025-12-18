#!/bin/bash

# Script para testar conexão multi-usuário
# Este script testa se dois usuários podem conectar simultaneamente

API_URL="${API_URL:-http://localhost:3001}"

echo "🧪 TESTE MULTI-USUÁRIO WHATSAPP"
echo "================================"
echo "API: $API_URL"
echo ""

# IDs de teste (você deve substituir por IDs reais do seu banco)
USER1="${USER1:-user_test_1}"
USER2="${USER2:-user_test_2}"

echo "👤 Usuário 1: $USER1"
echo "👤 Usuário 2: $USER2"
echo ""

# Função para iniciar conexão
start_connection() {
  local user_id=$1
  echo "🚀 Iniciando conexão para $user_id..."
  curl -X POST "$API_URL/api/start/$user_id" \
    -H "Content-Type: application/json" \
    -s | jq '.'
  echo ""
}

# Função para verificar status
check_status() {
  local user_id=$1
  echo "📊 Verificando status de $user_id..."
  curl -X GET "$API_URL/api/status/$user_id" \
    -s | jq '.'
  echo ""
}

# Função para verificar QR
check_qr() {
  local user_id=$1
  echo "🔲 Verificando QR de $user_id..."
  curl -X GET "$API_URL/api/qr/$user_id" \
    -s | jq '.qrCode' -r | head -c 50
  echo "..."
  echo ""
}

# Teste 1: Iniciar usuário 1
echo "=== TESTE 1: Iniciar Usuário 1 ==="
start_connection "$USER1"
sleep 2
check_status "$USER1"
echo ""

# Teste 2: Iniciar usuário 2 (simultaneamente)
echo "=== TESTE 2: Iniciar Usuário 2 (simultaneamente) ==="
start_connection "$USER2"
sleep 2
check_status "$USER2"
echo ""

# Teste 3: Verificar ambos estão ativos
echo "=== TESTE 3: Verificar ambos estão ativos ==="
check_status "$USER1"
check_status "$USER2"
echo ""

# Teste 4: Verificar QR codes
echo "=== TESTE 4: Verificar QR codes ==="
check_qr "$USER1"
check_qr "$USER2"
echo ""

# Teste 5: Verificar processos PM2
echo "=== TESTE 5: Verificar processos PM2 ==="
pm2 list | grep whatsapp
echo ""

# Teste 6: Verificar locks
echo "=== TESTE 6: Verificar locks ==="
ls -lah /tmp/whatsapp-locks/
echo ""

# Teste 7: Verificar processos Chrome
echo "=== TESTE 7: Verificar processos Chrome ==="
ps aux | grep -E "chrome|chromium" | grep -v grep | grep whatsapp | wc -l
echo "processos Chrome ativos"
echo ""

echo "✅ Teste concluído!"
echo ""
echo "📝 RESULTADO ESPERADO:"
echo "  - Ambos os usuários devem ter status 'CONNECTING' ou 'QRCODE'"
echo "  - Ambos devem ter QR codes diferentes"
echo "  - Deve haver 2 processos PM2 ativos (whatsapp-user_test_1 e whatsapp-user_test_2)"
echo "  - Deve haver 2 locks em /tmp/whatsapp-locks/"
echo "  - Deve haver pelo menos 2 processos Chrome rodando (um para cada usuário)"
echo ""
echo "🧹 Para limpar os testes:"
echo "  pm2 stop whatsapp-user_test_1 whatsapp-user_test_2"
echo "  pm2 delete whatsapp-user_test_1 whatsapp-user_test_2"
echo "  bash scripts/cleanup-locks.sh"

