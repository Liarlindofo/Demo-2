export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { UserAPIService } from '@/lib/user-api-service'
import { stackServerApp } from '@/stack'
import { syncStackAuthUser } from '@/lib/stack-auth-sync'

// POST /api/user-apis/test - Testar conexão da API
export async function POST(request: NextRequest) {
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
      console.error('Erro ao sincronizar usuário no teste:', syncError)
      // Continuar mesmo se a sincronização falhar
    }

    const { searchParams } = new URL(request.url)
    const apiId = searchParams.get('id')

    if (!apiId) {
      return NextResponse.json(
        { error: 'ID da API é obrigatório' },
        { status: 400 }
      )
    }

    const api = await UserAPIService.testAndUpdateAPI(apiId)
    
    // Se a API foi conectada com sucesso e é Saipos, fazer carregamento inicial de 15 dias
    if (api.status === 'connected' && api.type === 'saipos') {
      // Verificar se já existem dados no cache para esta loja
      const { db } = await import('@/lib/db')
      const storeId = api.storeId
      
      // Verificar se já existem dados para esta API (últimos 15 dias)
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const fifteenDaysAgo = new Date(today);
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);
      fifteenDaysAgo.setHours(0, 0, 0, 0);
      
      const existingData = await db.salesDaily.findFirst({
        where: { 
          apiId: api.id, 
          storeId,
          date: {
            gte: fifteenDaysAgo,
            lte: today,
          }
        },
      })
      
      // Se não houver dados recentes, fazer carregamento inicial em background (não bloquear resposta)
      if (!existingData) {
        console.log(`🔄 Iniciando carregamento inicial de 15 dias para ${storeId}...`)
        
        // Determinar URL base baseado no ambiente
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://platefull.com.br";
        
        // Fazer em background sem bloquear a resposta
        fetch(`${baseUrl}/api/saipos/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiId: api.id,
            days: 15, // Sincronizar últimos 15 dias
          }),
        }).catch(err => {
          console.error('Erro ao iniciar carregamento inicial:', err)
          // Não propagar erro - é em background
        })
      }
    }
    
    return NextResponse.json({ api })
  } catch (error: unknown) {
    console.error('Erro ao testar API:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    
    // Log mais detalhado para debug
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    
    // Se for erro de token inválido, retornar 401
    const status = message.includes('Token inválido') || message.includes('401') || message.includes('403') ? 401 : 500
    
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

