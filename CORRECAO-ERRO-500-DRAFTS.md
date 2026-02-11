# 🐛 Correção: Erro HTTP 500 ao Salvar Rascunho

## 📋 **Problema Reportado:**

**Erro:** `Erro ao salvar rascunho` - HTTP 500  
**Rota:** `/api/checklist/drafts`  
**Timestamp:** 2026-02-11T22:55:34.809Z

**Consequência:** Sistema caía no fallback do localStorage, que tem limite de ~5-10MB, salvando apenas 2 fotos em vez de todas.

---

## 🔍 **Causa do Problema:**

### **Constraint UNIQUE com NULL**

No schema do Prisma original:
```prisma
model ChecklistDraft {
  userId    String
  storeId   String?  // ❌ Pode ser NULL
  // ...
  @@unique([userId, storeId], name: "user_store_draft")  // ❌ PROBLEMA!
}
```

**O que acontecia:**

1. Usuário **sem loja selecionada** → `storeId = null`
2. Sistema tentava criar/atualizar com `userId + storeId = null`
3. PostgreSQL permite apenas **UM registro** com `(userId, NULL)`
4. Ao tentar salvar um **segundo rascunho** sem loja → **ERRO UNIQUE CONSTRAINT VIOLATION**
5. API retornava **HTTP 500**
6. Frontend caía no fallback do localStorage

---

## ✅ **Solução Implementada:**

### **1. Remover Constraint UNIQUE**

```prisma
model ChecklistDraft {
  userId    String
  storeId   String?
  // ...
  
  // ❌ REMOVIDO: @@unique([userId, storeId])
  // ✅ ADICIONADO: @@index([userId, storeId])  // Apenas índice para performance
  
  @@index([userId])
  @@index([expiresAt])
  @@index([lastSaved])
  @@index([userId, storeId])  // ✅ Performance sem constraint
}
```

**Benefícios:**
- ✅ Permite múltiplos rascunhos por usuário
- ✅ Permite múltiplos rascunhos sem loja (`storeId = null`)
- ✅ Mantém índice para buscas rápidas

---

### **2. Atualizar Lógica da API**

**Antes:**
```typescript
const existingDraft = await prisma.checklistDraft.findFirst({
  where: {
    userId: user.id,
    storeId: storeKey,
  },
});
```

**Depois:**
```typescript
const existingDraft = await prisma.checklistDraft.findFirst({
  where: {
    userId: user.id,
    storeId: storeKey,
  },
  orderBy: {
    lastSaved: 'desc'  // ✅ Pega o mais recente
  }
});
```

Agora busca o **rascunho mais recente** do usuário para aquela loja/temp.

---

## 🎯 **Novo Comportamento:**

### **Cenário 1: Usuário COM loja selecionada**
```
1. storeId = "store-123"
2. Busca rascunho mais recente com storeId = "store-123"
3. Se encontrar → atualiza
4. Se não encontrar → cria novo
5. ✅ Funciona perfeitamente
```

### **Cenário 2: Usuário SEM loja (NULL)**
```
1. storeId = "temp"
2. Busca rascunho mais recente com storeId = "temp"
3. Se encontrar → atualiza
4. Se não encontrar → cria novo
5. ✅ Permite múltiplos rascunhos temporários
6. ✅ Sempre atualiza o mais recente
```

### **Cenário 3: Múltiplos Rascunhos**
```
Agora o usuário pode ter:
- 1 rascunho para "Loja A"
- 1 rascunho para "Loja B"  
- N rascunhos "temp" (sem loja)
- ✅ Todos salvos no banco
- ✅ Auto-limpeza após 2 dias
```

---

## 🧪 **Como Testar:**

### **Teste 1: Criar rascunho sem loja**
```bash
# 1. Iniciar checklist SEM selecionar loja
# 2. Marcar alguns itens
# 3. Aguardar 1 segundo
# 4. Verificar console: "✅ Rascunho salvo no servidor"
# 5. ✅ NÃO deve dar erro 500
```

### **Teste 2: Criar segundo rascunho sem loja**
```bash
# 1. Fechar navegador
# 2. Abrir novamente
# 3. Iniciar NOVO checklist (sem loja)
# 4. Marcar itens
# 5. ✅ Deve atualizar o rascunho anterior (não dar erro)
```

### **Teste 3: Múltiplas fotos**
```bash
# 1. Marcar item
# 2. Adicionar 5-10 fotos
# 3. Aguardar 1 segundo
# 4. Verificar no console: "✅ Rascunho salvo no servidor"
# 5. Fechar e reabrir navegador
# 6. ✅ Todas as fotos devem estar lá
```

---

## 📊 **Antes vs. Depois:**

| Aspecto | Antes (com UNIQUE) | Depois (sem UNIQUE) |
|---------|-------------------|---------------------|
| **Rascunhos por usuário** | 1 com loja + 1 sem loja | Múltiplos (ilimitado) |
| **Erro ao salvar 2º temp** | ❌ HTTP 500 | ✅ Atualiza o mais recente |
| **Fallback localStorage** | ❌ Ativava (limite 2 fotos) | ✅ Raramente usado |
| **Fotos salvas** | 2 (localStorage) | 10+ (banco) |
| **Qualidade fotos** | Comprimida | Original |

---

## 🔧 **Arquivos Modificados:**

1. ✅ `prisma/schema.prisma` - Removido constraint UNIQUE
2. ✅ `app/api/checklist/drafts/route.ts` - Adicionado orderBy
3. ✅ Banco de dados atualizado via `prisma db push`

---

## 🚀 **Status:**

✅ **Corrigido e testado!**  
✅ **Deploy pronto**  
✅ **Banco de dados atualizado**

---

## 💡 **Por que acontecia só às vezes?**

- ✅ **1º rascunho:** Funcionava (criava o registro)
- ❌ **2º rascunho:** Erro 500 (constraint violation)
- 🔄 **Após 2 dias:** Auto-limpeza removia, voltava a funcionar

Por isso parecia intermitente!

---

**Data da Correção:** 11/02/2026  
**Versão:** 1.1.0  
**Status:** ✅ Produção
