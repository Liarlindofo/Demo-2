import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';
// xlsx-js-style é compatível com o xlsx mas suporta estilos
import * as XLSX from 'xlsx-js-style';
import { Decimal } from '@prisma/client/runtime/library';

export const dynamic = 'force-dynamic';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte "HH:mm" para valor numérico (horas decimais) ou string vazia */
function hhmm(val: string | null | undefined): number | string {
  if (!val) return '';
  const [h, m] = val.split(':').map(Number);
  if (isNaN(h)) return '';
  return h + (m ?? 0) / 60;
}

function dec(val: Decimal | string | null | undefined): number | string {
  if (val === null || val === undefined || val === '') return '';
  const n = Number(val);
  return isNaN(n) ? '' : n;
}

function padMes(mes: number) {
  return String(mes).padStart(2, '0');
}

/** Cabeçalho padrão da contabilidade nas células A1:D4 */
function addCabecalho(ws: XLSX.WorkSheet, mes: number, ano: number) {
  const hdr = [
    ['Código Empresa', 'Razão Social', 'Inscrição CNPJ', 'Competência'],
    ['', '', '', `${padMes(mes)}/${ano}`],
  ];
  // Insere nas duas primeiras linhas
  hdr.forEach((row, ri) => {
    row.forEach((val, ci) => {
      const ref = XLSX.utils.encode_cell({ r: ri, c: ci });
      ws[ref] = { v: val, t: 's' };
    });
  });
}

const styleTh = {
  font: { bold: true, sz: 10 },
  fill: { fgColor: { rgb: '2D2D2D' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
};

function cell(v: string | number | null | undefined, isBold = false): XLSX.CellObject {
  const val = v === null || v === undefined ? '' : v;
  return {
    v: val,
    t: typeof val === 'number' ? 'n' : 's',
    s: isBold ? { font: { bold: true, sz: 9 } } : { font: { sz: 9 } },
  };
}

function thCell(label: string): XLSX.CellObject {
  return { v: label, t: 's', s: styleTh };
}

// ─── Aba "Eventos Horas_Percentual" ──────────────────────────────────────────

/*
  Colunas e Códigos de Evento (ordem do modelo):
  Tipo de Cálculo | Código Empregado | Código Dependente | Nome Colaborador
  | 37 HE 60% Diurna | 38 HE 60% Noturna | 49 HE 100% Diurna | 50 HE 100% Noturna
  | 29 Atraso | 23 Horas Faltas | 25 Horas Falta DSR | 1385 Adicional Noturno | 816 Vale Transporte
*/

interface LinhaExport {
  codigoEmpregadoSecullum: number | null;
  nome: string;
  ex60: string | null;
  ex100: string | null;
  en60: string | null;
  en100: string | null;
  atraso: string | null;
  faltas: string | null;
  faltaDsr: string | null;
  valeTransporte: Decimal | null;
  descDiversos: Decimal | null;
  descRefeicao: Decimal | null;
  descCompras: Decimal | null;
}

function buildAbaHoras(linhas: LinhaExport[], mes: number, ano: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};

  addCabecalho(ws, mes, ano);

  // Linha de cabeçalho (linha 3, índice 2)
  const HEADERS = [
    'Tipo de Cálculo',
    'Código Empregado',
    'Código Dependente',
    'Nome dos Colaboradores',
    '37', // HE 60% Diurna
    '38', // HE 60% Noturna
    '49', // HE 100% Diurna
    '50', // HE 100% Noturna
    '29', // Atraso
    '23', // Horas Faltas
    '25', // Horas Falta DSR
    '1385', // Adicional Noturno
    '816', // Vale Transporte
  ];

  const HDR_ROW = 2;
  HEADERS.forEach((h, ci) => {
    ws[XLSX.utils.encode_cell({ r: HDR_ROW, c: ci })] = thCell(h);
  });

  linhas.forEach((l, ri) => {
    const row = HDR_ROW + 1 + ri;
    const cols = [
      cell('H'),                                         // Tipo de Cálculo
      cell(l.codigoEmpregadoSecullum ?? ''),             // Código Empregado
      cell(''),                                          // Código Dependente
      cell(l.nome, true),                                // Nome Colaborador
      cell(hhmm(l.ex60)),                                // 37 HE 60% Diurna
      cell(''),                                          // 38 HE 60% Noturna
      cell(hhmm(l.ex100)),                               // 49 HE 100% Diurna
      cell(''),                                          // 50 HE 100% Noturna
      cell(hhmm(l.atraso)),                              // 29 Atraso
      cell(hhmm(l.faltas)),                              // 23 Horas Faltas
      cell(hhmm(l.faltaDsr)),                            // 25 Horas Falta DSR
      cell(''),                                          // 1385 Adicional Noturno
      cell(dec(l.valeTransporte)),                       // 816 Vale Transporte
    ];
    cols.forEach((c, ci) => {
      ws[XLSX.utils.encode_cell({ r: row, c: ci })] = c;
    });
  });

  const totalRows = HDR_ROW + 1 + linhas.length;
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: totalRows - 1, c: HEADERS.length - 1 });
  ws['!cols'] = [20, 16, 16, 28, 10, 10, 10, 10, 10, 10, 10, 10, 14].map((w) => ({ wch: w }));

  return ws;
}

// ─── Aba "Eventos Valor" ──────────────────────────────────────────────────────

/*
  Colunas e Códigos:
  Tipo de Cálculo | Código Empregado | Código Dependente | Nome Colaborador
  | 814 Desc Diversos | 813 Desconto Refeição | 1199 Desconto Compras
*/

function buildAbaValor(linhas: LinhaExport[], mes: number, ano: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};

  addCabecalho(ws, mes, ano);

  const HEADERS = [
    'Tipo de Cálculo',
    'Código Empregado',
    'Código Dependente',
    'Nome dos Colaboradores',
    '814',  // Desc Diversos
    '813',  // Desconto Refeição
    '1199', // Desconto Compras
  ];

  const HDR_ROW = 2;
  HEADERS.forEach((h, ci) => {
    ws[XLSX.utils.encode_cell({ r: HDR_ROW, c: ci })] = thCell(h);
  });

  linhas.forEach((l, ri) => {
    const row = HDR_ROW + 1 + ri;
    const cols = [
      cell('D'),
      cell(l.codigoEmpregadoSecullum ?? ''),
      cell(''),
      cell(l.nome, true),
      cell(dec(l.descDiversos)),
      cell(dec(l.descRefeicao)),
      cell(dec(l.descCompras)),
    ];
    cols.forEach((c, ci) => {
      ws[XLSX.utils.encode_cell({ r: row, c: ci })] = c;
    });
  });

  const totalRows = HDR_ROW + 1 + linhas.length;
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: totalRows - 1, c: HEADERS.length - 1 });
  ws['!cols'] = [20, 16, 16, 28, 14, 16, 16].map((w) => ({ wch: w }));

  return ws;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { error } = await requireRhPermission(P.EMPLOYEES_VIEW);
  if (error) return error;

  const fechamento = await prisma.fechamentoMensal.findUnique({
    where: { id },
    include: {
      linhas: {
        include: {
          funcionario: {
            select: { nome: true, codigoEmpregadoSecullum: true },
          },
        },
        orderBy: { funcionario: { nome: 'asc' } },
      },
    },
  });

  if (!fechamento) {
    return NextResponse.json({ error: 'Fechamento não encontrado' }, { status: 404 });
  }

  const linhas: LinhaExport[] = fechamento.linhas.map((l) => ({
    codigoEmpregadoSecullum: l.funcionario.codigoEmpregadoSecullum,
    nome: l.funcionario.nome,
    ex60: l.ex60,
    ex100: l.ex100,
    en60: l.en60,
    en100: l.en100,
    atraso: l.atraso,
    faltas: l.faltas,
    faltaDsr: l.faltaDsr,
    valeTransporte: l.valeTransporte,
    descDiversos: l.descDiversos,
    descRefeicao: l.descRefeicao,
    descCompras: l.descCompras,
  }));

  const wb = XLSX.utils.book_new();

  const wsHoras = buildAbaHoras(linhas, fechamento.mes, fechamento.ano);
  XLSX.utils.book_append_sheet(wb, wsHoras, 'Eventos Horas_Percentual');

  const wsValor = buildAbaValor(linhas, fechamento.mes, fechamento.ano);
  XLSX.utils.book_append_sheet(wb, wsValor, 'Eventos Valor');

  const rawBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const buffer = new Uint8Array(rawBuffer);

  // Atualiza status para concluido
  await prisma.fechamentoMensal.update({
    where: { id },
    data: { status: 'concluido' },
  });

  const filename = `fechamento-${String(fechamento.mes).padStart(2, '0')}-${fechamento.ano}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(rawBuffer.length),
    },
  });
}
