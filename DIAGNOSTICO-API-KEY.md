# 🔍 DIAGNÓSTICO - Erro 401 OpenRouter API Key

## ✅ CORREÇÕES APLICADAS

Foram feitas as seguintes melhorias no código:

1. **Carregamento robusto do arquivo .env**
   - O código agora procura o arquivo `.env` em múltiplos locais
   - Caminhos verificados:
     - Raiz do projeto (onde está o `config.js`)
     - Diretório de trabalho atual (`process.cwd()`)
     - `/var/www/I/.env` (caminho absoluto)
     - `/var/www/Demo-2/.env` (caminho alternativo)

2. **Logs de debug adicionados**
   - Logs mostram onde o `.env` foi carregado
   - Logs mostram se a API key foi encontrada (mascarada)
   - Logs de erro mais detalhados

3. **Validação melhorada**
   - Remove espaços em branco da API key
   - Valida se a API key tem tamanho mínimo
   - Mensagens de erro mais claras

## 🔧 VERIFICAÇÕES NA VPS

### 1. Verificar onde o código está rodando

```bash
# Ver processos PM2
pm2 list

# Ver logs de um worker específico
pm2 logs whatsapp-<userId>

# Verificar diretório de trabalho
pm2 describe whatsapp-<userId> | grep cwd
```

### 2. Verificar se o arquivo .env existe

```bash
# Verificar em diferentes locais
ls -la /var/www/I/.env
ls -la /var/www/Demo-2/.env
ls -la $(pwd)/.env

# Ver conteúdo (CUIDADO: não exponha a chave publicamente)
cat /var/www/I/.env | grep OPENROUTER_API_KEY
```

### 3. Verificar conteúdo do arquivo .env

O arquivo `.env` deve conter (sem aspas, sem espaços antes do =):

```bash
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/gpt-4o-mini
```

**⚠️ IMPORTANTE:**
- Não use aspas: `OPENROUTER_API_KEY="sk-or-..."` ❌
- Use assim: `OPENROUTER_API_KEY=sk-or-...` ✅
- Não coloque espaços antes ou depois do `=`

### 4. Criar/Atualizar arquivo .env

```bash
# Navegar até o diretório do projeto
cd /var/www/I  # ou cd /var/www/Demo-2 (verifique qual está sendo usado)

# Criar/editar arquivo .env
nano .env

# Adicionar estas linhas (sem aspas):
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=3001
NODE_ENV=production

# Salvar: Ctrl+O, Enter, Ctrl+X
```

### 5. Verificar permissões do arquivo

```bash
# Dar permissão de leitura
chmod 644 /var/www/I/.env  # ou /var/www/Demo-2/.env

# Verificar propriedade
ls -la /var/www/I/.env
```

### 6. Reiniciar workers do PM2

```bash
# Parar todos os workers
pm2 delete all

# Ou reiniciar um worker específico
pm2 restart whatsapp-<userId>

# Ver logs para verificar se carregou o .env
pm2 logs --lines 50
```

### 7. Verificar logs de inicialização

Após reiniciar, você deve ver nos logs:

```
[config] ✅ Arquivo .env carregado de: /var/www/I/.env
[config] ✅ OPENROUTER_API_KEY carregada: sk-or-v1-3...a3e
```

Se não aparecer, significa que o arquivo não foi encontrado.

## 🐛 POSSÍVEIS PROBLEMAS

### Problema 1: Arquivo .env não encontrado

**Sintoma:** Logs mostram `❌ ERRO: OPENROUTER_API_KEY NÃO encontrada!`

**Solução:**
1. Verifique se o arquivo existe: `ls -la /var/www/I/.env`
2. Verifique se está no diretório correto (onde o PM2 está rodando)
3. Crie o arquivo se não existir

### Problema 2: API Key inválida

**Sintoma:** Erro 401 "User not found" mesmo com a API key configurada

**Solução:**
1. Verifique se a API key está correta no OpenRouter: https://openrouter.ai/keys
2. Verifique se a API key não expirou
3. Verifique se há créditos na conta OpenRouter
4. Teste a API key manualmente:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer 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"
   ```

### Problema 3: Espaços ou caracteres inválidos

**Sintoma:** API key parece estar configurada mas não funciona

**Solução:**
1. Verifique se não há espaços antes/depois do `=`
2. Verifique se não há aspas ao redor do valor
3. Use `cat -A /var/www/I/.env` para ver caracteres invisíveis

### Problema 4: PM2 não carrega variáveis de ambiente

**Sintoma:** Variáveis não estão disponíveis no processo

**Solução:**
1. Certifique-se de que o `.env` está no diretório onde o PM2 inicia o processo
2. Reinicie o PM2 completamente: `pm2 kill && pm2 start ecosystem.config.cjs`
3. Verifique se o `dotenv` está sendo carregado nos logs

## 📋 CHECKLIST FINAL

- [ ] Arquivo `.env` existe no diretório correto
- [ ] Arquivo `.env` contém `OPENROUTER_API_KEY=sk-or-v1-...` (sem aspas)
- [ ] Não há espaços antes/depois do `=`
- [ ] Permissões do arquivo estão corretas (644)
- [ ] Workers do PM2 foram reiniciados
- [ ] Logs mostram `✅ OPENROUTER_API_KEY carregada`
- [ ] API key está válida no OpenRouter
- [ ] Conta OpenRouter tem créditos

## 🚀 TESTE RÁPIDO

Após fazer todas as correções, teste enviando uma mensagem no WhatsApp. Os logs devem mostrar:

```
[AI] Enviando mensagem para GPT-4o mini
[DEBUG] Usando API Key: sk-or-v1-3...a3e (tamanho: 64)
```

E **NÃO** deve aparecer o erro 401.

