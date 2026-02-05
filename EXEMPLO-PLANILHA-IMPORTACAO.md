# 📋 Como Preparar sua Planilha para Importação

## ✅ Formato Correto

### **Opção 1: Coluna com nome "Nome" ou "Produto"**

| Nome |
|------|
| Queijo Mussarela |
| Presunto |
| Cheddar |
| Cream Cheese |
| Leite Condensado |
| Margarina |

### **Opção 2: Sem cabeçalho (primeira coluna será lida)**

| |
|------|
| Queijo Mussarela |
| Presunto |
| Cheddar |

## ❌ O que EVITAR

### **NÃO incluir:**
- ❌ Títulos como "TABELA DE VALIDADES"
- ❌ Linhas vazias
- ❌ Cabeçalhos repetidos
- ❌ Linhas com apenas "-" ou "n/a"
- ❌ Células mescladas

### **Exemplo ERRADO:**
```
TABELA DE VALIDADES
Produto
-
Queijo Mussarela
-
```

### **Exemplo CORRETO:**
```
Queijo Mussarela
Presunto
Cheddar
```

## 🤖 O que a IA faz automaticamente

A IA irá classificar cada produto:

| Produto | → | Categoria (Auto) | Peso | Unidade | Armazenamento |
|---------|---|------------------|------|---------|---------------|
| Queijo Mussarela | → | Laticínios | 0.5 | kg | Resfriado |
| Presunto | → | Carnes e Aves | 0.2 | kg | Resfriado |
| Cheddar | → | Laticínios | 0.3 | kg | Resfriado |
| Cream Cheese | → | Laticínios | 0.2 | kg | Resfriado |
| Frango | → | Carnes e Aves | 1.0 | kg | Congelado |
| Tilápia | → | Peixes e Frutos do Mar | 1.0 | kg | Congelado |
| Alface | → | Vegetais | 0.3 | kg | Resfriado |

## 🔧 Filtros Automáticos

O sistema automaticamente **remove**:
- Linhas com "TABELA", "VALIDADE", "PRODUTO" (cabeçalhos)
- Linhas vazias ou com menos de 2 caracteres
- Linhas com apenas símbolos (-, _, espaços)

## 💡 Dicas

1. ✅ **Seja específico** - "Queijo Mussarela" é melhor que só "Queijo"
2. ✅ **Uma linha por produto** - Não agrupe produtos
3. ✅ **Remova linhas extras** antes de importar
4. ✅ **Use Excel ou Google Sheets** - Exporte como .xlsx

## 🚀 Processo de Importação

1. Prepare planilha conforme exemplo acima
2. Clique em "Importar" na página de Produtos
3. Aguarde a IA processar (2-5 segundos por produto)
4. Revise o preview
5. Clique em "Salvar X Produtos"

## ⚠️ Produtos sem Categoria

Se algum produto aparecer como "⚠ Sem categoria":
- ✅ Ele SERÁ salvo mesmo assim
- ✅ Você pode editar depois
- ✅ Categoria é opcional

## 📁 Download de Exemplo

Crie uma planilha Excel com esta estrutura:

**Planilha Exemplo.xlsx**
```
A1: Queijo Mussarela
A2: Presunto Fatiado
A3: Cheddar
A4: Cream Cheese
A5: Leite Condensado
A6: Margarina com sal
A7: Frango Desossado
A8: Tilápia Filé
A9: Alface Americana
A10: Tomate Italiano
```

Salve como .xlsx e importe!
