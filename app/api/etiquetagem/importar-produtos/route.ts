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
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
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

      produtosParaImportar.push({
        nome: nomeProduto.toString().trim(),
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
    for (const produto of produtosParaImportar) {
      try {
        produto.status = 'processando';

        const classificacao = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/etiquetagem/classificar-produto`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({ nomeProduto: produto.nome })
          }
        );

        if (classificacao.ok) {
          const resultado = await classificacao.json();
          produto.categoriaSugerida = resultado.categoria;
          produto.peso = resultado.peso;
          produto.unidade = resultado.unidade;
          produto.armazenamento = resultado.armazenamento;

          // Tentar encontrar categoria correspondente
          const categoriaEncontrada = categorias.find(
            c => c.nome.toLowerCase().includes(resultado.categoria.toLowerCase()) ||
                 resultado.categoria.toLowerCase().includes(c.nome.toLowerCase())
          );

          if (categoriaEncontrada) {
            produto.categoriaId = categoriaEncontrada.id;
          }

          produto.status = 'sucesso';
        } else {
          produto.status = 'erro';
          produto.erro = 'Erro ao classificar';
        }
      } catch (error) {
        console.error(`Erro ao processar ${produto.nome}:`, error);
        produto.status = 'erro';
        produto.erro = 'Erro ao processar';
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
