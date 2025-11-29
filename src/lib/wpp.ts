const API = process.env.NEXT_PUBLIC_WPP_API;

export async function startConnection(userId: string, slot: number) {
  return fetch(`${API}/start/${userId}/${slot}`, {
    method: "POST"
  }).then(r => r.json());
}

export async function getQRCode(userId: string, slot: number) {
  return fetch(`${API}/qr/${userId}/${slot}`).then(r => r.json());
}

export async function getStatus(userId: string) {
  return fetch(`${API}/status/${userId}`).then(r => r.json());
}
