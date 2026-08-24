"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useUser } from "@stackframe/stack";

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const user = useUser({ or: 'redirect' });
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    managerName: "",
    phone: "",
    address: "",
    abbreviation: "",
    displayOrder: 0,
  });

  useEffect(() => {
    if (id) {
      fetchStore();
    }
  }, [id]);

  const fetchStore = async () => {
    try {
      const response = await fetch(`/api/checklist/stores/${id}`);
      if (!response.ok) throw new Error("Erro ao carregar loja");
      
      const data = await response.json();
      setFormData({
        name: data.name || "",
        managerName: data.managerName || "",
        phone: data.phone || "",
        address: data.address || "",
        abbreviation: data.abbreviation || "",
        displayOrder: data.displayOrder || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
      alert("Erro ao carregar dados da loja");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`/api/checklist/stores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar loja");
      }

      router.push(`/checklist/loja/${id}`);
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      alert(error instanceof Error ? error.message : "Erro ao atualizar loja. Tente novamente.");
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href={`/checklist/loja/${id}`}
          className="flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="bg-[#141415] rounded-2xl shadow-xl p-8 border border-[#374151]">
          <h1 className="text-3xl font-bold text-white mb-6">Editar Loja</h1>

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
                  value={formData.displayOrder || ''}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#001F05] text-white py-4 rounded-xl font-semibold hover:bg-[#001F05]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

