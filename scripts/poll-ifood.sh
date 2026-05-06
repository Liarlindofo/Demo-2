#!/bin/bash
# Polling de pedidos iFood — chamado pelo cron a cada 30 segundos
# Instalar: crontab -e  e adicionar as duas linhas abaixo
#
#   * * * * * /bin/bash /var/www/plateful/scripts/poll-ifood.sh
#   * * * * * sleep 30 && /bin/bash /var/www/plateful/scripts/poll-ifood.sh

DOMAIN="https://platefull.com.br"
LOG_FILE="/var/log/plateful-polling.log"

curl -s -X GET "${DOMAIN}/api/ifood/polling" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  >> "${LOG_FILE}" 2>&1

# Adiciona newline para separar entradas no log
echo "" >> "${LOG_FILE}"
