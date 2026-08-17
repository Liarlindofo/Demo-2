"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, Trash2 } from "lucide-react";
import { useUser } from "@stackframe/stack";

interface TopicScore {
  topicName: string;
  topicScore: number;
  maxScore: number | null;
}

interface EvaluationRow {
  id: string;
  evaluationDate: string;
  supervisorName: string;
  totalScore: number;
  topicScores: TopicScore[];
}

export default function HistoricoCategoriaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser({ or: "redirect" });

  const storeId = params.id as string;
  const categoryId = searchParams.get("categoryId") ?? "";
  const categoryName = searchParams.get("categoryName") ?? "";

  const [storeName, setStoreName] = useState("");
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId || !categoryName) {
      router.replace("/checklist");
      return;
    }
    fetchData();
  }, [storeId, categoryId, categoryName]);

  const fetchData = async () => {
    try {
      const [storeRes, evalsRes] = await Promise.all([
        fetch(`/api/checklist/stores/${storeId}`),
        fetch(`/api/checklist/stores/${storeId}/evaluations?categoryName=${encodeURIComponent(categoryName)}`),
      ]);

      if (storeRes.ok) {
        const store = await storeRes.json();
        setStoreName(store.name);
      }

      if (evalsRes.ok) {
        const data = await evalsRes.json();
        setEvaluations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evalId: string) => {
    try {
      const res = await fetch(`/api/checklist/evaluations/${evalId}`, { method: "DELETE" });
      if (res.ok) {
        setEvaluations((prev) => prev.filter((e) => e.id !== evalId));
        setDeleteConfirm(null);
      } else {
        alert("Erro ao excluir avaliação");
      }
    } catch {
      alert("Erro ao excluir avaliação");
    }
  };

  const rows = useMemo(() => {
    return evaluations.map((ev) => {
      const topic = ev.topicScores.find((t) => t.topicName === categoryName);
      const score =
        topic && topic.maxScore && topic.maxScore > 0
          ? (topic.topicScore / topic.maxScore) * 100
          : ev.totalScore;
      return { ...ev, categoryScore: score };
    });
  }, [evaluations, categoryName]);

  if (!user) return null;

  if (!categoryId || !categoryName) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/checklist"
          className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="bg-[#141415] rounded-2xl p-8 border border-[#374151] mb-6">
          <p className="text-sm text-gray-500 mb-1">Histórico</p>
          <h1 className="text-2xl font-bold text-white mb-1">{categoryName}</h1>
          <p className="text-gray-400">{storeName}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 bg-[#141415] rounded-2xl border border-[#374151]">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhuma avaliação nesta categoria</h2>
            <p className="text-gray-400 mb-6">
              Ainda não há registros de &quot;{categoryName}&quot; para esta loja.
            </p>
            <button
              onClick={() =>
                router.push(
                  `/checklist/nova-avaliacao?storeId=${storeId}&categoryId=${categoryId}`,
                )
              }
              className="inline-flex items-center gap-2 bg-[#001F05] text-white px-6 py-3 rounded-xl hover:bg-[#001F05]/80 font-semibold"
            >
              Fazer primeira avaliação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between p-4 border border-[#374151] rounded-xl bg-[#141415] hover:border-[#001F05] transition-all"
              >
                <Link
                  href={`/checklist/relatorio/${ev.id}?categoryName=${encodeURIComponent(categoryName)}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="w-11 h-11 bg-[#001F05] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <p className="font-semibold text-white">
                        {new Date(ev.evaluationDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      Supervisor: {ev.supervisorName}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">
                      {ev.categoryScore.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">nesta categoria</p>
                  </div>
                  {deleteConfirm === ev.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 bg-[#374151] text-gray-300 rounded-lg text-xs"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(ev.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
