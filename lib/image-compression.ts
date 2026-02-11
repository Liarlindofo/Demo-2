/**
 * 📸 Utilitário para Compressão de Imagens
 * 
 * Comprime imagens antes de salvar no banco de dados ou localStorage
 * para economizar espaço e melhorar performance no Android
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 a 1.0
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.75, // 75% de qualidade (ótimo balanço)
  outputFormat: 'image/jpeg',
};

/**
 * Comprime uma imagem em base64
 * @param base64Image - Imagem em formato base64
 * @param options - Opções de compressão
 * @returns Promise com a imagem comprimida em base64
 */
export async function compressImage(
  base64Image: string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Criar elemento de imagem
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calcular novas dimensões mantendo aspect ratio
        let { width, height } = img;
        
        if (opts.maxWidth && width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width;
          width = opts.maxWidth;
        }
        
        if (opts.maxHeight && height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height;
          height = opts.maxHeight;
        }

        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para base64 com compressão
        const compressedBase64 = canvas.toDataURL(opts.outputFormat, opts.quality);
        
        // Log para debug (tamanho antes/depois)
        const originalSize = Math.round(base64Image.length / 1024);
        const compressedSize = Math.round(compressedBase64.length / 1024);
        const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
        
        console.log(`📸 Imagem comprimida: ${originalSize}KB → ${compressedSize}KB (${reduction}% redução)`);

        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem para compressão'));
    };

    img.src = base64Image;
  });
}

/**
 * Comprime múltiplas imagens em paralelo
 * @param base64Images - Array de imagens em base64
 * @param options - Opções de compressão
 * @returns Promise com array de imagens comprimidas
 */
export async function compressMultipleImages(
  base64Images: string[],
  options: CompressionOptions = {}
): Promise<string[]> {
  const promises = base64Images.map(img => compressImage(img, options));
  return Promise.all(promises);
}

/**
 * Valida se uma string é uma imagem base64 válida
 * @param base64String - String para validar
 * @returns boolean indicando se é válida
 */
export function isValidBase64Image(base64String: string): boolean {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }

  // Verificar se começa com data:image/
  return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(base64String);
}

/**
 * Estima o tamanho em bytes de uma string base64
 * @param base64String - String base64
 * @returns Tamanho em bytes
 */
export function getBase64Size(base64String: string): number {
  // Remover header data:image/...;base64,
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Calcular tamanho (base64 usa ~33% mais espaço que o arquivo original)
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.round((base64Data.length * 3) / 4 - padding);
}

/**
 * Formata tamanho em bytes para leitura humana
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
