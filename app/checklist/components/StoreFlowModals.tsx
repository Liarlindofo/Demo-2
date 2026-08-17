"use client";

import { ClipboardCheck, History, X, ChevronRight } from "lucide-react";

export interface ChecklistCategoryOption {
  id: string;
  name: string;
  items: Array<{ id: string; name: string }>;
}

interface StoreFlowModalsProps {
  storeName: string;
  step: "action" | "category" | null;
  action: "new" | "history" | null;
  categories: ChecklistCategoryOption[];
  loadingCategories: boolean;
  onClose: () => void;
  onSelectAction: (action: "new" | "history") => void;
  onSelectCategory: (category: ChecklistCategoryOption) => void;
  onBack: () => void;
}

export function StoreFlowModals({
  storeName,
  step,
  action,
  categories,
  loadingCategories,
  onClose,
  onSelectAction,
  onSelectCategory,
  onBack,
}: StoreFlowModalsProps) {
  if (!step) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141415] border border-[#374151] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#374151]">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Unidade</p>
            <h2 className="text-lg font-bold text-white">{storeName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#374151] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "action" && (
          <div className="p-6 space-y-3">
            <p className="text-sm text-gray-400 mb-4">O que deseja fazer?</p>
            <button
              onClick={() => onSelectAction("new")}
              className="w-full flex items-center gap-4 p-5 rounded-xl border border-[#374151] bg-[#0f0f10] hover:border-[#001F05] hover:bg-[#001F05]/10 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#001F05] flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white group-hover:text-green-300">
                  Fazer uma nova avaliação
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Escolha a categoria e responda o checklist
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400" />
            </button>

            <button
              onClick={() => onSelectAction("history")}
              className="w-full flex items-center gap-4 p-5 rounded-xl border border-[#374151] bg-[#0f0f10] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <History className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white group-hover:text-blue-300">
                  Verificar histórico
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Consulte avaliações anteriores por categoria
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400" />
            </button>
          </div>
        )}

        {step === "category" && (
          <div className="p-6">
            <button
              onClick={onBack}
              className="text-sm text-green-400 hover:text-green-300 mb-4"
            >
              ← Voltar
            </button>
            <p className="text-sm text-gray-400 mb-4">
              {action === "new"
                ? "Selecione a categoria para a nova avaliação:"
                : "Selecione a categoria para ver o histórico:"}
            </p>

            {loadingCategories ? (
              <div className="flex justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#001F05] border-t-transparent" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma categoria configurada. Acesse &quot;Gerenciar checklist&quot; para
                cadastrar.
              </p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-[#374151] bg-[#0f0f10] hover:border-[#001F05] hover:bg-[#001F05]/10 transition-all text-left group"
                  >
                    <div>
                      <p className="font-semibold text-white group-hover:text-green-300">
                        {cat.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cat.items.length} pergunta{cat.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
