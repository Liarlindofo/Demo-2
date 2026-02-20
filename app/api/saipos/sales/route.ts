import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { syncStackAuthUser } from '@/lib/stack-auth-sync'
import { UserAPIService } from '@/lib/user-api-service'
import { fetchSaiposSalesLargePeriod } from '@/lib/saipos-api-client'

// GET /api/saipos/sales - Buscar dados de vendas da Saipos via proxy
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const apiId = searchParams.get('apiId')
    const storeId = searchParams.get('storeId')
    const withDate = (searchParams.get('with_date') as 'created_at' | 'updated_at') || 'created_at'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate e endDate são obrigatórios' },
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

    // Preparar datas no formato ISO 8601
    const startDateTime = `${startDate}T00:00:00`
    const endDateTime = `${endDate}T23:59:59`
    const token = targetApi.apiKey.trim().replace(/^Bearer\s+/i, '')
    
    console.log('🔄 Buscando vendas da Saipos:', { startDate, endDate, storeId, withDate })
    
    // Usar o novo cliente da API que respeita limites e trata rate limiting
    const result = await fetchSaiposSalesLargePeriod({
      token,
      startDate: startDateTime,
      endDate: endDateTime,
      withDate,
      dataColumnsFilter: 'all',
      limit: 100,
      offset: 0,
      storeId: storeId || undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao buscar vendas' },
        { status: 500 }
      )
    }
    
    console.log(`📊 Total de vendas carregadas: ${result.data.length}`)
    
    return NextResponse.json(result.data)
  } catch (error: unknown) {
    console.error('Erro ao buscar dados de vendas:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

