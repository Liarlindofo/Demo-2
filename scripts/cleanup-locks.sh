#!/bin/bash

# Script para limpar locks antigos de WhatsApp
# Use este script se o sistema caiu e os locks não foram removidos

LOCK_DIR="/tmp/whatsapp-locks"

if [ ! -d "$LOCK_DIR" ]; then
  echo "Diretório de locks não existe: $LOCK_DIR"
  exit 0
fi

echo "🧹 Limpando locks antigos em $LOCK_DIR..."

for lock_file in "$LOCK_DIR"/*.lock; do
  if [ -f "$lock_file" ]; then
    pid=$(cat "$lock_file" 2>/dev/null)
    
    if [ -n "$pid" ]; then
      # Verificar se o processo ainda existe
      if ! ps -p "$pid" > /dev/null 2>&1; then
        echo "🗑️  Removendo lock stale: $(basename "$lock_file") (PID $pid não existe mais)"
        rm -f "$lock_file"
      else
        echo "✅ Lock ativo: $(basename "$lock_file") (PID $pid ainda rodando)"
      fi
    else
      echo "⚠️  Lock inválido: $(basename "$lock_file") (sem PID)"
      rm -f "$lock_file"
    fi
  fi
done

echo "✅ Limpeza concluída!"

