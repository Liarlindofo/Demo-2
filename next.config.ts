import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    STACK_AUTH_DOMAIN: 'https://platefull.com.br',
    STACK_AUTH_HANDLER_PATH: '/handler',
  },
  // Configuração Turbopack (Next.js 16+)
  turbopack: {},
  // Excluir backend e scripts de teste do build do Next.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Ignorar scripts de teste e utilitários durante o build
    // (Eles não são necessários para o build do Next.js)
    
    return config;
  },
  // Ignorar arquivos do backend durante o build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
