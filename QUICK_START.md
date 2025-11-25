# 🚀 Quick Start - Platefull WhatsApp Bot

## Instalação Rápida (5 minutos)

### 1. Clone e instale

```bash
git clone <seu-repo>
cd platefull-whatsapp-bot
npm install
```

### 2. Configure .env

Crie arquivo `.env`:

```env
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
OPENROUTER_API_KEY="sk-or-v1-..."
PORT=3001
JWT_SECRET="seu-secret-aqui"
NODE_ENV=production
```

### 3. Configure banco

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Inicie

```bash
# Local
npm start

# VPS com PM2
pm2 start ecosystem.config.cjs
pm2 save
```

## 📡 Teste a API

```bash
# Health check
curl http://localhost:3001/api/health

# Criar configurações para usuário
curl -X POST http://localhost:3001/api/settings/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"botName":"Meu Bot","isActive":true}'

# Iniciar WhatsApp slot 1
curl -X POST http://localhost:3001/api/start/USER_ID/1

# Ver QR Code
curl http://localhost:3001/api/qr/USER_ID/1

# Ver status
curl http://localhost:3001/api/status/USER_ID
```

## 🔧 Comandos Úteis

```bash
# Ver logs (PM2)
pm2 logs platefull-bot

# Reiniciar
pm2 restart platefull-bot

# Ver Prisma Studio
npx prisma studio

# Migrations
npm run db:migrate

# Desenvolvimento com auto-reload
npm run dev
```

## 🎯 Fluxo Básico de Uso

1. **Crie usuário** (automático ao fazer primeira requisição)
2. **Configure bot** via `POST /api/settings/:userId`
3. **Inicie conexão** via `POST /api/start/:userId/:slot`
4. **Escaneie QR** obtido em `GET /api/qr/:userId/:slot`
5. **Pronto!** Bot vai responder mensagens automaticamente

## 📱 Integração com Frontend

No seu site Platefull, faça:

```javascript
// Inicia conexão
const response = await fetch('https://bot.platefull.com.br/api/start/USER_ID/1', {
  method: 'POST'
});

// Busca QR Code
const qr = await fetch('https://bot.platefull.com.br/api/qr/USER_ID/1');
const data = await qr.json();

// Exibe QR Code
<img src={data.qrCode} alt="Escaneie com WhatsApp" />

// Verifica status (polling a cada 5s)
setInterval(async () => {
  const status = await fetch('https://bot.platefull.com.br/api/status/USER_ID');
  const data = await status.json();
  
  if (data.connections[0].state === 'connected') {
    console.log('Conectado!', data.connections[0].connectedNumber);
  }
}, 5000);
```

## 🆘 Problemas Comuns

### Bot não conecta
- Verifique logs: `pm2 logs`
- Tente reiniciar: `pm2 restart platefull-bot`

### QR Code não aparece
- Aguarde 10-15 segundos após iniciar
- Verifique banco de dados

### Bot não responde
- Verifique `isActive = true`
- Verifique OPENROUTER_API_KEY
- Veja saldo da API Key em openrouter.ai

### Erro 500 nas rotas
- Verifique DATABASE_URL
- Execute migrations: `npx prisma migrate deploy`

## 🔗 Links Úteis

- PostgreSQL Neon: https://neon.tech
- OpenRouter: https://openrouter.ai
- Prisma Docs: https://prisma.io
- WPPConnect: https://github.com/wppconnect-team/wppconnect

---

✅ **Pronto para produção!**

