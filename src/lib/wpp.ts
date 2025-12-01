// wpp.ts — CORRETO E COMPATÍVEL COM SUA VPS

// A única origem do BOT deve ser esta:
const API = process.env.NEXT_PUBLIC_WPP_API;

if (!API) {
  console.error("ERRO: NEXT_PUBLIC_WPP_API não configurada no ambiente!");
  console.error("Configure por exemplo:");
  console.error("NEXT_PUBLIC_WPP_API=https://api.platefull.com.br/api");
}

// Timeout padrão de 30 segundos
const DEFAULT_TIMEOUT = 30000;

async function safeFetch(url: string, options?: RequestInit, timeout: number = DEFAULT_TIMEOUT) {
  if (!API) {
    throw new Error(
      "NEXT_PUBLIC_WPP_API não configurada. Adicione no .env ou na Vercel."
    );
  }

  // Criar AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Erro HTTP ${res.status} ao acessar ${url} → ${text.substring(0, 300)}`
      );
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      throw new Error(`Timeout: A requisição demorou mais de ${timeout}ms para responder`);
    }
    
    console.error("Erro ao chamar o bot:", err.message);
    throw err;
  }
}

// Garantir que a URL da API termina com /api
const getApiUrl = () => {
  if (!API) return '';
  
  // Remover barra final se existir
  let baseUrl = API.trim().replace(/\/+$/, '');
  
  // Se já termina com /api, retorna como está
  if (baseUrl.endsWith('/api')) {
    return baseUrl;
  }
  
  // Adiciona /api no final
  return `${baseUrl}/api`;
};

export async function startConnection(userId: string, slot: number) {
  const apiUrl = getApiUrl();
  const fullUrl = `${apiUrl}/start/${userId}/${slot}`;
  console.log('[WPP] Iniciando conexão:', fullUrl);
  return safeFetch(fullUrl, { method: "POST" }, 60000); // 60s para iniciar conexão
}

export async function getQRCode(userId: string, slot: number) {
  const apiUrl = getApiUrl();
  const fullUrl = `${apiUrl}/qr/${userId}/${slot}`;
  console.log('[WPP] Buscando QR Code:', fullUrl);
  return safeFetch(fullUrl, undefined, 10000); // 10s para buscar QR
}

export async function getStatus(userId: string) {
  const apiUrl = getApiUrl();
  const fullUrl = `${apiUrl}/status/${userId}`;
  return safeFetch(fullUrl, undefined, 10000); // 10s para status
}

export async function stopConnection(userId: string, slot: number) {
  const apiUrl = getApiUrl();
  const fullUrl = `${apiUrl}/stop/${userId}/${slot}`;
  return safeFetch(fullUrl, { method: "POST" }, 30000); // 30s para parar
}
