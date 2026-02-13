# 🔐 Guia do Painel Administrativo - Plateful

## ✅ O que foi implementado

### 1. **Schema do Banco de Dados** ✅
- Modelos criados no Prisma:
  - `AdminUser` - Usuários do painel admin
  - `AdminUserPermission` - Permissões dos usuários
  - `AdminSession` - Sessões ativas
  - `AdminAuditLog` - Logs de auditoria
  - `AdminClient` - Clientes (multi-tenant)

### 2. **Sistema de Autenticação** ✅
- Hash de senhas com bcrypt (12 rounds)
- JWT para sessões
- Middleware de proteção de rotas
- Rate limiting no login (5 tentativas / 15 min)
- Logs de auditoria de login/logout

### 3. **Páginas Criadas** ✅
- `/calenza-adm/login` - Página de login
- `/calenza-adm` - Dashboard principal
- Layout com sidebar responsiva

### 4. **APIs Criadas** ✅
- `POST /api/calenza-adm/login` - Login
- `POST /api/calenza-adm/logout` - Logout
- `POST /api/calenza-adm/seed` - Criar usuário master inicial

## 🚀 Como usar

### 1. Criar usuário master inicial

```bash
# Opção 1: Via API
curl -X POST http://localhost:3000/api/calenza-adm/seed

# Opção 2: Via código (executar uma vez)
# O seed cria automaticamente:
# Email: plateclz
# Senha: word5785
# Role: super_admin
```

### 2. Acessar o painel

1. Acesse: `http://localhost:3000/calenza-adm/login`
2. Faça login com:
   - Email: `plateclz`
   - Senha: `word5785`

### 3. Configurar variáveis de ambiente

Adicione ao `.env`:

```env
# JWT Secret (mínimo 32 caracteres, use uma chave forte em produção!)
ADMIN_JWT_SECRET=sua_chave_secreta_super_forte_aqui_min_32_chars

# Opcional: Configurações de sessão
ADMIN_SESSION_DURATION=7200  # 2 horas em segundos
```

## 📋 Próximos passos (a implementar)

### 1. **Gerenciamento de Usuários** (`/calenza-adm/usuarios`)
- [ ] Listar usuários (tabela com paginação)
- [ ] Criar novo usuário
- [ ] Editar usuário
- [ ] Bloquear/desbloquear usuário
- [ ] Reset de senha
- [ ] Deletar usuário (soft delete)

### 2. **Sistema de Permissões** (`/calenza-adm/usuarios/[id]/permissoes`)
- [ ] Interface visual com checkboxes
- [ ] Agrupar por categoria (Plateful.Label, Plateful.CMV, etc)
- [ ] Salvar permissões no banco

### 3. **Logs de Auditoria** (`/calenza-adm/logs`)
- [ ] Tabela de logs com filtros
- [ ] Filtros por: usuário, ação, período
- [ ] Exportar logs (opcional)

### 4. **Gerenciamento de Clientes** (`/calenza-adm/clientes`)
- [ ] Listar clientes
- [ ] Criar novo cliente
- [ ] Editar cliente
- [ ] Ativar/desativar cliente
- [ ] Ver usuários do cliente

### 5. **Configurações** (`/calenza-adm/configuracoes`)
- [ ] Configurações gerais do sistema
- [ ] Alterar senha do admin master
- [ ] Configurações de segurança

## 🔒 Segurança Implementada

✅ Hash de senhas com bcrypt (12 rounds)
✅ JWT com expiração (2 horas)
✅ Rate limiting no login
✅ Logs de auditoria
✅ Verificação de sessão no banco
✅ Proteção de rotas com middleware
✅ Cookies httpOnly e secure

## ⚠️ IMPORTANTE - Antes de Produção

1. **Alterar credenciais master:**
   - Após primeiro login, alterar senha do `plateclz`
   - Ou criar novo super_admin e desativar o inicial

2. **Configurar secrets fortes:**
   ```env
   ADMIN_JWT_SECRET=chave_super_forte_min_32_caracteres_aleatorios
   ```

3. **Habilitar HTTPS:**
   - Cookies secure só funcionam com HTTPS

4. **Configurar CORS:**
   - Restringir acesso apenas ao domínio da aplicação

5. **Backup:**
   - Configurar backup automático das tabelas admin

## 📁 Estrutura de Arquivos Criada

```
/app
  /calenza-adm
    /login
      page.tsx          ✅ Login
    /layout.tsx         ✅ Layout base
    page.tsx            ✅ Dashboard

/components
  /admin
    Dashboard.tsx       ✅ Dashboard principal
    Sidebar.tsx         ✅ Menu lateral

/lib
  /auth
    adminAuth.ts       ✅ Autenticação e sessões
    password.ts        ✅ Hash de senhas

/src
  /types
    admin.ts          ✅ Tipos TypeScript

/app/api
  /calenza-adm
    /login
      route.ts        ✅ API de login
    /logout
      route.ts        ✅ API de logout
    /seed
      route.ts        ✅ Criar usuário master
```

## 🎨 Design

- Tema escuro profissional
- Cores: #1a1a1a (background), #001F05 (accent)
- Sidebar responsiva (colapsa em mobile)
- Componentes shadcn/ui

## 📝 Notas

- A rota `/calenza-adm` não aparece em menus públicos
- Todas as rotas admin são protegidas
- Logs de auditoria registram todas as ações importantes
- Sistema multi-tenant pronto (campo clientId)

## 🐛 Troubleshooting

### Erro: "JWT_SECRET não configurado"
- Adicione `ADMIN_JWT_SECRET` ao `.env`

### Erro: "Usuário não encontrado"
- Execute o seed: `POST /api/calenza-adm/seed`

### Erro: "Token inválido"
- Faça logout e login novamente
- Verifique se o cookie está sendo enviado
