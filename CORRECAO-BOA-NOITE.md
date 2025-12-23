# 🔧 CORREÇÃO: Comandos #boa noite e #voltar

## 🐛 PROBLEMA IDENTIFICADO

O bot continuava respondendo mesmo após o comando `#boa noite` devido a **inconsistência na normalização de números de telefone**:

- Quando pausava: `5511999999999` (sem @c.us)
- Quando verificava: `5511999999999@c.us` (com @c.us)
- **Resultado:** As chaves não batiam! ❌

## ✅ CORREÇÃO APLICADA

### 1. **`src/wpp/index.js`**
- ✅ Adicionada função `normalizePhone()` que remove sufixos (@c.us, @g.us, etc)
- ✅ Todas as funções agora normalizam ANTES de criar a chave:
  - `pauseChat()`
  - `resumeChat()`
  - `isChatPaused()`
- ✅ Logs detalhados para debug

### 2. **`src/wpp/sessionManager.js`**
- ✅ `setManualMode()` normaliza número antes de salvar
- ✅ `isManualMode()` normaliza número antes de verificar
- ✅ Logs detalhados mostrando número original e normalizado

## 📋 LOGS QUE VOCÊ VERÁ AGORA

### Quando enviar `#boa noite`:
```
[📨 MENSAGEM RECEBIDA] userId: [...], slot: 1
[📨 MENSAGEM] De: 5511999999999@c.us, fromMe: true
[📨 MENSAGEM] Corpo: "#boa noite"
[setupMessageListener] Texto recebido: "#boa noite"
🛑 Comando #boa noite recebido para 5511999999999
🛑 pauseChat -> Bot pausado para 5511999999999 (original: 5511999999999@c.us)
[pauseChat] Chave adicionada: "userId:1:5511999999999"
🔧 setManualMode: ATIVADO para 5511999999999 (original: 5511999999999@c.us)
✅ Chat 5511999999999 pausado. Atendente assumiu.
```

### Quando cliente enviar mensagem (após pausa):
```
[📨 MENSAGEM RECEBIDA] userId: [...], slot: 1
[📨 MENSAGEM] De: 5511999999999@c.us, fromMe: false
[🤖 BOT] Processando mensagem de cliente externo: 5511999999999
[isChatPaused] Verificando "userId:1:5511999999999" -> SIM (PAUSADO)
[SessionManager] isManualMode: phone="5511999999999" -> SIM (MANUAL)
🔕 Chat 5511999999999 está em MODO MANUAL (atendente humano). Bot não responderá.
```

### Quando enviar `#voltar`:
```
[📨 MENSAGEM RECEBIDA] userId: [...], slot: 1
[📨 MENSAGEM] De: 5511999999999@c.us, fromMe: true
[📨 MENSAGEM] Corpo: "#voltar"
✅ Comando #voltar recebido para 5511999999999
✅ resumeChat -> Bot reativado para 5511999999999 (original: 5511999999999@c.us)
[resumeChat] Chave removida: "userId:1:5511999999999"
🔧 setManualMode: DESATIVADO para 5511999999999 (original: 5511999999999@c.us)
✅ Chat 5511999999999 reativado. Bot voltou.
```

### Quando cliente enviar mensagem (após #voltar):
```
[📨 MENSAGEM RECEBIDA] userId: [...], slot: 1
[📨 MENSAGEM] De: 5511999999999@c.us, fromMe: false
[🤖 BOT] Processando mensagem de cliente externo: 5511999999999
[isChatPaused] Verificando "userId:1:5511999999999" -> NÃO (ATIVO)
[SessionManager] isManualMode: phone="5511999999999" -> NÃO (BOT)
[🤖 BOT] Buscando configurações do bot...
[🤖 BOT] Bot ativo! Nome: [...]
[🤖 BOT] Enviando para GPT: "..."
✅ Resposta enviada para 5511999999999
```

## 🚀 APLICAR NA VPS

```bash
cd /var/www/drin-platform

# Fazer backup
cp src/wpp/index.js src/wpp/index.js.backup
cp src/wpp/sessionManager.js src/wpp/sessionManager.js.backup

# Atualizar código
git pull origin main
# OU fazer upload dos arquivos via FTP/SFTP

# Reiniciar workers
pm2 restart all

# Monitorar logs
pm2 logs --lines 100
```

## ✅ TESTE COMPLETO

1. **Cliente envia:** "olá"
   - ✅ Bot deve responder

2. **Você (WhatsApp Web) digita no chat do cliente:** `#boa noite`
   - ✅ Logs devem mostrar: "Bot pausado"
   - ✅ Logs devem mostrar: "Chave adicionada"

3. **Cliente envia:** "preciso de ajuda"
   - ✅ Bot NÃO deve responder
   - ✅ Logs devem mostrar: "Chat está em MODO MANUAL"

4. **Você digita no chat do cliente:** `#voltar`
   - ✅ Logs devem mostrar: "Bot reativado"
   - ✅ Logs devem mostrar: "Chave removida"

5. **Cliente envia:** "obrigado"
   - ✅ Bot deve responder novamente

## 🔍 DEBUG

Se ainda não funcionar, execute na VPS e me envie os logs:

```bash
# Monitorar logs em tempo real
pm2 logs | grep -E "boa noite|voltar|pauseChat|resumeChat|isChatPaused|MODO MANUAL"
```

Quando enviar `#boa noite`, você DEVE ver:
- ✅ "Comando #boa noite recebido"
- ✅ "Bot pausado"
- ✅ "Chave adicionada"
- ✅ "setManualMode: ATIVADO"

Se NÃO aparecer, o problema está na captura do comando.
Se aparecer mas o bot continuar respondendo, o problema está na verificação.

