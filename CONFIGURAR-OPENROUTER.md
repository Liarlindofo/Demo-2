# ⚠️ CONFIGURAÇÃO NECESSÁRIA - OpenRouter API Key

## 🚨 Problema Identificado

A importação de produtos **não está funcionando** porque falta configurar a **OpenRouter API Key**.

## 📋 Passo a Passo para Configurar

### 1️⃣ Obter a API Key

1. Acesse: https://openrouter.ai/
2. Faça login ou crie uma conta
3. Vá em **Keys** no menu
4. Clique em **Create Key**
5. Copie a chave gerada

### 2️⃣ Adicionar no Projeto

Abra o arquivo `.env.local` na raiz do projeto e adicione:

```env
OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui
```

### 3️⃣ Adicionar na Vercel (Produção)

1. Acesse o dashboard da Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** sua chave
   - **Environment:** Production, Preview, Development

### 4️⃣ Reiniciar o Servidor

Depois de adicionar a chave:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

## 🎯 Modelo Utilizado

O projeto está configurado para usar: **openai/gpt-4o-mini**

Este modelo é:
- ✅ Rápido
- ✅ Econômico ($0.15 por 1M tokens)
- ✅ Preciso para classificação

## 💰 Custos Estimados

Para classificar **1000 produtos**:
- Aproximadamente **$0.10** (10 centavos de dólar)
- Muito acessível!

## 🧪 Testar Após Configurar

1. Reinicie o servidor
2. Acesse a página de produtos
3. Clique em "Importar"
4. Selecione um arquivo Excel simples
5. Verifique o console do navegador (F12) para logs detalhados

## 📊 Exemplo de Arquivo para Testar

Crie um arquivo `teste.xlsx` com:

| Nome |
|------|
| Queijo Mussarela |
| Presunto |
| Frango Congelado |
| Tomate |

## ❓ Problemas?

Se ainda não funcionar após configurar, abra o **Console do Navegador** (F12) e procure por:
- 🤖 "Resposta da IA"
- 📦 "Produto:"
- ✅ "Categoria encontrada"
- ❌ Mensagens de erro em vermelho

Envie essas mensagens para análise!
