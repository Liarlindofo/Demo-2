"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Calendar, User, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, Printer } from "lucide-react";
import { CHECKLIST_TOPICS } from "@/lib/checklist-data";
import { useUser } from "@stackframe/stack";

interface EvaluationDetail {
  id: string;
  storeName: string;
  supervisorName: string;
  evaluationDate: string;
  totalScore: number;
  maxTotalScore: number;
  maintenanceList: string | null;
  improvementSuggestions: string | null;
  topicScores: Array<{
    id: string;
    topicName: string;
    topicScore: number;
    maxScore: number | null;
    observations: string | null;
  }>;
  itemScores: Array<{
    id: string;
    topicName: string;
    itemName: string;
    itemScore: number;
    maxScore: number;
    status: string;
    observations: string | null;
    photoUrls: any;
  }>;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser({ or: 'redirect' });
  const id = params.id as string;
  const filterCategoryName = searchParams.get('categoryName');
  
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchEvaluation();
    }
  }, [id, user]);

  const fetchEvaluation = async () => {
    try {
      const response = await fetch(`/api/checklist/evaluations/${id}`);
      if (!response.ok) throw new Error("Erro ao carregar avaliação");
      const data = await response.json();
      setEvaluation(data);
    } catch (error) {
      console.error('Error fetching evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (!evaluation || !reportRef.current) return;

    setIsSavingPdf(true);
    try {
      // Import dinâmico para não carregar no primeiro render e evitar SSR issues
      const mod = await import("html2pdf.js");
      const html2pdf = (mod as any).default ?? mod;

      const safeStore = (evaluation.storeName || "relatorio")
        .toString()
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, " ");
      const dateStr = new Date(evaluation.evaluationDate).toISOString().slice(0, 10);
      const filename = `Relatorio - ${safeStore} - ${dateStr}.pdf`;

      await html2pdf()
        .set({
          margin: 10,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#000000" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(reportRef.current)
        .save();
    } catch (error) {
      console.error("Erro ao salvar PDF:", error);
      alert("Não foi possível gerar o PDF automaticamente. Tente usar o botão Imprimir e selecionar 'Salvar como PDF'.");
    } finally {
      setIsSavingPdf(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
          <p className="text-gray-400 mt-4">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Relatório não encontrado</p>
          <Link href="/checklist/relatorios" className="text-green-400 hover:text-green-300 mt-4 inline-block">
            Voltar para relatórios
          </Link>
        </div>
      </div>
    );
  }

  const percentage = (() => {
    if (filterCategoryName) {
      const topic = evaluation.topicScores.find((t) => t.topicName === filterCategoryName);
      if (topic && topic.maxScore && topic.maxScore > 0) {
        return (topic.topicScore / topic.maxScore) * 100;
      }
    }
    return evaluation.totalScore;
  })();

  const visibleTopicScores = filterCategoryName
    ? evaluation.topicScores.filter((t) => t.topicName === filterCategoryName)
    : evaluation.topicScores;

  const visibleTopicsForDetails = filterCategoryName
    ? [{ id: filterCategoryName, name: filterCategoryName, items: [] as { id: string; name: string; weight: number }[] }]
    : CHECKLIST_TOPICS;

  const getStatusIcon = (status: string) => {
    if (status === 'DE ACORDO') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === 'PARCIAL') return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'DE ACORDO') return 'bg-green-500/10 border-green-500/30';
    if (status === 'PARCIAL') return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="print:hidden mb-6 flex items-center justify-between">
          <Link
            href={filterCategoryName ? `/checklist` : `/checklist/relatorios`}
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {filterCategoryName ? 'Voltar' : 'Voltar para Relatórios'}
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#0f0f10] border border-[#374151] text-gray-200 px-6 py-3 rounded-xl font-semibold hover:border-[#001F05] hover:text-white transition-all"
              type="button"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </button>
            <button
              onClick={handleSavePdf}
              disabled={isSavingPdf}
              className="flex items-center gap-2 bg-[#001F05] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#001F05]/80 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
            >
              <Download className={`w-5 h-5 ${isSavingPdf ? "animate-pulse" : ""}`} />
              {isSavingPdf ? "Gerando PDF..." : "Salvar PDF"}
            </button>
          </div>
        </div>

        <div ref={reportRef} className="bg-[#141415] rounded-2xl shadow-xl overflow-hidden border border-[#374151]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#001F05] to-[#374151] text-white p-8">
            <h1 className="text-4xl font-bold mb-4">
              Relatório de Avaliação
              {filterCategoryName && (
                <span className="block text-xl font-medium text-green-300 mt-2">
                  {filterCategoryName}
                </span>
              )}
            </h1>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <div>
                  <div className="text-sm opacity-90">Loja</div>
                  <div className="font-semibold">{evaluation.storeName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <div>
                  <div className="text-sm opacity-90">Supervisor</div>
                  <div className="font-semibold">{evaluation.supervisorName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <div>
                  <div className="text-sm opacity-90">Data</div>
                  <div className="font-semibold">
                    {new Date(evaluation.evaluationDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Score Summary */}
          <div className="p-8 border-b border-[#374151]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {filterCategoryName ? 'Nota da Categoria' : 'Nota Geral'}
                </h2>
                <p className="text-gray-400">
                  {filterCategoryName
                    ? `Avaliação de ${filterCategoryName}`
                    : 'Avaliação geral da pizzaria'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <div className="text-5xl font-bold text-green-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {evaluation.totalScore.toFixed(1)} de {evaluation.maxTotalScore} pontos
                </div>
              </div>
            </div>
            
            {/* Topic Scores */}
            <div className="grid md:grid-cols-2 gap-4">
              {visibleTopicScores.map((topic) => {
                const topicData = CHECKLIST_TOPICS.find(t => t.name === topic.topicName);
                const topicMaxScore = topic.maxScore || (topicData?.items.reduce((sum, item) => sum + item.weight, 0) || 100);
                const topicPercentage = (topic.topicScore / topicMaxScore) * 100;
                
                return (
                  <div key={topic.id} className="bg-[#0f0f10] rounded-xl p-4 border border-[#374151]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{topic.topicName}</h3>
                      <span className="text-lg font-bold text-green-400">
                        {topicPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#374151] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#001F05] to-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${topicPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="p-8 border-b border-[#374151]">
            <h2 className="text-2xl font-bold text-white mb-6">Itens que Precisam de Atenção</h2>
            <p className="text-gray-400 mb-6">Itens marcados como "PARCIAL" ou "FORA DO PADRÃO"</p>
            <div className="space-y-8">
              {visibleTopicsForDetails.map((topic) => {
                const topicItems = evaluation.itemScores.filter(
                  item => item.topicName === topic.name && 
                  (item.status === 'PARCIAL' || item.status === 'FORA DO PADRÃO')
                );
                const topicData = evaluation.topicScores.find(t => t.topicName === topic.name);
                
                if (topicItems.length === 0) return null;

                return (
                  <div key={topic.id} className="border border-[#374151] rounded-xl p-6 bg-[#0f0f10]">
                    <h3 className="text-xl font-bold text-white mb-4">{topic.name}</h3>
                    
                    <div className="space-y-3 mb-4">
                      {topicItems.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-4 ${getStatusColor(item.status)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {getStatusIcon(item.status)}
                              <span className="font-semibold text-white">{item.itemName}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-gray-300">
                                {item.itemScore.toFixed(1)} / {item.maxScore}
                              </span>
                            </div>
                          </div>
                          {item.observations && (
                            <p className="text-sm text-gray-300 mt-2 pl-7">
                              <strong>Obs:</strong> {item.observations}
                            </p>
                          )}
                          {item.photoUrls && Array.isArray(item.photoUrls) && item.photoUrls.length > 0 && (
                            <div className="mt-3 pl-7">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {item.photoUrls.map((photoUrl: string, photoIndex: number) => (
                                  <div key={photoIndex} className="relative group">
                                    <img 
                                      src={photoUrl} 
                                      alt={`Foto ${photoIndex + 1} de ${item.itemName}`}
                                      className="w-full h-40 object-cover rounded-lg border border-[#374151] shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(photoUrl, '_blank')}
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                      Foto {photoIndex + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                {item.photoUrls.length} foto(s) - Clique para ampliar
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {topicData?.observations && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-white mb-2">Observações Gerais do Tópico:</h4>
                        <p className="text-gray-300">{topicData.observations}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Maintenance and Suggestions */}
          {(evaluation.maintenanceList || evaluation.improvementSuggestions) && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Informações Adicionais</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {evaluation.maintenanceList && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Lista de Manutenção</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{evaluation.maintenanceList}</p>
                  </div>
                )}
                {evaluation.improvementSuggestions && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Sugestões de Melhoria</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{evaluation.improvementSuggestions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

