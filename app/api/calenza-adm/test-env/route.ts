export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const jwtSecret = process.env.ADMIN_JWT_SECRET;
    
    return NextResponse.json({
      hasJwtSecret: !!jwtSecret,
      jwtSecretLength: jwtSecret?.length || 0,
      jwtSecretPreview: jwtSecret ? jwtSecret.substring(0, 10) + '...' : 'NÃO CONFIGURADO',
      isValid: jwtSecret && jwtSecret.length >= 32,
      allEnvVars: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado',
        ADMIN_JWT_SECRET: jwtSecret ? 'Configurado' : 'NÃO CONFIGURADO',
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Erro ao verificar variáveis',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}
