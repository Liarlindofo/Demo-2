export interface ChecklistItem {
  id: string;
  name: string;
  weight: number;
}

export interface ChecklistTopic {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export const CHECKLIST_TOPICS: ChecklistTopic[] = [
  {
    id: 'area-externa',
    name: 'ÁREA EXTERNA',
    items: [
      { id: 'frente-loja-limpa', name: 'Frente de loja e estacionamento limpos sem lixo ou entulho', weight: 10 },
      { id: 'jardinagem-calcada', name: 'Jardinagem feita, sem mato e calçada limpa', weight: 10 },
      { id: 'fachada-iluminacao', name: 'Fachada limpa e iluminação externa funcionando', weight: 10 },
      { id: 'portao-acesso', name: 'Portão de acesso fechado', weight: 10 },
      { id: 'lixeira-externa', name: 'Lixeira limpa sem sujeira, cheiro desagradável ou necessidade de manutenção', weight: 10 },
      { id: 'portas-exteriores', name: 'Portas exteriores limpas e bem cuidadas', weight: 10 },
      { id: 'sem-pragas-externas', name: 'Sem sinais de pragas (ratos, baratas, etc)', weight: 10 },
      { id: 'paredes-janelas-externas', name: 'Paredes, portas e janelas sem necessidade de reparos', weight: 10 },
      { id: 'telas-mosquiteiras-externas', name: 'Telas mosquiteiras sem necessidade de manutenção', weight: 10 },
    ]
  },
  {
    id: 'estoque',
    name: 'ESTOQUE',
    items: [
      { id: 'porta-estoque-fechada', name: 'Porta do estoque fechada', weight: 10 },
      { id: 'limpeza-estoque', name: 'Limpeza do estoque', weight: 10 },
      { id: 'organizacao-insumos', name: 'Organização dos insumos', weight: 10 },
      { id: 'validade-pvps', name: 'Insumos organizados de acordo com validades (PVPS)', weight: 15 },
      { id: 'estoque-rota-limpeza', name: 'Estoque incluso na rota da limpeza', weight: 10 },
      { id: 'telas-mosquiteiras-estoque', name: 'Telas mosquiteiras sem necessidade de manutenção', weight: 10 },
      { id: 'produtos-homologados', name: 'Apenas produtos homologados no estoque', weight: 10 },
      { id: 'prateleiras-adequadas', name: 'Prateleiras adequadas', weight: 10 },
      { id: 'luminarias-protecao', name: 'Luminárias com proteção acrílica', weight: 10 },
      { id: 'produtos-estrados', name: 'Produtos sobre estrados (15cm) ou prateleiras, nada no chão ou em caixas', weight: 15 },
      { id: 'borrachas-vedacao-estoque', name: 'Borrachas de vedação das geladeiras/câmara fria adequadas', weight: 10 },
    ]
  },
  {
    id: 'cozinha',
    name: 'COZINHA',
    items: [
      { id: 'piso-rodape-luminarias', name: 'Piso, rodapé e luminárias limpas', weight: 10 },
      { id: 'paredes-teto-exaustores', name: 'Paredes, espelhos de tomadas, teto e exaustores limpos', weight: 10 },
      { id: 'mesas-equipamentos', name: 'Mesa de condimentação, make, cilindro de massa, masseira, armários e gaveta de massas, micro-ondas limpos', weight: 10 },
      { id: 'forno-esteira-coifa', name: 'Forno, esteira do forno (interno) e coifa limpos', weight: 10 },
      { id: 'escala-limpeza', name: 'Escala de limpeza diária e periódica (pesada) agendada', weight: 10 },
      { id: 'raquetes-pizzas', name: 'Raquetes de pizzas adequadas sem necessidade de manutenção', weight: 10 },
      { id: 'impressora-protegida', name: 'Impressora de cozinha protegida com capa ou papel filme', weight: 10 },
      { id: 'luminarias-acrilica-cozinha', name: 'Luminárias com proteção acrílica', weight: 10 },
      { id: 'pia-lavagem-maos', name: 'Pia de lavagem de mãos adequada', weight: 10 },
      { id: 'termometro-controles', name: 'Termômetro para realização de controles', weight: 10 },
      { id: 'lavagem-maos-periodica', name: 'Lavagem de mãos periódica', weight: 10 },
      { id: 'temperatura-make', name: 'Temperatura na parte superior da make menor que 5°C', weight: 15 },
      { id: 'itens-resfriados', name: 'Itens resfriados entre 1°C e 4°C', weight: 15 },
      { id: 'itens-congelados', name: 'Itens congelados menor que -18°C', weight: 15 },
      { id: 'rotulagem-itens', name: 'Itens rotulados com data de fabricação/processamento e validade', weight: 15 },
      { id: 'vestuario-manipuladores', name: 'Manipuladores com vestuário adequado e limpo (sem correntes, joias, com boné/bandana)', weight: 15 },
      { id: 'itens-dentro-validade', name: 'Itens dentro da validade', weight: 15 },
      { id: 'lixeiras-pedal', name: 'Lixeiras com pedal e saco de lixo', weight: 10 },
      { id: 'ingredientes-pvps-cozinha', name: 'Ingredientes estocados na ordem PVPS', weight: 10 },
      { id: 'borrachas-vedacao-cozinha', name: 'Borrachas de vedação das geladeiras adequadas', weight: 10 },
      { id: 'utensilios-bom-estado', name: 'Utensílios em boas condições', weight: 10 },
    ]
  },
  {
    id: 'expedicao-motoboys',
    name: 'EXPEDIÇÃO / MOTOBOYS',
    items: [
      { id: 'area-expedicao-organizada', name: 'Área de expedição organizada', weight: 10 },
      { id: 'aparencia-motoboys', name: 'Aparência dos motoboys minimamente adequada', weight: 10 },
      { id: 'bolachoes-limpos', name: 'Bolachões limpos', weight: 10 },
      { id: 'bags-termicas', name: 'Bags térmicas em bom estado', weight: 10 },
      { id: 'motos-silenciosas', name: 'Motos minimamente silenciosas', weight: 10 },
      { id: 'maquinas-cartao', name: 'Máquinas de cartão suficientes', weight: 10 },
      { id: 'computadores-adequados', name: 'Computadores adequados', weight: 10 },
      { id: 'roteirizacao', name: 'Roteirização configurada com apenas 2 entregas casadas', weight: 10 },
      { id: 'carimbo-bebida', name: 'Carimbo de "PEDIDO COM BEBIDA" sendo utilizado', weight: 10 },
      { id: 'lacre-conferencia', name: 'Colocar lacre e conferir pedidos', weight: 15 },
      { id: 'nota-fiscal', name: 'Emite nota fiscal quando solicitado', weight: 10 },
      { id: 'conferencia-antes-despacho', name: 'Conferência do pedido antes de despachar', weight: 15 },
      { id: 'fechamento-caixa', name: 'Fechamento de caixa batendo', weight: 10 },
    ]
  },
  {
    id: 'atendimento-balcao',
    name: 'ATENDIMENTO E BALCÃO',
    items: [
      { id: 'balcao-limpo', name: 'Balcão limpo e organizado', weight: 10 },
      { id: 'area-espera', name: 'Área de espera limpa e organizada', weight: 10 },
      { id: 'paredes-quadros-ventiladores', name: 'Paredes, quadros, ventiladores, portas e janelas limpas', weight: 10 },
      { id: 'banheiros', name: 'Banheiros abastecidos, limpos e funcionando adequadamente', weight: 15 },
      { id: 'recepcao-cordial', name: 'Cliente recebido com sorriso e cordialidade', weight: 15 },
      { id: 'contato-visual', name: 'Faz contato visual com cada cliente', weight: 10 },
      { id: 'oferece-adicionais', name: 'Produtos adicionais e bebidas oferecidos', weight: 10 },
      { id: 'confirmacao-produtos', name: 'Confirma os produtos', weight: 10 },
      { id: 'conhecimento-cardapio', name: 'Atendente conhece sabores, produtos e promoções', weight: 15 },
      { id: 'uniforme-adequado', name: 'Uniforme e roupas adequadas', weight: 10 },
      { id: 'despedida-cordial', name: 'Na entrega do produto confirma o pedido e se despede com cordialidade', weight: 15 },
      { id: 'cardapios-bom-estado', name: 'Cardápios suficientes e em bom estado', weight: 10 },
    ]
  },
  {
    id: 'produto',
    name: 'PRODUTO',
    items: [
      { id: 'uso-semola', name: 'Uso correto da sêmola e massa "furada" antes do molho', weight: 15 },
      { id: 'ordem-comandas', name: 'Comandas coladas e atendidas na ordem', weight: 10 },
      { id: 'qualidade-massas', name: 'Qualidade das massas', weight: 20 },
      { id: 'qualidade-ingredientes', name: 'Qualidade dos ingredientes', weight: 20 },
      { id: 'tempo-producao', name: 'Tempo do produto: da impressão da comanda até o motoboy menos de 15 minutos', weight: 15 },
      { id: 'apresentacao-produto', name: 'Apresentação do produto', weight: 15 },
      { id: 'temperatura-produto', name: 'Temperatura adequada do produto', weight: 15 },
      { id: 'bebida-gelada', name: 'Bebida gelada', weight: 10 },
      { id: 'borda-qualidade', name: 'Análise de 5 pedidos: borda queimada e borda recheada vazando', weight: 15 },
      { id: 'quantidade-ficha-tecnica', name: 'Quantidade de produtos próxima à ficha técnica', weight: 15 },
    ]
  },
  {
    id: 'gerenciamento',
    name: 'GERENCIAMENTO',
    items: [
      { id: 'uniforme-equipe', name: 'Uniforme para equipe', weight: 10 },
      { id: 'certificado-boas-praticas', name: 'Equipe com certificado de boas práticas', weight: 15 },
      { id: 'produtos-limpeza-armario', name: 'Produtos de limpeza etiquetados e estocados em armário exclusivo', weight: 10 },
      { id: 'dedetizacao-dia', name: 'Dedetização em dia (3-4 meses), reforço se necessário', weight: 15 },
      { id: 'luminarias-mosquiteiras', name: 'Luminárias funcionando e mosquiteiras sem defeito', weight: 10 },
      { id: 'fornos-funcionando', name: 'Os dois fornos funcionam perfeitamente', weight: 15 },
      { id: 'bobinas-fluxo', name: 'Quantidade de bobinas necessárias para o fluxo', weight: 10 },
      { id: 'escalas-organizadas', name: 'Escala de folga, limpeza e motoboys', weight: 10 },
      { id: 'pasta-informacoes', name: 'Pasta com informações da equipe, telefones de emergência e alvarás de funcionamento', weight: 10 },
      { id: 'clima-equipe', name: 'Clima da equipe de respeito e harmonia', weight: 15 },
      { id: 'banheiro-vestiario', name: 'Banheiro de funcionários e vestiários no padrão', weight: 10 },
      { id: 'kit-primeiros-socorros', name: 'Kit de primeiros socorros', weight: 10 },
      { id: 'tocas-cozinha', name: 'Tocas na entrada da cozinha', weight: 10 },
      { id: 'controle-vendas', name: 'Controle de vendas atualizado', weight: 10 },
      { id: 'controle-estoque-gerencial', name: 'Controle de estoque gerencial', weight: 10 },
      { id: 'acompanhamento-metas', name: 'Acompanhamento de metas', weight: 10 },
    ]
  },
];

export type EvaluationStatus = 'DE ACORDO' | 'PARCIAL' | 'FORA DO PADRÃO';

export interface ItemEvaluation {
  itemId: string;
  status: EvaluationStatus;
  score: number;
  maxScore: number;
  observations: string;
  photoUrl?: string;
}

export interface TopicEvaluation {
  topicId: string;
  score: number;
  maxScore: number;
  observations: string;
  items: ItemEvaluation[];
}

export interface Evaluation {
  id?: string;
  storeName: string;
  supervisorName: string;
  evaluationDate: string;
  topics: TopicEvaluation[];
  totalScore: number;
  maxTotalScore: number;
  maintenanceList: string;
  improvementSuggestions: string;
}

