"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { useUser } from "@stackframe/stack";

interface StoreData {
  id: string;
  name: string;
  managerName: string | null;
  phone: string | null;
  abbreviation: string | null;
  displayOrder: number | null;
}

export default function ChecklistPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser({ or: 'redirect' });

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/checklist/stores");
      if (!response.ok) {
        throw new Error("Erro ao carregar lojas");
      }
      const data = await response.json();
      // Sort by display_order
      const sortedData = data.sort((a: StoreData, b: StoreData) => 
        (a.displayOrder || 0) - (b.displayOrder || 0)
      );
      setStores(sortedData);
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
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
            <ClipboardCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Platefull.Check
          </h1>
          <p className="text-base text-gray-400">
            Selecione a unidade deste dispositivo
          </p>
        </header>

        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
            </div>
          ) : (
            <>
              {stores.length > 0 && (
                <div className="flex justify-end mb-4">
                  <Link
                    href="/checklist/nova-loja"
                    className="inline-block px-5 py-2.5 bg-[#001F05] text-white rounded-lg hover:bg-[#001F05]/80 transition-colors font-semibold"
                  >
                    Adicionar loja
                  </Link>
                </div>
              )}

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
                  <Link
                    key={store.id}
                    href={`/checklist/loja/${store.id}`}
                    className="group bg-[#141415] rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-[#374151] hover:border-[#001F05] flex items-center justify-between"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">
                        {store.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {store.managerName || "Sem gerente cadastrado"}
                      </p>
                    </div>
                    <div className="bg-[#001F05] text-green-400 font-bold text-base px-6 py-3 rounded-xl group-hover:bg-[#001F05]/80 transition-colors">
                      {store.abbreviation || "---"}
                    </div>
                  </Link>
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

