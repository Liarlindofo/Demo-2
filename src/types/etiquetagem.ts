// Tipos para o sistema de etiquetagem

export interface Unidade {
  id: string;
  nomeExibicao: string;
  cnpj: string;
  cnpjFormatado: string;
  cidade: string;
  codigoInterno: string;
  isAtivo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Categoria {
  id: string;
  nome: string;
  temperaturaArmazenamento: string;
  validadeDescongelado: number | null;
  validadeResfriado: number | null;
  validadePreparado: number | null;
  validadePorcionado: number | null;
  validadeCongeladoMedio: number | null;
  validadeCongeladoProfundo: number | null;
  isAtivo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Processo {
  id: string;
  nome: string;
  isRequerRefrigeracao: number;
  isAtivo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoriaId: string | null;
  pesoPadrao: number | null;
  unidadeMedida: string | null;
  marcaFornecedor: string | null;
  tipoArmazenamentoPadrao: string | null;
  isAtivo: number;
  createdAt: string;
  updatedAt: string;
  categoria?: Categoria;
}

export interface NomeResponsavel {
  id: string;
  nomeCompleto: string;
  unidadeId: string;
  primeiraUtilizacao: string;
  ultimaUtilizacao: string;
  totalUsos: number;
  isAtivo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Etiqueta {
  id: string;
  produtoId: string;
  unidadeId: string;
  processoId: string;
  dataValidadeOriginal: string | null;
  dataHoraManipulacao: string;
  dataHoraValidade: string;
  pesoQuantidade: number;
  unidadeMedida: string;
  responsavelNome: string;
  responsavelId: string | null;
  temperaturaArmazenamento: string;
  codigoEtiqueta: string;
  marcaFornecedor: string | null;
  periodoDias: number | null;
  createdAt: string;
  updatedAt: string;
  produto?: Produto;
  unidade?: Unidade;
  processo?: Processo;
}

// Validação de nome completo
export function validarNomeCompleto(nome: string): { valido: boolean; erro?: string; nomeFormatado?: string } {
  const nomeTrimmed = nome.trim();
  
  if (!nomeTrimmed) {
    return { valido: false, erro: "Nome não pode estar vazio" };
  }
  
  const palavras = nomeTrimmed.split(/\s+/).filter(p => p.length > 0);
  
  if (palavras.length < 2) {
    return { valido: false, erro: "Nome deve ter pelo menos nome e sobrenome (2 palavras)" };
  }
  
  const nomeFormatado = palavras
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
    .join(" ");
  
  return { valido: true, nomeFormatado };
}
