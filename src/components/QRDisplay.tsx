"use client";

import { useEffect, useState } from "react";
import { getQRCode } from "@/lib/wpp";

export function QRDisplay({ userId, slot }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    async function loadQR() {
      const res = await getQRCode(userId, slot);
      if (res.success) {
        setQr(res.qrCode);
      }
    }

    loadQR();

    const interval = setInterval(loadQR, 2500);
    return () => clearInterval(interval);
  }, [userId, slot]);

  if (!qr) return <p>Gerando QR Code...</p>;

  return (
    <img
      src={qr}
      alt="QR Code"
      className="w-64 h-64 rounded-lg border border-white shadow-lg"
    />
  );
}
