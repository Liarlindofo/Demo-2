# ✅ Checklist de Instalação - Platefull WhatsApp Bot

Use este checklist para garantir que tudo foi configurado corretamente.

## 📋 Pré-Requisitos

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL configurado (ou conta Neon)
- [ ] Conta OpenRouter com API Key
- [ ] Git instalado (para deploy)

## 🔧 Configuração Local

### 1. Dependências

- [ ] Executado `npm install`
- [ ] Todas as dependências instaladas sem erros
- [ ] Versão Node.js compatível (`node -v`)

### 2. Banco de Dados

- [ ] Arquivo `.env` criado
- [ ] `DATABASE_URL` configurada corretamente
- [ ] Executado `npx prisma generate`
- [ ] Executado `npx prisma migrate deploy`
- [ ] Migrations aplicadas sem erros
- [ ] (Opcional) Testado com `npx prisma studio`

### 3. OpenRouter

- [ ] Conta criada em https://openrouter.ai
- [ ] API Key gerada
- [ ] `OPENROUTER_API_KEY` adicionada ao `.env`
- [ ] Créditos disponíveis na conta

### 4. Variáveis de Ambiente

Verifique se seu `.env` contém:

```env
✅ DATABASE_URL="postgresql://..."
✅ OPENROUTER_API_KEY="sk-or-v1-..."
✅ PORT=3001
✅ JWT_SECRET="..."
✅ NODE_ENV=production
```

### 5. Teste Local

- [ ] Servidor inicia sem erros (`npm start`)
- [ ] Health check funciona: `curl http://localhost:3001/api/health`
- [ ] Porta 3001 está livre (ou mudou PORT no .env)
- [ ] Logs aparecem corretamente no terminal

### 6. Teste de API

Execute: `bash test-bot.sh`

- [ ] Health check: ✓
- [ ] Criar configurações: ✓
- [ ] Buscar configurações: ✓
- [ ] Status do usuário: ✓

## 🌐 Deploy na VPS

### 1. Preparação da VPS

- [ ] VPS contratada (DigitalOcean, Vultr, AWS, etc.)
- [ ] Ubuntu 20.04+ instalado
- [ ] Acesso SSH funcionando
- [ ] Domínio configurado (opcional)

### 2. Instalação no Servidor

- [ ] Node.js 18+ instalado
- [ ] PM2 instalado globalmente
- [ ] Git instalado
- [ ] Projeto clonado em `/var/www/platefull-bot`

### 3. Configuração no Servidor

- [ ] `.env` criado com valores de produção
- [ ] `npm install --production` executado
- [ ] `npx prisma generate` executado
- [ ] `npx prisma migrate deploy` executado

### 4. PM2

- [ ] Bot iniciado com `pm2 start ecosystem.config.cjs`
- [ ] Status OK: `pm2 status`
- [ ] Logs sem erros: `pm2 logs platefull-bot`
- [ ] `pm2 save` executado
- [ ] `pm2 startup` configurado

### 5. Firewall

- [ ] Porta 3001 liberada (se necessário)
- [ ] SSH (porta 22) liberada
- [ ] HTTP (porta 80) liberada (se usar Nginx)
- [ ] HTTPS (porta 443) liberada (se usar Nginx)

### 6. Nginx + SSL (Opcional mas Recomendado)

- [ ] Nginx instalado
- [ ] Configuração criada em `/etc/nginx/sites-available/`
- [ ] Link simbólico criado em `/etc/nginx/sites-enabled/`
- [ ] `nginx -t` passa sem erros
- [ ] Nginx reiniciado
- [ ] Certbot instalado
- [ ] Certificado SSL obtido
- [ ] Auto-renovação configurada

## 🧪 Testes de Produção

### API Endpoints

Substitua `bot.platefull.com.br` pelo seu domínio/IP:

- [ ] Health: `curl https://bot.platefull.com.br/api/health`
- [ ] Status: `curl https://bot.platefull.com.br/api/status/test-user`
- [ ] Criar config: `curl -X POST https://bot.platefull.com.br/api/settings/test-user -H "Content-Type: application/json" -d '{"botName":"Test"}'`

### WhatsApp

- [ ] Iniciar conexão: `POST /api/start/:userId/1`
- [ ] QR Code gerado e salvo no banco
- [ ] QR Code acessível via: `GET /api/qr/:userId/1`
- [ ] QR Code escaneado com WhatsApp
- [ ] Status muda para "connected"
- [ ] Bot responde mensagens recebidas
- [ ] Respostas usam GPT-4o corretamente

## 🔗 Integração com Frontend

### Platefull.com.br

- [ ] CORS configurado para `https://platefull.com.br`
- [ ] Frontend consegue chamar API do bot
- [ ] QR Code exibido corretamente na tela
- [ ] Status atualiza em tempo real (polling)
- [ ] Botões de conectar/desconectar funcionam
- [ ] Ambos os slots (1 e 2) funcionam

## 📊 Monitoramento

### Logs

- [ ] Logs aparecem corretamente
- [ ] Sem erros críticos
- [ ] Mensagens processadas aparecem nos logs
- [ ] Erros são tratados adequadamente

### Performance

- [ ] Uso de memória OK (< 500MB por padrão)
- [ ] CPU OK
- [ ] Respostas rápidas (< 3s)
- [ ] Sem memory leaks

### Base de Dados

- [ ] Conexões não estão vazando
- [ ] Queries rápidas
- [ ] Dados salvos corretamente
- [ ] Sessões persistem após restart

## 🔒 Segurança

- [ ] `.env` NÃO commitado no Git
- [ ] `JWT_SECRET` forte e único
- [ ] SSL configurado (HTTPS)
- [ ] Firewall configurado
- [ ] Dependências atualizadas
- [ ] Logs não expõem dados sensíveis

## 📝 Documentação

- [ ] README.md lido
- [ ] QUICK_START.md lido
- [ ] API_EXAMPLES.md consultado
- [ ] DEPLOY_VPS.md seguido (se fez deploy)

## 🎯 Funcionalidades

### Multi-usuário

- [ ] Múltiplos usuários podem usar o bot
- [ ] Dados isolados entre usuários
- [ ] Configurações independentes

### Multi-conexão

- [ ] Cada usuário pode ter 2 slots
- [ ] Slots funcionam independentemente
- [ ] Sessões não interferem uma na outra

### Bot

- [ ] Responde mensagens automaticamente
- [ ] Usa GPT-4o via OpenRouter
- [ ] Respeita `contextLimit`
- [ ] Respeita `lineLimit`
- [ ] Usa `basePrompt` customizado
- [ ] Para quando `isActive = false`

### API

- [ ] Todas as rotas funcionam
- [ ] Retorna JSON válido
- [ ] Status HTTP corretos
- [ ] Erros tratados adequadamente

## ✅ Checklist Final

- [ ] ✅ Bot instalado
- [ ] ✅ Banco de dados configurado
- [ ] ✅ API funcionando
- [ ] ✅ WhatsApp conecta
- [ ] ✅ GPT-4o responde
- [ ] ✅ Deploy feito (se aplicável)
- [ ] ✅ Frontend integrado
- [ ] ✅ Tudo testado

## 🎉 Pronto!

Se todos os itens estão marcados, seu bot está **100% funcional**!

---

### 🆘 Se algo não funciona:

1. **Verifique logs**: `pm2 logs platefull-bot`
2. **Consulte**: `README.md` e `DEPLOY_VPS.md`
3. **Teste endpoints**: Use `test-bot.sh`
4. **Verifique .env**: Todas as variáveis corretas?
5. **Banco**: Migrations aplicadas?

### 📞 Suporte

Para dúvidas, consulte a documentação completa:
- `README.md`
- `QUICK_START.md`
- `API_EXAMPLES.md`
- `DEPLOY_VPS.md`

---

**Boa sorte com seu bot! 🚀**

