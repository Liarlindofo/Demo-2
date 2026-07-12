import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const templates = await prisma.tarefaTemplate.findMany({
      where: { userId: rh.userId },
      include: {
        loja: { select: { id: true, nome: true } },
        cargo: { select: { id: true, nome: true } },
      },
      orderBy: [{ ativo: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(templates);
  } catch (err) {
    console.error('[GET /api/tarefas/templates]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      titulo,
      descricao,
      exigeFoto,
      exigeConfirmacaoTexto,
      exigeLocalizacao,
      exigeArquivo,
      validacaoIA,
      lojaId,
      cargoId,
    } = body;

    if (!titulo?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 });
    }
    if (!descricao?.trim()) {
      return NextResponse.json({ error: 'Descrição é obrigatória.' }, { status: 400 });
    }
    if (!exigeFoto && !exigeConfirmacaoTexto && !exigeLocalizacao && !exigeArquivo) {
      return NextResponse.json(
        { error: 'Pelo menos um tipo de evidência deve ser selecionado.' },
        { status: 400 },
      );
    }

    const template = await prisma.tarefaTemplate.create({
      data: {
        userId: rh.userId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        exigeFoto: !!exigeFoto,
        exigeConfirmacaoTexto: !!exigeConfirmacaoTexto,
        exigeLocalizacao: !!exigeLocalizacao,
        exigeArquivo: !!exigeArquivo,
        validacaoIA: validacaoIA ?? null,
        lojaId: lojaId || null,
        cargoId: cargoId || null,
        criadoPor: rh.userId,
      },
      include: {
        loja: { select: { id: true, nome: true } },
        cargo: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tarefas/templates]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
