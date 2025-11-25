# 🔐 VARIÁVEIS DE AMBIENTE - DRIN PLATFORM

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# ===================================
# VARIÁVEIS DE AMBIENTE - FRONTEND
# ===================================

# Stack Auth (Autenticação)
NEXT_PUBLIC_STACK_PROJECT_ID=
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=
STACK_SECRET_SERVER_KEY=

# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/drin_platform

# WhatsApp Backend API
NEXT_PUBLIC_WHATSAPP_API_URL=https://platefull.com.br
NEXT_PUBLIC_BACKEND_URL=https://platefull.com.br

# OpenRouter (IA)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/chatgpt-4o-latest

# API Key para autenticação do backend
NEXT_PUBLIC_DRIN_API_KEY=sua_chave_api_aqui

# App URL
NEXT_PUBLIC_APP_URL=https://platefull.com.br

# Email (Resend)
RESEND_API_KEY=
```

---

## 🔧 Backend (pasta `backend/`)

Crie um arquivo `.env` dentro da pasta `backend/` com:

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

---

## ⚠️ IMPORTANTE

1. **Nunca commite arquivos `.env` no Git!**
2. A URL do backend deve ser `https://platefull.com.br` (sem localhost)
3. Use a mesma `DRIN_API_KEY` no frontend e backend
4. Reinicie o servidor após alterar as variáveis de ambiente

