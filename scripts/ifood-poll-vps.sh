#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ifood-poll-vps.sh
# Chama o endpoint de polling do iFood a cada execução.
# Instale via crontab (duas entradas de 1 min com sleep 30 entre elas)
# para atingir ~30 segundos de frequência.
#
# Uso:  CRON_SECRET=seu_secret bash /usr/local/bin/ifood-poll-vps.sh
#        ou defina CRON_SECRET diretamente no arquivo abaixo.
# ─────────────────────────────────────────────────────────────────────────────

CRON_SECRET="${CRON_SECRET:-COLOQUE_SEU_CRON_SECRET_AQUI}"
ENDPOINT="https://platefull.com.br/api/ifood/polling"
LOG="/var/log/ifood-polling.log"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

response=$(curl -fsS \
  --max-time 25 \
  -X GET "$ENDPOINT" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Accept: application/json" \
  2>&1)

exit_code=$?

if [ $exit_code -eq 0 ]; then
  printf '[%s] OK  | %s\n\n' "$(timestamp)" "$response" >> "$LOG"
else
  printf '[%s] ERR (exit %s) | %s\n\n' "$(timestamp)" "$exit_code" "$response" >> "$LOG"
fi
