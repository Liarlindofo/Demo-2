# 🎯 GUIA VISUAL: Configurar Supabase Storage

## 📍 **PASSO A PASSO NO DASHBOARD DO SUPABASE:**

### **1️⃣ FECHAR O MODAL DE CONEXÃO**
- Você está vendo o modal "Connect to your project"
- **Clique no X** ou clique fora do modal para fechar
- Isso vai mostrar o dashboard principal

---

### **2️⃣ IR PARA STORAGE**

No menu lateral esquerdo, procure por:
- **"Storage"** (ícone de pasta/arquivo 📁)
- Clique nele

**Onde fica:**
```
Dashboard
├── Table Editor
├── Authentication
├── Storage  ← CLIQUE AQUI
├── Edge Functions
├── Database
└── Settings
```

---

### **3️⃣ CRIAR O BUCKET**

Na página de Storage:

1. **Clique no botão "New bucket"** (canto superior direito)
2. Preencha:
   - **Name:** `checklist-photos` (exatamente assim, sem espaços)
   - **Public bucket:** ✅ **MARQUE ESTA OPÇÃO** (importante!)
3. **Clique em "Create bucket"**

**⚠️ IMPORTANTE:** O bucket DEVE ser público para as URLs funcionarem!

---

### **4️⃣ ENCONTRAR AS VARIÁVEIS DE AMBIENTE**

No menu lateral esquerdo:

1. Clique em **"Settings"** (ícone de engrenagem ⚙️)
2. Clique em **"API"** (dentro de Settings)
3. Você verá duas informações importantes:

#### **a) Project URL:**
```
Project URL
https://uluydllxvrteawtltceu.supabase.co
```
**Copie isso** → vai ser `NEXT_PUBLIC_SUPABASE_URL`

#### **b) API Keys:**
Procure por:
```
service_role
[secret] [Reveal] [Copy]
```
**Clique em "Reveal"** e depois **"Copy"** → vai ser `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ CUIDADO:** A `service_role` key é SECRETA! Nunca exponha no frontend!

---

### **5️⃣ CONFIGURAR POLÍTICAS (OPCIONAL, MAS RECOMENDADO)**

Volte para **Storage** → **Policies**:

1. Selecione o bucket `checklist-photos`
2. Clique em **"New Policy"**
3. Escolha **"For full customization"**
4. Cole este SQL:

```sql
-- Política para permitir upload autenticado
CREATE POLICY "Users can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'checklist-photos');
```

5. Clique em **"Review"** e depois **"Save policy"**

Repita para leitura pública:

```sql
-- Política para leitura pública
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'checklist-photos');
```

---

## 🔧 **ADICIONAR VARIÁVEIS NO SEU PROJETO**

### **No arquivo `.env.local` (local):**

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```bash
# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://uluydllxvrteawtltceu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### **Na Vercel (produção):**

1. Vá em **Settings** → **Environment Variables**
2. Adicione as duas variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Marque para **Production**, **Preview** e **Development**
4. Clique em **Save**

---

## ✅ **VERIFICAR SE ESTÁ TUDO CERTO:**

1. ✅ Bucket `checklist-photos` criado e público
2. ✅ Variáveis de ambiente configuradas
3. ✅ Políticas RLS configuradas (opcional)
4. ✅ Servidor reiniciado após adicionar variáveis

---

## 🧪 **TESTAR:**

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
2. Acesse a página de checklist
3. Tente adicionar uma foto
4. Verifique se o upload funciona

---

## 📸 **RESUMO VISUAL:**

```
Dashboard Supabase
│
├── 1. Fechar modal de conexão
│
├── 2. Clicar em "Storage" (menu lateral)
│   └── 3. Criar bucket "checklist-photos" (público)
│
├── 4. Clicar em "Settings" → "API"
│   ├── Copiar Project URL
│   └── Copiar service_role key
│
└── 5. Adicionar variáveis no .env.local
    └── Reiniciar servidor
```

---

**Pronto!** Depois disso, o upload de fotos deve funcionar e o erro 413 vai desaparecer! 🎉
