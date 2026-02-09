# 🏗️ Arquitetura - Gestão de Produtos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [APIs](#apis)
5. [Componentes](#componentes)
6. [Multi-Tenancy](#multi-tenancy)
7. [Integração com IA](#integração-com-ia)

---

## 🎯 Visão Geral

A **Gestão de Produtos** é uma ferramenta centralizada que serve como fonte única de verdade (Single Source of Truth) para dados de produtos na plataforma Platefull.

### Princípios de Design

- **Multi-Tenant:** Isolamento completo de dados por cliente
- **Compartilhável:** Produtos podem ser usados por múltiplas funcionalidades
- **Extensível:** Fácil adicionar novos campos e funcionalidades
- **Performático:** Queries otimizadas com índices apropriados

---

## 📊 Estrutura de Dados

### Schema Prisma

```prisma
model EtiquetagemProduto {
  id                      String   @id @default(cuid())
  userId                  String
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  nome                    String
  categoriaId             String   @map("categoria_id")
  categoria               EtiquetagemCategoria @relation(fields: [categoriaId], references: [id])
  pesoPadrao              Float?   @map("peso_padrao")
  unidadeMedida           String?  @map("unidade_medida")
  marcaFornecedor         String?  @map("marca_fornecedor")
  tipoArmazenamentoPadrao String?  @map("tipo_armazenamento_padrao")
  isAtivo                 Int      @default(1) @map("is_ativo")
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")
  etiquetas               EtiquetagemEtiqueta[]

  @@index([userId])
  @@index([categoriaId])
  @@index([isAtivo])
  @@map("etiquetagem_produtos")
}

model EtiquetagemCategoria {
  id                        String   @id @default(cuid())
  nome                      String
  temperaturaArmazenamento  String   @map("temperatura_armazenamento")
  validadeDescongelado      Int?     @map("validade_descongelado")
  validadeResfriado         Int?     @map("validade_resfriado")
  validadePreparado         Int?     @map("validade_preparado")
  validadePorcionado        Int?     @map("validade_porcionado")
  validadeCongeladoMedio    Int?     @map("validade_congelado_medio")
  validadeCongeladoProfundo Int?     @map("validade_congelado_profundo")
  isAtivo                   Int      @default(1) @map("is_ativo")
  createdAt                 DateTime @default(now()) @map("created_at")
  updatedAt                 DateTime @updatedAt @map("updated_at")
  produtos                  EtiquetagemProduto[]

  @@index([isAtivo])
  @@map("etiquetagem_categorias")
}
```

### Índices

- **userId:** Otimiza queries por cliente
- **categoriaId:** Otimiza joins com categorias
- **isAtivo:** Filtragem de produtos ativos/inativos

---

## 🔄 Fluxo de Dados

### 1. Cadastro Manual

```
Frontend (page.tsx)
    ↓ POST /api/etiquetagem/produtos
API Route (route.ts)
    ↓ Valida dados
    ↓ Autentica usuário (Stack Auth)
    ↓ Sincroniza usuário no DB
Prisma
    ↓ Cria produto com userId
    ↓ Include categoria
Database (PostgreSQL)
    ↓ Retorna produto criado
Frontend
    ↓ Atualiza lista
```

### 2. Importação com IA

```
Frontend (page.tsx)
    ↓ Upload arquivo Excel
    ↓ FormData com file
API Route (importar-produtos/route.ts)
    ↓ Lê arquivo com XLSX
    ↓ Extrai nomes de produtos
    ↓ Para cada produto:
        ↓ Classifica categoria (OpenAI)
        ↓ Sugere peso/unidade (OpenAI)
        ↓ Mapeia categoria no DB
    ↓ Retorna produtos processados
Frontend
    ↓ Exibe preview
    ↓ Usuário confirma
    ↓ POST /api/etiquetagem/produtos (batch)
Database
    ↓ Salva produtos
```

---

## 🔌 APIs

### GET /api/etiquetagem/produtos

Lista produtos do usuário autenticado.

**Autenticação:** Requerida (Stack Auth)

**Query Params:** Nenhum

**Response:**
```json
[
  {
    "id": "clxxx...",
    "nome": "Queijo Mussarela",
    "categoriaId": "clyyy...",
    "categoria": {
      "id": "clyyy...",
      "nome": "Laticínios",
      "temperaturaArmazenamento": "RESFRIADO"
    },
    "pesoPadrao": 1.0,
    "unidadeMedida": "kg",
    "tipoArmazenamentoPadrao": "RESFRIADO",
    "isAtivo": 1,
    "createdAt": "2026-02-09T...",
    "updatedAt": "2026-02-09T..."
  }
]
```

---

### POST /api/etiquetagem/produtos

Cria novo produto.

**Autenticação:** Requerida

**Body:**
```json
{
  "nome": "Frango Desossado",
  "categoriaId": "clzzz...",
  "pesoPadrao": 2.5,
  "unidadeMedida": "kg",
  "tipoArmazenamentoPadrao": "CONGELADO"
}
```

**Validações:**
- `nome`: obrigatório, string
- `categoriaId`: opcional, deve existir no DB
- `pesoPadrao`: obrigatório, número > 0
- `unidadeMedida`: obrigatório, enum [kg, g, L, ml, un]
- `tipoArmazenamentoPadrao`: opcional, enum [RESFRIADO, CONGELADO, TEMPERATURA AMBIENTE]

**Response:** Produto criado (201)

---

### PUT /api/etiquetagem/produtos/[id]

Atualiza produto existente.

**Autenticação:** Requerida

**Validação de Ownership:** Verifica se produto pertence ao userId

**Body:** Mesmos campos do POST

**Response:** Produto atualizado (200)

---

### DELETE /api/etiquetagem/produtos/[id]

Exclui produto (soft delete: `isAtivo = 0`).

**Autenticação:** Requerida

**Validação de Ownership:** Verifica se produto pertence ao userId

**Response:** 204 No Content

---

### POST /api/etiquetagem/importar-produtos

Importa produtos de planilha Excel com classificação por IA.

**Autenticação:** Requerida

**Body:** FormData com `file` (Excel)

**Processo:**

1. **Leitura do Excel**
   ```typescript
   const arrayBuffer = await file.arrayBuffer();
   const workbook = XLSX.read(arrayBuffer, { type: 'array' });
   const data = XLSX.utils.sheet_to_json(worksheet);
   ```

2. **Extração de Nomes**
   - Procura colunas: "Nome", "nome", "Produto", "produto"
   - Filtra linhas inválidas/vazias

3. **Classificação com IA**
   ```typescript
   // Para cada produto:
   const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${apiKey}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       model: 'openai/gpt-4o-mini',
       messages: [
         { role: 'system', content: 'Classifique em uma categoria...' },
         { role: 'user', content: `Classifique: ${produto.nome}` }
       ],
       temperature: 0.1,
       max_tokens: 30,
     }),
   });
   ```

4. **Mapeamento de Categoria**
   - Busca categoria no DB por nome
   - Correspondência exata ou parcial
   - Mapeamentos específicos (ex: "latic" → "Laticínios")

5. **Sugestão de Detalhes**
   - Peso padrão
   - Unidade de medida
   - Tipo de armazenamento

**Response:**
```json
{
  "produtos": [
    {
      "nome": "Queijo Mussarela",
      "categoriaSugerida": "Laticínios",
      "categoriaId": "clyyy...",
      "peso": 1.0,
      "unidade": "kg",
      "armazenamento": "RESFRIADO",
      "status": "sucesso"
    }
  ],
  "total": 10,
  "sucesso": 9,
  "erro": 1
}
```

---

### GET /api/etiquetagem/categorias

Lista todas as categorias ativas.

**Autenticação:** Requerida

**Response:** Array de categorias

---

### POST /api/etiquetagem/seed

Popula categorias padrão no banco.

**Autenticação:** Requerida

**Idempotente:** Não duplica se já existirem

**Response:** Mensagem de sucesso

---

## 🧩 Componentes

### Frontend (Next.js 14 App Router)

```
app/etiquetagem/produtos/
├── page.tsx              # Página principal
└── [id]/
    └── route.ts          # API route para operações por ID

app/api/etiquetagem/
├── produtos/
│   ├── route.ts          # GET, POST
│   └── [id]/
│       └── route.ts      # PUT, DELETE
├── importar-produtos/
│   └── route.ts          # POST (importação)
├── categorias/
│   └── route.ts          # GET
└── seed/
    └── route.ts          # POST
```

### Componentes UI

- **Dialog (Radix UI):** Modais de cadastro/edição e preview
- **Input/Label (shadcn/ui):** Campos de formulário
- **Button (shadcn/ui):** Botões de ação

### Estados (React)

```typescript
const [produtos, setProdutos] = useState<Produto[]>([]);
const [categorias, setCategorias] = useState<Categoria[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [selectedCategory, setSelectedCategory] = useState<string>("all");
const [showModal, setShowModal] = useState(false);
const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
const [importing, setImporting] = useState(false);
const [importedProducts, setImportedProducts] = useState<any[]>([]);
```

---

## 🔐 Multi-Tenancy

### Isolamento por userId

Todos os produtos são isolados por `userId`:

```typescript
// Ao criar produto
const produto = await prisma.etiquetagemProduto.create({
  data: {
    userId: dbUser.id,  // ← Isolamento
    nome,
    categoriaId,
    // ...
  },
});

// Ao listar produtos
const produtos = await prisma.etiquetagemProduto.findMany({
  where: {
    userId: dbUser.id,  // ← Filtro automático
    isAtivo: 1,
  },
});
```

### Autenticação (Stack Auth)

```typescript
const stackUser = await stackServerApp.getUser({ or: 'return-null' });
if (!stackUser) {
  return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
}

const dbUser = await syncStackAuthUser({
  id: stackUser.id,
  primaryEmail: stackUser.primaryEmail,
  // ...
});
```

### Validação de Ownership

```typescript
// Ao editar/excluir, verifica se produto pertence ao usuário
const produto = await prisma.etiquetagemProduto.findFirst({
  where: {
    id: params.id,
    userId: dbUser.id,  // ← Garante ownership
  },
});

if (!produto) {
  return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
}
```

---

## 🤖 Integração com IA

### OpenRouter + OpenAI GPT-4o-mini

**Por que OpenRouter?**
- Acesso unificado a múltiplos modelos
- Melhor custo-benefício
- Fallback automático se um modelo falhar

**Configuração:**

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

### Prompts Otimizados

#### 1. Classificação de Categoria

```typescript
{
  role: 'system',
  content: `Você é um especialista em classificação de alimentos. 
  Classifique o produto em UMA destas categorias EXATAS:
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
  
  Responda APENAS com o nome EXATO da categoria. Nada mais.`
}
```

**Parâmetros:**
- `temperature: 0.1` (baixa criatividade, mais consistência)
- `max_tokens: 30` (resposta curta)

#### 2. Sugestão de Detalhes

```typescript
{
  role: 'system',
  content: `Analise o produto e sugira peso padrão, unidade e armazenamento.
  Responda APENAS em formato JSON válido:
  {"peso": 1.0, "unidade": "kg", "armazenamento": "CONGELADO"}
  
  Unidades válidas: kg, g, L, ml, un
  Armazenamento válido: RESFRIADO, CONGELADO, TEMPERATURA AMBIENTE`
}
```

**Parâmetros:**
- `temperature: 0.3` (um pouco mais de flexibilidade)
- `max_tokens: 100` (JSON response)

### Mapeamento de Categorias

```typescript
const categoriaEncontrada = categorias.find(c => {
  const catNomeLower = c.nome.toLowerCase().trim();
  
  // Correspondência exata
  if (catNomeLower === categoriaLower) return true;
  
  // Correspondência parcial
  if (catNomeLower.includes(categoriaLower) || 
      categoriaLower.includes(catNomeLower)) return true;
  
  // Mapeamentos específicos
  if (categoriaLower.includes('latic') && catNomeLower.includes('latic')) return true;
  if (categoriaLower.includes('carne') && catNomeLower.includes('carne')) return true;
  // ...
  
  return false;
});
```

### Tratamento de Erros

```typescript
try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    // ...
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Erro API OpenRouter:`, response.status, errorText);
    produto.status = 'erro';
    produto.erro = `Erro API: ${response.status}`;
    continue;
  }

  // Processar resposta...
} catch (error) {
  console.error(`❌ Erro ao processar ${produto.nome}:`, error);
  produto.status = 'erro';
  produto.erro = error instanceof Error ? error.message : 'Erro ao processar';
}
```

---

## 🎨 UI/UX

### Design System

- **Cor Principal:** `#001F05` (Verde escuro Platefull)
- **Backgrounds:** `#000000` (preto), `#141415`, `#0f0f10`
- **Borders:** `#374151`
- **Textos:** Branco, cinzas variados

### Animações

```css
/* Spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}

/* Bounce (loading dots) */
.animate-bounce {
  animation: bounce 1s infinite;
}

/* Hover effects */
.hover:scale-110 {
  transition: transform 0.2s;
}
```

### Responsividade

```typescript
// Grid adaptativo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards de estatísticas */}
</div>

// Breakpoints Tailwind
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

## 🧪 Testes

### Teste Manual

1. **Cadastro:**
   - Criar produto sem categoria
   - Criar produto com categoria
   - Validar campos obrigatórios

2. **Importação:**
   - Importar planilha válida
   - Importar planilha com erros
   - Verificar classificação IA

3. **Edição:**
   - Editar nome
   - Mudar categoria
   - Atualizar peso/unidade

4. **Exclusão:**
   - Excluir produto
   - Verificar soft delete

5. **Filtros:**
   - Buscar por nome
   - Filtrar por categoria
   - Limpar filtros

### Teste de Integração

```bash
# Testar API Key
curl -X POST http://localhost:3000/api/etiquetagem/classificar-produto \
  -H "Content-Type: application/json" \
  -d '{"nomeProduto": "Queijo Mussarela"}'

# Testar importação
# Use test-import.html no navegador
```

---

## 📈 Performance

### Otimizações

1. **Índices no DB:**
   - `userId` (queries por cliente)
   - `categoriaId` (joins)
   - `isAtivo` (filtragem)

2. **Queries Otimizadas:**
   ```typescript
   // Include apenas o necessário
   include: {
     categoria: true,  // Evita N+1 queries
   }
   ```

3. **Paginação (futuro):**
   ```typescript
   // Para grandes volumes
   take: 50,
   skip: page * 50,
   ```

### Monitoramento

```typescript
// Logs estruturados
console.log(`📦 Processando ${produtosParaImportar.length} produtos...`);
console.log(`✅ ${produto.nome} processado com sucesso!`);
console.error(`❌ Erro ao processar ${produto.nome}:`, error);
```

---

## 🔮 Roadmap

### Próximas Funcionalidades

- [ ] **Exportação para Excel**
- [ ] **Upload de imagens de produtos**
- [ ] **Tags personalizadas**
- [ ] **Histórico de alterações (audit log)**
- [ ] **Duplicação de produtos**
- [ ] **Importação de múltiplas planilhas**
- [ ] **API pública para integrações**
- [ ] **Webhooks para eventos de produtos**

### Melhorias Técnicas

- [ ] **Cache com Redis**
- [ ] **Paginação server-side**
- [ ] **Busca full-text (PostgreSQL)**
- [ ] **Rate limiting na importação**
- [ ] **Testes automatizados (Jest + Testing Library)**
- [ ] **CI/CD com GitHub Actions**

---

## 📚 Referências

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stack Auth Documentation](https://docs.stack-auth.com)
- [OpenRouter API](https://openrouter.ai/docs)
- [Radix UI](https://www.radix-ui.com)
- [shadcn/ui](https://ui.shadcn.com)

---

**Versão:** 1.0.0  
**Última atualização:** Fevereiro 2026  
**Mantenedor:** Platefull Team
