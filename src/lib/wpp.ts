// wpp.ts — CORRETO E COMPATÍVEL COM SUA VPS

// A única origem do BOT deve ser esta:
const API = process.env.NEXT_PUBLIC_WPP_API;

if (!API) {
  console.error("ERRO: NEXT_PUBLIC_WPP_API não configurada no ambiente!");
  console.error("Configure por exemplo:");
  console.error("NEXT_PUBLIC_WPP_API=http://72.61.56.235:3001/api");
}

async function safeFetch(url: string, options?: RequestInit) {
  if (!API) {
    throw new Error(
      "NEXT_PUBLIC_WPP_API não configurada. Adicione no .env ou na Vercel."
    );
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Erro HTTP ${res.status} ao acessar ${url} → ${text.substring(0, 300)}`
      );
    }
    return res.json();
  } catch (err: any) {
    console.error("Erro ao chamar o bot:", err.message);
    throw err;
  }
}

export async function startConnection(userId: string, slot: number) {
  return safeFetch(`${API}/start/${userId}/${slot}`, { method: "POST" });
}

export async function getQRCode(userId: string, slot: number) {
  return safeFetch(`${API}/qr/${userId}/${slot}`);
}

export async function getStatus(userId: string) {
  return safeFetch(`${API}/status/${userId}`);
}

export async function stopConnection(userId: string, slot: number) {
  return safeFetch(`${API}/stop/${userId}/${slot}`, { method: "POST" });
}
