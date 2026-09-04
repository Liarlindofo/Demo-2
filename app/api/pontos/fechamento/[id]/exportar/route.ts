import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';
import * as XLSX from 'xlsx-js-style';
import { Decimal } from '@prisma/client/runtime/library';

export const dynamic = 'force-dynamic';

// ─── Dados da empresa (modelo contábil Bruluvas) ─────────────────────────────

const EMPRESA = {
  codigo: '0003020',
  razaoSocial: 'BRULUVAS LTDA',
  cnpj: '08.821.071/0001-67',
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

type BorderSide = { style: string; color: { rgb: string } };
type BorderAll = { top: BorderSide; bottom: BorderSide; left: BorderSide; right: BorderSide };

function borderAll(rgb = 'B0B0B0'): BorderAll {
  const side: BorderSide = { style: 'thin', color: { rgb } };
  return { top: side, bottom: side, left: side, right: side };
}

const FONT = { name: 'Arial', sz: 10 };
const GRAY = { patternType: 'solid' as const, fgColor: { rgb: 'C0C0C0' } };
const TITLE_STYLE = {
  font: { name: 'Arial', sz: 14, bold: true, color: { rgb: '1A1A1A' } },
  alignment: { horizontal: 'left' as const, vertical: 'center' as const },
};
const LABEL_STYLE = {
  font: { name: 'Arial', sz: 10, bold: true },
  alignment: { horizontal: 'left' as const, vertical: 'center' as const },
};
const VALUE_STYLE = {
  font: FONT,
  alignment: { horizontal: 'left' as const, vertical: 'center' as const },
};
const TH_STYLE = {
  font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '1A1A1A' } },
  fill: GRAY,
  alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
  border: borderAll('A0A0A0'),
};
const CODE_STYLE = {
  font: { name: 'Arial', sz: 9, bold: true },
  fill: GRAY,
  alignment: { horizontal: 'center' as const, vertical: 'center' as const },
  border: borderAll('A0A0A0'),
  numFmt: '0000',
};
const DATA_STYLE = {
  font: FONT,
  alignment: { horizontal: 'center' as const, vertical: 'center' as const },
  border: borderAll('D9D9D9'),
};
const NAME_STYLE = {
  font: { name: 'Arial', sz: 10, bold: true },
  alignment: { horizontal: 'left' as const, vertical: 'center' as const },
  border: borderAll('D9D9D9'),
};
const MONEY_STYLE = {
  font: FONT,
  alignment: { horizontal: 'right' as const, vertical: 'center' as const },
  border: borderAll('D9D9D9'),
  numFmt: '#,##0.00',
};
const ALT_ROW_FILL = { patternType: 'solid' as const, fgColor: { rgb: 'F7F7F7' } };

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Mantém HH:mm / valores textuais do Secullum — nunca converte para decimal. */
function horaCell(val: string | null | undefined, alt = false): XLSX.CellObject {
  const raw = (val ?? '').toString().trim();
  if (!raw || raw === '0' || raw === '00:00' || raw === '0:00') {
    return { v: '', t: 's', s: { ...DATA_STYLE, ...(alt ? { fill: ALT_ROW_FILL } : {}) } };
  }
  return {
    v: raw,
    t: 's',
    z: '@',
    s: { ...DATA_STYLE, ...(alt ? { fill: ALT_ROW_FILL } : {}) },
  };
}

function moneyCell(val: Decimal | string | null | undefined, alt = false): XLSX.CellObject {
  if (val === null || val === undefined || val === '') {
    return { v: '', t: 's', s: { ...MONEY_STYLE, ...(alt ? { fill: ALT_ROW_FILL } : {}) } };
  }
  const n = Number(val);
  if (isNaN(n) || n === 0) {
    return { v: '', t: 's', s: { ...MONEY_STYLE, ...(alt ? { fill: ALT_ROW_FILL } : {}) } };
  }
  // Arredonda para 2 casas — evita 2.333333...
  const rounded = Math.round(n * 100) / 100;
  return {
    v: rounded,
    t: 'n',
    s: { ...MONEY_STYLE, ...(alt ? { fill: ALT_ROW_FILL } : {}) },
  };
}

function textCell(val: string | number, style: object): XLSX.CellObject {
  return { v: val, t: typeof val === 'number' ? 'n' : 's', s: style };
}

function emptyCell(style: object): XLSX.CellObject {
  return { v: '', t: 's', s: style };
}

function setCell(ws: XLSX.WorkSheet, r: number, c: number, cell: XLSX.CellObject) {
  ws[XLSX.utils.encode_cell({ r, c })] = cell;
}

function competenciaExcelSerial(mes: number, ano: number): number {
  // Serial Excel: dias desde 1899-12-30 (compatível com epoch do Excel)
  const utc = Date.UTC(ano, mes - 1, 1);
  return Math.floor(utc / 86400000) + 25569;
}

function addCabecalhoEmpresa(ws: XLSX.WorkSheet, mes: number, ano: number, lastCol: number) {
  setCell(ws, 0, 0, textCell('RELAÇÃO DE VALORES PARA FOLHA DE PAGAMENTO', TITLE_STYLE));

  const labels: Array<[number, string, string | number, string?]> = [
    [2, 'Código Empresa:', EMPRESA.codigo, '0000000'],
    [3, 'Razão Social:', EMPRESA.razaoSocial],
    [4, 'Inscrição Cnpj:', EMPRESA.cnpj],
    [5, 'Competência:', competenciaExcelSerial(mes, ano), 'm/d/yy'],
  ];

  for (const [row, label, value, numFmt] of labels) {
    setCell(ws, row, 0, textCell(label, LABEL_STYLE));
    const cell: XLSX.CellObject = {
      v: value,
      t: typeof value === 'number' ? 'n' : 's',
      s: VALUE_STYLE,
    };
    if (numFmt) cell.z = numFmt;
    setCell(ws, row, 3, cell);
  }

  // Espaço visual nas linhas 1 (índice 1) e 6–7
  for (let c = 0; c <= lastCol; c++) {
    if (!ws[XLSX.utils.encode_cell({ r: 1, c })]) setCell(ws, 1, c, emptyCell({ font: FONT }));
  }
}

// ─── Aba "Eventos Horas_Percentual" ──────────────────────────────────────────

const HORAS_EVENTOS: Array<{ nome: string; codigo: number }> = [
  { nome: 'HE 60% Diurna', codigo: 37 },
  { nome: 'HE 60% Noturna', codigo: 38 },
  { nome: 'HE 100% Diurna', codigo: 49 },
  { nome: 'HE 100% Noturna', codigo: 50 },
  { nome: 'Atraso', codigo: 29 },
  { nome: 'Horas Faltas', codigo: 23 },
  { nome: 'Horas Falta DSR', codigo: 25 },
  { nome: 'Adicional Noturno', codigo: 1385 },
  { nome: 'Vale Transporte', codigo: 816 },
];

function buildAbaHoras(linhas: LinhaExport[], mes: number, ano: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const lastCol = 3 + HORAS_EVENTOS.length; // A..M = 0..12

  addCabecalhoEmpresa(ws, mes, ano, lastCol);

  const HDR_NAMES = 8; // linha 9
  const HDR_CODES = 9; // linha 10
  const HDR_PLANO = 10; // linha 11
  const HDR_CNPJ = 11; // linha 12
  const DATA_START = 12; // linha 13

  const baseHeaders = [
    'Tipo de Cálculo',
    'Código Empregado',
    'Código Dependente',
    'Nome dos Colaboradores',
  ];

  baseHeaders.forEach((h, ci) => setCell(ws, HDR_NAMES, ci, textCell(h, TH_STYLE)));
  HORAS_EVENTOS.forEach((ev, i) => {
    setCell(ws, HDR_NAMES, 4 + i, textCell(ev.nome, TH_STYLE));
    setCell(ws, HDR_CODES, 4 + i, {
      v: ev.codigo,
      t: 'n',
      z: '0000',
      s: CODE_STYLE,
    });
  });

  // Células cinza vazias sob os headers base (codes row)
  for (let ci = 0; ci < 4; ci++) {
    setCell(ws, HDR_CODES, ci, emptyCell(TH_STYLE));
  }

  setCell(ws, HDR_PLANO, 0, textCell('Evento de Plano de Saúde (Sim/Não)', TH_STYLE));
  for (let i = 0; i < HORAS_EVENTOS.length; i++) {
    setCell(ws, HDR_PLANO, 4 + i, textCell('Não', TH_STYLE));
  }
  for (let ci = 1; ci < 4; ci++) setCell(ws, HDR_PLANO, ci, emptyCell(TH_STYLE));

  setCell(ws, HDR_CNPJ, 0, textCell('CNPJ da Operadora de Plano de Saúde', TH_STYLE));
  for (let ci = 1; ci <= lastCol; ci++) setCell(ws, HDR_CNPJ, ci, emptyCell(TH_STYLE));

  linhas.forEach((l, ri) => {
    const row = DATA_START + ri;
    const alt = ri % 2 === 1;
    const fill = alt ? { fill: ALT_ROW_FILL } : {};

    setCell(ws, row, 0, textCell(11, { ...DATA_STYLE, ...fill }));
    setCell(
      ws,
      row,
      1,
      l.codigoEmpregadoSecullum != null
        ? textCell(l.codigoEmpregadoSecullum, { ...DATA_STYLE, ...fill })
        : emptyCell({ ...DATA_STYLE, ...fill }),
    );
    setCell(ws, row, 2, emptyCell({ ...DATA_STYLE, ...fill }));
    setCell(ws, row, 3, textCell(l.nome.toUpperCase(), { ...NAME_STYLE, ...fill }));

    // Ordem: ex60, en60, ex100, en100, atraso, faltas, faltaDsr, adicional (vazio), VT
    const horasVals = [l.ex60, l.en60, l.ex100, l.en100, l.atraso, l.faltas, l.faltaDsr];
    horasVals.forEach((v, i) => setCell(ws, row, 4 + i, horaCell(v, alt)));
    setCell(ws, row, 11, horaCell(null, alt)); // Adicional Noturno — sem fonte ainda
    setCell(ws, row, 12, moneyCell(l.valeTransporte, alt));
  });

  const totalRows = DATA_START + linhas.length;
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: Math.max(totalRows - 1, 12), c: lastCol });

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
    { s: { r: HDR_NAMES, c: 0 }, e: { r: HDR_CODES, c: 0 } },
    { s: { r: HDR_NAMES, c: 1 }, e: { r: HDR_CODES, c: 1 } },
    { s: { r: HDR_NAMES, c: 2 }, e: { r: HDR_CODES, c: 2 } },
    { s: { r: HDR_NAMES, c: 3 }, e: { r: HDR_CODES, c: 3 } },
    { s: { r: HDR_PLANO, c: 0 }, e: { r: HDR_PLANO, c: 3 } },
    { s: { r: HDR_CNPJ, c: 0 }, e: { r: HDR_CNPJ, c: 3 } },
  ];

  ws['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 38 },
    { wch: 14 },
    { wch: 15 },
    { wch: 14 },
    { wch: 15 },
    { wch: 11 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 15 },
  ];

  ws['!rows'] = [
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 8 },
    { hpt: 4 },
    { hpt: 28 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
  ];

  return ws;
}

// ─── Aba "Eventos Valor" ──────────────────────────────────────────────────────

const VALOR_EVENTOS: Array<{ nome: string; codigo: number }> = [
  { nome: 'Desc Diversos', codigo: 814 },
  { nome: 'Desconto Refeição', codigo: 813 },
  { nome: 'Desconto Compras', codigo: 1199 },
];

function buildAbaValor(linhas: LinhaExport[], mes: number, ano: number): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const lastCol = 3 + VALOR_EVENTOS.length;

  addCabecalhoEmpresa(ws, mes, ano, lastCol);

  const HDR_NAMES = 8;
  const HDR_CODES = 9;
  const DATA_START = 12;

  const baseHeaders = [
    'Tipo de Cálculo',
    'Código Empregado',
    'Código Dependente',
    'Nome dos Colaboradores',
  ];

  baseHeaders.forEach((h, ci) => setCell(ws, HDR_NAMES, ci, textCell(h, TH_STYLE)));
  VALOR_EVENTOS.forEach((ev, i) => {
    setCell(ws, HDR_NAMES, 4 + i, textCell(ev.nome, TH_STYLE));
    setCell(ws, HDR_CODES, 4 + i, {
      v: ev.codigo,
      t: 'n',
      z: '0000',
      s: CODE_STYLE,
    });
  });
  for (let ci = 0; ci < 4; ci++) setCell(ws, HDR_CODES, ci, emptyCell(TH_STYLE));

  // Linhas 11–12 vazias (espelha o modelo)
  for (let r = 10; r <= 11; r++) {
    for (let c = 0; c <= lastCol; c++) setCell(ws, r, c, emptyCell({ font: FONT }));
  }

  linhas.forEach((l, ri) => {
    const row = DATA_START + ri;
    const alt = ri % 2 === 1;
    const fill = alt ? { fill: ALT_ROW_FILL } : {};

    setCell(ws, row, 0, textCell(11, { ...DATA_STYLE, ...fill }));
    setCell(
      ws,
      row,
      1,
      l.codigoEmpregadoSecullum != null
        ? textCell(l.codigoEmpregadoSecullum, { ...DATA_STYLE, ...fill })
        : emptyCell({ ...DATA_STYLE, ...fill }),
    );
    setCell(ws, row, 2, emptyCell({ ...DATA_STYLE, ...fill }));
    setCell(ws, row, 3, textCell(l.nome.toUpperCase(), { ...NAME_STYLE, ...fill }));
    setCell(ws, row, 4, moneyCell(l.descDiversos, alt));
    setCell(ws, row, 5, moneyCell(l.descRefeicao, alt));
    setCell(ws, row, 6, moneyCell(l.descCompras, alt));
  });

  const totalRows = DATA_START + linhas.length;
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: Math.max(totalRows - 1, 12), c: lastCol });

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
    { s: { r: HDR_NAMES, c: 0 }, e: { r: HDR_CODES, c: 0 } },
    { s: { r: HDR_NAMES, c: 1 }, e: { r: HDR_CODES, c: 1 } },
    { s: { r: HDR_NAMES, c: 2 }, e: { r: HDR_CODES, c: 2 } },
    { s: { r: HDR_NAMES, c: 3 }, e: { r: HDR_CODES, c: 3 } },
  ];

  ws['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 38 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
  ];

  ws['!rows'] = [
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 8 },
    { hpt: 4 },
    { hpt: 28 },
    { hpt: 16 },
  ];

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
