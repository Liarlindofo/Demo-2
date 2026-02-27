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
  const [showPrintInstructions, setShowPrintInstructions] = useState(false);

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

  // Abrir pop-up de instruções automaticamente ao chegar na visualização
  useEffect(() => {
    if (step === "preview") {
      setShowPrintInstructions(true);
    }
  }, [step]);

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
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const getDataHoje = () => {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const getValidadeEmDias = () => {
    return `${periodoDias} dias`;
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

  // Função auxiliar para gerar HTML de uma etiqueta individual
  const gerarEtiquetaHTML = () => {
    return `
      <table class="etiqueta-coluna" cellspacing="0" cellpadding="0">
        <tbody>
          <!-- Responsável -->
          <tr>
            <td colspan="2" style="text-align: center; padding: 0.8mm 0.5mm;">
              <div style="font-size: 5.5pt; line-height: 1.2;">
                <span style="font-weight: normal;">Responsável:</span><br>
                <span style="font-weight: bold; font-size: 6.5pt;">${nomeResponsavel}</span>
              </div>
            </td>
          </tr>
          
          <!-- Divisor -->
          <tr>
            <td colspan="2" style="border-top: 1px solid black; height: 0.3mm; padding: 0;"></td>
          </tr>
          
          <!-- Cabeçalho do Produto -->
          <tr>
            <td colspan="2" class="header" style="padding: 0.8mm 0.5mm;">
              <div style="text-align: center; font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.1;">
                ${produtoSelecionado.nome} ${tipoArmazenamento}
              </div>
            </td>
          </tr>
          
          <!-- Divisor -->
          <tr>
            <td colspan="2" style="border-top: 1px solid black; height: 0.3mm; padding: 0;"></td>
          </tr>
          
          <!-- Peso/Qtd e Produzido -->
          <tr>
            <td style="width: 50%; padding: 0.8mm 0.5mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.3;">
                <span style="font-weight: normal;">Peso/Qtd:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${peso} ${unidadeMedida}</span>
              </div>
            </td>
            <td style="width: 50%; border-left: 1px solid black; padding: 0.8mm 0.5mm 0.8mm 1mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.3;">
                <span style="font-weight: normal;">Produzido:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${getDataHoje()}</span>
              </div>
            </td>
          </tr>
          
          <!-- Divisor -->
          <tr>
            <td colspan="2" style="border-top: 1px solid black; height: 0.3mm; padding: 0;"></td>
          </tr>
          
          <!-- Validade e Vence -->
          <tr>
            <td style="width: 50%; padding: 0.8mm 0.5mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.3;">
                <span style="font-weight: normal;">Validade:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${getValidadeEmDias()}</span>
              </div>
            </td>
            <td style="width: 50%; border-left: 1px solid black; padding: 0.8mm 0.5mm 0.8mm 1mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.3;">
                <span style="font-weight: normal;">Vence:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${calcularDataValidade()}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    `;
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

    // Gerar HTML para cada cópia - duas etiquetas por página (50mm + 4mm + 50mm = 104mm)
    let etiquetasHTML = '';
    const totalPaginas = Math.ceil(copias / 2);
    
    for (let pagina = 0; pagina < totalPaginas; pagina++) {
      const primeiraEtiqueta = pagina * 2;
      const segundaEtiqueta = primeiraEtiqueta + 1;
      
      etiquetasHTML += `
        <table class="linha-bobina" cellspacing="0" cellpadding="0">
          <tr>
            <td class="coluna-etiqueta">
              ${gerarEtiquetaHTML()}
            </td>
            <td class="coluna-espaco"></td>
            ${segundaEtiqueta < copias ? `
            <td class="coluna-etiqueta">
              ${gerarEtiquetaHTML()}
            </td>
            ` : '<td class="coluna-etiqueta vazia"></td>'}
          </tr>
        </table>
        ${pagina < totalPaginas - 1 ? '<div style="page-break-after: always;"></div>' : ''}
      `;
    }

    // Escrever HTML com CSS otimizado para duas etiquetas de 50mm x 30mm com 4mm de espaçamento
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

          /* Página para duas etiquetas: 50mm + 4mm + 50mm = 104mm x 30mm */
          @page {
            size: 104mm 30mm;
            margin: 0mm;
          }

          body {
            width: 104mm;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
          }

          /* Linha da bobina contém duas colunas */
          table.linha-bobina {
            width: 104mm;
            height: 30mm;
            border-collapse: collapse;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Cada coluna de etiqueta (50mm x 30mm) */
          .coluna-etiqueta {
            width: 50mm;
            height: 30mm;
            padding: 1mm;
            vertical-align: top;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Coluna de espaçamento de 4mm */
          .coluna-espaco {
            width: 4mm;
            height: 30mm;
          }

          .coluna-etiqueta.vazia {
            background: transparent;
            width: 50mm;
          }

          /* Tabela da etiqueta dentro de cada coluna */
          table.etiqueta-coluna {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
            font-size: 7pt;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table.etiqueta-coluna td {
            padding: 0;
            vertical-align: top;
          }

          .info-label {
            font-weight: normal;
            font-size: 6pt;
            width: auto;
          }

          .info-value {
            font-weight: bold;
            font-size: 7pt;
            text-align: left;
            width: auto;
          }

          .header {
            text-align: center;
            padding: 1mm 0.5mm;
          }

          @media print {
            @page {
              size: 104mm 30mm;
              margin: 0mm;
            }
            
            body {
              width: 104mm !important;
              height: 30mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            table.linha-bobina {
              width: 104mm !important;
              height: 30mm !important;
              border-collapse: collapse !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .coluna-etiqueta {
              width: 50mm !important;
              height: 30mm !important;
              vertical-align: top !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            .coluna-espaco {
              width: 4mm !important;
              height: 30mm !important;
            }

            table.etiqueta-coluna {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
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
          html { margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            background: #f3f4f6;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .etiqueta-container {
            background: white;
            border: 2px solid #374151;
            width: 400px;
            height: 200px;
            padding: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }
          .etiqueta-content {
            height: 100%;
            display: flex;
            flex-direction: column;
            font-size: 10px;
            line-height: 1;
            color: black;
          }
          .section {
            border-bottom: 1px solid #1f2937;
            padding-bottom: 1px;
            margin-bottom: 1px;
          }
          .section-header {
            text-align: center;
          }
          .section-header .produto-nome {
            font-weight: bold;
            font-size: 12px;
            line-height: 1;
          }
          .section-header .armazenamento {
            font-size: 9px;
            line-height: 1;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0;
          }
          .info-row-two-cols {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 0;
            gap: 4px;
          }
          .info-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            line-height: 1.3;
          }
          .info-col.border-left {
            border-left: 1px solid #1f2937;
            padding-left: 4px;
          }
          .info-label {
            font-weight: normal;
            font-size: 8px;
            line-height: 1.2;
          }
          .info-value {
            font-weight: bold;
            font-size: 9px;
            line-height: 1.2;
            margin-top: 2px;
          }
          .responsavel-section {
            text-align: center;
            padding-bottom: 0;
          }
          .responsavel-label {
            font-weight: 500;
            font-size: 8px;
            line-height: 1;
          }
          .responsavel-nome {
            font-weight: bold;
            font-size: 9px;
            line-height: 1;
          }
          .empresa-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            line-height: 1;
          }
          .empresa-nome {
            font-weight: bold;
            font-size: 9px;
            line-height: 1;
          }
          .empresa-info {
            font-size: 8px;
            line-height: 1;
          }
          @media print {
            @page {
              size: 50mm 30mm;
              margin: 0mm !important;
              padding: 0mm !important;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            html {
              margin: 0 !important;
              padding: 0 !important;
              height: 30mm !important;
              width: 50mm !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              height: 30mm !important;
              width: 50mm !important;
              background: white !important;
              display: block !important;
              position: relative !important;
            }
            .etiqueta-container {
              width: 50mm !important;
              height: 30mm !important;
              margin: 0 !important;
              margin-top: -15mm !important;
              padding: 0.5mm 1mm !important;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid;
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              background: white !important;
            }
            .etiqueta-content {
              font-size: 7px;
              line-height: 1;
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            .section {
              padding-bottom: 0.3mm;
              margin-bottom: 0.3mm;
            }
            .section:first-child {
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            .section-header .produto-nome {
              font-size: 9px;
              line-height: 1;
              margin: 0 !important;
              padding: 0 !important;
            }
            .section-header .armazenamento {
              font-size: 7px;
              line-height: 1;
              margin: 0 !important;
              padding: 0 !important;
            }
            p {
              margin: 0 !important;
              padding: 0 !important;
            }
            .info-label,
            .info-value {
              font-size: 7px;
            }
            .responsavel-label {
              font-size: 6px;
            }
            .responsavel-nome {
              font-size: 7px;
            }
            .empresa-nome {
              font-size: 7px;
            }
            .empresa-info {
              font-size: 6px;
              line-height: 1.1;
            }
          }
        </style>
      </head>
      <body>
        <div class="etiqueta-container">
          <div class="etiqueta-content">
            <div class="section responsavel-section">
              <span class="responsavel-label">Responsável:</span><br>
              <span class="responsavel-nome">${nomeResponsavel}</span>
            </div>
            <div class="section section-header">
              <p class="produto-nome">${produtoSelecionado.nome.toUpperCase()} ${tipoArmazenamento}</p>
            </div>
            <div class="section">
              <div class="info-row-two-cols">
                <div class="info-col">
                  <span class="info-label">Peso/Qtd:</span><br>
                  <span class="info-value">${peso} ${unidadeMedida}</span>
                </div>
                <div class="info-col border-left">
                  <span class="info-label">Produzido:</span><br>
                  <span class="info-value">${getDataHoje()}</span>
                </div>
              </div>
            </div>
            <div class="section">
              <div class="info-row-two-cols">
                <div class="info-col">
                  <span class="info-label">Validade:</span><br>
                  <span class="info-value">${getValidadeEmDias()}</span>
                </div>
                <div class="info-col border-left">
                  <span class="info-label">Vence:</span><br>
                  <span class="info-value">${calcularDataValidade()}</span>
                </div>
              </div>
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
              <h3 className="text-lg font-bold text-white mb-4">Pré-visualização da Etiqueta (104x30mm - Duas Colunas)</h3>
              
              <div className="flex justify-center">
                <div id="etiqueta-preview" className="bg-white border-2 border-gray-400 shadow-lg" style={{ width: '832px', height: '240px' }}>
                  <div className="h-full flex flex-row gap-4">
                    {/* Coluna 1 */}
                    <div className="w-1/2 h-full flex flex-col text-black p-2 text-xs leading-tight">
                      {/* Responsável */}
                      <div className="text-center border-b border-gray-800 pb-1 mb-1">
                        <span className="font-normal text-[9px]">Responsável:</span>
                        <p className="font-bold text-[10px] mt-0.5">{nomeResponsavel}</p>
                      </div>
                      
                      {/* Produto */}
                      <div className="text-center border-b border-gray-800 pb-1 mb-1">
                        <p className="font-bold text-sm leading-tight">{produtoSelecionado.nome.toUpperCase()} {tipoArmazenamento}</p>
                      </div>
                      
                      {/* Peso/Qtd e Produzido */}
                      <div className="border-b border-gray-800 pb-1 mb-1">
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <span className="font-normal text-[9px]">Peso/Qtd:</span>
                            <p className="font-bold text-xs mt-0.5">{peso} {unidadeMedida}</p>
                          </div>
                          <div className="border-l border-gray-800 pl-1">
                            <span className="font-normal text-[9px]">Produzido:</span>
                            <p className="font-bold text-xs mt-0.5">{getDataHoje()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Validade e Vence */}
                      <div className="border-b border-gray-800 pb-1 mb-1">
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <span className="font-normal text-[9px]">Validade:</span>
                            <p className="font-bold text-xs mt-0.5">{getValidadeEmDias()}</p>
                          </div>
                          <div className="border-l border-gray-800 pl-1">
                            <span className="font-normal text-[9px]">Vence:</span>
                            <p className="font-bold text-xs mt-0.5">{calcularDataValidade()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Coluna 2 */}
                    <div className="w-1/2 h-full flex flex-col text-black p-2 text-xs leading-tight">
                      {/* Responsável */}
                      <div className="text-center border-b border-gray-800 pb-1 mb-1">
                        <span className="font-normal text-[9px]">Responsável:</span>
                        <p className="font-bold text-[10px] mt-0.5">{nomeResponsavel}</p>
                      </div>
                      
                      {/* Produto */}
                      <div className="text-center border-b border-gray-800 pb-1 mb-1">
                        <p className="font-bold text-sm leading-tight">{produtoSelecionado.nome.toUpperCase()} {tipoArmazenamento}</p>
                      </div>
                      
                      {/* Peso/Qtd e Produzido */}
                      <div className="border-b border-gray-800 pb-1 mb-1">
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <span className="font-normal text-[9px]">Peso/Qtd:</span>
                            <p className="font-bold text-xs mt-0.5">{peso} {unidadeMedida}</p>
                          </div>
                          <div className="border-l border-gray-800 pl-1">
                            <span className="font-normal text-[9px]">Produzido:</span>
                            <p className="font-bold text-xs mt-0.5">{getDataHoje()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Validade e Vence */}
                      <div className="border-b border-gray-800 pb-1 mb-1">
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <span className="font-normal text-[9px]">Validade:</span>
                            <p className="font-bold text-xs mt-0.5">{getValidadeEmDias()}</p>
                          </div>
                          <div className="border-l border-gray-800 pl-1">
                            <span className="font-normal text-[9px]">Vence:</span>
                            <p className="font-bold text-xs mt-0.5">{calcularDataValidade()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Dimensões: 104x30mm (duas etiquetas de 50x30mm cada com 4mm de espaçamento). Não se esqueça de revisar a impressão manual.
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
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Botão Principal de Impressão */}
                  <Button
                    onClick={handlePrintViaDriver}
                    disabled={printing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                  >
                    <Printer className="w-6 h-6 mr-2" />
                    Imprimir Etiqueta
                  </Button>

                  {/* Link discreto para reabrir instruções */}
                  <button
                    onClick={() => setShowPrintInstructions(true)}
                    className="w-full text-xs text-gray-500 hover:text-blue-400 underline"
                  >
                    Ver instruções novamente
                  </button>
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

        {/* Dialog de Instruções para Impressão */}
        <Dialog open={showPrintInstructions} onOpenChange={setShowPrintInstructions}>
          <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">📋 Instruções para a Impressão</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-300 mb-4">
                  🖨️ No painel de impressão:
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white mb-1">Tamanho do papel</p>
                      <p className="text-sm text-gray-300">Configurar: <span className="font-bold text-green-400">104mm x 30mm</span></p>
                      <p className="text-sm text-gray-300">Ou: <span className="font-bold text-green-400">Personalizado - 104mm x 30mm</span></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white mb-1">Escala</p>
                      <p className="text-sm text-gray-300">Deixar em: <span className="font-bold text-green-400">100%</span> (tamanho real)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white mb-1">Margens</p>
                      <p className="text-sm text-gray-300">Configurar: <span className="font-bold text-green-400">0mm</span> (sem margens)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-yellow-300">
                  💡 <strong>Dica:</strong> A página tem 104mm x 30mm com duas etiquetas de 50mm x 30mm cada, separadas por 4mm de espaçamento. Certifique-se de configurar o tamanho correto no painel de impressão.
                </p>
              </div>

              <div className="bg-[#0f0f10] border border-[#374151] rounded-xl p-4">
                <p className="text-xs text-gray-400">
                  <strong>Resumo:</strong><br/>
                  • Ao clicar em "Imprimir Etiqueta", a janela de impressão abrirá<br/>
                  • Configure as opções conforme indicado acima<br/>
                  • Clique em "Imprimir" para finalizar
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowPrintInstructions(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                OK, Entendi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
