# 🔧 Correção: Problema de Isolamento de QR Code entre Usuários

## 🐛 Problema Identificado

Quando você gera um QR code, ele está conectando/desconectando o bot de outro usuário ao invés de funcionar como um bot independente com até 3 slots por usuário.

## 🔍 Causa Raiz

O problema pode estar relacionado a:
1. **Sessões antigas compartilhadas** - Processos Chrome órfãos ou pastas de sessão não isoladas
2. **userId não normalizado** - IDs podem ter espaços ou caracteres especiais causando conflito
3. **Cache de sessões** - Sessões antigas na memória ou no banco de dados

## ✅ Correções Aplicadas

### 1. Validação Rigorosa de userId
- Adicionada validação para garantir que o userId seja válido e não vazio
- Normalização do userId (remoção de espaços, garantia de tipo string)
- Validação adicional no backend para garantir que o usuário existe em `stack_users`

### 2. Logs de Debug Melhorados
- Logs detalhados em cada etapa do processo
- Rastreamento completo do userId desde o frontend até o backend
- Logs de isolamento de sessão para identificar problemas

### 3. Script de Limpeza
- Script `scripts/limpar-sessoes-whatsapp.sh` para limpar todas as sessões e processos órfãos

## 🚀 Passos para Aplicar na VPS

### Passo 1: Fazer Backup (Opcional mas Recomendado)

```bash
# Fazer backup do diretório de sessões
sudo cp -r /var/www/whatsapp-sessions /var/www/whatsapp-sessions-backup-$(date +%Y%m%d-%H%M%S)
```

### Passo 2: Parar o Bot

```bash
cd /var/www/drin-platform  # ou o caminho onde está seu projeto
pm2 stop bot-whatsapp
```

### Passo 3: Executar Script de Limpeza

```bash
# Dar permissão de execução
chmod +x scripts/limpar-sessoes-whatsapp.sh

# Executar limpeza (com backup)
./scripts/limpar-sessoes-whatsapp.sh

# OU executar sem backup (mais rápido)
./scripts/limpar-sessoes-whatsapp.sh --no-backup

# OU executar limpeza e reiniciar automaticamente
./scripts/limpar-sessoes-whatsapp.sh --restart
```

### Passo 4: Atualizar Código na VPS

```bash
# Se você usa git
git pull origin main  # ou sua branch

# OU fazer upload manual dos arquivos atualizados:
# - src/server/api.js
# - src/wpp/index.js
```

### Passo 5: Reinstalar Dependências (se necessário)

```bash
npm install
```

### Passo 6: Reiniciar o Bot

```bash
pm2 restart bot-whatsapp
# ou
pm2 start ecosystem.config.cjs --name bot-whatsapp
```

### Passo 7: Verificar Logs

```bash
# Ver logs em tempo real
pm2 logs bot-whatsapp

# Procurar por logs de isolamento
pm2 logs bot-whatsapp | grep "DEBUG ISOLAMENTO"
pm2 logs bot-whatsapp | grep "userId"
```

## 🧪 Teste de Validação

Após aplicar as correções, teste:

1. **Gerar QR Code para Usuário 1, Slot 1**
   - Verificar nos logs que o `userId` está correto
   - Verificar que o `userDataDir` é único: `/var/www/whatsapp-sessions/{userId}-slot1/`

2. **Gerar QR Code para Usuário 2, Slot 1** (em outra aba/navegador)
   - Verificar que o `userDataDir` é diferente: `/var/www/whatsapp-sessions/{userId2}-slot1/`
   - Verificar que não há conflito

3. **Verificar Processos Chrome**

```bash
# Ver processos Chrome ativos
ps aux | grep chrome | grep whatsapp

# Deve mostrar processos separados para cada usuário
```

4. **Verificar Diretórios de Sessão**

```bash
# Listar diretórios de sessão
ls -la /var/www/whatsapp-sessions/

# Cada usuário deve ter seu próprio diretório
# Formato esperado: {userId}-slot{numero}/
```

## 📊 Logs Esperados

Ao gerar QR code, você deve ver nos logs:

```
=== 🔍 DEBUG ISOLAMENTO SESSÃO ===
📌 userId recebido: clxxxxx...
📌 userId normalizado: clxxxxx...
📌 userId type: string
📌 userId length: 25
📌 slot: 1
📌 sessionName gerado: clxxxxx...-slot1
📌 userDataDir: /var/www/whatsapp-sessions/clxxxxx...-slot1
📌 Timestamp: 2024-...
==================================
```

E no backend:

```
=== 🔍 DEBUG START CONNECTION ===
📌 userId da URL: clxxxxx...
📌 userId type: string
📌 userId length: 25
📌 slot: 1
📌 URL completa: /api/start/clxxxxx.../1
📌 Timestamp: 2024-...
=================================
[startConnection] ✅ Usando userId final: clxxxxx... (tipo: string, tamanho: 25)
```

## ⚠️ Problemas Comuns e Soluções

### Problema: Ainda está conectando/desconectando bot de outro usuário

**Solução:**
1. Verificar se os diretórios de sessão estão separados:
   ```bash
   ls -la /var/www/whatsapp-sessions/
   ```

2. Verificar se há processos Chrome compartilhados:
   ```bash
   ps aux | grep chrome | grep whatsapp
   ```

3. Limpar novamente e reiniciar:
   ```bash
   ./scripts/limpar-sessoes-whatsapp.sh --no-backup
   pm2 restart bot-whatsapp
   ```

### Problema: QR Code não aparece

**Solução:**
1. Verificar logs para erros:
   ```bash
   pm2 logs bot-whatsapp --lines 100
   ```

2. Verificar se o usuário existe no banco:
   ```sql
   SELECT id, primaryEmail FROM stack_users WHERE id = 'SEU_USER_ID';
   ```

3. Verificar se o bot foi criado no banco:
   ```sql
   SELECT * FROM whatsapp_bots WHERE "userId" = 'SEU_USER_ID' AND slot = 1;
   ```

### Problema: Erro "Usuário não encontrado em stack_users"

**Solução:**
1. Verificar se o usuário está autenticado corretamente
2. Verificar se a sincronização Stack Auth está funcionando
3. Verificar logs do endpoint `/api/auth/stack-sync`

## 📝 Checklist Final

- [ ] Script de limpeza executado
- [ ] Código atualizado na VPS
- [ ] Bot reiniciado
- [ ] Logs verificados (sem erros)
- [ ] Teste com usuário 1 - Slot 1 funcionando
- [ ] Teste com usuário 2 - Slot 1 funcionando (sem conflito)
- [ ] Diretórios de sessão separados
- [ ] Processos Chrome separados

## 🔗 Arquivos Modificados

- `src/server/api.js` - Validação adicional de userId
- `src/wpp/index.js` - Normalização de userId e validação de usuário
- `scripts/limpar-sessoes-whatsapp.sh` - Script de limpeza (NOVO)

## 📞 Suporte

Se o problema persistir após seguir todos os passos:

1. Coletar logs completos:
   ```bash
   pm2 logs bot-whatsapp --lines 500 > logs-whatsapp.txt
   ```

2. Verificar diretórios:
   ```bash
   ls -la /var/www/whatsapp-sessions/ > diretorios-sessoes.txt
   ```

3. Verificar processos:
   ```bash
   ps aux | grep chrome > processos-chrome.txt
   ```

4. Compartilhar os arquivos gerados para análise

