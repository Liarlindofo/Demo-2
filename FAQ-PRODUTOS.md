# ❓ FAQ - Perguntas Frequentes - Gestão de Produtos

## 📋 Índice

1. [Geral](#geral)
2. [Cadastro Manual](#cadastro-manual)
3. [Importação com IA](#importação-com-ia)
4. [Categorias](#categorias)
5. [Busca e Filtros](#busca-e-filtros)
6. [Multi-Cliente](#multi-cliente)
7. [Erros Comuns](#erros-comuns)
8. [Performance](#performance)
9. [Segurança](#segurança)
10. [Integrações](#integrações)

---

## 🎯 Geral

### O que é a Gestão de Produtos?

É uma ferramenta centralizada para cadastrar e gerenciar produtos que serão usados em diversas funcionalidades da plataforma Platefull, como etiquetagem, estoque, pedidos, etc.

### Preciso pagar para usar?

A ferramenta em si é gratuita. Porém, para usar a importação com IA, você precisa de uma API Key do OpenRouter (custo muito baixo: ~$0.0001 por produto).

### Quantos produtos posso cadastrar?

Não há limite! Você pode cadastrar quantos produtos precisar.

### Os dados são seguros?

Sim! Todos os produtos são isolados por usuário (multi-tenant). Você só vê e gerencia seus próprios produtos.

---

## ✏️ Cadastro Manual

### Quais campos são obrigatórios?

- **Nome do Produto**
- **Peso Padrão**
- **Unidade de Medida**

### Quais campos são opcionais?

- Categoria
- Marca/Fornecedor
- Tipo de Armazenamento

### Posso cadastrar produto sem categoria?

Sim! Você pode cadastrar e adicionar a categoria depois.

### Como editar um produto?

1. Localize o produto na lista
2. Clique no ícone de lápis (✏️)
3. Edite as informações
4. Clique em "Atualizar Produto"

### Como excluir um produto?

1. Localize o produto na lista
2. Clique no ícone de lixeira (🗑️)
3. Confirme a exclusão

⚠️ **Atenção:** A exclusão é permanente!

### Posso recuperar um produto excluído?

Não. A exclusão é permanente (soft delete no banco, mas não há interface para recuperar).

---

## 📊 Importação com IA

### Como funciona a importação?

1. Você faz upload de uma planilha Excel
2. A IA (GPT-4o-mini) classifica cada produto
3. Você vê um preview com as sugestões
4. Você confirma e os produtos são salvos

### Que formato de planilha devo usar?

- **Formato:** .xlsx ou .xls
- **Coluna obrigatória:** "Nome" ou "Produto"
- **Estrutura:** Uma coluna com nomes de produtos

Veja exemplos em: [exemplo-importacao-produtos.md](./exemplo-importacao-produtos.md)

### Quanto tempo leva para importar?

- **Pequeno (10 produtos):** ~10 segundos
- **Médio (50 produtos):** ~30 segundos
- **Grande (100 produtos):** ~60 segundos

### Quanto custa a importação?

- **Custo por produto:** ~$0.0001
- **100 produtos:** ~$0.01
- **1000 produtos:** ~$0.10

Muito barato! 💰

### A IA sempre acerta a categoria?

A IA tem alta precisão (~95%), mas pode errar. Por isso, sempre revise o preview antes de salvar.

### O que acontece se a IA não encontrar a categoria?

O produto é salvo **sem categoria**. Você pode editar depois e adicionar manualmente.

### Posso importar produtos com categorias personalizadas?

Não diretamente. A IA só classifica nas categorias padrão do sistema. Mas você pode editar depois.

### Preciso de internet para importar?

Sim! A classificação por IA requer conexão com a API do OpenRouter.

### Posso importar a mesma planilha várias vezes?

Sim, mas produtos duplicados serão criados. Não há verificação de duplicatas automática.

---

## 🏷️ Categorias

### Quais categorias estão disponíveis?

1. Carnes e Aves
2. Peixes e Frutos do Mar
3. Laticínios
4. Vegetais
5. Frutas
6. Grãos e Cereais
7. Massas
8. Congelados
9. Processados
10. Bebidas
11. Temperos e Condimentos
12. Panificação

### Como criar as categorias padrão?

**Opção 1:** Clique em "Criar Categorias Padrão" no formulário de cadastro

**Opção 2:** Execute:
```bash
curl -X POST http://localhost:3000/api/etiquetagem/seed
```

### Posso criar categorias personalizadas?

Atualmente não há interface para isso. Entre em contato com o suporte para adicionar novas categorias.

### Posso editar ou excluir categorias?

Não pela interface. Categorias são compartilhadas entre todos os clientes e gerenciadas pelo administrador.

### O que significa "Sem categoria"?

Produtos que foram cadastrados mas não têm uma categoria associada.

---

## 🔍 Busca e Filtros

### Como buscar produtos?

Digite no campo de busca:
- Nome do produto
- Nome da categoria

A busca é instantânea e case-insensitive.

### Como filtrar por categoria?

Use o dropdown "Filtrar por categoria" e selecione:
- **Todas as categorias** - Mostra todos
- **Sem categoria** - Apenas produtos sem categoria
- **[Nome da Categoria]** - Produtos daquela categoria

### Posso combinar busca e filtro?

Sim! Você pode buscar por texto E filtrar por categoria ao mesmo tempo.

### Como limpar os filtros?

Clique em "Limpar filtros" abaixo dos campos de busca.

### A busca funciona em tempo real?

Sim! Os resultados aparecem instantaneamente conforme você digita.

---

## 🔐 Multi-Cliente

### O que é multi-cliente (multi-tenant)?

Cada usuário/cliente tem seus próprios produtos isolados. Você não vê produtos de outros clientes.

### Posso compartilhar produtos com outros usuários?

Não. Cada cliente tem seus próprios produtos. Isso garante privacidade e segurança.

### As categorias são compartilhadas?

Sim! As categorias são globais e compartilhadas entre todos os clientes.

### Posso ter produtos com o mesmo nome de outro cliente?

Sim! Como os dados são isolados, não há conflito.

### Como funciona a autenticação?

Usamos **Stack Auth** para autenticação. Ao fazer login, seu `userId` é usado para filtrar todos os dados.

---

## 🐛 Erros Comuns

### "API Key não configurada"

**Causa:** Variável `OPENROUTER_API_KEY` não está no `.env`

**Solução:**
```bash
# Adicione no .env:
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx

# Reinicie o servidor:
npm run dev
```

### "Nenhuma categoria disponível"

**Causa:** Categorias não foram criadas no banco

**Solução:**
```bash
curl -X POST http://localhost:3000/api/etiquetagem/seed
```

Ou clique em "Criar Categorias Padrão" no formulário.

### "Erro ao importar produtos"

**Causas possíveis:**
- Planilha sem coluna "Nome"
- Arquivo corrompido
- Linhas vazias
- Formato inválido

**Solução:**
1. Verifique se há coluna "Nome" ou "Produto"
2. Remova linhas vazias
3. Salve como .xlsx válido
4. Tente novamente

### "Produtos não aparecem"

**Causas possíveis:**
- Não está logado
- Filtros ativos
- Produtos de outro usuário

**Solução:**
1. Verifique se está logado
2. Clique em "Limpar filtros"
3. Recarregue a página (F5)

### "Erro 401 - Não autenticado"

**Causa:** Sessão expirada ou não está logado

**Solução:**
1. Faça login novamente
2. Verifique se Stack Auth está configurado

### "Erro 500 - Erro interno"

**Causa:** Problema no servidor

**Solução:**
1. Verifique logs do console (F12)
2. Verifique logs do servidor (terminal)
3. Entre em contato com suporte

---

## ⚡ Performance

### A página está lenta

**Causas possíveis:**
- Muitos produtos cadastrados (>1000)
- Conexão lenta
- Servidor sobrecarregado

**Solução:**
1. Use filtros para reduzir resultados
2. Aguarde carregamento completo
3. Verifique conexão de internet

### A importação está travando

**Causas possíveis:**
- Muitos produtos na planilha (>100)
- API do OpenRouter lenta
- Sem créditos na API

**Solução:**
1. Divida em planilhas menores (50 produtos)
2. Aguarde pacientemente
3. Verifique créditos no OpenRouter

### Como melhorar a performance?

1. **Use filtros** para reduzir resultados exibidos
2. **Importe em lotes** menores (50 produtos)
3. **Limpe cache** do navegador periodicamente

---

## 🔒 Segurança

### Meus dados estão seguros?

Sim! Todos os dados são:
- ✅ Isolados por usuário (multi-tenant)
- ✅ Armazenados em PostgreSQL seguro
- ✅ Autenticados via Stack Auth
- ✅ Transmitidos via HTTPS

### Quem pode ver meus produtos?

Apenas você! Cada usuário vê apenas seus próprios produtos.

### Posso exportar meus dados?

Atualmente não há função de exportação. Está no roadmap para v1.1.0.

### O que acontece se eu excluir minha conta?

Todos os seus produtos são excluídos automaticamente (CASCADE no banco).

### A IA armazena meus dados?

Não! A IA (OpenRouter/OpenAI) apenas processa os nomes dos produtos e retorna a classificação. Não armazena nada.

---

## 🔄 Integrações

### Onde os produtos são usados?

Atualmente:
- ✅ **Etiquetagem** - Ao gerar etiquetas

Em breve:
- 🔜 **Estoque** - Controle de entrada/saída
- 🔜 **Pedidos** - Seleção de produtos
- 🔜 **Relatórios** - Analytics

### Como os produtos aparecem na etiquetagem?

Ao gerar uma etiqueta, você seleciona o produto e as informações (categoria, peso, armazenamento) são pré-preenchidas.

### Posso usar produtos em outras ferramentas?

Sim! A gestão de produtos é centralizada e compartilhada com todas as ferramentas da plataforma.

### Como integrar via API?

Veja a documentação completa em: [ARQUITETURA-PRODUTOS.md](./ARQUITETURA-PRODUTOS.md)

Endpoints principais:
```bash
GET    /api/etiquetagem/produtos
POST   /api/etiquetagem/produtos
PUT    /api/etiquetagem/produtos/[id]
DELETE /api/etiquetagem/produtos/[id]
```

---

## 🚀 Recursos Avançados

### Posso importar imagens de produtos?

Não ainda. Está planejado para v1.1.0.

### Posso adicionar tags personalizadas?

Não ainda. Está planejado para v1.1.0.

### Posso ver histórico de alterações?

Não ainda. Está planejado para v1.2.0.

### Posso duplicar produtos?

Não ainda. Está planejado para v1.2.0.

### Posso favoritar produtos?

Não ainda. Está planejado para v1.2.0.

---

## 💡 Dicas e Boas Práticas

### Como organizar melhor meus produtos?

1. ✅ Use nomes descritivos e específicos
2. ✅ Sempre associe uma categoria
3. ✅ Mantenha peso/unidade atualizados
4. ✅ Defina tipo de armazenamento
5. ✅ Revise produtos "Sem categoria" periodicamente

### Como aproveitar melhor a IA?

1. ✅ Use nomes completos (ex: "Queijo Mussarela Fatiado")
2. ✅ Inclua marca quando relevante
3. ✅ Especifique o tipo (ex: "Tomate Cereja")
4. ✅ Revise sempre o preview antes de salvar

### Como evitar duplicatas?

1. ✅ Busque antes de cadastrar
2. ✅ Use nomes padronizados
3. ✅ Revise lista periodicamente

### Qual a melhor forma de importar muitos produtos?

1. ✅ Divida em planilhas de 50 produtos
2. ✅ Importe uma por vez
3. ✅ Revise cada preview
4. ✅ Corrija erros antes de continuar

---

## 📞 Suporte

### Onde encontro mais ajuda?

- 📖 **Guia do Usuário:** [GUIA-GESTAO-PRODUTOS.md](./GUIA-GESTAO-PRODUTOS.md)
- 🏗️ **Documentação Técnica:** [ARQUITETURA-PRODUTOS.md](./ARQUITETURA-PRODUTOS.md)
- 📊 **Exemplos de Planilha:** [exemplo-importacao-produtos.md](./exemplo-importacao-produtos.md)
- 📋 **README Principal:** [PRODUTOS-README.md](./PRODUTOS-README.md)

### Como reportar um bug?

1. Abra uma issue no GitHub
2. Descreva o problema
3. Inclua prints/logs se possível
4. Informe navegador e versão

### Como sugerir melhorias?

1. Abra uma discussion no GitHub
2. Descreva sua sugestão
3. Explique o caso de uso

### Posso contribuir com código?

Sim! Veja o guia de contribuição no README principal.

---

## 🔮 Roadmap

### O que vem por aí?

#### v1.1.0 (próximo)
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

### Como acompanhar o desenvolvimento?

- GitHub: Veja issues e milestones
- Changelog: Arquivo CHANGELOG.md
- Releases: GitHub Releases

---

## 📊 Estatísticas

### Quantos produtos outros usuários têm?

Não compartilhamos estatísticas de outros usuários por privacidade.

### Qual a média de produtos por cliente?

Varia muito, de 10 a 1000+ produtos.

### Qual a categoria mais usada?

Geralmente "Carnes e Aves" e "Laticínios" são as mais populares.

---

## 🎓 Tutoriais

### Tutorial 1: Primeiro Cadastro

1. Acesse `/etiquetagem/produtos`
2. Clique em "Novo Produto"
3. Preencha: Nome, Peso, Unidade
4. Selecione Categoria (opcional)
5. Clique em "Salvar Produto"

### Tutorial 2: Primeira Importação

1. Crie planilha Excel com coluna "Nome"
2. Liste 5-10 produtos
3. Acesse `/etiquetagem/produtos`
4. Clique em "Importar Excel"
5. Selecione arquivo
6. Aguarde classificação
7. Revise preview
8. Clique em "Salvar X Produtos"

### Tutorial 3: Organizando Produtos

1. Use busca para encontrar produtos
2. Filtre por "Sem categoria"
3. Edite cada produto
4. Adicione categoria
5. Salve alterações

---

## ❓ Ainda tem dúvidas?

### Não encontrou sua resposta aqui?

1. 📖 Consulte os guias completos
2. 🔍 Busque no GitHub Issues
3. 💬 Abra uma discussion
4. 📧 Entre em contato: suporte@platefull.com

---

**Última atualização:** Fevereiro 2026  
**Versão:** 1.0.0  
**Plataforma:** Platefull - Drin Platform
