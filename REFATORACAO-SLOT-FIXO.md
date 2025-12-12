# ✅ REFATORAÇÃO COMPLETA - SLOT FIXO = 1

## 🎯 Objetivo Alcançado

Sistema refatorado para suportar **APENAS 1 SESSÃO WHATSAPP POR USUÁRIO** (slot fixo = 1).

## ✅ Mudanças Implementadas

### 🔧 Backend

#### 1. `src/wpp/index.js`
- ✅ `startClient(userId)` - Removido parâmetro `slot`, sempre usa `slot = 1`
- ✅ `stopClient(userId)` - Removido parâmetro `slot`, sempre usa `slot = 1`
- ✅ `getClientStatus(userId)` - Removido parâmetro `slot`, sempre usa `slot = 1`
- ✅ `restoreAllSessions()` - DESATIVADO (não restaura mais automaticamente)
- ✅ Isolamento total: `sessionName = whatsapp_${normalizedUserId}` (sem slot no nome)
- ✅ Validação: Bloqueia criação de múltiplas sessões para o mesmo usuário

#### 2. `src/server/api.js`
- ✅ `startConnection(req, res)` - Rota: `POST /api/start/:userId` (removido `/:slot`)
- ✅ `stopConnection(req, res)` - Rota: `POST /api/stop/:userId` (removido `/:slot`)
- ✅ `getQRCode(req, res)` - Rota: `GET /api/qr/:userId` (removido `/:slot`)
- ✅ `getStatus(req, res)` - Retorna apenas uma sessão (não array de slots)

#### 3. `src/server/router.js`
- ✅ Rotas atualizadas para remover `/:slot`:
  - `GET /api/qr/:userId`
  - `POST /api/start/:userId`
  - `POST /api/stop/:userId`

#### 4. `index.js` (servidor principal)
- ✅ Removido `restoreAllSessions()` - Sessões só iniciam via ação explícita do usuário

### 🎨 Frontend

#### 5. `app/connections/page.tsx`
- ✅ `startSession(clientId, connectionName)` - Removido parâmetro `slot`
- ✅ `stopSession(clientId)` - Removido parâmetro `slot`
- ✅ Removida lógica de múltiplos slots
- ✅ Interface simplificada: mostra apenas uma sessão WhatsApp
- ✅ Chamadas de API atualizadas:
  - `${API_URL}/api/start/${clientId}` (sem slot)
  - `${API_URL}/api/stop/${clientId}` (sem slot)
  - `${API_URL}/api/qr/${clientId}` (sem slot)
- ✅ Removido `slot` do modal de QR Code

## 🚀 Como Aplicar na VPS

```bash
# 1. Atualizar código
cd /var/www/drin-platform
git pull origin main  # ou fazer upload manual

# 2. Parar bot
pm2 stop bot-whatsapp

# 3. Limpar sessões antigas (IMPORTANTE!)
rm -rf /var/www/whatsapp-sessions/*

# 4. Matar processos Chrome
pkill -9 chrome chromium puppeteer 2>/dev/null || true
sleep 3

# 5. Reiniciar bot
pm2 restart bot-whatsapp

# 6. Verificar logs
pm2 logs bot-whatsapp
```

## 📊 Estrutura de Sessão

### Antes (Multi-slot):
```
/var/www/whatsapp-sessions/{userId}-slot1/
/var/www/whatsapp-sessions/{userId}-slot2/
/var/www/whatsapp-sessions/{userId}-slot3/
```

### Agora (Slot Fixo = 1):
```
/var/www/whatsapp-sessions/whatsapp_{userId}/
```

## 🔒 Garantias de Isolamento

1. ✅ **Uma sessão por usuário** - Bloqueado no código
2. ✅ **Diretório isolado** - Cada usuário tem seu próprio diretório
3. ✅ **Sem restore automático** - Sessões só iniciam via ação do usuário
4. ✅ **Normalização de userId** - Garante consistência nas chaves
5. ✅ **Validação rigorosa** - Verifica se usuário existe antes de criar sessão

## 📝 APIs Atualizadas

### Iniciar Sessão
```http
POST /api/start/:userId
```

### Parar Sessão
```http
POST /api/stop/:userId
```

### Buscar QR Code
```http
GET /api/qr/:userId
```

### Status
```http
GET /api/status/:userId
```

Retorna:
```json
{
  "success": true,
  "userId": "...",
  "connection": {
    "isConnected": false,
    "qrCode": "...",
    "state": "waiting_qr",
    ...
  },
  "session": {
    "status": "QRCODE",
    "qrCode": "...",
    ...
  }
}
```

## ⚠️ Breaking Changes

- ❌ Removido suporte a múltiplos slots
- ❌ Rotas não aceitam mais `/:slot`
- ❌ Frontend não mostra mais múltiplas sessões
- ❌ `restoreAllSessions()` não funciona mais (desativado)

## ✅ Benefícios

1. **Estabilidade** - Menos complexidade = menos bugs
2. **Isolamento** - Cada usuário tem sua própria sessão isolada
3. **Simplicidade** - Código mais fácil de manter
4. **Segurança** - Não há risco de sessões compartilhadas
5. **Performance** - Menos processos Chrome rodando

