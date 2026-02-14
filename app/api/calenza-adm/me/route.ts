import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Erro ao verificar sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar sessão', details: error?.message },
      { status: 500 }
    );
  }
}
