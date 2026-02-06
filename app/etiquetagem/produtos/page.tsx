"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Package, Edit2, Trash2, ArrowLeft, Upload } from "lucide-react";
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
    tipoArmazenamentoPadrao: "",
  });
  const [error, setError] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      categoriaId: formData.categoriaId || undefined,
      pesoPadrao: parseFloat(formData.pesoPadrao),
      unidadeMedida: formData.unidadeMedida,
      tipoArmazenamentoPadrao: formData.tipoArmazenamentoPadrao || undefined,
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
      tipoArmazenamentoPadrao: "",
    });
    setError("");
  };

  const handleImportClick = () => {
    console.log('🖱️ Botão Importar clicado');
    console.log('📎 fileInputRef:', fileInputRef.current);
    if (fileInputRef.current) {
      console.log('✅ Acionando input de arquivo...');
      fileInputRef.current.click();
    } else {
      console.error('❌ fileInputRef não encontrado!');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 handleFileUpload chamado');
    const file = e.target.files?.[0];
    console.log('📄 Arquivo selecionado:', file?.name, file?.size);
    
    if (!file) {
      console.log('⚠️ Nenhum arquivo selecionado');
      return;
    }

    try {
      setImporting(true);
      setError("");
      console.log('🚀 Iniciando upload...');

      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Enviando para API...');
      const response = await fetch('/api/etiquetagem/importar-produtos', {
        method: 'POST',
        body: formData,
      });

      console.log('📨 Resposta recebida:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao importar');
      }

      const data = await response.json();
      console.log('📥 Dados recebidos da importação:', data);
      console.log('📦 Produtos importados:', data.produtos);
      setImportedProducts(data.produtos);
      setShowImportModal(true);
      console.log('✅ Modal de preview deve abrir agora');
    } catch (error) {
      console.error('❌ Erro ao importar:', error);
      alert(error instanceof Error ? error.message : 'Erro ao importar arquivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveImportedProducts = async () => {
    try {
      setSaving(true);
      let sucessos = 0;
      let erros = 0;

      for (const produto of importedProducts) {
        // Salvar todos os produtos com status 'sucesso', mesmo sem categoria
        if (produto.status !== 'sucesso') continue;

        try {
          const response = await fetch('/api/etiquetagem/produtos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: produto.nome,
              categoriaId: produto.categoriaId || undefined,
              pesoPadrao: produto.peso || 1.0,
              unidadeMedida: produto.unidade || 'kg',
              tipoArmazenamentoPadrao: produto.armazenamento || undefined,
            }),
          });

          if (response.ok) {
            sucessos++;
          } else {
            const errorData = await response.json();
            console.error(`Erro ao salvar ${produto.nome}:`, errorData);
            erros++;
          }
        } catch (error) {
          console.error(`Erro ao salvar ${produto.nome}:`, error);
          erros++;
        }
      }

      setShowImportModal(false);
      setImportedProducts([]);
      await loadData();
      
      if (erros === 0) {
        alert(`✅ Importação concluída com sucesso!\n${sucessos} produtos salvos`);
      } else {
        alert(`Importação concluída\n✅ ${sucessos} produtos salvos\n❌ ${erros} erros`);
      }
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      alert('Erro ao salvar produtos');
    } finally {
      setSaving(false);
    }
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
          <div className="flex gap-3">
            <Button
              onClick={handleImportClick}
              variant="outline"
              disabled={importing}
              className="border-[#001F05] text-[#001F05] hover:bg-[#001F05] hover:text-white disabled:opacity-50"
            >
              <Upload className="w-5 h-5 mr-2" />
              {importing ? 'Importando...' : 'Importar'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => setShowModal(true)}
              className="bg-[#001F05] hover:bg-[#001F05]/80 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo
            </Button>
          </div>
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
                    <p className="text-sm text-gray-400">{produto.categoria?.nome}</p>
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
                Categoria
              </Label>
              <select
                id="categoriaId"
                value={formData.categoriaId}
                onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05] mt-1"
                disabled={categorias.length === 0}
              >
                <option value="">
                  {loading ? "Carregando..." : categorias.length === 0 ? "Nenhuma categoria disponível" : "Selecione uma categoria (opcional)"}
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
                Tipo de Armazenamento
              </Label>
              <select
                id="tipoArmazenamentoPadrao"
                value={formData.tipoArmazenamentoPadrao}
                onChange={(e) => setFormData({ ...formData, tipoArmazenamentoPadrao: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05] mt-1"
              >
                <option value="">Selecione (opcional)</option>
                <option value="RESFRIADO">RESFRIADO</option>
                <option value="CONGELADO">CONGELADO</option>
                <option value="TEMPERATURA AMBIENTE">TEMPERATURA AMBIENTE</option>
              </select>
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

      {/* Modal de Preview de Importação */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Preview da Importação</DialogTitle>
          </DialogHeader>

          {importing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent mb-4"></div>
              <p className="text-gray-400">Classificando produtos com IA...</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-300">
                  <strong>{importedProducts.length} produtos</strong> encontrados na planilha.
                  Revise as informações antes de salvar.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#374151]">
                      <th className="text-left p-2 text-gray-400 text-sm">Produto</th>
                      <th className="text-left p-2 text-gray-400 text-sm">Categoria</th>
                      <th className="text-left p-2 text-gray-400 text-sm">Peso</th>
                      <th className="text-left p-2 text-gray-400 text-sm">Unidade</th>
                      <th className="text-left p-2 text-gray-400 text-sm">Armazenamento</th>
                      <th className="text-left p-2 text-gray-400 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedProducts.map((produto, index) => (
                      <tr key={index} className="border-b border-[#374151]/50">
                        <td className="p-2 text-white font-medium">{produto.nome}</td>
                        <td className="p-2">
                          {produto.categoriaId ? (
                            <span className="text-green-400 text-sm">✓ {produto.categoriaSugerida}</span>
                          ) : (
                            <span className="text-yellow-400 text-sm">⚠ {produto.categoriaSugerida || 'Sem categoria'}</span>
                          )}
                        </td>
                        <td className="p-2 text-gray-300 text-sm">{produto.peso || '-'}</td>
                        <td className="p-2 text-gray-300 text-sm">{produto.unidade || '-'}</td>
                        <td className="p-2 text-gray-300 text-sm">{produto.armazenamento || '-'}</td>
                        <td className="p-2">
                          {produto.status === 'sucesso' ? (
                            <span className="text-green-400 text-xs">✓ OK</span>
                          ) : (
                            <span className="text-red-400 text-xs">✗ Erro</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                <p className="text-xs text-yellow-300">
                  <strong>💡 Dica:</strong> Produtos com categoria marcada em amarelo (⚠) serão salvos sem categoria.
                  Você pode editá-los depois.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportedProducts([]);
                  }}
                  className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveImportedProducts}
                  disabled={saving || importedProducts.length === 0}
                  className="flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white"
                >
                  {saving ? "Salvando..." : `Salvar ${importedProducts.filter(p => p.status === 'sucesso').length} Produtos`}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
