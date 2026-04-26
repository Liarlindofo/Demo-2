export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { syncStackAuthUser } from '@/lib/stack-auth-sync'
import { UserAPIService } from '@/lib/user-api-service'

// GET /api/saipos/daily - Buscar relatório diário da Saipos via proxy
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const stackUser = await stackServerApp.getUser({ or: 'return-null' })
    if (!stackUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Sincronizar usuário
    try {
      await syncStackAuthUser({
        id: stackUser.id,
        primaryEmail: stackUser.primaryEmail,
        displayName: stackUser.displayName,
        profileImageUrl: stackUser.profileImageUrl,
        primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
      })
    } catch (syncError) {
      console.error('Erro ao sincronizar usuário:', syncError)
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const apiId = searchParams.get('apiId')
    const storeId = searchParams.get('storeId')

    if (!date) {
      return NextResponse.json(
        { error: 'date é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar API do usuário
    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail,
      displayName: stackUser.displayName,
      profileImageUrl: stackUser.profileImageUrl,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    })

    const apis = await UserAPIService.getUserAPIs(dbUser.id)
    const targetApi = apiId 
      ? apis.find(a => a.id === apiId && a.type === 'saipos' && a.status === 'connected')
      : apis.find(a => a.type === 'saipos' && a.status === 'connected')

    if (!targetApi || !targetApi.apiKey) {
      return NextResponse.json(
        { error: 'API Saipos não encontrada ou não conectada' },
        { status: 404 }
      )
    }

    // Fazer requisição para a API da Saipos pelo servidor (sem CORS)
    // Implementar paginação para buscar TODAS as vendas com tratamento de rate limiting
    const startDateTime = `${date}T00:00:00`
    const endDateTime = `${date}T23:59:59`
    const token = targetApi.apiKey.trim().replace(/^Bearer\s+/i, '')
    
    const allSales: unknown[] = []
    let offset = 0
    const limit = 200 // Aumentar limit para reduzir número de requisições
    let hasMoreData = true
    const delayBetweenRequests = 5000 // Delay de 5 segundos entre requisições para evitar rate limiting
    const maxRetries = 3
    
    // Função helper para fazer delay
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    // Função helper para fazer requisição com retry
    const fetchWithRetry = async (url: string, retries = maxRetries): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (attempt * 2000)
          console.warn(`⚠️ Rate limit (429) - tentativa ${attempt}/${retries}. Aguardando ${waitTime}ms...`)
          await sleep(waitTime)
          continue
        }

        return response
      }
      throw new Error(`Rate limit após ${retries} tentativas`)
    }
    
    console.log('🔄 Iniciando busca paginada de vendas para:', date)
    console.log(`⚠️ Usando limit=${limit}, delay=${delayBetweenRequests}ms entre requisições`)
    
    while (hasMoreData) {
      const storeIdQuery = storeId ? `&store_id=${encodeURIComponent(storeId)}` : ''
      const url = `https://data.saipos.io/v1/search_sales?p_date_column_filter=sale_date&p_filter_date_start=${encodeURIComponent(startDateTime)}&p_filter_date_end=${encodeURIComponent(endDateTime)}${storeIdQuery}&p_limit=${limit}&p_offset=${offset}`
      
      console.log(`📥 Buscando vendas: offset=${offset}, limit=${limit}`)
      
      let response: Response
      try {
        response = await fetchWithRetry(url)
      } catch (error) {
        console.error('Erro ao fazer requisição:', error)
        return NextResponse.json(
          { error: `Erro na API Saipos: Rate limit após múltiplas tentativas` },
          { status: 429 }
        )
      }

      if (!response.ok && response.status !== 429) {
        const errorText = await response.text().catch(() => 'Erro desconhecido')
        console.error('Erro na API Saipos:', response.status, errorText)
        return NextResponse.json(
          { error: `Erro na API Saipos: ${response.status} ${response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      
      // Verificar se retornou dados
      if (!data || (Array.isArray(data) && data.length === 0)) {
        hasMoreData = false
        break
      }
      
      // Adicionar dados ao array total
      if (Array.isArray(data)) {
        allSales.push(...data)
        console.log(`✅ Página carregada: ${data.length} vendas (total: ${allSales.length})`)
        
        // Se retornou menos que o limite, não há mais páginas
        if (data.length < limit) {
          hasMoreData = false
        } else {
          offset += limit
        }
        
        // Aguardar antes da próxima requisição para evitar rate limiting
        if (hasMoreData) {
          await sleep(delayBetweenRequests)
        }
      } else {
        // Se não é array, retornar como está (pode ser erro ou estrutura diferente)
        console.log('⚠️ Resposta não é array, retornando dados diretos')
        return NextResponse.json(data)
      }
    }
    
    console.log(`📊 Total de vendas carregadas: ${allSales.length}`)
    
    // Log detalhado do que foi retornado da API
    console.log('📡 Resposta da API Saipos (daily):', {
      status: 200,
      dataType: 'array',
      dataLength: allSales.length,
      firstItem: allSales.length > 0 ? allSales[0] : null,
      pages: Math.ceil(allSales.length / limit),
    })
    
    return NextResponse.json(allSales)
  } catch (error: unknown) {
    console.error('Erro ao buscar relatório diário:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

