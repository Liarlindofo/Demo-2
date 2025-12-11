/**
 * Script de diagnóstico para identificar qual arquivo está causando o erro
 * Execute: node test-imports.js
 */

const filesToTest = [
  './config.js',
  './src/utils/logger.js',
  './src/db/index.js',
  './src/db/models.js',
  './src/server/router.js',
  './src/server/api.js',
  './src/wpp/sessionManager.js',
  './src/wpp/qrHandler.js',
  './src/wpp/index.js',
  './src/ai/chat.js',
  './index.js'
];

async function testImport(filePath) {
  try {
    console.log(`\n🔍 Testando: ${filePath}`);
    await import(filePath);
    console.log(`✅ ${filePath} - OK`);
    return true;
  } catch (error) {
    console.error(`❌ ${filePath} - ERRO:`);
    console.error(`   ${error.message}`);
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5);
      stackLines.forEach(line => console.error(`   ${line}`));
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de importação...\n');
  
  for (const file of filesToTest) {
    const success = await testImport(file);
    if (!success) {
      console.error(`\n💥 ERRO ENCONTRADO EM: ${file}`);
      process.exit(1);
    }
  }
  
  console.log('\n✅ Todos os arquivos foram importados com sucesso!');
}

runTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});


