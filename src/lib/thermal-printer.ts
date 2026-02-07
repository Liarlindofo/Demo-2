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

// Comandos ESC/POS para impressoras térmicas (i9, PT-260, etc)
class ESCPOSCommands {
  // Inicializar impressora
  static INIT = '\x1B\x40'; // ESC @
  
  // Alinhamento
  static ALIGN_LEFT = '\x1B\x61\x00';   // ESC a 0
  static ALIGN_CENTER = '\x1B\x61\x01'; // ESC a 1
  static ALIGN_RIGHT = '\x1B\x61\x02';  // ESC a 2
  
  // Tamanho de fonte
  static FONT_NORMAL = '\x1D\x21\x00';        // GS ! 0
  static FONT_DOUBLE_WIDTH = '\x1D\x21\x10';  // GS ! 16
  static FONT_DOUBLE_HEIGHT = '\x1D\x21\x01'; // GS ! 1
  static FONT_DOUBLE = '\x1D\x21\x11';        // GS ! 17
  
  // Estilo
  static BOLD_ON = '\x1B\x45\x01';   // ESC E 1
  static BOLD_OFF = '\x1B\x45\x00';  // ESC E 0
  static UNDERLINE_ON = '\x1B\x2D\x01';
  static UNDERLINE_OFF = '\x1B\x2D\x00';
  
  // Linha
  static LINE_FEED = '\x0A';  // LF
  static CARRIAGE_RETURN = '\x0D'; // CR
  static FEED_LINES = (n: number) => `\x1B\x64${String.fromCharCode(n)}`;
  
  // Cortar papel
  static CUT_FULL = '\x1D\x56\x00';     // GS V 0 - corte total
  static CUT_PARTIAL = '\x1D\x56\x01';  // GS V 1 - corte parcial
  static CUT = '\x1D\x56\x41\x00';      // GS V A 0 - corte com alimentação
  
  // Espaçamento
  static SET_LINE_SPACING = (n: number) => `\x1B\x33${String.fromCharCode(n)}`;
  static SET_DEFAULT_LINE_SPACING = '\x1B\x32'; // ESC 2
}

// Formatar dados da etiqueta em comandos ESC/POS (otimizado para 80mm x 30mm)
function formatEtiquetaESC(data: EtiquetaData): Uint8Array {
  let commands = '';
  
  // Inicializar impressora (IMPORTANTE!)
  commands += ESCPOSCommands.INIT;
  
  // Aguardar um pouco após inicialização
  // (Simulado com comando, delay real é no envio)
  
  // Configurar espaçamento de linha (mais compacto)
  commands += ESCPOSCommands.SET_LINE_SPACING(20); // 20/180 polegadas (antes era 30)
  
  // === CABEÇALHO ===
  // Nome do produto (centralizado, negrito, fonte dupla)
  commands += ESCPOSCommands.ALIGN_CENTER;
  commands += ESCPOSCommands.FONT_DOUBLE;
  commands += ESCPOSCommands.BOLD_ON;
  commands += data.produtoNome.toUpperCase();
  commands += ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.BOLD_OFF;
  commands += ESCPOSCommands.FONT_NORMAL;
  
  // Tipo de armazenamento (centralizado, negrito) - SEM quebra de linha extra
  commands += ESCPOSCommands.BOLD_ON;
  commands += data.tipoArmazenamento;
  commands += ESCPOSCommands.BOLD_OFF;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Linha divisória (mais curta)
  commands += '----------------------------';
  commands += ESCPOSCommands.LINE_FEED;
  
  // === INFORMAÇÕES PRINCIPAIS ===
  // Alinhado à esquerda
  commands += ESCPOSCommands.ALIGN_LEFT;
  
  // Peso e validade na mesma linha (mais compacto)
  commands += `Peso/Qtd: ${data.peso} ${data.unidadeMedida}`;
  commands += `  Val: ${data.periodoDias}d`; // "d" em vez de "dias"
  commands += ESCPOSCommands.LINE_FEED;
  
  // Datas (uma linha cada, sem espaço extra)
  commands += `Manip: ${data.dataManipulacao}`;
  commands += ESCPOSCommands.LINE_FEED;
  commands += `Vence: ${data.dataValidade}`;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Linha divisória (mais curta)
  commands += '----------------------------';
  commands += ESCPOSCommands.LINE_FEED;
  
  // === RESPONSÁVEL E UNIDADE ===
  // Centralizado
  commands += ESCPOSCommands.ALIGN_CENTER;
  
  // Responsável (abreviado)
  commands += `Resp: ${data.responsavelNome}`;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Unidade (negrito, sem linha extra)
  commands += ESCPOSCommands.BOLD_ON;
  commands += data.unidadeNome;
  commands += ESCPOSCommands.BOLD_OFF;
  commands += ESCPOSCommands.LINE_FEED;
  
  // CNPJ e Cidade (uma linha)
  commands += `${data.unidadeCNPJ}-${data.unidadeCidade}`;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Marca (se houver) - sem linha extra
  if (data.marcaFornecedor) {
    commands += `Marca: ${data.marcaFornecedor}`;
    commands += ESCPOSCommands.LINE_FEED;
  }
  
  // === FINALIZAÇÃO ===
  // Alimentar papel (reduzido de 3 para 2 linhas)
  commands += ESCPOSCommands.LINE_FEED;
  commands += ESCPOSCommands.LINE_FEED;
  
  // Cortar papel (usar corte com alimentação)
  commands += ESCPOSCommands.CUT;
  
  // Converter para bytes UTF-8
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
    console.log(`Enviando ${dataBytes.length} bytes via Bluetooth`);
    
    // Enviar dados
    // Para BLE, enviar em chunks menores
    const chunkSize = writeCharacteristic.properties.writeWithoutResponse ? 20 : 512;
    
    for (let i = 0; i < dataBytes.length; i += chunkSize) {
      const chunk = dataBytes.slice(i, i + chunkSize);
      
      try {
        if (writeCharacteristic.properties.writeWithoutResponse) {
          await writeCharacteristic.writeValueWithoutResponse(chunk);
        } else if (writeCharacteristic.properties.write) {
          await writeCharacteristic.writeValue(chunk);
        } else {
          throw new Error('Característica não suporta escrita');
        }
        
        // Pequeno delay entre chunks
        if (i + chunkSize < dataBytes.length) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      } catch (chunkError: any) {
        console.error(`Erro ao enviar chunk ${i}-${i + chunkSize}:`, chunkError);
        throw new Error(`Erro ao enviar dados: ${chunkError.message}`);
      }
    }

    console.log('Dados enviados com sucesso via Bluetooth');
    
    // Aguardar um pouco para garantir que os dados foram processados
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Desconectar
    if (device.gatt && device.gatt.connected) {
      device.gatt.disconnect();
    }
    
    return true;
  } catch (error: any) {
    console.error('Erro ao imprimir via Web Bluetooth:', error);
    
    // Mensagens de erro mais amigáveis
    if (error.name === 'NotFoundError') {
      throw new Error('Impressora não encontrada. Verifique se está ligada e pareada.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Permissão negada. Por favor, permita o acesso ao Bluetooth.');
    } else if (error.message?.includes('cancel') || error.message?.includes('User cancelled')) {
      throw new Error('Conexão cancelada pelo usuário.');
    } else if (error.message?.includes('GATT')) {
      throw new Error('Erro de conexão Bluetooth. Tente novamente ou use o app OpenLabel.');
    } else {
      throw new Error(`Erro ao conectar: ${error.message || 'Erro desconhecido'}`);
    }
  }
}

// Armazenar porta serial selecionada
let savedPort: any = null;

// Resetar porta salva (útil para trocar de impressora)
export function resetSavedPort(): void {
  savedPort = null;
  console.log('Porta USB salva foi resetada');
}

// Web Serial API - PC/Notebook (USB)
async function printViaWebSerial(data: EtiquetaData, forceNewPort: boolean = false): Promise<boolean> {
  let port: any = null;
  let writer: any = null;
  
  try {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial não suportado. Use Chrome ou Edge.');
    }

    // Tentar usar porta salva primeiro (impressão direta sem diálogo!)
    if (!forceNewPort && savedPort) {
      console.log('Usando porta USB salva - impressão direta!');
      port = savedPort;
    } else {
      // Tentar obter portas já autorizadas
      const ports = await (navigator as any).serial.getPorts();
      
      if (!forceNewPort && ports && ports.length > 0) {
        // Usar a primeira porta autorizada (impressão direta!)
        console.log(`Encontrada ${ports.length} porta(s) autorizada(s) - usando automaticamente`);
        port = ports[0];
        savedPort = port;
      } else {
        // Solicitar porta serial apenas se não houver porta salva
        // O usuário precisa selecionar a porta no diálogo (apenas na primeira vez)
        console.log('Solicitando seleção de porta USB (primeira vez)');
        port = await (navigator as any).serial.requestPort();
        
        if (!port) {
          throw new Error('Nenhuma porta selecionada');
        }
        
        // Salvar porta para próximas impressões
        savedPort = port;
        console.log('Porta USB salva para impressões futuras!');
      }
    }
    
    // Abrir porta com configuração para impressoras térmicas
    // Impressora i9 geralmente usa 9600 baud
    const baudRates = [9600, 115200, 19200, 38400, 57600];
    let opened = false;
    let lastError: any = null;
    
    for (const baudRate of baudRates) {
      try {
        await port.open({ 
          baudRate: baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none', // Importante: sem controle de fluxo
        });
        opened = true;
        console.log(`✅ Porta aberta em ${baudRate} baud`);
        break;
      } catch (e) {
        lastError = e;
        console.log(`Tentativa com ${baudRate} baud falhou:`, e);
        // Se a porta já está aberta, tentar continuar
        if (port.readable && port.writable) {
          opened = true;
          console.log('Porta já estava aberta, reutilizando');
          break;
        }
      }
    }
    
    if (!opened && !port.readable) {
      throw lastError || new Error('Não foi possível abrir a porta serial');
    }

    // Preparar dados
    const dataBytes = formatEtiquetaESC(data);
    console.log(`📄 Enviando ${dataBytes.length} bytes para impressora`);
    
    // Obter writer
    if (!port.writable) {
      throw new Error('Porta não está gravável');
    }
    
    writer = port.writable.getWriter();
    
    if (!writer) {
      throw new Error('Não foi possível obter writer');
    }
    
    // Enviar dados em chunks menores para garantir recebimento
    const chunkSize = 32; // Menor para maior confiabilidade
    let bytesSent = 0;
    
    for (let i = 0; i < dataBytes.length; i += chunkSize) {
      const chunk = dataBytes.slice(i, i + chunkSize);
      await writer.write(chunk);
      bytesSent += chunk.length;
      console.log(`📤 Enviado: ${bytesSent}/${dataBytes.length} bytes (${Math.round(bytesSent/dataBytes.length*100)}%)`);
      
      // Delay maior entre chunks para dar tempo da impressora processar
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('✅ Todos os dados enviados');
    
    // IMPORTANTE: Aguardar mais tempo para a impressora processar
    // Impressoras térmicas podem levar tempo para processar os comandos
    console.log('⏳ Aguardando impressora processar...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo
    
    // Fechar writer
    console.log('🔓 Liberando writer');
    writer.releaseLock();
    writer = null;
    
    // NÃO fechar a porta imediatamente - manter aberta para próximas impressões
    // Isso também ajuda a garantir que os dados foram enviados
    console.log('✅ Impressão enviada - porta mantida aberta para próximas impressões');
    
    // Não fazer port.close() - deixar a porta aberta
    // port = null não é necessário pois vamos reutilizar savedPort
    
    return true;
  } catch (error: any) {
    console.error('Erro ao imprimir via Web Serial:', error);
    
    // Limpar recursos em caso de erro
    try {
      if (writer) {
        console.log('🧹 Liberando writer após erro');
        writer.releaseLock();
      }
      // NÃO fechar a porta em caso de erro - pode ser reutilizada
      // if (port && port.readable) {
      //   await port.close();
      // }
    } catch (cleanupError) {
      console.error('Erro ao limpar recursos:', cleanupError);
    }
    
    // Mensagens de erro mais amigáveis
    if (error.name === 'NotFoundError') {
      throw new Error('Nenhuma porta serial encontrada. Verifique se a impressora está conectada via USB.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Permissão negada. Por favor, permita o acesso à porta serial.');
    } else if (error.message?.includes('cancel')) {
      throw new Error('Seleção de porta cancelada pelo usuário.');
    } else {
      throw new Error(`Erro ao conectar: ${error.message || 'Erro desconhecido'}`);
    }
  }
}

// Compartilhamento com app nativo (Android)
async function shareWithApp(data: EtiquetaData): Promise<boolean> {
  try {
    // Tentar primeiro com intent direto do Android (mais confiável)
    if ((window as any).Android && typeof (window as any).Android.printLabel === 'function') {
      try {
        (window as any).Android.printLabel(JSON.stringify(data));
        return true;
      } catch (e) {
        console.log('Intent Android não disponível, tentando Web Share API');
      }
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
    
    // Tentar compartilhar via Web Share API
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: `Etiqueta - ${data.produtoNome}`,
          text: text,
          // Tentar diferentes formatos de URL para diferentes apps
          url: `openlabel://print?data=${encodeURIComponent(jsonData)}`,
        });
        return true;
      } catch (shareError: any) {
        // Se Web Share falhar, tentar criar arquivo para compartilhar
        if (shareError.name !== 'AbortError') {
          throw shareError;
        }
        return false;
      }
    }

    // Fallback: criar arquivo e tentar compartilhar
    const blob = new Blob([jsonData], { type: 'application/json' });
    const file = new File([blob], 'etiqueta.json', { type: 'application/json' });
    
    // Verificar se canShare existe e suporta arquivos
    const nav = navigator as any;
    if (nav.canShare && typeof nav.canShare === 'function') {
      try {
        if (nav.canShare({ files: [file] })) {
          await nav.share({
            title: `Etiqueta - ${data.produtoNome}`,
            text: text,
            files: [file],
          });
          return true;
        }
      } catch (e) {
        // canShare pode lançar erro se não suportar arquivos
        console.log('canShare não suporta arquivos:', e);
      }
    }

    throw new Error('Compartilhamento não disponível');
  } catch (error: any) {
    // Usuário cancelou ou erro
    if (error.name === 'AbortError') {
      return false;
    }
    throw error;
  }
}

// Criar arquivo ESC/POS para compartilhar com app
function createESCPOSFile(data: EtiquetaData): Blob {
  const dataBytes = formatEtiquetaESC(data);
  // Usar diretamente o Uint8Array - mais simples e compatível
  return new Blob([dataBytes as BlobPart], { type: 'application/octet-stream' });
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
    forceNewPort?: boolean;
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
    // Estratégia 1: Android - Tentar Web Bluetooth (pode não funcionar com PT-260)
    // NOTA: PT-260 usa Bluetooth Classic (SPP), não BLE, então Web Bluetooth pode falhar
    if (platform.isAndroid && platform.supportsWebBluetooth && (options.preferBluetooth !== false)) {
      try {
        updateStatus('Tentando conectar via Bluetooth...');
        updateStatus('⚠️ Nota: Se falhar, será oferecido compartilhamento com app.');
        const result = await printViaWebBluetooth(data);
        if (result) {
          updateStatus('Impressão concluída via Bluetooth!');
          return { success: true, method: 'Web Bluetooth' };
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Erro desconhecido';
        console.error('Erro detalhado Bluetooth:', error);
        console.log('Web Bluetooth falhou (esperado para PT-260). Tentando compartilhamento com app...');
        
        // Para PT-260, Web Bluetooth geralmente falha, então vamos direto para compartilhamento
        updateStatus('Bluetooth direto não disponível. Usando app nativo...');
        // Continua para compartilhamento
      }
    }

    // Estratégia 2: Desktop - Web Serial (USB)
    if (platform.isDesktop && platform.supportsWebSerial && (options.preferUSB !== false)) {
      try {
        if (options.forceNewPort) {
          updateStatus('Aguardando seleção da porta USB...');
          updateStatus('Por favor, selecione a porta COM da impressora no diálogo.');
        } else {
          updateStatus('Conectando à impressora USB...');
        }
        const result = await printViaWebSerial(data, options.forceNewPort);
        if (result) {
          updateStatus('✅ Impressão concluída via USB!');
          return { success: true, method: 'Web Serial (USB)' };
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Erro desconhecido';
        updateStatus(`USB falhou: ${errorMsg}`);
        console.error('❌ Erro detalhado USB:', error);
        console.error('Stack:', error.stack);
        
        // Se o usuário cancelou, não tentar fallback automaticamente
        if (errorMsg.includes('cancel') || errorMsg.includes('Cancel')) {
          return { 
            success: false, 
            method: 'Web Serial (USB)',
            error: 'Seleção de porta cancelada. Tente novamente e selecione a porta COM da impressora.'
          };
        }
        
        // Se deu erro na impressão, retornar erro específico
        return {
          success: false,
          method: 'Web Serial (USB)',
          error: `Erro na comunicação USB: ${errorMsg}. Verifique se a impressora está ligada e conectada.`
        };
      }
    }

    // Estratégia 3: Android - Compartilhamento com app (RECOMENDADO para PT-260)
    // Esta é a melhor opção para PT-260 no Android
    if (platform.isAndroid) {
      try {
        updateStatus('Preparando dados para app de impressão...');
        
        // Tentar compartilhamento primeiro
        if ('share' in navigator) {
          try {
            updateStatus('Abrindo diálogo de compartilhamento...');
            updateStatus('Selecione "OpenLabel" ou outro app de impressão');
            const shared = await shareWithApp(data);
            if (shared) {
              updateStatus('✅ Dados enviados para app! Abra o app para imprimir.');
              return { 
                success: true, 
                method: 'Compartilhamento (App)',
                error: 'Dados compartilhados. Abra o app OpenLabel para imprimir.'
              };
            }
          } catch (shareError: any) {
            if (shareError.name === 'AbortError') {
              return { 
                success: false, 
                method: 'Compartilhamento',
                error: 'Compartilhamento cancelado. Tente novamente.'
              };
            }
            console.log('Compartilhamento falhou, tentando download de arquivo ESC/POS:', shareError);
          }
        }
        
        // Se compartilhamento não funcionou, criar arquivo ESC/POS para download
        // O usuário pode abrir este arquivo no OpenLabel
        updateStatus('Criando arquivo para impressão...');
        const escposFile = createESCPOSFile(data);
        const url = URL.createObjectURL(escposFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = `etiqueta-${data.produtoNome.replace(/\s+/g, '-')}.bin`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateStatus('✅ Arquivo baixado! Abra no OpenLabel para imprimir.');
        return { 
          success: true, 
          method: 'Download (App)',
          error: 'Arquivo baixado. Abra o arquivo .bin no app OpenLabel para imprimir.'
        };
        
      } catch (error: any) {
        updateStatus(`Erro: ${error.message}`);
        // Continua para fallback de texto
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

// Teste BÁSICO - apenas texto puro (teste nível 1)
export async function testPrinterBasic(
  onStatus?: (status: string) => void
): Promise<{ success: boolean; error?: string }> {
  const platform = detectPlatform();
  
  if (!platform.supportsWebSerial) {
    return {
      success: false,
      error: 'Web Serial não suportado. Use Chrome ou Edge no PC.'
    };
  }
  
  const updateStatus = (msg: string) => {
    if (onStatus) onStatus(msg);
    console.log(`[Teste Básico] ${msg}`);
  };
  
  let port: any = savedPort;
  let writer: any = null;
  
  try {
    updateStatus('🧪 TESTE NÍVEL 1: Texto puro (sem comandos)');
    
    if (!port) {
      const ports = await (navigator as any).serial.getPorts();
      if (ports && ports.length > 0) {
        port = ports[0];
        savedPort = port;
      } else {
        return { success: false, error: 'Nenhuma porta configurada. Configure primeiro.' };
      }
    }
    
    // Garantir que porta está aberta
    if (!port.readable || !port.writable) {
      await port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });
    }
    
    writer = port.writable.getWriter();
    
    // TESTE MAIS SIMPLES: apenas texto ASCII puro + quebras de linha
    const testText = '\n\n\n=== TESTE ELGIN i9 ===\n\nSe voce esta lendo isso\na impressora funciona!\n\n\n\n\n';
    const encoder = new TextEncoder();
    const data = encoder.encode(testText);
    
    updateStatus(`📤 Enviando ${data.length} bytes de texto puro...`);
    await writer.write(data);
    
    updateStatus('⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    writer.releaseLock();
    
    updateStatus('✅ Texto enviado! A impressora imprimiu algo?');
    updateStatus('📋 Se SIM: problema está nos comandos ESC/POS');
    updateStatus('📋 Se NÃO: problema está na comunicação USB');
    
    return { success: true };
  } catch (error: any) {
    if (writer) writer.releaseLock();
    updateStatus(`❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Teste com comandos ESC/POS básicos (teste nível 2)
export async function testPrinterESCPOS(
  onStatus?: (status: string) => void
): Promise<{ success: boolean; error?: string }> {
  const platform = detectPlatform();
  
  if (!platform.supportsWebSerial) {
    return { success: false, error: 'Web Serial não suportado.' };
  }
  
  const updateStatus = (msg: string) => {
    if (onStatus) onStatus(msg);
    console.log(`[Teste ESC/POS] ${msg}`);
  };
  
  let port: any = savedPort;
  let writer: any = null;
  
  try {
    updateStatus('🧪 TESTE NÍVEL 2: Comandos ESC/POS básicos');
    
    if (!port) {
      const ports = await (navigator as any).serial.getPorts();
      if (ports && ports.length > 0) {
        port = ports[0];
        savedPort = port;
      } else {
        return { success: false, error: 'Nenhuma porta configurada.' };
      }
    }
    
    if (!port.readable || !port.writable) {
      await port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });
    }
    
    writer = port.writable.getWriter();
    
    // Comandos ESC/POS MÍNIMOS
    let commands = '';
    commands += '\x1B\x40';        // ESC @ - Inicializar
    commands += '\x1B\x61\x01';    // ESC a 1 - Centralizar
    commands += '\n\n';
    commands += '=== TESTE ESC/POS ===\n';
    commands += '\x1B\x45\x01';    // ESC E 1 - Negrito ON
    commands += 'ELGIN i9\n';
    commands += '\x1B\x45\x00';    // ESC E 0 - Negrito OFF
    commands += '\n';
    commands += 'Se voce esta lendo\n';
    commands += 'isto em negrito,\n';
    commands += 'os comandos ESC/POS\n';
    commands += 'estao funcionando!\n';
    commands += '\n\n\n\n\n';
    
    const encoder = new TextEncoder();
    const data = encoder.encode(commands);
    
    updateStatus(`📤 Enviando ${data.length} bytes com ESC/POS...`);
    await writer.write(data);
    
    updateStatus('⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    writer.releaseLock();
    
    updateStatus('✅ Comandos enviados! Imprimiu com negrito?');
    updateStatus('📋 Se SIM: ESC/POS funciona!');
    updateStatus('📋 Se NÃO: pode precisar comandos Elgin específicos');
    
    return { success: true };
  } catch (error: any) {
    if (writer) writer.releaseLock();
    updateStatus(`❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Teste completo com etiqueta (teste nível 3)
export async function testPrinter(
  onStatus?: (status: string) => void
): Promise<{ success: boolean; error?: string }> {
  const platform = detectPlatform();
  
  if (!platform.supportsWebSerial) {
    return {
      success: false,
      error: 'Web Serial não suportado. Use Chrome ou Edge no PC.'
    };
  }
  
  const updateStatus = (msg: string) => {
    if (onStatus) onStatus(msg);
    console.log(`[Teste] ${msg}`);
  };
  
  try {
    updateStatus('🧪 TESTE NÍVEL 3: Etiqueta completa');
    
    // Criar dados de teste simples
    const testData: EtiquetaData = {
      produtoNome: 'TESTE DE IMPRESSAO',
      tipoArmazenamento: 'TESTE',
      peso: '1',
      unidadeMedida: 'kg',
      periodoDias: 1,
      dataManipulacao: new Date().toLocaleDateString('pt-BR'),
      dataValidade: new Date().toLocaleDateString('pt-BR'),
      responsavelNome: 'Sistema',
      unidadeNome: 'Teste de Impressora',
      unidadeCNPJ: '00.000.000/0000-00',
      unidadeCidade: 'Teste',
    };
    
    // Tentar imprimir
    const result = await printViaWebSerial(testData, false);
    
    if (result) {
      updateStatus('✅ Teste concluído! Verifique a impressora.');
      return { success: true };
    } else {
      return { success: false, error: 'Falha ao enviar dados de teste' };
    }
  } catch (error: any) {
    updateStatus(`Erro: ${error.message}`);
    return { 
      success: false, 
      error: error.message || 'Erro ao testar impressora'
    };
  }
}
