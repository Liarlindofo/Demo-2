import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// Validação de nome completo
function validarNomeCompleto(nome: string): { valido: boolean; erro?: string; nomeFormatado?: string } {
  const nomeTrimmed = nome.trim();
  
  if (!nomeTrimmed) {
    return { valido: false, erro: "Nome não pode estar vazio" };
  }
  
  const palavras = nomeTrimmed.split(/\s+/).filter(p => p.length > 0);
  
  if (palavras.length < 2) {
    return { valido: false, erro: "Nome deve ter pelo menos nome e sobrenome (2 palavras)" };
  }
  
  const nomeFormatado = palavras
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
    .join(" ");
  
  return { valido: true, nomeFormatado };
}

// Gerar código de etiqueta
async function gerarCodigoEtiqueta(unidadeCodigo: string, userId: string): Promise<string> {
  const result = await prisma.etiquetagemEtiqueta.findFirst({
    where: {
      codigoEtiqueta: {
        startsWith: `#${unidadeCodigo}`,
      },
      userId: userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  let numeroSequencial = 1;
  
  if (result) {
    const codigoAtual = result.codigoEtiqueta;
    const numeroAtual = parseInt(codigoAtual.substring(4), 10);
    if (!isNaN(numeroAtual)) {
      numeroSequencial = numeroAtual + 1;
    }
  }
  
  return `#${unidadeCodigo}${numeroSequencial.toString().padStart(5, "0")}`;
}

// POST /api/etiquetagem/etiquetas - Gerar nova etiqueta
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão de ferramenta
    const { requireToolPermission } = await import('@/lib/auth/toolPermissions');
    const { SystemTool } = await import('@/types/admin');
    
    const permissionCheck = await requireToolPermission(SystemTool.ETIQUETAGEM);
    if (permissionCheck) {
      return permissionCheck; // Retorna erro 403 se não tiver permissão
    }

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

    const body = await request.json();
    const {
      produtoId,
      unidadeId,
      dataValidadeOriginal,
      pesoQuantidade,
      unidadeMedida,
      tipoArmazenamento,
      periodoDias,
      responsavelNome,
      marcaFornecedor,
      copias = 1,
    } = body;

    // Validações
    if (!produtoId || !unidadeId || !pesoQuantidade || !unidadeMedida || !tipoArmazenamento || !periodoDias || !responsavelNome) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Validar nome
    const validacao = validarNomeCompleto(responsavelNome);
    if (!validacao.valido) {
      return NextResponse.json({ error: validacao.erro }, { status: 400 });
    }

    const nomeFormatado = validacao.nomeFormatado!;

    // Buscar produto e unidade
    const produto = await prisma.etiquetagemProduto.findFirst({
      where: {
        id: produtoId,
        userId: dbUser.id,
      },
      include: {
        categoria: true,
      },
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const unidade = await prisma.etiquetagemUnidade.findFirst({
      where: {
        id: unidadeId,
        userId: dbUser.id,
      },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    // Buscar processo (usar o primeiro ativo como padrão)
    const processo = await prisma.etiquetagemProcesso.findFirst({
      where: { isAtivo: 1 },
    });

    if (!processo) {
      return NextResponse.json({ error: 'Nenhum processo encontrado' }, { status: 404 });
    }

    // Data/hora manipulação (agora)
    const dataManipulacao = new Date();
    
    // Calcular validade
    const dataValidade = new Date(dataManipulacao);
    dataValidade.setDate(dataValidade.getDate() + periodoDias);

    // Gerar código único
    const codigoEtiqueta = await gerarCodigoEtiqueta(unidade.codigoInterno, dbUser.id);

    // Buscar ou criar nome responsável
    let responsavelId = null;
    const nomeExistente = await prisma.etiquetagemNomeResponsavel.findFirst({
      where: {
        nomeCompleto: nomeFormatado,
        unidadeId: unidadeId,
      },
    });

    if (nomeExistente) {
      // Atualizar uso
      await prisma.etiquetagemNomeResponsavel.update({
        where: { id: nomeExistente.id },
        data: {
          ultimaUtilizacao: new Date(),
          totalUsos: { increment: 1 },
          isAtivo: 1,
        },
      });
      responsavelId = nomeExistente.id;
    } else {
      // Criar novo
      const resultNome = await prisma.etiquetagemNomeResponsavel.create({
        data: {
          userId: dbUser.id,
          unidadeId: unidadeId,
          nomeCompleto: nomeFormatado,
          primeiraUtilizacao: new Date(),
          ultimaUtilizacao: new Date(),
          totalUsos: 1,
          isAtivo: 1,
        },
      });
      responsavelId = resultNome.id;

      // Verificar limite de 20 nomes
      const countResult = await prisma.etiquetagemNomeResponsavel.count({
        where: {
          unidadeId: unidadeId,
          isAtivo: 1,
        },
      });

      if (countResult > 20) {
        // Inativar o mais antigo
        const maisAntigo = await prisma.etiquetagemNomeResponsavel.findFirst({
          where: {
            unidadeId: unidadeId,
            isAtivo: 1,
          },
          orderBy: {
            ultimaUtilizacao: 'asc',
          },
        });

        if (maisAntigo) {
          await prisma.etiquetagemNomeResponsavel.update({
            where: { id: maisAntigo.id },
            data: { isAtivo: 0 },
          });
        }
      }
    }

    // Criar etiqueta
    const etiqueta = await prisma.etiquetagemEtiqueta.create({
      data: {
        userId: dbUser.id,
        produtoId: produtoId,
        unidadeId: unidadeId,
        processoId: processo.id,
        dataValidadeOriginal: dataValidadeOriginal ? new Date(dataValidadeOriginal) : null,
        dataHoraManipulacao: dataManipulacao,
        dataHoraValidade: dataValidade,
        pesoQuantidade: parseFloat(pesoQuantidade),
        unidadeMedida: unidadeMedida,
        responsavelNome: nomeFormatado,
        responsavelId: responsavelId,
        temperaturaArmazenamento: tipoArmazenamento,
        codigoEtiqueta: codigoEtiqueta,
        marcaFornecedor: marcaFornecedor || null,
        periodoDias: periodoDias,
      },
      include: {
        produto: {
          include: {
            categoria: true,
          },
        },
        unidade: true,
        processo: true,
      },
    });

    return NextResponse.json({
      id: etiqueta.id,
      codigo_etiqueta: codigoEtiqueta,
      copias: copias,
      etiqueta: etiqueta,
      success: true,
    });
  } catch (error) {
    console.error('Erro ao gerar etiqueta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/etiquetagem/etiquetas - Listar histórico de etiquetas
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidade_id');
    const limite = parseInt(searchParams.get('limite') || '50');

    const where: any = {
      userId: dbUser.id,
    };

    if (unidadeId) {
      where.unidadeId = unidadeId;
    }

    const etiquetas = await prisma.etiquetagemEtiqueta.findMany({
      where,
      include: {
        produto: {
          include: {
            categoria: true,
          },
        },
        unidade: true,
        processo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limite,
    });

    return NextResponse.json(etiquetas);
  } catch (error) {
    console.error('Erro ao buscar etiquetas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/etiquetagem/etiquetas - Limpar histórico
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidade_id');

    if (!unidadeId) {
      return NextResponse.json(
        { error: 'unidade_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a unidade pertence ao usuário
    const unidade = await prisma.etiquetagemUnidade.findFirst({
      where: {
        id: unidadeId,
        userId: dbUser.id,
      },
    });

    if (!unidade) {
      return NextResponse.json(
        { error: 'Unidade não encontrada' },
        { status: 404 }
      );
    }

    await prisma.etiquetagemEtiqueta.deleteMany({
      where: {
        userId: dbUser.id,
        unidadeId: unidadeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
