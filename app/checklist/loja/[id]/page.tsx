"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Plus, History, TrendingUp, Calendar, Edit, Trash2 } from "lucide-react";
import { useUser } from "@stackframe/stack";
import {
  StoreFlowModals,
  type ChecklistCategoryOption,
} from "../../components/StoreFlowModals";

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
  const [modalStep, setModalStep] = useState<"action" | "category" | null>(null);
  const [modalAction, setModalAction] = useState<"new" | "history" | null>(null);
  const [categories, setCategories] = useState<ChecklistCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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
    const sixMonthsInDays = 180;
    const threeMonthsInDays = 90;
    let hasAlert = false;

    const checkDate = (dateString: string | null, requiredDays: number) => {
      if (!dateString) return false;
      const maintenanceDate = new Date(dateString);
      const daysSince = Math.floor((today.getTime() - maintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= requiredDays;
    };

    if (checkDate(store.lastOvenMaintenance, sixMonthsInDays) || 
        checkDate(store.lastRefrigeratorMaintenance, sixMonthsInDays) || 
        checkDate(store.lastPestControl, threeMonthsInDays)) {
      hasAlert = true;
    }

    setShowMaintenanceAlert(hasAlert);
  };

  const getMaintenanceAlerts = () => {
    if (!store) return [];

    const today = new Date();
    const sixMonthsInDays = 180;
    const threeMonthsInDays = 90;
    const alerts: Array<{ type: string; daysSince: number; overdue: number; period: string }> = [];

    const checkAndAdd = (dateString: string | null, label: string, requiredDays: number, periodLabel: string) => {
      if (!dateString) return;
      const maintenanceDate = new Date(dateString);
      const daysSince = Math.floor((today.getTime() - maintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince >= requiredDays) {
        alerts.push({
          type: label,
          daysSince,
          overdue: daysSince - requiredDays,
          period: periodLabel
        });
      }
    };

    checkAndAdd(store.lastOvenMaintenance, 'Manutenção do Forno', sixMonthsInDays, '6 meses');
    checkAndAdd(store.lastRefrigeratorMaintenance, 'Manutenção das Geladeiras', sixMonthsInDays, '6 meses');
    checkAndAdd(store.lastPestControl, 'Dedetização', threeMonthsInDays, '3 meses');

    return alerts;
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/checklist/template");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingCategories(false);
    }
  };

  const openFlow = (action?: "new" | "history") => {
    if (action) {
      setModalAction(action);
      setModalStep("category");
    } else {
      setModalAction(null);
      setModalStep("action");
    }
    if (categories.length === 0) fetchCategories();
  };

  const closeFlow = () => {
    setModalStep(null);
    setModalAction(null);
  };

  const handleSelectCategory = (category: ChecklistCategoryOption) => {
    if (!store) return;
    if (modalAction === "new") {
      router.push(
        `/checklist/nova-avaliacao?storeId=${store.id}&categoryId=${category.id}`,
      );
    } else {
      router.push(
        `/checklist/loja/${store.id}/historico?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`,
      );
    }
    closeFlow();
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
      {store && (
        <StoreFlowModals
          storeName={store.name}
          step={modalStep}
          action={modalAction}
          categories={categories}
          loadingCategories={loadingCategories}
          onClose={closeFlow}
          onSelectAction={(action) => {
            setModalAction(action);
            setModalStep("category");
            if (categories.length === 0) fetchCategories();
          }}
          onSelectCategory={handleSelectCategory}
          onBack={() => {
            setModalStep("action");
            setModalAction(null);
          }}
        />
      )}

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
                  As seguintes manutenções estão vencidas:
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
                          Última há {alert.daysSince} dias • Período obrigatório: {alert.period}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold text-lg">
                        Atrasada há {alert.overdue} dias
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-300">
                <strong>📋 Períodos Obrigatórios:</strong><br/>
                • Dedetização: a cada 3 meses (90 dias)<br/>
                • Manutenção do Forno: a cada 6 meses (180 dias)<br/>
                • Manutenção das Geladeiras: a cada 6 meses (180 dias)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMaintenanceAlert(false);
                  openFlow("new");
                }}
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
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push(`/checklist/loja/${store.id}/editar`)}
                className="flex items-center gap-2 bg-[#0f0f10] border-2 border-[#374151] text-gray-300 px-6 py-3 rounded-xl hover:border-[#001F05] hover:text-green-400 transition-all font-semibold"
              >
                <Edit className="w-5 h-5" />
                Editar
              </button>
              <button
                onClick={() => openFlow("new")}
                className="flex items-center gap-2 bg-[#001F05] text-white px-6 py-3 rounded-xl hover:bg-[#001F05]/80 transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                Nova Avaliação
              </button>
              <button
                onClick={() => openFlow("history")}
                className="flex items-center gap-2 bg-[#0f0f10] border-2 border-[#374151] text-gray-300 px-6 py-3 rounded-xl hover:border-blue-500/40 hover:text-blue-400 transition-all font-semibold"
              >
                <History className="w-5 h-5" />
                Verificar Histórico
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
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Avaliações por categoria</h2>
            </div>
            <button
              onClick={() => openFlow("history")}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              <History className="w-4 h-4" />
              Ver histórico por categoria
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            Cada categoria é avaliada separadamente. Use &quot;Nova Avaliação&quot; ou
            &quot;Verificar Histórico&quot; e escolha a categoria desejada.
          </p>

          {evaluations.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#374151] rounded-xl">
              <h3 className="text-lg font-bold text-white mb-2">Nenhuma avaliação ainda</h3>
              <p className="text-gray-400 mb-6">Comece escolhendo uma categoria</p>
              <button
                onClick={() => openFlow("new")}
                className="inline-flex items-center gap-2 bg-[#001F05] text-white px-6 py-3 rounded-xl hover:bg-[#001F05]/80 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Nova Avaliação
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.slice(0, 5).map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-4 border border-[#374151] rounded-xl bg-[#0f0f10]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#001F05] rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {new Date(evaluation.evaluationDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-gray-400">
                        Supervisor: {evaluation.supervisorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-2xl font-bold text-green-400">
                      {evaluation.totalScore.toFixed(1)}%
                    </p>
                    {deleteConfirm === evaluation.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteEvaluation(evaluation.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 bg-[#374151] text-gray-300 rounded-lg text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(evaluation.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg"
                        title="Excluir avaliação"
                      >
                        <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {evaluations.length > 5 && (
                <button
                  onClick={() => openFlow("history")}
                  className="w-full py-3 text-sm text-blue-400 hover:text-blue-300 border border-[#374151] rounded-xl"
                >
                  Ver histórico completo por categoria →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

