const API = process.env.NEXT_PUBLIC_WPP_API || process.env.NEXT_PUBLIC_BACKEND_URL || "https://platefull.com.br";

export async function startConnection(userId: string, slot: number) {
  if (!API) {
    throw new Error("API URL não configurada. Configure NEXT_PUBLIC_WPP_API ou NEXT_PUBLIC_BACKEND_URL");
  }
  return fetch(`${API}/start/${userId}/${slot}`, {
    method: "POST"
  }).then(r => r.json());
}

export async function getQRCode(userId: string, slot: number) {
  if (!API) {
    throw new Error("API URL não configurada. Configure NEXT_PUBLIC_WPP_API ou NEXT_PUBLIC_BACKEND_URL");
  }
  return fetch(`${API}/qr/${userId}/${slot}`).then(r => r.json());
}

export async function getStatus(userId: string) {
  if (!API) {
    throw new Error("API URL não configurada. Configure NEXT_PUBLIC_WPP_API ou NEXT_PUBLIC_BACKEND_URL");
  }
  return fetch(`${API}/status/${userId}`).then(r => r.json());
}
