// Script de teste para classificação de produtos
// Para testar: node scripts/test-classificacao.js

const produtos = [
  'Queijo Mussarela',
  'Presunto',
  'Frango Congelado',
  'Tomate',
  'Leite',
  'Cheddar',
  'Cream Cheese',
  'Salmão',
  'Picanha',
  'Alface'
];

async function testarClassificacao() {
  console.log('🧪 Iniciando teste de classificação...\n');

  for (const produto of produtos) {
    try {
      const response = await fetch('http://localhost:3000/api/etiquetagem/classificar-produto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomeProduto: produto })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${produto.padEnd(20)} → ${data.categoria} (${data.peso}${data.unidade})`);
      } else {
        const error = await response.text();
        console.log(`❌ ${produto.padEnd(20)} → ERRO: ${response.status}`);
        if (error.includes('API Key não configurada')) {
          console.log('\n⚠️  ERRO: OpenRouter API Key não está configurada!');
          console.log('📋 Veja o arquivo CONFIGURAR-OPENROUTER.md para instruções\n');
          break;
        }
      }
    } catch (error) {
      console.log(`❌ ${produto.padEnd(20)} → ERRO: ${error.message}`);
    }
  }
}

testarClassificacao();
