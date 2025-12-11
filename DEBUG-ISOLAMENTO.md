# 🔍 DEBUG: Isolamento de Sessões WhatsApp

## Problema Atual

1. ✅ **Duplicação CORRIGIDA**: Agora mostra apenas UMA conexão "WhatsApp Principal" por usuário
2. ❌ **Isolamento ainda com problema**: Bots ainda estão desconectando entre usuários

## 🔍 Comandos para Debug na VPS

Execute estes comandos na VPS para identificar o problema:

### 1. Verificar diretórios de sessões

```bash
# Listar todas as sessões criadas
ls -la /var/www/whatsapp-sessions/

# Deve mostrar algo como:
# drwxr-xr-x  2 user user 4096 Dec 11 10:30 1c31266a-caf4-47b7-8a58-abc123-slot1/
# drwxr-xr-x  2 user user 4096 Dec 11 10:35 3f203a94-927c-45c3-8b08-def456-slot1/
```

**Verificar:**
- [ ] Cada usuário tem seu próprio diretório?
- [ ] Os IDs são diferentes?
- [ ] Não há diretórios duplicados ou sobrescritos?

### 2. Verificar logs do backend

```bash
# Ver logs em tempo real
pm2 logs bot-whatsapp --lines 50

# OU se não estiver usando PM2:
tail -f /var/log/whatsapp-bot.log
```

**Procurar por:**
```
[WPP] Iniciando cliente WPPConnect para 1c31266a-caf4-47b7...:1
[WPP] Iniciando cliente WPPConnect para 3f203a94-927c-45c3...:1
```

### 3. Verificar sessões no banco de dados

```bash
# Conectar no PostgreSQL
docker exec -it neondb psql -U neondb_owner -d neondb

# Verificar tabela whatsapp_bots
SELECT 
  "userId", 
  slot, 
  "isConnected", 
  "connectedNumber",
  "createdAt",
  "updatedAt"
FROM whatsapp_bots 
ORDER BY "updatedAt" DESC
LIMIT 10;
```

**Verificar:**
- [ ] Cada usuário tem seus próprios registros?
- [ ] `userId` é diferente para cada usuário?
- [ ] Quando um usuário conecta, o outro não é desconectado?

### 4. Verificar processos Chrome/Puppeteer

```bash
# Listar processos Chrome ativos
ps aux | grep -i chrome | grep -v grep

# Contar quantos processos Chrome estão rodando
ps aux | grep -i chrome | grep -v grep | wc -l
```

**Verificar:**
- [ ] Há processos separados para cada usuário?
- [ ] Os processos não estão compartilhando userDataDir?

### 5. Testar isolamento manualmente

#### Teste A: Dois usuários simultaneamente

1. **Usuário A** (no navegador normal):
   - Login como usuário A
   - Ir para `/connections`
   - Copiar o `user.id` do console (F12)
   - Clicar em "Gerar QR Code"

2. **Usuário B** (no navegador anônimo):
   - Login como usuário B
   - Ir para `/connections`
   - Copiar o `user.id` do console (F12)
   - Clicar em "Gerar QR Code"

3. **Verificar na VPS**:
```bash
# Listar sessões criadas
ls -la /var/www/whatsapp-sessions/ | grep slot1

# Verificar logs
pm2 logs bot-whatsapp --lines 20
```

**Resultado esperado:**
- ✅ Dois diretórios diferentes são criados
- ✅ Dois processos Chrome diferentes estão rodando
- ✅ Ambos os QR codes são gerados sem conflito

**Resultado atual (problema):**
- ❌ Apenas um diretório é criado?
- ❌ Um QR code sobrescreve o outro?
- ❌ Conectar um desconecta o outro?

---

## 🔧 Possíveis Causas do Problema

### Causa 1: IDs truncados ou similares

**Verificar:**
```bash
# Na VPS, verificar se os IDs estão completos
pm2 logs bot-whatsapp | grep "Iniciando cliente"
```

Se aparecer algo como:
```
[WPP] Iniciando cliente WPPConnect para 1c31266a:1
[WPP] Iniciando cliente WPPConnect para 1c31266a:1  # MESMO ID!
```

**Solução:** Os IDs estão sendo truncados. Verificar o código que passa o userId.

### Causa 2: WPPConnect compartilhando sessões

**Verificar:**
```bash
# Ver se os sessionName são únicos
pm2 logs bot-whatsapp | grep "session:"
```

Se aparecer:
```
session: user-slot1  # GENÉRICO!
session: user-slot1  # MESMO NOME!
```

**Solução:** O sessionName não está incluindo o userId completo.

### Causa 3: userDataDir compartilhado

**Verificar:**
```bash
# Ver se os userDataDir são únicos
pm2 logs bot-whatsapp | grep "userDataDir"
```

Se aparecer:
```
userDataDir: /var/www/whatsapp-sessions/default/
userDataDir: /var/www/whatsapp-sessions/default/  # MESMO PATH!
```

**Solução:** O userDataDir não está incluindo o userId.

---

## 📝 Logs de Debug Adicionados

Vou adicionar logs de debug no código para facilitar a identificação do problema.

### Em `src/wpp/index.js` (linha 119):

```javascript
const sessionName = `${userId}-slot${slot}`;

// LOG DE DEBUG
console.log('=== DEBUG ISOLAMENTO ===');
console.log('userId recebido:', userId);
console.log('userId type:', typeof userId);
console.log('userId length:', userId?.length);
console.log('slot:', slot);
console.log('sessionName gerado:', sessionName);
console.log('userDataDir:', userDataDir);
console.log('=======================');
```

### Em `src/server/api.js` (função startConnection):

```javascript
export async function startConnection(req, res) {
  try {
    const { userId, slot } = req.params;
    const slotNumber = Number(slot);

    // LOG DE DEBUG
    console.log('=== DEBUG START CONNECTION ===');
    console.log('userId recebido da URL:', userId);
    console.log('userId type:', typeof userId);
    console.log('userId length:', userId?.length);
    console.log('slot:', slotNumber);
    console.log('============================');
    
    // ... resto do código
  }
}
```

---

## 🚀 Próximos Passos

1. **Executar os comandos de debug acima** para coletar informações
2. **Compartilhar os resultados** (logs, listagens de diretórios, etc.)
3. **Identificar a causa raiz** baseado nos logs
4. **Aplicar correção específica** para o problema identificado

---

## 📊 Checklist de Verificação

Preencha após executar os comandos:

- [ ] Sessões criadas em diretórios separados?
- [ ] UserIds diferentes nos logs?
- [ ] Processos Chrome separados?
- [ ] Banco de dados com registros separados?
- [ ] QR codes gerados simultaneamente sem conflito?

Se TODAS as respostas forem SIM, o isolamento está funcionando.
Se ALGUMA resposta for NÃO, identificamos onde está o problema.

