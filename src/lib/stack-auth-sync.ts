import { db as prisma, ensureConnection } from '@/lib/db';

export interface StackAuthUser {
  id: string;
  primaryEmail?: string | null;
  displayName?: string | null;
  profileImageUrl?: string | null;
  primaryEmailVerified?: Date | null; // Transformado de boolean para Date quando necessário
}

/**
 * Sincroniza usuário do Stack Auth com o banco de dados local
 * Cria o usuário se não existir, atualiza se já existir
 */
export async function syncStackAuthUser(stackUser: StackAuthUser) {
  try {
    console.log('🔄 Sincronizando usuário Stack Auth:', { 
      id: stackUser.id, 
      email: stackUser.primaryEmail 
    });

    if (!stackUser.primaryEmail) {
      throw new Error('Email do usuário não está disponível');
    }

    // Verificar se o StackUser já existe
    console.log('📊 Buscando StackUser no banco...');
    
    // Garantir que a conexão está ativa
    await ensureConnection();
    
    let dbStackUser = await prisma.stackUser.findUnique({
      where: { id: stackUser.id },
      include: { user: true }
    }).catch((error) => {
      console.error('❌ Erro ao buscar StackUser:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Detectar erros específicos
      if (errorMsg.includes('closed the connection') || errorMsg.includes('connection closed')) {
        throw new Error(`Erro ao acessar banco de dados: Conexão foi fechada. Possível causa: tabelas não criadas ou conexão perdida. Execute: GET /api/admin/sync-database?secret=YOUR_ADMIN_SECRET`);
      }
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
        throw new Error(`Erro ao acessar banco de dados: Tabelas não foram criadas. Execute: GET /api/admin/sync-database?secret=YOUR_ADMIN_SECRET`);
      }
      
      throw new Error(`Erro ao acessar banco de dados: ${errorMsg}. Possível causa: tabelas não criadas. Execute: GET /api/admin/sync-database?secret=YOUR_ADMIN_SECRET`);
    });

    // Se não existe, criar novo
    if (!dbStackUser) {
      console.log('➕ Criando novo StackUser...');
      dbStackUser = await prisma.stackUser.create({
        data: {
          id: stackUser.id,
          primaryEmail: stackUser.primaryEmail,
          displayName: stackUser.displayName || '',
          profileImageUrl: stackUser.profileImageUrl,
          primaryEmailVerified: stackUser.primaryEmailVerified,
          lastActiveAt: new Date(),
        },
        include: { user: true },
      }).catch((error) => {
        console.error('❌ Erro ao criar StackUser:', error);
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      });
      console.log('✅ StackUser criado:', dbStackUser.id);
    } else {
      console.log('✅ StackUser encontrado:', dbStackUser.id);
      // Atualizar dados do StackUser
      dbStackUser = await prisma.stackUser.update({
        where: { id: stackUser.id },
        data: {
          primaryEmail: stackUser.primaryEmail,
          displayName: stackUser.displayName || dbStackUser.displayName,
          profileImageUrl: stackUser.profileImageUrl || dbStackUser.profileImageUrl,
          primaryEmailVerified: stackUser.primaryEmailVerified || dbStackUser.primaryEmailVerified,
          lastActiveAt: new Date(),
        },
        include: { user: true }
      });
    }

    // Se o StackUser já tem um User associado, retornar
    if (dbStackUser.user) {
      return dbStackUser.user;
    }

    // Buscar se já existe um User com esse email
    const existingUser = await prisma.user.findUnique({
      where: { email: stackUser.primaryEmail }
    });

    if (existingUser) {
      // Associar StackUser existente ao User existente
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          stackUserId: dbStackUser.id,
          fullName: stackUser.displayName || existingUser.fullName,
        }
      });

      await prisma.stackUser.update({
        where: { id: dbStackUser.id },
        data: { userId: existingUser.id }
      });

      return existingUser;
    }

    // Criar novo User baseado nos dados do Stack Auth
    const newUser = await prisma.user.create({
      data: {
        email: stackUser.primaryEmail,
        username: generateUsernameFromEmail(stackUser.primaryEmail),
        fullName: stackUser.displayName || '',
        password: null, // Sem senha, usa Stack Auth
        isAdmin: false,
        stackUserId: dbStackUser.id,
      }
    });

    // Atualizar StackUser com referência ao User
    await prisma.stackUser.update({
      where: { id: dbStackUser.id },
      data: { userId: newUser.id }
    });

    return newUser;
  } catch (error) {
    console.error('Erro ao sincronizar usuário do Stack Auth:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Re-throw se já for um erro tratado
    if (errorMessage.includes('Erro ao acessar banco de dados') || errorMessage.includes('Erro ao conectar ao banco')) {
      throw error;
    }
    
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
      throw new Error('Variável de ambiente DATABASE_URL não configurada. Configure-a nas variáveis de ambiente da Vercel.');
    }
    if (errorMessage.includes('does not exist') || (errorMessage.includes('relation') && errorMessage.includes('does not exist'))) {
      throw new Error('Tabelas do banco de dados não foram criadas. Execute: GET /api/admin/sync-database?secret=YOUR_ADMIN_SECRET');
    }
    if (errorMessage.includes('closed the connection') || errorMessage.includes('connection closed')) {
      throw new Error('Conexão com o banco de dados foi fechada. Possível causa: tabelas não criadas ou conexão perdida. Execute: GET /api/admin/sync-database?secret=YOUR_ADMIN_SECRET');
    }
    
    throw error;
  }
}

/**
 * Gera um username único a partir do email
 */
function generateUsernameFromEmail(email: string): string {
  const baseUsername = email.split('@')[0].toLowerCase();
  const timestamp = Date.now().toString(36);
  return `${baseUsername}_${timestamp}`;
}

/**
 * Busca usuário por stackUserId
 */
export async function getUserByStackId(stackUserId: string) {
  try {
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: stackUserId },
      include: { user: true }
    });

    return stackUser?.user || null;
  } catch (error) {
    console.error('Erro ao buscar usuário por Stack ID:', error);
    return null;
  }
}

