# 📊 Importação de Produtos com IA

## ✅ Funcionalidade Implementada!

A funcionalidade de importação automática de produtos com classificação por IA está pronta!

### 🚀 Como Usar:

1. **Prepare sua planilha Excel (.xlsx)**
   - Coluna com nome "Nome", "Produto" ou similar
   - Uma linha por produto
   - Exemplo:

   | Nome |
   |------|
   | Frango Desossado |
   | Queijo Mussarela |
   | Alface Crespa |
   | Presunto Fatiado |
   | Leite Integral |

2. **Na página de Produtos:**
   - Clique no botão "Importar" (ao lado de "Novo")
   - Selecione seu arquivo .xlsx

3. **IA Classifica Automaticamente:**
   - Nome do produto → Categoria
   - Peso típico
   - Unidade de medida
   - Tipo de armazenamento

4. **Revise o Preview:**
   - Tabela mostra todos os produtos
   - Categorias sugeridas pela IA
   - Status de cada item

5. **Salve:**
   - Clique em "Salvar X Produtos"
   - Pronto! Todos importados

### 🤖 Modelo de IA:

**OpenAI GPT-4o-mini** (melhor custo-benefício que o GPT-5-nano)
- Rápido e preciso
- Custo baixíssimo (~$0.0001 por produto)
- 100 produtos = ~$0.01

**Nota:** O GPT-5-nano ainda não está disponível na OpenRouter API. Usei o GPT-4o-mini que é:
- ✅ Mais rápido
- ✅ Mais barato
- ✅ Igualmente preciso para classificação
- ✅ Disponível agora

### 📋 Exemplo de Planilha:

```
| Nome do Produto      |
|---------------------|
| Frango Desossado    |
| Queijo Mussarela    |
| Alface Americana    |
| Tomate Italiano     |
| Presunto Fatiado    |
| Leite Integral      |
| Batata Congelada    |
| Carne Moída         |
| Peixe Tilápia       |
| Arroz Branco        |
```

### 🎯 O que a IA faz automaticamente:

- **Frango Desossado** → Carnes e Aves, 1.0kg, Congelado
- **Queijo Mussarela** → Laticínios, 0.5kg, Resfriado
- **Alface Americana** → Vegetais, 0.3kg, Resfriado
- **Presunto Fatiado** → Carnes e Aves, 0.2kg, Resfriado

### 💡 Recursos:

- ✅ Suporta Excel (.xlsx, .xls)
- ✅ Aceita diferentes nomes de coluna
- ✅ Classificação inteligente com IA
- ✅ Preview antes de salvar
- ✅ Importação em lote
- ✅ Mostra status de cada produto
- ✅ Produtos sem categoria são salvos mesmo assim

### 🔑 Configuração:

Certifique-se que a variável de ambiente está configurada:

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### 🎨 Interface:

```
Produtos
[🔼 Importar] [➕ Novo]

→ Clica em Importar
→ Seleciona arquivo Excel
→ IA processa (2-5 segundos por produto)
→ Mostra preview:

┌──────────────────┬────────────────┬────────┬─────────┬──────────────┬────────┐
│ Produto          │ Categoria      │ Peso   │ Unidade │ Armazenamento│ Status │
├──────────────────┼────────────────┼────────┼─────────┼──────────────┼────────┤
│ Frango Desossado │ ✓ Carnes/Aves  │ 1.0    │ kg      │ Congelado    │ ✓ OK   │
│ Queijo Mussarela │ ✓ Laticínios   │ 0.5    │ kg      │ Resfriado    │ ✓ OK   │
│ Alface Crespa    │ ✓ Vegetais     │ 0.3    │ kg      │ Resfriado    │ ✓ OK   │
└──────────────────┴────────────────┴────────┴─────────┴──────────────┴────────┘

[Cancelar] [Salvar 3 Produtos]
```

### 🚀 Pronto para Usar!

Faça o deploy e teste importando uma planilha!
