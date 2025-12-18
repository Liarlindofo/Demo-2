# IMPLANTAÇÃO MULTI-USUÁRIO - WHATSAPP

## ✅ IMPLEMENTAÇÃO CONCLUÍDA

Sistema totalmente refatorado para suportar múltiplos usuários conectando simultaneamente sem conflitos.

## 🔧 MUDANÇAS IMPLEMENTADAS

### 1. Lock por Usuário
- Arquivo de lock em `/tmp/whatsapp-locks/whatsapp_<userId>.lock`
- Contém o PID do processo que detém o lock
- Verificação de locks stale (processo morto)
- Remoção automática em SIGINT/SIGTERM

### 2. Isolamento Total de Chrome
- **userDataDir FIXO** por usuário: `/var/www/whatsapp-sessions/whatsapp_<userId>__chrome`
- Cada usuário tem SEU PRÓPRIO Chrome completamente isolado
- Porta de debug aleatória (`--remote-debugging-port=0`)
- Processo único por instância

### 3. Limpeza Segura
- Mata APENAS processos Chrome do userDataDir específico
- Usa `ps + grep` e `fuser` para identificar PIDs
- Remove locks APENAS do diretório do usuário
- NUNCA usa `pkill chrome` global

### 4. Garantia PM2
- Verifica se já existe worker rodando para o userId
- Não permite múltiplos workers para o mesmo usuário
- Nome do processo: `whatsapp-<userId>`

### 5. Graceful Shutdown
- Handler SIGINT/SIGTERM no worker
- Fecha cliente WPPConnect gracefully
- Remove locks automaticamente
- Limpa processos Chrome do usuário

## 📁 ARQUIVOS MODIFICADOS

- `src/wpp/index.js` - Refatoração COMPLETA com lock e isolamento
- `workers/whatsapp-worker.js` - Graceful shutdown com limpeza de locks
- `src/services/pm2.service.js` - Garantia de 1 worker por userId

## 📜 SCRIPTS CRIADOS

- `scripts/cleanup-locks.sh` - Limpar locks stale
- `scripts/test-multi-user.sh` - Testar conexão de múltiplos usuários
- `scripts/reset-all-whatsapp.sh` - Reset completo do sistema

## 🧪 COMO TESTAR

### Teste Básico (2 usuários simultâneos)

```bash
# Substituir USER1 e USER2 por IDs reais do banco
export USER1="seu_stack_user_id_1"
export USER2="seu_stack_user_id_2"

bash scripts/test-multi-user.sh
```

### Teste Manual

```bash
# Terminal 1 - Usuário 1
curl -X POST http://localhost:3001/api/start/user_id_1

# Terminal 2 - Usuário 2 (ao mesmo tempo)
curl -X POST http://localhost:3001/api/start/user_id_2

# Verificar status
curl http://localhost:3001/api/status/user_id_1
curl http://localhost:3001/api/status/user_id_2

# Verificar QR codes
curl http://localhost:3001/api/qr/user_id_1
curl http://localhost:3001/api/qr/user_id_2

# Verificar processos
pm2 list | grep whatsapp
ps aux | grep chrome | grep whatsapp
ls -lah /tmp/whatsapp-locks/
```

## ✅ RESULTADO ESPERADO

- ✅ Ambos os usuários conectam simultaneamente
- ✅ Cada um vê seu próprio QR Code
- ✅ Nenhum Chrome é derrubado
- ✅ Nenhum erro "browser already running"
- ✅ 2 processos PM2 ativos (um por usuário)
- ✅ 2 locks em /tmp/whatsapp-locks/
- ✅ Processos Chrome isolados por usuário

## 🧹 LIMPEZA

```bash
# Limpar locks stale
bash scripts/cleanup-locks.sh

# Reset completo (CUIDADO!)
bash scripts/reset-all-whatsapp.sh
```

## 🚀 DEPLOY NA VPS

1. Fazer upload do código
2. Reinstalar dependências: `npm install`
3. Garantir diretórios existem:
```bash
mkdir -p /var/www/whatsapp-sessions
mkdir -p /tmp/whatsapp-locks
chmod 777 /tmp/whatsapp-locks
```
4. Reiniciar PM2:
```bash
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.cjs
```
5. Testar com múltiplos usuários

## 🐛 TROUBLESHOOTING

### "Sessão já está sendo iniciada ou já está ativa"
- Lock existe mas processo morreu
- Rodar: `bash scripts/cleanup-locks.sh`

### "browser already running"
- NÃO DEVE MAIS ACONTECER
- Se acontecer, verificar logs em `pm2 logs whatsapp-<userId>`
- Verificar se há múltiplos workers: `pm2 list | grep whatsapp`

### Chrome não fecha
- Verificar processos: `ps aux | grep chrome | grep whatsapp`
- Matar manualmente: `kill -9 <PID>`
- Rodar: `bash scripts/reset-all-whatsapp.sh`

## 📊 MONITORAMENTO

```bash
# Ver logs de todos os workers
pm2 logs

# Ver logs de um usuário específico
pm2 logs whatsapp-<userId>

# Ver status dos workers
pm2 list

# Ver locks ativos
ls -lah /tmp/whatsapp-locks/

# Ver processos Chrome
ps aux | grep chrome | grep whatsapp | wc -l
```

## 🎯 GARANTIAS

1. ✅ Um usuário = um worker PM2
2. ✅ Um usuário = um Chrome isolado
3. ✅ Um usuário = um lock de execução
4. ✅ Múltiplos usuários = múltiplos Chromes rodando ao mesmo tempo
5. ✅ Nenhum usuário afeta outro usuário
6. ✅ QR codes são isolados por usuário
7. ✅ Reiniciar API não derruba sessões (workers são independentes)

