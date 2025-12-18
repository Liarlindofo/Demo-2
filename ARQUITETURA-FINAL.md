# 🏗️ ARQUITETURA FINAL - MULTI-USUÁRIO WHATSAPP

## 📊 VISÃO GERAL

```
┌─────────────────────────────────────────────────────────────┐
│                     API PRINCIPAL (PM2)                     │
│                    platefull-api:3001                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Routes  │  │  Models  │  │ PM2 Svc  │  │   Auth   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ pm2.start()
                           ▼
        ┌──────────────────────────────────────────┐
        │       WORKERS ISOLADOS (PM2)             │
        │                                          │
        │  ┌────────────────┐  ┌────────────────┐ │
        │  │ whatsapp-user1 │  │ whatsapp-user2 │ │
        │  │    (PID 1234)  │  │    (PID 1235)  │ │
        │  │                │  │                │ │
        │  │ ┌────────────┐ │  │ ┌────────────┐ │ │
        │  │ │WPPConnect  │ │  │ │WPPConnect  │ │ │
        │  │ │   Client   │ │  │ │   Client   │ │ │
        │  │ └────────────┘ │  │ └────────────┘ │ │
        │  │       ▼        │  │       ▼        │ │
        │  │ ┌────────────┐ │  │ ┌────────────┐ │ │
        │  │ │  Chrome 1  │ │  │ │  Chrome 2  │ │ │
        │  │ │  (Isolado) │ │  │ │  (Isolado) │ │ │
        │  │ └────────────┘ │  │ └────────────┘ │ │
        │  └────────────────┘  └────────────────┘ │
        └──────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │          SISTEMA DE ARQUIVOS             │
        │                                          │
        │  📁 /tmp/whatsapp-locks/                 │
        │    ├── whatsapp_user1.lock (PID: 1234)  │
        │    └── whatsapp_user2.lock (PID: 1235)  │
        │                                          │
        │  📁 /var/www/whatsapp-sessions/          │
        │    ├── whatsapp_user1/       (tokens)   │
        │    ├── whatsapp_user1__chrome/ (perfil) │
        │    ├── whatsapp_user2/       (tokens)   │
        │    └── whatsapp_user2__chrome/ (perfil) │
        └──────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │           BANCO DE DADOS                 │
        │                                          │
        │  stack_users (userId)                    │
        │  whatsapp_bots (userId, slot, qrCode)    │
        │  bot_settings (userId, config)           │
        └──────────────────────────────────────────┘
```

---

## 🔄 FLUXO DE CONEXÃO

### 1. Usuário Clica "Conectar WhatsApp"

```
Frontend → POST /api/start/{userId}
                    ↓
           src/server/api.js
            startConnection()
                    ↓
        src/services/pm2.service.js
          startWhatsappWorker(userId)
                    ↓
           ✅ Verifica se worker já existe
           ✅ Não permite múltiplos workers
                    ↓
         pm2 start workers/whatsapp-worker.js
              --name whatsapp-{userId}
              --userId={userId}
```

### 2. Worker Inicia

```
workers/whatsapp-worker.js
          ↓
   Extrai userId dos args
          ↓
   Registra handlers SIGINT/SIGTERM
          ↓
   Chama startClient(userId)
          ↓
   src/wpp/index.js
```

### 3. startClient() Executa

```
startClient(userId)
    ↓
┌──────────────────────────────────────┐
│ 1. VALIDAÇÃO                         │
│    ✅ userId válido?                 │
│    ✅ Normalizar userId              │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 2. LOCK                              │
│    ✅ acquireLock(userId)            │
│    ✅ Arquivo em /tmp/whatsapp-locks │
│    ✅ Contém PID do processo         │
│    ❌ Se lock existe → ERRO          │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 3. VERIFICAR MEMÓRIA                 │
│    ✅ hasClient(userId)?             │
│    ✅ Se sim → retornar QR existente │
│    ✅ Se não → prosseguir            │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 4. DEFINIR DIRETÓRIOS                │
│    sessionName = whatsapp_{userId}   │
│    tokenDir = .../whatsapp_{userId}  │
│    chromeDir = .../{userId}__chrome  │
│                                      │
│    ⚠️ FIXO - SEM TIMESTAMP!          │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 5. LIMPEZA SEGURA                    │
│    safeCleanupUserChrome()           │
│    ✅ Remove locks do Chrome         │
│    ✅ Mata PIDs usando chromeDir     │
│    ❌ NUNCA usa pkill global         │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 6. CRIAR DIRETÓRIOS                  │
│    mkdir tokenDir                    │
│    mkdir chromeDir                   │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 7. VALIDAR USUÁRIO NO BANCO          │
│    ✅ stackUser existe?              │
│    ✅ Criar whatsapp_bot             │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 8. CONFIGURAR PUPPETEER              │
│    ✅ --remote-debugging-port=0      │
│    ✅ --user-data-dir={chromeDir}    │
│    ✅ pipe: true                     │
│    ✅ headless: true                 │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 9. CRIAR CLIENTE WPPCONNECT          │
│    wppconnect.create({               │
│      session: sessionName,           │
│      folderNameToken: tokenDir,      │
│      puppeteerOptions: {...},        │
│      catchQR: onQRCode,              │
│      statusFind: onStatusChange      │
│    })                                │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 10. REGISTRAR CLIENTE                │
│     sessionManager.setClient()       │
│     setupMessageListener()           │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 11. GERAR QR CODE                    │
│     catchQR() → onQRCode()           │
│     → salvar no banco                │
│     → frontend exibe QR              │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 12. AGUARDAR SCAN                    │
│     statusFind("qrReadSuccess")      │
│     → onStatusChange()               │
│     → marcar conectado               │
└──────────────────────────────────────┘
```

---

## 🛑 FLUXO DE DESCONEXÃO

### 1. Usuário Clica "Desconectar"

```
Frontend → POST /api/stop/{userId}
                    ↓
           src/server/api.js
            stopConnection()
                    ↓
        src/services/pm2.service.js
          stopWhatsappWorker(userId)
                    ↓
              pm2 stop whatsapp-{userId}
                    ↓
        workers/whatsapp-worker.js
           handler SIGTERM
                    ↓
           stopClient(userId)
```

### 2. stopClient() Executa

```
stopClient(userId)
    ↓
┌──────────────────────────────────────┐
│ 1. BUSCAR CLIENTE EM MEMÓRIA         │
│    client = sessionManager.getClient │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 2. FECHAR CLIENTE GRACEFULLY         │
│    ✅ client.close()                 │
│    ✅ sessionManager.removeClient()  │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 3. LIMPEZA SEGURA                    │
│    safeCleanupUserChrome()           │
│    ✅ Mata processos Chrome do user  │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 4. LIMPAR CONVERSAS                  │
│    sessionManager.clearAll()         │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 5. MARCAR COMO DESCONECTADO          │
│    WhatsAppBotModel.setDisconnected  │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 6. REMOVER LOCK                      │
│    ✅ releaseLock(userId)            │
│    ✅ rm /tmp/.../whatsapp_{user}.lock│
└──────────────────────────────────────┘
```

---

## 🔐 SISTEMA DE LOCK

### Estrutura do Lock

```
Arquivo: /tmp/whatsapp-locks/whatsapp_{userId}.lock
Conteúdo: PID do processo (ex: "12345")
Permissões: 644
```

### Ciclo de Vida

```
┌────────────────────────────────────────┐
│ INÍCIO: Lock não existe                │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ acquireLock(userId)                    │
│ 1. Verificar se arquivo existe         │
│ 2. Se existe:                          │
│    - Ler PID                           │
│    - Verificar se processo está vivo   │
│    - Se morto: remover lock (stale)    │
│    - Se vivo: RETORNAR FALSO           │
│ 3. Se não existe:                      │
│    - Criar arquivo                     │
│    - Escrever process.pid              │
│    - RETORNAR VERDADEIRO               │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ ATIVO: Cliente WPPConnect rodando      │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ REMOÇÃO: Lock é removido quando        │
│ - stopClient() é chamado               │
│ - SIGINT/SIGTERM recebidos             │
│ - Erro ao criar cliente                │
│ - Processo morre (detectado depois)    │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ FIM: Lock não existe mais              │
└────────────────────────────────────────┘
```

---

## 🌐 ISOLAMENTO DE CHROME

### Cada Usuário Tem:

```
Usuário 1:
  - Worker PM2: whatsapp-user1
  - PID: 1234
  - Lock: /tmp/whatsapp-locks/whatsapp_user1.lock
  - Tokens: /var/www/whatsapp-sessions/whatsapp_user1/
  - Chrome: /var/www/whatsapp-sessions/whatsapp_user1__chrome/
    - SingletonLock (removido antes de iniciar)
    - Default/
    - Cache/
    - Cookies
    - LocalStorage
  - Chrome PID: 1240, 1241, 1242... (múltiplos processos)
  - Debug Port: Aleatória (--remote-debugging-port=0)

Usuário 2:
  - Worker PM2: whatsapp-user2
  - PID: 1235
  - Lock: /tmp/whatsapp-locks/whatsapp_user2.lock
  - Tokens: /var/www/whatsapp-sessions/whatsapp_user2/
  - Chrome: /var/www/whatsapp-sessions/whatsapp_user2__chrome/
    - SingletonLock (removido antes de iniciar)
    - Default/
    - Cache/
    - Cookies
    - LocalStorage
  - Chrome PID: 1250, 1251, 1252... (múltiplos processos)
  - Debug Port: Aleatória (--remote-debugging-port=0)
```

### ✅ Garantias de Isolamento:

1. **Diretórios Separados:** Cada usuário tem seu próprio `__chrome/`
2. **Processos Separados:** PIDs diferentes
3. **Portas Diferentes:** `--remote-debugging-port=0` (aleatória)
4. **Locks Separados:** Arquivos de lock individuais
5. **Workers Separados:** Processos PM2 independentes

---

## 🧹 LIMPEZA SEGURA

### safeCleanupUserChrome(chromeDir)

```javascript
1. Remover locks do Chrome:
   - SingletonLock
   - LockFile
   - lockfile
   - SingletonSocket
   - SingletonCookie
   (recursivamente no chromeDir)

2. Identificar PIDs que usam chromeDir:
   Método 1: ps aux | grep chrome | grep "{chromeDir}"
   Método 2: fuser "{chromeDir}"
   
3. Matar APENAS esses PIDs:
   kill -9 {pid1} {pid2} {pid3}...
   
4. Aguardar 2 segundos
   
5. Verificar se ainda há PIDs:
   Se sim: tentar novamente
```

### ❌ O QUE NUNCA É FEITO:

```bash
# ❌ NUNCA:
pkill chrome
pkill chromium
killall chrome
rm -rf /var/www/whatsapp-sessions/*

# ✅ SEMPRE:
ps aux | grep chrome | grep "{chromeDir específico}"
kill -9 {PIDs específicos}
rm -f "{chromeDir}/SingletonLock"
```

---

## 📊 ESTADO DO SISTEMA

### Em Memória (SessionManager):

```javascript
{
  clients: Map {
    "user1:1" => WPPConnectClient,
    "user2:1" => WPPConnectClient
  },
  conversations: Map {
    "user1:1" => Map { "5511999999999" => [messages] },
    "user2:1" => Map { "5511888888888" => [messages] }
  }
}
```

### No Banco (PostgreSQL):

```sql
stack_users:
  - id: "user1"
  - primaryEmail: "user1@example.com"

whatsapp_bots:
  - userId: "user1"
  - slot: 1
  - isConnected: true
  - qrCode: "data:image/png;base64,..."
  - connectedNumber: "5511999999999"

bot_settings:
  - userId: "user1"
  - isActive: true
  - botName: "Assistente"
  - storeType: "restaurant"
```

### No Sistema de Arquivos:

```
/tmp/whatsapp-locks/
  whatsapp_user1.lock → "1234"
  whatsapp_user2.lock → "1235"

/var/www/whatsapp-sessions/
  whatsapp_user1/
    Default/
      Local Storage/
      Session Storage/
    tokens/
  whatsapp_user1__chrome/
    Default/
    Cache/
    SingletonLock (removido antes de cada start)
  
  whatsapp_user2/
    Default/
      Local Storage/
      Session Storage/
    tokens/
  whatsapp_user2__chrome/
    Default/
    Cache/
    SingletonLock (removido antes de cada start)
```

---

## 🚀 ESCALABILIDADE

### Capacidade Atual:

- **Usuários Simultâneos:** Ilimitado (depende apenas de recursos)
- **RAM por usuário:** ~300-500 MB (Chrome + Node + WPPConnect)
- **CPU por usuário:** ~5-10% (em idle)
- **Disco por usuário:** ~100-200 MB (perfil Chrome + tokens)

### Exemplo: 10 Usuários Conectados

```
Servidor com:
- 8 GB RAM → Suporta ~15 usuários confortavelmente
- 4 CPUs → Suficiente para 20+ usuários
- 20 GB Disco → Espaço para 50+ usuários

PM2 Processos:
  platefull-api (1 processo)
  whatsapp-user1 (1 processo)
  whatsapp-user2 (1 processo)
  whatsapp-user3 (1 processo)
  ...
  whatsapp-user10 (1 processo)
  
Total: 11 processos Node.js
Processos Chrome: ~20-30 (2-3 por usuário)
```

---

## 🔧 MANUTENÇÃO

### Comandos Úteis:

```bash
# Ver todos os workers ativos
pm2 list | grep whatsapp

# Ver logs de todos os workers
pm2 logs

# Ver logs de um usuário específico
pm2 logs whatsapp-user1

# Ver locks ativos
ls -lah /tmp/whatsapp-locks/

# Verificar processos Chrome
ps aux | grep chrome | grep whatsapp

# Limpar locks stale
bash scripts/cleanup-locks.sh

# Reset completo
bash scripts/reset-all-whatsapp.sh
```

### Monitoramento:

```bash
# Dashboard PM2
pm2 monit

# Uso de recursos por processo
pm2 list

# Logs em tempo real
pm2 logs --lines 100

# Verificar saúde do sistema
curl http://localhost:3001/health
```

---

## ✅ GARANTIAS FINAIS

1. ✅ **Isolamento Total:** Cada usuário é completamente independente
2. ✅ **Sem Conflitos:** Lock garante que não há dois processos para o mesmo usuário
3. ✅ **Sem Interferência:** Chrome de um usuário nunca afeta outro
4. ✅ **Escalável:** Sistema suporta quantos usuários a máquina aguentar
5. ✅ **Robusto:** Graceful shutdown e limpeza automática de locks stale
6. ✅ **Multi-Processo:** PM2 gerencia workers independentes
7. ✅ **Resiliente:** Reiniciar API não afeta workers ativos

