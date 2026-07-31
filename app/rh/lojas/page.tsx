'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  MapPin,
  Hash,
  Search,
  Navigation,
} from 'lucide-react';

interface Loja {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  raioVerificacaoM: number;
  ativo: boolean;
}

interface LojaForm {
  nome: string;
  cnpj: string;
  endereco: string;
  latitude: string;
  longitude: string;
  raioVerificacaoM: string;
}

const EMPTY_FORM: LojaForm = {
  nome: '', cnpj: '', endereco: '',
  latitude: '', longitude: '', raioVerificacaoM: '300',
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl w-full max-w-md shadow-2xl">
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

export default function LojasPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [form, setForm] = useState<LojaForm>(EMPTY_FORM);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState<string | null>(null);

  const fetchLojas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rh/lojas');
      if (res.ok) {
        const data = await res.json();
        setLojas(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLojas();
  }, [fetchLojas]);

  function openCreate() {
    setEditingLoja(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEdit(loja: Loja) {
    setEditingLoja(loja);
    setForm({
      nome: loja.nome,
      cnpj: loja.cnpj ?? '',
      endereco: loja.endereco ?? '',
      latitude: loja.latitude != null ? String(loja.latitude) : '',
      longitude: loja.longitude != null ? String(loja.longitude) : '',
      raioVerificacaoM: String(loja.raioVerificacaoM ?? 300),
    });
    setError(null);
    setGeocodeMsg(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingLoja(null);
    setForm(EMPTY_FORM);
    setError(null);
    setGeocodeMsg(null);
  }

  async function handleGeocode() {
    if (!editingLoja) return;
    setGeocoding(true);
    setGeocodeMsg(null);
    try {
      const body: Record<string, string> = {};
      if (form.endereco.trim()) body.endereco = form.endereco.trim();
      const res = await fetch(`/api/rh/lojas/${editingLoja.id}/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGeocodeMsg(`Erro: ${data.error ?? 'Falha ao geocodificar.'}`);
        return;
      }
      setForm((f) => ({
        ...f,
        latitude: String(data.latitude),
        longitude: String(data.longitude),
      }));
      setGeocodeMsg(`Coordenadas encontradas: ${data.displayName?.slice(0, 80) ?? ''}`);
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      setError('O nome da loja é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const lat  = form.latitude.trim()  !== '' ? parseFloat(form.latitude)  : null;
      const lng  = form.longitude.trim() !== '' ? parseFloat(form.longitude) : null;
      const raio = form.raioVerificacaoM.trim() !== '' ? parseInt(form.raioVerificacaoM) : 300;
      const payload = {
        nome: form.nome.trim(),
        cnpj: form.cnpj.trim() || null,
        endereco: form.endereco.trim() || null,
        latitude:         isNaN(lat as number)  ? null : lat,
        longitude:        isNaN(lng as number)  ? null : lng,
        raioVerificacaoM: isNaN(raio)           ? 300  : raio,
      };

      let res: Response;
      if (editingLoja) {
        res = await fetch(`/api/rh/lojas/${editingLoja.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/rh/lojas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Erro ao salvar loja.');
        return;
      }

      closeModal();
      fetchLojas();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(loja: Loja) {
    setTogglingId(loja.id);
    try {
      await fetch(`/api/rh/lojas/${loja.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !loja.ativo }),
      });
      fetchLojas();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(loja: Loja) {
    if (!confirm(`Excluir a loja "${loja.nome}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(loja.id);
    try {
      const res = await fetch(`/api/rh/lojas/${loja.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Erro ao excluir loja.');
        return;
      }
      fetchLojas();
    } finally {
      setDeletingId(null);
    }
  }

  const ativas = lojas.filter((l) => l.ativo);
  const inativas = lojas.filter((l) => !l.ativo);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/rh')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">Lojas / Unidades</h1>
                <p className="text-xs text-gray-500">
                  {ativas.length} ativa{ativas.length !== 1 ? 's' : ''}
                  {inativas.length > 0 && ` · ${inativas.length} inativa${inativas.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova loja
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : lojas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-amber-400/50" />
            </div>
            <div>
              <p className="text-white font-medium">Nenhuma loja cadastrada</p>
              <p className="text-sm text-gray-500 mt-1">Crie sua primeira loja para começar</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar loja
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...ativas, ...inativas].map((loja) => (
              <div
                key={loja.id}
                className={`bg-[#111113] border rounded-2xl p-5 flex items-start gap-4 transition-colors ${
                  loja.ativo ? 'border-[#2a2a2e]' : 'border-[#2a2a2e] opacity-60'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{loja.nome}</span>
                    {!loja.ativo && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 text-xs border border-gray-700">
                        Inativa
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    {loja.cnpj && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {loja.cnpj}
                      </p>
                    )}
                    {loja.endereco && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {loja.endereco}
                      </p>
                    )}
                    {loja.latitude != null && loja.longitude != null ? (
                      <p className="text-xs text-green-500/70 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {loja.latitude.toFixed(5)}, {loja.longitude.toFixed(5)}
                        <span className="text-gray-600 ml-1">({loja.raioVerificacaoM} m)</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Localização não configurada
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Ativar/Desativar */}
                  <button
                    onClick={() => handleToggle(loja)}
                    disabled={togglingId === loja.id}
                    title={loja.ativo ? 'Desativar' : 'Ativar'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                  >
                    {togglingId === loja.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : loja.ativo ? (
                      <ToggleRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => openEdit(loja)}
                    title="Editar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => handleDelete(loja)}
                    disabled={deletingId === loja.id}
                    title="Excluir"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    {deletingId === loja.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {showModal && (
        <Modal title={editingLoja ? 'Editar loja' : 'Nova loja'} onClose={closeModal}>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Nome da loja <span className="text-red-400">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Unidade Centro"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">CNPJ</label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                placeholder="Rua, número, bairro, cidade"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            {/* Localização para verificação de tarefas */}
            <div className="border-t border-[#2a2a2e] pt-4">
              <p className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-amber-500" />
                Localização para verificação de tarefas
              </p>

              {editingLoja && (
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding}
                  className="mb-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {geocoding
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Search className="w-3.5 h-3.5" />}
                  {geocoding ? 'Buscando...' : 'Buscar coordenadas pelo endereço'}
                </button>
              )}

              {geocodeMsg && (
                <p className={`text-xs mb-3 rounded-lg px-3 py-2 border ${geocodeMsg.startsWith('Erro')
                  ? 'text-red-400 bg-red-500/10 border-red-500/20'
                  : 'text-green-400 bg-green-500/10 border-green-500/20'}`}>
                  {geocodeMsg}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                    placeholder="-23.5505"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                    placeholder="-46.6333"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Raio de verificação (metros)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={form.raioVerificacaoM}
                  onChange={(e) => setForm((f) => ({ ...f, raioVerificacaoM: e.target.value }))}
                  placeholder="300"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors"
                />
                <p className="text-xs text-gray-600 mt-1">Distância máxima aceita para confirmar que o funcionário está na loja (padrão: 300 m).</p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Salvando...' : editingLoja ? 'Salvar alterações' : 'Criar loja'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
