'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  User,
  Building2,
  Clock,
  Calendar,
  RotateCcw,
  Info,
  Trash2,
  Check,
  ClipboardList,
  AlertCircle,
  Layers,
} from 'lucide-react';
import DateTimePicker, { DatePicker } from '@/components/ui/date-time-picker';

// ── Types ──────────────────────────────────────────────────────────────────

type StatusTarefa =
  | 'AGENDADA'
  | 'ENVIADA'
  | 'AGUARDANDO_EVIDENCIA'
  | 'CONCLUIDA'
  | 'CONCLUIDA_COM_ATRASO'
  | 'NAO_CONCLUIDA';

interface TarefaItem {
  id: string;
  dataAgendada: string;
  status: StatusTarefa;
  template: { id: string; titulo: string };
  funcionario: {
    id: string;
    nome: string;
    cargo: { id: string; nome: string } | null;
  };
  loja: { id: string; nome: string };
}

interface Loja {
  id: string;
  nome: string;
}

interface Funcionario {
  id: string;
  nome: string;
  cargoId: string | null;
  cargo: { id: string; nome: string } | null;
}

interface Template {
  id: string;
  titulo: string;
  descricao: string;
  exigeFoto: boolean;
  exigeConfirmacaoTexto: boolean;
  exigeLocalizacao: boolean;
  exigeArquivo: boolean;
  lojaId: string | null;
  cargoId: string | null;
  ativo: boolean;
  recorrenciaTipo?: string;
  diasSemana?: number[];
  mensalModo?: string | null;
  diaDoMes?: number | null;
  nth?: number | null;
  weekday?: number | null;
  horarioPadrao?: string;
}

interface GrupoTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  itens: Array<{ templateId: string; template: { id: string; titulo: string; ativo: boolean } }>;
}

interface SlotConfig {
  templateId: string;
  data: string;
  horario: string;
  repetir: boolean;
  recorrenciaTipo: 'diaria' | 'semanal' | 'mensal';
  diasSemana: number[];
  dataFim: string;
  /** Quando true, omite dataFim no payload; backend usa teto de 90 dias. */
  semDataFim: boolean;
  mensalModo: 'dia_do_mes' | 'nth_weekday';
  diaDoMes: number;
  /** 1–4 ou -1 (última). */
  nth: 1 | 2 | 3 | 4 | -1;
  weekday: number;
  /**
   * Loja onde a tarefa será realizada (pode ser diferente da loja do funcionário).
   * Só relevante para templates com exigeLocalizacao = true.
   * undefined = usa a loja do funcionário (wLojaId).
   */
  lojaExecucaoId?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  StatusTarefa,
  { label: string; bg: string; text: string; border: string }
> = {
  AGENDADA: {
    label: 'Agendada',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  ENVIADA: {
    label: 'Enviada',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  AGUARDANDO_EVIDENCIA: {
    label: 'Aguardando evidência',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
  },
  CONCLUIDA: {
    label: 'Concluída',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
  },
  CONCLUIDA_COM_ATRASO: {
    label: 'Concluída c/ atraso',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  NAO_CONCLUIDA: {
    label: 'Não concluída',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
};

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const NTH_LABELS: { v: 1 | 2 | 3 | 4 | -1; label: string }[] = [
  { v: 1, label: '1ª' },
  { v: 2, label: '2ª' },
  { v: 3, label: '3ª' },
  { v: 4, label: '4ª' },
  { v: -1, label: 'Última' },
];

const WIZARD_STEPS = ['Funcionário', 'Grupo', 'Horário', 'Confirmar'];

// ── Utils ──────────────────────────────────────────────────────────────────

/** Retorna "YYYY-MM-DD" no fuso America/Sao_Paulo (evita virar o dia às 21h BRT). */
function isoDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function ptDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function ptHorario(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

function ptDataCurta(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function ultimoDiaDoMes(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function diaDoMesNoMes(year: number, month: number, diaDoMes: number): string {
  const last = ultimoDiaDoMes(year, month);
  const day = Math.min(Math.max(1, diaDoMes), last);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function nthWeekdayNoMes(
  year: number,
  month: number,
  nth: number,
  weekday: number,
): string | null {
  if (nth === -1) {
    const lastDay = ultimoDiaDoMes(year, month);
    for (let day = lastDay; day >= 1; day--) {
      const d = new Date(year, month - 1, day);
      if (d.getDay() === weekday) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  }

  let count = 0;
  const lastDay = ultimoDiaDoMes(year, month);
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === weekday) {
      count++;
      if (count === nth) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

function labelRecorrenciaMensal(slot: SlotConfig): string {
  if (slot.mensalModo === 'dia_do_mes') {
    return `Todo dia ${slot.diaDoMes}`;
  }
  const nthLabel =
    NTH_LABELS.find((n) => n.v === slot.nth)?.label ?? String(slot.nth);
  const diaLabel = DIAS_PT[slot.weekday] ?? '';
  return `Toda ${nthLabel.toLowerCase()} ${diaLabel.toLowerCase()}`;
}

/** Conta quantas atribuições serão geradas para um SlotConfig. */
function contarDatasSlot(slot: SlotConfig): number {
  if (!slot.repetir) return 1;

  const dataInicio = new Date(`${slot.data}T00:00:00`);
  // Sem dataFim (ou semDataFim) → usa teto de 90 dias, igual ao backend
  const dataFimBase =
    !slot.semDataFim && slot.dataFim
      ? new Date(`${slot.dataFim}T23:59:59`)
      : null;
  const maxDataFim = new Date(dataInicio.getTime() + 90 * 24 * 60 * 60 * 1000);
  const efetiveFim =
    dataFimBase && dataFimBase < maxDataFim ? dataFimBase : maxDataFim;

  if (slot.recorrenciaTipo === 'mensal') {
    let count = 0;
    let year = dataInicio.getFullYear();
    let month = dataInicio.getMonth() + 1;
    const fimYear = efetiveFim.getFullYear();
    const fimMonth = efetiveFim.getMonth() + 1;

    while (year < fimYear || (year === fimYear && month <= fimMonth)) {
      let dateStr: string | null = null;
      if (slot.mensalModo === 'dia_do_mes') {
        dateStr = diaDoMesNoMes(year, month, slot.diaDoMes);
      } else {
        dateStr = nthWeekdayNoMes(year, month, slot.nth, slot.weekday);
      }
      if (dateStr) {
        const d = new Date(`${dateStr}T12:00:00`);
        if (d >= dataInicio && d <= efetiveFim) count++;
      }
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return count;
  }

  let count = 0;
  const current = new Date(dataInicio);

  while (current <= efetiveFim) {
    const dow = current.getDay();
    if (
      slot.recorrenciaTipo === 'diaria' ||
      (slot.recorrenciaTipo === 'semanal' && slot.diasSemana.includes(dow))
    ) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusTarefa }) {
  const c = STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  );
}

function Modal({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`bg-[#111113] border border-[#2a2a2e] rounded-2xl w-full shadow-2xl my-6 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
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

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors';

const labelCls = 'text-xs font-medium text-gray-400 mb-1.5 block';

// ── Page ───────────────────────────────────────────────────────────────────

export default function AtribuicoesPage() {
  const router = useRouter();
  const todayRef = useRef(isoDate(new Date()));
  const today = todayRef.current;

  // ── Calendar ─────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(today);
  const [tarefas, setTarefas] = useState<TarefaItem[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);
  const [filtroLoja, setFiltroLoja] = useState('');

  // ── Reference data ────────────────────────────────────────────────────────
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [grupos, setGrupos] = useState<GrupoTemplate[]>([]);
  const [funcionariosLoja, setFuncionariosLoja] = useState<Funcionario[]>([]);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);

  // ── Wizard ────────────────────────────────────────────────────────────────
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wLojaId, setWLojaId] = useState('');
  const [wFuncionarioId, setWFuncionarioId] = useState('');
  const [wGrupoIds, setWGrupoIds] = useState<Set<string>>(new Set());
  const [wSlots, setWSlots] = useState<SlotConfig[]>([]);
  const [wSubmitting, setWSubmitting] = useState(false);
  const [wError, setWError] = useState<string | null>(null);

  // ── Mini-modals ───────────────────────────────────────────────────────────
  const [reagendarItem, setReagendarItem] = useState<TarefaItem | null>(null);
  const [reagendarData, setReagendarData] = useState('');
  const [reagendarHorario, setReagendarHorario] = useState('');
  const [reagendarSaving, setReagendarSaving] = useState(false);
  const [reagendarOutrosDias, setReagendarOutrosDias] = useState(0);
  const [reagendarAplicarOutros, setReagendarAplicarOutros] = useState(false);
  const [detalhesItem, setDetalhesItem] = useState<TarefaItem | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [cancelItem, setCancelItem] = useState<TarefaItem | null>(null);
  const [cancelOutrosDias, setCancelOutrosDias] = useState(0);
  const [cancelAplicarOutros, setCancelAplicarOutros] = useState(false);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchTarefas = useCallback(async () => {
    setLoadingTarefas(true);
    try {
      const q = new URLSearchParams({ data: selectedDate });
      if (filtroLoja) q.set('lojaId', filtroLoja);
      const res = await fetch(`/api/tarefas/atribuicoes?${q}`);
      if (res.ok) {
        const data = await res.json();
        setTarefas(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      setLoadingTarefas(false);
    }
  }, [selectedDate, filtroLoja]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/rh/lojas'),
        fetch('/api/tarefas/templates'),
        fetch('/api/tarefas/grupos'),
      ]);
      if (r1.ok) setLojas(await r1.json());
      if (r2.ok) setTemplates(await r2.json());
      if (r3.ok) {
        const data = await r3.json();
        setGrupos(Array.isArray(data) ? data.filter((g: GrupoTemplate) => g.ativo) : []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchFuncionarios = useCallback(async (lojaId: string) => {
    setLoadingFuncionarios(true);
    try {
      const res = await fetch(`/api/rh/funcionarios?lojaId=${lojaId}&ativo=true`);
      setFuncionariosLoja(res.ok ? await res.json() : []);
    } catch {
      setFuncionariosLoja([]);
    } finally {
      setLoadingFuncionarios(false);
    }
  }, []);

  useEffect(() => {
    fetchTarefas();
  }, [fetchTarefas]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // ── Grouped tarefas ───────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const lojaMap = new Map<
      string,
      {
        loja: TarefaItem['loja'];
        funcs: Map<
          string,
          { func: TarefaItem['funcionario']; tarefas: TarefaItem[] }
        >;
      }
    >();

    for (const t of tarefas) {
      if (!lojaMap.has(t.loja.id)) {
        lojaMap.set(t.loja.id, { loja: t.loja, funcs: new Map() });
      }
      const g = lojaMap.get(t.loja.id)!;
      if (!g.funcs.has(t.funcionario.id)) {
        g.funcs.set(t.funcionario.id, { func: t.funcionario, tarefas: [] });
      }
      g.funcs.get(t.funcionario.id)!.tarefas.push(t);
    }

    return Array.from(lojaMap.values()).map((g) => ({
      loja: g.loja,
      funcionarios: Array.from(g.funcs.values()),
    }));
  }, [tarefas]);

  // ── Date navigation ───────────────────────────────────────────────────────

  const prevDay = () => setSelectedDate((d) => addDays(d, -1));
  const nextDay = () => setSelectedDate((d) => addDays(d, 1));

  // ── Wizard handlers ───────────────────────────────────────────────────────

  function openWizard() {
    setWizardStep(1);
    setWLojaId('');
    setWFuncionarioId('');
    setWGrupoIds(new Set());
    setWSlots([]);
    setWError(null);
    setFuncionariosLoja([]);
    setShowWizard(true);
  }

  function closeWizard() {
    setShowWizard(false);
  }

  function handleLojaSelect(lojaId: string) {
    setWLojaId(lojaId);
    setWFuncionarioId('');
    setWGrupoIds(new Set());
    setWSlots([]);
    setWError(null);
    if (lojaId) fetchFuncionarios(lojaId);
    else setFuncionariosLoja([]);
  }

  function toggleGrupo(gid: string) {
    setWGrupoIds((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  }

  const selectedFuncionario = funcionariosLoja.find((f) => f.id === wFuncionarioId);

  const templatesCompativeis = templates.filter((t) => {
    if (!t.ativo) return false;
    if (t.lojaId && t.lojaId !== wLojaId) return false;
    if (
      t.cargoId &&
      selectedFuncionario?.cargoId &&
      t.cargoId !== selectedFuncionario.cargoId
    )
      return false;
    return true;
  });

  const gruposUteis = grupos.filter((g) =>
    g.itens.some((i) => templatesCompativeis.some((t) => t.id === i.templateId)),
  );

  const selectedTemplateIds = (() => {
    const ids = new Set<string>();
    const compatible = new Set(templatesCompativeis.map((t) => t.id));
    for (const g of grupos) {
      if (!wGrupoIds.has(g.id)) continue;
      for (const i of g.itens) {
        if (compatible.has(i.templateId)) ids.add(i.templateId);
      }
    }
    return ids;
  })();

  function goNext() {
    setWError(null);

    if (wizardStep === 1) {
      if (!wLojaId) { setWError('Selecione uma loja.'); return; }
      if (!wFuncionarioId) { setWError('Selecione um funcionário.'); return; }
      setWizardStep(2);
      return;
    }

    if (wizardStep === 2) {
      if (wGrupoIds.size === 0) {
        setWError('Selecione pelo menos um grupo de tarefas.');
        return;
      }
      if (selectedTemplateIds.size === 0) {
        setWError('Os grupos selecionados não têm tarefas compatíveis com este funcionário.');
        return;
      }
      const dayOfMonth = Number(selectedDate.split('-')[2]) || 1;
      const weekdayDefault = new Date(`${selectedDate}T12:00:00`).getDay();
      const slots: SlotConfig[] = Array.from(selectedTemplateIds).map((tid) => {
        const tpl = templates.find((t) => t.id === tid);
        const dias = (tpl?.diasSemana ?? []).filter((d) => d >= 0 && d <= 6);
        const horario =
          tpl?.horarioPadrao && /^\d{2}:\d{2}$/.test(tpl.horarioPadrao)
            ? tpl.horarioPadrao
            : '08:00';

        const isMensal = tpl?.recorrenciaTipo === 'mensal';
        const mensalModo =
          tpl?.mensalModo === 'nth_weekday' ? 'nth_weekday' : 'dia_do_mes';
        const nth =
          tpl?.nth === 2 || tpl?.nth === 3 || tpl?.nth === 4 || tpl?.nth === -1
            ? tpl.nth
            : 1;
        const weekday =
          typeof tpl?.weekday === 'number' && tpl.weekday >= 0 && tpl.weekday <= 6
            ? tpl.weekday
            : weekdayDefault;
        const diaDoMes =
          typeof tpl?.diaDoMes === 'number' &&
          tpl.diaDoMes >= 1 &&
          tpl.diaDoMes <= 31
            ? tpl.diaDoMes
            : dayOfMonth;

        return {
          templateId: tid,
          data: selectedDate,
          horario,
          repetir: isMensal || dias.length > 0,
          recorrenciaTipo: isMensal
            ? 'mensal'
            : dias.length > 0
              ? 'semanal'
              : 'diaria',
          diasSemana: dias,
          dataFim: addDays(selectedDate, 7),
          semDataFim: isMensal || dias.length > 0,
          mensalModo,
          diaDoMes,
          nth,
          weekday,
          lojaExecucaoId: wLojaId, // padrão: mesma loja do funcionário
        };
      });
      setWSlots(slots);
      setWizardStep(3);
      return;
    }

    if (wizardStep === 3) {
      for (const slot of wSlots) {
        if (!slot.data || !slot.horario) {
          setWError('Preencha data e horário em todos os templates.');
          return;
        }
        if (
          slot.repetir &&
          slot.recorrenciaTipo === 'semanal' &&
          slot.diasSemana.length === 0
        ) {
          setWError('Selecione pelo menos um dia da semana para a recorrência semanal.');
          return;
        }
        if (slot.repetir && slot.recorrenciaTipo === 'mensal') {
          if (slot.mensalModo === 'dia_do_mes') {
            if (slot.diaDoMes < 1 || slot.diaDoMes > 31) {
              setWError('Informe um dia do mês válido (1–31).');
              return;
            }
          } else if (slot.weekday < 0 || slot.weekday > 6) {
            setWError('Selecione o dia da semana para a recorrência mensal.');
            return;
          }
        }
        if (slot.repetir && !slot.semDataFim && !slot.dataFim) {
          setWError('Informe a data final da recorrência ou marque "Sem data de término".');
          return;
        }
        const dt = new Date(`${slot.data}T${slot.horario}:00`);
        // Tolerância de 60s para acomodar latência de rede
        const limitePassado = new Date(Date.now() - 60_000);
        if (isNaN(dt.getTime()) || dt <= limitePassado) {
          setWError(
            `O horário ${slot.horario} em ${ptDate(slot.data)} está no passado ou é inválido.`,
          );
          return;
        }
      }
      for (const slot of wSlots) {
        const tmpl = templates.find((t) => t.id === slot.templateId);
        if (tmpl?.exigeLocalizacao && !slot.lojaExecucaoId) {
          setWError(`Informe a loja de execução para o template "${tmpl.titulo}".`);
          return;
        }
      }
      setWizardStep(4);
      return;
    }
  }

  function goBack() {
    setWError(null);
    if (wizardStep === 2) setWizardStep(1);
    else if (wizardStep === 3) setWizardStep(2);
    else if (wizardStep === 4) setWizardStep(3);
  }

  function updateSlot<K extends keyof SlotConfig>(idx: number, key: K, val: SlotConfig[K]) {
    setWSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  }

  function toggleDiaSemana(idx: number, dow: number) {
    setWSlots((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const next = s.diasSemana.includes(dow)
          ? s.diasSemana.filter((d) => d !== dow)
          : [...s.diasSemana, dow];
        return { ...s, diasSemana: next };
      }),
    );
  }

  async function handleSubmit() {
    setWSubmitting(true);
    setWError(null);
    try {
      const slots = wSlots.map((slot) => ({
        templateId: slot.templateId,
        dataBase: slot.data,
        horario: slot.horario,
        ...(slot.lojaExecucaoId && { lojaExecucaoId: slot.lojaExecucaoId }),
        recorrencia: slot.repetir
          ? {
              tipo: slot.recorrenciaTipo,
              ...(slot.recorrenciaTipo === 'semanal' && {
                diasSemana: slot.diasSemana,
              }),
              ...(slot.recorrenciaTipo === 'mensal' && {
                mensalModo: slot.mensalModo,
                ...(slot.mensalModo === 'dia_do_mes'
                  ? { diaDoMes: slot.diaDoMes }
                  : { nth: slot.nth, weekday: slot.weekday }),
              }),
              // Sem dataFim → API materializa até o teto de 90 dias
              ...(!slot.semDataFim && slot.dataFim && { dataFim: slot.dataFim }),
            }
          : { tipo: 'unica' as const },
      }));

      const res = await fetch('/api/tarefas/atribuicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionarioId: wFuncionarioId,
          lojaId: wLojaId,
          grupoIds: Array.from(wGrupoIds),
          slots,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setWError(data.error ?? 'Erro ao criar atribuições.');
        return;
      }

      closeWizard();
      fetchTarefas();
    } finally {
      setWSubmitting(false);
    }
  }

  const totalAtribuicoes = wSlots.reduce((s, slot) => s + contarDatasSlot(slot), 0);

  // ── Reagendar ─────────────────────────────────────────────────────────────

  async function openReagendar(item: TarefaItem) {
    const d = new Date(item.dataAgendada);
    setReagendarData(isoDate(d));
    const brtTime = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    });
    setReagendarHorario(brtTime);
    setReagendarAplicarOutros(false);
    setReagendarOutrosDias(0);
    setReagendarItem(item);
    try {
      const res = await fetch(`/api/tarefas/atribuicoes/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setReagendarOutrosDias(Number(data.outrosDias) || 0);
      }
    } catch {
      // ignore
    }
  }

  async function handleReagendar() {
    if (!reagendarItem || !reagendarData || !reagendarHorario) return;
    const novaData = new Date(`${reagendarData}T${reagendarHorario}:00`);
    if (novaData <= new Date(Date.now() - 60_000)) {
      alert('A nova data/hora não pode estar no passado.');
      return;
    }
    setReagendarSaving(true);
    try {
      const res = await fetch(`/api/tarefas/atribuicoes/${reagendarItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataAgendada: novaData.toISOString(),
          aplicarOutrosDias: reagendarAplicarOutros && reagendarOutrosDias > 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Erro ao reagendar.');
        return;
      }
      setReagendarItem(null);
      fetchTarefas();
    } finally {
      setReagendarSaving(false);
    }
  }

  // ── Cancelar ──────────────────────────────────────────────────────────────

  async function openCancelar(item: TarefaItem) {
    setCancelAplicarOutros(false);
    setCancelOutrosDias(0);
    setCancelItem(item);
    try {
      const res = await fetch(`/api/tarefas/atribuicoes/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setCancelOutrosDias(Number(data.outrosDias) || 0);
      }
    } catch {
      // ignore
    }
  }

  async function handleCancelarConfirm() {
    if (!cancelItem) return;
    setCancelandoId(cancelItem.id);
    try {
      const res = await fetch(`/api/tarefas/atribuicoes/${cancelItem.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aplicarOutrosDias: cancelAplicarOutros && cancelOutrosDias > 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Erro ao cancelar.');
        return;
      }
      setCancelItem(null);
      fetchTarefas();
    } finally {
      setCancelandoId(null);
    }
  }

  // ── Maps for lookup ───────────────────────────────────────────────────────

  const templateMap = useMemo(
    () => Object.fromEntries(templates.map((t) => [t.id, t])),
    [templates],
  );
  const lojaLookup = useMemo(
    () => Object.fromEntries(lojas.map((l) => [l.id, l])),
    [lojas],
  );

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
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">
                  Atribuições
                </h1>
                <p className="text-xs text-gray-500">
                  {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''} em{' '}
                  {ptDate(selectedDate)}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openWizard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Atribuir tarefas
          </button>
        </div>

        {/* Controles de data e filtro de loja */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2">
            <button
              onClick={prevDay}
              className="p-0.5 text-gray-500 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none w-36 text-center"
            />
            <button
              onClick={nextDay}
              className="p-0.5 text-gray-500 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="px-3 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-xs text-gray-400 hover:text-white hover:bg-[#222224] transition-colors"
            >
              Hoje
            </button>
          )}

          {lojas.length > 0 && (
            <select
              value={filtroLoja}
              onChange={(e) => setFiltroLoja(e.target.value)}
              className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500/40 transition-colors"
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

        {/* Lista agrupada por loja → funcionário */}
        {loadingTarefas ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : tarefas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <CalendarClock className="w-8 h-8 text-amber-400/50" />
            </div>
            <div>
              <p className="text-white font-medium">Nenhuma tarefa agendada</p>
              <p className="text-sm text-gray-500 mt-1">
                Não há tarefas para {ptDate(selectedDate)}
              </p>
            </div>
            <button
              onClick={openWizard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Atribuir tarefas
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((g) => (
              <div key={g.loja.id}>
                {/* Loja */}
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">{g.loja.nome}</span>
                  <div className="flex-1 h-px bg-[#2a2a2e]" />
                </div>

                <div className="space-y-5 pl-5">
                  {g.funcionarios.map((fg) => (
                    <div key={fg.func.id}>
                      {/* Funcionário */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-[#2a2a2e] flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{fg.func.nome}</span>
                        {fg.func.cargo && (
                          <span className="text-xs text-gray-500">· {fg.func.cargo.nome}</span>
                        )}
                      </div>

                      {/* Tarefas do funcionário */}
                      <div className="space-y-2 pl-8">
                        {fg.tarefas.map((tarefa) => (
                          <div
                            key={tarefa.id}
                            className="bg-[#111113] border border-[#2a2a2e] rounded-xl px-4 py-3 flex items-center gap-4"
                          >
                            <div className="flex items-center gap-1.5 flex-shrink-0 w-12">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs font-mono text-gray-300">
                                {ptHorario(tarefa.dataAgendada)}
                              </span>
                            </div>

                            <span className="flex-1 text-sm text-white truncate">
                              {tarefa.template.titulo}
                            </span>

                            <StatusBadge status={tarefa.status} />

                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => setDetalhesItem(tarefa)}
                                title="Ver detalhes"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openReagendar(tarefa)}
                                title="Reagendar"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              {tarefa.status === 'AGENDADA' && (
                                <button
                                  onClick={() => openCancelar(tarefa)}
                                  disabled={cancelandoId === tarefa.id}
                                  title="Cancelar"
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                                >
                                  {cancelandoId === tarefa.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Wizard modal ─────────────────────────────────────────────────── */}
      {showWizard && (
        <Modal title="Atribuir tarefas" onClose={closeWizard} wide>
          {/* Step indicator */}
          <div className="px-6 py-4 border-b border-[#2a2a2e]">
            <div className="flex items-center gap-1">
              {WIZARD_STEPS.map((label, idx) => {
                const step = (idx + 1) as 1 | 2 | 3 | 4;
                const active = wizardStep === step;
                const done = wizardStep > step;
                return (
                  <div key={step} className="flex items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        active
                          ? 'bg-amber-500 text-black'
                          : done
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-[#2a2a2e] text-gray-500'
                      }`}
                    >
                      {done ? <Check className="w-3 h-3" /> : step}
                    </div>
                    <span
                      className={`text-xs hidden sm:inline ${active ? 'text-white' : 'text-gray-600'}`}
                    >
                      {label}
                    </span>
                    {idx < 3 && <div className="w-6 h-px bg-[#2a2a2e] mx-1" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          <div className="p-6 overflow-y-auto max-h-[58vh] space-y-5">

            {/* ── Step 1: Loja + Funcionário ───────────────────────── */}
            {wizardStep === 1 && (
              <>
                <div>
                  <p className={labelCls}>
                    Loja <span className="text-red-400">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {lojas.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleLojaSelect(l.id)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                          wLojaId === l.id
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                            : 'bg-[#0a0a0a] border-[#2a2a2e] text-gray-400 hover:border-[#3a3a3e] hover:text-white'
                        }`}
                      >
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{l.nome}</span>
                        {wLojaId === l.id && (
                          <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {lojas.length === 0 && (
                      <p className="col-span-2 text-sm text-gray-500 text-center py-4">
                        Nenhuma loja cadastrada.
                      </p>
                    )}
                  </div>
                </div>

                {wLojaId && (
                  <div>
                    <p className={labelCls}>
                      Funcionário <span className="text-red-400">*</span>
                      <span className="text-gray-600 font-normal ml-1">
                        · {lojaLookup[wLojaId]?.nome}
                      </span>
                    </p>

                    {loadingFuncionarios ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                      </div>
                    ) : funcionariosLoja.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">
                        Nenhum funcionário ativo nesta loja.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {funcionariosLoja.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setWFuncionarioId(f.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                              wFuncionarioId === f.id
                                ? 'bg-amber-500/10 border-amber-500/40'
                                : 'bg-[#0a0a0a] border-[#2a2a2e] hover:border-[#3a3a3e]'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#2a2a2e] flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  wFuncionarioId === f.id ? 'text-amber-300' : 'text-white'
                                }`}
                              >
                                {f.nome}
                              </p>
                              {f.cargo && (
                                <p className="text-xs text-gray-500">{f.cargo.nome}</p>
                              )}
                            </div>
                            {wFuncionarioId === f.id && (
                              <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Step 2: Grupos ──────────────────────────────────── */}
            {wizardStep === 2 && (
              <>
                <p className="text-xs text-gray-500">
                  Selecione um ou mais grupos. As tarefas do grupo serão atribuídas ao
                  funcionário.{' '}
                  <span className="text-amber-400">
                    {wGrupoIds.size} grupo{wGrupoIds.size !== 1 ? 's' : ''} ·{' '}
                    {selectedTemplateIds.size} tarefa
                    {selectedTemplateIds.size !== 1 ? 's' : ''}
                  </span>
                </p>

                {gruposUteis.length === 0 ? (
                  <div className="py-10 text-center">
                    <Layers className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Nenhum grupo compatível encontrado.
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Crie um grupo com tarefas ativas para esta loja e cargo.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/tarefas/grupos')}
                      className="mt-4 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400"
                    >
                      Ir para grupos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {gruposUteis.map((g) => {
                      const idsCompativeis = new Set(templatesCompativeis.map((t) => t.id));
                      const doGrupo = g.itens
                        .map((i) => i.templateId)
                        .filter((id) => idsCompativeis.has(id));
                      const sel = wGrupoIds.has(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGrupo(g.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            sel
                              ? 'bg-violet-500/15 border-violet-500/40'
                              : 'bg-[#0a0a0a] border-[#2a2a2e] hover:border-violet-500/30'
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
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium ${
                                sel ? 'text-violet-200' : 'text-white'
                              }`}
                            >
                              {g.nome}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {doGrupo.length} tarefa
                              {doGrupo.length === 1 ? '' : 's'} compatível
                              {doGrupo.length === 1 ? '' : 'eis'} neste contexto
                              {g.descricao ? ` · ${g.descricao}` : ''}
                            </p>
                            {sel && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {g.itens
                                  .filter((i) => idsCompativeis.has(i.templateId))
                                  .map((i) => (
                                    <span
                                      key={i.templateId}
                                      className="text-xs px-2 py-0.5 rounded-lg border border-violet-500/20 text-violet-300 bg-violet-500/5"
                                    >
                                      {i.template.titulo}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Step 3: Horário e recorrência por template ───────── */}
            {wizardStep === 3 && (
              <div className="space-y-5">
                {wSlots.map((slot, idx) => {
                  const tmpl = templateMap[slot.templateId];
                  const nDatas = contarDatasSlot(slot);
                  const semanalSemDias =
                    slot.repetir &&
                    slot.recorrenciaTipo === 'semanal' &&
                    slot.diasSemana.length === 0;
                  const mensalIncompleto =
                    slot.repetir &&
                    slot.recorrenciaTipo === 'mensal' &&
                    slot.mensalModo === 'nth_weekday' &&
                    (slot.weekday < 0 || slot.weekday > 6);

                  return (
                    <div
                      key={slot.templateId}
                      className="bg-[#0d0d0f] border border-[#2a2a2e] rounded-2xl p-4 space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-white">
                          {tmpl?.titulo ?? slot.templateId}
                        </span>
                        {tmpl?.exigeLocalizacao && (
                          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-lg">
                            📍 verificação de local
                          </span>
                        )}
                      </div>

                      {/* Loja de execução — só para templates com exigeLocalizacao */}
                      {tmpl?.exigeLocalizacao && (
                        <div>
                          <label className={labelCls}>
                            Em qual loja será realizada? <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={slot.lojaExecucaoId ?? wLojaId}
                            onChange={(e) => updateSlot(idx, 'lojaExecucaoId', e.target.value)}
                            className={inputCls}
                          >
                            {lojas.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.nome}{l.id === wLojaId ? ' (loja do funcionário)' : ''}
                              </option>
                            ))}
                          </select>
                          {(slot.lojaExecucaoId && slot.lojaExecucaoId !== wLojaId) && (
                            <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Localização verificada na loja selecionada, não na do funcionário.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Data + Horário (campo único) */}
                      <div>
                        <label className={labelCls}>
                          Data e horário limite <span className="text-red-400">*</span>
                        </label>
                        <DateTimePicker
                          date={slot.data}
                          time={slot.horario}
                          minDate={new Date(`${today}T00:00:00`)}
                          onDateChange={(d) => {
                            setWSlots((prev) =>
                              prev.map((s, i) => {
                                if (i !== idx) return s;
                                const next = { ...s, data: d };
                                // Mantém dataFim válida em relação ao novo início
                                if (
                                  !s.semDataFim &&
                                  s.dataFim &&
                                  s.dataFim <= d
                                ) {
                                  next.dataFim = addDays(d, 7);
                                }
                                return next;
                              }),
                            );
                          }}
                          onTimeChange={(t) => updateSlot(idx, 'horario', t)}
                        />
                      </div>

                      {/* Toggle repetir */}
                      <label className="flex items-center gap-2.5 cursor-pointer w-fit select-none">
                        <button
                          type="button"
                          onClick={() => updateSlot(idx, 'repetir', !slot.repetir)}
                          className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                            slot.repetir ? 'bg-amber-500' : 'bg-[#3a3a3e]'
                          }`}
                          aria-checked={slot.repetir}
                          role="switch"
                        >
                          <span
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                            style={{ left: slot.repetir ? '18px' : '2px' }}
                          />
                        </button>
                        <span className="text-sm text-gray-300">Repetir esta tarefa</span>
                      </label>

                      {slot.repetir && (
                        <div className="space-y-4">
                          {/* Tipo de recorrência */}
                          <div>
                            <label className={labelCls}>Tipo de recorrência</label>
                            <div className="flex gap-2 flex-wrap">
                              {(
                                [
                                  { v: 'diaria', label: 'Diária' },
                                  { v: 'semanal', label: 'Dias da semana' },
                                  { v: 'mensal', label: 'Mensal' },
                                ] as const
                              ).map(({ v, label }) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => updateSlot(idx, 'recorrenciaTipo', v)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                    slot.recorrenciaTipo === v
                                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                      : 'bg-[#0a0a0a] border-[#2a2a2e] text-gray-400 hover:text-white'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Dias da semana */}
                          {slot.recorrenciaTipo === 'semanal' && (
                            <div>
                              <label className={labelCls}>
                                Dias da semana{' '}
                                <span className="text-red-400">*</span>
                              </label>
                              <div className="flex gap-1.5 flex-wrap">
                                {DIAS_PT.map((dia, dow) => (
                                  <button
                                    key={dow}
                                    type="button"
                                    onClick={() => toggleDiaSemana(idx, dow)}
                                    className={`w-10 h-10 rounded-xl text-xs font-medium border transition-colors ${
                                      slot.diasSemana.includes(dow)
                                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                        : 'bg-[#0a0a0a] border-[#2a2a2e] text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    {dia}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mensal */}
                          {slot.recorrenciaTipo === 'mensal' && (
                            <div className="space-y-3">
                              <div>
                                <label className={labelCls}>Como repetir</label>
                                <div className="flex gap-2 flex-wrap">
                                  {(
                                    [
                                      { v: 'dia_do_mes', label: 'Dia do mês' },
                                      { v: 'nth_weekday', label: 'Dia da semana' },
                                    ] as const
                                  ).map(({ v, label }) => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => updateSlot(idx, 'mensalModo', v)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                        slot.mensalModo === v
                                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                          : 'bg-[#0a0a0a] border-[#2a2a2e] text-gray-400 hover:text-white'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {slot.mensalModo === 'dia_do_mes' ? (
                                <div>
                                  <label className={labelCls}>
                                    Dia do mês <span className="text-red-400">*</span>
                                  </label>
                                  <select
                                    value={slot.diaDoMes}
                                    onChange={(e) =>
                                      updateSlot(idx, 'diaDoMes', Number(e.target.value))
                                    }
                                    className={inputCls}
                                  >
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                      <option key={d} value={d}>
                                        Todo dia {d}
                                      </option>
                                    ))}
                                  </select>
                                  {slot.diaDoMes >= 29 && (
                                    <p className="text-xs text-gray-500 mt-1.5">
                                      Em meses sem esse dia, usa o último dia do mês.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <label className={labelCls}>
                                      Qual ocorrência <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-1.5 flex-wrap">
                                      {NTH_LABELS.map(({ v, label }) => (
                                        <button
                                          key={v}
                                          type="button"
                                          onClick={() => updateSlot(idx, 'nth', v)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                            slot.nth === v
                                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                              : 'bg-[#0a0a0a] border-[#2a2a2e] text-gray-400 hover:text-white'
                                          }`}
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <label className={labelCls}>
                                      Dia da semana <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-1.5 flex-wrap">
                                      {DIAS_PT.map((dia, dow) => (
                                        <button
                                          key={dow}
                                          type="button"
                                          onClick={() => updateSlot(idx, 'weekday', dow)}
                                          className={`w-10 h-10 rounded-xl text-xs font-medium border transition-colors ${
                                            slot.weekday === dow
                                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                              : 'bg-[#0a0a0a] border-[#2a2a2e] text-gray-400 hover:text-white'
                                          }`}
                                        >
                                          {dia}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sem data de término */}
                          <label className="flex items-center gap-2.5 cursor-pointer w-fit select-none">
                            <button
                              type="button"
                              onClick={() => {
                                setWSlots((prev) =>
                                  prev.map((s, i) => {
                                    if (i !== idx) return s;
                                    const nextSem = !s.semDataFim;
                                    return {
                                      ...s,
                                      semDataFim: nextSem,
                                      dataFim: nextSem
                                        ? ''
                                        : s.dataFim || addDays(s.data, 7),
                                    };
                                  }),
                                );
                              }}
                              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                                slot.semDataFim ? 'bg-amber-500' : 'bg-[#3a3a3e]'
                              }`}
                              aria-checked={slot.semDataFim}
                              role="switch"
                            >
                              <span
                                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                                style={{ left: slot.semDataFim ? '18px' : '2px' }}
                              />
                            </button>
                            <span className="text-sm text-gray-300">Sem data de término</span>
                          </label>

                          {/* Data final */}
                          {!slot.semDataFim && (
                            <div>
                              <label className={labelCls}>
                                Data final{' '}
                                <span className="text-red-400">*</span>{' '}
                                <span className="text-gray-600 font-normal">
                                  (máx. 90 dias)
                                </span>
                              </label>
                              <DatePicker
                                date={slot.dataFim}
                                minDate={new Date(`${addDays(slot.data, 1)}T00:00:00`)}
                                maxDate={new Date(`${addDays(slot.data, 90)}T00:00:00`)}
                                onDateChange={(d) => updateSlot(idx, 'dataFim', d)}
                                placeholder="Escolher data final"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preview de atribuições */}
                      <p className="text-xs text-gray-500">
                        {semanalSemDias ? (
                          <span className="text-red-400">
                            Selecione ao menos um dia da semana
                          </span>
                        ) : mensalIncompleto ? (
                          <span className="text-red-400">
                            Selecione o dia da semana
                          </span>
                        ) : (
                          <>
                            Serão criadas{' '}
                            <span className="text-amber-400 font-semibold">{nDatas}</span>{' '}
                            atribuiç{nDatas === 1 ? 'ão' : 'ões'}
                            {slot.repetir && slot.semDataFim && (
                              <span className="text-gray-600">
                                {' '}
                                (próx. 90 dias; renovação automática)
                              </span>
                            )}
                            {slot.repetir && slot.recorrenciaTipo === 'mensal' && (
                              <span className="text-gray-600">
                                {' '}
                                · {labelRecorrenciaMensal(slot)}
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Step 4: Revisão e confirmação ───────────────────── */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                {/* Cabeçalho do resumo */}
                <div className="bg-[#0d0d0f] border border-[#2a2a2e] rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Resumo
                  </p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-white">
                      {lojaLookup[wLojaId]?.nome ?? wLojaId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-white">
                      {selectedFuncionario?.nome ?? wFuncionarioId}
                    </span>
                    {selectedFuncionario?.cargo && (
                      <span className="text-xs text-gray-500">
                        · {selectedFuncionario.cargo.nome}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                    <span className="text-sm text-white">
                      {grupos
                        .filter((g) => wGrupoIds.has(g.id))
                        .map((g) => g.nome)
                        .join(', ') || '—'}
                    </span>
                  </div>
                </div>

                {/* Por template */}
                <div className="space-y-2">
                  {wSlots.map((slot) => {
                    const tmpl = templateMap[slot.templateId];
                    const n = contarDatasSlot(slot);
                    return (
                      <div
                        key={slot.templateId}
                        className="bg-[#0d0d0f] border border-[#2a2a2e] rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {tmpl?.titulo}
                          </span>
                          <span className="text-xs text-amber-400 font-semibold">
                            {n}×
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {ptDate(slot.data)}
                            {slot.repetir &&
                              (slot.semDataFim
                                ? ' → sem término'
                                : slot.dataFim
                                  ? ` → ${ptDate(slot.dataFim)}`
                                  : '')}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.horario}
                          </span>
                          {slot.repetir && (
                            <span className="text-xs text-gray-500">
                              {slot.recorrenciaTipo === 'diaria'
                                ? 'Diária'
                                : slot.recorrenciaTipo === 'mensal'
                                  ? labelRecorrenciaMensal(slot)
                                  : slot.diasSemana.map((d) => DIAS_PT[d]).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                  <span className="text-3xl font-bold text-amber-400">{totalAtribuicoes}</span>
                  <p className="text-sm text-amber-300 mt-0.5">
                    atribuiç{totalAtribuicoes === 1 ? 'ão' : 'ões'} serão criadas
                  </p>
                </div>
              </div>
            )}

            {/* Erro (todos os steps) */}
            {wError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {wError}
              </p>
            )}
          </div>

          {/* Wizard footer */}
          <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-[#2a2a2e]">
            <button
              onClick={wizardStep === 1 ? closeWizard : goBack}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              {wizardStep === 1 ? 'Cancelar' : 'Voltar'}
            </button>

            {wizardStep < 4 ? (
              <button
                onClick={goNext}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={wSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {wSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {wSubmitting
                  ? 'Criando...'
                  : `Criar ${totalAtribuicoes} atribuiç${totalAtribuicoes === 1 ? 'ão' : 'ões'}`}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* ── Reagendar modal ───────────────────────────────────────────────── */}
      {reagendarItem && (
        <Modal title="Reagendar tarefa" onClose={() => setReagendarItem(null)}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-400">
              Reagendando:{' '}
              <span className="text-white font-medium">{reagendarItem.template.titulo}</span>
              <br />
              Para:{' '}
              <span className="text-white">{reagendarItem.funcionario.nome}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nova data</label>
                <input
                  type="date"
                  value={reagendarData}
                  onChange={(e) => setReagendarData(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Novo horário</label>
                <input
                  type="time"
                  value={reagendarHorario}
                  onChange={(e) => setReagendarHorario(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            {reagendarOutrosDias > 0 && (
              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#0a0a0a] border border-[#2a2a2e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={reagendarAplicarOutros}
                  onChange={(e) => setReagendarAplicarOutros(e.target.checked)}
                  className="mt-0.5 accent-amber-500"
                />
                <span className="text-sm text-gray-300">
                  Aplicar o novo horário também nos{' '}
                  <span className="text-amber-400 font-medium">
                    {reagendarOutrosDias} outro{reagendarOutrosDias === 1 ? '' : 's'} dia
                    {reagendarOutrosDias === 1 ? '' : 's'}
                  </span>{' '}
                  agendados desta mesma tarefa (mesma pessoa / loja).
                </span>
              </label>
            )}
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={() => setReagendarItem(null)}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleReagendar}
              disabled={reagendarSaving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {reagendarSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {reagendarSaving ? 'Salvando...' : 'Reagendar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Cancelar modal ────────────────────────────────────────────────── */}
      {cancelItem && (
        <Modal title="Excluir atribuição" onClose={() => setCancelItem(null)}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-300">
              Excluir{' '}
              <span className="text-white font-medium">"{cancelItem.template.titulo}"</span> de{' '}
              <span className="text-white">{cancelItem.funcionario.nome}</span>? Esta ação não
              pode ser desfeita.
            </p>
            {cancelOutrosDias > 0 && (
              <label className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelAplicarOutros}
                  onChange={(e) => setCancelAplicarOutros(e.target.checked)}
                  className="mt-0.5 accent-red-500"
                />
                <span className="text-sm text-gray-300">
                  Excluir também dos{' '}
                  <span className="text-red-400 font-medium">
                    {cancelOutrosDias} outro{cancelOutrosDias === 1 ? '' : 's'} dia
                    {cancelOutrosDias === 1 ? '' : 's'}
                  </span>{' '}
                  agendados desta mesma tarefa.
                </span>
              </label>
            )}
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={() => setCancelItem(null)}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleCancelarConfirm}
              disabled={cancelandoId === cancelItem.id}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {cancelandoId === cancelItem.id && <Loader2 className="w-4 h-4 animate-spin" />}
              Excluir
            </button>
          </div>
        </Modal>
      )}

      {/* ── Detalhes modal ────────────────────────────────────────────────── */}
      {detalhesItem && (
        <Modal title="Detalhes da tarefa" onClose={() => setDetalhesItem(null)}>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Template
              </p>
              <p className="text-base font-semibold text-white">
                {detalhesItem.template.titulo}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Funcionário
                </p>
                <p className="text-sm text-white">{detalhesItem.funcionario.nome}</p>
                {detalhesItem.funcionario.cargo && (
                  <p className="text-xs text-gray-500">
                    {detalhesItem.funcionario.cargo.nome}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Loja
                </p>
                <p className="text-sm text-white">{detalhesItem.loja.nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Data agendada
                </p>
                <p className="text-sm text-white">
                  {ptDataCurta(detalhesItem.dataAgendada)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Horário limite
                </p>
                <p className="text-sm font-mono text-white">
                  {ptHorario(detalhesItem.dataAgendada)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Status
              </p>
              <StatusBadge status={detalhesItem.status} />
            </div>
          </div>
          <div className="px-6 pb-6">
            <button
              onClick={() => setDetalhesItem(null)}
              className="w-full py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              Fechar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
