import type { StockCategory } from '../types';

export const SESSOES_PADRAO: Omit<StockCategory, 'status'>[] = [
  {
    id: 'congelados',
    nome: 'Congelados',
    icone: '🧊',
    itens: [
      { insumoId: 'massa-pizza', nome: 'Massa de Pizza', unidade: 'un', quantidadeContada: null, estoqueMinimo: 50 },
      { insumoId: 'frango-cozido', nome: 'Frango Cozido', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 5 },
      { insumoId: 'carne-moida', nome: 'Carne Moída', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 3 },
      { insumoId: 'camarao', nome: 'Camarão', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'calabresa', nome: 'Calabresa', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 4 },
    ],
  },
  {
    id: 'resfriados',
    nome: 'Resfriados',
    icone: '❄️',
    itens: [
      { insumoId: 'mussarela', nome: 'Mussarela', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 10 },
      { insumoId: 'catupiry', nome: 'Catupiry', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 3 },
      { insumoId: 'presunto', nome: 'Presunto', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'bacon', nome: 'Bacon', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'ovos', nome: 'Ovos', unidade: 'dz', quantidadeContada: null, estoqueMinimo: 3 },
    ],
  },
  {
    id: 'laticinios',
    nome: 'Laticínios',
    icone: '🧀',
    itens: [
      { insumoId: 'requeijao', nome: 'Requeijão Cremoso', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'creme-leite', nome: 'Creme de Leite', unidade: 'L', quantidadeContada: null, estoqueMinimo: 3 },
      { insumoId: 'cheddar', nome: 'Cheddar', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 1 },
      { insumoId: 'gorgonzola', nome: 'Gorgonzola', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 1 },
    ],
  },
  {
    id: 'secos-graos',
    nome: 'Secos e Grãos',
    icone: '🌿',
    itens: [
      { insumoId: 'farinha-trigo', nome: 'Farinha de Trigo', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 20 },
      { insumoId: 'acucar', nome: 'Açúcar', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 5 },
      { insumoId: 'sal', nome: 'Sal', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 3 },
      { insumoId: 'oleo', nome: 'Óleo de Soja', unidade: 'L', quantidadeContada: null, estoqueMinimo: 5 },
      { insumoId: 'oregano', nome: 'Orégano', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 0.5 },
      { insumoId: 'azeite', nome: 'Azeite', unidade: 'L', quantidadeContada: null, estoqueMinimo: 2 },
    ],
  },
  {
    id: 'molhos-conservas',
    nome: 'Molhos e Conservas',
    icone: '🥫',
    itens: [
      { insumoId: 'molho-tomate', nome: 'Molho de Tomate', unidade: 'L', quantidadeContada: null, estoqueMinimo: 10 },
      { insumoId: 'azeitona', nome: 'Azeitona', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'milho', nome: 'Milho em Conserva', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'palmito', nome: 'Palmito', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 1 },
    ],
  },
  {
    id: 'descartaveis',
    nome: 'Descartáveis e Embalagens',
    icone: '🧴',
    itens: [
      { insumoId: 'caixa-g', nome: 'Caixas de Pizza G', unidade: 'un', quantidadeContada: null, estoqueMinimo: 100 },
      { insumoId: 'caixa-m', nome: 'Caixas de Pizza M', unidade: 'un', quantidadeContada: null, estoqueMinimo: 50 },
      { insumoId: 'caixa-p', nome: 'Caixas de Pizza P', unidade: 'un', quantidadeContada: null, estoqueMinimo: 30 },
      { insumoId: 'guardanapos', nome: 'Guardanapos', unidade: 'pct', quantidadeContada: null, estoqueMinimo: 10 },
      { insumoId: 'copos-desc', nome: 'Copos Descartáveis', unidade: 'un', quantidadeContada: null, estoqueMinimo: 200 },
      { insumoId: 'sacolas', nome: 'Sacolas', unidade: 'un', quantidadeContada: null, estoqueMinimo: 100 },
    ],
  },
  {
    id: 'bebidas',
    nome: 'Bebidas',
    icone: '🥤',
    itens: [
      { insumoId: 'refri-2l', nome: 'Refrigerante 2L', unidade: 'un', quantidadeContada: null, estoqueMinimo: 30 },
      { insumoId: 'refri-lata', nome: 'Refrigerante Lata', unidade: 'un', quantidadeContada: null, estoqueMinimo: 24 },
      { insumoId: 'agua-min', nome: 'Água Mineral', unidade: 'un', quantidadeContada: null, estoqueMinimo: 20 },
      { insumoId: 'suco-cx', nome: 'Suco Caixinha', unidade: 'cx', quantidadeContada: null, estoqueMinimo: 5 },
      { insumoId: 'cerveja', nome: 'Cerveja 600ml', unidade: 'un', quantidadeContada: null, estoqueMinimo: 12 },
    ],
  },
  {
    id: 'limpeza',
    nome: 'Limpeza e Higiene',
    icone: '🧹',
    itens: [
      { insumoId: 'detergente', nome: 'Detergente', unidade: 'L', quantidadeContada: null, estoqueMinimo: 3 },
      { insumoId: 'alcool-70', nome: 'Álcool 70%', unidade: 'L', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'luvas-desc', nome: 'Luvas Descartáveis', unidade: 'cx', quantidadeContada: null, estoqueMinimo: 2 },
      { insumoId: 'papel-toalha', nome: 'Papel Toalha', unidade: 'rl', quantidadeContada: null, estoqueMinimo: 6 },
      { insumoId: 'sabao-po', nome: 'Sabão em Pó', unidade: 'kg', quantidadeContada: null, estoqueMinimo: 2 },
    ],
  },
];

export function criarSessoesPadrao(): StockCategory[] {
  return SESSOES_PADRAO.map(s => ({ ...s, status: 'pendente' as const }));
}
