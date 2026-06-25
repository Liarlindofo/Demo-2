'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bike, Plus, ArrowLeft, Search, Filter,
  UserCheck, UserX, Clock, ChevronRight, Mail,
} from 'lucide-react';

interface Loja { id: string; nome: string }
interface Rider {
  id: string; name: string; cnpj: string; email: string;
  phone: string | null; status: string; passwordHash: string | null;
  lojaId: string; loja: { nome: string };
}

const fmt = (cnpj: string) => cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
const statusColor: Record<string, string> = {
  active: 'text-green-400 bg-green-500/10',
  inactive: 'text-gray-400 bg-gray-500/10',
};
const statusLabel: Record<string, string> = { active: 'Ativo', inactive: 'Inativo' };

export default function MotoboyListPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('active');

  useEffect(() => {
    fetch('/api/rh/lojas').then(r => r.ok ? r.json() : []).then(setLojas).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroLoja) params.set('lojaId', filtroLoja);
    if (filtroStatus) params.set('status', filtroStatus);
    fetch(`/api/rh/motoboys?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setRiders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filtroLoja, filtroStatus]);

  const filtrados = riders.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/rh')} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Bike className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Motoboys</h1>
                <p className="text-xs text-gray-500">Gestão de entregadores e quinzenas</p>
              </div>
            </div>
          </div>
          <Link href="/rh/motoboys/novo"
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 transition-colors">
            <Plus className="w-4 h-4" /> Cadastrar Motoboy
          </Link>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <select
            value={filtroLoja} onChange={(e) => setFiltroLoja(e.target.value)}
            className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="">Todas as lojas</option>
            {lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <select
            value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map(i => <div key={i} className="h-20 bg-[#1c1c1e] rounded-2xl animate-pulse" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Bike className="w-12 h-12 text-gray-700" />
            <p className="text-gray-400">Nenhum motoboy encontrado</p>
            <Link href="/rh/motoboys/novo" className="text-orange-400 text-sm hover:underline">Cadastrar o primeiro</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((rider) => (
              <Link key={rider.id} href={`/rh/motoboys/${rider.id}`}
                className="flex items-center justify-between bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl px-5 py-4 hover:bg-[#1e1e20] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Bike className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{rider.name}</p>
                      {!rider.passwordHash && (
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Convite pendente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">{fmt(rider.cnpj)}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{rider.email}</span>
                      <span className="text-xs text-gray-500">{rider.loja?.nome}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[rider.status] ?? 'text-gray-400 bg-gray-500/10'}`}>
                    {statusLabel[rider.status] ?? rider.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
