"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Package, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Produto, Categoria } from "@/types/etiquetagem";

export default function ProdutosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unidadeId = searchParams.get("unidade");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    categoriaId: "",
    pesoPadrao: "",
    unidadeMedida: "",
    marcaFornecedor: "",
    tipoArmazenamentoPadrao: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // Carregar categorias ao montar o componente e popular se necessário
  useEffect(() => {
    if (categorias.length === 0 && !loading) {
      // Tentar popular categorias automaticamente se não existirem
      fetch('/api/etiquetagem/seed', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success || data.message?.includes('já foram populadas')) {
            loadData();
          }
        })
        .catch(err => console.error('Erro ao popular categorias:', err));
    }
  }, [categorias.length, loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [produtosRes, categoriasRes] = await Promise.all([
        fetch("/api/etiquetagem/produtos"),
        fetch("/api/etiquetagem/categorias"),
      ]);

      if (!produtosRes.ok || !categoriasRes.ok) throw new Error("Erro ao carregar dados");

      const produtosData: Produto[] = await produtosRes.json();
      const categoriasData: Categoria[] = await categoriasRes.json();

      setProdutos(produtosData);
      setCategorias(categoriasData);
      if (categoriasData.length > 0) {
        setFormData(prev => ({ ...prev, categoriaId: categoriasData[0].id }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
    const dataToSend = {
      nome: formData.nome,
      categoriaId: formData.categoriaId,
      pesoPadrao: parseFloat(formData.pesoPadrao),
      unidadeMedida: formData.unidadeMedida,
      marcaFornecedor: formData.marcaFornecedor,
      tipoArmazenamentoPadrao: formData.tipoArmazenamentoPadrao,
    };

      let response;
      if (editingProduct) {
        response = await fetch(`/api/etiquetagem/produtos/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
      } else {
        response = await fetch("/api/etiquetagem/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar produto");
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        nome: "",
        categoriaId: categorias[0]?.id || "",
        pesoPadrao: "",
        unidadeMedida: "",
        marcaFornecedor: "",
        tipoArmazenamentoPadrao: "",
      });
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      setError(error instanceof Error ? error.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto);
    setFormData({
      nome: produto.nome,
      categoriaId: produto.categoriaId,
      pesoPadrao: produto.pesoPadrao?.toString() || "",
      unidadeMedida: produto.unidadeMedida || "",
      marcaFornecedor: produto.marcaFornecedor || "",
      tipoArmazenamentoPadrao: produto.tipoArmazenamentoPadrao || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (produto: Produto) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) return;

    try {
      const response = await fetch(`/api/etiquetagem/produtos/${produto.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir produto");
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      nome: "",
      categoriaId: categorias[0]?.id || "",
      pesoPadrao: "",
      unidadeMedida: "",
      marcaFornecedor: "",
      tipoArmazenamentoPadrao: "",
    });
    setError("");
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          onClick={() => router.push("/etiquetagem")}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Produtos</h1>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#001F05] hover:bg-[#001F05]/80 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#141415] border-[#374151] text-white"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
          </div>
        ) : produtosFiltrados.length > 0 ? (
          <div className="grid gap-3">
            {produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                className="bg-[#141415] border border-[#374151] rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {produto.nome}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{produto.categoria?.nome}</p>
                    {produto.marcaFornecedor && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">
                        {produto.marcaFornecedor}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(produto)}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Editar produto"
                    >
                      <Edit2 className="w-5 h-5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(produto)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#141415] border border-[#374151] rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-[#001F05] hover:bg-[#001F05]/80 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Primeiro Produto
            </Button>
          </div>
        )}
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-gray-300">
                Nome do Produto *
              </Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                placeholder="Ex: Frango Desossado"
              />
            </div>

            <div>
              <Label htmlFor="categoriaId" className="text-gray-300">
                Categoria *
              </Label>
              <select
                id="categoriaId"
                required
                value={formData.categoriaId}
                onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05] mt-1"
                disabled={categorias.length === 0}
              >
                <option value="">
                  {loading ? "Carregando..." : categorias.length === 0 ? "Nenhuma categoria disponível" : "Selecione uma categoria"}
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
              {categorias.length === 0 && !loading && (
                <div className="mt-2">
                  <p className="text-xs text-yellow-400 mb-2">
                    Nenhuma categoria cadastrada.
                  </p>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const response = await fetch('/api/etiquetagem/seed', { method: 'POST' });
                        const data = await response.json();
                        if (response.ok || data.message?.includes('já foram populadas')) {
                          await loadData();
                          alert('Categorias criadas com sucesso!');
                        } else {
                          alert('Erro ao criar categorias: ' + (data.error || 'Erro desconhecido'));
                        }
                      } catch (error) {
                        console.error('Erro ao criar categorias:', error);
                        alert('Erro ao criar categorias');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-xs bg-[#001F05] hover:bg-[#001F05]/80 text-white px-3 py-1 rounded"
                  >
                    Criar Categorias Padrão
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pesoPadrao" className="text-gray-300">
                  Peso Padrão *
                </Label>
                <Input
                  id="pesoPadrao"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.pesoPadrao}
                  onChange={(e) => setFormData({ ...formData, pesoPadrao: e.target.value })}
                  className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="unidadeMedida" className="text-gray-300">
                  Unidade de Medida *
                </Label>
                <select
                  id="unidadeMedida"
                  required
                  value={formData.unidadeMedida}
                  onChange={(e) => setFormData({ ...formData, unidadeMedida: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05] mt-1"
                >
                  <option value="">Selecione</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="un">un</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="tipoArmazenamentoPadrao" className="text-gray-300">
                Tipo de Armazenamento *
              </Label>
              <select
                id="tipoArmazenamentoPadrao"
                required
                value={formData.tipoArmazenamentoPadrao}
                onChange={(e) => setFormData({ ...formData, tipoArmazenamentoPadrao: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05] mt-1"
              >
                <option value="">Selecione</option>
                <option value="RESFRIADO">RESFRIADO</option>
                <option value="CONGELADO">CONGELADO</option>
                <option value="TEMPERATURA AMBIENTE">TEMPERATURA AMBIENTE</option>
              </select>
            </div>

            <div>
              <Label htmlFor="marcaFornecedor" className="text-gray-300">
                Marca/Fornecedor *
              </Label>
              <Input
                id="marcaFornecedor"
                required
                value={formData.marcaFornecedor}
                onChange={(e) => setFormData({ ...formData, marcaFornecedor: e.target.value })}
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                placeholder="Ex: Seara"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white"
              >
                {saving ? "Salvando..." : editingProduct ? "Atualizar Produto" : "Salvar Produto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
