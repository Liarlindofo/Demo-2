"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, History, Package, Plus, X } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Unidade } from "@/types/etiquetagem";

export default function EtiquetagemPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nomeExibicao: "",
    cnpj: "",
    cnpjFormatado: "",
    cidade: "",
    codigoInterno: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  const formatarCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length <= 14) {
      return cleaned.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
      );
    }
    return cnpj;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const cnpjFormatado = formatarCNPJ(formData.cnpj);
      
      const response = await fetch("/api/etiquetagem/unidades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cnpjFormatado,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar unidade");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Erro ao criar unidade");
      }

      const novaUnidade = await response.json();
      setUnidades([...unidades, novaUnidade]);
      setSelectedUnidade(novaUnidade);
      setShowModal(false);
      setFormData({
        nomeExibicao: "",
        cnpj: "",
        cnpjFormatado: "",
        cidade: "",
        codigoInterno: "",
      });
      setError("");
    } catch (error) {
      console.error("Erro ao criar unidade:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar unidade";
      setError(errorMessage);
    } finally {
      setSaving(false);
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
              <Button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-[#001F05] text-white rounded-lg hover:bg-[#001F05]/80 transition-colors font-semibold"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Cadastrar Unidade
              </Button>
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

      {/* Modal Cadastrar Unidade */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Unidade</DialogTitle>
            <DialogDescription className="text-gray-400">
              Preencha os dados da unidade para começar a gerar etiquetas
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg">
              <p className="font-semibold mb-2">Erro ao criar unidade</p>
              <p className="text-sm">{error}</p>
              {error.includes('Tabelas do banco') && (
                <div className="mt-3 p-3 bg-red-600/20 rounded border border-red-500/50">
                  <p className="text-xs font-semibold mb-1">Solução:</p>
                  <p className="text-xs">
                    Execute no terminal: <code className="bg-black/30 px-2 py-1 rounded">npx prisma db push</code>
                  </p>
                  <p className="text-xs mt-2">
                    Ou acesse: <code className="bg-black/30 px-2 py-1 rounded">/api/admin/sync-database?secret=YOUR_ADMIN_SECRET</code>
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nomeExibicao" className="text-gray-300">
                Nome de Exibição *
              </Label>
              <Input
                id="nomeExibicao"
                value={formData.nomeExibicao}
                onChange={(e) =>
                  setFormData({ ...formData, nomeExibicao: e.target.value })
                }
                placeholder="Ex: Restaurante Central"
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="cnpj" className="text-gray-300">
                CNPJ *
              </Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => {
                  const cnpj = e.target.value.replace(/\D/g, "");
                  setFormData({
                    ...formData,
                    cnpj,
                    cnpjFormatado: formatarCNPJ(cnpj),
                  });
                }}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="cidade" className="text-gray-300">
                Cidade *
              </Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) =>
                  setFormData({ ...formData, cidade: e.target.value })
                }
                placeholder="Ex: São Paulo"
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="codigoInterno" className="text-gray-300">
                Código Interno *
              </Label>
              <Input
                id="codigoInterno"
                value={formData.codigoInterno}
                onChange={(e) =>
                  setFormData({ ...formData, codigoInterno: e.target.value.toUpperCase() })
                }
                placeholder="Ex: SP01"
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Código único usado para gerar códigos de etiqueta
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setFormData({
                    nomeExibicao: "",
                    cnpj: "",
                    cnpjFormatado: "",
                    cidade: "",
                    codigoInterno: "",
                  });
                }}
                className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
