import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    STACK_AUTH_DOMAIN: 'https://platefull.com.br',
    STACK_AUTH_HANDLER_PATH: '/handler',
  },
  // Excluir backend do build do Next.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Ignorar arquivos do backend durante o build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
