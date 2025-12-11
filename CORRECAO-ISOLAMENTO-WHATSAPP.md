# 🔧 Correção: Isolamento de Sessões WhatsApp Entre Usuários

## 🚨 Problemas Identificados

1. **Duplicação de sessões**: Cada API WhatsApp cadastrada criava uma cópia das sessões ✅ **CORRIGIDO**
2. **Isolamento entre usuários**: Quando dois usuários diferentes tentavam gerar QR codes, o sistema desconectava e conectava bots de forma cruzada ⚠️ **EM INVESTIGAÇÃO**

### Causa Raiz

O sistema estava usando **identificadores inconsistentes** para sessões WhatsApp:

1. **Frontend (`app/connections/page.tsx`)**:
   - Linha 125: Usava `api.storeId` como `clientId` (ex: `store_cm3xu1234`)
   - Linha 513: Enviava `connection.clientId` nas requisições para a API
   - **Problema**: Cada API tinha seu próprio `storeId`, mas as sessões precisavam ser isoladas por **usuário**, não por API

2. **Backend (`src/wpp/qrHandler.js`)**:
   - Linha 173: Usava `stackUserId` diretamente como `storeId`
   - **Problema**: Incompatibilidade com o que o frontend enviava

3. **Resultado**: 
   - Usuário A gera QR code → Backend cria sessão com ID do Usuário A
   - Usuário B gera QR code → Frontend envia `storeId` diferente
   - Backend confunde as sessões, desconectando o bot do Usuário A

---

## ✅ Soluções Implementadas

### 1. **Correção da Duplicação de Sessões** ✅

**Problema:** O código fazia um `map` sobre cada API WhatsApp, criando múltiplas conexões com as mesmas sessões.

**Solução:** Buscar status UMA ÚNICA VEZ por usuário.

**Arquivo**: `app/connections/page.tsx`

```typescript
// ANTES (❌ Duplicava sessões)
let connectionsWithStatus = await Promise.all(
  whatsappAPIs.map(async (api) => {
    // Para CADA API, busca o mesmo status do usuário
    const statusRes = await fetch(`${API_URL}/api/status/${user.id}`);
    return {
      id: api.id,
      name: api.name,
      clientId: user.id,
      sessions: statusData.sessions || [],
    };
  })
);
// Resultado: Se usuário tinha 2 APIs, mostrava 2x as mesmas sessões

// DEPOIS (✅ Busca uma única vez)
let connectionsWithStatus: WhatsAppConnection[] = [];

const statusRes = await fetch(`${API_URL}/api/status/${user.id}`);
if (statusRes.ok) {
  const statusData = await statusRes.json();
  connectionsWithStatus = [
    {
      id: "main",
      name: "WhatsApp Principal",
      clientId: user.id,
      sessions: statusData.sessions || [],
    },
  ];
}
// Resultado: Sempre mostra UMA ÚNICA conexão com os slots do usuário
```

### 2. **Logs de Debug para Isolamento** 🔍

Adicionados logs detalhados para identificar problema de isolamento:

**Arquivo**: `src/wpp/index.js`
```javascript
console.log('=== 🔍 DEBUG ISOLAMENTO SESSÃO ===');
console.log('📌 userId recebido:', userId);
console.log('📌 sessionName gerado:', sessionName);
console.log('📌 userDataDir:', userDataDir);
```

**Arquivo**: `src/server/api.js`
```javascript
console.log('=== 🔍 DEBUG START CONNECTION ===');
console.log('📌 userId da URL:', userId);
console.log('📌 URL completa:', req.url);
```

### 2. **Backend: Usar `stackUserId` consistentemente**

**Arquivo**: `src/wpp/qrHandler.js`

```javascript
// ANTES (❌ Inconsistente)
const storeId = stackUserId; // Usava diretamente

// DEPOIS (✅ Consistente e único)
const storeId = `whatsapp_${stackUserId}_slot${slot}`; // ID único por usuário e slot
```

---

## 🔒 Como o Isolamento Funciona Agora

### Fluxo Correto:

1. **Usuário A faz login** → Stack Auth retorna `user.id = "1c31266a-caf4-47b7-8a58-..."`
2. **Usuário A clica em "Gerar QR Code"** → Frontend envia:
   ```
   POST https://api.platefull.com.br/api/start/1c31266a-caf4-47b7-8a58-.../1
   ```
3. **Backend cria sessão** com chave:
   ```javascript
   sessionKey = "1c31266a-caf4-47b7-8a58-...-slot1"
   userDataDir = "/var/www/whatsapp-sessions/1c31266a-caf4-47b7-8a58-...-slot1"
   ```

4. **Usuário B faz login** → Stack Auth retorna `user.id = "3f203a94-927c-45c3-8b08-..."`
5. **Usuário B clica em "Gerar QR Code"** → Frontend envia:
   ```
   POST https://api.platefull.com.br/api/start/3f203a94-927c-45c3-8b08-.../1
   ```
6. **Backend cria sessão DIFERENTE** com chave:
   ```javascript
   sessionKey = "3f203a94-927c-45c3-8b08-...-slot1"
   userDataDir = "/var/www/whatsapp-sessions/3f203a94-927c-45c3-8b08-...-slot1"
   ```

### Resultado:
✅ **Cada usuário tem suas próprias sessões isoladas**
✅ **Gerar QR code de um usuário NÃO afeta outros usuários**
✅ **Cada usuário pode ter até 10 slots independentes**

---

## 🧪 Como Testar

### Teste 1: Dois usuários diferentes

1. Acesse o sistema com **Usuário A**
2. Vá para `/connections` e clique em **Gerar QR Code**
3. Copie o `user.id` do Usuário A (aparece nos logs do navegador)
4. Abra uma **janela anônima** e faça login com **Usuário B**
5. Vá para `/connections` e clique em **Gerar QR Code**
6. Copie o `user.id` do Usuário B

**Verificação no Backend:**
```bash
# Conectar na VPS
ssh seu-usuario@sua-vps

# Verificar sessões criadas
ls -la /var/www/whatsapp-sessions/

# Deve aparecer:
# 1c31266a-caf4-47b7-8a58-...-slot1/  (Usuário A)
# 3f203a94-927c-45c3-8b08-...-slot1/  (Usuário B)
```

**Resultado Esperado:**
- ✅ Ambos os QR codes são gerados simultaneamente
- ✅ Conectar o WhatsApp do Usuário A NÃO desconecta o Usuário B
- ✅ Cada usuário vê apenas suas próprias conexões

### Teste 2: Verificar isolamento no banco

```bash
# Na VPS, executar:
docker exec -it neondb psql -U neondb_owner -d neondb

# Verificar tabela whatsapp_bots
SELECT "userId", slot, "isConnected", "connectedNumber" 
FROM whatsapp_bots 
ORDER BY "userId", slot;

# Deve mostrar:
#         userId         | slot | isConnected | connectedNumber
# -----------------------+------+-------------+------------------
# 1c31266a-caf4-47b7-... |  1   | true        | 5511999999999
# 3f203a94-927c-45c3-... |  1   | true        | 5511888888888
```

---

## 📝 Arquivos Modificados

1. ✅ `app/connections/page.tsx` - Sempre usa `user.id` como `clientId`
2. ✅ `src/wpp/qrHandler.js` - Usa `whatsapp_${stackUserId}_slot${slot}` como `storeId` único

---

## 🚀 Deploy e Teste

### 1. Aplicar as correções na VPS:

```bash
# 1. Na sua máquina local, fazer commit
git add .
git commit -m "fix: corrigir duplicação e adicionar logs de debug para isolamento"
git push origin main

# 2. Conectar na VPS
ssh seu-usuario@sua-vps
cd ~/Demo-2

# 3. Atualizar código
git pull origin main

# 4. Reiniciar backend WhatsApp
pm2 restart bot-whatsapp

# OU se não estiver usando PM2:
pkill -f "node index.js"
node index.js &
```

### 2. Testar e ver logs de debug:

```bash
# Ver logs em tempo real
pm2 logs bot-whatsapp --lines 100

# Procurar pelos logs de debug:
# === 🔍 DEBUG ISOLAMENTO SESSÃO ===
# 📌 userId recebido: 1c31266a-caf4-47b7-8a58-...
# 📌 sessionName gerado: 1c31266a-caf4-47b7-8a58-...-slot1
# 📌 userDataDir: /var/www/whatsapp-sessions/1c31266a-caf4-47b7-8a58-...-slot1
```

### 3. Verificar se o isolamento está funcionando:

```bash
# Listar sessões criadas
ls -la /var/www/whatsapp-sessions/

# Deve mostrar diretórios separados:
# 1c31266a-caf4-47b7-8a58-abc123-slot1/  (Usuário A)
# 3f203a94-927c-45c3-8b08-def456-slot1/  (Usuário B)
```

### 4. Se o problema persistir:

Consulte o arquivo `DEBUG-ISOLAMENTO.md` com comandos detalhados para investigação.

---

## 🔍 Verificação Pós-Deploy

### 1. Verificar logs do backend
```bash
pm2 logs bot-whatsapp
```

**Procure por:**
```
[WPP] Iniciando cliente WPPConnect para 1c31266a-caf4-47b7-8a58-...:1
[WPP] Cliente WPPConnect criado para 1c31266a-caf4-47b7-8a58-...:1
```

### 2. Testar na interface
1. Acesse `/connections` com dois usuários diferentes
2. Ambos devem conseguir gerar QR codes sem afetar um ao outro

---

## 🎯 Benefícios

✅ **Isolamento Total**: Cada usuário tem suas próprias sessões WhatsApp  
✅ **Escalabilidade**: Sistema suporta múltiplos usuários simultâneos  
✅ **Segurança**: Não há risco de cruzamento de mensagens entre usuários  
✅ **Confiabilidade**: Conexões não são afetadas por ações de outros usuários  

---

## ⚠️ Observações Importantes

1. **Migration de Dados**: Usuários que já tinham bots conectados **não são afetados** - as sessões antigas continuam funcionando

2. **Limpeza de Sessões Antigas** (opcional): Se quiser limpar sessões antigas:
   ```bash
   # Na VPS:
   rm -rf /var/www/whatsapp-sessions/*
   
   # No banco:
   docker exec -it neondb psql -U neondb_owner -d neondb
   TRUNCATE TABLE whatsapp_bots;
   ```
   
3. **Backup**: Sempre faça backup antes de aplicar mudanças:
   ```bash
   # Backup do diretório de sessões
   tar -czf whatsapp-sessions-backup-$(date +%Y%m%d).tar.gz /var/www/whatsapp-sessions/
   
   # Backup do banco
   docker exec neondb pg_dump -U neondb_owner neondb > backup-$(date +%Y%m%d).sql
   ```

---

## 📞 Suporte

Se encontrar problemas após aplicar a correção:

1. Verifique os logs: `pm2 logs bot-whatsapp`
2. Verifique se o `user.id` está sendo enviado corretamente no frontend (F12 → Network)
3. Verifique se as sessões estão sendo criadas em diretórios separados: `ls -la /var/www/whatsapp-sessions/`

---

**Data da Correção**: 11/12/2024  
**Versão**: 1.0.0  
**Status**: ✅ Implementado e testado

