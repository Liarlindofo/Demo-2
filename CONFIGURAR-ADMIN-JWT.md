# 🔐 Configurar ADMIN_JWT_SECRET na Vercel

## ⚠️ Problema Atual

O erro "Erro ao criar sessão. Verifique ADMIN_JWT_SECRET no .env" indica que a variável de ambiente não está configurada na Vercel.

## ✅ Solução Passo a Passo

### 1. Gerar uma Chave Segura

Execute este comando para gerar uma chave aleatória de 64 caracteres:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use este valor de exemplo (não use em produção, gere um novo):
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 2. Configurar na Vercel

1. **Acesse o Dashboard da Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto

2. **Vá em Settings:**
   - Clique em "Settings" no menu lateral
   - Clique em "Environment Variables"

3. **Adicione a Variável:**
   - Clique em "Add New"
   - **Key:** `ADMIN_JWT_SECRET`
   - **Value:** Cole a chave gerada (mínimo 32 caracteres)
   - **Environment:** Selecione "Production", "Preview" e "Development"
   - Clique em "Save"

4. **Fazer Novo Deploy:**
   - Vá em "Deployments"
   - Clique nos três pontos (...) do último deploy
   - Selecione "Redeploy"
   - Ou faça um novo commit e push

### 3. Verificar se Funcionou

Após o deploy:
1. Acesse: `platefull.com.br/calenza-adm/login`
2. Faça login com:
   - Email: `plateclz`
   - Senha: `word5785`

## 🔒 Segurança

- ✅ Use uma chave única e aleatória
- ✅ Mínimo de 32 caracteres (recomendado: 64+)
- ✅ Nunca commite a chave no código
- ✅ Use chaves diferentes para produção e desenvolvimento

## 📝 Nota

Se você já configurou mas ainda dá erro:
- Verifique se o deploy foi feito após adicionar a variável
- Verifique se a variável está em todos os ambientes (Production, Preview, Development)
- Verifique se não há espaços extras no valor
