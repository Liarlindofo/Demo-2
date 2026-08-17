"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Settings } from "lucide-react";
import { useUser } from "@stackframe/stack";
import {
  StoreFlowModals,
  type ChecklistCategoryOption,
} from "./components/StoreFlowModals";

interface StoreData {
  id: string;
  name: string;
  managerName: string | null;
  phone: string | null;
  abbreviation: string | null;
  displayOrder: number | null;
}

export default function ChecklistPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser({ or: "redirect" });

  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [modalStep, setModalStep] = useState<"action" | "category" | null>(null);
  const [modalAction, setModalAction] = useState<"new" | "history" | null>(null);
  const [categories, setCategories] = useState<ChecklistCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/checklist/stores");
      if (!response.ok) throw new Error("Erro ao carregar lojas");
      const data = await response.json();
      const sortedData = data.sort(
        (a: StoreData, b: StoreData) => (a.displayOrder || 0) - (b.displayOrder || 0),
      );
      setStores(sortedData);
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/checklist/template");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const openStoreModal = (store: StoreData) => {
    setSelectedStore(store);
    setModalStep("action");
    setModalAction(null);
    if (categories.length === 0) fetchCategories();
  };

  const closeModal = () => {
    setSelectedStore(null);
    setModalStep(null);
    setModalAction(null);
  };

  const handleSelectAction = (action: "new" | "history") => {
    setModalAction(action);
    setModalStep("category");
    if (categories.length === 0) fetchCategories();
  };

  const handleSelectCategory = (category: ChecklistCategoryOption) => {
    if (!selectedStore || !modalAction) return;

    if (modalAction === "new") {
      router.push(
        `/checklist/nova-avaliacao?storeId=${selectedStore.id}&categoryId=${category.id}`,
      );
    } else {
      router.push(
        `/checklist/loja/${selectedStore.id}/historico?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`,
      );
    }
    closeModal();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <StoreFlowModals
        storeName={selectedStore?.name ?? ""}
        step={modalStep}
        action={modalAction}
        categories={categories}
        loadingCategories={loadingCategories}
        onClose={closeModal}
        onSelectAction={handleSelectAction}
        onSelectCategory={handleSelectCategory}
        onBack={() => {
          setModalStep("action");
          setModalAction(null);
        }}
      />

      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#001F05] to-[#374151] rounded-3xl mb-6 shadow-lg">
            <ClipboardCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Platefull.Check</h1>
          <p className="text-base text-gray-400">Selecione a unidade deste dispositivo</p>
        </header>

        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="flex justify-end gap-2 mb-4">
                <Link
                  href="/checklist/admin"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#141415] border border-[#374151] text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar checklist
                </Link>
                {stores.length > 0 && (
                  <Link
                    href="/checklist/nova-loja"
                    className="inline-block px-5 py-2.5 bg-[#001F05] text-white rounded-lg hover:bg-[#001F05]/80 transition-colors font-semibold"
                  >
                    Adicionar loja
                  </Link>
                )}
              </div>

              <div className="space-y-4">
                {stores.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">Nenhuma loja cadastrada</p>
                    <Link
                      href="/checklist/nova-loja"
                      className="inline-block px-6 py-3 bg-[#001F05] text-white rounded-lg hover:bg-[#001F05]/80 transition-colors"
                    >
                      Criar primeira loja
                    </Link>
                  </div>
                ) : (
                  stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => openStoreModal(store)}
                      className="group w-full bg-[#141415] rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-[#374151] hover:border-[#001F05] flex items-center justify-between text-left"
                    >
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">{store.name}</h2>
                        <p className="text-sm text-gray-400">
                          {store.managerName || "Sem gerente cadastrado"}
                        </p>
                      </div>
                      <div className="bg-[#001F05] text-green-400 font-bold text-base px-6 py-3 rounded-xl group-hover:bg-[#001F05]/80 transition-colors">
                        {store.abbreviation || "---"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
