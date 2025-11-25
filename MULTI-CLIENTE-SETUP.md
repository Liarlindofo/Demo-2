# 🚀 SISTEMA MULTI-CLIENTE - GUIA COMPLETO

Sistema configurado para suportar múltiplos clientes, cada um com suas próprias credenciais e configurações armazenadas no banco de dados.

---

## ✅ ARQUITETURA MULTI-CLIENTE

### Conceito

Cada usuário pode ter:
- **Múltiplas APIs cadastradas** (Saipos, WhatsApp, etc)
- **Até 3 conexões WhatsApp por API**
- **Configurações independentes** por conexão
- **Credenciais salvas no banco** (não em variáveis de ambiente)

---

## 📋 ESTRUTURA DO BANCO DE DADOS

### Tabela `UserAPI`
```prisma
model UserAPI {
  id          String   @id @default(cuid())
  userId      String   // Usuário dono da API
  name        String   // Nome da conexão
  type        String   // 'saipos' ou 'whatsapp'
  apiKey      String   // Chave da API
  baseUrl     String?  // URL base (para Saipos)
  storeId     String   // ID único da loja
  status      String   // 'connected', 'disconnected', 'error'
  createdAt   DateTime
  updatedAt   DateTime
}
```

### Tabela `Client` (Backend WhatsApp)
```prisma
model Client {
  id              String    @id @default(cuid())
  name            String
  botName         String?
  storeType       String?
  basePrompt      Text?
  forbidden       Text?
  messageLimit    Int       @default(30)
  contextTime     Int       @default(60)
  botEnabled      Boolean   @default(true)
  sessions        Session[]
}
```

### Tabela `Session` (Backend WhatsApp)
```prisma
model Session {
  id        String   @id @default(cuid())
  clientId  String
  slot      Int      // 1, 2 ou 3
  status    String   @default("disconnected")
  qrCode    Text?
  client    Client   @relation(fields: [clientId], references: [id])
  
  @@unique([clientId, slot])
}
```

---

## 🔧 VARIÁVEIS DE AMBIENTE

### Frontend (`.env.local`)

```bash
# ===================================
# APENAS INFRAESTRUTURA
# ===================================

# URLs Públicas
NEXT_PUBLIC_APP_URL=https://platefull.com.br
NEXT_PUBLIC_BACKEND_URL=https://platefull.com.br
NEXT_PUBLIC_WHATSAPP_API_URL=https://platefull.com.br

# Banco de Dados
DATABASE_URL=postgresql://user:pass@host:5432/db

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=seu_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=sua_key
STACK_SECRET_SERVER_KEY=sua_secret

# OpenRouter (Global)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/chatgpt-4o-latest

# Email (Opcional)
RESEND_API_KEY=sua_key
```

**⚠️ NÃO INCLUIR:**
- ❌ `NEXT_PUBLIC_SAIPOS_API_KEY`
- ❌ `NEXT_PUBLIC_WHATSAPP_TOKEN`
- ❌ `NEXT_PUBLIC_WHATSAPP_PHONE_ID`
- ❌ Credenciais de APIs de terceiros

### Backend WhatsApp (`backend/.env`)

```bash
PORT=3001
NODE_ENV=production

DATABASE_URL=postgresql://user:pass@host:5432/drin_whatsapp

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/chatgpt-4o-latest

DRIN_API_KEY=chave_segura_backend
```

---

## 🔄 FLUXO DE DADOS

### 1. Cadastro de API pelo Usuário

```typescript
// O usuário cadastra uma API através da dashboard
POST /api/user-apis
{
  "name": "Minha Pizzaria",
  "type": "whatsapp",
  "apiKey": "chave_gerada_pelo_backend"
}

// Sistema cria registro no banco:
{
  "id": "cuid123",
  "userId": "user_abc",
  "name": "Minha Pizzaria",
  "type": "whatsapp",
  "storeId": "store_123",
  "apiKey": "key_xyz",
  "status": "disconnected"
}
```

### 2. Buscar APIs do Usuário

```typescript
// Frontend busca APIs do usuário logado
GET /api/user-apis

// Resposta:
[
  {
    "id": "cuid123",
    "name": "Minha Pizzaria",
    "type": "whatsapp",
    "storeId": "store_123",
    "apiKey": "key_xyz"
  },
  {
    "id": "cuid456",
    "name": "Meu Hamburgueria",
    "type": "saipos",
    "baseUrl": "https://data.saipos.io/v1",
    "apiKey": "saipos_key"
  }
]
```

### 3. Gerenciar Sessões WhatsApp

```typescript
// Buscar sessões de uma conexão específica
GET https://platefull.com.br/api/whatsapp/{storeId}/sessions
Headers: Authorization: Bearer {apiKey}

// Resposta:
{
  "data": [
    { "slot": 1, "status": "connected", "isActive": true },
    { "slot": 2, "status": "disconnected", "isActive": false },
    { "slot": 3, "status": "qrcode", "qrCode": "data:image/...", "isActive": false }
  ]
}
```

### 4. Iniciar Sessão (Gerar QR Code)

```typescript
POST https://platefull.com.br/api/whatsapp/{storeId}/{slot}/start
Headers: Authorization: Bearer {apiKey}

// Resposta:
{
  "success": true,
  "qrCode": "data:image/png;base64,..."
}
```

### 5. Configurar Bot

```typescript
// Buscar configurações
GET https://platefull.com.br/api/client/{storeId}/config
Headers: Authorization: Bearer {apiKey}

// Atualizar configurações
PUT https://platefull.com.br/api/client/{storeId}/config
Headers: Authorization: Bearer {apiKey}
Body: {
  "botName": "Maria",
  "storeType": "pizzaria",
  "basePrompt": "Você é um atendente...",
  "botEnabled": true,
  "messageLimit": 30,
  "contextTime": 60
}
```

---

## 📱 PÁGINAS DO FRONTEND

### `/connections` - Gerenciar Conexões WhatsApp

**Funcionalidades:**
- Lista todas as APIs WhatsApp do usuário
- Mostra status de cada sessão (3 por API)
- Gera QR Codes
- Conecta/desconecta sessões
- Multi-cliente: cada usuário vê apenas suas APIs

**Código:**
```typescript
// Busca APIs do usuário
const response = await fetch("/api/user-apis");
const apis = await response.json();
const whatsappAPIs = apis.filter(api => api.type === 'whatsapp');

// Para cada API, busca sessões
for (const api of whatsappAPIs) {
  const sessionsResponse = await fetch(
    `${API_URL}/api/whatsapp/${api.storeId}/sessions`,
    {
      headers: { Authorization: `Bearer ${api.apiKey}` }
    }
  );
}
```

### `/whatsapp-tools` - Configurar Bot

**Funcionalidades:**
- Seleciona qual conexão configurar
- Edita nome do bot, tipo de loja, prompt base
- Liga/desliga bot
- Configura tempo de contexto e limite de mensagens
- Salva tudo no banco (não em .env)

**Código:**
```typescript
// Seleciona conexão
const selectedConnection = apis.find(api => api.storeId === selectedId);

// Busca config
const config = await fetch(
  `${API_URL}/api/client/${selectedId}/config`,
  {
    headers: { Authorization: `Bearer ${selectedConnection.apiKey}` }
  }
);

// Salva alterações
await fetch(
  `${API_URL}/api/client/${selectedId}/config`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${selectedConnection.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  }
);
```

### `/dashboard` - Gerenciar APIs

**Funcionalidades:**
- Lista todas as APIs do usuário (Saipos e WhatsApp)
- Adiciona novas APIs
- Remove APIs
- Testa conexões
- Visualiza relatórios

---

## 🔐 SEGURANÇA

### Autenticação

1. **Usuário se autentica** via Stack Auth
2. **Frontend recebe** `userId` do usuário logado
3. **APIs são filtradas** por `userId` no banco
4. **Backend WhatsApp** valida `apiKey` em cada requisição

### Isolamento de Dados

- Cada usuário só vê suas próprias APIs
- `storeId` único por API garante isolamento
- Backend valida `apiKey` antes de executar ações
- Sessões WhatsApp isoladas por `storeId`

### Chaves API

- `apiKey` é gerada automaticamente ao criar API
- Armazenada no banco (não em .env)
- Passada no header `Authorization: Bearer {apiKey}`
- Validada pelo backend em cada requisição

---

## 🚀 DEPLOY

### 1. Deploy do Frontend (Vercel)

```bash
# Configurar variáveis de ambiente na Vercel
NEXT_PUBLIC_APP_URL=https://platefull.com.br
NEXT_PUBLIC_BACKEND_URL=https://platefull.com.br
NEXT_PUBLIC_WHATSAPP_API_URL=https://platefull.com.br
DATABASE_URL=postgresql://...
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/chatgpt-4o-latest
```

### 2. Deploy do Backend WhatsApp (VPS)

```bash
# Instalar dependências
cd /var/drin-backend
npm install

# Configurar .env
cat > .env << EOF
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/chatgpt-4o-latest
DRIN_API_KEY=chave_segura
EOF

# Rodar migrations
npx prisma migrate deploy

# Build
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Configurar Nginx

```nginx
# /etc/nginx/sites-available/whatsapp-api
server {
    server_name platefull.com.br www.platefull.com.br;
    
    location /api/whatsapp/ {
        proxy_pass http://127.0.0.1:3001/api/whatsapp/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/client/ {
        proxy_pass http://127.0.0.1:3001/api/client/;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }
}
```

### 4. Configurar SSL

```bash
sudo certbot --nginx -d platefull.com.br -d www.platefull.com.br
```

---

## ✅ CHECKLIST

### Configuração:
- [ ] `.env.local` criado com apenas infraestrutura
- [ ] Sem credenciais de APIs externas no .env
- [ ] Stack Auth configurado
- [ ] OpenRouter configurado (global)
- [ ] Banco de dados PostgreSQL configurado

### Frontend:
- [ ] `/connections` refatorado para multi-cliente
- [ ] `/whatsapp-tools` busca credenciais do banco
- [ ] APIs buscadas via `/api/user-apis`
- [ ] Chamadas WhatsApp usam `platefull.com.br`

### Backend:
- [ ] CORS configurado
- [ ] OpenRouter integrado
- [ ] Multi-cliente com `storeId`
- [ ] Sessões isoladas por cliente
- [ ] PM2 rodando na VPS

### Deploy:
- [ ] Frontend na Vercel
- [ ] Backend na VPS
- [ ] Nginx configurado
- [ ] SSL ativo
- [ ] Health check OK

---

## 🎉 RESULTADO FINAL

✅ Sistema completamente multi-cliente
✅ Credenciais no banco (não em .env)
✅ Cada usuário gerencia suas próprias APIs
✅ Até 3 WhatsApp por conexão
✅ Configurações independentes
✅ Deploy em produção

🚀 **Sistema pronto para produção!**

