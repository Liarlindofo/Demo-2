'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ChefHat } from 'lucide-react';
import type { Receita, ReceitaItem, Ingrediente, Unidade } from '../types';
import { calcularCustoPorKgReceita, formatCurrency } from '../utils';
import { SearchableSelect } from './SearchableSelect';

interface ReceitaModalProps {
  receita: Receita | null; // null = criar nova
  ingredientes: Ingrediente[];
  onClose: () => void;
  onSave: (receita: Receita) => void;
  onDelete?: (receitaId: string) => void;
}

const UNIDADE_OPTS: { value: Unidade; label: string }[] = [
  { value: 'g', label: 'g (rendimento em gramas → custo/kg)' },
  { value: 'ml', label: 'ml (rendimento em ml → custo/L)' },
  { value: 'un', label: 'un (rendimento em unidades → custo/un)' },
];

const ING_UNIDADE_LABEL: Record<Unidade, string> = { g: 'g', ml: 'ml', un: 'un' };
const ING_PRECO_LABEL: Record<Unidade, string> = { g: '/kg', ml: '/L', un: '/un' };

export const ReceitaModal = ({
  receita,
  ingredientes,
  onClose,
  onSave,
  onDelete,
}: ReceitaModalProps) => {
  const isNew = receita === null;

  const [nome, setNome] = useState('');
  const [rendimento, setRendimento] = useState('1000');
  const [unidade, setUnidade] = useState<Unidade>('g');
  const [itens, setItens] = useState<ReceitaItem[]>([]);

  useEffect(() => {
    if (receita) {
      setNome(receita.nome);
      setRendimento(receita.rendimento.toString());
      setUnidade(receita.unidade);
      setItens(receita.itens.map(it => ({ ...it })));
    } else {
      setNome('');
      setRendimento('1000');
      setUnidade('g');
      setItens([{ ingredienteId: '', quantidade: 0 }]);
    }
  }, [receita]);

  // ── Cálculo de custo em tempo real ────────────────────────────────────────
  const receitaPreview: Receita = {
    id: receita?.id ?? 'preview',
    nome,
    rendimento: parseFloat(rendimento) || 0,
    unidade,
    itens,
  };
  const custoPorKg = calcularCustoPorKgReceita(receitaPreview, ingredientes);
  const custoValido = rendimento && parseFloat(rendimento) > 0;
  const unidadeCustoLabel: Record<Unidade, string> = { g: '/kg', ml: '/L', un: '/un' };
  const unidadeRendLabel: Record<Unidade, string> = { g: 'g', ml: 'ml', un: 'un' };

  // custo total bruto (soma de todos os itens)
  const custoTotal = itens.reduce((sum, item) => {
    const ing = ingredientes.find(i => i.id === item.ingredienteId);
    if (!ing || ing.precoPorKg <= 0 || item.quantidade <= 0) return sum;
    const c = ing.unidade === 'un'
      ? ing.precoPorKg * item.quantidade
      : (ing.precoPorKg / 1000) * item.quantidade;
    return sum + c;
  }, 0);

  // ── Itens da receita ──────────────────────────────────────────────────────
  const addItem = () =>
    setItens(prev => [...prev, { ingredienteId: '', quantidade: 0 }]);

  const removeItem = (idx: number) =>
    setItens(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ReceitaItem, value: string | number) =>
    setItens(prev =>
      prev.map((it, i) =>
        i === idx ? { ...it, [field]: field === 'ingredienteId' ? value : parseFloat(value as string) || 0 } : it,
      ),
    );

  const custoItem = (item: ReceitaItem) => {
    const ing = ingredientes.find(i => i.id === item.ingredienteId);
    if (!ing || ing.precoPorKg <= 0 || item.quantidade <= 0) return 0;
    return ing.unidade === 'un'
      ? ing.precoPorKg * item.quantidade
      : (ing.precoPorKg / 1000) * item.quantidade;
  };

  // ── Salvar ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!nome.trim()) { alert('Informe o nome da receita'); return; }
    const rend = parseFloat(rendimento);
    if (!rend || rend <= 0) { alert('Informe o rendimento'); return; }
    const validItens = itens.filter(it => it.ingredienteId && it.quantidade > 0);
    if (validItens.length === 0) { alert('Adicione pelo menos um ingrediente'); return; }
    onSave({
      id: receita?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      rendimento: rend,
      unidade,
      itens: validItens,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!receita) return;
    if (confirm(`Remover receita "${receita.nome}"?`)) {
      onDelete?.(receita.id);
      onClose();
    }
  };

  const itensPreenchidos = itens.filter(it => it.ingredienteId).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-base font-bold text-white">
              {isNew ? 'Nova Receita' : `Editar: ${receita.nome}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Corpo: duas colunas ──────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Coluna esquerda — informações da receita */}
          <div className="w-72 shrink-0 border-r border-[#2a2a2e] flex flex-col gap-5 p-5 overflow-y-auto">

            {/* Card de custo */}
            <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Custo calculado</p>
              <p className="text-3xl font-bold text-purple-400 leading-none">
                {custoValido && custoPorKg > 0
                  ? formatCurrency(custoPorKg)
                  : '—'}
              </p>
              {custoValido && custoPorKg > 0 && (
                <p className="text-xs text-purple-400/60 mt-0.5">{unidadeCustoLabel[unidade]}</p>
              )}
              <div className="mt-3 pt-3 border-t border-[#2a2a2e] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Custo total bruto</span>
                  <span className="text-white">{custoTotal > 0 ? formatCurrency(custoTotal) : '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Rendimento</span>
                  <span className="text-white">{rendimento || '—'}{rendimento ? unidadeRendLabel[unidade] : ''}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Ingredientes</span>
                  <span className="text-white">{itensPreenchidos}</span>
                </div>
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Nome da Receita *</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
                placeholder="Ex: Massa de pizza, Molho…"
                className="w-full bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Rendimento */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Rendimento *</label>
              <input
                type="number"
                value={rendimento}
                onChange={e => setRendimento(e.target.value)}
                placeholder="1000"
                className="w-full bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                min="0.01"
                step="any"
              />
              <p className="text-xs text-gray-600 mt-1">
                Quantidade produzida com os ingredientes abaixo
              </p>
            </div>

            {/* Unidade de rendimento */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Unidade de rendimento</label>
              <SearchableSelect
                value={unidade}
                onChange={v => { if (v) setUnidade(v as Unidade); }}
                options={UNIDADE_OPTS.map(o => ({ value: o.value, label: o.label }))}
                placeholder="Selecionar unidade…"
                accentColor="purple"
              />
            </div>
          </div>

          {/* Coluna direita — lista de ingredientes */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div>
                <p className="text-sm font-semibold text-white">Ingredientes</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {itensPreenchidos > 0 ? `${itensPreenchidos} adicionado${itensPreenchidos !== 1 ? 's' : ''}` : 'Nenhum ainda'}
                </p>
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            {ingredientes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-5 pb-5 text-center">
                <div className="text-3xl mb-2">🧂</div>
                <p className="text-sm text-amber-400 font-medium">Nenhum ingrediente cadastrado</p>
                <p className="text-xs text-gray-500 mt-1">Vá para a aba Ingredientes e cadastre primeiro.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
                {/* Cabeçalho da lista */}
                <div className="grid grid-cols-[1fr_88px_64px_28px] gap-2 px-3 pb-1">
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Ingrediente</span>
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Qtd</span>
                  <span className="text-xs text-gray-600 uppercase tracking-wide text-right">Custo</span>
                  <span />
                </div>

                {itens.map((item, idx) => {
                  const ing = ingredientes.find(i => i.id === item.ingredienteId);
                  const custo = custoItem(item);

                  const ingOptions = ingredientes.map(i => ({
                    value: i.id,
                    label: i.nome,
                    sublabel: i.precoPorKg > 0
                      ? `${formatCurrency(i.precoPorKg)}${ING_PRECO_LABEL[i.unidade]}`
                      : 'sem preço',
                  }));

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_88px_64px_28px] gap-2 items-center bg-[#141416] border border-[#2a2a2e] rounded-xl px-3 py-2.5 hover:border-[#374151] transition-colors"
                    >
                      <SearchableSelect
                        value={item.ingredienteId}
                        onChange={v => updateItem(idx, 'ingredienteId', v)}
                        options={ingOptions}
                        placeholder="Buscar ingrediente…"
                        accentColor="purple"
                      />

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.quantidade || ''}
                          onChange={e => updateItem(idx, 'quantidade', e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-purple-500"
                          min="0"
                          step="any"
                        />
                        <span className="text-xs text-gray-500 w-5 shrink-0 text-left">
                          {ing ? ING_UNIDADE_LABEL[ing.unidade] : ''}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-semibold ${custo > 0 ? 'text-white' : 'text-gray-600'}`}>
                          {custo > 0 ? formatCurrency(custo) : '—'}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(idx)}
                        disabled={itens.length === 1}
                        className="p-1 text-gray-600 hover:text-red-400 disabled:opacity-20 transition-colors rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Linha de total */}
                {itensPreenchidos > 0 && (
                  <div className="flex justify-between items-center px-3 pt-2 border-t border-[#2a2a2e] mt-1">
                    <span className="text-xs text-gray-500">Total bruto</span>
                    <span className="text-sm font-semibold text-white">{formatCurrency(custoTotal)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[#2a2a2e] flex gap-3 shrink-0">
          {!isNew && onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors"
            >
              Remover receita
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'Criar Receita' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
