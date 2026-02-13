# 🔧 Troubleshooting - Erro 500 no Login Admin

## Problema: Erro 500 "Erro interno do servidor" ao fazer login

### Possíveis Causas e Soluções

#### 1. **ADMIN_JWT_SECRET não configurado**

**Sintoma:** Erro 500 ao criar sessão

**Solução:**
Adicione ao `.env` (ou variáveis de ambiente da Vercel):

```env
ADMIN_JWT_SECRET=sua_chave_secreta_super_forte_min_32_caracteres_aleatorios
```

**Gerar uma chave segura:**
```bash
# Opção 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opção 2: Online
# Use: https://generate-secret.vercel.app/32
```

#### 2. **Usuário não existe no banco**

**Sintoma:** Erro 401 "Credenciais inválidas"

**Solução:**
1. Acesse: `platefull.com.br/calenza-adm/setup`
2. Clique em "Criar Usuário Admin Master"
3. Aguarde confirmação
4. Tente fazer login novamente

#### 3. **Problema com banco de dados**

**Sintoma:** Erro 500 genérico

**Verificar:**
- Conexão com banco de dados está funcionando
- Tabelas `admin_users`, `admin_sessions`, `admin_audit_logs` existem
- Prisma Client foi gerado: `npx prisma generate`

#### 4. **Email não encontrado (case sensitive)**

**Sintoma:** Erro 401 mesmo com credenciais corretas

**Solução:**
- Certifique-se de digitar exatamente: `plateclz` (sem maiúsculas)
- Ou verifique no banco qual email foi salvo

## 🔍 Como Diagnosticar

### 1. Verificar logs do servidor

Na Vercel, vá em:
- Deployments → Seu deploy → Functions → Logs

Procure por:
- `Erro no login:`
- `Erro ao criar sessão:`
- `Erro ao salvar sessão no banco:`

### 2. Testar criação de usuário

Acesse: `platefull.com.br/api/calenza-adm/seed` (POST)

Deve retornar:
```json
{
  "success": true,
  "message": "Admin master criado com sucesso",
  "userId": "..."
}
```

### 3. Verificar variáveis de ambiente

Na Vercel:
1. Settings → Environment Variables
2. Verifique se `ADMIN_JWT_SECRET` está configurado
3. Se não estiver, adicione uma chave de pelo menos 32 caracteres

## ✅ Checklist de Resolução

- [ ] `ADMIN_JWT_SECRET` configurado (mínimo 32 caracteres)
- [ ] Usuário master criado via `/calenza-adm/setup`
- [ ] Tabelas do banco existem (executar `npx prisma db push`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Credenciais corretas: `plateclz` / `word5785`
- [ ] Sem erros nos logs do servidor

## 🚀 Solução Rápida

1. **Configurar JWT_SECRET na Vercel:**
   - Settings → Environment Variables
   - Adicionar: `ADMIN_JWT_SECRET` = chave de 32+ caracteres
   - Fazer novo deploy

2. **Criar usuário:**
   - Acessar: `platefull.com.br/calenza-adm/setup`
   - Clicar em "Criar Usuário Admin Master"

3. **Fazer login:**
   - Email: `plateclz`
   - Senha: `word5785`

## 📝 Notas

- O sistema usa `plateclz` como email (não precisa de @)
- A senha padrão é `word5785`
- Após primeiro login, **altere a senha por segurança**
- Em produção, use um `ADMIN_JWT_SECRET` forte e único
