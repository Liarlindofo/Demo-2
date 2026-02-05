// Script de teste para verificar se a classificação está funcionando
// Execute: node scripts/test-classificacao.js

const produtos = [
  'Queijo Mussarela',
  'Presunto',
  'Cheddar',
  'Cream Cheese',
  'Leite Condensado',
  'Margarina',
  'Frango Desossado',
  'Tilápia',
  'Alface',
  'Tomate'
];

async function testarClassificacao() {
  console.log('🧪 Testando Classificação com IA...\n');

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
        const resultado = await response.json();
        console.log(`✅ ${produto}`);
        console.log(`   → Categoria: ${resultado.categoria}`);
        console.log(`   → Peso: ${resultado.peso} ${resultado.unidade}`);
        console.log(`   → Armazenamento: ${resultado.armazenamento}\n`);
      } else {
        console.log(`❌ ${produto} - Erro na classificação\n`);
      }
    } catch (error) {
      console.log(`❌ ${produto} - Erro: ${error.message}\n`);
    }

    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ Teste concluído!');
}

testarClassificacao();
