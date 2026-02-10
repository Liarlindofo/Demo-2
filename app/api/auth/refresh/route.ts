import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';

export async function POST(request: NextRequest) {
  try {
    // Verificar se usuário está autenticado
    const user = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Stack Auth automaticamente renova o token quando você chama getUser()
    // O cookie é atualizado automaticamente
    
    return NextResponse.json({
      success: true,
      message: 'Token renovado',
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return NextResponse.json(
      { error: 'Erro ao renovar token' },
      { status: 500 }
    );
  }
}
