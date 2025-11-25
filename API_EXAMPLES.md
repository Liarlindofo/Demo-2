# 📡 Exemplos de Uso da API

## Base URL

```
Local: http://localhost:3001/api
Produção: https://bot.platefull.com.br/api
```

## 🏥 Health Check

```bash
curl https://bot.platefull.com.br/api/health
```

**Resposta:**
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67
}
```

## 👤 Criar/Atualizar Configurações do Bot

```bash
curl -X POST https://bot.platefull.com.br/api/settings/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "botName": "Pizza Bot",
    "storeType": "pizzaria",
    "contextLimit": 15,
    "lineLimit": 10,
    "basePrompt": "Você é um atendente simpático de uma pizzaria. Ajude os clientes com pedidos e tire dúvidas sobre o cardápio.",
    "isActive": true
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Configurações atualizadas com sucesso",
  "settings": {
    "botName": "Pizza Bot",
    "storeType": "pizzaria",
    "contextLimit": 15,
    "lineLimit": 10,
    "basePrompt": "Você é um atendente simpático...",
    "isActive": true,
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

## 📱 Buscar Configurações

```bash
curl https://bot.platefull.com.br/api/settings/user123
```

**Resposta:**
```json
{
  "success": true,
  "settings": {
    "botName": "Pizza Bot",
    "storeType": "pizzaria",
    "contextLimit": 15,
    "lineLimit": 10,
    "basePrompt": "Você é um atendente simpático...",
    "isActive": true,
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

## 🚀 Iniciar Conexão WhatsApp

```bash
# Slot 1
curl -X POST https://bot.platefull.com.br/api/start/user123/1

# Slot 2
curl -X POST https://bot.platefull.com.br/api/start/user123/2
```

**Resposta (aguardando QR):**
```json
{
  "success": true,
  "message": "Cliente conectado com sucesso"
}
```

## 📷 Buscar QR Code

```bash
curl https://bot.platefull.com.br/api/qr/user123/1
```

**Resposta:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "slot": 1,
  "updatedAt": "2024-01-15T10:40:00.000Z"
}
```

**Se não houver QR Code:**
```json
{
  "success": false,
  "message": "QR Code não disponível"
}
```

## 📊 Verificar Status

```bash
curl https://bot.platefull.com.br/api/status/user123
```

**Resposta (com 2 slots):**
```json
{
  "success": true,
  "userId": "user123",
  "connections": [
    {
      "slot": 1,
      "isConnected": true,
      "connectedNumber": "5511999999999",
      "qrCode": null,
      "state": "connected",
      "isActive": true,
      "updatedAt": "2024-01-15T10:45:00.000Z"
    },
    {
      "slot": 2,
      "isConnected": false,
      "connectedNumber": null,
      "qrCode": "data:image/png;base64,...",
      "state": "waiting_qr",
      "isActive": false,
      "updatedAt": "2024-01-15T10:40:00.000Z"
    }
  ]
}
```

**Estados possíveis:**
- `connected`: WhatsApp conectado e ativo
- `waiting_qr`: Aguardando escaneamento do QR Code
- `offline`: Desconectado

## 🛑 Parar Conexão

```bash
curl -X POST https://bot.platefull.com.br/api/stop/user123/1
```

**Resposta:**
```json
{
  "success": true,
  "message": "Cliente desconectado com sucesso"
}
```

## 🔄 Fluxo Completo - JavaScript/TypeScript

```typescript
const API_URL = 'https://bot.platefull.com.br/api';
const userId = 'user123';
const slot = 1;

// 1. Configurar bot
async function setupBot() {
  const response = await fetch(`${API_URL}/settings/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      botName: 'Meu Assistente',
      storeType: 'loja',
      contextLimit: 10,
      lineLimit: 8,
      isActive: true
    })
  });
  return response.json();
}

// 2. Iniciar conexão
async function startConnection() {
  const response = await fetch(`${API_URL}/start/${userId}/${slot}`, {
    method: 'POST'
  });
  return response.json();
}

// 3. Buscar QR Code
async function getQRCode() {
  const response = await fetch(`${API_URL}/qr/${userId}/${slot}`);
  const data = await response.json();
  
  if (data.success) {
    return data.qrCode; // base64 da imagem
  }
  return null;
}

// 4. Verificar status (polling)
async function checkStatus() {
  const response = await fetch(`${API_URL}/status/${userId}`);
  const data = await response.json();
  
  const connection = data.connections.find(c => c.slot === slot);
  return connection;
}

// 5. Uso completo
async function connectWhatsApp() {
  // Configura bot
  await setupBot();
  console.log('✓ Bot configurado');
  
  // Inicia conexão
  await startConnection();
  console.log('✓ Conexão iniciada');
  
  // Aguarda QR Code (polling)
  let qrCode = null;
  while (!qrCode) {
    await new Promise(r => setTimeout(r, 2000)); // aguarda 2s
    qrCode = await getQRCode();
  }
  
  console.log('✓ QR Code obtido:', qrCode);
  
  // Mostra QR Code para usuário
  displayQRCode(qrCode);
  
  // Verifica conexão (polling a cada 5s)
  const interval = setInterval(async () => {
    const status = await checkStatus();
    
    if (status.state === 'connected') {
      console.log('✓ WhatsApp conectado!');
      console.log('Número:', status.connectedNumber);
      clearInterval(interval);
    }
  }, 5000);
}

function displayQRCode(base64) {
  // No HTML
  const img = document.getElementById('qrcode');
  img.src = base64;
  
  // ou React
  // <img src={base64} alt="QR Code WhatsApp" />
}
```

## 🎯 React Component Completo

```tsx
import { useState, useEffect } from 'react';

const API_URL = 'https://bot.platefull.com.br/api';

export function WhatsAppConnection({ userId, slot = 1 }) {
  const [status, setStatus] = useState('idle');
  const [qrCode, setQrCode] = useState(null);
  const [connectedNumber, setConnectedNumber] = useState(null);
  
  const startConnection = async () => {
    setStatus('connecting');
    
    try {
      // Inicia conexão
      await fetch(`${API_URL}/start/${userId}/${slot}`, {
        method: 'POST'
      });
      
      // Busca QR Code
      pollQRCode();
    } catch (error) {
      console.error('Erro ao iniciar:', error);
      setStatus('error');
    }
  };
  
  const pollQRCode = async () => {
    const maxAttempts = 30; // 30 segundos
    let attempts = 0;
    
    const interval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setStatus('error');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/qr/${userId}/${slot}`);
        const data = await response.json();
        
        if (data.success && data.qrCode) {
          setQrCode(data.qrCode);
          setStatus('waiting_scan');
          clearInterval(interval);
          checkConnection();
        }
      } catch (error) {
        console.error('Erro ao buscar QR:', error);
      }
    }, 1000);
  };
  
  const checkConnection = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/status/${userId}`);
        const data = await response.json();
        
        const connection = data.connections.find(c => c.slot === slot);
        
        if (connection.state === 'connected') {
          setStatus('connected');
          setConnectedNumber(connection.connectedNumber);
          setQrCode(null);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000);
  };
  
  const disconnect = async () => {
    try {
      await fetch(`${API_URL}/stop/${userId}/${slot}`, {
        method: 'POST'
      });
      setStatus('idle');
      setQrCode(null);
      setConnectedNumber(null);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };
  
  return (
    <div className="whatsapp-connection">
      {status === 'idle' && (
        <button onClick={startConnection}>
          Conectar WhatsApp (Slot {slot})
        </button>
      )}
      
      {status === 'connecting' && (
        <p>Iniciando conexão...</p>
      )}
      
      {status === 'waiting_scan' && qrCode && (
        <div>
          <p>Escaneie o QR Code com seu WhatsApp:</p>
          <img src={qrCode} alt="QR Code" />
        </div>
      )}
      
      {status === 'connected' && (
        <div>
          <p>✅ Conectado!</p>
          <p>Número: {connectedNumber}</p>
          <button onClick={disconnect}>Desconectar</button>
        </div>
      )}
      
      {status === 'error' && (
        <div>
          <p>❌ Erro ao conectar</p>
          <button onClick={startConnection}>Tentar novamente</button>
        </div>
      )}
    </div>
  );
}
```

## 🔒 Autenticação (Opcional)

Se quiser adicionar autenticação básica:

```javascript
const token = 'seu-jwt-token';

fetch(`${API_URL}/settings/${userId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📝 Notas

- Todos os endpoints retornam JSON
- Status HTTP 200 para sucesso
- Status HTTP 400/404/500 para erros
- CORS configurado para `https://platefull.com.br`
- Rate limiting recomendado em produção

---

**Precisa de mais exemplos?** Consulte o README.md principal.

