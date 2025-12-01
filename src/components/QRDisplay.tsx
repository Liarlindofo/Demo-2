"use client";

import { useEffect, useState } from "react";
import { getQRCode } from "@/lib/wpp";

export function QRDisplay({ userId, slot }) {
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !slot) {
      setError("userId e slot são obrigatórios");
      setLoading(false);
      return;
    }

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    async function loadQR() {
      try {
        const res = await getQRCode(userId, slot);
        
        if (!isMounted) return;

        if (res.success) {
          if (res.qrCode) {
            setQr(res.qrCode);
            setError(null);
            setLoading(false);
            retryCount = 0; // Reset contador em caso de sucesso
          } else {
            // QR ainda não está disponível, continua tentando
            if (retryCount < MAX_RETRIES) {
              retryCount++;
            } else {
              setError("QR Code ainda não está disponível. Aguarde alguns segundos.");
              setLoading(false);
            }
          }
        } else {
          setError(res.message || "Erro ao buscar QR Code");
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        
        console.error("Erro ao carregar QR Code:", err);
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
          setError(err.message || "Erro ao conectar com o servidor. Verifique sua conexão.");
          setLoading(false);
          // Para o intervalo após muitas tentativas
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      }
    }

    // Primeira tentativa imediata
    loadQR();

    // Configurar intervalo apenas se ainda não tiver QR e não tiver erro
    if (!qr && !error) {
      intervalId = setInterval(() => {
        if (!error && retryCount < MAX_RETRIES) {
          loadQR();
        }
      }, 5000); // Aumentado para 5s para não sobrecarregar
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userId, slot]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (loading && !qr) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p className="text-sm text-gray-400">Gerando QR Code...</p>
      </div>
    );
  }

  if (!qr) {
    return <p className="text-sm text-gray-400">Aguardando QR Code...</p>;
  }

  return (
    <img
      src={qr}
      alt="QR Code"
      className="w-64 h-64 rounded-lg border border-white shadow-lg"
    />
  );
}
