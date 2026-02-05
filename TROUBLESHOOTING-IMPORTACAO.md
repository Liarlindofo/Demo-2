# 🔧 GUIA DE TROUBLESHOOTING - Importação de Produtos

## ✅ MELHORIAS IMPLEMENTADAS

### 1. **Chamada Direta à API do OpenRouter**
- ❌ Antes: Fazia chamada HTTP interna entre APIs (problemas de autenticação)
- ✅ Agora: Chama OpenRouter diretamente do endpoint de importação
- 🎯 Benefício: Mais rápido e sem problemas de sessão

### 2. **Logs Detalhados**
Agora você verá no console do servidor:
```
🔑 API Key encontrada: sk-or-v1-5afae518f...
📋 Categorias disponíveis no banco (12): "Laticínios" (ID: abc), ...
📦 Processando 5 produtos...

🔄 Processando: Queijo Mussarela
📂 Categoria sugerida: "Laticínios"
✅ Categoria encontrada: Laticínios (ID: cm5...)
✅ Queijo Mussarela processado com sucesso!
```

### 3. **Verificação de Categorias**
- Alerta se não encontrar categorias no banco
- Sugere executar o seed para popular

## 🧪 COMO TESTAR

### Opção 1: Página de Teste HTML

1. Abra o arquivo `test-import.html` no navegador
2. Clique em **"🔑 Testar API Key"** primeiro
3. Se funcionar, clique em **"🚀 Testar Importação"** e selecione um arquivo Excel

### Opção 2: Diretamente no Sistema

1. Certifique-se que o servidor está rodando:
```bash
npm run dev
```

2. Acesse: `http://localhost:3000/etiquetagem/produtos?unidade=sua-unidade-id`
3. Clique em **"Importar"**
4. Selecione um arquivo Excel simples
5. **IMPORTANTE:** Abra o **Console do Navegador** (F12)
6. Verifique os logs que aparecem

### Opção 3: Teste via Terminal

Se o Node.js estiver atualizado:
```bash
node scripts/test-classificacao.js
```

## 📊 FORMATO DO ARQUIVO EXCEL

Crie um arquivo simples com apenas uma coluna:

| Nome |
|------|
| Queijo Mussarela |
| Presunto |
| Frango Congelado |
| Tomate |
| Alface |

**IMPORTANTE:** 
- ✅ Primeira linha pode ser cabeçalho (será ignorada automaticamente)
- ✅ Não precisa ter outras colunas
- ✅ O sistema classifica tudo automaticamente

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Problema 1: "API Key não configurada"
**Solução:**
```bash
# Verifique se está no .env.local:
Get-Content .env.local | Select-String "OPENROUTER"

# Deve mostrar:
OPENROUTER_API_KEY=sk-or-v1-...
```

### Problema 2: "Nenhuma categoria encontrada"
**Solução:**
```bash
# Popular categorias no banco:
curl -X POST http://localhost:3000/api/etiquetagem/seed
```

Ou acesse no navegador:
- URL: `http://localhost:3000/api/etiquetagem/seed`
- Método: POST

### Problema 3: Todos produtos ficam "Sem categoria"
**Verifique no console do servidor:**

1. Se aparecer `📋 Categorias disponíveis no banco (0):` → Execute o seed
2. Se aparecer `❌ Erro API OpenRouter: 401` → API Key inválida
3. Se aparecer `⚠️ Categoria NÃO encontrada` → Verifique os nomes das categorias

**Categorias esperadas no banco:**
- Carnes e Aves
- Peixes e Frutos do Mar
- Laticínios
- Vegetais
- Frutas
- Grãos e Cereais
- Massas
- Congelados
- Processados
- Bebidas
- Temperos e Condimentos
- Panificação

### Problema 4: Node.js versão antiga
Se aparecer: `You are using Node.js 18.18.0. For Next.js, Node.js version ">=20.9.0" is required.`

**Solução:**
```bash
# Instalar nvm (Node Version Manager)
# Depois:
nvm install 20
nvm use 20
npm run dev
```

## 📝 ONDE VER OS LOGS

### Logs do Backend (Servidor)
- **Terminal onde rodou `npm run dev`**
- Procure por emojis: 🔑 📋 🔄 📂 ✅ ❌

### Logs do Frontend (Navegador)
- **F12 → Console**
- Procure por: `📥 Dados recebidos`, `📦 Produtos importados`

## ✅ CHECKLIST ANTES DE TESTAR

- [ ] API Key configurada no `.env.local`
- [ ] API Key configurada na Vercel
- [ ] Servidor rodando (`npm run dev`)
- [ ] Categorias populadas no banco
- [ ] Console do navegador aberto (F12)
- [ ] Arquivo Excel com formato correto

## 🆘 SE AINDA NÃO FUNCIONAR

Envie as seguintes informações:

1. **Logs do Terminal** (onde rodou `npm run dev`)
2. **Logs do Console do Navegador** (F12 → Console)
3. **Screenshot** da tela de importação
4. **Primeira linha do seu arquivo Excel**

---

## 🎯 TESTE RÁPIDO

Execute este teste simples:

```bash
# Teste 1: Verificar API Key
Get-Content .env.local | Select-String "OPENROUTER"

# Teste 2: Testar classificação (abra test-import.html e clique em "Testar API Key")

# Teste 3: Popular categorias
curl -X POST http://localhost:3000/api/etiquetagem/seed

# Teste 4: Importar produtos (use test-import.html)
```

**Boa sorte! 🚀**
