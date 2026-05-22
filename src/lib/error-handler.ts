// Sistema global de captura e tratamento de erros

export interface ErrorInfo {
  message: string;
  details?: string;
  stack?: string;
  url?: string;
  status?: number;
  timestamp: string;
  type: 'api' | 'javascript' | 'promise' | 'react';
}

type ErrorHandler = (error: ErrorInfo) => void;

let globalErrorHandler: ErrorHandler | null = null;

export function setGlobalErrorHandler(handler: ErrorHandler) {
  globalErrorHandler = handler;
}

export function handleError(error: ErrorInfo) {
  console.error('🚨 Erro capturado:', error);
  
  if (globalErrorHandler) {
    globalErrorHandler(error);
  }
}

// URLs ou prefixos de API que já tratam seus próprios erros — não exibir popup global
const SILENT_URL_PATTERNS = [
  /\/api\/rh\//,
  /\/api\/checklist\//,
  /\/api\/cmv\//,
  /\/api\/food\//,
  /\/_next\//,
  /\/api\/auth\//,
  /stackframe/,
  /stack-auth/,
];

// Status HTTP que não devem exibir popup (tratados pelas próprias páginas)
const SILENT_STATUS_CODES = [401, 404];

function shouldSilenceFetchError(url: string, status?: number): boolean {
  if (status && SILENT_STATUS_CODES.includes(status)) return true;
  return SILENT_URL_PATTERNS.some((p) => p.test(url));
}

function extractUrl(args: Parameters<typeof fetch>): string {
  const firstArg = args[0];
  if (typeof firstArg === 'string') return firstArg;
  if (firstArg instanceof URL) return firstArg.toString();
  if (firstArg instanceof Request) return firstArg.url;
  return '';
}

// Interceptar erros de API (fetch)
export function interceptFetchErrors() {
  // Evitar dupla interceptação
  if ((window.fetch as { __intercepted?: boolean }).__intercepted) return;

  const originalFetch = window.fetch;

  const wrappedFetch = async (...args: Parameters<typeof fetch>) => {
    const url = extractUrl(args);

    try {
      const response = await originalFetch(...args);

      // Só exibe popup para respostas de erro em rotas não silenciosas
      if (!response.ok && !shouldSilenceFetchError(url, response.status)) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        let errorDetails = '';

        try {
          const errorData = await response.clone().json().catch(() => null);
          if (errorData?.error) errorMessage = errorData.error;
          if (errorData?.message) errorDetails = errorData.message;
        } catch {
          // Ignorar erro ao parsear JSON
        }

        handleError({
          message: errorMessage,
          details: errorDetails || `Erro HTTP ${response.status}`,
          url,
          status: response.status,
          timestamp: new Date().toISOString(),
          type: 'api',
        });
      }

      return response;
    } catch (error) {
      // Apenas exibe popup para erros de rede em rotas não silenciosas
      if (!shouldSilenceFetchError(url)) {
        handleError({
          message: error instanceof Error ? error.message : 'Erro desconhecido na requisição',
          details: error instanceof Error ? error.stack : String(error),
          url,
          timestamp: new Date().toISOString(),
          type: 'api',
        });
      }

      throw error;
    }
  };

  (wrappedFetch as { __intercepted?: boolean }).__intercepted = true;
  window.fetch = wrappedFetch;
}

// Padrões de erros internos do React/Next.js que não devem exibir popup
const INTERNAL_ERROR_PATTERNS = [
  /Minified React error/i,
  /hydrat/i,
  /react\.dev\/errors/i,
  /nextjs\.org\/docs\/messages/i,
  /Cannot update a component/i,
  /ResizeObserver loop/i,
];

function isInternalError(message: string): boolean {
  return INTERNAL_ERROR_PATTERNS.some((p) => p.test(message));
}

// Interceptar erros JavaScript globais
export function interceptGlobalErrors() {
  // Erros não tratados
  window.addEventListener('error', (event) => {
    const message = event.message || 'Erro JavaScript não tratado';
    if (isInternalError(message)) return; // ignorar erros internos do React/Next.js

    handleError({
      message,
      details: `Arquivo: ${event.filename} (linha ${event.lineno}:${event.colno})`,
      stack: event.error?.stack,
      url: event.filename,
      timestamp: new Date().toISOString(),
      type: 'javascript',
    });
  });

  // Promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const message = error?.message || 'Promise rejeitada não tratada';
    if (isInternalError(message)) return;

    handleError({
      message,
      details: error?.stack || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      type: 'promise',
    });
  });
}

// Inicializar interceptadores
export function initializeErrorHandling() {
  if (typeof window !== 'undefined') {
    interceptFetchErrors();
    interceptGlobalErrors();
  }
}

