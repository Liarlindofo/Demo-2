/**
 * Script de teste para verificar se a API key da OpenRouter está funcionando
 * 
 * Uso: node test-openrouter-key.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Carregar .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPaths = [
  resolve(__dirname, '.env'),
  resolve(process.cwd(), '.env'),
  '/var/www/I/.env',
  '/var/www/Demo-2/.env',
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ Arquivo .env carregado de: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded) {
  dotenv.config();
}

// Obter API key
const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔍 TESTE DA API KEY OPENROUTER');
console.log('═══════════════════════════════════════════════════════════\n');

if (!apiKey) {
  console.error('❌ ERRO: OPENROUTER_API_KEY não encontrada!');
  console.error('Verifique se o arquivo .env existe e contém OPENROUTER_API_KEY');
  process.exit(1);
}

const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
console.log(`📌 API Key encontrada: ${maskedKey}`);
console.log(`📌 Tamanho: ${apiKey.length} caracteres\n`);

// Teste 1: Listar modelos disponíveis
console.log('🧪 Teste 1: Listando modelos disponíveis...');
try {
  const response = await axios.get('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  console.log('✅ SUCESSO! API Key está válida\n');
  console.log(`📊 Total de modelos disponíveis: ${response.data.data?.length || 0}`);
  
  // Verificar se o modelo gpt-4o-mini está disponível
  const models = response.data.data || [];
  const gpt4oMini = models.find(m => m.id === 'openai/gpt-4o-mini');
  
  if (gpt4oMini) {
    console.log(`✅ Modelo 'openai/gpt-4o-mini' está disponível`);
  } else {
    console.log(`⚠️  Modelo 'openai/gpt-4o-mini' não encontrado na lista`);
    console.log(`   Modelos disponíveis (primeiros 5):`);
    models.slice(0, 5).forEach(m => console.log(`   - ${m.id}`));
  }
  
} catch (error) {
  console.error('❌ ERRO ao testar API Key!\n');
  
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Mensagem: ${JSON.stringify(error.response.data, null, 2)}`);
    
    if (error.response.status === 401) {
      console.error('\n🔴 A API Key está INVÁLIDA ou EXPIRADA!');
      console.error('   Verifique: https://openrouter.ai/keys');
    }
  } else if (error.request) {
    console.error('Erro de rede - não foi possível conectar ao OpenRouter');
  } else {
    console.error(`Erro: ${error.message}`);
  }
  
  process.exit(1);
}

// Teste 2: Enviar uma mensagem de teste
console.log('\n🧪 Teste 2: Enviando mensagem de teste...');
try {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Responda apenas: OK' }
      ],
      max_tokens: 10
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://platefull.com.br',
        'X-Title': 'Platefull WhatsApp Bot'
      },
      timeout: 30000
    }
  );

  const reply = response.data.choices[0]?.message?.content;
  console.log(`✅ SUCESSO! Resposta recebida: "${reply}"\n`);
  
} catch (error) {
  console.error('❌ ERRO ao enviar mensagem de teste!\n');
  
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Mensagem: ${JSON.stringify(error.response.data, null, 2)}`);
  } else {
    console.error(`Erro: ${error.message}`);
  }
  
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ TODOS OS TESTES PASSARAM!');
console.log('✅ A API Key está funcionando corretamente');
console.log('═══════════════════════════════════════════════════════════\n');

