# 🚀 GUIA: Como Aplicar as Alterações na VPS

## ⚠️ SITUAÇÃO ATUAL

As alterações foram feitas no Cursor, mas **não estão commitadas no Git**.

Isso significa que você precisa:
1. **Salvar** os arquivos modificados (Ctrl+S ou Cmd+S)
2. **Fazer commit** das alterações
3. **Push** para o repositório
4. **Pull** na VPS

---

## 📋 ARQUIVOS QUE FORAM MODIFICADOS

1. ✅ `src/wpp/index.js` - Comandos #boa noite/#voltar + normalização
2. ✅ `src/wpp/sessionManager.js` - Modo manual com normalização
3. ✅ `workers/whatsapp-worker.js` - Worker não mata sessão
4. ✅ `src/server/api.js` - stopConnection fecha client antes
5. ✅ `scripts/check-bot-settings.js` - Script de diagnóstico (NOVO)
6. ✅ `DEPLOY-CORRECAO.md` - Guia de deploy (NOVO)
7. ✅ `CORRECAO-BOA-NOITE.md` - Documentação dos comandos (NOVO)

---

## 🔧 OPÇÃO 1: Commit e Push (RECOMENDADO)

### **No seu computador local (onde está o Cursor):**

```bash
# 1. Verificar o status
git status

# 2. Se não mostrar os arquivos modificados, salve manualmente:
# No Cursor: Ctrl+S (ou Cmd+S no Mac) em cada arquivo modificado

# 3. Adicionar as alterações
git add src/wpp/index.js
git add src/wpp/sessionManager.js
git add workers/whatsapp-worker.js
git add src/server/api.js
git add scripts/check-bot-settings.js
git add DEPLOY-CORRECAO.md
git add CORRECAO-BOA-NOITE.md

# 4. Fazer commit
git commit -m "feat: Implementa comandos #boa noite e #voltar com normalização de telefones

- Adiciona normalização consistente de números (remove @c.us)
- Implementa pauseChat/resumeChat com verificação dupla
- Corrige sessionManager para modo manual
- Worker não remove client automaticamente
- stopConnection fecha client antes de parar worker
- Adiciona logs detalhados para debug"

# 5. Push para o repositório
git push origin main
```

### **Na VPS:**

```bash
# 1. Ir para o diretório do projeto
cd /var/www/drin-platform

# 2. Puxar as alterações
git pull origin main

# 3. Verificar se bot_settings está correto
node scripts/check-bot-settings.js

# 4. Reiniciar workers
pm2 restart all

# 5. Monitorar logs
pm2 logs --lines 100
```

---

## 🔧 OPÇÃO 2: Upload Manual via FTP/SFTP

Se não quiser usar Git, você pode fazer upload direto dos arquivos:

### **Arquivos para fazer upload:**

1. `src/wpp/index.js`
2. `src/wpp/sessionManager.js`
3. `workers/whatsapp-worker.js`
4. `src/server/api.js`
5. `scripts/check-bot-settings.js` (novo)

### **Passos:**

1. Abra seu cliente FTP/SFTP (FileZilla, WinSCP, etc)
2. Conecte na VPS
3. Navegue até `/var/www/drin-platform`
4. Faça upload de cada arquivo sobrescrevendo os existentes
5. SSH na VPS:
   ```bash
   cd /var/www/drin-platform
   pm2 restart all
   pm2 logs
   ```

---

## 🔧 OPÇÃO 3: Copiar Diretamente (SSH)

Se você tem acesso SSH, pode copiar o conteúdo diretamente:

```bash
# Na VPS, fazer backup primeiro
cd /var/www/drin-platform
cp src/wpp/index.js src/wpp/index.js.backup
cp src/wpp/sessionManager.js src/wpp/sessionManager.js.backup

# Editar os arquivos
nano src/wpp/index.js
# Cole o conteúdo completo do arquivo
# Ctrl+O para salvar, Ctrl+X para sair

nano src/wpp/sessionManager.js
# Cole o conteúdo completo do arquivo

# Reiniciar
pm2 restart all
pm2 logs
```

---

## ✅ VERIFICAÇÃO

Após aplicar as alterações na VPS, teste:

```bash
# Ver se os comandos estão no código
grep -n "boa noite" src/wpp/index.js
grep -n "normalizePhone" src/wpp/index.js

# Se mostrar as linhas, está correto!
```

Deve mostrar algo como:
```
360:        if (text === '#boa noite') {
26:function normalizePhone(phone) {
```

---

## 🆘 SE ESTIVER COM DÚVIDA

Me diga qual opção você prefere:
1. **Git commit/push** → Eu te ajudo com os comandos exatos
2. **Upload FTP** → Te passo os arquivos para fazer upload
3. **Copy/paste SSH** → Te passo o conteúdo completo de cada arquivo

Qual você prefere? 🚀

