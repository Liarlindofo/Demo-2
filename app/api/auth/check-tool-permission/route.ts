import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { checkToolPermission } from '@/lib/auth/toolPermissions';
import { SystemTool } from '@/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolParam = searchParams.get('tool');

    if (!toolParam) {
      return NextResponse.json(
        { error: 'Ferramenta não especificada', hasPermission: false },
        { status: 400 }
      );
    }

    // Validar se a ferramenta existe
    if (!Object.values(SystemTool).includes(toolParam as SystemTool)) {
      return NextResponse.json(
        { error: 'Ferramenta inválida', hasPermission: false },
        { status: 400 }
      );
    }

    // Obter usuário do Stack Auth
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json(
        { error: 'Não autenticado', hasPermission: false },
        { status: 401 }
      );
    }

    // Verificar permissão
    const hasPermission = await checkToolPermission(
      stackUser.id,
      toolParam as SystemTool
    );

    return NextResponse.json({ hasPermission });
  } catch (error: any) {
    console.error('Erro ao verificar permissão de ferramenta:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar permissão', hasPermission: false },
      { status: 500 }
    );
  }
}
