'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Shield, CheckCircle, XCircle, Loader2, User } from 'lucide-react';

interface PermissionItem {
  permission: string;
  active: boolean;
}

interface PermissionGroup {
  label: string;
  permissions: PermissionItem[];
}

interface MemberData {
  memberId: string;
  email: string;
  displayName: string | null;
  groups: PermissionGroup[];
}

const PERMISSION_LABELS: Record<string, string> = {
  'employees.view':       'Visualizar funcionários',
  'employees.create':     'Cadastrar funcionários',
  'employees.edit':       'Editar funcionários',
  'employees.deactivate': 'Inativar funcionários',
  'riders.view':          'Visualizar motoboys',
  'riders.create':        'Cadastrar motoboys',
  'riders.edit':          'Editar motoboys',
  'riders.deactivate':    'Inativar motoboys',
  'riders.launch_period': 'Lançar quinzenas',
  'riders.approve_docs':  'Aprovar/rejeitar documentos',
  'rh.view_salary':       'Visualizar salários e valores',
  'rh.edit_salary':       'Editar salários e valores',
};

export default function PermissoesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  // toggling: permission → 'loading' | 'ok' | 'error' | null
  const [toggling, setToggling] = useState<Record<string, 'loading' | 'ok' | 'error'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rh/usuarios/${params.id}/permissoes`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (permission: string, currentActive: boolean) => {
    setToggling(t => ({ ...t, [permission]: 'loading' }));
    try {
      const res = await fetch(`/api/rh/usuarios/${params.id}/permissoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission, active: !currentActive }),
      });

      const status = res.ok ? 'ok' : 'error';
      setToggling(t => ({ ...t, [permission]: status }));

      if (res.ok) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            groups: prev.groups.map(g => ({
              ...g,
              permissions: g.permissions.map(p =>
                p.permission === permission ? { ...p, active: !currentActive } : p
              ),
            })),
          };
        });
      }

      setTimeout(() => setToggling(t => { const n = { ...t }; delete n[permission]; return n; }), 1500);
    } catch {
      setToggling(t => ({ ...t, [permission]: 'error' }));
      setTimeout(() => setToggling(t => { const n = { ...t }; delete n[permission]; return n; }), 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-gray-400">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rh/usuarios')}
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-400" />
              Permissões
            </h1>
            <p className="text-sm text-gray-400">Cada toggle salva imediatamente</p>
          </div>
        </div>

        {/* Usuário */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2a2a2e] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{data.displayName ?? '—'}</p>
            <p className="text-xs text-gray-500">{data.email}</p>
          </div>
        </div>

        {/* Grupos de permissão */}
        {data.groups.map(group => (
          <div key={group.label} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a2e]">
              <h2 className="text-sm font-semibold text-amber-400">{group.label}</h2>
            </div>
            <div className="divide-y divide-[#2a2a2e]">
              {group.permissions.map(item => {
                const state = toggling[item.permission];
                return (
                  <div key={item.permission} className="px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-white">
                      {PERMISSION_LABELS[item.permission] ?? item.permission}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {state === 'ok' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {state === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                      {state === 'loading' ? (
                        <div className="w-11 h-6 rounded-full bg-[#2a2a2e] flex items-center justify-center">
                          <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                        </div>
                      ) : (
                        <button
                          onClick={() => toggle(item.permission, item.active)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            item.active ? 'bg-amber-500' : 'bg-[#3a3a3e]'
                          }`}
                          aria-label={item.active ? 'Desativar' : 'Ativar'}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            item.active ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Nota */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-xs text-gray-500">
          Usuários de RH começam sem nenhuma permissão. As permissões aqui configuradas
          entram em vigor imediatamente — sem necessidade de relogin.
        </div>
      </div>
    </div>
  );
}
