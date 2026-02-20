/**
 * Cliente para API Saipos seguindo a documentação oficial
 * https://data.saipos.io/v1/sales/sales
 */

const BASE_URL = 'https://data.saipos.io/v1';
const MAX_PERIOD_DAYS = 15; // Limite máximo de 15 dias por consulta
const RATE_LIMIT_DELAY = 432000; // 432 segundos = ~7 minutos em ms

interface SaiposRequestOptions {
  token: string;
  startDate: string; // ISO 8601: 2024-01-01T00:00:00
  endDate: string; // ISO 8601: 2024-01-15T23:59:59
  withDate?: 'created_at' | 'updated_at'; // Campo de data para filtrar
  dataColumnsFilter?: 'default' | 'all'; // Colunas de dados
  limit?: number; // Padrão: 100
  offset?: number; // Para paginação
  storeId?: string; // ID da loja (opcional)
}

interface SaiposResponse<T> {
  data: T[];
  success: boolean;
  error?: string;
}

/**
 * Valida se o período está dentro do limite de 15 dias
 */
export function validatePeriod(startDate: string, endDate: string): { valid: boolean; days: number; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos os dias
  
  if (diffDays > MAX_PERIOD_DAYS) {
    return {
      valid: false,
      days: diffDays,
      error: `Período excede o limite de ${MAX_PERIOD_DAYS} dias. Período solicitado: ${diffDays} dias. Divida em múltiplas requisições.`
    };
  }
  
  return { valid: true, days: diffDays };
}

/**
 * Divide um período maior em janelas de 15 dias
 */
export function splitPeriodIntoWindows(startDate: string, endDate: string): Array<{ start: string; end: string }> {
  const windows: Array<{ start: string; end: string }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentStart = new Date(start);
  
  while (currentStart <= end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + (MAX_PERIOD_DAYS - 1));
    
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }
    
    windows.push({
      start: currentStart.toISOString().split('T')[0] + 'T00:00:00',
      end: currentEnd.toISOString().split('T')[0] + 'T23:59:59'
    });
    
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  
  return windows;
}

/**
 * Faz requisição para a API Saipos com tratamento de rate limiting
 */
async function fetchWithRateLimit(
  url: string,
  token: string,
  attempt = 1
): Promise<Response> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  // Tratamento de rate limiting (HTTP 429)
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After')) || 0;
    const backoff = Math.max(retryAfter * 1000, RATE_LIMIT_DELAY);
    
    console.warn(`⚠️ Rate limit excedido. Aguardando ${backoff / 1000}s antes de tentar novamente...`);
    
    if (attempt <= 3) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRateLimit(url, token, attempt + 1);
    } else {
      throw new Error('Rate limit excedido após 3 tentativas. Aguarde alguns minutos.');
    }
  }

  return response;
}

/**
 * Busca vendas da API Saipos usando o endpoint correto
 */
export async function fetchSaiposSales(
  options: SaiposRequestOptions
): Promise<SaiposResponse<unknown>> {
  const {
    token,
    startDate,
    endDate,
    withDate = 'created_at',
    dataColumnsFilter = 'all',
    limit = 100,
    offset = 0,
    storeId
  } = options;

  // Validar período
  const validation = validatePeriod(startDate, endDate);
  if (!validation.valid) {
    return {
      data: [],
      success: false,
      error: validation.error
    };
  }

  // Construir URL com parâmetros corretos conforme documentação oficial
  // A documentação não menciona store_id como parâmetro de query
  // O token já está associado às lojas, então não precisamos filtrar por store_id
  const params = new URLSearchParams({
    'p_data_columns_filter': dataColumnsFilter,
    'p_filter_date_start': startDate,
    'p_filter_date_end': endDate,
    'with_date': withDate,
    'p_limit': String(limit),
    'p_offset': String(offset),
  });

  // Usar apenas o endpoint oficial da documentação
  const url = `${BASE_URL}/sales/sales?${params.toString()}`;
  console.log(`📡 Fazendo requisição para: ${url.replace(token, '***')}`);
  
  const response = await fetchWithRateLimit(url, token);

  try {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error('❌ Erro na API Saipos:', response.status, errorText);
      
      return {
        data: [],
        success: false,
        error: `Erro ${response.status}: ${errorText.substring(0, 200)}`
      };
    }

    const data = await response.json();
    
    // A API pode retornar array diretamente ou objeto com propriedade data
    const salesArray = Array.isArray(data)
      ? data
      : (data?.data && Array.isArray(data.data))
        ? data.data
        : [];

    return {
      data: salesArray,
      success: true
    };
  } catch (error) {
    console.error('❌ Erro ao buscar vendas:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Busca todas as vendas de um período (com paginação automática)
 */
export async function fetchAllSaiposSales(
  options: SaiposRequestOptions
): Promise<SaiposResponse<unknown>> {
  const allSales: unknown[] = [];
  let currentOffset = options.offset || 0;
  const limit = options.limit || 100;
  let hasMore = true;
  let totalRequests = 0;
  const maxRequests = 100; // Limite de segurança

  while (hasMore && totalRequests < maxRequests) {
    totalRequests++;
    
    const result = await fetchSaiposSales({
      ...options,
      offset: currentOffset,
      limit
    });

    if (!result.success) {
      return result;
    }

    if (result.data.length === 0) {
      hasMore = false;
      break;
    }

    allSales.push(...result.data);

    // Se retornou menos que o limite, não há mais páginas
    if (result.data.length < limit) {
      hasMore = false;
    } else {
      currentOffset += limit;
    }

    // Delay entre requisições para respeitar rate limiting
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  console.log(`📊 Total de vendas carregadas: ${allSales.length} (${totalRequests} requisições)`);

  return {
    data: allSales,
    success: true
  };
}

/**
 * Busca vendas de um período maior que 15 dias (divide automaticamente)
 */
export async function fetchSaiposSalesLargePeriod(
  options: SaiposRequestOptions
): Promise<SaiposResponse<unknown>> {
  const validation = validatePeriod(options.startDate, options.endDate);
  
  if (validation.valid) {
    // Período válido, buscar diretamente
    return fetchAllSaiposSales(options);
  }

  // Período maior que 15 dias, dividir em janelas
  console.log(`📅 Período de ${validation.days} dias detectado. Dividindo em janelas de ${MAX_PERIOD_DAYS} dias...`);
  
  const windows = splitPeriodIntoWindows(options.startDate, options.endDate);
  const allSales: unknown[] = [];

  for (let i = 0; i < windows.length; i++) {
    const window = windows[i];
    console.log(`📥 Buscando janela ${i + 1}/${windows.length}: ${window.start} até ${window.end}`);
    
    const result = await fetchAllSaiposSales({
      ...options,
      startDate: window.start,
      endDate: window.end,
      offset: 0 // Resetar offset para cada janela
    });

    if (!result.success) {
      return {
        data: allSales,
        success: false,
        error: `Erro na janela ${i + 1}: ${result.error}`
      };
    }

    allSales.push(...result.data);

    // Delay entre janelas para respeitar rate limiting
    if (i < windows.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return {
    data: allSales,
    success: true
  };
}
