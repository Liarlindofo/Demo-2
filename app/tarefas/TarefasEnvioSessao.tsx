'use client';

import { useEffect, useState } from 'react';
import { Loader2, Smartphone } from 'lucide-react';

interface SessionOpt {
  slot: number;
  label: string;
  isConnected: boolean;
  connectedNumber: string | null;
}

export function TarefasEnvioSessao() {
  const [sessions, setSessions] = useState<SessionOpt[]>([]);
  const [sessionSlot, setSessionSlot] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tarefas/envio-sessao');
        if (res.ok) {
          const data = await res.json();
          setSessions(Array.isArray(data.sessions) ? data.sessions : []);
          setSessionSlot(Number(data.sessionSlot) || 1);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(nextSlot: number) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/tarefas/envio-sessao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionSlot: nextSlot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || 'Falha ao salvar');
        return;
      }
      setSessionSlot(nextSlot);
      setMsg('Sessão de envio atualizada.');
    } finally {
      setSaving(false);
    }
  }

  const selected = sessions.find((s) => s.slot === sessionSlot);

  return (
    <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white text-base">Sessão de envio</h2>
          <p className="text-sm text-gray-400">
            Número que dispara digest, pendentes e fechamento das tarefas.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      ) : (
        <>
          <select
            value={sessionSlot}
            onChange={(e) => save(Number(e.target.value))}
            disabled={saving || sessions.length === 0}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40"
          >
            {sessions.length === 0 && <option value={1}>Nenhuma sessão conectada</option>}
            {sessions.map((s) => (
              <option key={s.slot} value={s.slot}>
                {s.label}
                {s.connectedNumber ? ` · ${s.connectedNumber}` : ''}
                {s.isConnected ? '' : ' (desconectada)'}
              </option>
            ))}
          </select>
          {selected && !selected.isConnected && (
            <p className="text-xs text-amber-400">
              Esta sessão está desconectada. Reconecte em Conexões para os envios funcionarem.
            </p>
          )}
          {msg && <p className="text-xs text-gray-500">{msg}</p>}
        </>
      )}
    </div>
  );
}
