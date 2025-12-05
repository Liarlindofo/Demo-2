# 🔧 Solução: Conexões WhatsApp não Reconhecidas

## 📋 Problema Identificado

1. **Tabela `user_apis` vazia**: As conexões WhatsApp conectadas não estavam sendo registradas na tabela `user_apis`
2. **WhatsApp-tools não reconhecia conexões**: A página não encontrava conexões porque a tabela estava vazia
3. **Bot não funcionava**: O bot não funcionava porque não havia entradas em `user_apis` para identificar as conexões

## 🔍 Causa Raiz

O problema estava na função `createUserAPIEntry` em `src/wpp/qrHandler.js`:
- Ela tentava usar o `userId` do `StackUser` diretamente
- Mas a tabela `user_apis` precisa do `userId` do modelo `User`
- `StackUser` e `User` são modelos diferentes que precisam ser associados

## ✅ Soluções Implementadas

### 1. Correção da Função `createUserAPIEntry`
- ✅ Agora busca o `User` correspondente ao `StackUser`
- ✅ Cria o `User` se não existir (baseado no email do StackUser)
- ✅ Associa corretamente os modelos
- ✅ Cria/atualiza entradas em `user_apis` com o `userId` correto

### 2. Script de Sincronização
- ✅ Criado script `scripts/sync-whatsapp-connections.ts` para sincronizar conexões existentes
- ✅ Busca todos os WhatsAppBots conectados
- ✅ Cria/atualiza entradas em `user_apis` para cada conexão

### 3. API Endpoint de Sincronização
- ✅ Criado endpoint `POST /api/admin/sync-whatsapp-connections`
- ✅ Permite sincronizar conexões manualmente via interface web
- ✅ Requer autenticação via Stack Auth

### 4. Correção do Schema do Backend
- ✅ Adicionado modelo `Session` ao schema do backend
- ✅ Corrige erro ao tentar salvar sessões no banco

### 5. Correção do Frontend
- ✅ Corrigido parsing da resposta da API em `whatsapp-tools/page.tsx`
- ✅ Agora lê corretamente o formato `{ apis: [...] }`

## 🚀 Como Executar a Sincronização

### Opção 1: Via Script (Recomendado)

```bash
# Executar o script de sincronização
npx tsx scripts/sync-whatsapp-connections.ts
```

### Opção 2: Via API Endpoint

Faça uma requisição POST para:
```
POST /api/admin/sync-whatsapp-connections
```

Você pode fazer isso via:
- **cURL**:
```bash
curl -X POST https://platefull.com.br/api/admin/sync-whatsapp-connections \
  -H "Cookie: seu-cookie-de-autenticacao"
```

- **Interface Web**: Adicione um botão na página de admin (futuro)

### Opção 3: Automática (Já Implementada)

A sincronização agora acontece automaticamente quando:
- Um WhatsApp conecta pela primeira vez
- O status muda para `qrReadSuccess` ou `chatsAvailable`

## 📊 O que o Script Faz

1. Busca todos os `WhatsAppBot` com `isConnected = true`
2. Para cada bot:
   - Verifica se o `StackUser` tem um `User` associado
   - Se não tiver, cria/associa o `User` baseado no email
   - Busca ou cria entrada em `user_apis` com:
     - `userId`: ID do modelo `User`
     - `storeId`: ID do `StackUser` (para identificar a conexão)
     - `type`: 'whatsapp'
     - `status`: 'connected'
     - `name`: Nome baseado no número conectado ou slot

## 🔄 Próximos Passos

1. **Execute a sincronização** usando uma das opções acima
2. **Verifique a tabela `user_apis`** no banco de dados
3. **Recarregue a página `whatsapp-tools`** - as conexões devem aparecer
4. **Teste o bot** enviando uma mensagem para o número conectado

## 🐛 Troubleshooting

### Se a sincronização não funcionar:

1. **Verifique se há bots conectados**:
```sql
SELECT * FROM whatsapp_bots WHERE "isConnected" = true;
```

2. **Verifique se StackUser tem User associado**:
```sql
SELECT su.id, su."primaryEmail", su."userId", u.id as user_id
FROM stack_users su
LEFT JOIN users u ON u.id = su."userId"
WHERE su.id IN (SELECT DISTINCT "userId" FROM whatsapp_bots WHERE "isConnected" = true);
```

3. **Verifique logs** do servidor para erros

4. **Execute o script manualmente** com mais verbosidade:
```bash
DEBUG=* npx tsx scripts/sync-whatsapp-connections.ts
```

## 📝 Arquivos Modificados

- ✅ `src/wpp/qrHandler.js` - Função `createUserAPIEntry` corrigida
- ✅ `scripts/sync-whatsapp-connections.ts` - Novo script de sincronização
- ✅ `app/api/admin/sync-whatsapp-connections/route.ts` - Novo endpoint
- ✅ `backend/prisma/schema.prisma` - Modelo `Session` adicionado
- ✅ `app/whatsapp-tools/page.tsx` - Parsing da resposta corrigido

## ✨ Resultado Esperado

Após executar a sincronização:
- ✅ Tabela `user_apis` terá entradas para cada WhatsApp conectado
- ✅ Página `whatsapp-tools` reconhecerá as conexões
- ✅ Bot funcionará corretamente respondendo mensagens
- ✅ Novas conexões serão automaticamente sincronizadas

