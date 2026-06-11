'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, Plus, Settings2, UserX, UserCheck,
  Mail, Clock, RefreshCw, Shield, AlertTriangle,
} from 'lucide-react';
import { PERMISSION_LABELS } from '@/lib/rh-permissions';

interface TeamMember {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  stackUserId: string | null;
  acceptedAt: string | null;
  createdAt: string;
  permissions: string[];
}

export default function UsuariosRhPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rh/usuarios');
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) return;
      setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAtivo = async (member: TeamMember) => {
    setDeactivating(member.id);
    try {
      await fetch(`/api/rh/usuarios/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      await load();
    } finally {
      setDeactivating(null);
    }
  };

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <p className="text-white font-semibold">Acesso restrito</p>
          <p className="text-sm text-gray-400">Esta área é exclusiva para Administradores.</p>
          <button onClick={() => router.push('/rh')}
            className="mt-2 px-4 py-2 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl text-sm text-gray-300 hover:bg-[#2a2a2e]"
          >Voltar ao RH</button>
        </div>
      </div>
    );
  }

  const ativos = members.filter(m => m.isActive);
  const inativos = members.filter(m => !m.isActive);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rh')}
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-400" />
              Usuários de RH
            </h1>
            <p className="text-sm text-gray-400">Gerencie quem tem acesso ao módulo RH e suas permissões</p>
          </div>
          <button
            onClick={() => router.push('/rh/usuarios/novo')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> Convidar usuário
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            {/* Ativos */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a2e] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Usuários ativos
                  <span className="text-xs text-gray-500 font-normal">({ativos.length})</span>
                </h2>
              </div>

              {ativos.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  Nenhum usuário convidado ainda. Clique em &quot;Convidar usuário&quot; para começar.
                </div>
              ) : (
                <div className="divide-y divide-[#2a2a2e]">
                  {ativos.map(member => (
                    <div key={member.id} className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#2a2a2e] flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-gray-300">
                            {(member.displayName ?? member.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {member.displayName ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {member.email}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {member.stackUserId ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <UserCheck className="w-3 h-3" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Aguardando login
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => router.push(`/rh/usuarios/${member.id}/permissoes`)}
                            className="p-2 rounded-lg bg-[#2a2a2e] hover:bg-[#3a3a3e] transition-colors"
                            title="Gerenciar permissões"
                          >
                            <Settings2 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => toggleAtivo(member)}
                            disabled={deactivating === member.id}
                            className="p-2 rounded-lg bg-[#2a2a2e] hover:bg-red-500/20 transition-colors"
                            title="Desativar usuário"
                          >
                            {deactivating === member.id
                              ? <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                              : <UserX className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            }
                          </button>
                        </div>
                      </div>
                      {member.permissions.length > 0 && (
                        <div className="mt-2 pl-12 flex flex-wrap gap-1">
                          {member.permissions.slice(0, 5).map(p => (
                            <span key={p} className="text-[10px] text-gray-500 bg-[#2a2a2e] px-1.5 py-0.5 rounded">
                              {PERMISSION_LABELS[p] ?? p}
                            </span>
                          ))}
                          {member.permissions.length > 5 && (
                            <span className="text-[10px] text-gray-600 bg-[#2a2a2e] px-1.5 py-0.5 rounded">
                              +{member.permissions.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inativos */}
            {inativos.length > 0 && (
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2a2a2e]">
                  <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                    <UserX className="w-4 h-4" />
                    Usuários desativados
                    <span className="text-xs font-normal">({inativos.length})</span>
                  </h2>
                </div>
                <div className="divide-y divide-[#2a2a2e]">
                  {inativos.map(member => (
                    <div key={member.id} className="px-4 py-3 opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#2a2a2e] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-500">
                            {(member.displayName ?? member.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-400">{member.displayName ?? '—'}</p>
                          <p className="text-xs text-gray-600">{member.email}</p>
                        </div>
                        <button
                          onClick={() => toggleAtivo(member)}
                          disabled={deactivating === member.id}
                          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          Reativar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
