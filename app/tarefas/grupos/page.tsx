'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface TemplateOpt {
  id: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
}

interface GrupoItem {
  id: string;
  templateId: string;
  ordem: number;
  template: TemplateOpt;
}

interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  itens: GrupoItem[];
}

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40 transition-colors';
const labelCls = 'text-xs font-medium text-gray-400 mb-1.5 block';

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl w-full max-w-lg shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e]">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function TarefasGruposPage() {
  const router = useRouter();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [templates, setTemplates] = useState<TemplateOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Grupo | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/tarefas/grupos'),
        fetch('/api/tarefas/templates'),
      ]);
      if (r1.ok) {
        const data = await r1.json();
        setGrupos(Array.isArray(data) ? data : []);
      }
      if (r2.ok) {
        const data = await r2.json();
        setTemplates(
          Array.isArray(data)
            ? data.map((t: TemplateOpt) => ({
                id: t.id,
                titulo: t.titulo,
                descricao: t.descricao,
                ativo: t.ativo,
              }))
            : [],
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const templatesAtivos = useMemo(
    () => templates.filter((t) => t.ativo),
    [templates],
  );

  function openCreate() {
    setEditing(null);
    setNome('');
    setDescricao('');
    setSelectedIds(new Set());
    setError(null);
    setShowModal(true);
  }

  function openEdit(g: Grupo) {
    setEditing(g);
    setNome(g.nome);
    setDescricao(g.descricao ?? '');
    setSelectedIds(new Set(g.itens.map((i) => i.templateId)));
    setError(null);
    setShowModal(true);
  }

  function toggleTemplate(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!nome.trim()) {
      setError('Informe o nome do grupo.');
      return;
    }
    if (selectedIds.size === 0) {
      setError('Selecione pelo menos um template.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        templateIds: Array.from(selectedIds),
      };
      const res = await fetch(
        editing ? `/api/tarefas/grupos/${editing.id}` : '/api/tarefas/grupos',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Erro ao salvar grupo.');
        return;
      }
      setShowModal(false);
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(g: Grupo) {
    setTogglingId(g.id);
    try {
      const res = await fetch(`/api/tarefas/grupos/${g.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !g.ativo }),
      });
      if (res.ok) fetchAll();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(g: Grupo) {
    if (!confirm(`Excluir o grupo "${g.nome}"? Os templates em si não serão apagados.`)) {
      return;
    }
    setDeletingId(g.id);
    try {
      const res = await fetch(`/api/tarefas/grupos/${g.id}`, { method: 'DELETE' });
      if (res.ok) fetchAll();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Erro ao excluir.');
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/tarefas')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">
                  Grupos de tarefas
                </h1>
                <p className="text-xs text-gray-500">
                  Pacotes para atribuir várias tarefas de uma vez
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400"
          >
            <Plus className="w-4 h-4" />
            Novo grupo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Layers className="w-10 h-10 text-violet-400/40" />
            <p className="text-white font-medium">Nenhum grupo ainda</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Crie um grupo como &quot;Tarefas gerentes&quot; e selecione os templates. Na
              atribuição, escolha o grupo inteiro de uma vez.
            </p>
            <button
              onClick={openCreate}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Novo grupo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {grupos.map((g) => (
              <div
                key={g.id}
                className={`bg-[#111113] border border-[#2a2a2e] rounded-2xl px-4 py-4 ${
                  !g.ativo ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-semibold text-white">{g.nome}</h2>
                      <span className="text-xs text-gray-500">
                        {g.itens.length} template{g.itens.length === 1 ? '' : 's'}
                      </span>
                      {!g.ativo && (
                        <span className="text-xs text-gray-500 bg-[#1c1c1e] px-1.5 py-0.5 rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                    {g.descricao && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{g.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {g.itens.map((item) => (
                        <span
                          key={item.id}
                          className={`text-xs px-2 py-0.5 rounded-lg border ${
                            item.template.ativo
                              ? 'border-violet-500/20 text-violet-300 bg-violet-500/5'
                              : 'border-[#2a2a2e] text-gray-600'
                          }`}
                        >
                          {item.template.titulo}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(g)}
                      disabled={togglingId === g.id}
                      title={g.ativo ? 'Desativar' : 'Ativar'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e]"
                    >
                      {togglingId === g.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : g.ativo ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(g)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-300 hover:bg-violet-500/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(g)}
                      disabled={deletingId === g.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      {deletingId === g.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Editar grupo' : 'Novo grupo'}
          onClose={() => setShowModal(false)}
        >
          <div className="p-6 space-y-4">
            <div>
              <label className={labelCls}>Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder='Ex.: Tarefas gerentes'
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Descrição (opcional)</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                className={inputCls}
                placeholder="Quando usar este pacote"
              />
            </div>
            <div>
              <label className={labelCls}>
                Templates ({selectedIds.size} selecionado
                {selectedIds.size === 1 ? '' : 's'})
              </label>
              {templatesAtivos.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum template ativo. Crie templates antes de montar o grupo.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-[#2a2a2e] p-2">
                  {templatesAtivos.map((t) => {
                    const sel = selectedIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTemplate(t.id)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          sel
                            ? 'bg-violet-500/15 border border-violet-500/40'
                            : 'bg-[#0a0a0a] border border-transparent hover:border-[#2a2a2e]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            sel
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-[#3a3a3e]'
                          }`}
                        >
                          {sel && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${sel ? 'text-violet-200' : 'text-white'}`}>
                            {t.titulo}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">{t.descricao}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar grupo'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
