# 🔧 Correção: Sessões Sendo Compartilhadas Entre Usuários

## 🐛 Problema Identificado

Quando você desconecta um usuário, ele desconecta o bot de OUTRO usuário. Quando gera QR code, ele conecta outro usuário novamente.

## 🔍 Causa Raiz

O problema estava na **normalização inconsistente do userId**:
- O `sessionManager` não estava normalizando o userId antes de criar as chaves
- Diferentes partes do código usavam userId com espaços ou formatos diferentes
- Isso causava chaves diferentes para o mesmo usuário, fazendo com que:
  - Um usuário criasse uma sessão com chave `"userId1:1"`
  - Outro usuário tentasse acessar com chave `"userId1 :1"` (com espaço)
  - O sistema não encontrava a sessão correta e criava/removia sessões erradas

## ✅ Correções Aplicadas

### 1. Normalização no SessionManager (`src/wpp/sessionManager.js`)

- ✅ Adicionada função `normalizeUserId()` que garante consistência
- ✅ Todas as operações (getClient, setClient, removeClient, hasClient) agora normalizam o userId
- ✅ Logs detalhados para rastrear qual chave está sendo usada
- ✅ Lista todas as chaves ativas para debug

### 2. Normalização no startClient (`src/wpp/index.js`)

- ✅ userId é normalizado no início da função
- ✅ `normalizedUserId` é usado em TODAS as operações (setClient, getClient, etc.)
- ✅ Garantido que o mesmo userId normalizado é usado em todo o fluxo

### 3. Normalização no stopClient (`src/wpp/index.js`)

- ✅ userId é normalizado antes de buscar/remover cliente
- ✅ Logs detalhados para rastrear qual usuário está sendo desconectado

### 4. Normalização no stopConnection (`src/server/api.js`)

- ✅ userId é normalizado antes de chamar stopClient
- ✅ Validação adicional para garantir que o userId correto é usado

## 🚀 Aplicar na VPS

### Passo 1: Atualizar Código

```bash
cd /var/www/drin-platform  # ou seu caminho
git pull origin main  # ou fazer upload manual
```

### Passo 2: Limpar Sessões Antigas

```bash
# Parar bot
pm2 stop bot-whatsapp

# Limpar sessões
rm -rf /var/www/whatsapp-sessions/*

# Matar processos Chrome
pkill -9 chrome chromium puppeteer 2>/dev/null || true
sleep 3
```

### Passo 3: Reiniciar Bot

```bash
pm2 restart bot-whatsapp
pm2 logs bot-whatsapp
```

## 🧪 Teste Após Aplicar

1. **Gerar QR Code para Usuário 1, Slot 1**
   - Verificar nos logs: `[SessionManager] Gerando chave: userId="..." (normalizado="..."), slot=1`
   - Verificar que a chave está correta

2. **Gerar QR Code para Usuário 2, Slot 1** (em outro navegador)
   - Verificar que a chave é DIFERENTE do usuário 1
   - Verificar que não há conflito

3. **Desconectar Usuário 1**
   - Verificar nos logs: `[stopClient] Parando cliente para userId: "..." (normalizado: "...")`
   - Verificar que apenas o cliente do usuário 1 é removido
   - Verificar que o usuário 2 continua conectado

4. **Verificar Chaves Ativas**

```bash
pm2 logs bot-whatsapp | grep "Chaves ativas"
```

Deve mostrar chaves diferentes para cada usuário, por exemplo:
```
[SessionManager] Chaves ativas (2): 3f203a94-927c-45c3-8b02-224635092009:1, 1c31266a-caf4-47b7-8a56-84de87634699:1
```

## 📊 Logs Esperados (Sucesso)

### Ao Gerar QR Code:
```
[SessionManager] Gerando chave: userId="3f203a94-927c-45c3-8b02-224635092009" (normalizado="3f203a94-927c-45c3-8b02-224635092009"), slot=1 -> key="3f203a94-927c-45c3-8b02-224635092009:1"
[SessionManager] ✅ Cliente armazenado na memória com chave: "3f203a94-927c-45c3-8b02-224635092009:1"
[SessionManager] Chaves ativas (1): 3f203a94-927c-45c3-8b02-224635092009:1
```

### Ao Desconectar:
```
[stopClient] Parando cliente para userId: "3f203a94-927c-45c3-8b02-224635092009" (original: "3f203a94-927c-45c3-8b02-224635092009"), slot: 1
[SessionManager] ✅ Cliente encontrado para chave: "3f203a94-927c-45c3-8b02-224635092009:1"
[SessionManager] ✅ Cliente removido da memória (chave: "3f203a94-927c-45c3-8b02-224635092009:1")
[SessionManager] Chaves restantes (0): 
```

## ⚠️ Se Ainda Tiver Problema

Execute esta verificação:

```bash
# Ver todas as chaves ativas nos logs
pm2 logs bot-whatsapp | grep "Chaves ativas" | tail -5

# Ver qual userId está sendo usado em cada operação
pm2 logs bot-whatsapp | grep "SessionManager" | tail -20
```

Se você ver chaves duplicadas ou userIds diferentes para o mesmo usuário, pode haver um problema no frontend enviando userIds diferentes.

## 📝 Arquivos Modificados

- `src/wpp/sessionManager.js` - Normalização de userId em todas as operações
- `src/wpp/index.js` - Uso consistente de normalizedUserId
- `src/server/api.js` - Normalização no stopConnection

