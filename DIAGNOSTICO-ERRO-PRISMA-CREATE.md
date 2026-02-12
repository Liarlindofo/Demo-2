# 🔍 ANÁLISE DO ERRO: `Invalid prisma.checklistDraft.create() invocation`

## 📋 **ERRO ATUAL:**

```
HTTP 500: Invalid `prisma.checklistDraft.create()` invocation
```

**Mesmo com todos os campos preenchidos, o erro persiste.**

---

## 🎯 **POSSÍVEIS CAUSAS (em ordem de probabilidade):**

### **1️⃣ PROBLEMA: `userId` não existe na tabela `users`** ⚠️ **MAIS PROVÁVEL**

**O que acontece:**
```typescript
// Stack retorna um ID
const user = await stackServerApp.getUser();
user.id // Exemplo: "cmk5xtz3u0001kz04rk0bnoa9"
```

**Mas o Prisma precisa de um ID que existe na tabela `users`:**
```prisma
model ChecklistDraft {
  userId  String
  user    User   @relation(fields: [userId], references: [id])
}
```

**Problema:**
- O `user.id` do Stack pode ser um **`StackUser.id`** (UUID)
- Mas o Prisma precisa de um **`User.id`** (cuid)
- Se o `User` não existe na tabela `users` com esse ID → **ERRO DE FOREIGN KEY**

**Como verificar:**
```sql
-- Verificar se o userId existe na tabela users
SELECT id FROM users WHERE id = 'cmk5xtz3u0001kz04rk0bnoa9';

-- Se não retornar nada, o problema é esse!
```

---

### **2️⃣ PROBLEMA: Tabela `checklist_drafts` não existe no banco** ⚠️ **MUITO PROVÁVEL**

**O que acontece:**
- O schema do Prisma foi atualizado
- Mas o banco de dados **não foi migrado**
- A tabela `checklist_drafts` não existe no PostgreSQL

**Como verificar:**
```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'checklist_drafts';

-- Se não retornar nada, a tabela não existe!
```

**Solução:**
```bash
# Executar migração
npx prisma db push
# OU
npx prisma migrate dev
```

---

### **3️⃣ PROBLEMA: Prisma Client não foi regenerado** ⚠️ **PROVÁVEL**

**O que acontece:**
- Schema foi alterado
- Mas o Prisma Client não foi regenerado
- O código TypeScript está usando tipos antigos

**Como verificar:**
```bash
# Verificar se o Prisma Client está atualizado
npx prisma generate
```

**Solução:**
```bash
# Regenerar Prisma Client
npx prisma generate
```

---

### **4️⃣ PROBLEMA: Tipo do campo `checklistData` (Json)** ⚠️ **POSSÍVEL**

**O que acontece:**
- O Prisma espera um objeto JSON válido
- Mas pode estar recebendo algo inválido (undefined, null, string malformada)

**Como verificar:**
```typescript
// No código, antes de salvar:
console.log('checklistData type:', typeof evaluation);
console.log('checklistData:', JSON.stringify(evaluation).substring(0, 200));
```

**Problema comum:**
- `evaluation` pode ter campos `undefined` que o Prisma não aceita
- Objetos circulares não podem ser serializados

---

### **5️⃣ PROBLEMA: Constraint UNIQUE ainda existe no banco** ⚠️ **POSSÍVEL**

**O que acontece:**
- O schema foi atualizado (sem UNIQUE)
- Mas o banco ainda tem o constraint antigo
- Ao tentar criar 2 drafts → erro de constraint

**Como verificar:**
```sql
-- Verificar constraints da tabela
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'checklist_drafts'::regclass 
AND contype = 'u';

-- Se retornar algo com 'userId' e 'storeId', o constraint ainda existe!
```

**Solução:**
```sql
-- Remover constraint manualmente
ALTER TABLE checklist_drafts 
DROP CONSTRAINT IF EXISTS checklist_drafts_userId_storeId_key;
```

---

### **6️⃣ PROBLEMA: Campo `expiresAt` não está sendo calculado** ⚠️ **IMPROVÁVEL**

**O que acontece:**
- O campo `expiresAt` é obrigatório (não tem `@default`)
- Se não for passado, o Prisma reclama

**Verificar no código:**
```typescript
// Linha 93-94 do route.ts
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 2);
// ✅ Está sendo calculado corretamente
```

---

## 🔍 **COMO DIAGNOSTICAR (ORDEM DE EXECUÇÃO):**

### **Passo 1: Verificar se a tabela existe**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'checklist_drafts';
```

**Se não existir:**
```bash
npx prisma db push
```

---

### **Passo 2: Verificar se o userId existe**
```sql
-- Pegar o userId do erro (ou do log)
-- Exemplo: 'cmk5xtz3u0001kz04rk0bnoa9'

SELECT id, email, name 
FROM users 
WHERE id = 'SEU_USER_ID_AQUI';
```

**Se não existir:**
- O problema é que o Stack retorna um ID diferente
- Precisa mapear `StackUser.id` → `User.id`

---

### **Passo 3: Verificar constraints**
```sql
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'checklist_drafts'::regclass;
```

**Se tiver UNIQUE com userId+storeId:**
```sql
ALTER TABLE checklist_drafts 
DROP CONSTRAINT IF EXISTS checklist_drafts_userId_storeId_key;
```

---

### **Passo 4: Verificar estrutura da tabela**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'checklist_drafts'
ORDER BY ordinal_position;
```

**Comparar com o schema:**
- `store_name` deve ser `character varying` (não nullable)
- `supervisor_name` deve ser `character varying` (não nullable)
- `evaluation_date` deve ser `character varying` (não nullable)
- `checklist_data` deve ser `jsonb`
- `expires_at` deve ser `timestamp without time zone` (não nullable)

---

## 🎯 **CAUSA MAIS PROVÁVEL:**

### **Cenário 1: Tabela não existe (80% de chance)**
```
Schema atualizado → Banco não migrado → Tabela não existe → Erro
```

**Solução:**
```bash
npx prisma db push
```

---

### **Cenário 2: userId não existe (15% de chance)**
```
Stack retorna StackUser.id → Prisma precisa User.id → Foreign key falha → Erro
```

**Solução:**
- Mapear `StackUser.id` para `User.id`
- Ou criar `User` se não existir

---

### **Cenário 3: Constraint ainda existe (5% de chance)**
```
Schema sem UNIQUE → Banco ainda tem UNIQUE → Erro ao criar 2º draft
```

**Solução:**
```sql
ALTER TABLE checklist_drafts 
DROP CONSTRAINT IF EXISTS checklist_drafts_userId_storeId_key;
```

---

## 📊 **RESUMO DAS CAUSAS:**

| Causa | Probabilidade | Como Verificar | Solução |
|-------|---------------|----------------|---------|
| **Tabela não existe** | 80% | `SELECT table_name...` | `npx prisma db push` |
| **userId não existe** | 15% | `SELECT id FROM users...` | Mapear StackUser → User |
| **Constraint UNIQUE** | 5% | `SELECT conname...` | `DROP CONSTRAINT` |
| **Prisma Client** | <1% | `npx prisma generate` | Regenerar client |
| **Tipo Json inválido** | <1% | Log do `evaluation` | Validar objeto |

---

## 🚀 **PRÓXIMOS PASSOS:**

1. **Execute os SQLs acima** para diagnosticar
2. **Me envie os resultados**
3. **Aplico a correção específica** baseada no diagnóstico

---

**Data:** 11/02/2026  
**Status:** 🔍 Aguardando diagnóstico do banco
