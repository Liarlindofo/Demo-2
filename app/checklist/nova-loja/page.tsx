"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Save } from "lucide-react";
import { useUser } from "@stackframe/stack";

export default function NewStorePage() {
  const router = useRouter();
  const user = useUser({ or: 'redirect' });
  const [formData, setFormData] = useState({
    name: "",
    managerName: "",
    phone: "",
    address: "",
    abbreviation: "",
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/checklist/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar loja");
      }

      const data = await response.json();
      router.push(`/checklist/loja/${data.storeId}`);
    } catch (error) {
      console.error("Erro ao salvar loja:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar loja");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/checklist" className="text-green-400 hover:text-green-300 mb-2 inline-block">
            ← Voltar para Checklist
          </Link>
          <div className="bg-[#141415] rounded-2xl p-8 shadow-lg border border-[#374151]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#001F05] to-[#374151] rounded-xl flex items-center justify-center">
                <Store className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Nova Loja</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent"
                  placeholder="Ex: Platefull Centro"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Gerente Responsável
                </label>
                <input
                  type="text"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent"
                  placeholder="Nome completo do gerente"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Telefone do Gerente
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent"
                  placeholder="Endereço completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Abreviação
                  </label>
                  <input
                    type="text"
                    value={formData.abbreviation}
                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent"
                    placeholder="Ex: CTR"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/checklist")}
                  className="flex-1 px-6 py-3 border-2 border-[#374151] text-gray-300 rounded-xl hover:bg-[#374151] transition-all font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#001F05] text-white px-6 py-3 rounded-xl hover:bg-[#001F05]/80 transition-all font-semibold disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Salvando..." : "Salvar Loja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

