/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumentar limite de body para APIs (50MB)
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
  
  // Desabilitar strict mode para evitar double render
  reactStrictMode: false,
  
  // Configurações de imagem
  images: {
    domains: ['platefull.com.br'],
  },
};

export default nextConfig;
