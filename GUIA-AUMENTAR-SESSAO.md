# 🔐 Guia Completo: Aumentar Tempo de Sessão

## 🎯 Objetivo

Manter usuário logado por **6 horas** (ou mais) no checklist.

---

## 📋 PARTE 1: Configurar Refresh Token (Stack Auth)

### Passo 1: Adicionar Variáveis de Ambiente

Adicione no seu arquivo **`.env.local`** (na raiz do projeto):

```bash
# ===================================
# STACK AUTH - CONFIGURAÇÕES
# ===================================

# Suas variáveis existentes
NEXT_PUBLIC_STACK_PROJECT_ID=seu-project-id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=sua-key
STACK_SECRET_SERVER_KEY=sua-secret

# 🆕 NOVAS VARIÁVEIS - Tempo de Sessão
STACK_SESSION_DURATION=21600          # 6 horas em segundos
STACK_REFRESH_TOKEN_DURATION=2592000  # 30 dias em segundos
STACK_ACCESS_TOKEN_DURATION=21600     # 6 horas em segundos
```

**Conversão de Tempo:**
```
1 hora  = 3600 segundos
6 horas = 21600 segundos
12 horas = 43200 segundos
24 horas = 86400 segundos
7 dias = 604800 segundos
30 dias = 2592000 segundos
```

---

### Passo 2: Atualizar src/stack.ts

Modifique o arquivo **`src/stack.ts`**:

```typescript
import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  urls: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard',
    afterSignOut: '/',
    handler: '/handler',
  },
  // 🆕 CONFIGURAÇÕES DE SESSÃO
  cookieOptions: {
    // Duração do cookie (6 horas)
    maxAge: parseInt(process.env.STACK_SESSION_DURATION || '21600'),
    secure: process.env.NODE_ENV === 'production', // HTTPS em produção
    sameSite: 'lax',
    httpOnly: true, // Segurança: não acessível via JavaScript
  },
});
```

**⚠️ Nota:** Se o Stack Auth não suportar `cookieOptions` diretamente, ele pode estar usando configurações do Next.js. Nesse caso, vá para a Parte 2.

---

## 📋 PARTE 2: Implementar Refresh Automático de Token

### Passo 1: Criar Middleware de Refresh

Crie o arquivo **`src/lib/refresh-token.ts`**:

```typescript
'use client';

/**
 * 🔄 Refresh Token Automático
 * 
 * Renova o token do usuário automaticamente antes de expirar
 */

let refreshInterval: NodeJS.Timeout | null = null;

export function startTokenRefresh(refreshMinutes: number = 60) {
  // Limpar intervalo anterior se existir
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Configurar novo intervalo
  refreshInterval = setInterval(async () => {
    try {
      console.log('🔄 Renovando token do Stack Auth...');
      
      // Fazer uma requisição simples para renovar o token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Importante: incluir cookies
      });

      if (response.ok) {
        console.log('✅ Token renovado com sucesso!');
      } else {
        console.warn('⚠️ Falha ao renovar token:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
    }
  }, refreshMinutes * 60 * 1000); // Converter minutos para ms

  console.log(`🔄 Token refresh configurado: a cada ${refreshMinutes} minutos`);
}

export function stopTokenRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('⏹️ Token refresh parado');
  }
}
```

---

### Passo 2: Criar API Route para Refresh

Crie o arquivo **`app/api/auth/refresh/route.ts`**:

```typescript
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
```

---

### Passo 3: Usar no Layout ou Página do Checklist

Adicione no **`app/checklist/layout.tsx`** (ou diretamente na página):

```typescript
'use client';

import { useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { startTokenRefresh, stopTokenRefresh } from '@/lib/refresh-token';

export default function ChecklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser({ or: 'return-null' });

  useEffect(() => {
    if (user) {
      // 🔄 Iniciar refresh automático a cada 60 minutos
      startTokenRefresh(60);

      // Limpar ao desmontar
      return () => {
        stopTokenRefresh();
      };
    }
  }, [user]);

  return <>{children}</>;
}
```

**Ou adicionar direto na página de nova avaliação:**

```typescript
// No app/checklist/nova-avaliacao/page.tsx

import { startTokenRefresh, stopTokenRefresh } from '@/lib/refresh-token';

// Dentro do componente, adicionar:
useEffect(() => {
  if (user) {
    // Iniciar refresh a cada 60 minutos
    startTokenRefresh(60);

    return () => {
      stopTokenRefresh();
    };
  }
}, [user]);
```

---

## 📋 PARTE 3: Variável JWT Customizada (Backup/Alternativa)

Se o Stack Auth não fornecer controle suficiente, você pode criar um **sistema JWT próprio** como camada adicional.

### Passo 1: Adicionar Variáveis JWT no .env

```bash
# ===================================
# JWT CUSTOMIZADO (Backup)
# ===================================

JWT_SECRET=sua-chave-secreta-muito-forte-aqui-min-32-chars
JWT_EXPIRATION=21600  # 6 horas em segundos
JWT_REFRESH_EXPIRATION=2592000  # 30 dias
```

**Gerar uma chave segura:**
```bash
# No terminal (Node.js):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou online:
# https://generate-random.org/api-token-generator
```

---

### Passo 2: Instalar dependência JWT

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

---

### Passo 3: Criar Utilitário JWT

Crie **`src/lib/jwt.ts`**:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '21600'; // 6 horas padrão

interface JWTPayload {
  userId: string;
  email?: string;
  type: 'access' | 'refresh';
}

/**
 * Gerar token de acesso (6 horas)
 */
export function generateAccessToken(userId: string, email?: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: 'access',
    } as JWTPayload,
    JWT_SECRET,
    {
      expiresIn: parseInt(JWT_EXPIRATION), // segundos
    }
  );
}

/**
 * Gerar refresh token (30 dias)
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
    } as JWTPayload,
    JWT_SECRET,
    {
      expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRATION || '2592000'),
    }
  );
}

/**
 * Verificar e decodificar token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token inválido:', error);
    return null;
  }
}

/**
 * Verificar se token está expirado
 */
export function isTokenExpired(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return false;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return true;
    }
    return true; // Outros erros também consideramos como expirado
  }
}
```

---

### Passo 4: Criar Middleware JWT

Crie **`src/middleware/jwt-auth.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/lib/jwt';

export async function jwtAuthMiddleware(request: NextRequest) {
  // Ler token do cookie ou header
  const accessToken = 
    request.cookies.get('jwt_access_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Token não fornecido' },
      { status: 401 }
    );
  }

  // Verificar token
  const payload = verifyToken(accessToken);

  if (!payload) {
    // Token inválido, verificar refresh token
    const refreshToken = request.cookies.get('jwt_refresh_token')?.value;

    if (refreshToken) {
      const refreshPayload = verifyToken(refreshToken);

      if (refreshPayload && refreshPayload.type === 'refresh') {
        // Gerar novo access token
        const newAccessToken = generateAccessToken(
          refreshPayload.userId,
          refreshPayload.email
        );

        const response = NextResponse.next();
        response.cookies.set('jwt_access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: parseInt(process.env.JWT_EXPIRATION || '21600'),
        });

        return response;
      }
    }

    return NextResponse.json(
      { error: 'Token expirado' },
      { status: 401 }
    );
  }

  // Token válido, continuar
  return NextResponse.next();
}
```

---

## 📋 PARTE 4: Implementação Prática Recomendada

### Solução Mais Simples (Recomendada)

Use **apenas o Refresh Automático** (Parte 2):

1. ✅ Criar `src/lib/refresh-token.ts`
2. ✅ Criar `app/api/auth/refresh/route.ts`
3. ✅ Adicionar no layout do checklist

**Benefícios:**
- Funciona com Stack Auth nativo
- Não precisa gerenciar JWT manualmente
- Simples e eficaz

---

### Configuração Recomendada

```bash
# .env.local

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=seu-id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=sua-key
STACK_SECRET_SERVER_KEY=sua-secret

# Tempos de Sessão (tentar, pode não funcionar em todas versões)
STACK_SESSION_DURATION=21600  # 6 horas
STACK_REFRESH_TOKEN_DURATION=2592000  # 30 dias

# JWT Customizado (backup, se necessário)
JWT_SECRET=sua-chave-secreta-gerada-com-crypto
JWT_EXPIRATION=21600  # 6 horas
JWT_REFRESH_EXPIRATION=2592000  # 30 dias
```

---

## 🧪 Como Testar

### Teste 1: Verificar Refresh Automático

```typescript
// No console do navegador:

// Ver quando foi o último refresh
console.log('Último refresh:', localStorage.getItem('last_token_refresh'));

// Forçar refresh manual
await fetch('/api/auth/refresh', { 
  method: 'POST',
  credentials: 'include' 
});
```

### Teste 2: Verificar Cookies

```typescript
// Ver cookies do Stack Auth
document.cookie.split(';').forEach(c => {
  if (c.includes('stack')) {
    console.log(c);
  }
});
```

### Teste 3: Simular Expiração

```typescript
// Aguardar o tempo configurado (ex: 6h) ou
// Modificar tempo no .env para 1 minuto para teste rápido:
STACK_SESSION_DURATION=60  # 1 minuto
```

---

## 📊 Resumo das Configurações

| Método | Complexidade | Eficácia | Recomendado |
|--------|--------------|----------|-------------|
| **Refresh Automático** | ⭐ Baixa | ⭐⭐⭐ Alta | ✅ SIM |
| **Variáveis ENV Stack** | ⭐⭐ Média | ⭐⭐ Média | ⚠️ Se suportado |
| **JWT Customizado** | ⭐⭐⭐ Alta | ⭐⭐⭐ Alta | ⚠️ Só se necessário |

---

## 🎯 Implementação Mínima (Começa por aqui!)

1. **Criar** `src/lib/refresh-token.ts` (copiar código da Parte 2)
2. **Criar** `app/api/auth/refresh/route.ts` (copiar código da Parte 2)
3. **Adicionar** no `app/checklist/nova-avaliacao/page.tsx`:

```typescript
import { startTokenRefresh, stopTokenRefresh } from '@/lib/refresh-token';

// Dentro do componente, depois do useUser:
useEffect(() => {
  if (user) {
    startTokenRefresh(60); // 60 minutos
    return () => stopTokenRefresh();
  }
}, [user]);
```

4. **Adicionar no .env.local**:
```bash
STACK_SESSION_DURATION=21600
```

5. **Testar**: Preencher checklist e aguardar 1h+ para ver refresh automático.

---

## 🔧 Troubleshooting

### Problema: Refresh não funciona

**Solução:**
1. Verificar se route `/api/auth/refresh` está criada
2. Ver console do navegador para erros
3. Verificar Network tab no DevTools

### Problema: Ainda expira após 3h

**Solução:**
1. Stack Auth pode ter limite no plano
2. Usar JWT customizado como backup
3. Aumentar frequência do refresh (30 min ao invés de 60 min)

### Problema: Erro ao importar startTokenRefresh

**Solução:**
Criar o arquivo `src/lib/refresh-token.ts` conforme Parte 2.

---

## ✅ Checklist Final

- [ ] Criar `src/lib/refresh-token.ts`
- [ ] Criar `app/api/auth/refresh/route.ts`
- [ ] Adicionar refresh no checklist page
- [ ] Adicionar `STACK_SESSION_DURATION` no .env
- [ ] Testar por 1-2 horas
- [ ] Verificar logs do console
- [ ] Confirmar que não expira mais

---

**Pronto! Agora seu usuário pode ficar 6h+ no checklist sem perder a sessão! 🎉**
