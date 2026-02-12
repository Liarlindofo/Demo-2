# 🔍 EXPLICAÇÃO DETALHADA: Limite da Vercel

## 📋 **O QUE É O LIMITE:**

O limite da Vercel é sobre o **tamanho do payload (dados) que você envia em uma requisição HTTP** para suas **Serverless Functions** (suas APIs).

---

## 🎯 **É LIMITE DE QUÊ EXATAMENTE:**

### **1. Request Body Size (Tamanho do Corpo da Requisição)**

**O que é:**
- Todos os dados que você envia no `body` da requisição HTTP
- No seu caso: o objeto `evaluation` com todas as fotos em base64
- Inclui: JSON, strings, base64, etc.

**Limite da Vercel:**
- **4.5MB** (4,718,592 bytes) para Serverless Functions
- **Não configurável** - é um limite da infraestrutura

**Onde se aplica:**
```
Cliente (Android/PC) 
  ↓
  Envia requisição POST com dados
  ↓
  Vercel recebe a requisição
  ↓
  ⚠️ VERIFICA TAMANHO (4.5MB)
  ↓
  Se > 4.5MB → ERRO 413 (antes mesmo de chegar no seu código)
  ↓
  Se < 4.5MB → Passa para sua função
  ↓
  Sua API Route executa
```

---

## 🔍 **DETALHAMENTO TÉCNICO:**

### **O que conta no limite:**

1. **Request Body** (corpo da requisição)
   - JSON.stringify({ evaluation })
   - Todas as fotos em base64
   - Comentários, observações, etc.

2. **Headers** (cabeçalhos HTTP)
   - Authorization tokens
   - Content-Type
   - Cookies
   - Mas esses são pequenos (~1-2KB)

**Total = Body + Headers**

---

## 📊 **EXEMPLO PRÁTICO:**

### **Seu caso atual:**

```javascript
// Frontend envia:
POST /api/checklist/drafts
Body: {
  evaluation: {
    storeName: "Loja X",
    supervisorName: "João",
    topics: [
      {
        items: [
          {
            photoUrls: [
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", // 2.7MB
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", // 2.7MB
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", // 2.7MB
            ]
          }
        ]
      }
    ]
  }
}
```

**Tamanho total:**
- 3 fotos × 2.7MB = **8.1MB** ❌
- Limite Vercel = **4.5MB**
- **Resultado:** Erro 413 (ultrapassou o limite)

---

## 🏗️ **POR QUE ESSE LIMITE EXISTE:**

### **1. Infraestrutura Serverless**

**Vercel usa Serverless Functions:**
- Cada requisição roda em um container temporário
- Container tem recursos limitados (memória, CPU)
- Limite de payload protege contra:
  - Overload de memória
  - Timeouts
  - Custos excessivos

### **2. Performance**

**Payloads grandes causam:**
- Lentidão no processamento
- Timeout de requisições
- Consumo excessivo de recursos

### **3. Custos**

**Vercel cobra por:**
- Tempo de execução
- Memória usada
- Transferência de dados

**Limite ajuda a:**
- Controlar custos
- Prevenir abusos
- Manter performance

---

## 🔍 **ONDE O LIMITE É APLICADO:**

### **1. Antes do seu código rodar**

```
┌─────────────────────────────────┐
│  Cliente envia requisição       │
│  Tamanho: 8.1MB                 │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Vercel recebe requisição       │
│  ⚠️ VERIFICA TAMANHO (4.5MB)    │
│  8.1MB > 4.5MB? → SIM           │
│  ❌ REJEITA IMEDIATAMENTE       │
│  Retorna: HTTP 413              │
└─────────────────────────────────┘
               ↓
┌─────────────────────────────────┐
│  Seu código NUNCA executa       │
│  (não chega até aqui)           │
└─────────────────────────────────┘
```

### **2. Não é configurável**

**Por que não pode aumentar:**
- É um limite da **infraestrutura da Vercel**
- Não é uma configuração do seu projeto
- É aplicado **antes** do Next.js processar
- É aplicado **antes** do seu código rodar

---

## 📊 **COMPARAÇÃO COM OUTROS SERVIÇOS:**

| Serviço | Limite Request Body | Configurável? |
|---------|-------------------|---------------|
| **Vercel** | 4.5MB | ❌ Não |
| **AWS Lambda** | 6MB | ❌ Não |
| **Google Cloud Functions** | 10MB | ❌ Não |
| **Azure Functions** | 100MB | ✅ Sim (com configuração) |
| **Servidor próprio** | Sem limite | ✅ Sim |

---

## 🎯 **TIPOS DE LIMITES DA VERCEL:**

### **1. Request Body Size (o que você está enfrentando)**
- **Limite:** 4.5MB
- **Aplicado em:** Serverless Functions
- **Configurável:** ❌ Não

### **2. Function Timeout**
- **Limite:** 10s (Hobby), 60s (Pro)
- **Aplicado em:** Tempo de execução
- **Configurável:** ✅ Sim (via `maxDuration`)

### **3. Response Size**
- **Limite:** 4.5MB
- **Aplicado em:** Resposta da função
- **Configurável:** ❌ Não

### **4. Memory**
- **Limite:** 1024MB (Hobby), 3008MB (Pro)
- **Aplicado em:** Memória disponível
- **Configurável:** ✅ Sim (via plan)

---

## 💡 **POR QUE `next.config.mjs` NÃO FUNCIONA:**

### **Configuração que você tentou:**

```javascript
// next.config.mjs
api: {
  bodyParser: {
    sizeLimit: '50mb', // ❌ Não funciona
  },
}
```

**Por que não funciona:**
1. Essa configuração é para **Pages Router** (`/pages/api`)
2. Você está usando **App Router** (`/app/api`)
3. App Router não tem essa configuração
4. O limite da Vercel é aplicado **antes** do Next.js processar

**Fluxo real:**
```
Cliente → Vercel (limite 4.5MB) → Next.js → Seu código
         ↑
    Limite aplicado AQUI
    (antes do Next.js)
```

---

## 🔍 **COMO VERIFICAR O TAMANHO:**

### **No Frontend (antes de enviar):**

```javascript
const evaluation = { /* seus dados */ };
const jsonString = JSON.stringify({ evaluation });
const sizeInBytes = new Blob([jsonString]).size;
const sizeInMB = sizeInBytes / (1024 * 1024);

console.log(`Tamanho do payload: ${sizeInMB.toFixed(2)}MB`);

if (sizeInMB > 4.5) {
  console.warn('⚠️ Payload muito grande! Vai dar erro 413');
}
```

---

## 📋 **RESUMO:**

### **O limite é:**
- ✅ **Tamanho do Request Body** (dados enviados)
- ✅ **4.5MB máximo** por requisição
- ✅ **Aplicado pela Vercel** (não pelo seu código)
- ✅ **Antes do seu código executar**

### **Não é:**
- ❌ Limite de storage (banco de dados)
- ❌ Limite de arquivos no projeto
- ❌ Limite de memória da função
- ❌ Configurável via `next.config.mjs`

### **Por que existe:**
- ✅ Proteger infraestrutura
- ✅ Manter performance
- ✅ Controlar custos
- ✅ Prevenir abusos

---

**Data:** 11/02/2026  
**Status:** 📚 Explicação completa do limite da Vercel
