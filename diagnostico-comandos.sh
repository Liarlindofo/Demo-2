#!/bin/bash

# Script de diagnóstico para comandos #boa noite e #voltar

echo "========================================="
echo "DIAGNÓSTICO: Comandos #boa noite/#voltar"
echo "========================================="
echo ""

echo "1. Verificando se o código foi atualizado:"
echo "-------------------------------------------"
grep -n "normalizePhone" /var/www/drin-platform/src/wpp/index.js | head -3
echo ""
grep -n "#boa noite" /var/www/drin-platform/src/wpp/index.js | head -2
echo ""

echo "2. Verificando workers ativos:"
echo "-------------------------------------------"
pm2 list | grep whatsapp
echo ""

echo "3. Últimos 100 logs (filtrando por comandos):"
echo "-------------------------------------------"
pm2 logs --nostream --lines 100 | grep -iE "boa noite|voltar|MENSAGEM|fromMe|pauseChat|MODO MANUAL|isChatPaused"
echo ""

echo "4. Verificando se há erros recentes:"
echo "-------------------------------------------"
pm2 logs --nostream --err --lines 50
echo ""

echo "========================================="
echo "AÇÕES SUGERIDAS:"
echo "========================================="
echo "1. Se 'normalizePhone' NÃO aparecer → git pull não funcionou"
echo "2. Se workers não aparecerem → pm2 restart all"
echo "3. Analise os logs acima para ver se o comando foi detectado"
echo ""

