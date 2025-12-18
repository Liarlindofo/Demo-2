# 🤖 Platefull WhatsApp Bot

Bot WhatsApp multi-usuário com integração GPT-4o via OpenRouter. Sistema totalmente isolado por usuário com suporte a conexões simultâneas.

## 📋 Características

- ✅ **Multi-usuário REAL**: Múltiplos usuários conectam simultaneamente sem conflitos
- ✅ **Isolamento Total**: Cada usuário tem seu próprio Chrome e processo isolado
- ✅ **Lock por Usuário**: Sistema de locks impede conflitos e "browser already running"
- ✅ **GPT-4o**: Integração com OpenAI GPT-4o via OpenRouter
- ✅ **PostgreSQL**: Banco de dados via Prisma (Neon)
- ✅ **QR Code**: Geração e exposição via API com isolamento por usuário
- ✅ **Sessões persistentes**: Sessões salvas no banco e disco (reutilizáveis)
- ✅ **API REST**: Controle total via HTTP
- ✅ **Configurável**: Prompt base, limites, personalidade por usuário
- ✅ **PM2**: Workers isolados e independentes por usuário
- ✅ **Graceful Shutdown**: Limpeza automática de recursos ao encerrar

## 🏗️ Arquitetura

```
/src
  /wpp
    index.js            # Gerenciamento de clientes WPPConnect (com lock e isolamento)
    sessionManager.js   # Gerenciamento de sessões em memória
    qrHandler.js        # Manipulação de QR Codes
  /ai
    chat.js             # Integração com GPT-4o (OpenRouter)
  /server
    router.js           # Rotas da API
    api.js              # Controllers
  /services
    pm2.service.js      # Gerenciamento de workers PM2
  /db
    index.js            # Cliente Prisma
    models.js           # Models e queries
  /utils
    logger.js           # Sistema de logs
/workers
  whatsapp-worker.js    # Worker isolado por usuário
/scripts
  cleanup-locks.sh      # Limpar locks stale
  test-multi-user.sh    # Testar multi-usuário
  reset-all-whatsapp.sh # Reset completo
config.js               # Configurações gerais
index.js                # Servidor principal (API)
```

### 🔐 Arquitetura Multi-Usuário

**Cada usuário tem:**
- ✅ 1 worker PM2 isolado (`whatsapp-<userId>`)
- ✅ 1 processo Chrome isolado (`/var/www/whatsapp-sessions/whatsapp_<userId>__chrome/`)
- ✅ 1 lock de sistema (`/tmp/whatsapp-locks/whatsapp_<userId>.lock`)
- ✅ Porta de debug aleatória (evita conflitos)
- ✅ Sessão persistente (tokens reutilizáveis)

**Garantias:**
- ❌ NUNCA um usuário afeta outro
- ❌ NUNCA compartilha Chrome entre usuários
- ❌ NUNCA permite dois processos para o mesmo usuário
- ✅ Múltiplos usuários conectam simultaneamente
- ✅ QR codes isolados por usuário
- ✅ Graceful shutdown com limpeza automática

📖 **Documentação completa:** Veja `COMECE-AQUI.txt`

## 🚀 Instalação Local

### 1. Pré-requisitos

- Node.js >= 18
- PostgreSQL (recomendado: Neon)
- Conta OpenRouter com API Key

### 2. Clone e instale

```bash
# Clone o repositório
git clone <seu-repo>
cd platefull-whatsapp-bot

# Instale dependências
npm install
```

### 3. Configure variáveis de ambiente

Crie arquivo `.env` na raiz:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
OPENROUTER_API_KEY="sk-or-v1-..."
PORT=3001
JWT_SECRET="seu-secret-super-seguro"
NODE_ENV=development
```

### 4. Configure o banco de dados

```bash
# Gera cliente Prisma
npm run db:generate

# Executa migrations
npm run db:migrate
```

### 5. Execute

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

O servidor estará disponível em `http://localhost:3001`

## 🌐 Deploy na VPS

### 1. Prepare a VPS

```bash
# Conecte via SSH
ssh root@seu-servidor.com

# Atualize o sistema
apt update && apt upgrade -y

# Instale Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instale PM2 globalmente
npm install -g pm2

# Instale Git (se necessário)
apt install -y git
```

### 2. Clone o projeto

```bash
# Navegue para diretório
cd /var/www

# Clone
git clone <seu-repo> platefull-bot
cd platefull-bot
```

### 3. Instale dependências

```bash
npm install --production
```

### 4. Configure .env na VPS

```bash
nano .env
```

Cole suas variáveis de ambiente (DATABASE_URL, OPENROUTER_API_KEY, etc.)

```env
DATABASE_URL="postgresql://..."
OPENROUTER_API_KEY="sk-or-v1-..."
PORT=3001
JWT_SECRET="seu-secret-super-seguro"
NODE_ENV=production
```

Salve (Ctrl+O) e saia (Ctrl+X).

### 5. Configure Prisma

```bash
# Gera cliente
npx prisma generate

# Executa migrations em produção
npx prisma migrate deploy
```

### 6. Inicie com PM2

```bash
# Inicia aplicação
pm2 start index.js --name platefull-bot

# Salva configuração do PM2
pm2 save

# Configura PM2 para iniciar no boot
pm2 startup

# Execute o comando que PM2 mostrar (geralmente começa com sudo)
```

### 7. Comandos úteis PM2

```bash
# Ver logs
pm2 logs platefull-bot

# Ver status
pm2 status

# Reiniciar
pm2 restart platefull-bot

# Parar
pm2 stop platefull-bot

# Remover
pm2 delete platefull-bot
```

### 8. Configurar Firewall (Opcional)

```bash
# Permite porta 3001
ufw allow 3001/tcp

# Habilita firewall
ufw enable
```

### 9. Nginx Reverse Proxy (Recomendado)

Se quiser expor via domínio:

```bash
# Instale Nginx
apt install -y nginx

# Crie configuração
nano /etc/nginx/sites-available/platefull-bot
```

Cole:

```nginx
server {
    listen 80;
    server_name bot.platefull.com.br;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Ative e reinicie:

```bash
ln -s /etc/nginx/sites-available/platefull-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 10. SSL com Certbot (Recomendado)

```bash
# Instale Certbot
apt install -y certbot python3-certbot-nginx

# Obtenha certificado
certbot --nginx -d bot.platefull.com.br

# Auto-renovação (já configurada automaticamente)
```

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

### Status das Conexões
```http
GET /api/status/:userId
```

Resposta:
```json
{
  "success": true,
  "userId": "xyz",
  "connections": [
    {
      "slot": 1,
      "isConnected": true,
      "connectedNumber": "5511999999999",
      "qrCode": null,
      "state": "connected"
    },
    {
      "slot": 2,
      "isConnected": false,
      "connectedNumber": null,
      "qrCode": "data:image/png;base64,...",
      "state": "waiting_qr"
    }
  ]
}
```

### Obter QR Code
```http
GET /api/qr/:userId/:slot
```

### Iniciar Conexão
```http
POST /api/start/:userId/:slot
```

### Parar Conexão
```http
POST /api/stop/:userId/:slot
```

### Obter Configurações
```http
GET /api/settings/:userId
```

### Atualizar Configurações
```http
POST /api/settings/:userId
Content-Type: application/json

{
  "botName": "Assistente",
  "storeType": "pizzaria",
  "contextLimit": 10,
  "lineLimit": 8,
  "basePrompt": "Você é um atendente de pizzaria...",
  "isActive": true
}
```

## 🔧 Configurações do Bot

### BotSettings

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `botName` | String | "Assistente" | Nome do bot |
| `storeType` | String | null | Tipo de loja (pizzaria, mercado, etc.) |
| `contextLimit` | Int | 10 | Máximo de mensagens anteriores no contexto |
| `lineLimit` | Int | 8 | Máximo de linhas na resposta |
| `basePrompt` | String | null | Prompt base customizado |
| `isActive` | Boolean | true | Se o bot está ativo |

## 🧪 Testes

### Teste local

```bash
# Inicie o servidor
npm start

# Em outro terminal, teste endpoints
curl http://localhost:3001/api/health
```

### Teste na VPS

```bash
curl http://seu-servidor:3001/api/health
```

## 📝 Logs

Logs coloridos e estruturados:

- 🔵 **INFO**: Informações gerais
- 🟢 **SUCCESS**: Operações bem-sucedidas
- 🟡 **WARN**: Avisos
- 🔴 **ERROR**: Erros
- 🟣 **DEBUG**: Debug (apenas em desenvolvimento)
- 🔷 **WPP**: Operações do WhatsApp
- 🟪 **AI**: Operações da IA

## 🛠️ Troubleshooting

### Erro ao conectar no banco

```bash
# Verifique se DATABASE_URL está correta
echo $DATABASE_URL

# Teste conexão Prisma
npx prisma db pull
```

### WPPConnect não conecta

- Verifique se Chrome/Chromium está instalado na VPS
- Adicione mais args no puppeteer (config.js)
- Verifique logs: `pm2 logs platefull-bot`

### QR Code não aparece

- Verifique banco de dados
- Consulte endpoint `/api/qr/:userId/:slot`
- Veja logs do bot

### Bot não responde mensagens

- Verifique se `isActive = true`
- Verifique OPENROUTER_API_KEY
- Veja logs de erro

## 📦 Estrutura do Banco

### User
- id, email, name
- Relacionamento: whatsappBots[], botSettings

### WhatsAppBot
- id, userId, slot (1 ou 2)
- sessionJson, connectedNumber, isConnected, qrCode

### BotSettings
- id, userId
- botName, storeType, contextLimit, lineLimit
- basePrompt, isActive

## 🔐 Segurança

- Use sempre HTTPS em produção
- Configure CORS adequadamente
- Use JWT_SECRET forte
- Mantenha dependências atualizadas
- Use PostgreSQL com SSL
- Não exponha .env

## 📞 Suporte

Para dúvidas ou problemas, entre em contato:
- Email: contato@platefull.com.br
- Site: https://platefull.com.br

## 📄 Licença

ISC License - Platefull © 2024

---

**Desenvolvido com ❤️ para Platefull**
