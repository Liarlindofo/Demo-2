# 📊 CÁLCULO: Limite de Fotos e Informações no Checklist

## 📋 **ESTRUTURA DO CHECKLIST:**

- **7 tópicos** (Área Externa, Estoque, Cozinha, Expedição, Atendimento, Produto, Gerenciamento)
- **91 itens** no total
- **Limite da Vercel:** 4.5MB (4.500.000 bytes)

---

## 🔍 **O QUE É ENVIADO NO SALVAMENTO FINAL:**

Com a implementação do **Supabase Storage**, as fotos são enviadas diretamente para o Supabase quando adicionadas. No salvamento final, apenas **URLs** são enviadas (não base64).

### **Estrutura do Payload:**

```json
{
  "storeId": "...",           // ~50 bytes
  "storeName": "...",         // ~50 bytes
  "supervisorName": "...",    // ~50 bytes
  "evaluationDate": "...",    // ~20 bytes
  "topics": [                 // Array de 7 tópicos
    {
      "topicId": "...",       // ~30 bytes
      "topicName": "...",     // ~30 bytes
      "score": 0,             // ~10 bytes
      "maxScore": 0,          // ~10 bytes
      "observations": "...",  // Texto livre (estimativa: 300 bytes)
      "items": [              // Array de itens avaliados
        {
          "itemId": "...",    // ~30 bytes
          "itemName": "...",  // ~75 bytes (média)
          "score": 0,         // ~10 bytes
          "maxScore": 0,      // ~10 bytes
          "status": "...",    // ~20 bytes
          "observations": "...", // Texto livre (estimativa: 200 bytes)
          "photoUrls": [      // Array de URLs (não base64!)
            "https://...",    // ~200 bytes por URL
            "https://..."
          ]
        }
      ]
    }
  ],
  "totalScore": 0,            // ~10 bytes
  "maxTotalScore": 0,         // ~10 bytes
  "maintenanceList": "...",   // Texto livre (pode ser grande)
  "improvementSuggestions": "...", // Texto livre (pode ser grande)
  "lastOvenMaintenance": "...",    // ~20 bytes
  "lastRefrigeratorMaintenance": "...", // ~20 bytes
  "lastPestControl": "..."    // ~20 bytes
}
```

---

## 📊 **CÁLCULO DETALHADO:**

### **1. Dados Básicos (fixos):**
- Headers e metadados: ~500 bytes
- Dados básicos (storeId, names, dates): ~200 bytes
- **Subtotal: ~700 bytes**

### **2. Estrutura de Tópicos (7 tópicos):**
- Cada tópico: ~100 bytes (ids, names, scores)
- Observations por tópico: ~300 bytes (estimativa)
- **Subtotal: 7 × 400 = ~2.800 bytes**

### **3. Estrutura de Itens (91 itens máximos):**
- Cada item (sem fotos/comentários): ~200 bytes
- **91 itens × 200 bytes = ~18.200 bytes**

### **4. Observations (comentários) por item:**
- Estimativa média: 200 bytes por item
- **91 itens × 200 bytes = ~18.200 bytes**

### **5. PhotoUrls (URLs do Supabase):**
- Cada URL: ~200 bytes
- Máximo de 10 fotos por item
- **Cenário máximo: 91 itens × 10 fotos × 200 bytes = 182.000 bytes (~182 KB)**

### **6. Textos Livres (maintenanceList e improvementSuggestions):**
- Estimativa conservadora: 5.000 bytes cada = 10.000 bytes total

---

## 🎯 **CENÁRIOS:**

### **Cenário 1: Checklist Completo SEM Fotos**
```
Dados básicos:           700 bytes
Estrutura tópicos:     2.800 bytes
Estrutura itens:      18.200 bytes
Observations:         18.200 bytes
Textos livres:         10.000 bytes
─────────────────────────────────
TOTAL:                ~50.000 bytes (~50 KB)
✅ MUITO abaixo do limite (4.5MB)
```

### **Cenário 2: Checklist Completo COM 1 Foto por Item**
```
Base (sem fotos):      50.000 bytes
91 fotos × 200 bytes:  18.200 bytes
─────────────────────────────────
TOTAL:                ~68.200 bytes (~68 KB)
✅ Ainda muito abaixo do limite
```

### **Cenário 3: Checklist Completo COM 10 Fotos por Item (MÁXIMO)**
```
Base (sem fotos):      50.000 bytes
91 itens × 10 fotos × 200 bytes: 182.000 bytes
─────────────────────────────────
TOTAL:                ~232.000 bytes (~232 KB)
✅ Ainda muito abaixo do limite (4.5MB)
```

### **Cenário 4: Checklist Completo + Textos MUITO Longos**
```
Base:                  50.000 bytes
Fotos máximas:        182.000 bytes
Textos longos:      1.000.000 bytes (1MB de texto)
─────────────────────────────────
TOTAL:              ~1.232.000 bytes (~1.2 MB)
✅ Ainda abaixo do limite
```

### **Cenário 5: LIMITE MÁXIMO TEÓRICO**
```
Base:                  50.000 bytes
Fotos máximas:        182.000 bytes
Textos extremos:    4.268.000 bytes (4.2MB de texto)
─────────────────────────────────
TOTAL:              ~4.500.000 bytes (4.5 MB) ⚠️ LIMITE
```

---

## ✅ **RESPOSTA DIRETA:**

### **Com Supabase Storage (URLs):**

| Item | Limite Prático | Limite Teórico |
|------|----------------|----------------|
| **Fotos** | **910 fotos** (10 por item × 91 itens) | **22.500 fotos** (se não houver textos) |
| **Comentários** | ~500 caracteres por item | ~50.000 caracteres por item |
| **Textos Livres** | ~50.000 caracteres cada | ~2.000.000 caracteres cada |

### **Resumo:**
- ✅ **910 fotos** (10 por item) = ~182 KB (muito seguro)
- ✅ **Textos longos** podem ocupar até ~4.2MB
- ✅ **Praticamente ilimitado** para uso normal

---

## 🎯 **CONCLUSÃO:**

**Com Supabase Storage, você pode:**
- ✅ Adicionar **10 fotos em TODOS os 91 itens** (910 fotos total)
- ✅ Escrever comentários longos em cada item
- ✅ Preencher textos livres extensos
- ✅ **Nunca vai dar erro 413** em uso normal

**O limite só seria atingido se:**
- ⚠️ Você escrever textos extremamente longos (milhões de caracteres)
- ⚠️ Combinar com o máximo de fotos

**Na prática, o limite é praticamente ilimitado!** 🎉

---

**Data:** 12/02/2026  
**Status:** ✅ Cálculo completo - Limite muito generoso com Supabase Storage
