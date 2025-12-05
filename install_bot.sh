#!/bin/bash

# =============================================================================
# SCRIPT DE INSTALAÇÃO - DRIN WHATSAPP BACKEND
# Para: VPS Ubuntu/Debian
# =============================================================================

echo "🚀 Iniciando instalação do DRIN WhatsApp Backend..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para mensagens
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Atualizar sistema
log_info "Atualizando sistema..."
apt update -y && apt upgrade -y
log_success "Sistema atualizado"

# Instalar Node.js 20.x
log_info "Instalando Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
log_success "Node.js instalado: $(node --version)"

# Instalar dependências
log_info "Instalando dependências do sistema..."
apt install -y git nginx postgresql postgresql-contrib build-essential
log_success "Dependências instaladas"

# Instalar PM2 globalmente
log_info "Instalando PM2..."
npm install pm2 -g
log_success "PM2 instalado: $(pm2 --version)"

# Criar diretório para o bot
log_info "Criando diretório do backend..."
mkdir -p /var/drin-backend
cd /var/drin-backend

# Clonar repositório (ajuste a URL do seu repo)
log_info "Clonando repositório..."
# git clone https://github.com/seu-usuario/drin-platform.git .
# cd backend
# OU copie os arquivos manualmente para /var/drin-backend

log_info "Para continuar, você precisa:"
echo "1. Copiar os arquivos do backend para /var/drin-backend"
echo "2. Criar o arquivo .env com as configurações"
echo "3. Executar: npm install"
echo "4. Executar: npx prisma migrate deploy"
echo "5. Executar: npm run build"
echo "6. Executar: pm2 start ecosystem.config.js"
echo ""

# Criar arquivo .env de exemplo
log_info "Criando .env de exemplo..."
cat > /var/drin-backend/.env.example << 'EOF'
# Backend - WhatsApp API
PORT=3001
NODE_ENV=production

# Database PostgreSQL
DATABASE_URL=postgresql://drin_user:SuaSenha@localhost:5432/drin_whatsapp

# OpenRouter (IA)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/chatgpt-4o-latest

# Chave de API para autenticação
DRIN_API_KEY=sua_chave_api_segura_aqui
EOF

log_success ".env.example criado"

# Configurar PostgreSQL
log_info "Configurando PostgreSQL..."
sudo -u postgres psql << EOF
CREATE USER drin_user WITH PASSWORD 'SuaSenhaSegura123!';
CREATE DATABASE drin_whatsapp OWNER drin_user;
GRANT ALL PRIVILEGES ON DATABASE drin_whatsapp TO drin_user;
\q
EOF
log_success "PostgreSQL configurado"

# Criar diretórios necessários
log_info "Criando diretórios..."
mkdir -p /var/drin-backend/logs
mkdir -p /var/drin-backend/src/sessions
chmod -R 755 /var/drin-backend
log_success "Diretórios criados"

# Mensagem final
echo ""
echo "=========================================="
log_success "Instalação base concluída!"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Copie os arquivos do backend para: /var/drin-backend"
echo "2. Configure o .env baseado no .env.example"
echo "3. Execute: cd /var/drin-backend && npm install"
echo "4. Execute: npx prisma migrate deploy"
echo "5. Execute: npm run build"
echo "6. Execute: pm2 start ecosystem.config.js"
echo "7. Execute: pm2 save"
echo "8. Execute: pm2 startup"
echo "9. Configure o Nginx (use o arquivo whatsapp-api.nginx.conf)"
echo ""
log_info "Para verificar status: pm2 status"
log_info "Para ver logs: pm2 logs drin-whatsapp-backend"
echo ""

