# 🚀 Guia de Deploy das Correções - Listener de Mensagens

## 📦 Arquivos Modificados

1. ✅ `src/wpp/index.js` - Listener com logs detalhados
2. ✅ `workers/whatsapp-worker.js` - Corrigido para não matar sessão
3. ✅ `src/server/api.js` - stopConnection fecha client antes de parar worker
4. ✅ `check-bot-settings.js` - Script de verificação (NOVO)

---

## 🔧 PASSO A PASSO NA VPS

### 1. Fazer backup (segurança)
```bash
cd /var/www/drin-platform
cp -r src/wpp src/wpp.backup
cp -r workers workers.backup
cp -r src/server src/server.backup
```

### 2. Aplicar as correções
```bash
# Baixar as correções do repositório
git pull origin main

# OU se estiver usando FTP/SFTP, sobrescrever os arquivos:
# - src/wpp/index.js
# - workers/whatsapp-worker.js
# - src/server/api.js
# - check-bot-settings.js (novo)
```

### 3. Verificar configurações do bot
```bash
cd /var/www/drin-platform
node check-bot-settings.js
```

**Saída esperada:**
```
✅ BotSettings encontrado:
   - botName: [nome do seu bot]
   - storeType: [tipo da loja]
   - isActive: true  ⬅️ DEVE SER TRUE
   - contextLimit: 10
```

**⚠️ Se isActive for false:**
O bot não vai responder! O script já corrige automaticamente.

### 4. Verificar workers rodando
```bash
pm2 list
```

**Procure por processos tipo:**
```
whatsapp-1c31266a-caf4-47b7-8a56-84de87634699
whatsapp-9b1d8bc0-90e8-4221-9caf-54ff6f538a51
```

### 5. Reiniciar workers WhatsApp
```bash
# Se houver workers rodando, reiniciar todos:
pm2 restart all

# OU reiniciar apenas workers específicos:
pm2 restart whatsapp-[USER_ID]
```

### 6. Reconectar o WhatsApp
Como fizemos mudanças no listener, é melhor reconectar:

**Opção A - Pelo frontend:**
1. Desconectar sessão
2. Gerar novo QR Code
3. Escanear com WhatsApp

**Opção B - Pelo PM2:**
```bash
# Parar worker atual
pm2 stop whatsapp-[USER_ID]
pm2 delete whatsapp-[USER_ID]

# Conectar novamente pelo frontend
```

### 7. Monitorar logs em TEMPO REAL
```bash
pm2 logs --lines 100
```

**Quando enviar mensagem de teste, você DEVE ver:**
```
[🔔 onMessage] Evento disparado! userId: [...], slot: 1
[📨 MENSAGEM RECEBIDA] userId: [...], slot: 1
[📨 MENSAGEM] De: 5511999999999@c.us, Tipo: chat, fromMe: false
[📨 MENSAGEM] Corpo: "oi"
[📱 PROCESSANDO] Telefone: 5511999999999, fromMe: false, texto: "oi"
[🤖 BOT] Processando mensagem de cliente externo: 5511999999999
[🤖 BOT] Buscando configurações do bot...
[🤖 BOT] Bot ativo! Nome: [seu bot], Tipo: [tipo]
[🤖 BOT] Enviando para GPT: "oi"
[🤖 BOT] Resposta GPT: "[resposta]"
✅ Resposta enviada para 5511999999999
```

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### ❌ Problema: "Cliente NÃO encontrado para chave"

**Causa:** Client foi removido indevidamente  
**Solução:** Já corrigida! Agora o client permanece em memória

### ❌ Problema: Mensagem não aparece nos logs

**Verificar:**

1. **Worker está rodando?**
```bash
pm2 list
# Deve mostrar worker com status "online"
```

2. **Client está em memória?**
```bash
pm2 logs | grep "Cliente armazenado na memória"
```

3. **Bot está ativo?**
```bash
node check-bot-settings.js | grep "isActive"
# Deve mostrar: isActive: true
```

4. **WhatsApp está realmente conectado?**
```bash
pm2 logs | grep "conectado"
# Procurar por "✅ WhatsApp conectado"
```

### ❌ Problema: Bot responde para atendente (fromMe: true)

**Verificar nos logs:**
```
[📨 MENSAGEM] ... fromMe: true
[setupMessageListener] Mensagem fromMe (atendente humano)
[setupMessageListener] Atendente humano digitando, bot não responderá
```

**Isso é correto!** Bot só responde mensagens de clientes externos (fromMe: false)

---

## 📊 COMANDOS ÚTEIS

### Ver logs apenas de um worker específico
```bash
pm2 logs whatsapp-[USER_ID] --lines 50
```

### Ver TODOS os processos Chrome/Chromium
```bash
ps aux | grep -iE "chrome|chromium" | grep -v grep
```

### Limpar logs antigos
```bash
pm2 flush
```

### Status detalhado de um worker
```bash
pm2 show whatsapp-[USER_ID]
```

### Restart específico com limpeza de cache
```bash
pm2 stop whatsapp-[USER_ID]
pm2 delete whatsapp-[USER_ID]
pm2 flush
# Depois reconectar pelo frontend
```

---

## ✅ TESTE FINAL

1. **Enviar mensagem de teste** de um telefone externo
2. **Verificar logs** em tempo real: `pm2 logs`
3. **Confirmar que aparece:**
   - `[🔔 onMessage] Evento disparado!`
   - `[📨 MENSAGEM RECEBIDA]`
   - `[🤖 BOT] Enviando para GPT`
   - `✅ Resposta enviada`
4. **Receber resposta** no WhatsApp

---

## 🆘 SE AINDA NÃO FUNCIONAR

Execute este diagnóstico completo e envie o resultado:

```bash
echo "=== DIAGNÓSTICO COMPLETO ==="
echo ""
echo "1. PROCESSOS PM2:"
pm2 list
echo ""
echo "2. BOT SETTINGS:"
node check-bot-settings.js
echo ""
echo "3. ÚLTIMOS 50 LOGS:"
pm2 logs --lines 50 --nostream
echo ""
echo "4. WHATSAPP BOT NO BANCO:"
echo "SELECT userId, slot, \"isConnected\", \"connectedNumber\" FROM whatsapp_bots;" | psql $DATABASE_URL
```

Copie TODA a saída e me envie para análise detalhada.

