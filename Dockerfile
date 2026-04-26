# Dockerfile para drin-platform (Next.js)
FROM node:20-alpine AS base

# ─── Estágio de dependências ───────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# ─── Estágio de build ──────────────────────────────────────────────────────────
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# Variáveis públicas do Next.js precisam estar disponíveis no BUILD
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STACK_PROJECT_ID
ARG NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STACK_PROJECT_ID=$NEXT_PUBLIC_STACK_PROJECT_ID
ENV NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=$NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

# Variáveis de build necessárias (valores fictícios para o build não quebrar)
# Os valores reais são injetados em runtime via variáveis de ambiente do container
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder/placeholder"
ENV STACK_SECRET_SERVER_KEY="placeholder"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Estágio de produção ───────────────────────────────────────────────────────
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# standalone output (configurado no next.config.ts)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
