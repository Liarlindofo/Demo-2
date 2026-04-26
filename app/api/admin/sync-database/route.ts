export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const runtime = 'nodejs';

/**
 * Endpoint para sincronizar o banco de dados com o schema do Prisma
 * USE COM CUIDADO: Este comando pode dropar dados existentes
 * 
 * Acesse: GET /api/admin/sync-database
 */
export async function GET(request: Request) {
  try {
    // Proteção básica: verificar se há uma secret na URL
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Não autorizado. Forneça ?secret=YOUR_ADMIN_SECRET' },
        { status: 401 }
      );
    }

    console.log('🔄 Iniciando sincronização do banco de dados...');

    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL não está configurada' },
        { status: 500 }
      );
    }

    // Executar prisma db push com --accept-data-loss
    console.log('📦 Executando: prisma db push --accept-data-loss');
    
    try {
      // Primeiro, fazer o push do schema
      const pushOutput = execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'pipe',
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      console.log('✅ Schema sincronizado!');
      console.log(pushOutput);

      // Depois, regenerar o Prisma Client
      console.log('📦 Regenerando Prisma Client...');
      try {
        const generateOutput = execSync('npx prisma generate', {
          stdio: 'pipe',
          encoding: 'utf-8',
          cwd: process.cwd(),
        });
        console.log('✅ Prisma Client regenerado!');
        console.log(generateOutput);

        return NextResponse.json({
          success: true,
          message: 'Banco de dados sincronizado e Prisma Client regenerado com sucesso',
          pushOutput: pushOutput,
          generateOutput: generateOutput,
        });
      } catch (generateError: any) {
        console.warn('⚠️ Erro ao regenerar Prisma Client (pode ser normal):', generateError);
        // Não falhar se o generate der erro, pois o push já foi feito
        return NextResponse.json({
          success: true,
          message: 'Banco de dados sincronizado com sucesso (mas Prisma Client pode precisar ser regenerado manualmente)',
          pushOutput: pushOutput,
          generateWarning: generateError.stdout || generateError.stderr || generateError.message,
        });
      }
    } catch (execError: any) {
      console.error('❌ Erro ao executar prisma db push:', execError);
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao sincronizar banco de dados',
        details: execError.stdout || execError.stderr || execError.message,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}

