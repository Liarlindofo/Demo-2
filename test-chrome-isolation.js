/**
 * Script de teste para verificar isolamento de Chrome/Puppeteer
 * 
 * Execute na VPS:
 * node test-chrome-isolation.js
 * 
 * Este script tenta criar 2 instâncias do Chrome simultaneamente
 * para verificar se o erro "browser already running" ocorre.
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = '/var/www/whatsapp-sessions/test-chrome';

async function testChromeInstance(id) {
  const userDataDir = path.join(baseDir, `chrome_test_${id}_${Date.now()}`);
  
  console.log(`\n=== TESTE ${id} ===`);
  console.log(`userDataDir: ${userDataDir}`);
  
  // Criar diretório
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  
  // Tentar encontrar Chrome
  const chromePaths = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium"
  ];
  
  let executablePath;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      console.log(`✅ Chrome encontrado: ${p}`);
      break;
    }
  }
  
  if (!executablePath) {
    console.log(`⚠️  Chrome não encontrado, usando padrão do Puppeteer`);
  }
  
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
  ];
  
  console.log(`🚀 Iniciando Chrome ${id}...`);
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      userDataDir,
      args,
      pipe: true,
      dumpio: false,
    });
    
    console.log(`✅ Chrome ${id} iniciado com sucesso!`);
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`✅ Chrome ${id} navegou para Google com sucesso!`);
    
    return { browser, userDataDir, success: true };
    
  } catch (error) {
    console.error(`❌ ERRO no Chrome ${id}:`, error.message);
    return { browser: null, userDataDir, success: false, error };
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   TESTE DE ISOLAMENTO DO CHROME/PUPPETEER        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  // Limpar diretório de teste
  if (fs.existsSync(baseDir)) {
    console.log(`🗑️  Limpando diretório de teste: ${baseDir}`);
    fs.rmSync(baseDir, { recursive: true, force: true });
  }
  fs.mkdirSync(baseDir, { recursive: true });
  
  console.log(`\n📁 Diretório base: ${baseDir}\n`);
  
  // Teste 1: Criar primeira instância
  console.log('═══════════════════════════════════════════════════');
  console.log('PASSO 1: Criar primeira instância do Chrome');
  console.log('═══════════════════════════════════════════════════');
  
  const instance1 = await testChromeInstance(1);
  
  if (!instance1.success) {
    console.error('\n❌ Primeira instância falhou! Abortando teste.');
    process.exit(1);
  }
  
  // Aguardar um pouco
  console.log('\n⏱️  Aguardando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Teste 2: Criar segunda instância (COM a primeira ainda rodando)
  console.log('\n═══════════════════════════════════════════════════');
  console.log('PASSO 2: Criar segunda instância (primeira ainda rodando)');
  console.log('═══════════════════════════════════════════════════');
  
  const instance2 = await testChromeInstance(2);
  
  // Avaliar resultado
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║                  RESULTADO FINAL                  ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  if (instance1.success && instance2.success) {
    console.log('✅ SUCESSO! Ambas as instâncias rodando simultaneamente.');
    console.log('✅ O Chrome SUPORTA múltiplas instâncias isoladas.');
    console.log('✅ O problema NÃO é do Chrome/Puppeteer.');
    console.log('⚠️  O problema pode estar no WPPConnect ou em alguma configuração específica.\n');
  } else if (instance1.success && !instance2.success) {
    console.log('❌ FALHA! Segunda instância não conseguiu iniciar.');
    console.log('❌ Erro:', instance2.error?.message);
    
    if (instance2.error?.message?.includes('already running')) {
      console.log('❌ Erro confirmado: "browser already running"');
      console.log('❌ O Chrome/Chromium instalado TEM O BUG DE SINGLETON.');
      console.log('\n💡 SOLUÇÃO: Instalar Google Chrome "normal" (não Snap/Flatpak)');
      console.log('   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb');
      console.log('   sudo apt install ./google-chrome-stable_current_amd64.deb');
    }
  }
  
  // Limpar
  console.log('\n🧹 Limpando...');
  if (instance1.browser) {
    await instance1.browser.close();
    console.log('✅ Chrome 1 fechado');
  }
  if (instance2.browser) {
    await instance2.browser.close();
    console.log('✅ Chrome 2 fechado');
  }
  
  // Aguardar um pouco antes de deletar
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Deletar diretórios de teste
  try {
    fs.rmSync(baseDir, { recursive: true, force: true });
    console.log('✅ Diretórios de teste deletados');
  } catch (err) {
    console.warn('⚠️  Erro ao deletar diretórios:', err.message);
  }
  
  console.log('\n✅ Teste concluído!\n');
  process.exit(instance1.success && instance2.success ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
  process.exit(1);
});

