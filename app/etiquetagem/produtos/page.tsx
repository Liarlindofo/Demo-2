"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Package, Edit2, Trash2, ArrowLeft, Upload, Filter, TrendingUp, Layers } from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
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
      setImportProgress({ current: 0, total: 0 });
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
      
      setImportProgress({ current: data.produtos.length, total: data.produtos.length });
      setImportedProducts(data.produtos);
      setImporting(false);
      setShowImportModal(true);
      console.log('✅ Modal de preview deve abrir agora');
    } catch (error) {
      console.error('❌ Erro ao importar:', error);
      setImporting(false);
      alert(error instanceof Error ? error.message : 'Erro ao importar arquivo');
    } finally {
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
      const errosDetalhados: Array<{ nome: string; erro: string }> = [];

      for (const produto of importedProducts) {
        // Salvar todos os produtos com status 'sucesso', mesmo sem categoria
        if (produto.status !== 'sucesso') {
          erros++;
          errosDetalhados.push({
            nome: produto.nome,
            erro: produto.erro || 'Erro ao processar produto na importação'
          });
          continue;
        }

        try {
          // Validar dados antes de enviar
          if (!produto.nome || !produto.peso || !produto.unidade) {
            erros++;
            errosDetalhados.push({
              nome: produto.nome || 'Produto sem nome',
              erro: 'Dados incompletos: nome, peso ou unidade faltando'
            });
            continue;
          }

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
            const mensagemErro = errorData.error || 'Erro desconhecido';
            console.error(`Erro ao salvar ${produto.nome}:`, errorData);
            erros++;
            errosDetalhados.push({
              nome: produto.nome,
              erro: mensagemErro
            });
          }
        } catch (error) {
          const mensagemErro = error instanceof Error ? error.message : 'Erro de conexão';
          console.error(`Erro ao salvar ${produto.nome}:`, error);
          erros++;
          errosDetalhados.push({
            nome: produto.nome,
            erro: mensagemErro
          });
        }
      }

      setShowImportModal(false);
      setImportedProducts([]);
      await loadData();
      
      if (erros === 0) {
        alert(`✅ Importação concluída com sucesso!\n${sucessos} produtos salvos`);
      } else {
        // Mostrar mensagem com detalhes dos erros
        const mensagemErros = errosDetalhados
          .slice(0, 10) // Limitar a 10 erros para não sobrecarregar
          .map(e => `• ${e.nome}: ${e.erro}`)
          .join('\n');
        
        const mensagemCompleta = `Importação concluída\n\n✅ ${sucessos} produtos salvos\n❌ ${erros} erros${errosDetalhados.length > 0 ? '\n\nErros encontrados:\n' + mensagemErros + (erros > 10 ? `\n\n... e mais ${erros - 10} erros` : '') : ''}`;
        
        alert(mensagemCompleta);
      }
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      alert('Erro ao salvar produtos');
    } finally {
      setSaving(false);
    }
  };

  const produtosFiltrados = produtos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = selectedCategory === "all" || 
      (selectedCategory === "sem-categoria" && !p.categoriaId) ||
      p.categoriaId === selectedCategory;
    
    return matchSearch && matchCategory;
  });

  // Estatísticas
  const stats = {
    total: produtos.length,
    comCategoria: produtos.filter(p => p.categoriaId).length,
    semCategoria: produtos.filter(p => !p.categoriaId).length,
    categorias: categorias.length,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          onClick={() => router.push("/etiquetagem")}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gestão de Produtos</h1>
              <p className="text-gray-400">Gerencie seus produtos de forma simples e organizada</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleImportClick}
                disabled={importing}
                variant="outline"
                className="border-[#374151] text-gray-300 hover:bg-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Classificando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Importar Excel
                  </>
                )}
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
                Novo Produto
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          {!loading && produtos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#141415] border border-[#374151] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total de Produtos</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-400 opacity-50" />
                </div>
              </div>

              <div className="bg-[#141415] border border-[#374151] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Com Categoria</p>
                    <p className="text-2xl font-bold text-green-400">{stats.comCategoria}</p>
                  </div>
                  <Layers className="w-10 h-10 text-green-400 opacity-50" />
                </div>
              </div>

              <div className="bg-[#141415] border border-[#374151] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Sem Categoria</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.semCategoria}</p>
                  </div>
                  <Package className="w-10 h-10 text-yellow-400 opacity-50" />
                </div>
              </div>

              <div className="bg-[#141415] border border-[#374151] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Categorias</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.categorias}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-400 opacity-50" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-[#141415] border border-[#374151] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#0f0f10] border-[#374151] text-white"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05]"
              >
                <option value="all">Todas as categorias</option>
                <option value="sem-categoria">Sem categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || selectedCategory !== "all") && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {produtosFiltrados.length} produto(s) encontrado(s)
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Lista de Produtos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#001F05] border-t-transparent mb-4"></div>
            <p className="text-gray-400">Carregando produtos...</p>
          </div>
        ) : produtosFiltrados.length > 0 ? (
          <div className="grid gap-4">
            {produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                className="bg-[#141415] border border-[#374151] rounded-xl p-5 hover:border-[#001F05] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white text-xl">
                        {produto.nome}
                      </h3>
                      {produto.categoriaId ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                          {produto.categoria?.nome}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                          Sem categoria
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {produto.pesoPadrao && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Peso:</span>
                          <span className="text-white font-medium">
                            {produto.pesoPadrao} {produto.unidadeMedida}
                          </span>
                        </div>
                      )}
                      {produto.tipoArmazenamentoPadrao && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Armazenamento:</span>
                          <span className="text-white font-medium">
                            {produto.tipoArmazenamentoPadrao}
                          </span>
                        </div>
                      )}
                      {produto.marcaFornecedor && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Marca:</span>
                          <span className="text-white font-medium">
                            {produto.marcaFornecedor}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(produto)}
                      className="p-3 hover:bg-blue-500/20 rounded-lg transition-colors group"
                      title="Editar produto"
                    >
                      <Edit2 className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleDelete(produto)}
                      className="p-3 hover:bg-red-500/20 rounded-lg transition-colors group"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#141415] border border-[#374151] rounded-xl p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#001F05]/20 rounded-full mb-6">
                <Package className="w-10 h-10 text-[#001F05]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || selectedCategory !== "all" 
                  ? "Nenhum produto encontrado" 
                  : "Nenhum produto cadastrado"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedCategory !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando seu primeiro produto ou importe uma planilha"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-[#001F05] hover:bg-[#001F05]/80 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Cadastrar Produto
                </Button>
                <Button
                  onClick={handleImportClick}
                  variant="outline"
                  className="border-[#374151] text-gray-300 hover:bg-[#374151]"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Importar Excel
                </Button>
              </div>
            </div>
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

      {/* Overlay de Loading durante Importação */}
      {importing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#141415] border border-[#374151] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Spinner Animado */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-[#001F05]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#001F05] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[#001F05]" />
                </div>
              </div>

              {/* Mensagem Principal */}
              <h3 className="text-xl font-bold text-white mb-2">
                Processando Importação
              </h3>
              
              {/* Descrição */}
              <p className="text-gray-400 mb-6">
                Estamos classificando seus produtos com Inteligência Artificial.
                <br />
                <span className="text-sm">Isso pode levar alguns segundos...</span>
              </p>

              {/* Animação de Pontos */}
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[#001F05] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#001F05] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#001F05] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              {/* Informações Técnicas (opcional) */}
              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <p>🤖 IA: OpenAI GPT-4o-mini</p>
                <p>📊 Classificando categorias, pesos e armazenamento</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
