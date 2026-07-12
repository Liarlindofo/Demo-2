'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  BrainCircuit,
  Building2,
  Briefcase,
  Filter,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface ValidacaoIA {
  objeto_esperado?: string;
  extrair?: string;
  faixa_ok?: { min: number | null; max: number | null };
  unidade?: string;
}

interface TarefaTemplate {
  id: string;
  titulo: string;
  descricao: string;
  exigeFoto: boolean;
  exigeConfirmacaoTexto: boolean;
  exigeLocalizacao: boolean;
  exigeArquivo: boolean;
  validacaoIA: ValidacaoIA | null;
  lojaId: string | null;
  cargoId: string | null;
  ativo: boolean;
  loja?: { id: string; nome: string } | null;
  cargo?: { id: string; nome: string } | null;
}

interface Loja {
  id: string;
  nome: string;
}

interface Cargo {
  id: string;
  nome: string;
}

interface TemplateForm {
  titulo: string;
  descricao: string;
  exigeFoto: boolean;
  exigeConfirmacaoTexto: boolean;
  exigeLocalizacao: boolean;
  exigeArquivo: boolean;
  lojaId: string;
  cargoId: string;
  ia_objeto: string;
  ia_extrair: string;
  ia_min: string;
  ia_max: string;
  ia_unidade: string;
}

const EMPTY_FORM: TemplateForm = {
  titulo: '',
  descricao: '',
  exigeFoto: false,
  exigeConfirmacaoTexto: false,
  exigeLocalizacao: false,
  exigeArquivo: false,
  lojaId: '',
  cargoId: '',
  ia_objeto: '',
  ia_extrair: '',
  ia_min: '',
  ia_max: '',
  ia_unidade: '',
};

const EVIDENCIAS: {
  key: 'exigeFoto' | 'exigeConfirmacaoTexto' | 'exigeLocalizacao' | 'exigeArquivo';
  label: string;
  icon: string;
}[] = [
  { key: 'exigeFoto', label: 'Foto', icon: '📷' },
  { key: 'exigeConfirmacaoTexto', label: 'Confirmação por texto', icon: '✅' },
  { key: 'exigeLocalizacao', label: 'Localização', icon: '📍' },
  { key: 'exigeArquivo', label: 'Arquivo', icon: '📎' },
];

// ── Estilos compartilhados ─────────────────────────────────────────────────

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors';

const labelCls = 'text-xs font-medium text-gray-400 mb-1.5 block';

const sectionCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3';

// ── Modal ──────────────────────────────────────────────────────────────────

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
      <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl w-full max-w-2xl shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e]">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export default function TarefasTemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<TarefaTemplate[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TarefaTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);

  // Filtros
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'inativos'>('ativos');

  // ── Fetchers ─────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tarefas/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLojasCargos = useCallback(async () => {
    try {
      const [resLojas, resCargos] = await Promise.all([
        fetch('/api/rh/lojas'),
        fetch('/api/rh/cargos'),
      ]);
      if (resLojas.ok) setLojas(await resLojas.json());
      if (resCargos.ok) setCargos(await resCargos.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchLojasCargos();
  }, [fetchTemplates, fetchLojasCargos]);

  // ── Handlers do modal ─────────────────────────────────────────────────────

  function openCreate() {
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEdit(t: TarefaTemplate) {
    setEditingTemplate(t);
    const ia = t.validacaoIA;
    setForm({
      titulo: t.titulo,
      descricao: t.descricao,
      exigeFoto: t.exigeFoto,
      exigeConfirmacaoTexto: t.exigeConfirmacaoTexto,
      exigeLocalizacao: t.exigeLocalizacao,
      exigeArquivo: t.exigeArquivo,
      lojaId: t.lojaId ?? '',
      cargoId: t.cargoId ?? '',
      ia_objeto: ia?.objeto_esperado ?? '',
      ia_extrair: ia?.extrair ?? '',
      ia_min: ia?.faixa_ok?.min != null ? String(ia.faixa_ok.min) : '',
      ia_max: ia?.faixa_ok?.max != null ? String(ia.faixa_ok.max) : '',
      ia_unidade: ia?.unidade ?? '',
    });
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function setField<K extends keyof TemplateForm>(key: K, value: TemplateForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.titulo.trim()) return 'O título é obrigatório.';
    if (!form.descricao.trim()) return 'A descrição é obrigatória.';
    if (
      !form.exigeFoto &&
      !form.exigeConfirmacaoTexto &&
      !form.exigeLocalizacao &&
      !form.exigeArquivo
    ) {
      return 'Selecione pelo menos um tipo de evidência.';
    }
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Montar validacaoIA apenas quando Foto está marcada e há algum campo preenchido
      let validacaoIA = null;
      if (
        form.exigeFoto &&
        (form.ia_objeto || form.ia_extrair || form.ia_min || form.ia_max || form.ia_unidade)
      ) {
        validacaoIA = {
          ...(form.ia_objeto.trim() && { objeto_esperado: form.ia_objeto.trim() }),
          ...(form.ia_extrair.trim() && { extrair: form.ia_extrair.trim() }),
          ...((form.ia_min || form.ia_max) && {
            faixa_ok: {
              min: form.ia_min ? parseFloat(form.ia_min) : null,
              max: form.ia_max ? parseFloat(form.ia_max) : null,
            },
          }),
          ...(form.ia_unidade.trim() && { unidade: form.ia_unidade.trim() }),
        };
      }

      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        exigeFoto: form.exigeFoto,
        exigeConfirmacaoTexto: form.exigeConfirmacaoTexto,
        exigeLocalizacao: form.exigeLocalizacao,
        exigeArquivo: form.exigeArquivo,
        validacaoIA,
        lojaId: form.lojaId || null,
        cargoId: form.cargoId || null,
      };

      let res: Response;
      if (editingTemplate) {
        res = await fetch(`/api/tarefas/templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/tarefas/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Erro ao salvar template.');
        return;
      }

      closeModal();
      fetchTemplates();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(t: TarefaTemplate) {
    setTogglingId(t.id);
    try {
      await fetch(`/api/tarefas/templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !t.ativo }),
      });
      fetchTemplates();
    } finally {
      setTogglingId(null);
    }
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  const filtered = templates.filter((t) => {
    if (filtroLoja && t.lojaId !== filtroLoja) return false;
    if (filtroAtivo === 'ativos' && !t.ativo) return false;
    if (filtroAtivo === 'inativos' && t.ativo) return false;
    return true;
  });

  const totalAtivos = templates.filter((t) => t.ativo).length;
  const totalInativos = templates.filter((t) => !t.ativo).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/tarefas')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">
                  Templates de Tarefas
                </h1>
                <p className="text-xs text-gray-500">
                  {totalAtivos} ativo{totalAtivos !== 1 ? 's' : ''}
                  {totalInativos > 0 &&
                    ` · ${totalInativos} inativo${totalInativos !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo template
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">Filtros:</span>
          </div>

          <div className="flex rounded-xl border border-[#2a2a2e] overflow-hidden text-xs">
            {(
              [
                { v: 'ativos', label: 'Ativos' },
                { v: 'inativos', label: 'Inativos' },
                { v: 'todos', label: 'Todos' },
              ] as const
            ).map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setFiltroAtivo(v)}
                className={`px-3 py-1.5 transition-colors ${
                  filtroAtivo === v
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-gray-500 hover:text-white hover:bg-[#1c1c1e]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {lojas.length > 0 && (
            <select
              value={filtroLoja}
              onChange={(e) => setFiltroLoja(e.target.value)}
              className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/40 transition-colors"
            >
              <option value="">Todas as lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-blue-400/50" />
            </div>
            <div>
              <p className="text-white font-medium">
                {templates.length === 0
                  ? 'Nenhum template cadastrado'
                  : 'Nenhum template encontrado'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {templates.length === 0
                  ? 'Crie o primeiro modelo de tarefa operacional'
                  : 'Tente ajustar os filtros'}
              </p>
            </div>
            {templates.length === 0 && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar template
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <div
                key={t.id}
                className={`bg-[#111113] border border-[#2a2a2e] rounded-2xl p-5 transition-colors ${
                  !t.ativo ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ClipboardList className="w-5 h-5 text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Título e badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{t.titulo}</span>
                      {!t.ativo && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 text-xs border border-gray-700">
                          Inativo
                        </span>
                      )}
                      {t.validacaoIA && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20 flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3" />
                          IA
                        </span>
                      )}
                    </div>

                    {/* Descrição */}
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{t.descricao}</p>

                    {/* Evidências */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {t.exigeFoto && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#1c1c1e] text-gray-400 text-xs">
                          📷 Foto
                        </span>
                      )}
                      {t.exigeConfirmacaoTexto && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#1c1c1e] text-gray-400 text-xs">
                          ✅ Confirmação
                        </span>
                      )}
                      {t.exigeLocalizacao && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#1c1c1e] text-gray-400 text-xs">
                          📍 Localização
                        </span>
                      )}
                      {t.exigeArquivo && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#1c1c1e] text-gray-400 text-xs">
                          📎 Arquivo
                        </span>
                      )}
                    </div>

                    {/* Loja / Cargo */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {t.loja ? t.loja.nome : 'Todas as lojas'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {t.cargo ? t.cargo.nome : 'Todos os cargos'}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(t)}
                      disabled={togglingId === t.id}
                      title={t.ativo ? 'Desativar' : 'Ativar'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-40"
                    >
                      {togglingId === t.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : t.ativo ? (
                        <ToggleRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => openEdit(t)}
                      title="Editar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {showModal && (
        <Modal
          title={editingTemplate ? 'Editar template' : 'Novo template'}
          onClose={closeModal}
        >
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

            {/* Informações básicas */}
            <div className="space-y-4">
              <p className={sectionCls}>Informações básicas</p>

              <div>
                <label className={labelCls}>
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setField('titulo', e.target.value)}
                  placeholder="Ex: Aferição de temperatura do forno"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Descrição <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setField('descricao', e.target.value)}
                  placeholder="Descreva a tarefa em detalhes..."
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Descreva a tarefa em detalhes. A IA usará este texto para validar a evidência
                  enviada pelo funcionário. Ex: &ldquo;Aferir a temperatura do forno principal.
                  O display deve mostrar entre 300°C e 350°C.&rdquo;
                </p>
              </div>
            </div>

            {/* Evidências exigidas */}
            <div>
              <p className={sectionCls}>
                Evidências exigidas{' '}
                <span className="text-red-400 normal-case font-normal tracking-normal">
                  * pelo menos uma
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {EVIDENCIAS.map((ev) => (
                  <button
                    key={ev.key}
                    type="button"
                    onClick={() => setField(ev.key, !form[ev.key])}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      form[ev.key]
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                        : 'bg-[#0a0a0a] border-[#2a2a2e] text-gray-400 hover:border-[#3a3a3e] hover:text-white'
                    }`}
                  >
                    <span className="text-base leading-none">{ev.icon}</span>
                    <span className="flex-1">{ev.label}</span>
                    {form[ev.key] && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Validação por IA — exibida apenas quando Foto está marcada */}
            {form.exigeFoto && (
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    <p className="text-sm font-semibold text-purple-300">Validação por IA</p>
                    <span className="text-xs text-purple-500">(opcional)</span>
                  </div>
                  <p className="text-xs text-purple-400/70 leading-relaxed">
                    Configure o que a IA deve analisar na foto enviada pelo funcionário.
                    Deixe em branco para usar apenas a análise textual baseada na descrição.
                  </p>
                </div>

                <div>
                  <label className={labelCls}>Objeto esperado na foto</label>
                  <input
                    type="text"
                    value={form.ia_objeto}
                    onChange={(e) => setField('ia_objeto', e.target.value)}
                    placeholder="Ex: display de temperatura de forno"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>O que extrair / verificar</label>
                  <input
                    type="text"
                    value={form.ia_extrair}
                    onChange={(e) => setField('ia_extrair', e.target.value)}
                    placeholder="Ex: valor em °C mostrado no display"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Valor mínimo</label>
                    <input
                      type="number"
                      value={form.ia_min}
                      onChange={(e) => setField('ia_min', e.target.value)}
                      placeholder="300"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Valor máximo</label>
                    <input
                      type="number"
                      value={form.ia_max}
                      onChange={(e) => setField('ia_max', e.target.value)}
                      placeholder="350"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Unidade</label>
                    <input
                      type="text"
                      value={form.ia_unidade}
                      onChange={(e) => setField('ia_unidade', e.target.value)}
                      placeholder="°C"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Escopo: loja e cargo */}
            <div>
              <p className={sectionCls}>Escopo</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Loja</label>
                  <select
                    value={form.lojaId}
                    onChange={(e) => setField('lojaId', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Todas as lojas</option>
                    {lojas.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Cargo</label>
                  <select
                    value={form.cargoId}
                    onChange={(e) => setField('cargoId', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Todos os cargos</option>
                    {cargos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Erro de validação */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Rodapé do modal */}
          <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-[#2a2a2e] mt-0">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving
                ? 'Salvando...'
                : editingTemplate
                  ? 'Salvar alterações'
                  : 'Criar template'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
