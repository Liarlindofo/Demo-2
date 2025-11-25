# 🌐 Deploy na VPS - Guia Completo

## Pré-requisitos

- VPS com Ubuntu 20.04+ (recomendado: DigitalOcean, Vultr, AWS EC2)
- Acesso SSH root
- Domínio (opcional, mas recomendado)

## Passo a Passo Completo

### 1️⃣ Conecte na VPS

```bash
ssh root@SEU_IP
```

### 2️⃣ Atualize o sistema

```bash
apt update && apt upgrade -y
```

### 3️⃣ Instale Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v  # Deve mostrar v18.x
```

### 4️⃣ Instale PM2

```bash
npm install -g pm2
```

### 5️⃣ Instale Git (se necessário)

```bash
apt install -y git
```

### 6️⃣ Clone o projeto

```bash
cd /var/www
git clone https://github.com/seu-usuario/platefull-bot.git
cd platefull-bot
```

### 7️⃣ Instale dependências

```bash
npm install --production
```

### 8️⃣ Configure .env

```bash
nano .env
```

Cole (substitua com seus valores):

```env
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
OPENROUTER_API_KEY="sk-or-v1-..."
PORT=3001
JWT_SECRET="cole-um-secret-forte-aqui"
NODE_ENV=production
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

### 9️⃣ Configure Prisma

```bash
npx prisma generate
npx prisma migrate deploy
```

### 🔟 Inicie com PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Execute o comando que aparecer (sudo ...)
```

### ✅ Verifique

```bash
pm2 status
pm2 logs platefull-bot
curl http://localhost:3001/api/health
```

## 🌐 Configurar Nginx + SSL (Recomendado)

### 1. Instale Nginx

```bash
apt install -y nginx
```

### 2. Crie configuração

```bash
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
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Ative

```bash
ln -s /etc/nginx/sites-available/platefull-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 4. Configure DNS

No seu provedor de domínio, adicione registro A:

```
Tipo: A
Nome: bot
Valor: IP_DA_VPS
TTL: 3600
```

### 5. SSL com Certbot

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d bot.platefull.com.br
# Siga as instruções
```

## 🔥 Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

## 📝 Comandos Úteis

```bash
# Ver logs
pm2 logs platefull-bot

# Ver logs em tempo real
pm2 logs platefull-bot --lines 100

# Reiniciar
pm2 restart platefull-bot

# Parar
pm2 stop platefull-bot

# Ver status
pm2 status

# Ver uso de recursos
pm2 monit

# Limpar logs antigos
pm2 flush
```

## 🔄 Atualizar Bot

```bash
cd /var/www/platefull-bot
git pull
npm install --production
npx prisma generate
npx prisma migrate deploy
pm2 restart platefull-bot
```

## 🛡️ Segurança Adicional

### Desabilitar login root

```bash
nano /etc/ssh/sshd_config
# Mude: PermitRootLogin no
systemctl restart sshd
```

### Criar usuário não-root

```bash
adduser platefull
usermod -aG sudo platefull
su - platefull
```

### Fail2Ban (proteção contra brute force)

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## 📊 Monitoramento

### PM2 Plus (opcional)

```bash
pm2 link <secret> <public>
# Obtenha keys em: https://app.pm2.io
```

### Ver uso de recursos

```bash
pm2 monit
# ou
htop
```

## 🔧 Troubleshooting

### Bot não inicia

```bash
pm2 logs platefull-bot --err
# Verifique erros
```

### Erro de memória

Aumente limite no ecosystem.config.cjs:

```javascript
max_memory_restart: '1G'  // ao invés de 500M
```

### Porta em uso

```bash
lsof -i :3001
# Mate processo:
kill -9 PID
```

### Chrome/Puppeteer não funciona

```bash
# Instale dependências
apt install -y \
  chromium-browser \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libcups2 \
  libxss1 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgtk-3-0
```

## 💰 Otimização de Custos

### VPS Recomendadas

- **DigitalOcean**: $6/mês (Basic Droplet)
- **Vultr**: $6/mês
- **Contabo**: €5/mês
- **Hetzner**: €4/mês

### Requisitos mínimos

- 1 vCPU
- 2GB RAM (recomendado)
- 25GB SSD
- Ubuntu 20.04+

## 🚀 Pronto!

Seu bot está rodando em:
- HTTP: `http://SEU_IP:3001`
- HTTPS: `https://bot.platefull.com.br`

Teste:
```bash
curl https://bot.platefull.com.br/api/health
```

---

**Precisa de ajuda?** Consulte o README.md principal.

