"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Plus, FileText, TrendingUp, Calendar, Edit, Trash2 } from "lucide-react";
import { useUser } from "@stackframe/stack";

interface StoreData {
  id: string;
  name: string;
  address: string | null;
  managerName: string | null;
  phone: string | null;
  abbreviation: string | null;
  lastOvenMaintenance: string | null;
  lastRefrigeratorMaintenance: string | null;
  lastPestControl: string | null;
  createdAt: string;
}

interface EvaluationData {
  id: string;
  evaluationDate: string;
  totalScore: number;
  supervisorName: string;
  createdAt: string;
}

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUser({ or: 'redirect' });
  const id = params.id as string;
  
  const [store, setStore] = useState<StoreData | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStoreDetails();
    }
  }, [id]);

  useEffect(() => {
    if (store) {
      checkMaintenanceAlerts();
    }
  }, [store]);

  const checkMaintenanceAlerts = () => {
    if (!store) return;

    const today = new Date();
    const threeMonthsInDays = 90;
    let hasAlert = false;

    const checkDate = (dateString: string | null) => {
      if (!dateString) return false;
      const maintenanceDate = new Date(dateString);
      const daysSince = Math.floor((today.getTime() - maintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= threeMonthsInDays;
    };

    if (checkDate(store.lastOvenMaintenance) || 
        checkDate(store.lastRefrigeratorMaintenance) || 
        checkDate(store.lastPestControl)) {
      hasAlert = true;
    }

    setShowMaintenanceAlert(hasAlert);
  };

  const getMaintenanceAlerts = () => {
    if (!store) return [];

    const today = new Date();
    const threeMonthsInDays = 90;
    const alerts: Array<{ type: string; daysSince: number; overdue: number }> = [];

    const checkAndAdd = (dateString: string | null, label: string) => {
      if (!dateString) return;
      const maintenanceDate = new Date(dateString);
      const daysSince = Math.floor((today.getTime() - maintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince >= threeMonthsInDays) {
        alerts.push({
          type: label,
          daysSince,
          overdue: daysSince - threeMonthsInDays
        });
      }
    };

    checkAndAdd(store.lastOvenMaintenance, 'Forno');
    checkAndAdd(store.lastRefrigeratorMaintenance, 'Geladeiras');
    checkAndAdd(store.lastPestControl, 'Dedetização');

    return alerts;
  };

  const fetchStoreDetails = async () => {
    try {
      const [storeResponse, evaluationsResponse] = await Promise.all([
        fetch(`/api/checklist/stores/${id}`),
        fetch(`/api/checklist/stores/${id}/evaluations`),
      ]);

      if (!storeResponse.ok || !evaluationsResponse.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const storeData = await storeResponse.json();
      const evaluationsData = await evaluationsResponse.json();

      setStore(storeData);
      setEvaluations(evaluationsData);
    } catch (error) {
      console.error("Erro ao carregar dados da loja:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluation = async (evalId: string) => {
    try {
      const response = await fetch(`/api/checklist/evaluations/${evalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvaluations(evaluations.filter((e) => e.id !== evalId));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Loja não encontrada</h2>
          <Link href="/checklist" className="text-green-400 hover:text-green-300">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  const latestScore = evaluations.length > 0 ? evaluations[0].totalScore : null;
  const maintenanceAlerts = getMaintenanceAlerts();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Modal de Alerta de Manutenções */}
      {showMaintenanceAlert && maintenanceAlerts.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border-2 border-red-500 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  ⚠️ ATENÇÃO - MANUTENÇÕES PENDENTES
                </h2>
                <p className="text-gray-400">
                  As seguintes manutenções estão vencidas (mais de 3 meses):
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {maintenanceAlerts.map((alert, index) => (
                <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-red-500 text-2xl">❌</span>
                      <div>
                        <p className="text-white font-semibold">{alert.type}</p>
                        <p className="text-sm text-gray-400">
                          Última manutenção há {alert.daysSince} dias
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold">
                        Venceu há {alert.overdue} dias
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/checklist/nova-avaliacao?storeId=${store.id}`)}
                className="flex-1 bg-[#001F05] text-white py-4 rounded-xl font-semibold hover:bg-[#001F05]/80 transition-all"
              >
                Iniciar Nova Avaliação
              </button>
              <button
                onClick={() => setShowMaintenanceAlert(false)}
                className="flex-1 bg-[#374151] text-white py-4 rounded-xl font-semibold hover:bg-[#374151]/80 transition-all"
              >
                Fechar Alerta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <Link href="/checklist" className="text-green-400 hover:text-green-300 mb-4 inline-block">
          ← Voltar
        </Link>

        <div className="bg-[#141415] rounded-2xl p-8 shadow-lg border border-[#374151] mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#001F05] to-[#374151] rounded-xl flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{store.name}</h1>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/checklist/loja/${store.id}/editar`)}
                className="flex items-center gap-2 bg-[#0f0f10] border-2 border-[#374151] text-gray-300 px-6 py-3 rounded-xl hover:border-[#001F05] hover:text-green-400 transition-all font-semibold"
              >
                <Edit className="w-5 h-5" />
                Editar
              </button>
              <button
                onClick={() => router.push(`/checklist/nova-avaliacao?storeId=${store.id}`)}
                className="flex items-center gap-2 bg-[#001F05] text-white px-6 py-3 rounded-xl hover:bg-[#001F05]/80 transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                Nova Avaliação
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {store.managerName && (
              <div className="bg-[#0f0f10] rounded-xl p-4 border border-[#374151]">
                <p className="text-sm text-gray-400 mb-1">Gerente Responsável</p>
                <p className="font-semibold text-white">{store.managerName}</p>
              </div>
            )}
            {store.phone && (
              <div className="bg-[#0f0f10] rounded-xl p-4 border border-[#374151]">
                <p className="text-sm text-gray-400 mb-1">Telefone do Gerente</p>
                <p className="font-semibold text-white">{store.phone}</p>
              </div>
            )}
            {latestScore !== null && (
              <div className="bg-[#0f0f10] rounded-xl p-4 border border-[#374151]">
                <p className="text-sm text-gray-400 mb-1">Última Nota</p>
                <p className="text-2xl font-bold text-green-400">{latestScore.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#141415] rounded-2xl p-8 shadow-lg border border-[#374151]">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Histórico de Avaliações</h2>
          </div>

          {evaluations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#0f0f10] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#374151]">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma avaliação ainda</h3>
              <p className="text-gray-400 mb-6">Crie a primeira avaliação para esta loja</p>
              <button
                onClick={() => router.push(`/checklist/nova-avaliacao?storeId=${store.id}`)}
                className="inline-flex items-center gap-2 bg-[#001F05] text-white px-6 py-3 rounded-xl hover:bg-[#001F05]/80 transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                Criar Primeira Avaliação
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-4 border border-[#374151] rounded-xl hover:border-[#001F05] hover:shadow-md transition-all bg-[#0f0f10]"
                >
                  <Link
                    href={`/checklist/relatorio/${evaluation.id}`}
                    className="flex items-center gap-4 flex-1"
                  >
                    <div className="w-12 h-12 bg-[#001F05] rounded-lg flex items-center justify-center hover:bg-[#001F05]/80 transition-colors">
                      <FileText className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-white">
                          {new Date(evaluation.evaluationDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">Supervisor: {evaluation.supervisorName}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">{evaluation.totalScore.toFixed(1)}%</p>
                    </div>
                    {deleteConfirm === evaluation.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteEvaluation(evaluation.id)}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

