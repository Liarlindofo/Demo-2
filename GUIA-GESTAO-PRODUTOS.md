# 📦 Guia de Gestão de Produtos - Platefull

## 🎯 Visão Geral

A **Gestão de Produtos** é uma ferramenta centralizada e multi-cliente para cadastrar e gerenciar produtos que serão utilizados em diversas funcionalidades da plataforma, como:

- 🏷️ **Etiquetagem** - Geração de etiquetas para produtos manipulados
- 📊 **Relatórios** - Análises e estatísticas de produtos
- 🔄 **Integrações futuras** - Outras funcionalidades que precisem de dados de produtos

---

## ✨ Funcionalidades Principais

### 1. 📝 Cadastro Manual de Produtos

Cadastre produtos individualmente com as seguintes informações:

- **Nome do Produto** (obrigatório)
- **Categoria** (opcional, mas recomendado)
- **Peso Padrão** (obrigatório)
- **Unidade de Medida** (obrigatório: kg, g, L, ml, un)
- **Tipo de Armazenamento** (opcional: RESFRIADO, CONGELADO, TEMPERATURA AMBIENTE)

#### Como cadastrar manualmente:

1. Acesse **Etiquetagem → Produtos**
2. Clique em **"Novo Produto"**
3. Preencha o formulário
4. Clique em **"Salvar Produto"**

---

### 2. 📊 Importação por Planilha com IA

Importe múltiplos produtos de uma vez usando uma planilha Excel (.xlsx ou .xls).

#### 🤖 Classificação Automática com IA

A plataforma utiliza **Inteligência Artificial (OpenAI GPT-4o-mini)** para:

- ✅ Classificar automaticamente a categoria do produto
- ✅ Sugerir peso padrão adequado
- ✅ Determinar unidade de medida apropriada
- ✅ Identificar tipo de armazenamento ideal

#### Como importar:

1. Prepare uma planilha Excel com uma coluna chamada **"Nome"** ou **"Produto"**
2. Acesse **Etiquetagem → Produtos**
3. Clique em **"Importar Excel"**
4. Selecione o arquivo
5. Aguarde a classificação automática (pode levar alguns segundos)
6. Revise os produtos no preview
7. Clique em **"Salvar X Produtos"**

#### 📋 Exemplo de Planilha:

```
| Nome                    |
|-------------------------|
| Queijo Mussarela        |
| Frango Desossado        |
| Alface Americana        |
| Tomate Cereja           |
| Macarrão Penne          |
```

#### ⚠️ Observações Importantes:

- Produtos **sem categoria mapeada** serão salvos normalmente (você pode editar depois)
- A IA sugere categorias baseadas em um banco pré-definido
- Produtos com **status de erro** não serão salvos

---

### 3. 🔍 Busca e Filtros

#### Busca por texto:
- Busque por nome do produto
- Busque por nome da categoria

#### Filtro por categoria:
- **Todas as categorias** - Mostra todos os produtos
- **Sem categoria** - Produtos que ainda não têm categoria
- **[Nome da Categoria]** - Filtra por categoria específica

#### Limpar filtros:
Clique em **"Limpar filtros"** para resetar busca e filtros.

---

### 4. ✏️ Edição de Produtos

1. Localize o produto na lista
2. Clique no ícone de **lápis (✏️)**
3. Edite as informações
4. Clique em **"Atualizar Produto"**

---

### 5. 🗑️ Exclusão de Produtos

1. Localize o produto na lista
2. Clique no ícone de **lixeira (🗑️)**
3. Confirme a exclusão

⚠️ **Atenção:** A exclusão é permanente e não pode ser desfeita!

---

## 📊 Estatísticas

No topo da página, você verá 4 cards com estatísticas:

1. **Total de Produtos** - Quantidade total cadastrada
2. **Com Categoria** - Produtos com categoria definida
3. **Sem Categoria** - Produtos que precisam de categoria
4. **Categorias** - Total de categorias disponíveis

---

## 🏷️ Categorias Padrão

O sistema vem com as seguintes categorias pré-configuradas:

1. **Carnes e Aves**
2. **Peixes e Frutos do Mar**
3. **Laticínios**
4. **Vegetais**
5. **Frutas**
6. **Grãos e Cereais**
7. **Massas**
8. **Congelados**
9. **Processados**
10. **Bebidas**
11. **Temperos e Condimentos**
12. **Panificação**

### Como criar categorias padrão:

Se as categorias não existirem, o sistema oferecerá um botão **"Criar Categorias Padrão"** no formulário de cadastro.

Ou você pode executar manualmente:

```bash
POST /api/etiquetagem/seed
```

---

## 🔐 Multi-Cliente (Multi-Tenant)

### Isolamento de Dados

Cada cliente (usuário) tem seus próprios produtos:

- ✅ Produtos são isolados por `userId`
- ✅ Um cliente **não vê** produtos de outros clientes
- ✅ Categorias são **compartilhadas** entre todos os clientes
- ✅ Cada cliente pode ter produtos com o mesmo nome

### Como funciona:

1. Ao fazer login, o sistema identifica seu `userId`
2. Todas as operações (listar, criar, editar, excluir) são filtradas pelo seu `userId`
3. Você só gerencia seus próprios produtos

---

## 🔧 Configuração Técnica

### Variáveis de Ambiente Necessárias

Para usar a importação com IA, configure:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

### Como obter a API Key:

1. Acesse [OpenRouter.ai](https://openrouter.ai)
2. Crie uma conta
3. Gere uma API Key
4. Adicione créditos (mínimo $5)
5. Configure no `.env`

### Custo Estimado:

- **Modelo:** OpenAI GPT-4o-mini
- **Custo por produto:** ~$0.0001 (muito barato!)
- **Exemplo:** 1000 produtos = ~$0.10

---

## 🚀 Integração com Outras Ferramentas

### Etiquetagem

Os produtos cadastrados aqui são automaticamente disponibilizados para:

- **Gerar Etiquetas** - Selecione produtos ao criar etiquetas
- **Histórico** - Visualize etiquetas geradas por produto
- **Relatórios** - Análises de produtos mais utilizados

### Futuras Integrações

A gestão de produtos será compartilhada com:

- 📦 **Estoque** (em desenvolvimento)
- 🛒 **Pedidos** (em desenvolvimento)
- 📊 **Análises** (em desenvolvimento)

---

## 📱 Responsividade

A interface é totalmente responsiva:

- ✅ **Desktop** - Layout completo com todas as funcionalidades
- ✅ **Tablet** - Layout adaptado para telas médias
- ✅ **Mobile** - Interface otimizada para smartphones

---

## 🐛 Solução de Problemas

### Problema: "API Key não configurada"

**Solução:**
1. Verifique se `OPENROUTER_API_KEY` está no `.env`
2. Reinicie o servidor: `npm run dev`
3. Teste a conexão em `/test-api`

### Problema: "Nenhuma categoria disponível"

**Solução:**
1. Clique em **"Criar Categorias Padrão"** no formulário
2. Ou execute: `POST /api/etiquetagem/seed`

### Problema: "Erro ao importar produtos"

**Solução:**
1. Verifique se a planilha tem coluna "Nome" ou "Produto"
2. Certifique-se que não há linhas vazias
3. Verifique se o arquivo é .xlsx ou .xls válido

### Problema: "Produtos não aparecem"

**Solução:**
1. Verifique se você está logado
2. Limpe os filtros de busca
3. Recarregue a página (F5)

---

## 🎨 Interface

### Cores e Tema

- **Cor Principal:** `#001F05` (Verde escuro)
- **Tema:** Dark mode (fundo preto)
- **Acentos:** Verde, azul, amarelo, roxo

### Componentes

- **Cards de Estatísticas** - Exibem métricas importantes
- **Filtros** - Busca e seleção de categoria
- **Lista de Produtos** - Grid responsivo com hover effects
- **Modais** - Formulários de cadastro/edição e preview de importação

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte este guia
2. Verifique os logs do console (F12)
3. Entre em contato com o suporte técnico

---

## 🔄 Atualizações Futuras

Funcionalidades planejadas:

- [ ] Exportar produtos para Excel
- [ ] Duplicar produtos
- [ ] Importação em lote de imagens
- [ ] Tags personalizadas
- [ ] Histórico de alterações
- [ ] Produtos favoritos
- [ ] Compartilhamento entre clientes (opcional)

---

## 📝 Notas Finais

- ✅ Sempre revise produtos importados antes de salvar
- ✅ Mantenha categorias organizadas
- ✅ Use nomes descritivos para produtos
- ✅ Atualize informações quando necessário

---

**Versão:** 1.0.0  
**Última atualização:** Fevereiro 2026  
**Plataforma:** Platefull - Drin Platform
