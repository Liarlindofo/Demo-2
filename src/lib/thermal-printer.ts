/**
 * Sistema de Impressão Térmica Multi-Plataforma
 * Suporta: Web Bluetooth (Android), Web Serial (PC/USB), Fallbacks
 */

// Tipos para dados da etiqueta
export interface EtiquetaData {
  produtoNome: string;
  tipoArmazenamento: string;
  peso: string;
  unidadeMedida: string;
  periodoDias: number;
  dataManipulacao: string;
  dataValidade: string;
  responsavelNome: string;
  unidadeNome: string;
  unidadeCNPJ: string;
  unidadeCidade: string;
  marcaFornecedor?: string;
}

// Detecção de plataforma
export function detectPlatform(): {
  isAndroid: boolean;
  isIOS: boolean;
  isDesktop: boolean;
  isChrome: boolean;
  isEdge: boolean;
  supportsWebBluetooth: boolean;
  supportsWebSerial: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      isAndroid: false,
      isIOS: false,
      isDesktop: false,
      isChrome: false,
      isEdge: false,
      supportsWebBluetooth: false,
      supportsWebSerial: false,
    };
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isDesktop = !isAndroid && !isIOS;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isEdge = /Edg/.test(userAgent);

  // Web Bluetooth API support
  const supportsWebBluetooth = 
    'bluetooth' in navigator && 
    (isChrome || isEdge) &&
    (isAndroid || isDesktop);

  // Web Serial API support
  const supportsWebSerial = 
    'serial' in navigator && 
    (isChrome || isEdge) &&
    isDesktop;

  return {
    isAndroid,
    isIOS,
    isDesktop,
    isChrome,
    isEdge,
    supportsWebBluetooth,
    supportsWebSerial,
  };
}

// Comandos ESC/POS para PT-260
class ESCPOSCommands {
  // Inicializar impressora
  static INIT = '\x1B\x40';
  
  // Alinhamento
  static ALIGN_LEFT = '\x1B\x61\x00';
  static ALIGN_CENTER = '\x1B\x61\x01';
  static ALIGN_RIGHT = '\x1B\x61\x02';
  
  // Tamanho de fonte
  static FONT_NORMAL = '\x1D\x21\x00';
  static FONT_DOUBLE_WIDTH = '\x1D\x21\x10';
  static FONT_DOUBLE_HEIGHT = '\x1D\x21\x01';
  static FONT_DOUBLE = '\x1D\x21\x11';
  
  // Estilo
  static BOLD_ON = '\x1B\x45\x01';
  static BOLD_OFF = '\x1B\x45\x00';
  static UNDERLINE_ON = '\x1B\x2D\x01';
  static UNDERLINE_OFF = '\x1B\x2D\x00';
  
  // Linha
  static LINE_FEED = '\x0A';
  static FEED_LINES = (n: number) => `\x1B\x64${String.fromCharCode(n)}`;
  
  // Cortar papel
  static CUT = '\x1D\x56\x00';
  
  // Espaçamento
  static SET_LINE_SPACING = (n: number) => `\x1B\x33${String.fromCharCode(n)}`;
}

// Formatar dados da etiqueta em comandos ESC/POS
function formatEtiquetaESC(data: EtiquetaData): Uint8Array {
  let commands = '';
  
  // Inicializar
  commands += ESCPOSCommands.INIT;
  commands += ESCPOSCommands.SET_LINE_SPACING(24);
  
  // Cabeçalho - Nome do produto (centralizado, negrito, maior)
  commands += ESCPOSCommands.ALIGN_CENTER;
  commands += ESCPOSCommands.FONT_DOUBLE;
  commands += ESCPOSCommands.BOLD_ON;
  commands += data.produtoNome.toUpperCase() + ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.BOLD_OFF;
  commands += ESCPOSCommands.FONT_NORMAL;
  
  // Tipo de armazenamento
  commands += data.tipoArmazenamento + ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Informações principais (alinhado à esquerda)
  commands += ESCPOSCommands.ALIGN_LEFT;
  commands += `Peso/Qtd: ${data.peso} ${data.unidadeMedida}` + ESCPOSCommands.LINE_FEED;
  commands += `Validade: ${data.periodoDias} dias` + ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Datas
  commands += `Manipulado: ${data.dataManipulacao}` + ESCPOSCommands.LINE_FEED;
  commands += `Vence em: ${data.dataValidade}` + ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Responsável (centralizado)
  commands += ESCPOSCommands.ALIGN_CENTER;
  commands += ESCPOSCommands.BOLD_ON;
  commands += 'Responsável:' + ESCPOSCommands.LINE_FEED;
  commands += data.responsavelNome + ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.BOLD_OFF;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Unidade (centralizado)
  commands += ESCPOSCommands.BOLD_ON;
  commands += data.unidadeNome + ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.BOLD_OFF;
  commands += `CNPJ: ${data.unidadeCNPJ}` + ESCPOSCommands.LINE_FEED;
  commands += data.unidadeCidade + ESCPOSCommands.LINE_FEED;
  
  if (data.marcaFornecedor) {
    commands += `Marca: ${data.marcaFornecedor}` + ESCPOSCommands.LINE_FEED;
  }
  
  // Espaçamento final
  commands += ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Cortar papel
  commands += ESCPOSCommands.CUT;
  
  // Converter para bytes
  const encoder = new TextEncoder();
  return encoder.encode(commands);
}

// Web Bluetooth API - Android
async function printViaWebBluetooth(data: EtiquetaData): Promise<boolean> {
  try {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth não suportado');
    }

    // UUID do Serial Port Profile (SPP)
    const SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
    
    // Solicitar dispositivo Bluetooth
    // Tentar diferentes estratégias de filtro
    let device;
    try {
      // Estratégia 1: Buscar por nome conhecido
      device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'PT-' },
          { namePrefix: 'Brother' },
          { namePrefix: 'Label' },
        ],
        optionalServices: [SPP_SERVICE_UUID],
      });
    } catch (e) {
      // Estratégia 2: Buscar por serviço (pode não funcionar em todos os dispositivos)
      try {
        device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [SPP_SERVICE_UUID],
        });
      } catch (e2) {
        throw new Error('Não foi possível encontrar dispositivo Bluetooth. Certifique-se de que a impressora está ligada e pareada.');
      }
    }

    // Conectar ao GATT server
    if (!device.gatt) {
      throw new Error('Dispositivo não suporta GATT');
    }

    const server = await device.gatt.connect();
    if (!server) {
      throw new Error('Não foi possível conectar ao dispositivo');
    }

    // Tentar obter serviço Serial Port
    let service;
    try {
      service = await server.getPrimaryService(SPP_SERVICE_UUID);
    } catch (e) {
      // Se não encontrar o serviço SPP, tentar listar todos os serviços
      const services = await server.getPrimaryServices();
      if (services.length === 0) {
        throw new Error('Nenhum serviço encontrado no dispositivo');
      }
      // Usar o primeiro serviço disponível (pode funcionar para alguns dispositivos)
      service = services[0];
    }
    
    // Obter características
    const characteristics = await service.getCharacteristics();
    if (characteristics.length === 0) {
      throw new Error('Nenhuma característica encontrada');
    }
    
    // Procurar característica de escrita (write ou writeWithoutResponse)
    let writeCharacteristic = characteristics.find(c => 
      c.properties.write || c.properties.writeWithoutResponse
    );
    
    if (!writeCharacteristic) {
      // Se não encontrar, usar a primeira disponível
      writeCharacteristic = characteristics[0];
    }
    
    // Preparar dados
    const dataBytes = formatEtiquetaESC(data);
    
    // Enviar dados
    // Para BLE, enviar em chunks menores
    const chunkSize = writeCharacteristic.properties.writeWithoutResponse ? 20 : 512;
    
    for (let i = 0; i < dataBytes.length; i += chunkSize) {
      const chunk = dataBytes.slice(i, i + chunkSize);
      
      if (writeCharacteristic.properties.writeWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
      
      // Pequeno delay entre chunks
      if (i + chunkSize < dataBytes.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Desconectar
    device.gatt.disconnect();
    
    return true;
  } catch (error: any) {
    console.error('Erro ao imprimir via Web Bluetooth:', error);
    throw error;
  }
}

// Web Serial API - PC/Notebook (USB)
async function printViaWebSerial(data: EtiquetaData): Promise<boolean> {
  try {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial não suportado');
    }

    // Solicitar porta serial
    const port = await (navigator as any).serial.requestPort();
    
    // Abrir porta com configuração para PT-260
    await port.open({ 
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
    });

    // Preparar dados
    const dataBytes = formatEtiquetaESC(data);
    
    // Obter writer
    const writer = port.writable.getWriter();
    
    // Enviar dados
    await writer.write(dataBytes);
    
    // Fechar writer e porta
    writer.releaseLock();
    await port.close();
    
    return true;
  } catch (error: any) {
    console.error('Erro ao imprimir via Web Serial:', error);
    throw error;
  }
}

// Compartilhamento com app nativo (Android)
async function shareWithApp(data: EtiquetaData): Promise<boolean> {
  try {
    if (!('share' in navigator)) {
      throw new Error('Web Share API não suportado');
    }

    // Criar texto formatado para compartilhar
    const text = `
ETIQUETA - ${data.produtoNome.toUpperCase()}
${data.tipoArmazenamento}

Peso/Qtd: ${data.peso} ${data.unidadeMedida}
Validade: ${data.periodoDias} dias
Manipulado: ${data.dataManipulacao}
Vence em: ${data.dataValidade}

Responsável: ${data.responsavelNome}

${data.unidadeNome}
CNPJ: ${data.unidadeCNPJ}
${data.unidadeCidade}
${data.marcaFornecedor ? `Marca: ${data.marcaFornecedor}` : ''}
    `.trim();

    // Converter dados para JSON para app processar
    const jsonData = JSON.stringify(data);
    
    // Tentar compartilhar
    await navigator.share({
      title: `Etiqueta - ${data.produtoNome}`,
      text: text,
      // Alguns apps podem processar dados adicionais via URL
      url: `openlabel://print?data=${encodeURIComponent(jsonData)}`,
    });

    return true;
  } catch (error: any) {
    // Usuário cancelou ou erro
    if (error.name === 'AbortError') {
      return false;
    }
    throw error;
  }
}

// Download de arquivo para impressão manual
function downloadForPrint(data: EtiquetaData): void {
  const text = `
ETIQUETA - ${data.produtoNome.toUpperCase()}
${data.tipoArmazenamento}

Peso/Qtd: ${data.peso} ${data.unidadeMedida}
Validade: ${data.periodoDias} dias
Manipulado: ${data.dataManipulacao}
Vence em: ${data.dataValidade}

Responsável: ${data.responsavelNome}

${data.unidadeNome}
CNPJ: ${data.unidadeCNPJ}
${data.unidadeCidade}
${data.marcaFornecedor ? `Marca: ${data.marcaFornecedor}` : ''}
  `.trim();

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `etiqueta-${data.produtoNome.replace(/\s+/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Função principal de impressão com fallbacks
export async function printEtiqueta(
  data: EtiquetaData,
  options: {
    preferBluetooth?: boolean;
    preferUSB?: boolean;
    onStatus?: (status: string) => void;
  } = {}
): Promise<{ success: boolean; method: string; error?: string }> {
  const platform = detectPlatform();
  const { onStatus } = options;

  // Callback de status
  const updateStatus = (msg: string) => {
    if (onStatus) onStatus(msg);
    console.log(`[Impressão] ${msg}`);
  };

  try {
    // Estratégia 1: Android - Web Bluetooth
    if (platform.isAndroid && platform.supportsWebBluetooth && (options.preferBluetooth !== false)) {
      try {
        updateStatus('Conectando via Bluetooth...');
        await printViaWebBluetooth(data);
        updateStatus('Impressão concluída via Bluetooth!');
        return { success: true, method: 'Web Bluetooth' };
      } catch (error: any) {
        updateStatus(`Bluetooth falhou: ${error.message}`);
        // Continua para fallback
      }
    }

    // Estratégia 2: Desktop - Web Serial (USB)
    if (platform.isDesktop && platform.supportsWebSerial && (options.preferUSB !== false)) {
      try {
        updateStatus('Conectando via USB...');
        await printViaWebSerial(data);
        updateStatus('Impressão concluída via USB!');
        return { success: true, method: 'Web Serial (USB)' };
      } catch (error: any) {
        updateStatus(`USB falhou: ${error.message}`);
        // Continua para fallback
      }
    }

    // Estratégia 3: Android - Compartilhamento com app
    if (platform.isAndroid && 'share' in navigator) {
      try {
        updateStatus('Abrindo app de impressão...');
        const shared = await shareWithApp(data);
        if (shared) {
          updateStatus('Dados compartilhados com app!');
          return { success: true, method: 'Compartilhamento (App)' };
        }
      } catch (error: any) {
        updateStatus(`Compartilhamento falhou: ${error.message}`);
        // Continua para fallback
      }
    }

    // Estratégia 4: Fallback - Download de arquivo
    updateStatus('Fazendo download do arquivo...');
    downloadForPrint(data);
    updateStatus('Arquivo baixado! Imprima manualmente.');
    return { 
      success: true, 
      method: 'Download',
      error: 'Impressão direta não disponível. Arquivo baixado para impressão manual.'
    };

  } catch (error: any) {
    updateStatus(`Erro: ${error.message}`);
    return { 
      success: false, 
      method: 'Nenhum',
      error: error.message || 'Erro desconhecido ao imprimir'
    };
  }
}

// Verificar disponibilidade de métodos de impressão
export function getAvailablePrintMethods(): {
  webBluetooth: boolean;
  webSerial: boolean;
  webShare: boolean;
  download: boolean;
  platform: string;
} {
  const platform = detectPlatform();
  
  return {
    webBluetooth: platform.supportsWebBluetooth,
    webSerial: platform.supportsWebSerial,
    webShare: 'share' in navigator,
    download: true, // Sempre disponível
    platform: platform.isAndroid ? 'Android' : platform.isIOS ? 'iOS' : 'Desktop',
  };
}
