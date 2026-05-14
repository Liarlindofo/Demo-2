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

const LOJA_STORAGE_KEY = 'plateful_rh_loja_selecionada';

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

        // Restaurar seleção do localStorage
        const saved = localStorage.getItem(LOJA_STORAGE_KEY);
        if (saved) {
          const savedLoja = data.find(l => l.id === saved);
          if (savedLoja) setLojaSelecionadaState(savedLoja);
        }
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
    if (loja) {
      localStorage.setItem(LOJA_STORAGE_KEY, loja.id);
    } else {
      localStorage.removeItem(LOJA_STORAGE_KEY);
    }
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
