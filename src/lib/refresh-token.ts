'use client';

/**
 * 🔄 Refresh Token Automático
 * 
 * Renova o token do usuário automaticamente antes de expirar
 */

let refreshInterval: NodeJS.Timeout | null = null;

export function startTokenRefresh(refreshMinutes: number = 60) {
  // Limpar intervalo anterior se existir
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Configurar novo intervalo
  refreshInterval = setInterval(async () => {
    try {
      console.log('🔄 Renovando token do Stack Auth...');
      
      // Fazer uma requisição simples para renovar o token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Importante: incluir cookies
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token renovado com sucesso!', data.timestamp);
      } else {
        console.warn('⚠️ Falha ao renovar token:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
    }
  }, refreshMinutes * 60 * 1000); // Converter minutos para ms

  console.log(`🔄 Token refresh configurado: a cada ${refreshMinutes} minutos`);
}

export function stopTokenRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('⏹️ Token refresh parado');
  }
}
