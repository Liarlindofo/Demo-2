import type { StoreId } from './types';

export const STORES: Record<StoreId, string> = {
  ahu: 'AHU',
  pilarzinho: 'Pilarzinho',
  portao: 'Portão',
  uberaba: 'Uberaba',
};

export const STORE_COLORS: Record<StoreId, string> = {
  ahu: '#3b82f6',
  pilarzinho: '#8b5cf6',
  portao: '#f97316',
  uberaba: '#22c55e',
};

export const STORE_IDS: StoreId[] = ['ahu', 'pilarzinho', 'portao', 'uberaba'];

export const CMV_META = 33; // meta de CMV em %

export const CMV_THRESHOLDS = {
  otimo: 33,   // abaixo = ótimo
  atencao: 36, // entre 33-36% = atenção, acima de 36% = acima da meta
};

export const CMV_COLORS = {
  otimo: '#16a34a',   // verde
  atencao: '#ca8a04', // amarelo
  critico: '#dc2626', // vermelho
};

export const getCMVStatus = (cmv: number): 'otimo' | 'atencao' | 'critico' => {
  if (cmv < CMV_THRESHOLDS.otimo) return 'otimo';
  if (cmv < CMV_THRESHOLDS.atencao) return 'atencao';
  return 'critico';
};

export const getCMVColor = (cmv: number): string => {
  const status = getCMVStatus(cmv);
  return CMV_COLORS[status];
};

export const getStatusLabel = (status: 'otimo' | 'atencao' | 'critico'): string => {
  switch (status) {
    case 'otimo': return 'Ótimo';
    case 'atencao': return 'Atenção';
    case 'critico': return 'Acima da meta';
  }
};

export const getStorageKey = (storeId: StoreId): string => {
  return `calenzano_cmv_v2_${storeId}`;
};

// Mantido para compatibilidade com ComparisonTab
export const getBarColor = (status: string): string => {
  switch (status) {
    case 'otimo': return CMV_COLORS.otimo;
    case 'atencao': return CMV_COLORS.atencao;
    default: return CMV_COLORS.critico;
  }
};
