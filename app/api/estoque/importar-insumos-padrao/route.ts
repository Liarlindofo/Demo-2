export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getEffectiveDbUser } from '@/lib/effective-user';
import { prisma } from '@/lib/prisma';

// Lista completa de insumos padrão para importar
// Extraída do mockInsumos.ts com tipo de armazenamento inferido
const INSUMOS_PADRAO = [
  // ── Congelados ──────────────────────────────────────────────────────────────
  { nome: 'BACON (CRU)', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'BATATA SORRISO', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'CAMARÃO', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'CARNE EM ISCA (STROGONOFF)', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'CARNE MOÍDA (BOLONHESA)', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'COSTELA', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'ERVILHA', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'FILÉ DE PEITO SEM OSSO', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'LINGUIÇA CALABRESA', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'LOMBO', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'MILHO', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'PEPPERONI', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'PRESUNTO', unidade: 'kg', tipo: 'CONGELADO' },
  { nome: 'SALAME ITALIANO', unidade: 'kg', tipo: 'CONGELADO' },

  // ── Resfriados ──────────────────────────────────────────────────────────────
  { nome: 'CREME DE LEITE', unidade: 'un', tipo: 'RESFRIADO' },
  { nome: 'CREME CULINÁRIO', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'MARGARINA', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'OVOS', unidade: 'un', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO CATUPIRY', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO CHEDDAR', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO CREAM CHEESE', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO GORGONZOLA', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO MUSSARELA', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO PARMESÃO', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO PROVOLONE', unidade: 'kg', tipo: 'RESFRIADO' },
  { nome: 'QUEIJO RICOTA', unidade: 'kg', tipo: 'RESFRIADO' },

  // ── Temperatura Ambiente ────────────────────────────────────────────────────
  { nome: 'ABACAXI', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'AÇÚCAR', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'ALHO CROCANTE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'ALHO MOÍDO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'AMACIANTE DE CARNE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'AMEIXA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'AMENDOIM GRANULADO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'ANÉIS DE CEBOLA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'ATUM LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'AZEITE DE OLIVA', unidade: 'L', tipo: 'AMBIENTE' },
  { nome: 'AZEITONA PRETA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'AZEITONA VERDE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'BANANA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'BARBECUE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'BATATA PALHA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'BERINJELA (CRUA)', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'BISCOITO KIT KAT', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'BOLACHA NEGRESCO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'BRÓCOLIS', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CANELA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CATCHUP GALÃO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CATCHUP SACHE', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CEBOLA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CEBOLA CROCANTE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CEREJA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CHAMPIGNON', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CHOCOLATE BRANCO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CHOCOLATE PRETO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'COCO RALADO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CONFETE', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CREME BEIJINHO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CREME GALAK', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CREME KIT KAT', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'CREME PISTACHE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'DOCE DE LEITE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'DORITOS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'ESCAROLA (CRUA)', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'FARINHA DE TRIGO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'FERMENTO BIOLÓGICO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'FIGO EM CALDA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'LEMON PEPPER', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'MAIONESE SACHE', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'MANJERICÃO ITALIANO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'MOLHO DE PIMENTA SACHE', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'MOLHO PIZZA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'MOLHO TOMODORO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'MORANGO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'MOSTARDA GALÃO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'MOSTARDA SACHE', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'ÓLEO', unidade: 'L', tipo: 'AMBIENTE' },
  { nome: 'ORÉGANO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'PALMITO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'PASTA DE ALHO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'PÊSSEGO EM CALDA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'PIMENTA CALABRESA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'PIMENTÃO VERDE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'RÚCULA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'SAL', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'SÊMOLA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'TEMPERO COMPLETO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'TOMATE', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'TOMATE CEREJA', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'TOMATE SECO', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'UVA PASSAS', unidade: 'kg', tipo: 'AMBIENTE' },
  { nome: 'VINAGRE', unidade: 'L', tipo: 'AMBIENTE' },

  // ── Embalagens ──────────────────────────────────────────────────────────────
  { nome: 'EMBALAGEM 20', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'EMBALAGEM 25', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'EMBALAGEM 30', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'EMBALAGEM 35', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'EMBALAGEM 40', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'EMBALAGEM CALZONE', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'EMBALAGEM ENTRADAS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'MESINHA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SEPARADOR', unidade: 'un', tipo: 'AMBIENTE' },

  // ── Bebidas ─────────────────────────────────────────────────────────────────
  { nome: 'ÁGUA COM GÁS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'ÁGUA SEM GÁS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA BECKS LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA BECKS LONG NECK', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA BUDWEISER LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA BUDWEISER LONG NECK', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA HEINEKEN LONG NECK', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA ORIGINAL LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA ORIGINAL LONG NECK', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA SOL', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA SPATEN LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA SPATEN LONG NECK', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA STELLA ARTOIS LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CERVEJA STELLA ARTOIS LONG NECK', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CHÁ LIMÃO 1,5', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'CHÁ PÊSSEGO 1,5', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA 1 LITRO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA 1 LITRO ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA 2 LITROS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA 2 LITROS ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA 600', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA 600 ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'COCA LATA ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'ENERGÉTICO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'FANTA GUARANÁ 2 LITROS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'FANTA GUARANÁ LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'FANTA GUARANÁ ZERO 2 LITROS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'FANTA LARANJA 2 LITROS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'FANTA LARANJA LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'GUARANÁ ANTÁRCTICA 200', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'GUARANÁ ANTÁRCTICA 2L', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'GUARANÁ ANTÁRCTICA 2L ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'GUARANÁ ANTÁRCTICA 600', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'GUARANÁ ANTÁRCTICA 600 ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'GUARANÁ ANTÁRCTICA LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'GUARANÁ ANTÁRCTICA LATA ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'KUAT 2 LITROS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'KUAT 2 LITROS ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'KUAT LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'PEPSI 2L', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'PEPSI 2L ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'PEPSI 600', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'PEPSI LATA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'PEPSI LATA ZERO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'POWERADE', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SODA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SPRITE 2 LITROS', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SUCO DE ABACAXI 900 ML', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SUCO DE LARANJA 900 ML', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SUCO DE MANGA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SUCO INTEGRAL UVA 1,5', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SUCO MARACUJÁ', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SUCO PÊSSEGO', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'SUCO UVA', unidade: 'un', tipo: 'AMBIENTE' },
  { nome: 'TÔNICA', unidade: 'un', tipo: 'AMBIENTE' },
];

export async function POST() {
  try {
    const dbUser = await getEffectiveDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Busca todos os produtos já existentes do usuário (por nome, case-insensitive)
    const existentes = await prisma.etiquetagemProduto.findMany({
      where: { userId: dbUser.id },
      select: { nome: true },
    });

    const nomesExistentes = new Set(existentes.map(p => p.nome.toUpperCase().trim()));

    const novos = INSUMOS_PADRAO.filter(
      p => !nomesExistentes.has(p.nome.toUpperCase().trim()),
    );

    if (novos.length === 0) {
      return NextResponse.json({
        criados: 0,
        ignorados: INSUMOS_PADRAO.length,
        mensagem: 'Todos os insumos padrão já existem na lista.',
      });
    }

    await prisma.etiquetagemProduto.createMany({
      data: novos.map(p => ({
        userId: dbUser.id,
        nome: p.nome,
        unidadeMedida: p.unidade,
        pesoPadrao: 1,
        tipoArmazenamentoPadrao: p.tipo,
        isAtivo: 1,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      criados: novos.length,
      ignorados: INSUMOS_PADRAO.length - novos.length,
      mensagem: `${novos.length} insumos importados com sucesso.`,
    });
  } catch (error) {
    console.error('[Estoque] Erro ao importar insumos padrão:', error);
    return NextResponse.json({ error: 'Erro ao importar insumos' }, { status: 500 });
  }
}
