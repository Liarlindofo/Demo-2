/**
 * Gera uma nova API key de serviço e salva o hash SHA-256 no banco.
 *
 * Uso:
 *   npx tsx scripts/create-service-api-key.ts --email user@email.com --nome "n8n - VPS produção"
 *   npx tsx scripts/create-service-api-key.ts --userId clxxx... --nome "n8n - VPS produção"
 *
 * A key em texto puro é exibida UMA ÚNICA VEZ — guarde-a imediatamente.
 */

import { randomBytes, createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return {
    email: get('--email'),
    userId: get('--userId'),
    nome: get('--nome') ?? 'Serviço externo',
  };
}

async function main() {
  const { email, userId: rawUserId, nome } = parseArgs();

  if (!email && !rawUserId) {
    console.error('Erro: forneça --email ou --userId.\n');
    console.error('Exemplos:');
    console.error('  npx tsx scripts/create-service-api-key.ts --email admin@exemplo.com --nome "n8n VPS"');
    console.error('  npx tsx scripts/create-service-api-key.ts --userId clxxx... --nome "n8n VPS"');
    process.exit(1);
  }

  // Resolver userId
  let userId: string;
  if (rawUserId) {
    const user = await prisma.user.findUnique({ where: { id: rawUserId }, select: { id: true, email: true } });
    if (!user) { console.error(`Usuário com id "${rawUserId}" não encontrado.`); process.exit(1); }
    userId = user.id;
    console.log(`Usuário encontrado: ${user.email ?? user.id}`);
  } else {
    const user = await prisma.user.findUnique({ where: { email: email! }, select: { id: true, email: true } });
    if (!user) { console.error(`Usuário com email "${email}" não encontrado.`); process.exit(1); }
    userId = user.id;
    console.log(`Usuário encontrado: ${user.email}`);
  }

  // Gerar key aleatória (256 bits)
  const rawKey = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  // Salvar no banco
  const record = await prisma.serviceApiKey.create({
    data: { key: keyHash, nome, userId },
    select: { id: true, nome: true, createdAt: true },
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅  API key criada com sucesso!');
  console.log('='.repeat(60));
  console.log(`ID    : ${record.id}`);
  console.log(`Nome  : ${record.nome}`);
  console.log(`Criada: ${record.createdAt.toLocaleString('pt-BR')}`);
  console.log('');
  console.log('🔑  Sua API key (copie AGORA — não será exibida novamente):');
  console.log('');
  console.log(`    ${rawKey}`);
  console.log('');
  console.log('Use o header:  x-api-key: ' + rawKey);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
