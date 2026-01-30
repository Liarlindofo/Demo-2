"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, History, Package, Plus } from "lucide-react";
import { useUser } from "@stackframe/stack";

interface Unidade {
  id: string;
  nomeExibicao: string;
  cnpj: string;
  cnpjFormatado: string;
  cidade: string;
  codigoInterno: string;
}

export default function EtiquetagemPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const user = useUser({ or: 'redirect' });

  useEffect(() => {
    if (user) {
      fetchUnidades();
    }
  }, [user]);

  const fetchUnidades = async () => {
    try {
      const response = await fetch("/api/etiquetagem/unidades");
      if (!response.ok) {
        throw new Error("Erro ao carregar unidades");
      }
      const data = await response.json();
      setUnidades(data);
      if (data.length === 1) {
        setSelectedUnidade(data[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#001F05] to-[#374151] rounded-3xl mb-6 shadow-lg">
            <Tag className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Etiquetagem
          </h1>
          <p className="text-base text-gray-400">
            Sistema de geração de etiquetas para produtos manipulados
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
            </div>
          ) : unidades.length === 0 ? (
            <div className="bg-[#141415] rounded-xl p-8 text-center border border-[#374151]">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Nenhuma unidade cadastrada
              </h2>
              <p className="text-gray-400 mb-6">
                Cadastre uma unidade para começar a gerar etiquetas
              </p>
              <button className="px-5 py-2.5 bg-[#001F05] text-white rounded-lg hover:bg-[#001F05]/80 transition-colors font-semibold">
                <Plus className="w-4 h-4 inline mr-2" />
                Cadastrar Unidade
              </button>
            </div>
          ) : (
            <>
              {unidades.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Selecione a unidade
                  </label>
                  <select
                    value={selectedUnidade?.id || ""}
                    onChange={(e) => {
                      const unidade = unidades.find(u => u.id === e.target.value);
                      setSelectedUnidade(unidade || null);
                    }}
                    className="w-full px-4 py-3 bg-[#141415] border border-[#374151] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#001F05]"
                  >
                    <option value="">Selecione uma unidade</option>
                    {unidades.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nomeExibicao} - {unidade.cidade}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedUnidade && (
                <div className="space-y-6">
                  {/* Ação Principal */}
                  <div className="bg-gradient-to-br from-[#001F05] to-[#374151] rounded-xl p-8 border border-[#374151] shadow-xl">
                    <div className="flex flex-col items-center justify-center gap-6">
                      <div className="text-center">
                        <h2 className="text-3xl font-bold mb-3 text-white">
                          Gerar Nova Etiqueta
                        </h2>
                        <p className="text-gray-200 text-lg">
                          Crie etiquetas de identificação para produtos manipulados
                        </p>
                      </div>
                      <Link
                        href={`/etiquetagem/gerar?unidade=${selectedUnidade.id}`}
                        className="px-12 py-5 text-xl min-h-[60px] bg-white text-[#001F05] rounded-lg hover:bg-gray-100 transition-colors font-semibold inline-flex items-center gap-2"
                      >
                        <Tag className="w-6 h-6" />
                        Nova Etiqueta
                      </Link>
                    </div>
                  </div>

                  {/* Menu rápido */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link
                      href={`/etiquetagem/historico?unidade=${selectedUnidade.id}`}
                      className="bg-[#141415] border border-[#374151] rounded-xl p-6 hover:bg-[#374151] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                          <History className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Histórico</h3>
                          <p className="text-sm text-gray-400">Ver etiquetas geradas</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href={`/etiquetagem/produtos?unidade=${selectedUnidade.id}`}
                      className="bg-[#141415] border border-[#374151] rounded-xl p-6 hover:bg-[#374151] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-500/20 p-3 rounded-xl">
                          <Package className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Produtos</h3>
                          <p className="text-sm text-gray-400">Gerenciar cadastros</p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Info da Unidade */}
                  <div className="bg-[#141415] border border-[#374151] rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4">Informações da Unidade</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white">{selectedUnidade.nomeExibicao}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CNPJ:</span>
                        <span className="text-white">{selectedUnidade.cnpjFormatado}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cidade:</span>
                        <span className="text-white">{selectedUnidade.cidade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Código Interno:</span>
                        <span className="text-white">{selectedUnidade.codigoInterno}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
