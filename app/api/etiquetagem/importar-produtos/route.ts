import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ProdutoImportado {
  nome: string;
  categoriaSugerida?: string;
  categoriaId?: string;
  peso?: number;
  unidade?: string;
  armazenamento?: string;
  status: 'pendente' | 'processando' | 'sucesso' | 'erro';
  erro?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar permissão de ferramenta (PRODUTOS ou ETIQUETAGEM)
    const { checkToolPermission } = await import('@/lib/auth/toolPermissions');
    const { SystemTool } = await import('@/types/admin');
    
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar se tem permissão para PRODUTOS ou ETIQUETAGEM
    const hasProdutosPermission = await checkToolPermission(stackUser.id, SystemTool.PRODUTOS);
    const hasEtiquetagemPermission = await checkToolPermission(stackUser.id, SystemTool.ETIQUETAGEM);
    
    if (!hasProdutosPermission && !hasEtiquetagemPermission) {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          message: 'Você não tem permissão para importar produtos. Entre em contato com o administrador.',
        },
        { status: 403 }
      );
    }

    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    // Ler arquivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: 'Planilha vazia' }, { status: 400 });
    }

    // Buscar categorias existentes
    const categorias = await prisma.etiquetagemCategoria.findMany({
      where: { isAtivo: 1 }
    });

    console.log(`📋 Categorias disponíveis no banco (${categorias.length}):`, 
      categorias.map(c => `"${c.nome}" (ID: ${c.id})`).join(', '));

    if (categorias.length === 0) {
      console.error('⚠️ AVISO: Nenhuma categoria encontrada no banco!');
      console.log('💡 Execute: POST /api/etiquetagem/seed para popular categorias');
    }

    const produtosParaImportar: ProdutoImportado[] = [];

    // Processar cada linha
    for (const row of data) {
      // Tentar encontrar coluna de nome (aceita variações)
      const nomeProduto = 
        row['Nome'] || 
        row['nome'] || 
        row['Produto'] || 
        row['produto'] ||
        row['Nome do Produto'] ||
        row['nome do produto'] ||
        Object.values(row)[0]; // Primeira coluna se não encontrar

      if (!nomeProduto || typeof nomeProduto !== 'string') {
        continue;
      }

      const nomeProcessado = nomeProduto.toString().trim();

      // Filtrar linhas inválidas, vazias ou cabeçalhos
      if (
        !nomeProcessado ||
        nomeProcessado.length < 2 ||
        nomeProcessado.toLowerCase().includes('tabela') ||
        nomeProcessado.toLowerCase().includes('validade') ||
        nomeProcessado.toLowerCase().includes('produto') ||
        nomeProcessado === '-' ||
        nomeProcessado === 'n/a' ||
        /^[\s\-_]+$/.test(nomeProcessado) // Apenas espaços, hífens ou underscores
      ) {
        continue;
      }

      produtosParaImportar.push({
        nome: nomeProcessado,
        status: 'pendente'
      });
    }

    if (produtosParaImportar.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum produto válido encontrado na planilha' },
        { status: 400 }
      );
    }

    // Classificar produtos com IA
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENROUTER_API_KEY não configurada!');
      return NextResponse.json(
        { error: 'API Key não configurada. Configure OPENROUTER_API_KEY no .env' },
        { status: 500 }
      );
    }

    console.log('🔑 API Key encontrada:', apiKey.substring(0, 20) + '...');
    console.log(`📦 Processando ${produtosParaImportar.length} produtos...`);

    for (const produto of produtosParaImportar) {
      try {
        produto.status = 'processando';
        console.log(`\n🔄 Processando: ${produto.nome}`);

        // Classificar categoria diretamente
        const categoriaResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Platefull - Etiquetagem',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em classificação de alimentos. Classifique o produto em UMA destas categorias EXATAS:
- Carnes e Aves
- Peixes e Frutos do Mar
- Laticínios
- Vegetais
- Frutas
- Grãos e Cereais
- Massas
- Congelados
- Processados
- Bebidas
- Temperos e Condimentos
- Panificação

Regras importantes:
1. Queijos, leites, iogurtes → "Laticínios"
2. Carnes, frango → "Carnes e Aves"
3. Peixes → "Peixes e Frutos do Mar"
4. Verduras, legumes → "Vegetais"

Responda APENAS com o nome EXATO da categoria. Nada mais.`
              },
              {
                role: 'user',
                content: `Classifique: ${produto.nome}`
              }
            ],
            temperature: 0.1,
            max_tokens: 30,
          }),
        });

        if (!categoriaResponse.ok) {
          const errorText = await categoriaResponse.text();
          console.error(`❌ Erro API OpenRouter:`, categoriaResponse.status, errorText);
          produto.status = 'erro';
          produto.erro = `Erro API: ${categoriaResponse.status}`;
          continue;
        }

        const categoriaData = await categoriaResponse.json();
        const categoriaSugerida = categoriaData.choices[0]?.message?.content?.trim() || '';
        console.log(`📂 Categoria sugerida: "${categoriaSugerida}"`);

        produto.categoriaSugerida = categoriaSugerida;

        // Sugerir peso e outros dados
        const detalhesResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Platefull - Etiquetagem',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Analise o produto e sugira peso padrão, unidade e armazenamento.
Responda APENAS em formato JSON válido:
{"peso": 1.0, "unidade": "kg", "armazenamento": "CONGELADO"}

Unidades válidas: kg, g, L, ml, un
Armazenamento válido: RESFRIADO, CONGELADO, TEMPERATURA AMBIENTE`
              },
              {
                role: 'user',
                content: `Produto: ${produto.nome}`
              }
            ],
            temperature: 0.3,
            max_tokens: 100,
          }),
        });

        if (detalhesResponse.ok) {
          const detalhesData = await detalhesResponse.json();
          const detalhesTexto = detalhesData.choices[0]?.message?.content?.trim() || '{}';
          
          try {
            const jsonMatch = detalhesTexto.match(/\{[^}]+\}/);
            if (jsonMatch) {
              const detalhes = JSON.parse(jsonMatch[0]);
              // Validar e normalizar peso
              const pesoValido = parseFloat(detalhes.peso);
              produto.peso = (!isNaN(pesoValido) && pesoValido > 0) ? pesoValido : 1.0;
              
              // Validar e normalizar unidade
              const unidadesValidas = ['kg', 'g', 'L', 'ml', 'un'];
              const unidadeLower = (detalhes.unidade || 'kg').toString().toLowerCase().trim();
              produto.unidade = unidadesValidas.includes(unidadeLower) ? unidadeLower : 'kg';
              
              // Validar armazenamento
              const armazenamentosValidos = ['RESFRIADO', 'CONGELADO', 'TEMPERATURA AMBIENTE'];
              const armazenamentoUpper = (detalhes.armazenamento || '').toString().toUpperCase().trim();
              produto.armazenamento = armazenamentosValidos.includes(armazenamentoUpper) ? armazenamentoUpper : '';
            } else {
              // Se não conseguir parsear, usar valores padrão
              produto.peso = 1.0;
              produto.unidade = 'kg';
            }
          } catch (e) {
            console.error('⚠️ Erro ao parsear detalhes:', e);
            produto.peso = 1.0;
            produto.unidade = 'kg';
            produto.armazenamento = '';
          }
        } else {
          // Se a API de detalhes falhar, usar valores padrão
          produto.peso = 1.0;
          produto.unidade = 'kg';
          produto.armazenamento = '';
        }

        // Garantir que peso e unidade estão definidos
        if (!produto.peso || produto.peso <= 0) {
          produto.peso = 1.0;
        }
        if (!produto.unidade) {
          produto.unidade = 'kg';
        }

        // Tentar encontrar categoria correspondente (busca mais flexível)
        const categoriaLower = categoriaSugerida.toLowerCase().trim();
        const categoriaEncontrada = categorias.find(c => {
          const catNomeLower = c.nome.toLowerCase().trim();
          
          // Correspondência exata
          if (catNomeLower === categoriaLower) return true;
          
          // Correspondência parcial (um contém o outro)
          if (catNomeLower.includes(categoriaLower) || categoriaLower.includes(catNomeLower)) return true;
          
          // Mapeamentos específicos
          if (categoriaLower.includes('latic') && catNomeLower.includes('latic')) return true;
          if (categoriaLower.includes('carne') && catNomeLower.includes('carne')) return true;
          if (categoriaLower.includes('ave') && catNomeLower.includes('ave')) return true;
          if (categoriaLower.includes('peixe') && catNomeLower.includes('peixe')) return true;
          if (categoriaLower.includes('vegeta') && catNomeLower.includes('vegeta')) return true;
          if (categoriaLower.includes('fruta') && catNomeLower.includes('fruta')) return true;
          
          return false;
        });

        if (categoriaEncontrada) {
          produto.categoriaId = categoriaEncontrada.id;
          console.log(`✅ Categoria encontrada: ${categoriaEncontrada.nome} (ID: ${categoriaEncontrada.id})`);
        } else {
          console.log(`⚠️ Categoria NÃO encontrada para: "${categoriaSugerida}"`);
          console.log(`📋 Categorias disponíveis:`, categorias.map(c => c.nome));
        }

        // Validar dados finais antes de marcar como sucesso
        if (!produto.nome || produto.nome.trim().length < 2) {
          throw new Error('Nome do produto inválido');
        }

        produto.status = 'sucesso';
        console.log(`✅ ${produto.nome} processado com sucesso!`);

      } catch (error) {
        console.error(`❌ Erro ao processar ${produto.nome}:`, error);
        produto.status = 'erro';
        produto.erro = error instanceof Error ? error.message : 'Erro ao processar';
      }
    }

    return NextResponse.json({
      produtos: produtosParaImportar,
      total: produtosParaImportar.length,
      sucesso: produtosParaImportar.filter(p => p.status === 'sucesso').length,
      erro: produtosParaImportar.filter(p => p.status === 'erro').length
    });

  } catch (error) {
    console.error('Erro ao importar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao importar produtos' },
      { status: 500 }
    );
  }
}
