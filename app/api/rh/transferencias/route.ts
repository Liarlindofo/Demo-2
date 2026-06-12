import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json() as {
      funcionarioId: string;
      lojaDestinoId: string;
      dataTransferencia: string;
      motivo?: string;
      aprovadoPor?: string;
    };

    const { funcionarioId, lojaDestinoId, dataTransferencia, motivo, aprovadoPor } = body;

    if (!funcionarioId || !lojaDestinoId || !dataTransferencia)
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });

    const func = await prisma.rhFuncionario.findFirst({
      where: { id: funcionarioId, userId: rh!.userId },
      include: { loja: true },
    });
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    if (func.lojaId === lojaDestinoId)
      return NextResponse.json({ error: 'O funcionário já está nesta loja' }, { status: 400 });

    const lojaDestino = await prisma.rhLoja.findFirst({
      where: { id: lojaDestinoId, userId: rh!.userId },
    });
    if (!lojaDestino) return NextResponse.json({ error: 'Loja de destino não encontrada' }, { status: 404 });

    const result = await prisma.$transaction([
      prisma.rhFuncionario.update({
        where: { id: funcionarioId },
        data: { lojaId: lojaDestinoId },
      }),
      prisma.rhTransferenciaLoja.create({
        data: {
          funcionarioId,
          lojaOrigemId: func.lojaId,
          lojaDestinoId,
          userId: rh!.userId,
          dataTransferencia: new Date(dataTransferencia),
          motivo: motivo ?? null,
          aprovadoPor: aprovadoPor ?? null,
        },
      }),
      prisma.rhHistoricoFuncionario.create({
        data: {
          funcionarioId,
          userId: rh!.userId,
          campo: 'loja',
          valorAnterior: func.loja?.nome ?? '—',
          valorNovo: lojaDestino.nome,
          alteradoPor: aprovadoPor ?? 'Sistema',
          motivo: motivo ?? null,
        },
      }),
    ]);

    revalidatePath('/rh/funcionarios');
    revalidatePath(`/rh/funcionarios/${funcionarioId}`);

    return NextResponse.json({
      transferencia: result[1],
      mensagem: `${func.nome} transferido para ${lojaDestino.nome}`,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/transferencias]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
