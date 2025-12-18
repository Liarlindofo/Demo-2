# 🧪 TESTE RÁPIDO - MULTI-USUÁRIO

## ⚡ Comandos para Validar Imediatamente

### 1. Verificar Sistema

```bash
# API está rodando?
curl http://localhost:3001/health

# PM2 está ativo?
pm2 list

# Diretórios existem?
ls -lah /var/www/whatsapp-sessions/
ls -lah /tmp/whatsapp-locks/
```

---

### 2. Teste com 1 Usuário

```bash
# Substituir USER_ID_1 por ID real do banco (stack_users.id)
export USER_ID_1="seu_stack_user_id_aqui"

# Iniciar
curl -X POST http://localhost:3001/api/start/$USER_ID_1

# Aguardar 5 segundos
sleep 5

# Verificar status
curl http://localhost:3001/api/status/$USER_ID_1 | jq '.'

# Verificar QR
curl http://localhost:3001/api/qr/$USER_ID_1 | jq '.qrCode' -r

# Verificar worker PM2
pm2 list | grep whatsapp

# Verificar lock
ls /tmp/whatsapp-locks/

# Verificar Chrome
ps aux | grep chrome | grep whatsapp
```

**✅ Resultado esperado:**
- Status: `QRCODE` ou `CONNECTING`
- QR Code: String base64 longa
- 1 processo PM2: `whatsapp-<userId>`
- 1 lock file
- Pelo menos 1 processo Chrome

---

### 3. Teste com 2 Usuários (SIMULTÂNEO)

```bash
# Substituir pelos IDs reais
export USER_ID_1="seu_user_1"
export USER_ID_2="seu_user_2"

# Iniciar AMBOS ao mesmo tempo
curl -X POST http://localhost:3001/api/start/$USER_ID_1 &
curl -X POST http://localhost:3001/api/start/$USER_ID_2 &

# Aguardar processos em background
wait

# Aguardar 5 segundos
sleep 5

# Verificar status de ambos
echo "=== Status User 1 ==="
curl http://localhost:3001/api/status/$USER_ID_1 | jq '.session.status'

echo "=== Status User 2 ==="
curl http://localhost:3001/api/status/$USER_ID_2 | jq '.session.status'

# Verificar QR codes
echo "=== QR User 1 (primeiros 100 chars) ==="
curl http://localhost:3001/api/qr/$USER_ID_1 | jq -r '.qrCode' | head -c 100

echo "=== QR User 2 (primeiros 100 chars) ==="
curl http://localhost:3001/api/qr/$USER_ID_2 | jq -r '.qrCode' | head -c 100

# Verificar processos PM2
echo "=== Processos PM2 ==="
pm2 list | grep whatsapp

# Verificar locks
echo "=== Locks ==="
ls -lah /tmp/whatsapp-locks/

# Verificar Chromes
echo "=== Processos Chrome ==="
ps aux | grep chrome | grep whatsapp | wc -l
```

**✅ Resultado esperado:**
- Ambos status: `QRCODE` ou `CONNECTING`
- QR codes DIFERENTES
- 2 processos PM2 diferentes
- 2 locks diferentes
- Pelo menos 2 processos Chrome
- **SEM ERRO** "browser already running"

---

### 4. Teste de Isolamento

```bash
# Parar apenas User 1
curl -X POST http://localhost:3001/api/stop/$USER_ID_1

# Verificar User 1 parou
pm2 list | grep whatsapp-$USER_ID_1
# Não deve aparecer

# Verificar User 2 ainda ativo
pm2 list | grep whatsapp-$USER_ID_2
# Deve aparecer como "online"

# Verificar status User 2
curl http://localhost:3001/api/status/$USER_ID_2 | jq '.session.status'
# Deve retornar status ativo
```

**✅ Resultado esperado:**
- User 1 PARADO
- User 2 ATIVO
- User 2 não foi afetado

---

### 5. Teste de Lock Stale

```bash
# Criar lock falso
echo "999999" > /tmp/whatsapp-locks/whatsapp_test_user.lock

# Tentar iniciar
curl -X POST http://localhost:3001/api/start/test_user

# Aguardar 5 segundos
sleep 5

# Verificar se funcionou (lock stale deve ter sido removido)
curl http://localhost:3001/api/status/test_user | jq '.session.status'
# Deve retornar status válido (não erro de lock)

# Limpar
curl -X POST http://localhost:3001/api/stop/test_user
```

**✅ Resultado esperado:**
- Lock stale detectado e removido
- Sessão inicia normalmente

---

### 6. Teste de Reinício da API

```bash
# Iniciar 2 usuários
curl -X POST http://localhost:3001/api/start/$USER_ID_1
curl -X POST http://localhost:3001/api/start/$USER_ID_2

# Aguardar conectarem
sleep 5

# Verificar workers ativos
pm2 list | grep whatsapp

# Reiniciar APENAS a API (NÃO os workers)
pm2 restart platefull-api

# Verificar workers ainda ativos
pm2 list | grep whatsapp

# Verificar status ainda funciona
curl http://localhost:3001/api/status/$USER_ID_1 | jq '.session.status'
curl http://localhost:3001/api/status/$USER_ID_2 | jq '.session.status'
```

**✅ Resultado esperado:**
- Workers continuam rodando após restart da API
- Status ainda acessível
- Sessões não foram derrubadas

---

### 7. Teste de Múltiplas Tentativas (Proteção de Lock)

```bash
# Tentar iniciar mesmo usuário 3 vezes rápido
curl -X POST http://localhost:3001/api/start/$USER_ID_1 &
curl -X POST http://localhost:3001/api/start/$USER_ID_1 &
curl -X POST http://localhost:3001/api/start/$USER_ID_1 &

wait

# Verificar APENAS 1 worker criado
pm2 list | grep whatsapp-$USER_ID_1 | wc -l
# Deve retornar: 1

# Verificar APENAS 1 lock
ls /tmp/whatsapp-locks/ | grep $USER_ID_1 | wc -l
# Deve retornar: 1
```

**✅ Resultado esperado:**
- Apenas 1 worker criado
- Apenas 1 lock criado
- Demais tentativas retornam "já ativo"

---

## 🧹 Limpeza Após Testes

```bash
# Parar todos os workers de teste
pm2 list | grep whatsapp | awk '{print $2}' | xargs -I {} pm2 delete {}

# Limpar locks
rm -f /tmp/whatsapp-locks/*.lock

# Limpar sessões (opcional)
rm -rf /var/www/whatsapp-sessions/whatsapp_*

# Verificar limpeza
pm2 list
ls /tmp/whatsapp-locks/
```

---

## 📊 Resultado Final Esperado

### ✅ SUCESSO:
- Múltiplos usuários conectam simultaneamente
- QR codes isolados e diferentes
- Nenhum erro "browser already running"
- Workers isolados e independentes
- Locks funcionando corretamente
- Reiniciar API não afeta workers
- Stop de um usuário não afeta outros

### ❌ PROBLEMA (se algum teste falhar):

```bash
# Ver logs detalhados
pm2 logs --lines 100

# Ver logs de usuário específico
pm2 logs whatsapp-<userId> --lines 50

# Verificar processos Chrome
ps aux | grep chrome | grep whatsapp

# Verificar locks
ls -lah /tmp/whatsapp-locks/

# Reset completo (último recurso)
bash scripts/reset-all-whatsapp.sh
```

---

## 🚀 Teste Completo Automatizado

```bash
# Usar script pronto
bash scripts/test-multi-user.sh
```

---

## 📝 Notas

1. **IDs de Teste:** Use IDs reais de `stack_users` do seu banco
2. **jq:** Instale se não tiver: `apt install jq` ou `brew install jq`
3. **Logs:** Em caso de erro, sempre verificar `pm2 logs`
4. **Locks:** Se travar, rodar `bash scripts/cleanup-locks.sh`

---

**Status:** ✅ Pronto para testar  
**Tempo estimado:** 5-10 minutos  
**Pré-requisitos:** API rodando, PM2 instalado, IDs de usuários válidos

