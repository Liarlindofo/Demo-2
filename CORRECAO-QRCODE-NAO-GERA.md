# 🔧 Correção: QR Code Não Está Sendo Gerado

## 🐛 Problema

Após corrigir o isolamento entre usuários, o QR code não está sendo gerado para o usuário que solicita.

## 🔍 Causa Identificada

O erro nos logs mostra:
```
The browser is already running for /var/www/whatsapp-sessions/{userId}-slot1
```

Isso significa que processos Chrome órfãos ainda estão rodando, bloqueando a criação de novas sessões.

## ✅ Correções Aplicadas

### 1. Limpeza Mais Agressiva (`src/wpp/index.js`)

A função `cleanupOrphanBrowser` agora:
- ✅ Busca processos por **múltiplos métodos** (userDataDir, sessionName, sessionsDir)
- ✅ Usa `pkill` como método adicional
- ✅ Verifica processos restantes após limpeza
- ✅ Mata TODOS os processos Chrome se houver muitos rodando

### 2. Verificação Antes de Criar Cliente

Adicionada verificação **ANTES** de tentar criar o cliente:
- ✅ Verifica se ainda há processos Chrome rodando
- ✅ Executa limpeza adicional se necessário
- ✅ Aguarda confirmação antes de prosseguir

### 3. Tratamento de Erro Melhorado

Quando o erro "browser already running" ocorre:
- ✅ Executa limpeza **EXTRA AGRESSIVA**
- ✅ Deleta a pasta inteira e recria
- ✅ Aguarda mais tempo (5 segundos)
- ✅ Tenta criar o cliente novamente

## 🚀 Aplicar na VPS

### Passo 1: Atualizar Código

```bash
cd /var/www/drin-platform  # ou seu caminho
git pull origin main  # ou fazer upload manual dos arquivos
```

### Passo 2: Limpar Processos e Sessões

```bash
# Executar script de limpeza
chmod +x scripts/limpar-sessoes-whatsapp.sh
./scripts/limpar-sessoes-whatsapp.sh --no-backup
```

### Passo 3: Reiniciar Bot

```bash
pm2 restart bot-whatsapp
```

### Passo 4: Verificar Logs

```bash
pm2 logs bot-whatsapp
```

## 🧪 Teste

1. **Gerar QR Code para um usuário**
2. **Verificar nos logs** que aparecem:
   ```
   🧹 Iniciando limpeza DRÁSTICA para: /var/www/whatsapp-sessions/{userId}-slot1
   ✅ Nenhum processo Chrome rodando para esta sessão. Prosseguindo...
   [WPP] Cliente WPPConnect criado.
   [WPP] QR Code gerado
   ```

3. **Se ainda der erro "browser already running"**, você verá:
   ```
   Browser já está rodando para {userDataDir}, tentando limpeza EXTRA AGRESSIVA...
   ✅ Pasta deletada durante limpeza extra
   ✅ Pasta recriada durante limpeza extra
   Tentando criar cliente novamente após limpeza extra...
   ✅ Cliente WPPConnect criado após limpeza extra.
   ```

## ⚠️ Se Ainda Não Funcionar

Execute esta limpeza MANUAL mais agressiva:

```bash
# 1. Parar bot
pm2 stop bot-whatsapp

# 2. Matar TODOS os processos Chrome
pkill -9 -f chrome
pkill -9 -f chromium
pkill -9 -f puppeteer
pkill -9 -f whatsapp
pkill -9 -f wppconnect

# 3. Aguardar
sleep 5

# 4. Deletar TODAS as sessões
rm -rf /var/www/whatsapp-sessions/*

# 5. Limpar locks do Puppeteer
find /tmp -name "puppeteer*" -delete 2>/dev/null
find /tmp -name ".puppeteer*" -exec rm -rf {} + 2>/dev/null

# 6. Reiniciar bot
pm2 restart bot-whatsapp

# 7. Verificar logs
pm2 logs bot-whatsapp
```

## 📊 Logs Esperados (Sucesso)

```
=== 🔍 DEBUG ISOLAMENTO SESSÃO ===
📌 userId recebido: 3f203a94-927c-45c3-8b02-224635092009
📌 userId normalizado: 3f203a94-927c-45c3-8b02-224635092009
📌 sessionName gerado: 3f203a94-927c-45c3-8b02-224635092009-slot1
📌 userDataDir: /var/www/whatsapp-sessions/3f203a94-927c-45c3-8b02-224635092009-slot1
==================================

🧹 Iniciando limpeza DRÁSTICA para: /var/www/whatsapp-sessions/3f203a94-927c-45c3-8b02-224635092009-slot1
📌 Nome da sessão: 3f203a94-927c-45c3-8b02-224635092009-slot1
✅ Nenhum processo órfão encontrado pelo método ps
✅ Processos finalizados via pkill
✅ Nenhum processo Chrome rodando para esta sessão. Prosseguindo...

[WPP [3f203a94-927c-45c3-8b02-224635092009:1]] Cliente WPPConnect criado.
[WPP [3f203a94-927c-45c3-8b02-224635092009:1]] QR Code gerado
```

## 📝 Arquivos Modificados

- `src/wpp/index.js` - Limpeza mais agressiva e verificação antes de criar cliente

