"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, User, Scale, Cog, Printer, Trash2, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Produto, NomeResponsavel, Unidade } from "@/types/etiquetagem";
import { validarNomeCompleto } from "@/types/etiquetagem";
import { printEtiqueta, type EtiquetaData, getAvailablePrintMethods, resetSavedPort, testPrinter, testPrinterBasic, testPrinterESCPOS } from "@/lib/thermal-printer";

type Step = "produto" | "responsavel" | "peso" | "armazenamento" | "dias" | "preview";

const OPCOES_DIAS: Record<string, number[]> = {
  "CONGELADO": [30, 60, 90],
  "RESFRIADO": [3, 4, 5, 7, 15, 20],
  "TEMPERATURA AMBIENTE": [7, 15, 20, 30],
};

export default function GerarEtiquetaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unidadeId = searchParams.get("unidade");

  const [step, setStep] = useState<Step>("produto");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [nomesRecentes, setNomesRecentes] = useState<NomeResponsavel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [nomeErro, setNomeErro] = useState("");
  const [peso, setPeso] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("");
  const [tipoArmazenamento, setTipoArmazenamento] = useState<string>("");
  const [periodoDias, setPeriodoDias] = useState<number>(0);
  const [copias, setCopias] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; nomeId: string | null; nomeCompleto: string }>({
    isOpen: false,
    nomeId: null,
    nomeCompleto: "",
  });
  const [printing, setPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState("");
  const [printError, setPrintError] = useState("");
  const [printMethods, setPrintMethods] = useState<ReturnType<typeof getAvailablePrintMethods> | null>(null);

  useEffect(() => {
    if (!unidadeId) {
      router.push("/etiquetagem");
      return;
    }
    loadData();
    
    // Detectar métodos de impressão disponíveis
    if (typeof window !== 'undefined') {
      setPrintMethods(getAvailablePrintMethods());
    }
  }, [unidadeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar unidade
      const unidadeRes = await fetch("/api/etiquetagem/unidades");
      if (!unidadeRes.ok) throw new Error("Erro ao carregar unidade");
      const unidades: Unidade[] = await unidadeRes.json();
      const unidadeEncontrada = unidades.find(u => u.id === unidadeId);
      if (!unidadeEncontrada) {
        router.push("/etiquetagem");
        return;
      }
      setUnidade(unidadeEncontrada);

      // Buscar produtos e nomes
      const [produtosRes, nomesRes] = await Promise.all([
        fetch("/api/etiquetagem/produtos"),
        fetch(`/api/etiquetagem/unidades/${unidadeId}/nomes`),
      ]);

      if (!produtosRes.ok || !nomesRes.ok) throw new Error("Erro ao carregar dados");

      const produtosData: Produto[] = await produtosRes.json();
      const nomesData: NomeResponsavel[] = await nomesRes.json();

      setProdutos(produtosData);
      setNomesRecentes(nomesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setPeso(produto.pesoPadrao && produto.pesoPadrao > 0.01 ? produto.pesoPadrao.toString() : "");
    setUnidadeMedida(produto.unidadeMedida && produto.unidadeMedida.trim() !== '' ? produto.unidadeMedida : "");
    setStep("responsavel");
  };

  const handleSelectNome = (nome: NomeResponsavel) => {
    setNomeResponsavel(nome.nomeCompleto);
    setNomeErro("");
  };

  const handleDeleteNome = async (nomeId: string, nomeCompleto: string) => {
    setConfirmDelete({ isOpen: true, nomeId, nomeCompleto });
  };

  const confirmDeleteNome = async () => {
    if (!confirmDelete.nomeId) return;

    try {
      const response = await fetch(`/api/etiquetagem/nomes/${confirmDelete.nomeId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir nome");
      setNomesRecentes(nomesRecentes.filter(n => n.id !== confirmDelete.nomeId));
      setConfirmDelete({ isOpen: false, nomeId: null, nomeCompleto: "" });
    } catch (error) {
      console.error("Erro ao excluir nome:", error);
    }
  };

  const validateAndContinueNome = () => {
    const validacao = validarNomeCompleto(nomeResponsavel);
    if (!validacao.valido) {
      setNomeErro(validacao.erro || "Nome inválido");
      return;
    }
    setNomeResponsavel(validacao.nomeFormatado!);
    setNomeErro("");
    setStep("peso");
  };

  const handleSelectArmazenamento = (tipo: string) => {
    setTipoArmazenamento(tipo);
    setPeriodoDias(0);
    setStep("dias");
  };

  const handleSelectDias = (dias: number) => {
    setPeriodoDias(dias);
    setStep("preview");
  };

  const calcularDataValidade = () => {
    if (!periodoDias) return "";
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + periodoDias);
    return hoje.toLocaleDateString("pt-BR");
  };

  const getDataHoje = () => {
    return new Date().toLocaleDateString("pt-BR");
  };

  const handlePrint = async () => {
    if (!produtoSelecionado || !unidade || !tipoArmazenamento || !periodoDias) return;

    setPrinting(true);
    setPrintStatus("Preparando impressão...");
    setPrintError("");

    try {
      // Preparar dados da etiqueta
      const etiquetaData: EtiquetaData = {
        produtoNome: produtoSelecionado.nome,
        tipoArmazenamento: tipoArmazenamento,
        peso: peso,
        unidadeMedida: unidadeMedida,
        periodoDias: periodoDias,
        dataManipulacao: getDataHoje(),
        dataValidade: calcularDataValidade(),
        responsavelNome: nomeResponsavel,
        unidadeNome: unidade.nomeExibicao,
        unidadeCNPJ: unidade.cnpjFormatado,
        unidadeCidade: unidade.cidade,
        marcaFornecedor: produtoSelecionado.marcaFornecedor || undefined,
      };

      // Imprimir múltiplas cópias
      for (let i = 0; i < copias; i++) {
        if (copias > 1) {
          setPrintStatus(`Imprimindo cópia ${i + 1} de ${copias}...`);
        }

        const result = await printEtiqueta(etiquetaData, {
          onStatus: (status) => {
            setPrintStatus(status);
            // Limpar erro quando status muda
            if (status.includes('concluída') || status.includes('Conectando')) {
              setPrintError("");
            }
          },
        });

        if (!result.success) {
          // Se falhou completamente, mostrar erro e parar
          setPrintError(result.error || 'Erro desconhecido ao imprimir');
          setPrintStatus(`Erro: ${result.error || 'Erro desconhecido'}`);
          
          // Se foi cancelamento, não continuar com outras cópias
          if (result.error?.includes('cancel') || result.error?.includes('Cancel')) {
            break;
          }
        } else if (result.method === 'Download' || result.method === 'Download (App)') {
          // Se caiu no fallback de download, avisar mas continuar
          if (result.method === 'Download (App)') {
            setPrintStatus("Arquivo .bin baixado! Abra no app OpenLabel para imprimir.");
            setPrintError("Arquivo baixado. Abra o arquivo .bin no app OpenLabel para imprimir.");
          } else {
            setPrintStatus("Arquivo baixado! Use um app de impressão para imprimir.");
            setPrintError("Impressão direta não disponível. Arquivo baixado para impressão manual.");
          }
        } else if (result.method === 'Compartilhamento (App)') {
          // Compartilhamento com app
          setPrintStatus("Dados compartilhados! Abra o app OpenLabel para imprimir.");
          setPrintError("Dados compartilhados. Abra o app OpenLabel para imprimir.");
        } else {
          // Sucesso!
          setPrintError("");
          if (i === copias - 1) {
            setPrintStatus("Impressão concluída com sucesso!");
          }
        }

        // Pequeno delay entre cópias
        if (i < copias - 1 && result.success) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Limpar status após 5 segundos (mais tempo para ler)
      setTimeout(() => {
        if (!printError) {
          setPrintStatus("");
        }
      }, 5000);

    } catch (error: any) {
      console.error("Erro ao imprimir:", error);
      const errorMsg = error.message || 'Erro desconhecido';
      setPrintStatus(`Erro: ${errorMsg}`);
      setPrintError(errorMsg);
    } finally {
      setPrinting(false);
    }
  };

  // Impressão via driver do Windows (RECOMENDADO para Elgin i9!)
  const handlePrintViaDriver = () => {
    if (!produtoSelecionado || !unidade || !tipoArmazenamento || !periodoDias) return;

    // Criar janela de impressão
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    // Gerar HTML para cada cópia (importante para quebra de página/corte)
    let etiquetasHTML = '';
    for (let i = 0; i < copias; i++) {
      etiquetasHTML += `
        <div class="etiqueta-container">
          <div class="etiqueta-print">
            <!-- Cabeçalho -->
            <div class="header">
              <h1>${produtoSelecionado.nome}</h1>
              <div class="tipo">${tipoArmazenamento}</div>
            </div>

            <!-- Informações principais -->
            <div class="info-row">
              <span class="info-label">Peso/Qtd:</span>
              <span class="info-value">${peso} ${unidadeMedida}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Validade:</span>
              <span class="info-value">${periodoDias} dias</span>
            </div>

            <div class="divider"></div>

            <div class="info-row">
              <span class="info-label">Manipulado:</span>
              <span class="info-value">${getDataHoje()}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Vence em:</span>
              <span class="info-value">${calcularDataValidade()}</span>
            </div>

            <!-- Rodapé -->
            <div class="footer">
              <div class="responsavel">
                Responsável: <strong>${nomeResponsavel}</strong>
              </div>
              <div class="unidade">${unidade.nomeExibicao}</div>
              <div class="detalhes">CNPJ: ${unidade.cnpjFormatado}</div>
              <div class="detalhes">${unidade.cidade}</div>
              ${produtoSelecionado.marcaFornecedor ? `<div class="detalhes">Marca: ${produtoSelecionado.marcaFornecedor}</div>` : ''}
            </div>
          </div>
          ${i < copias - 1 ? '<div class="corte-separador"></div>' : ''}
        </div>
      `;
    }

    // Escrever HTML com CSS otimizado para impressora térmica
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta - ${produtoSelecionado.nome} (${copias} ${copias === 1 ? 'cópia' : 'cópias'})</title>
        <style>
          /* Reset */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          /* Configuração da página para impressora térmica 80mm */
          @page {
            size: 80mm auto;  /* Largura 80mm, altura automática */
            margin: 0;
          }

          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.2;
            }

            /* Container de cada etiqueta com separador para corte */
            .etiqueta-container {
              page-break-inside: avoid;
              page-break-after: always;
            }

            /* Separador para forçar corte da guilhotina */
            .corte-separador {
              height: 15mm;  /* Espaço para a guilhotina cortar */
              page-break-after: always;
              background: white;
            }

            /* Remover quebra após a última etiqueta */
            .etiqueta-container:last-child {
              page-break-after: auto;
            }

            .etiqueta-container:last-child .corte-separador {
              display: none;
            }
          }

          /* Estilo da etiqueta */
          body {
            width: 80mm;
            margin: 0 auto;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
          }

          .etiqueta-container {
            width: 100%;
            page-break-inside: avoid;
            page-break-after: always;
          }

          .etiqueta-print {
            width: 100%;
            padding: 5mm;
            background: white;
            color: black;
          }

          /* Separador visível na tela, espaço em branco na impressão */
          .corte-separador {
            height: 15mm;
            background: white;
            border-top: 2px dashed #ccc;
            margin: 0;
            padding: 0;
          }

          @media print {
            .corte-separador {
              border: none;
              background: white;
            }
          }

          .header {
            text-align: center;
            margin-bottom: 3mm;
            border-bottom: 2px solid black;
            padding-bottom: 2mm;
          }

          .header h1 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 1mm;
            text-transform: uppercase;
          }

          .header .tipo {
            font-size: 11pt;
            font-weight: bold;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 2mm 0;
            font-size: 10pt;
          }

          .info-label {
            font-weight: normal;
          }

          .info-value {
            font-weight: bold;
          }

          .divider {
            border-top: 1px solid black;
            margin: 2mm 0;
          }

          .footer {
            text-align: center;
            margin-top: 3mm;
            padding-top: 2mm;
            border-top: 2px solid black;
            font-size: 9pt;
          }

          .footer .responsavel {
            margin: 1mm 0;
          }

          .footer .unidade {
            font-weight: bold;
            margin: 1mm 0;
          }

          .footer .detalhes {
            font-size: 8pt;
            margin: 0.5mm 0;
          }
        </style>
      </head>
      <body>
        ${etiquetasHTML}
      </body>
      </html>
    `);

    printWindow.document.close();

    // Aguardar carregar e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Fechar após impressão
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 250);
    };
  };

  // Função de fallback para impressão tradicional (mantida como backup)
  const handlePrintTraditional = () => {
    if (!produtoSelecionado || !unidade || !tipoArmazenamento || !periodoDias) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const etiquetaHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Etiqueta - ${produtoSelecionado.nome}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            background: #f3f4f6;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .etiqueta-container {
            background: white;
            border: 2px solid #374151;
            width: 400px;
            height: 240px;
            padding: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }
          .etiqueta-content {
            height: 100%;
            display: flex;
            flex-direction: column;
            font-size: 11px;
            line-height: 1.1;
            color: black;
          }
          .section {
            border-bottom: 1px solid #1f2937;
            padding-bottom: 2px;
            margin-bottom: 2px;
          }
          .section-header {
            text-align: center;
          }
          .section-header .produto-nome {
            font-weight: bold;
            font-size: 13px;
            line-height: 1.05;
          }
          .section-header .armazenamento {
            font-size: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1px;
          }
          .info-label {
            font-weight: 500;
            font-size: 10px;
          }
          .info-value {
            font-weight: bold;
            font-size: 10px;
          }
          .responsavel-section {
            text-align: center;
          }
          .responsavel-label {
            font-weight: 500;
            font-size: 9px;
          }
          .responsavel-nome {
            font-weight: bold;
            font-size: 10px;
          }
          .empresa-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
          }
          .empresa-nome {
            font-weight: bold;
            font-size: 10px;
          }
          .empresa-info {
            font-size: 9px;
          }
          @media print {
            @page {
              size: 50mm 30mm;
              margin: 0;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .etiqueta-container {
              width: 50mm;
              height: 30mm;
              margin: 0;
              padding: 2mm;
              border: none;
              box-shadow: none;
              page-break-inside: avoid;
            }
            .etiqueta-content {
              font-size: 8px;
              line-height: 1.1;
            }
          }
        </style>
      </head>
      <body>
        <div class="etiqueta-container">
          <div class="etiqueta-content">
            <div class="section section-header">
              <p class="produto-nome">${produtoSelecionado.nome.toUpperCase()}</p>
              <p class="armazenamento">${tipoArmazenamento}</p>
            </div>
            <div class="section">
              <div class="info-row">
                <span class="info-label">Peso/Qtd:</span>
                <span class="info-value">${peso} ${unidadeMedida}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Validade:</span>
                <span class="info-value">${periodoDias} dias</span>
              </div>
            </div>
            <div class="section">
              <div class="info-row">
                <span class="info-label">Manipulado:</span>
                <span class="info-value">${getDataHoje()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vence em:</span>
                <span class="info-value">${calcularDataValidade()}</span>
              </div>
            </div>
            <div class="section responsavel-section">
              <p class="responsavel-label">Responsável:</p>
              <p class="responsavel-nome">${nomeResponsavel}</p>
            </div>
            <div class="empresa-section">
              <p class="empresa-nome">${unidade.nomeExibicao}</p>
              <p class="empresa-info">CNPJ: ${unidade.cnpjFormatado}</p>
              <p class="empresa-info">${unidade.cidade}</p>
              ${produtoSelecionado.marcaFornecedor ? `<p class="empresa-info">Marca: ${produtoSelecionado.marcaFornecedor}</p>` : ''}
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(etiquetaHTML);
    printWindow.document.close();
  };

  const handleSubmit = async () => {
    if (!produtoSelecionado || !unidade || !tipoArmazenamento || !periodoDias) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/etiquetagem/etiquetas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produtoId: produtoSelecionado.id,
          unidadeId: unidade.id,
          pesoQuantidade: parseFloat(peso),
          unidadeMedida: unidadeMedida,
          tipoArmazenamento: tipoArmazenamento,
          periodoDias: periodoDias,
          responsavelNome: nomeResponsavel,
          marcaFornecedor: produtoSelecionado.marcaFornecedor,
          copias: copias,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar etiqueta");
      }

      // Abrir janela de impressão
      handlePrint();
      
      // Voltar para home após um delay
      setTimeout(() => {
        router.push("/etiquetagem");
      }, 2000);
    } catch (error) {
      console.error("Erro ao gerar etiqueta:", error);
      setError(error instanceof Error ? error.message : "Erro ao gerar etiqueta");
    } finally {
      setSaving(false);
    }
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStepIndicator = () => {
    const steps = [
      { key: "produto", label: "Produto" },
      { key: "responsavel", label: "Responsável" },
      { key: "peso", label: "Peso" },
      { key: "armazenamento", label: "Armazenamento" },
      { key: "dias", label: "Validade" },
      { key: "preview", label: "Pré-Visualização" },
    ];

    const currentIndex = steps.findIndex(s => s.key === step);

    return (
      <div className="flex items-center justify-between mb-6 overflow-x-auto">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  index <= currentIndex
                    ? "bg-[#001F05] text-white"
                    : "bg-[#374151] text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-xs mt-1 text-gray-400 hidden sm:block truncate">{s.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 rounded ${
                  index < currentIndex ? "bg-[#001F05]" : "bg-[#374151]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"></div>
      </div>
    );
  }

  if (!unidade) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Unidade não encontrada</p>
          <Button onClick={() => router.push("/etiquetagem")} className="bg-[#001F05] hover:bg-[#001F05]/80">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => router.push("/etiquetagem")}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-8">Gerar Etiqueta</h1>

        {renderStepIndicator()}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step: Selecionar Produto */}
        {step === "produto" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#141415] border-[#374151] text-white"
              />
            </div>

            <div className="grid gap-3">
              {produtosFiltrados.map((produto) => (
                <div
                  key={produto.id}
                  onClick={() => handleSelectProduct(produto)}
                  className="bg-[#141415] border border-[#374151] rounded-xl p-4 hover:bg-[#374151] transition-colors cursor-pointer"
                >
                  <h3 className="font-semibold text-white mb-1">{produto.nome}</h3>
                  <p className="text-sm text-gray-400">{produto.categoria?.nome}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Nome Responsável */}
        {step === "responsavel" && (
          <div className="space-y-6">
            <div className="bg-[#141415] border border-[#374151] rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nomeResponsavel" className="text-gray-300 mb-2 block">
                    Nome completo do responsável
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="nomeResponsavel"
                      type="text"
                      placeholder="Digite nome e sobrenome"
                      value={nomeResponsavel}
                      onChange={(e) => {
                        setNomeResponsavel(e.target.value);
                        setNomeErro("");
                      }}
                      className={`w-full pl-12 pr-4 py-3 bg-[#0f0f10] border-[#374151] text-white ${
                        nomeErro ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {nomeErro && (
                    <p className="text-sm text-red-400 mt-2">{nomeErro}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Mínimo 2 palavras (nome + sobrenome)
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("produto")}
                    className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={validateAndContinueNome}
                    className="flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </div>

            {nomesRecentes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Nomes Recentes</h3>
                <div className="grid gap-2">
                  {nomesRecentes.map((nome) => (
                    <div
                      key={nome.id}
                      onClick={() => handleSelectNome(nome)}
                      className="bg-[#141415] border border-[#374151] rounded-xl p-4 hover:bg-[#374151] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#001F05] p-2 rounded-lg">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{nome.nomeCompleto}</p>
                            <p className="text-xs text-gray-400">{nome.totalUsos} usos</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNome(nome.id, nome.nomeCompleto);
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Peso */}
        {step === "peso" && (
          <div className="bg-[#141415] border border-[#374151] rounded-xl p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="peso" className="text-gray-300 mb-2 block">
                  Peso / Quantidade
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="peso"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#0f0f10] border-[#374151] text-white"
                    />
                  </div>
                  <select
                    value={unidadeMedida}
                    onChange={(e) => setUnidadeMedida(e.target.value)}
                    className="w-32 px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05]"
                  >
                    <option value="">Selecione</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="un">un</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("responsavel")}
                  className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep("armazenamento")}
                  disabled={!peso || !unidadeMedida || parseFloat(peso) <= 0}
                  className="flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white disabled:opacity-50"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Armazenamento */}
        {step === "armazenamento" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Selecione a forma de armazenamento</p>
            <div className="grid gap-3">
              {["CONGELADO", "RESFRIADO", "TEMPERATURA AMBIENTE"].map((tipo) => (
                <div
                  key={tipo}
                  onClick={() => handleSelectArmazenamento(tipo)}
                  className={`bg-[#141415] border rounded-xl p-4 cursor-pointer transition-colors ${
                    tipoArmazenamento === tipo
                      ? "border-[#001F05] bg-[#001F05]/20"
                      : "border-[#374151] hover:bg-[#374151]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Cog className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-white">{tipo}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("peso")}
              className="w-full border-[#374151] text-gray-300 hover:bg-[#374151]"
            >
              Voltar
            </Button>
          </div>
        )}

        {/* Step: Quantidade de Dias */}
        {step === "dias" && tipoArmazenamento && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Selecione a quantidade de dias de validade</p>
            <div className="grid gap-3">
              {OPCOES_DIAS[tipoArmazenamento]?.map((dias) => (
                <div
                  key={dias}
                  onClick={() => handleSelectDias(dias)}
                  className={`bg-[#141415] border rounded-xl p-4 cursor-pointer transition-colors ${
                    periodoDias === dias
                      ? "border-[#001F05] bg-[#001F05]/20"
                      : "border-[#374151] hover:bg-[#374151]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-white">{dias} DIAS</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("armazenamento")}
              className="w-full border-[#374151] text-gray-300 hover:bg-[#374151]"
            >
              Voltar
            </Button>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && produtoSelecionado && tipoArmazenamento && periodoDias && (
          <div className="space-y-6">
            <div className="bg-[#141415] border border-[#374151] rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="copias" className="text-lg font-bold text-white mb-3 block">
                    Número de cópias
                  </Label>
                  <Input
                    id="copias"
                    type="number"
                    min="1"
                    max="10"
                    value={copias}
                    onChange={(e) => setCopias(parseInt(e.target.value) || 1)}
                    className="w-full px-6 py-4 bg-[#0f0f10] border-[#374151] text-white text-2xl font-bold text-center"
                  />
                  <p className="text-sm text-gray-400 mt-2 text-center">
                    {copias === 1 ? "1 etiqueta será impressa" : `${copias} etiquetas serão impressas`}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#141415] border border-[#374151] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Pré-visualização da Etiqueta (80x30mm)</h3>
              
              <div className="flex justify-center">
                <div id="etiqueta-preview" className="bg-white border-2 border-gray-400 shadow-lg" style={{ width: '640px', height: '240px' }}>
                  <div className="h-full flex flex-col text-black p-2 text-xs leading-tight">
                    <div className="text-center border-b border-gray-800 pb-1 mb-1">
                      <p className="font-bold text-sm leading-tight">{produtoSelecionado.nome.toUpperCase()}</p>
                      <p className="text-xs">{tipoArmazenamento}</p>
                    </div>
                    <div className="border-b border-gray-800 pb-1 mb-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-xs">Peso/Qtd:</span>
                        <span className="font-bold text-xs">{peso} {unidadeMedida}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="font-medium text-xs">Validade:</span>
                        <span className="font-bold text-xs">{periodoDias} dias</span>
                      </div>
                    </div>
                    <div className="border-b border-gray-800 pb-1 mb-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-xs">Manipulado:</span>
                        <span className="font-bold text-xs">{getDataHoje()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="font-medium text-xs">Vence em:</span>
                        <span className="font-bold text-xs">{calcularDataValidade()}</span>
                      </div>
                    </div>
                    <div className="border-b border-gray-800 pb-1 mb-1">
                      <p className="text-xs font-medium text-center">Responsável:</p>
                      <p className="font-bold text-xs text-center">{nomeResponsavel}</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-center">
                        <p className="font-bold text-xs">{unidade.nomeExibicao}</p>
                        <p className="text-xs">CNPJ: {unidade.cnpjFormatado}</p>
                        <p className="text-xs">{unidade.cidade}</p>
                        {produtoSelecionado.marcaFornecedor && (
                          <p className="text-xs">Marca: {produtoSelecionado.marcaFornecedor}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Dimensões reais: 50mm x 30mm (formato para impressora térmica)
              </p>
            </div>

            <div className="bg-[#141415] border border-[#374151] rounded-xl p-6">
              <div className="space-y-4">
                {/* Status da impressão */}
                {(printStatus || printError) && (
                  <div className={`bg-[#0f0f10] border rounded-lg p-3 ${
                    printError 
                      ? 'border-red-500/50 bg-red-500/10' 
                      : 'border-[#374151]'
                  }`}>
                    <div className="flex items-center gap-2">
                      {printing && !printError && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
                      {printError && <span className="text-red-500">⚠️</span>}
                      <div className="flex-1">
                        <p className={`text-sm ${printError ? 'text-red-400' : 'text-gray-300'}`}>
                          {printError || printStatus}
                        </p>
                        {printError && printMethods && (
                          <div className="text-xs text-gray-500 mt-2 space-y-1">
                            {printMethods.platform === 'Desktop' && (
                              <>
                                <p className="font-medium text-yellow-400">💡 Não imprimiu? Verifique:</p>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                  <li>Impressora está ligada e com papel</li>
                                  <li>Cabo USB bem conectado</li>
                                  <li>Tampa fechada corretamente</li>
                                  <li>Clique em "Testar Impressora" abaixo</li>
                                  <li>Veja os logs no console (F12)</li>
                                </ul>
                              </>
                            )}
                            {printMethods.platform === 'Android' && (
                              <>Dica: Para impressão no celular, use o app OpenLabel. O arquivo baixado pode ser aberto no app para imprimir. Ou compartilhe os dados diretamente com o app quando solicitado.</>
                            )}
                            {printMethods.platform !== 'Desktop' && printMethods.platform !== 'Android' && (
                              <>Certifique-se de que a impressora está ligada e conectada.</>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações sobre métodos de impressão */}
                {printMethods && (
                  <div className="bg-[#0f0f10] border border-[#374151] rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">Métodos disponíveis:</p>
                    <div className="flex flex-wrap gap-2">
                      {printMethods.webBluetooth && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Bluetooth
                        </span>
                      )}
                      {printMethods.webSerial && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          ✅ USB (Impressão Direta)
                        </span>
                      )}
                      {printMethods.webShare && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          Compartilhar
                        </span>
                      )}
                      <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                        Download
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Plataforma: {printMethods.platform}
                    </p>
                    {printMethods.webSerial && (
                      <p className="text-xs text-green-400 mt-2">
                        💡 Após configurar uma vez, as próximas impressões serão diretas!
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {/* Botão RECOMENDADO - Via Driver do Windows */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="text-xs text-green-300 font-medium mb-2">✅ RECOMENDADO - Via Driver do Windows</div>
                    <Button
                      onClick={handlePrintViaDriver}
                      disabled={printing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      Imprimir {copias > 1 ? `${copias} Etiquetas` : 'Etiqueta'}
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      ✓ Gera {copias} {copias === 1 ? 'etiqueta' : 'etiquetas'} com corte entre cada uma<br/>
                      ✓ Usa o driver oficial da Elgin i9<br/>
                      ✓ Não precisa configurar cópias no Ctrl+P
                    </p>
                  </div>

                  {/* Botões secundários */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("dias")}
                      disabled={printing}
                      className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={saving || printing}
                      className="flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white"
                      title="Impressão direta USB (experimental)"
                    >
                      {printing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Imprimindo...
                        </>
                      ) : (
                        <>
                          <Printer className="w-5 h-5 mr-2" />
                          USB Direta
                        </>
                      )}
                    </Button>
                  </div>
                  {printMethods?.webSerial && (
                    <div className="space-y-2">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-2">
                        <div className="text-xs text-blue-300 font-medium mb-1">🧪 Diagnóstico ELGIN i9</div>
                        <div className="text-xs text-gray-400">
                          Execute os testes NA ORDEM para descobrir o problema:
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={async () => {
                            setPrinting(true);
                            setPrintError("");
                            setPrintStatus("Iniciando teste básico...");
                            const result = await testPrinterBasic((status) => setPrintStatus(status));
                            if (!result.success) {
                              setPrintError(result.error || "Erro ao testar");
                            }
                            setPrinting(false);
                          }}
                          disabled={printing}
                          className="text-xs text-gray-400 hover:text-gray-300 hover:bg-[#374151]/50 h-auto py-2"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">1️⃣</span>
                            <span>Texto Puro</span>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={async () => {
                            setPrinting(true);
                            setPrintError("");
                            setPrintStatus("Iniciando teste ESC/POS...");
                            const result = await testPrinterESCPOS((status) => setPrintStatus(status));
                            if (!result.success) {
                              setPrintError(result.error || "Erro ao testar");
                            }
                            setPrinting(false);
                          }}
                          disabled={printing}
                          className="text-xs text-gray-400 hover:text-gray-300 hover:bg-[#374151]/50 h-auto py-2"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">2️⃣</span>
                            <span>ESC/POS</span>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={async () => {
                            setPrinting(true);
                            setPrintError("");
                            setPrintStatus("Iniciando teste completo...");
                            const result = await testPrinter((status) => setPrintStatus(status));
                            if (!result.success) {
                              setPrintError(result.error || "Erro ao testar");
                            }
                            setPrinting(false);
                          }}
                          disabled={printing}
                          className="text-xs text-gray-400 hover:text-gray-300 hover:bg-[#374151]/50 h-auto py-2"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">3️⃣</span>
                            <span>Completo</span>
                          </div>
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          resetSavedPort();
                          setPrintStatus("Impressora resetada. Na próxima impressão você poderá selecionar outra impressora.");
                          setPrintError("");
                          setTimeout(() => setPrintStatus(""), 4000);
                        }}
                        disabled={printing}
                        className="w-full text-xs text-gray-400 hover:text-gray-300 hover:bg-[#374151]/50"
                      >
                        <Cog className="w-3 h-3 mr-1" />
                        Trocar Impressora USB
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dialog de confirmação de exclusão */}
        <Dialog open={confirmDelete.isOpen} onOpenChange={(open) => !open && setConfirmDelete({ isOpen: false, nomeId: null, nomeCompleto: "" })}>
          <DialogContent className="bg-[#141415] border-[#374151] text-white">
            <DialogHeader>
              <DialogTitle>Remover Nome</DialogTitle>
            </DialogHeader>
            <p className="text-gray-300 mb-4">
              Tem certeza que deseja remover <strong>{confirmDelete.nomeCompleto}</strong> da lista de nomes recentes?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete({ isOpen: false, nomeId: null, nomeCompleto: "" })}
                className="flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDeleteNome}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Remover
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
