# 🔍 ANÁLISE: Erro HTTP 413 - Request Entity Too Large

## 📋 **ERRO ATUAL:**

```
HTTP 413: Request Entity Too Large
FUNCTION_PAYLOAD_TOO_LARGE
```

**O que significa:**
- O payload (dados enviados) é **maior que o limite permitido**
- A Vercel rejeitou a requisição antes mesmo de chegar ao código

---

## 🎯 **CAUSA RAIZ:**

### **1. Limite da Vercel (HARDCODED - Não pode ser alterado)**

A Vercel tem um limite **fixo de 4.5MB** para serverless functions:
- ❌ **Não pode ser aumentado** via configuração
- ❌ `next.config.mjs` não funciona para App Router
- ❌ `export const config` não funciona para App Router
- ✅ É um limite da **infraestrutura da Vercel**

**Documentação oficial:**
- Limite máximo: **4.5MB** (4,718,592 bytes)
- Aplicado a: Request body + headers
- Não configurável

---

### **2. Fotos em Base64 são MUITO grandes**

**Tamanho típico:**
- 1 foto de 2MP em base64 = **~2.7MB**
- 2 fotos = **~5.4MB** ❌ (ultrapassa 4.5MB)
- 3 fotos = **~8.1MB** ❌

**Por que base64 é grande:**
- Base64 aumenta o tamanho em **~33%** comparado ao binário
- 1MB de imagem → ~1.33MB em base64
- Sem compressão = tamanho original

---

## 🔍 **POR QUE AS CONFIGURAÇÕES NÃO FUNCIONAM:**

### **`next.config.mjs` (linhas 3-9):**
```javascript
api: {
  bodyParser: {
    sizeLimit: '50mb', // ❌ Não funciona para App Router
  },
}
```

**Problema:**
- Essa configuração é para **Pages Router** (`/pages/api`)
- Você está usando **App Router** (`/app/api`)
- App Router não respeita essa configuração

---

### **`export const config` (route.ts linhas 7-13):**
```typescript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // ❌ Não funciona para App Router
    },
  },
};
```

**Problema:**
- Mesma coisa: só funciona no Pages Router
- App Router ignora essa configuração
- O limite da Vercel (4.5MB) é aplicado **antes** do código rodar

---

## 💡 **SOLUÇÕES POSSÍVEIS:**

### **Solução 1: Compressão de Imagens (RECOMENDADO)** ✅

**Como funciona:**
1. Comprimir fotos antes de enviar
2. Reduzir qualidade (ex: 80%)
3. Redimensionar (ex: max 1920x1080)
4. Converter para WebP (menor que JPEG)

**Benefícios:**
- ✅ 1 foto comprimida = ~200-500KB (vs 2-4MB)
- ✅ 10 fotos = ~2-5MB (dentro do limite)
- ✅ Mantém qualidade visual aceitável
- ✅ Funciona com limite da Vercel

**Desvantagens:**
- ⚠️ Processamento no cliente (pode ser lento)
- ⚠️ Perda de qualidade (mas aceitável)

---

### **Solução 2: Upload Direto para Storage (MELHOR)** ✅✅

**Como funciona:**
1. Upload de fotos direto para S3/Cloudflare R2/Storage
2. Salvar apenas URLs no draft
3. Draft fica pequeno (~100KB)

**Benefícios:**
- ✅ Sem limite de tamanho (storage próprio)
- ✅ Draft muito pequeno (só URLs)
- ✅ Fotos em qualidade original
- ✅ Melhor performance

**Desvantagens:**
- ⚠️ Requer configuração de storage
- ⚠️ Mais complexo de implementar

---

### **Solução 3: Salvar Fotos em Chunks (COMPLEXO)** ⚠️

**Como funciona:**
1. Dividir draft em múltiplas requisições
2. Salvar fotos separadamente
3. Associar depois

**Benefícios:**
- ✅ Contorna limite da Vercel

**Desvantagens:**
- ❌ Muito complexo
- ❌ Múltiplas requisições
- ❌ Risco de inconsistência

---

### **Solução 4: Usar Edge Functions (LIMITADO)** ⚠️

**Como funciona:**
1. Converter para Edge Function
2. Limite maior (mas ainda limitado)

**Desvantagens:**
- ❌ Ainda tem limite
- ❌ Não resolve o problema raiz
- ❌ Mudança de arquitetura

---

## 📊 **COMPARAÇÃO DAS SOLUÇÕES:**

| Solução | Complexidade | Eficácia | Recomendação |
|---------|--------------|----------|--------------|
| **Compressão** | Média | Alta | ✅ Recomendado |
| **Storage Direto** | Alta | Muito Alta | ✅✅ Melhor |
| **Chunks** | Muito Alta | Média | ❌ Não recomendado |
| **Edge Functions** | Média | Baixa | ❌ Não resolve |

---

## 🎯 **RECOMENDAÇÃO:**

### **Curto Prazo: Compressão de Imagens**
- Implementação rápida
- Resolve o problema imediato
- Mantém arquitetura atual

### **Longo Prazo: Upload Direto para Storage**
- Solução definitiva
- Melhor performance
- Escalável

---

## 🔍 **POR QUE ESTÁ ACONTECENDO AGORA:**

**Antes:**
- localStorage tinha limite de ~5MB
- Sistema salvava apenas 2 fotos (dentro do limite)
- Erro 500 mascarava o problema

**Agora:**
- Removemos localStorage
- Tentando salvar todas as fotos
- 3+ fotos = ultrapassa 4.5MB da Vercel
- Erro 413 aparece claramente

---

## 📋 **PRÓXIMOS PASSOS (QUANDO AUTORIZAR):**

### **Opção A: Compressão (Rápida)**
1. Adicionar biblioteca de compressão (ex: `browser-image-compression`)
2. Comprimir antes de converter para base64
3. Reduzir para ~500KB por foto
4. 10 fotos = ~5MB (ainda pode dar erro se muito grande)

### **Opção B: Storage Direto (Definitiva)**
1. Configurar S3/Cloudflare R2
2. Criar endpoint de upload
3. Salvar URLs no draft
4. Sem limite de tamanho

---

## ⚠️ **IMPORTANTE:**

**O limite da Vercel (4.5MB) NÃO PODE SER ALTERADO:**
- ❌ Não via `next.config.mjs`
- ❌ Não via `export const config`
- ❌ Não via variáveis de ambiente
- ✅ É um limite da infraestrutura

**Soluções que NÃO funcionam:**
- Aumentar `sizeLimit` no config
- Usar `maxDuration`
- Mudar para Edge Functions (ainda tem limite)

**Única forma de resolver:**
- ✅ Reduzir tamanho do payload (compressão)
- ✅ Ou usar storage externo (upload direto)

---

**Data:** 11/02/2026  
**Status:** 🔍 Análise completa - Aguardando autorização para implementar solução
