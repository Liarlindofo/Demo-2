# 🔍 COMO O LIMITE DA VERCEL FUNCIONA

## 📋 **RESPOSTA DIRETA:**

### **O limite é por REQUISIÇÃO INDIVIDUAL**

✅ **Cada requisição é verificada separadamente**  
✅ **Não acumula entre requisições**  
✅ **Cada requisição tem seu próprio limite de 4.5MB**

---

## 🎯 **CENÁRIOS PRÁTICOS:**

### **Cenário 1: Enviar 1 foto por vez** ✅

```
Requisição 1: 1 foto (2.7MB) → ✅ Passa (2.7MB < 4.5MB)
Requisição 2: 1 foto (2.7MB) → ✅ Passa (2.7MB < 4.5MB)
Requisição 3: 1 foto (2.7MB) → ✅ Passa (2.7MB < 4.5MB)
```

**Resultado:** ✅ Todas passam (cada uma é verificada separadamente)

---

### **Cenário 2: Enviar todas as fotos de uma vez** ❌

```
Requisição 1: 3 fotos (8.1MB) → ❌ Bloqueada (8.1MB > 4.5MB)
```

**Resultado:** ❌ Erro 413 (uma única requisição ultrapassou o limite)

---

## 🔍 **COMO SEU CÓDIGO FUNCIONA ATUALMENTE:**

### **Auto-save envia TUDO de uma vez:**

```typescript
// Quando você marca um item ou adiciona foto:
const evaluation = {
  topics: [
    {
      items: [
        {
          photoUrls: [
            "data:image/jpeg;base64,...", // Foto 1 (2.7MB)
            "data:image/jpeg;base64,...", // Foto 2 (2.7MB)
            "data:image/jpeg;base64,...", // Foto 3 (2.7MB)
          ]
        }
      ]
    }
  ]
};

// Envia TUDO em uma única requisição:
POST /api/checklist/drafts
Body: JSON.stringify({ evaluation }) // 8.1MB total ❌
```

**Problema:**
- Auto-save envia **TODAS as fotos** em uma única requisição
- Se você tiver 3+ fotos = ultrapassa 4.5MB
- Erro 413

---

## 💡 **SE VOCÊ ENVIASSE 1 FOTO POR VEZ:**

### **Como funcionaria:**

```typescript
// Foto 1 adicionada:
POST /api/checklist/drafts
Body: { evaluation: { topics: [{ items: [{ photoUrls: [foto1] }] }] } }
Tamanho: 2.7MB → ✅ Passa

// Foto 2 adicionada:
POST /api/checklist/drafts
Body: { evaluation: { topics: [{ items: [{ photoUrls: [foto1, foto2] }] }] } }
Tamanho: 5.4MB → ❌ Bloqueada (ainda envia todas juntas)
```

**Mas isso não resolve porque:**
- O auto-save sempre envia **TODAS as fotos** juntas
- Mesmo que você adicione 1 por vez, quando salva, envia tudo
- Cada requisição contém todas as fotos acumuladas

---

## 📊 **COMPARAÇÃO VISUAL:**

### **Cenário Atual (Auto-save envia tudo):**

```
Você adiciona Foto 1
  ↓
Auto-save dispara (500ms depois)
  ↓
Envia: { photoUrls: [foto1] } → 2.7MB ✅ Passa

Você adiciona Foto 2
  ↓
Auto-save dispara (500ms depois)
  ↓
Envia: { photoUrls: [foto1, foto2] } → 5.4MB ❌ Bloqueada
```

### **Se enviasse 1 foto por vez (hipotético):**

```
Você adiciona Foto 1
  ↓
Envia apenas Foto 1 → 2.7MB ✅ Passa

Você adiciona Foto 2
  ↓
Envia apenas Foto 2 → 2.7MB ✅ Passa
(Atualiza o draft no servidor)
```

---

## 🎯 **RESPOSTA À SUA PERGUNTA:**

### **"Ela bloqueia uma única requisição?"**

✅ **SIM!** O limite é por **requisição individual**

### **"Se eu tirar uma foto, depois tirar outra, etc ela vai bloquear também?"**

**Depende de como você envia:**

**Se enviar 1 foto por vez:**
- ✅ Cada requisição é verificada separadamente
- ✅ 1 foto (2.7MB) < 4.5MB → Passa
- ✅ Não bloqueia

**Se enviar todas juntas (como está agora):**
- ❌ Auto-save envia TODAS as fotos acumuladas
- ❌ 3 fotos (8.1MB) > 4.5MB → Bloqueia
- ❌ Bloqueia sim

---

## 🔍 **O PROBLEMA ATUAL:**

### **Por que bloqueia mesmo tirando 1 por vez:**

1. Você adiciona Foto 1
2. Auto-save salva: `{ photoUrls: [foto1] }` → ✅ 2.7MB passa
3. Você adiciona Foto 2
4. Auto-save salva: `{ photoUrls: [foto1, foto2] }` → ❌ 5.4MB bloqueia

**O auto-save sempre envia TODAS as fotos acumuladas em uma única requisição!**

---

## 💡 **SOLUÇÕES POSSÍVEIS:**

### **Solução 1: Compressão (Recomendado)**

**Como funciona:**
- Comprimir fotos antes de enviar
- 1 foto comprimida = ~300KB
- 10 fotos comprimidas = ~3MB
- ✅ Dentro do limite de 4.5MB

**Vantagem:**
- Mantém o auto-save atual (envia tudo junto)
- Apenas reduz o tamanho

---

### **Solução 2: Upload Incremental (Complexo)**

**Como funcionaria:**
- Enviar cada foto separadamente
- Atualizar draft no servidor
- Mais complexo de implementar

**Desvantagem:**
- Múltiplas requisições
- Mais complexo
- Risco de inconsistência

---

### **Solução 3: Upload Direto para Storage (Melhor)**

**Como funciona:**
- Upload de fotos direto para S3/Storage
- Salvar apenas URLs no draft
- Draft fica pequeno (~100KB)

**Vantagem:**
- Sem limite de tamanho
- Melhor performance
- Solução definitiva

---

## 📊 **RESUMO:**

| Pergunta | Resposta |
|----------|----------|
| **Limite é por requisição?** | ✅ Sim, cada requisição tem limite de 4.5MB |
| **Acumula entre requisições?** | ❌ Não, cada uma é verificada separadamente |
| **Se tirar 1 foto por vez, bloqueia?** | Depende: se enviar 1 por vez → ✅ Não bloqueia<br>Se enviar todas juntas → ❌ Bloqueia |
| **Por que está bloqueando?** | Auto-save envia TODAS as fotos acumuladas em uma única requisição |

---

## 🎯 **CONCLUSÃO:**

**O limite é por requisição individual, MAS:**

- Seu auto-save envia **TODAS as fotos** em uma única requisição
- Mesmo que você adicione 1 foto por vez, quando o auto-save dispara, ele envia **todas as fotos acumuladas**
- Por isso bloqueia quando você tem 3+ fotos

**Solução:** Comprimir as fotos antes de enviar, ou usar upload direto para storage.

---

**Data:** 11/02/2026  
**Status:** 📚 Explicação completa do funcionamento do limite
