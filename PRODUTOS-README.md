# 📦 Gestão de Produtos - Platefull

> Sistema centralizado e inteligente para gerenciar produtos com suporte a multi-clientes e classificação automática por IA.

---

## 📚 Documentação

### 🎯 Para Usuários

**[📖 GUIA-GESTAO-PRODUTOS.md](./GUIA-GESTAO-PRODUTOS.md)**
- Como usar a ferramenta
- Cadastro manual e importação
- Filtros e busca
- Solução de problemas
- Dicas e boas práticas

### 🏗️ Para Desenvolvedores

**[🔧 ARQUITETURA-PRODUTOS.md](./ARQUITETURA-PRODUTOS.md)**
- Estrutura de dados (Prisma)
- Fluxo de dados completo
- APIs documentadas
- Integração com IA (OpenRouter + OpenAI)
- Código de exemplo
- Performance e otimizações

### 📊 Resumo Executivo

**[✨ RESUMO-GESTAO-PRODUTOS.md](./RESUMO-GESTAO-PRODUTOS.md)**
- Visão geral do projeto
- O que foi criado/melhorado
- Como usar (quick start)
- Próximos passos
- Métricas de sucesso

---

## 🚀 Quick Start

### 1. Acesse a ferramenta

```
https://seu-dominio.com/etiquetagem/produtos
```

### 2. Configure (primeira vez)

```env
# .env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

### 3. Crie categorias padrão

```bash
curl -X POST http://localhost:3000/api/etiquetagem/seed
```

Ou clique em **"Criar Categorias Padrão"** no formulário.

### 4. Comece a usar!

- **Cadastro manual:** Clique em "Novo Produto"
- **Importação:** Clique em "Importar Excel"

---

## ✨ Funcionalidades

### ✏️ Cadastro Manual
- Formulário completo e validado
- Campos obrigatórios: nome, peso, unidade
- Campos opcionais: categoria, armazenamento, marca

### 📊 Importação Inteligente
- Upload de Excel (.xlsx, .xls)
- Classificação automática com IA
- Sugestão de peso, unidade e armazenamento
- Preview antes de salvar

### 🔍 Busca e Filtros
- Busca por nome ou categoria
- Filtro por categoria específica
- Filtro "Sem categoria"
- Contador de resultados em tempo real

### 📈 Estatísticas
- Total de produtos
- Produtos com/sem categoria
- Total de categorias
- Visualização em cards

### 🔐 Multi-Cliente
- Isolamento total de dados por usuário
- Cada cliente vê apenas seus produtos
- Categorias compartilhadas

### 🔄 Compartilhamento
- Integrado com Etiquetagem
- Preparado para Estoque, Pedidos, etc.

---

## 🎨 Interface

### Dashboard Principal

```
┌────────────────────────────────────────────────────────────────┐
│  📦 Gestão de Produtos                    [Importar] [Novo]    │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Total    │  │ Com Cat  │  │ Sem Cat  │  │ Categ.   │      │
│  │  150     │  │   145    │  │    5     │  │   12     │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
├────────────────────────────────────────────────────────────────┤
│  🔍 Buscar...              │  🔽 Filtrar por categoria         │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐     │
│  │ Queijo Mussarela                [Laticínios]  ✏️ 🗑️  │     │
│  │ Peso: 1.0 kg  |  Armazenamento: RESFRIADO           │     │
│  └──────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ Frango Desossado           [Carnes e Aves]  ✏️ 🗑️    │     │
│  │ Peso: 2.5 kg  |  Armazenamento: CONGELADO           │     │
│  └──────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Inteligência Artificial

### Classificação Automática

A ferramenta usa **OpenAI GPT-4o-mini** via **OpenRouter** para:

1. **Classificar categoria** do produto
2. **Sugerir peso padrão** adequado
3. **Determinar unidade** de medida
4. **Identificar tipo de armazenamento**

### Exemplo

**Input:** "Queijo Mussarela"

**Output (IA):**
```json
{
  "categoria": "Laticínios",
  "peso": 1.0,
  "unidade": "kg",
  "armazenamento": "RESFRIADO"
}
```

### Custo

- **~$0.0001 por produto**
- 1000 produtos = ~$0.10
- Muito barato! 💰

---

## 📊 Estrutura de Dados

### Produto

```typescript
interface Produto {
  id: string;
  userId: string;                      // Multi-tenant
  nome: string;                        // Obrigatório
  categoriaId: string;                 // Opcional
  pesoPadrao: number;                  // Obrigatório
  unidadeMedida: string;               // kg, g, L, ml, un
  marcaFornecedor?: string;            // Opcional
  tipoArmazenamentoPadrao?: string;    // RESFRIADO, CONGELADO, etc.
  isAtivo: number;                     // Soft delete
  createdAt: Date;
  updatedAt: Date;
}
```

### Categoria

```typescript
interface Categoria {
  id: string;
  nome: string;
  temperaturaArmazenamento: string;
  validadeDescongelado?: number;
  validadeResfriado?: number;
  validadePreparado?: number;
  validadePorcionado?: number;
  validadeCongeladoMedio?: number;
  validadeCongeladoProfundo?: number;
  isAtivo: number;
}
```

---

## 🔌 APIs

### Produtos

```bash
# Listar produtos do usuário
GET /api/etiquetagem/produtos

# Criar produto
POST /api/etiquetagem/produtos
Body: { nome, categoriaId?, pesoPadrao, unidadeMedida, ... }

# Atualizar produto
PUT /api/etiquetagem/produtos/[id]
Body: { nome, categoriaId?, pesoPadrao, unidadeMedida, ... }

# Excluir produto
DELETE /api/etiquetagem/produtos/[id]
```

### Importação

```bash
# Importar produtos de Excel com IA
POST /api/etiquetagem/importar-produtos
Body: FormData com file (Excel)

Response: {
  produtos: [...],
  total: 10,
  sucesso: 9,
  erro: 1
}
```

### Categorias

```bash
# Listar categorias
GET /api/etiquetagem/categorias

# Criar categorias padrão
POST /api/etiquetagem/seed
```

---

## 🧪 Testes

### Teste Manual

Use a página de teste incluída:

```
test-import.html
```

Abra no navegador e teste:
1. Upload de planilha
2. Classificação com IA
3. Preview de produtos
4. Salvamento

### Teste de API

```bash
# Testar API Key
curl -X POST http://localhost:3000/api/etiquetagem/classificar-produto \
  -H "Content-Type: application/json" \
  -d '{"nomeProduto": "Queijo Mussarela"}'

# Criar categorias
curl -X POST http://localhost:3000/api/etiquetagem/seed

# Listar produtos
curl http://localhost:3000/api/etiquetagem/produtos
```

---

## 🐛 Troubleshooting

### Problema: "API Key não configurada"

```bash
# Adicione no .env:
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx

# Reinicie:
npm run dev
```

### Problema: "Nenhuma categoria disponível"

```bash
# Execute:
curl -X POST http://localhost:3000/api/etiquetagem/seed

# Ou clique no botão no formulário
```

### Problema: "Erro ao importar"

1. Verifique coluna "Nome" na planilha
2. Remova linhas vazias
3. Use formato .xlsx ou .xls válido

---

## 📈 Roadmap

### ✅ Concluído (v1.0.0)

- [x] Cadastro manual de produtos
- [x] Importação por planilha
- [x] Classificação automática com IA
- [x] Busca e filtros
- [x] Estatísticas em tempo real
- [x] Multi-cliente (multi-tenant)
- [x] Interface moderna e responsiva
- [x] Documentação completa

### 🔜 Próximas Versões

#### v1.1.0
- [ ] Exportação para Excel
- [ ] Upload de imagens
- [ ] Tags personalizadas

#### v1.2.0
- [ ] Histórico de alterações
- [ ] Duplicação de produtos
- [ ] Produtos favoritos

#### v2.0.0
- [ ] Integração com Estoque
- [ ] Integração com Pedidos
- [ ] Dashboard de analytics

---

## 📦 Instalação

### Requisitos

- Node.js 18+
- PostgreSQL
- Stack Auth configurado
- OpenRouter API Key (para importação com IA)

### Setup

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-repo/drin-platform.git
   cd drin-platform
   ```

2. **Instale dependências**
   ```bash
   npm install
   ```

3. **Configure variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite .env com suas credenciais
   ```

4. **Configure o banco de dados**
   ```bash
   npx prisma db push
   ```

5. **Crie categorias padrão**
   ```bash
   curl -X POST http://localhost:3000/api/etiquetagem/seed
   ```

6. **Inicie o servidor**
   ```bash
   npm run dev
   ```

7. **Acesse**
   ```
   http://localhost:3000/etiquetagem/produtos
   ```

---

## 🤝 Contribuindo

### Como contribuir

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Código

- TypeScript strict mode
- ESLint + Prettier
- Commits semânticos (Conventional Commits)

---

## 📄 Licença

Este projeto é parte da plataforma Platefull.

---

## 👥 Time

**Platefull Team**
- Desenvolvimento: Drin Platform
- Design: UI/UX Team
- Documentação: Tech Writers

---

## 📞 Suporte

- 📖 Documentação: Veja os guias acima
- 🐛 Issues: GitHub Issues
- 💬 Discussões: GitHub Discussions
- 📧 Email: suporte@platefull.com

---

## 🌟 Agradecimentos

- **OpenRouter** - API gateway para modelos de IA
- **OpenAI** - GPT-4o-mini para classificação
- **Stack Auth** - Autenticação e multi-tenancy
- **Prisma** - ORM para PostgreSQL
- **Next.js** - Framework React
- **shadcn/ui** - Componentes UI

---

## 📊 Status

![Status](https://img.shields.io/badge/status-production-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-proprietary-red)

---

**Última atualização:** Fevereiro 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para produção
