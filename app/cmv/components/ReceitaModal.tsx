'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ChevronDown } from 'lucide-react';
import type { Receita, ReceitaItem, Ingrediente, Unidade } from '../types';
import { calcularCustoPorKgReceita, formatCurrency } from '../utils';

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

  // custo de um item individual
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

  const unidadeRendLabel: Record<Unidade, string> = { g: 'g', ml: 'ml', un: 'un' };
  const unidadeCustoLabel: Record<Unidade, string> = { g: '/kg', ml: '/L', un: '/un' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e]">
          <h2 className="text-lg font-bold text-white">
            {isNew ? 'Nova Receita' : 'Editar Receita'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo de custo */}
        <div className="px-5 py-3 bg-[#141416] border-b border-[#2a2a2e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Custo calculado</p>
              <p className="text-2xl font-bold text-purple-400 mt-0.5">
                {custoValido && custoPorKg > 0
                  ? `${formatCurrency(custoPorKg)}${unidadeCustoLabel[unidade]}`
                  : '—'}
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Rendimento: <span className="text-white">{rendimento || '—'}{unidadeRendLabel[unidade]}</span></p>
              <p className="mt-0.5">Ingredientes: <span className="text-white">{itens.filter(it => it.ingredienteId).length}</span></p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nome da Receita *</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Massa de pizza, Molho bolonhesa…"
              className="w-full bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Rendimento + Unidade */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Rendimento *</label>
              <input
                type="number"
                value={rendimento}
                onChange={e => setRendimento(e.target.value)}
                placeholder="1000"
                className="w-full bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                min="0.01"
                step="any"
              />
            </div>
            <div className="flex-[2]">
              <label className="text-xs text-gray-400 block mb-1">Unidade de rendimento</label>
              <div className="relative">
                <select
                  value={unidade}
                  onChange={e => setUnidade(e.target.value as Unidade)}
                  className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {UNIDADE_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Ingredientes da receita */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Ingredientes da receita</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {itens.map((item, idx) => {
                const ing = ingredientes.find(i => i.id === item.ingredienteId);
                const custo = custoItem(item);

                return (
                  <div key={idx} className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-3 flex gap-2 items-center">
                    {/* Selector de ingrediente */}
                    <div className="flex-1 relative">
                      <select
                        value={item.ingredienteId}
                        onChange={e => updateItem(idx, 'ingredienteId', e.target.value)}
                        className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Selecionar ingrediente…</option>
                        {ingredientes.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.nome} ({i.precoPorKg > 0 ? `${formatCurrency(i.precoPorKg)}${ING_PRECO_LABEL[i.unidade]}` : 'sem preço'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Quantidade */}
                    <div className="w-24 flex items-center gap-1">
                      <input
                        type="number"
                        value={item.quantidade || ''}
                        onChange={e => updateItem(idx, 'quantidade', e.target.value)}
                        placeholder="Qtd"
                        className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        min="0"
                        step="any"
                      />
                      <span className="text-xs text-gray-500 w-6 shrink-0">
                        {ing ? ING_UNIDADE_LABEL[ing.unidade] : ''}
                      </span>
                    </div>

                    {/* Custo calculado */}
                    <div className="w-20 text-right shrink-0">
                      <p className="text-xs text-gray-500">custo</p>
                      <p className="text-xs font-semibold text-white">
                        {custo > 0 ? formatCurrency(custo) : '—'}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(idx)}
                      disabled={itens.length === 1}
                      className="p-1 text-gray-600 hover:text-red-400 disabled:opacity-30 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {ingredientes.length === 0 && (
              <p className="text-xs text-amber-400 mt-2">
                ⚠️ Nenhum ingrediente cadastrado. Vá para a aba Ingredientes primeiro.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2a2a2e] flex gap-3">
          {!isNew && onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors"
            >
              Remover
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
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'Criar Receita' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
