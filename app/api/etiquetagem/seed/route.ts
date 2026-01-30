import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/etiquetagem/seed - Popular categorias e processos iniciais
export async function POST() {
  try {
    // Verificar se já existem categorias
    const categoriasExistentes = await prisma.etiquetagemCategoria.count();
    if (categoriasExistentes > 0) {
      return NextResponse.json(
        { message: 'Categorias já foram populadas', count: categoriasExistentes },
        { status: 200 }
      );
    }

    // Criar categorias
    const categorias = [
      { nome: 'Carnes e Aves', temperaturaArmazenamento: 'Refrigerado até 4°C', validadeDescongelado: 3, validadeResfriado: 3, validadePreparado: 3, validadePorcionado: 3, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
      { nome: 'Pescados', temperaturaArmazenamento: 'Refrigerado até 2°C', validadeDescongelado: 2, validadeResfriado: 2, validadePreparado: 2, validadePorcionado: 2, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
      { nome: 'Laticínios', temperaturaArmazenamento: 'Refrigerado até 4°C', validadeDescongelado: null, validadeResfriado: 3, validadePreparado: 3, validadePorcionado: 3, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
      { nome: 'Massas', temperaturaArmazenamento: 'Refrigerado até 4°C', validadeDescongelado: null, validadeResfriado: 3, validadePreparado: 3, validadePorcionado: 3, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
      { nome: 'Vegetais e Legumes', temperaturaArmazenamento: 'Refrigerado até 4°C', validadeDescongelado: null, validadeResfriado: 7, validadePreparado: 7, validadePorcionado: 7, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
      { nome: 'Temperos e Condimentos', temperaturaArmazenamento: 'Refrigerado até 4°C', validadeDescongelado: null, validadeResfriado: 4, validadePreparado: 4, validadePorcionado: 4, validadeCongeladoMedio: null, validadeCongeladoProfundo: null },
      { nome: 'Molhos', temperaturaArmazenamento: 'Refrigerado até 4°C', validadeDescongelado: null, validadeResfriado: 3, validadePreparado: 3, validadePorcionado: 3, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
      { nome: 'Sobremesas', temperaturaArmazenamento: 'Refrigerado até 4°C', validadeDescongelado: null, validadeResfriado: 3, validadePreparado: 3, validadePorcionado: 3, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
      { nome: 'Outros', temperaturaArmazenamento: 'Temperatura Ambiente', validadeDescongelado: null, validadeResfriado: 30, validadePreparado: 30, validadePorcionado: 30, validadeCongeladoMedio: 30, validadeCongeladoProfundo: 90 },
    ];

    let categoriasCriadas = 0;
    for (const cat of categorias) {
      await prisma.etiquetagemCategoria.create({
        data: {
          nome: cat.nome,
          temperaturaArmazenamento: cat.temperaturaArmazenamento,
          validadeDescongelado: cat.validadeDescongelado,
          validadeResfriado: cat.validadeResfriado,
          validadePreparado: cat.validadePreparado,
          validadePorcionado: cat.validadePorcionado,
          validadeCongeladoMedio: cat.validadeCongeladoMedio,
          validadeCongeladoProfundo: cat.validadeCongeladoProfundo,
          isAtivo: 1,
        },
      });
      categoriasCriadas++;
    }

    // Verificar se já existem processos
    const processosExistentes = await prisma.etiquetagemProcesso.count();
    if (processosExistentes === 0) {
      // Criar processo padrão
      await prisma.etiquetagemProcesso.create({
        data: {
          nome: 'Manipulação',
          isRequerRefrigeracao: 1,
          isAtivo: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${categoriasCriadas} categorias criadas com sucesso`,
      categorias: categoriasCriadas,
    });
  } catch (error) {
    console.error('Erro ao popular dados:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao popular dados', details: errorMessage },
      { status: 500 }
    );
  }
}
