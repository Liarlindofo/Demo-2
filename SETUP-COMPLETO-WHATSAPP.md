# 🚀 SETUP COMPLETO - WHATSAPP BACKEND + FRONTEND

Guia passo a passo para configurar completamente o sistema WhatsApp com platefull.com.br

---

## ✅ ETAPA 1: VARIÁVEIS DE AMBIENTE NO FRONTEND

### Criar arquivo `.env.local` na raiz do projeto:

```bash
# WhatsApp Backend API
NEXT_PUBLIC_WHATSAPP_API_URL=https://platefull.com.br
NEXT_PUBLIC_BACKEND_URL=https://platefull.com.br

# OpenRouter (IA)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/chatgpt-4o-latest

# API Key para autenticação
NEXT_PUBLIC_DRIN_API_KEY=sua_chave_api_aqui

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=seu_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=sua_key
STACK_SECRET_SERVER_KEY=sua_secret_key

# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/drin_platform

# App URL
NEXT_PUBLIC_APP_URL=https://platefull.com.br
```

**⚠️ IMPORTANTE**: 
- ✅ URL é `https://platefull.com.br` (sem `www.`)
- ❌ NÃO usar `localhost:3001`
- 🔑 Use a mesma `DRIN_API_KEY` no frontend e backend

---

## ✅ ETAPA 2: FRONTEND - ARQUIVOS ATUALIZADOS

Os seguintes arquivos já foram atualizados para usar `platefull.com.br`:

### ✅ `app/connections/page.tsx`
```typescript
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://www.platefull.com.br";
```

### ✅ `app/whatsapp-tools/page.tsx`
```typescript
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://www.platefull.com.br";
```

**Status**: ✅ COMPLETO - Nenhuma referência a localhost no frontend

---

## ✅ ETAPA 3: BACKEND - CONFIGURAÇÃO

### Criar arquivo `.env` dentro da pasta `backend/`:

```bash
# Backend - WhatsApp API
PORT=3001
NODE_ENV=production

# Database PostgreSQL
DATABASE_URL=postgresql://drin_user:SuaSenha@localhost:5432/drin_whatsapp

# OpenRouter (IA)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/chatgpt-4o-latest

# Chave de API para autenticação
DRIN_API_KEY=sua_chave_api_segura_aqui
```

### Verificações do Backend:

✅ **CORS configurado** (`backend/src/server.ts`):
```typescript
this.app.use(cors({
  origin: '*',
  credentials: true
}));
```

✅ **OpenRouter configurado** (`backend/src/config/env.ts`):
```typescript
openrouterApiKey: process.env.OPENROUTER_API_KEY!,
openrouterModel: process.env.OPENROUTER_MODEL || 'openai/chatgpt-4o-latest',
```

✅ **Rotas da API**:
- `GET /health` - Health check (sem autenticação)
- `GET /api/whatsapp/:clientId/sessions` - Listar sessões
- `POST /api/whatsapp/:clientId/:slot/start` - Iniciar sessão
- `DELETE /api/whatsapp/:clientId/:slot` - Desconectar
- `POST /api/whatsapp/:clientId/:slot/send` - Enviar mensagem
- `GET /api/client/:clientId/config` - Config do cliente
- `POST /api/chatbot/:clientId/test` - Testar chatbot

---

## ✅ ETAPA 4: DEPLOY NA VPS

### 4.1. Executar script de instalação:
```bash
chmod +x install_bot.sh
sudo ./install_bot.sh
```

### 4.2. Copiar arquivos:
```bash
cp -r backend/* /var/drin-backend/
cd /var/drin-backend
```

### 4.3. Instalar dependências:
```bash
npm install
npx prisma migrate deploy
npm run build
```

### 4.4. Iniciar com PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ✅ ETAPA 5: CONFIGURAR NGINX

### 5.1. Copiar configuração:
```bash
sudo cp whatsapp-api.nginx.conf /etc/nginx/sites-available/whatsapp-api
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
```

### 5.2. Testar e reiniciar:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 5.3. Configurar SSL:
```bash
sudo certbot --nginx -d platefull.com.br -d www.platefull.com.br
```

---

## ✅ ETAPA 6: TESTAR INTEGRAÇÃO

### 6.1. Testar backend:
```bash
curl https://platefull.com.br/health
```

Resposta esperada:
```json
{
  "success": true,
  "message": "DRIN WhatsApp Backend is running",
  "timestamp": "2025-11-21T..."
}
```

### 6.2. Testar no frontend:

1. Acesse: `https://platefull.com.br/connections`
2. Verifique se carrega as 3 conexões WhatsApp
3. Clique em "Gerar QR Code"
4. Verifique se o QR Code é gerado

---

## ✅ ETAPA 7: CONFIGURAÇÕES FINAIS

### 7.1. Configurar CLIENT_ID

Nos arquivos `app/connections/page.tsx` e `app/whatsapp-tools/page.tsx`:

```typescript
// Substituir:
const CLIENT_ID = "your_client_id";

// Por:
const CLIENT_ID = "seu_client_id_real";
```

**Como obter o CLIENT_ID:**
```bash
# Via API (criar cliente)
curl -X POST https://platefull.com.br/api/client \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meu Cliente",
    "botName": "Maria",
    "storeType": "pizzaria"
  }'
```

### 7.2. Gerar chave API segura:

```bash
# No terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use essa chave em:
- Frontend: `NEXT_PUBLIC_DRIN_API_KEY`
- Backend: `DRIN_API_KEY`

---

## 🔧 COMANDOS ÚTEIS

### Reiniciar serviços:
```bash
# Frontend (desenvolvimento)
npm run dev

# Backend (PM2)
pm2 restart drin-whatsapp-backend

# Nginx
sudo systemctl restart nginx
```

### Ver logs:
```bash
# Backend
pm2 logs drin-whatsapp-backend

# Nginx
tail -f /var/log/nginx/whatsapp-api.error.log
```

### Verificar status:
```bash
# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Failed to fetch"
- ✅ Verifique se o backend está rodando: `curl https://platefull.com.br/health`
- ✅ Verifique CORS no backend
- ✅ Verifique se a API_KEY está correta
- ✅ Verifique logs do Nginx

### Erro: "Unauthorized"
- ✅ Verifique se `NEXT_PUBLIC_DRIN_API_KEY` está configurada
- ✅ Verifique se a chave é a mesma no frontend e backend
- ✅ Verifique o header Authorization: `Bearer SUA_CHAVE`

### Erro: "Database connection failed"
- ✅ Verifique se PostgreSQL está rodando
- ✅ Verifique `DATABASE_URL` no .env
- ✅ Teste conexão: `psql -U drin_user -d drin_whatsapp`

### QR Code não aparece
- ✅ Verifique logs do PM2
- ✅ Verifique se Chrome/Chromium está instalado
- ✅ Verifique permissões da pasta `src/sessions`

---

## 📋 CHECKLIST FINAL

### Frontend:
- [ ] `.env.local` criado com todas as variáveis
- [ ] `NEXT_PUBLIC_BACKEND_URL=https://platefull.com.br`
- [ ] `NEXT_PUBLIC_DRIN_API_KEY` configurada
- [ ] Servidor rodando: `npm run dev`
- [ ] Página `/connections` carrega corretamente

### Backend:
- [ ] `.env` criado em `backend/`
- [ ] `DRIN_API_KEY` configurada (mesma do frontend)
- [ ] `OPENROUTER_API_KEY` configurada
- [ ] Dependências instaladas: `npm install`
- [ ] Build executado: `npm run build`
- [ ] PM2 rodando: `pm2 status`
- [ ] Health check OK: `curl https://platefull.com.br/health`

### Nginx:
- [ ] Configuração copiada para `/etc/nginx/sites-available/`
- [ ] Link simbólico criado em `/etc/nginx/sites-enabled/`
- [ ] Teste passou: `nginx -t`
- [ ] SSL configurado com Certbot
- [ ] HTTPS funcionando

### Integração:
- [ ] Frontend consegue chamar `/health`
- [ ] Frontend consegue chamar `/api/whatsapp/:clientId/sessions`
- [ ] QR Code é gerado corretamente
- [ ] Conexão WhatsApp funciona

---

## 🎉 PRÓXIMOS PASSOS

Após tudo configurado:

1. **Criar um cliente** via API
2. **Gerar QR Codes** para as 3 conexões
3. **Conectar WhatsApp** escaneando os QR Codes
4. **Configurar o bot** em `/whatsapp-tools`
5. **Testar envio de mensagens**

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- 📄 `ENV-EXAMPLE.md` - Exemplos de variáveis de ambiente
- 📄 `DEPLOY-WHATSAPP-VPS.md` - Guia detalhado de deploy
- 📄 `backend/README.md` - Documentação do backend
- 📄 `WHATSAPP-SAAS-GUIDE.md` - Guia completo do sistema

---

## ✅ RESULTADO FINAL

Após seguir todos os passos:

- ✅ Frontend: `https://platefull.com.br/connections`
- ✅ Backend: `https://platefull.com.br/api/whatsapp/...`
- ✅ Health Check: `https://platefull.com.br/health`
- ✅ SSL: Certificado válido
- ✅ PM2: Auto-restart configurado
- ✅ Nginx: Proxy reverso funcionando
- ✅ WhatsApp: 3 conexões disponíveis

🎊 **Sistema 100% funcional em produção!**

