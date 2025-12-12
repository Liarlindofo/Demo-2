# 🚀 Instruções Rápidas para VPS - Correção QR Code

## ⚡ Execução Rápida (Copiar e Colar)

```bash
# 1. Ir para o diretório do projeto
cd /var/www/drin-platform  # ou o caminho do seu projeto

# 2. Parar o bot
pm2 stop bot-whatsapp

# 3. Fazer backup (opcional)
sudo cp -r /var/www/whatsapp-sessions /var/www/whatsapp-sessions-backup-$(date +%Y%m%d-%H%M%S)

# 4. Dar permissão e executar script de limpeza
chmod +x scripts/limpar-sessoes-whatsapp.sh
./scripts/limpar-sessoes-whatsapp.sh --no-backup

# 5. Atualizar código (se usar git)
git pull origin main  # ou sua branch

# 6. Reiniciar bot
pm2 restart bot-whatsapp

# 7. Verificar logs
pm2 logs bot-whatsapp
```

## 📋 O Que Foi Corrigido

1. ✅ **Validação rigorosa de userId** - Garante que o ID do usuário está correto
2. ✅ **Normalização de userId** - Remove espaços e garante tipo correto
3. ✅ **Validação de usuário no banco** - Verifica se o usuário existe antes de criar sessão
4. ✅ **Logs detalhados** - Facilita identificar problemas
5. ✅ **Script de limpeza** - Remove sessões antigas e processos órfãos

## 🧪 Teste Após Aplicar

1. Abra o site em **dois navegadores diferentes** (ou modo anônimo)
2. Faça login com **usuários diferentes**
3. Gere QR code para cada usuário (Slot 1)
4. Verifique nos logs que os `userDataDir` são diferentes:
   ```bash
   pm2 logs bot-whatsapp | grep "userDataDir"
   ```
5. Verifique que os diretórios são separados:
   ```bash
   ls -la /var/www/whatsapp-sessions/
   ```

## ⚠️ Se Ainda Tiver Problema

Execute a limpeza completa novamente:

```bash
# Matar todos os processos Chrome
pkill -9 -f chrome
pkill -9 -f chromium

# Limpar diretório de sessões
sudo rm -rf /var/www/whatsapp-sessions/*

# Reiniciar bot
pm2 restart bot-whatsapp
```

## 📞 Logs para Debug

Se precisar de ajuda, colete estes logs:

```bash
# Logs do bot
pm2 logs bot-whatsapp --lines 200 > logs-bot.txt

# Diretórios de sessão
ls -la /var/www/whatsapp-sessions/ > diretorios.txt

# Processos Chrome
ps aux | grep chrome > processos.txt
```

