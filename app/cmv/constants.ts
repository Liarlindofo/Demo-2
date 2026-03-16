import type { StoreId } from './types';

export const STORES: Record<StoreId, string> = {
  ahu: 'AHU',
  pilarzinho: 'Pilarzinho',
  portao: 'Portão',
  uberaba: 'Uberaba',
};

export const STORE_COLORS: Record<StoreId, string> = {
  ahu: '#3b82f6', // azul
  pilarzinho: '#8b5cf6', // roxo
  portao: '#f97316', // laranja
  uberaba: '#22c55e', // verde
};

export const STORE_IDS: StoreId[] = ['ahu', 'pilarzinho', 'portao', 'uberaba'];

export const CMV_THRESHOLDS = {
  otimo: 35,
  critico: 37,
};

export const CMV_COLORS = {
  otimo: '#16a34a', // verde
  atencao: '#ca8a04', // amarelo
  critico: '#dc2626', // vermelho
};

export const getCMVStatus = (cmv: number): 'otimo' | 'atencao' | 'critico' => {
  if (cmv < CMV_THRESHOLDS.otimo) return 'otimo';
  if (cmv < CMV_THRESHOLDS.critico) return 'atencao';
  return 'critico';
};

export const getCMVColor = (cmv: number): string => {
  const status = getCMVStatus(cmv);
  return CMV_COLORS[status];
};

export const getStatusLabel = (status: 'otimo' | 'atencao' | 'critico'): string => {
  switch (status) {
    case 'otimo':
      return 'Ótimo';
    case 'atencao':
      return 'Atenção';
    case 'critico':
      return 'Crítico';
  }
};

export const getStorageKey = (storeId: StoreId, type: 'state' | 'chat'): string => {
  return `calenzano_cmv_${type}_${storeId}`;
};

export const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 
  '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';

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export const OPENROUTER_MODEL = 'google/gemini-2.5-pro';
