"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, TrendingUp, Trash2 } from "lucide-react";
import { useUser } from "@stackframe/stack";

interface EvaluationSummary {
  id: string;
  storeName: string;
  supervisorName: string;
  evaluationDate: string;
  totalScore: number;
  createdAt: string;
}

export default function ReportsPage() {
  const user = useUser({ or: 'redirect' });
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvaluations();
    }
  }, [user]);

  const fetchEvaluations = async () => {
    try {
      const response = await fetch('/api/checklist/evaluations');
      if (!response.ok) throw new Error("Erro ao carregar avaliações");
      const data = await response.json();
      setEvaluations(data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Regular';
    return 'Crítico';
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/checklist/evaluations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvaluations(evaluations.filter((e) => e.id !== id));
        setDeleteConfirm(null);
      } else {
        alert("Erro ao excluir avaliação");
      }
    } catch (error) {
      console.error("Erro ao excluir avaliação:", error);
      alert("Erro ao excluir avaliação");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          href="/checklist"
          className="flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors inline-flex"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="bg-[#141415] rounded-2xl shadow-xl p-8 mb-8 border border-[#374151]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-[#001F05] to-[#374151] rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Relatórios</h1>
              <p className="text-gray-400">Histórico de avaliações realizadas</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
              <p className="text-gray-400 mt-4">Carregando relatórios...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-4">Nenhuma avaliação encontrada</p>
              <Link
                href="/checklist/nova-avaliacao"
                className="inline-block bg-[#001F05] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#001F05]/80 transition-all"
              >
                Criar Nova Avaliação
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => {
                const percentage = evaluation.totalScore;
                return (
                  <div
                    key={evaluation.id}
                    className="bg-[#0f0f10] rounded-xl p-6 border border-[#374151] hover:border-[#001F05] hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <Link href={`/checklist/relatorio/${evaluation.id}`} className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {evaluation.storeName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreColor(percentage)}`}>
                            {getScoreLabel(percentage)}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(evaluation.evaluationDate).toLocaleDateString('pt-BR')}
                          </span>
                          <span>Supervisor: {evaluation.supervisorName}</span>
                        </div>
                      </Link>
                      <div className="flex items-center gap-4 ml-6">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <span className="text-3xl font-bold text-green-400">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {deleteConfirm === evaluation.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(evaluation.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1 bg-[#374151] text-gray-300 rounded-lg hover:bg-[#374151]/80 transition-colors text-sm font-semibold"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(evaluation.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir avaliação"
                          >
                            <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

