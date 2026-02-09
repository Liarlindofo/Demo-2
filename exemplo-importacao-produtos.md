# 📊 Exemplo de Planilha para Importação de Produtos

## 📋 Formato da Planilha

### Estrutura Mínima Necessária

A planilha precisa ter **pelo menos uma coluna** com o nome do produto. O sistema aceita os seguintes nomes de coluna:

- `Nome`
- `nome`
- `Produto`
- `produto`
- `Nome do Produto`
- `nome do produto`

Se nenhuma dessas colunas for encontrada, o sistema usará a **primeira coluna** da planilha.

---

## ✅ Exemplo Correto

### Planilha Excel (.xlsx)

| Nome                          |
|-------------------------------|
| Queijo Mussarela              |
| Frango Desossado              |
| Alface Americana              |
| Tomate Cereja                 |
| Macarrão Penne                |
| Azeite Extra Virgem           |
| Sal Refinado                  |
| Pão Francês                   |
| Leite Integral                |
| Iogurte Natural               |

### O que acontece ao importar:

1. **IA classifica automaticamente:**
   - Queijo Mussarela → **Laticínios** (1.0 kg, RESFRIADO)
   - Frango Desossado → **Carnes e Aves** (2.5 kg, CONGELADO)
   - Alface Americana → **Vegetais** (0.5 kg, RESFRIADO)
   - Tomate Cereja → **Vegetais** (0.3 kg, RESFRIADO)
   - Macarrão Penne → **Massas** (0.5 kg, TEMPERATURA AMBIENTE)
   - Azeite Extra Virgem → **Temperos e Condimentos** (0.5 L, TEMPERATURA AMBIENTE)
   - Sal Refinado → **Temperos e Condimentos** (1.0 kg, TEMPERATURA AMBIENTE)
   - Pão Francês → **Panificação** (0.05 kg, TEMPERATURA AMBIENTE)
   - Leite Integral → **Laticínios** (1.0 L, RESFRIADO)
   - Iogurte Natural → **Laticínios** (0.5 kg, RESFRIADO)

2. **Preview é exibido** para você revisar

3. **Você confirma** e os produtos são salvos

---

## 📊 Exemplos por Categoria

### 🥩 Carnes e Aves

| Nome                          |
|-------------------------------|
| Frango Desossado              |
| Peito de Frango               |
| Coxa de Frango                |
| Carne Moída                   |
| Picanha                       |
| Costela Bovina                |
| Linguiça Toscana              |
| Bacon em Fatias               |

**IA sugere:** 1.0-2.5 kg, CONGELADO ou RESFRIADO

---

### 🐟 Peixes e Frutos do Mar

| Nome                          |
|-------------------------------|
| Salmão Fresco                 |
| Tilápia Congelada             |
| Camarão Limpo                 |
| Bacalhau Desfiado             |
| Atum em Lata                  |
| Sardinha Fresca               |

**IA sugere:** 0.5-2.0 kg, CONGELADO ou RESFRIADO

---

### 🧀 Laticínios

| Nome                          |
|-------------------------------|
| Queijo Mussarela              |
| Queijo Parmesão               |
| Requeijão Cremoso             |
| Leite Integral                |
| Iogurte Natural               |
| Manteiga sem Sal              |
| Creme de Leite                |

**IA sugere:** 0.2-1.0 kg/L, RESFRIADO

---

### 🥬 Vegetais

| Nome                          |
|-------------------------------|
| Alface Americana              |
| Tomate Cereja                 |
| Cebola Roxa                   |
| Alho Descascado               |
| Batata Inglesa                |
| Cenoura                       |
| Brócolis                      |
| Couve-Flor                    |

**IA sugere:** 0.2-1.0 kg, RESFRIADO ou TEMPERATURA AMBIENTE

---

### 🍎 Frutas

| Nome                          |
|-------------------------------|
| Maçã Fuji                     |
| Banana Prata                  |
| Laranja Pera                  |
| Morango                       |
| Uva Itália                    |
| Abacaxi                       |
| Manga Palmer                  |

**IA sugere:** 0.2-1.0 kg, RESFRIADO ou TEMPERATURA AMBIENTE

---

### 🌾 Grãos e Cereais

| Nome                          |
|-------------------------------|
| Arroz Branco                  |
| Feijão Carioca                |
| Lentilha                      |
| Grão de Bico                  |
| Aveia em Flocos               |
| Quinoa                        |

**IA sugere:** 1.0 kg, TEMPERATURA AMBIENTE

---

### 🍝 Massas

| Nome                          |
|-------------------------------|
| Macarrão Penne                |
| Espaguete                     |
| Lasanha Pré-Cozida            |
| Nhoque de Batata              |
| Ravioli de Queijo             |

**IA sugere:** 0.5 kg, TEMPERATURA AMBIENTE ou CONGELADO

---

### ❄️ Congelados

| Nome                          |
|-------------------------------|
| Pizza Congelada               |
| Hambúrguer Congelado          |
| Batata Frita Congelada        |
| Sorvete de Chocolate          |
| Polpa de Frutas               |

**IA sugere:** 0.5-1.0 kg, CONGELADO

---

### 🥫 Processados

| Nome                          |
|-------------------------------|
| Molho de Tomate               |
| Maionese                      |
| Ketchup                       |
| Mostarda                      |
| Azeitona Verde                |
| Milho em Conserva             |

**IA sugere:** 0.3-0.5 kg/L, TEMPERATURA AMBIENTE

---

### 🥤 Bebidas

| Nome                          |
|-------------------------------|
| Suco de Laranja Natural       |
| Refrigerante Cola             |
| Água Mineral                  |
| Chá Gelado                    |
| Café em Pó                    |

**IA sugere:** 0.5-2.0 L, TEMPERATURA AMBIENTE ou RESFRIADO

---

### 🧂 Temperos e Condimentos

| Nome                          |
|-------------------------------|
| Sal Refinado                  |
| Pimenta do Reino              |
| Azeite Extra Virgem           |
| Óleo de Soja                  |
| Vinagre Balsâmico             |
| Orégano                       |
| Alho em Pó                    |

**IA sugere:** 0.1-1.0 kg/L, TEMPERATURA AMBIENTE

---

### 🍞 Panificação

| Nome                          |
|-------------------------------|
| Pão Francês                   |
| Pão de Forma                  |
| Pão Integral                  |
| Bolo de Chocolate             |
| Croissant                     |
| Torrada                       |

**IA sugere:** 0.05-0.5 kg, TEMPERATURA AMBIENTE

---

## ❌ Exemplos Incorretos

### ⚠️ Planilha sem coluna "Nome"

| Descrição | Código | Preço |
|-----------|--------|-------|
| Queijo    | 001    | 25.00 |

**Problema:** Sistema não encontra coluna de nome  
**Solução:** Renomeie "Descrição" para "Nome" ou use "Produto"

---

### ⚠️ Linhas vazias ou inválidas

| Nome                          |
|-------------------------------|
| Queijo Mussarela              |
|                               |
| -                             |
| Tabela de Validades           |
| Frango Desossado              |

**Problema:** Linhas vazias ou cabeçalhos serão ignorados  
**Solução:** Remova linhas vazias e cabeçalhos extras

---

### ⚠️ Nomes muito curtos

| Nome |
|------|
| Q    |
| F    |
| A    |

**Problema:** Nomes com menos de 2 caracteres são ignorados  
**Solução:** Use nomes descritivos completos

---

## 📥 Como Criar a Planilha

### Opção 1: Excel/LibreOffice

1. Abra Excel ou LibreOffice Calc
2. Na célula A1, digite: **Nome**
3. A partir da célula A2, liste os produtos (um por linha)
4. Salve como: **produtos.xlsx**

### Opção 2: Google Sheets

1. Acesse Google Sheets
2. Crie nova planilha
3. Na célula A1, digite: **Nome**
4. A partir da célula A2, liste os produtos
5. Baixe como: **Arquivo → Fazer download → Microsoft Excel (.xlsx)**

### Opção 3: Copiar Template

Copie e cole esta tabela no Excel:

```
Nome
Queijo Mussarela
Frango Desossado
Alface Americana
Tomate Cereja
Macarrão Penne
Azeite Extra Virgem
Sal Refinado
Pão Francês
Leite Integral
Iogurte Natural
```

---

## 🎯 Dicas para Melhor Classificação

### ✅ Use nomes específicos

**Bom:**
- Queijo Mussarela Fatiado
- Frango Desossado Congelado
- Alface Americana Hidropônica

**Ruim:**
- Queijo
- Frango
- Alface

### ✅ Inclua marca quando relevante

**Bom:**
- Queijo Mussarela Tirolez
- Leite Integral Parmalat

**OK:**
- Queijo Mussarela
- Leite Integral

### ✅ Especifique o tipo

**Bom:**
- Tomate Cereja
- Tomate Italiano
- Tomate Salada

**Ruim:**
- Tomate

---

## 📊 Planilha Completa de Exemplo

Baixe ou copie esta planilha completa com 50 produtos:

| Nome                          |
|-------------------------------|
| Queijo Mussarela              |
| Queijo Parmesão               |
| Queijo Provolone              |
| Requeijão Cremoso             |
| Leite Integral                |
| Iogurte Natural               |
| Manteiga sem Sal              |
| Creme de Leite                |
| Frango Desossado              |
| Peito de Frango               |
| Coxa de Frango                |
| Carne Moída                   |
| Picanha                       |
| Costela Bovina                |
| Linguiça Toscana              |
| Bacon em Fatias               |
| Salmão Fresco                 |
| Tilápia Congelada             |
| Camarão Limpo                 |
| Bacalhau Desfiado             |
| Alface Americana              |
| Tomate Cereja                 |
| Cebola Roxa                   |
| Alho Descascado               |
| Batata Inglesa                |
| Cenoura                       |
| Brócolis                      |
| Couve-Flor                    |
| Maçã Fuji                     |
| Banana Prata                  |
| Laranja Pera                  |
| Morango                       |
| Arroz Branco                  |
| Feijão Carioca                |
| Lentilha                      |
| Grão de Bico                  |
| Macarrão Penne                |
| Espaguete                     |
| Lasanha Pré-Cozida            |
| Molho de Tomate               |
| Maionese                      |
| Ketchup                       |
| Sal Refinado                  |
| Pimenta do Reino              |
| Azeite Extra Virgem           |
| Óleo de Soja                  |
| Pão Francês                   |
| Pão de Forma                  |
| Bolo de Chocolate             |
| Café em Pó                    |

---

## 🚀 Próximos Passos

1. **Crie sua planilha** usando os exemplos acima
2. **Acesse** `/etiquetagem/produtos`
3. **Clique** em "Importar Excel"
4. **Selecione** seu arquivo
5. **Aguarde** a classificação (15-30 segundos)
6. **Revise** o preview
7. **Confirme** e salve!

---

## 💡 Dicas Finais

- ✅ Comece com poucos produtos para testar
- ✅ Revise sempre o preview antes de salvar
- ✅ Use nomes descritivos e específicos
- ✅ Remova linhas vazias da planilha
- ✅ Salve como .xlsx (não .xls antigo)
- ✅ Produtos sem categoria podem ser editados depois

---

**Dúvidas?** Consulte o [GUIA-GESTAO-PRODUTOS.md](./GUIA-GESTAO-PRODUTOS.md)
