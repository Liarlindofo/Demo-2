'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Loja {
  id: string;
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  ativo: boolean;
}

interface LojaContextType {
  lojas: Loja[];
  lojaSelecionada: Loja | null;
  setLojaSelecionada: (loja: Loja | null) => void;
  loading: boolean;
  refetch: () => void;
}

const LojaContext = createContext<LojaContextType>({
  lojas: [],
  lojaSelecionada: null,
  setLojaSelecionada: () => {},
  loading: true,
  refetch: () => {},
});

export function LojaProvider({ children }: { children: ReactNode }) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaSelecionada, setLojaSelecionadaState] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLojas = async () => {
    try {
      const res = await fetch('/api/rh/lojas');
      if (res.ok) {
        const data: Loja[] = await res.json();
        setLojas(data);
      }
    } catch (err) {
      console.error('[LojaContext] Falha ao carregar lojas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLojas();
  }, []);

  const setLojaSelecionada = (loja: Loja | null) => {
    setLojaSelecionadaState(loja);
  };

  return (
    <LojaContext.Provider value={{ lojas, lojaSelecionada, setLojaSelecionada, loading, refetch: fetchLojas }}>
      {children}
    </LojaContext.Provider>
  );
}

export function useLoja() {
  const ctx = useContext(LojaContext);
  if (!ctx) throw new Error('useLoja deve ser usado dentro de LojaProvider');
  return ctx;
}
