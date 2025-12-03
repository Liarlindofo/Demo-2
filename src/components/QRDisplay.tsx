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
    const MAX_RETRIES = 60; // até ~2 minutos (com verificação a cada 2s)

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
            // Não incrementa retryCount aqui, pois é normal não ter QR ainda
            if (retryCount >= MAX_RETRIES * 2) {
              // Só mostra erro após muitas tentativas (dobro do normal)
              setError("QR Code ainda não está disponível. O servidor pode estar processando a conexão.");
              setLoading(false);
            }
          }
        } else {
          // Se a resposta diz que não tem QR ainda, continua tentando
          if (res.message?.includes('não disponível') || res.message?.includes('não está disponível')) {
            retryCount++;
            if (retryCount < MAX_RETRIES * 2) {
              return; // Continua tentando
            }
          }
          setError(res.message || "Erro ao buscar QR Code");
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        
        console.error("Erro ao carregar QR Code:", err);
        retryCount++;
        
        // Só mostra erro após muitas tentativas
        if (retryCount >= MAX_RETRIES * 2) {
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

    // Configurar intervalo para buscar QR Code
    // Verifica a cada 2 segundos até encontrar o QR Code
    intervalId = setInterval(() => {
      if (!qr && retryCount < MAX_RETRIES * 2) {
        loadQR();
      } else if (qr) {
        // Se já tem QR, para o intervalo
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }, 2000); // Verifica a cada 2 segundos

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
