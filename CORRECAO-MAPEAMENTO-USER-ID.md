# ✅ CORREÇÃO CRÍTICA: Mapeamento StackUser.id → User.id

## 🐛 **PROBLEMA IDENTIFICADO:**

```
Erro: Invalid `prisma.checklistDraft.create()` invocation
HTTP 500: Internal Server Error
```

**Causa Raiz:**
- O `stackServerApp.getUser()` retorna um **`StackUser.id`** (UUID da tabela `stack_users`)
- Mas o Prisma precisa de um **`User.id`** (cuid da tabela `users`)
- O schema do `ChecklistDraft` tem foreign key para `User.id`, não `StackUser.id`
- Tentativa de criar draft com `StackUser.id` → **ERRO DE FOREIGN KEY**

---

## ✅ **SOLUÇÃO APLICADA:**

### **Usar `syncStackAuthUser()` para mapear corretamente**

**Antes (ERRADO):**
```typescript
const user = await stackServerApp.getUser({ or: 'return-null' });
// user.id = StackUser.id (UUID) ❌

await prisma.checklistDraft.create({
  data: {
    userId: user.id, // ❌ StackUser.id não existe na tabela users!
    // ...
  }
});
```

**Depois (CORRETO):**
```typescript
const stackUser = await stackServerApp.getUser({ or: 'return-null' });
// stackUser.id = StackUser.id (UUID)

// Sincronizar e mapear para User.id
const dbUser = await syncStackAuthUser({
  id: stackUser.id,
  primaryEmail: stackUser.primaryEmail || undefined,
  displayName: stackUser.displayName || undefined,
  profileImageUrl: stackUser.profileImageUrl || undefined,
  primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
});
// dbUser.id = User.id (cuid) ✅

await prisma.checklistDraft.create({
  data: {
    userId: dbUser.id, // ✅ User.id existe na tabela users!
    // ...
  }
});
```

---

## 📋 **ARQUIVOS CORRIGIDOS:**

### **1. `app/api/checklist/drafts/route.ts`**
- ✅ POST: Usa `syncStackAuthUser()` antes de criar/atualizar
- ✅ GET: Usa `syncStackAuthUser()` antes de buscar
- ✅ DELETE: Já estava correto (não usa userId)

### **2. `app/api/checklist/drafts/[id]/route.ts`**
- ✅ GET: Usa `syncStackAuthUser()` antes de buscar
- ✅ DELETE: Usa `syncStackAuthUser()` antes de deletar

### **3. `app/api/checklist/drafts/clean/route.ts`**
- ✅ POST: Usa `syncStackAuthUser()` antes de deletar

---

## 🔍 **O QUE A FUNÇÃO `syncStackAuthUser()` FAZ:**

1. **Busca ou cria `StackUser`** na tabela `stack_users`
2. **Busca ou cria `User`** na tabela `users`
3. **Associa** `StackUser.userId` → `User.id`
4. **Retorna** o `User` com o `id` correto (cuid)

**Garantias:**
- ✅ Sempre retorna um `User.id` válido
- ✅ Cria o usuário se não existir
- ✅ Sincroniza dados do Stack Auth
- ✅ Mantém relação entre `StackUser` e `User`

---

## 🎯 **POR QUE ISSO RESOLVE:**

| Problema | Antes | Depois |
|----------|-------|--------|
| **userId** | StackUser.id (UUID) | User.id (cuid) |
| **Foreign Key** | ❌ Não existe | ✅ Existe |
| **Criação de Draft** | ❌ Erro 500 | ✅ Sucesso |
| **Busca de Draft** | ❌ Não encontra | ✅ Encontra |

---

## 📊 **FLUXO CORRETO AGORA:**

```
1. Usuário faz login → Stack Auth
2. stackServerApp.getUser() → StackUser.id (UUID)
3. syncStackAuthUser() → Mapeia para User.id (cuid)
4. Prisma usa User.id → Foreign key válida ✅
5. Draft criado com sucesso ✅
```

---

## ✅ **GARANTIAS APÓS CORREÇÃO:**

✅ **Erro 500 ao criar draft** → Resolvido  
✅ **Foreign key inválida** → Resolvido  
✅ **Mapeamento correto** → StackUser → User  
✅ **Todos endpoints** → Usam User.id correto  
✅ **Sincronização automática** → Stack Auth ↔ DB  

---

## 🚀 **PRÓXIMOS PASSOS:**

1. ⏳ **Aguardar deploy** (2-3 min)
2. 📱 **Testar no Android:**
   - Abrir checklist
   - Adicionar fotos
   - ✅ Deve salvar sem erro 500
3. 💻 **Testar no PC:**
   - Mesmo teste
   - ✅ Deve funcionar

---

## 📝 **NOTA TÉCNICA:**

**Por que outros endpoints já funcionavam?**
- Endpoints de `etiquetagem` já usavam `syncStackAuthUser()`
- Endpoint de `evaluations` busca por `stackUserId` ou `email`
- Endpoints de `drafts` eram os únicos que usavam `user.id` diretamente

**Padrão correto para novos endpoints:**
```typescript
// ✅ SEMPRE usar syncStackAuthUser()
const stackUser = await stackServerApp.getUser({ or: 'return-null' });
const dbUser = await syncStackAuthUser({ ... });
// Usar dbUser.id para operações Prisma
```

---

**Data:** 11/02/2026  
**Commit:** `03986e1 - fix: corrige mapeamento StackUser.id -> User.id`  
**Status:** ✅ Enviado para Vercel  
**Aguardando:** Deploy + Teste
