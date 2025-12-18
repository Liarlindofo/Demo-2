# 🚨 TESTE URGENTE NA VPS

## O QUE MUDOU

Implementei **3 mudanças críticas** que devem resolver definitivamente o problema:

### 1. **Flag `--single-process`**
Força o Chrome a rodar em processo único, eliminando qualquer compartilhamento de memória ou singleton global.

### 2. **Flag `pipe: true`**
Faz o Puppeteer usar pipes em vez de WebSocket, eliminando conflitos de porta de debug.

### 3. **Detecção automática de Chrome**
O sistema agora tenta encontrar automaticamente o melhor Chrome disponível:
- `/usr/bin/google-chrome-stable` (preferido)
- `/usr/bin/google-chrome`
- `/usr/bin/chromium-browser`
- `/usr/bin/chromium`
- `/snap/bin/chromium` (último recurso)

---

## 📋 PASSOS PARA TESTAR

### Passo 1: Atualizar Código

```bash
cd /var/www/Demo-2  # ajuste o caminho
git pull
```

### Passo 2: Parar Tudo

```bash
pm2 delete all
ps aux | grep -iE "chrome|chromium" | grep -v grep | awk '{print $2}' | xargs -r kill -9
sudo rm -rf /var/www/whatsapp-sessions/*
sleep 3
```

### Passo 3: Executar Teste de Isolamento do Chrome

Este teste vai confirmar se o Chrome consegue rodar múltiplas instâncias:

```bash
node test-chrome-isolation.js
```

**O que esperar:**
- ✅ Se mostrar "SUCESSO! Ambas as instâncias rodando" → Chrome está OK, pode continuar
- ❌ Se mostrar "browser already running" → Chrome tem bug de singleton, precisa instalar outro

### Passo 4: Se o Teste FALHAR (browser already running)

Instale o Google Chrome "normal":

```bash
cd /tmp
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb -y

# Verificar se instalou
ls -l /usr/bin/google-chrome*
```

Depois, execute o teste novamente:

```bash
cd /var/www/Demo-2
node test-chrome-isolation.js
```

Deve mostrar **SUCESSO** agora.

### Passo 5: Subir a API

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 list
```

### Passo 6: Testar Conexões

1. **Usuário 1c...**:
   - Acessar painel
   - Clicar em "Gerar QR"
   - Aguardar QR aparecer
   - Escanear

2. **Usuário 3f... (ou outro)**:
   - Acessar painel
   - Clicar em "Gerar QR"
   - **DEVE FUNCIONAR AGORA**
   - Escanear

---

## 📊 LOGS ESPERADOS

Com as novas alterações, você verá logs muito mais detalhados:

```
[Platefull Bot] 🔍 Chrome detectado em: /usr/bin/google-chrome-stable
[Platefull Bot] 📦 userDataDir: /var/www/whatsapp-sessions/whatsapp_1c31266a__chrome_lmzx4_a3b5c
[Platefull Bot] 📦 tokenDir: /var/www/whatsapp-sessions/whatsapp_1c31266a
[Platefull Bot] 🎯 headless: true
[Platefull Bot] 🚀 Criando WPPConnect com isolamento TOTAL...
[Platefull Bot] 🔧 Puppeteer args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--single-process","--remote-debugging-port=0"]... (total: 25)
```

---

## ❌ SE AINDA DER ERRO

Envie os seguintes outputs:

### 1. Resultado do teste de isolamento

```bash
node test-chrome-isolation.js 2>&1 | tee test-result.txt
```

Copie e cole o conteúdo de `test-result.txt`

### 2. Lista de Chrome instalados

```bash
which google-chrome google-chrome-stable chromium chromium-browser
ls -l /usr/bin/google-chrome* /usr/bin/chromium* /snap/bin/chromium 2>/dev/null
```

### 3. Logs do primeiro worker que tentar conectar

```bash
pm2 logs whatsapp-1c31266a-caf4-47b7-8a56-84de87634699 --lines 50
```

### 4. Processos Chrome rodando

```bash
ps aux | grep -iE "chrome|chromium" | grep -v grep
```

---

## 💡 ANÁLISE DO PROBLEMA

O erro "browser already running" mesmo com `userDataDir` único indica uma de duas coisas:

1. **Chrome/Chromium com bug de singleton**: Versões do Chrome instaladas via Snap/Flatpak têm um bug conhecido onde o processo principal é compartilhado globalmente, ignorando `userDataDir` em algumas situações.

2. **Falta de flags de isolamento**: O Chrome precisa de flags específicas (`--single-process`, `--remote-debugging-port=0`, etc.) para rodar verdadeiramente isolado.

As alterações que fiz cobrem ambos os casos:
- ✅ Adicionei `--single-process` (força isolamento)
- ✅ Adicionei `pipe: true` (evita conflito de porta)
- ✅ Detecção automática de Chrome (usa o melhor disponível)
- ✅ Logs detalhados para debug

---

## 🎯 RESULTADO ESPERADO

Após executar todos os passos:

- ✅ Teste de isolamento: **SUCESSO**
- ✅ Usuário 1 conecta: **QR gerado**
- ✅ Usuário 2 conecta: **QR gerado SEM ERRO "browser already running"**
- ✅ Ambos funcionando simultaneamente
- ✅ Zero interferência entre usuários

---

**IMPORTANTE**: Execute o teste de isolamento (`test-chrome-isolation.js`) **ANTES** de tentar conectar usuários no painel. Isso vai confirmar se o Chrome instalado suporta múltiplas instâncias.

Se o teste passar mas o WPPConnect ainda falhar, o problema está na camada do WPPConnect (não do Chrome), e vou investigar outra abordagem.

