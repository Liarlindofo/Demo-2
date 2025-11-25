#!/bin/bash

# Script de testes para Platefull WhatsApp Bot
# Execute: bash test-bot.sh

set -e

echo "🧪 Testando Platefull WhatsApp Bot"
echo "==================================="
echo ""

# URL base (mude se necessário)
BASE_URL="http://localhost:3001/api"
USER_ID="test-user-123"

echo "📍 URL Base: $BASE_URL"
echo "👤 User ID: $USER_ID"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        if [ -n "$data" ]; then
            response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint")
        fi
    fi
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 201 ]; then
        echo -e "${GREEN}✓ OK ($response)${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL ($response)${NC}"
        return 1
    fi
}

# Verifica se servidor está rodando
echo "🔍 Verificando se servidor está rodando..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Servidor não está rodando!${NC}"
    echo ""
    echo "Inicie o servidor primeiro:"
    echo "  npm start"
    echo "ou"
    echo "  pm2 start ecosystem.config.cjs"
    exit 1
fi
echo -e "${GREEN}✓ Servidor está rodando!${NC}"
echo ""

# Testes
echo "🧪 Executando testes..."
echo ""

# 1. Health Check
test_endpoint "GET" "/health" "" "Health Check"

# 2. Criar/Atualizar Configurações
settings_data='{
  "botName": "Test Bot",
  "storeType": "loja",
  "contextLimit": 10,
  "lineLimit": 8,
  "isActive": true,
  "basePrompt": "Você é um assistente de testes."
}'
test_endpoint "POST" "/settings/$USER_ID" "$settings_data" "Criar configurações"

# 3. Buscar Configurações
test_endpoint "GET" "/settings/$USER_ID" "" "Buscar configurações"

# 4. Status (deve retornar 200 mesmo sem conexões)
test_endpoint "GET" "/status/$USER_ID" "" "Status do usuário"

echo ""
echo "=================================="
echo -e "${GREEN}✅ Testes básicos concluídos!${NC}"
echo ""
echo "⚠️  Testes de conexão WhatsApp não foram executados"
echo "   (requerem interação manual com QR Code)"
echo ""
echo "Para testar manualmente:"
echo ""
echo "1. Iniciar conexão:"
echo "   curl -X POST $BASE_URL/start/$USER_ID/1"
echo ""
echo "2. Buscar QR Code:"
echo "   curl $BASE_URL/qr/$USER_ID/1"
echo ""
echo "3. Após escanear QR, verificar status:"
echo "   curl $BASE_URL/status/$USER_ID"
echo ""
echo "4. Parar conexão:"
echo "   curl -X POST $BASE_URL/stop/$USER_ID/1"
echo ""

