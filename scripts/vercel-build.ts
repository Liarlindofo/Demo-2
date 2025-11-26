#!/usr/bin/env tsx
/**
 * Script de build para Vercel
 * Executa prisma generate, db push (se DATABASE_URL estiver configurado) e build
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

function runCommand(command: string, description: string) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} concluído!`);
  } catch (error) {
    console.error(`❌ Erro ao executar: ${description}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando build para Vercel...\n');

  // 1. Gerar Prisma Client
  runCommand('npm run db:generate', 'Gerando Prisma Client');

  // 2. Para build do Vercel, NÃO fazemos db:push pois pode dropar dados
  // O Prisma Client já foi gerado acima, que é tudo que precisamos para o build
  console.log('\n✅ Prisma Client gerado. Pulando db:push (banco já deve estar configurado).');
  console.log('💡 Se as tabelas não existirem, execute manualmente: npm run db:push:force');

  // 3. Build do Next.js
  runCommand('npm run build', 'Fazendo build do Next.js');

  console.log('\n✅ Build concluído com sucesso!');
}

main().catch((error) => {
  console.error('\n❌ Erro fatal no build:', error);
  process.exit(1);
});

