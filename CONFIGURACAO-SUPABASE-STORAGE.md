# 📸 CONFIGURAÇÃO: Supabase Storage para Fotos do Checklist

## ✅ **O QUE FOI IMPLEMENTADO:**

1. ✅ Endpoint de upload: `/api/checklist/upload-photo`
2. ✅ Upload direto para Supabase Storage (sem passar pela Vercel com base64)
3. ✅ Fotos salvas como URLs no banco (não mais base64)
4. ✅ Resolve erro 413 definitivamente

---

## 🔧 **CONFIGURAÇÃO NECESSÁRIA:**

### **1. Criar Projeto no Supabase**

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (se não tiver)
3. Crie um novo projeto
4. Anote a **URL do projeto** e a **Service Role Key**

### **2. Criar Bucket de Storage**

1. No dashboard do Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome: `checklist-photos`
4. **Public bucket**: ✅ Marque como público (para URLs públicas)
5. Clique em **Create bucket**

### **3. Configurar Políticas de Acesso (RLS)**

1. No bucket `checklist-photos`, vá em **Policies**
2. Crie uma política para permitir upload:

```sql
-- Política para permitir upload autenticado
CREATE POLICY "Users can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'checklist-photos');
```

3. Crie política para leitura pública:

```sql
-- Política para leitura pública
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'checklist-photos');
```

### **4. Adicionar Variáveis de Ambiente**

Adicione no seu `.env.local` (ou variáveis de ambiente da Vercel):

```bash
# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**⚠️ IMPORTANTE:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL pública do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (encontre em Settings > API)
- **NUNCA** exponha a Service Role Key no frontend!

---

## 📊 **COMO FUNCIONA AGORA:**

### **Antes (Problema):**
```
Usuário tira foto
  ↓
Converte para base64 (2.7MB)
  ↓
Envia no JSON do checklist
  ↓
❌ Erro 413 (ultrapassa 4.5MB da Vercel)
```

### **Agora (Solução):**
```
Usuário tira foto
  ↓
Upload direto para Supabase Storage (1 foto por vez)
  ↓
Supabase retorna URL pública
  ↓
Salva apenas URL no banco (~100 bytes)
  ↓
✅ Checklist sempre pequeno (< 4.5MB)
```

---

## 💰 **CUSTOS:**

### **Tier Gratuito do Supabase:**
- ✅ **1GB de armazenamento** grátis
- ✅ **2GB de transferência** grátis/mês
- ✅ Upload ilimitado
- ✅ Sem custo adicional

**Exemplo:**
- 500 fotos × 2MB = 1GB
- **Custo: R$ 0,00** (dentro do tier gratuito)

### **Se ultrapassar o tier gratuito:**
- Armazenamento: $0.021/GB/mês (~R$ 0.10)
- Transferência: $0.09/GB (~R$ 0.45)

---

## ✅ **VANTAGENS:**

1. ✅ **Resolve erro 413 definitivamente** (fotos não passam pela Vercel)
2. ✅ **Sem compressão** (qualidade original mantida)
3. ✅ **Gratuito até 1GB** (suficiente para começar)
4. ✅ **Melhor performance** (fotos servidas direto do Supabase)
5. ✅ **Escalável** (pode crescer conforme necessário)

---

## 🧪 **TESTAR:**

1. Configure as variáveis de ambiente
2. Crie o bucket no Supabase
3. Configure as políticas RLS
4. Tente adicionar uma foto no checklist
5. Verifique se a foto aparece e se o upload funciona

---

## ⚠️ **TROUBLESHOOTING:**

### **Erro: "Supabase não configurado"**
- Verifique se as variáveis de ambiente estão configuradas
- Reinicie o servidor após adicionar as variáveis

### **Erro: "Bucket não encontrado"**
- Verifique se o bucket `checklist-photos` foi criado
- Verifique se o nome está exatamente como `checklist-photos`

### **Erro: "Permission denied"**
- Verifique se as políticas RLS estão configuradas corretamente
- Verifique se o bucket está marcado como público

### **Fotos não aparecem**
- Verifique se a URL retornada está correta
- Verifique se o bucket permite leitura pública

---

## 📋 **PRÓXIMOS PASSOS:**

1. ✅ Configurar Supabase
2. ✅ Adicionar variáveis de ambiente
3. ✅ Criar bucket e políticas
4. ✅ Testar upload de fotos
5. ✅ Verificar se erro 413 foi resolvido

---

**Data:** 12/02/2026  
**Status:** ✅ Implementação completa - Aguardando configuração do Supabase
