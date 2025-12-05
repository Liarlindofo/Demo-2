# 🚀 DEPLOY DO WHATSAPP BACKEND NA VPS

Guia completo para deploy do backend do WhatsApp na VPS com domínio `platefull.com.br`.

---

## 📋 PRÉ-REQUISITOS

- VPS Ubuntu/Debian
- Acesso root ou sudo
- Domínio `platefull.com.br` apontando para o IP da VPS
- PostgreSQL instalado e configurado

---

## 🔧 ETAPA 1: EXECUTAR SCRIPT DE INSTALAÇÃO

```bash
# Tornar o script executável
chmod +x install_bot.sh

# Executar como root
sudo ./install_bot.sh
```

---

## 📦 ETAPA 2: COPIAR ARQUIVOS DO BACKEND

```bash
# Copiar pasta backend para /var/drin-backend
cd /var
cp -r /caminho/para/drin-platform/backend/* /var/drin-backend/

# Ou fazer upload via SCP/FTP
```

---

## ⚙️ ETAPA 3: CONFIGURAR VARIÁVEIS DE AMBIENTE

```bash
cd /var/drin-backend

# Criar arquivo .env
nano .env
```

Conteúdo do `.env`:

```bash
# Backend - WhatsApp API
PORT=3001
NODE_ENV=production

# Database PostgreSQL
DATABASE_URL=postgresql://drin_user:SuaSenhaSegura123!@localhost:5432/drin_whatsapp

# OpenRouter (IA)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/chatgpt-4o-latest

# Chave de API para autenticação
DRIN_API_KEY=sua_chave_api_segura_aqui
```

**⚠️ IMPORTANTE**: Gere uma chave API segura e use a mesma no frontend!

---

## 📥 ETAPA 4: INSTALAR DEPENDÊNCIAS

```bash
cd /var/drin-backend

# Instalar dependências
npm install

# Executar migrations do Prisma
npx prisma migrate deploy

# Build do projeto TypeScript
npm run build
```

---

## 🚀 ETAPA 5: INICIAR COM PM2

```bash
cd /var/drin-backend

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup

# Verificar status
pm2 status
pm2 logs drin-whatsapp-backend
```

---

## 🌐 ETAPA 6: CONFIGURAR NGINX

```bash
# Copiar configuração
sudo cp whatsapp-api.nginx.conf /etc/nginx/sites-available/whatsapp-api

# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 ETAPA 7: CONFIGURAR SSL COM CERTBOT

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d platefull.com.br -d www.platefull.com.br

# Renovação automática (já configurada automaticamente)
sudo certbot renew --dry-run
```

---

## ✅ ETAPA 8: TESTAR API

```bash
# Testar health check
curl https://platefull.com.br/health

# Deve retornar:
# {
#   "success": true,
#   "message": "DRIN WhatsApp Backend is running",
#   "timestamp": "..."
# }
```

---

## 🔧 COMANDOS ÚTEIS

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs drin-whatsapp-backend

# Reiniciar aplicação
pm2 restart drin-whatsapp-backend

# Parar aplicação
pm2 stop drin-whatsapp-backend

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs do Nginx
tail -f /var/log/nginx/whatsapp-api.error.log
```

---

## 🐛 TROUBLESHOOTING

### Erro de conexão com banco de dados

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar se usuário e banco existem
sudo -u postgres psql -c "\du"
sudo -u postgres psql -c "\l"
```

### Erro de permissões

```bash
# Ajustar permissões
sudo chown -R $USER:$USER /var/drin-backend
chmod -R 755 /var/drin-backend
```

### Porta 3001 já em uso

```bash
# Ver processo na porta 3001
sudo lsof -i :3001

# Matar processo
sudo kill -9 <PID>
```

### Nginx não inicia

```bash
# Verificar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 ATUALIZAÇÃO DO BACKEND

```bash
cd /var/drin-backend

# Fazer backup (opcional)
cp -r /var/drin-backend /var/drin-backend-backup-$(date +%Y%m%d)

# Atualizar código
# (via git pull, scp, ftp, etc)

# Instalar dependências
npm install

# Rodar migrations
npx prisma migrate deploy

# Build
npm run build

# Reiniciar
pm2 restart drin-whatsapp-backend

# Verificar
pm2 logs drin-whatsapp-backend
```

---

## 📊 MONITORAMENTO

```bash
# Monitoramento em tempo real com PM2
pm2 monit

# Ver métricas
pm2 info drin-whatsapp-backend

# Ver uso de recursos
pm2 status
```

---

## 🔐 SEGURANÇA

1. **Firewall**: Configure o firewall para permitir apenas portas 80, 443 e 22
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Chaves API**: Use chaves seguras e nunca compartilhe
3. **Atualizações**: Mantenha o sistema e dependências atualizados
```bash
sudo apt update && sudo apt upgrade -y
```

4. **Backups**: Configure backups regulares do banco de dados
```bash
# Backup manual
pg_dump -U drin_user -d drin_whatsapp > backup_$(date +%Y%m%d).sql
```

---

## ✅ CHECKLIST FINAL

- [ ] Backend rodando em https://platefull.com.br/health
- [ ] PM2 configurado para iniciar no boot
- [ ] SSL configurado e funcionando
- [ ] Nginx configurado corretamente
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Logs sendo gerados corretamente
- [ ] Firewall configurado
- [ ] Chaves API seguras

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique os logs: `pm2 logs drin-whatsapp-backend`
2. Verifique o Nginx: `sudo tail -f /var/log/nginx/whatsapp-api.error.log`
3. Teste o health check: `curl https://platefull.com.br/health`

