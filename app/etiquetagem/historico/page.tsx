"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Calendar, User, Tag as TagIcon, Trash2, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Etiqueta } from "@/types/etiquetagem";

export default function HistoricoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unidadeId = searchParams.get("unidade");

  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!unidadeId) {
      router.push("/etiquetagem");
      return;
    }
    loadHistorico();
  }, [unidadeId]);

  const loadHistorico = async () => {
    if (!unidadeId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/etiquetagem/etiquetas?unidade_id=${unidadeId}&limite=100`);
      if (!response.ok) throw new Error("Erro ao carregar histórico");
      const data = await response.json();
      setEtiquetas(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReimprimirEtiqueta = (etiqueta: Etiqueta) => {
    router.push(`/etiquetagem/gerar?unidade=${unidadeId}&reimprimir=${etiqueta.id}`);
  };

  const handleLimparHistorico = async () => {
    if (!unidadeId) return;

    try {
      setClearing(true);
      const response = await fetch(`/api/etiquetagem/etiquetas?unidade_id=${unidadeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao limpar histórico");
      setEtiquetas([]);
      setConfirmClear(false);
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      alert("Erro ao limpar histórico");
    } finally {
      setClearing(false);
    }
  };

  const etiquetasFiltradas = etiquetas.filter(e => 
    e.produto?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.responsavelNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.codigoEtiqueta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (validadeString: string) => {
    return new Date(validadeString) < new Date();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          onClick={() => router.push("/etiquetagem")}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-8">Histórico de Etiquetas</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por produto, responsável ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#141415] border-[#374151] text-white"
          />
        </div>

        {etiquetas.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setConfirmClear(true)}
            className="w-full mb-6 text-red-400 border-red-500/50 hover:bg-red-500/20"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Limpar Histórico
          </Button>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
          </div>
        ) : etiquetasFiltradas.length > 0 ? (
          <div className="space-y-3">
            {etiquetasFiltradas.map((etiqueta) => (
              <div
                key={etiqueta.id}
                onClick={() => handleReimprimirEtiqueta(etiqueta)}
                className="bg-[#141415] border border-[#374151] rounded-xl p-4 hover:bg-[#374151] transition-colors cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          isExpired(etiqueta.dataHoraValidade)
                            ? "bg-red-500/20 text-red-400"
                            : "bg-[#001F05] text-green-400"
                        }`}>
                          {etiqueta.codigoEtiqueta}
                        </span>
                        {etiqueta.unidade?.codigoInterno && (
                          <span className="text-xs text-gray-400">
                            {etiqueta.unidade.codigoInterno}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white text-lg mb-1">
                        {etiqueta.produto?.nome}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {etiqueta.processo?.nome} • {etiqueta.pesoQuantidade} {etiqueta.unidadeMedida}
                      </p>
                    </div>
                    <div className="ml-4">
                      <RotateCcw className="w-5 h-5 text-[#001F05]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{etiqueta.responsavelNome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        Manipulado: {formatDateTime(etiqueta.dataHoraManipulacao)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${
                        isExpired(etiqueta.dataHoraValidade)
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}>
                        Validade: {formatDateTime(etiqueta.dataHoraValidade)}
                        {isExpired(etiqueta.dataHoraValidade) && " (Vencido)"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#374151]">
                    <p className="text-xs text-[#001F05] font-medium flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Clique para reimprimir esta etiqueta
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#141415] border border-[#374151] rounded-xl p-12 text-center">
            <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? "Nenhuma etiqueta encontrada" : "Nenhuma etiqueta gerada ainda"}
            </p>
          </div>
        )}
      </div>

      {/* Dialog de confirmação */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>Limpar Histórico</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300 mb-4">
            Tem certeza que deseja limpar todo o histórico de etiquetas? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmClear(false)}
              className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLimparHistorico}
              disabled={clearing}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {clearing ? "Limpando..." : "Limpar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
