import { prisma } from './prisma';
import { ensureRhCargosPadrao } from './rh-cargos-padrao';
import { enrichFuncionario } from './rh-funcionario';
import { limparCPF, validarCPF } from './validacoes';
import { seedAssiduidadeMes, mesAnoAtual, trimestreAtual } from './seed-assiduidade';
import {
  calcPeriodoAquisitivo,
  deveAvancarPeriodoAoSalvarGozo,
  inicioAquisitivoEfetivo,
  proximoInicioAquisitivo,
} from './ferias-rh';

export const RH_BONIFICACOES_PROMPT = `
## BONIFICAÇÕES

### Assiduidade Mensal
Todos os funcionários ativos têm direito a R$200,00 de bonificação de assiduidade por mês.
O padrão é que todos recebam (recebeu = true). Você só altera para false quando o gestor informar.

Condições que cancelam a assiduidade (o gestor informa, você não decide sozinho):
- Falta injustificada no mês
- Atraso registrado no mês
- Atestado médico no mês

Quando o gestor disser "X não vai ganhar a bonificação" ou variações:
→ Use atualizar_assiduidade com recebeu=false
→ Confirme nominalmente quem foi afetado e o valor que deixará de receber

Quando o gestor disser "todos vão ganhar normalmente" ou não mencionar ninguém:
→ Não faça nada, o padrão já é recebeu=true

### PLR Trimestral
É uma bonificação coletiva por loja, paga quando a loja bate a meta.
O gestor informa o valor. Você distribui igualmente para todos os funcionários ativos da loja.

REGRA OBRIGATÓRIA: sempre perguntar se o valor informado é por pessoa ou total,
a menos que o gestor deixe explícito ("R$500 cada" ou "R$4.000 para dividir").

Após lançar PLR, confirme:
- Nome da loja
- Trimestre e ano
- Número de funcionários contemplados
- Valor por funcionário
- Total distribuído

Trimestres:
- Q1: Janeiro, Fevereiro, Março
- Q2: Abril, Maio, Junho
- Q3: Julho, Agosto, Setembro
- Q4: Outubro, Novembro, Dezembro

### Ferramentas de bonificação disponíveis:
- listar_assiduidade → consultar status do mês
- atualizar_assiduidade → bloquear ou restaurar assiduidade de funcionários
- lancar_plr → criar PLR trimestral para uma loja
`;

// ─── Definições das ferramentas para o AI ────────────────────────────────────

export const RH_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'listar_funcionarios',
      description:
        'Lista os funcionários cadastrados. Use para encontrar um funcionário antes de fazer alterações, ou quando o usuário pedir para ver a equipe.',
      parameters: {
        type: 'object',
        properties: {
          busca: {
            type: 'string',
            description: 'Filtro opcional por nome do funcionário',
          },
          apenasAtivos: {
            type: 'boolean',
            description: 'Se true, retorna apenas funcionários ativos (padrão: true)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'atualizar_funcionario',
      description:
        'Atualiza dados de um funcionário: escala, turno, horários, salário, cargo, loja ou observações.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID do funcionário' },
          escala: {
            type: 'string',
            enum: ['5x2', '6x1', '12x36', '5x1', '4x3'],
            description: 'Escala de trabalho',
          },
          turno: {
            type: 'string',
            enum: ['manha', 'tarde', 'noite', 'integral'],
            description: 'Turno de trabalho',
          },
          horarioEntrada: { type: 'string', description: 'Horário de entrada no formato HH:MM' },
          horarioSaida: { type: 'string', description: 'Horário de saída no formato HH:MM' },
          salarioBase: { type: 'number', description: 'Novo salário base em reais' },
          cargoResponsabilidade: { type: 'boolean' },
          valorAlimentacao: { type: 'number' },
          valorVT: { type: 'number' },
          bonificacaoAssiduidade: { type: 'number' },
          cargoId: { type: 'string', description: 'ID do novo cargo' },
          lojaId: { type: 'string', description: 'ID da nova loja' },
          observacoes: { type: 'string', description: 'Observações do funcionário' },
          ativo: { type: 'boolean', description: 'Ativar (true) ou desativar (false) o funcionário' },
        },
        required: ['funcionarioId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'gerenciar_folgas',
      description:
        'Adiciona, remove ou redefine os dias de folga de um funcionário. Dias: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID do funcionário' },
          acao: {
            type: 'string',
            enum: ['adicionar', 'remover', 'substituir'],
            description:
              'adicionar: inclui dias às folgas atuais; remover: exclui dias das folgas atuais; substituir: define exatamente esses dias como folgas',
          },
          dias: {
            type: 'array',
            items: { type: 'number', minimum: 0, maximum: 6 },
            description: 'Dias da semana (0=Domingo … 6=Sábado)',
          },
        },
        required: ['funcionarioId', 'acao', 'dias'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'criar_funcionario',
      description: 'Cadastra um novo funcionário no sistema.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome completo' },
          cpf: { type: 'string', description: 'CPF (apenas números, opcional)' },
          email: { type: 'string', description: 'E-mail (opcional)' },
          telefone: { type: 'string', description: 'Telefone (opcional)' },
          dataAdmissao: { type: 'string', description: 'Data de admissão (YYYY-MM-DD)' },
          cargoId: { type: 'string', description: 'ID do cargo' },
          lojaId: { type: 'string', description: 'ID da loja' },
          salarioBase: { type: 'number', description: 'Salário base contratual em reais' },
          dataNascimento: { type: 'string', description: 'Data de nascimento (YYYY-MM-DD)' },
          cargoResponsabilidade: { type: 'boolean', description: 'Cargo de responsabilidade (+40%)' },
          valorAlimentacao: { type: 'number', description: 'Vale refeição/alimentação mensal' },
          valorVT: { type: 'number', description: 'Vale transporte mensal' },
          bonificacaoAssiduidade: { type: 'number', description: 'Bonificação de assiduidade mensal' },
          escala: {
            type: 'string',
            enum: ['5x2', '6x1', '12x36', '5x1', '4x3'],
          },
          turno: {
            type: 'string',
            enum: ['manha', 'tarde', 'noite', 'integral'],
          },
          horarioEntrada: { type: 'string', description: 'HH:MM (padrão 08:00)' },
          horarioSaida: { type: 'string', description: 'HH:MM (padrão 17:00)' },
          diasFolga: {
            type: 'array',
            items: { type: 'number', minimum: 0, maximum: 6 },
            description: 'Dias de folga (0=Dom … 6=Sáb)',
          },
        },
        required: ['nome', 'cpf', 'dataNascimento', 'dataAdmissao', 'cargoId', 'lojaId', 'salarioBase', 'escala', 'turno'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_cargos',
      description: 'Lista os cargos disponíveis. Use para obter IDs de cargos antes de criar ou atualizar funcionários.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_lojas',
      description: 'Lista as lojas/unidades cadastradas. Use para obter IDs de lojas antes de criar ou atualizar funcionários.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_assiduidade',
      description:
        'Lista o status de bonificação de assiduidade (R$200/mês) de todos os funcionários ativos no mês informado.',
      parameters: {
        type: 'object',
        properties: {
          mes: { type: 'number', description: 'Mês 1-12 (padrão: mês atual)' },
          ano: { type: 'number', description: 'Ano (padrão: ano atual)' },
          lojaId: { type: 'string', description: 'Filtrar por loja (opcional)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'atualizar_assiduidade',
      description:
        'Atualiza se funcionários recebem ou não a bonificação de assiduidade de R$200 no mês. Use quando o gestor informar quem perde ou recupera a bonificação.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs dos funcionários',
          },
          recebeu: {
            type: 'boolean',
            description: 'true = recebe R$200; false = não recebe',
          },
          motivo: {
            type: 'string',
            description: 'Motivo se recebeu=false: falta, atraso, atestado, outro',
          },
          mes: { type: 'number' },
          ano: { type: 'number' },
        },
        required: ['funcionarioIds', 'recebeu'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lancar_plr',
      description:
        'Lança PLR trimestral para uma loja, distribuindo igualmente entre todos os funcionários ativos. Use valorPorFuncionario quando for valor por pessoa; valorTotal quando for o bolo total a dividir.',
      parameters: {
        type: 'object',
        properties: {
          lojaId: { type: 'string', description: 'ID da loja' },
          valorTotal: { type: 'number', description: 'Valor total a dividir entre todos' },
          valorPorFuncionario: {
            type: 'number',
            description: 'Valor fixo por funcionário (alternativa ao valorTotal)',
          },
          trimestre: { type: 'number', enum: [1, 2, 3, 4] },
          ano: { type: 'number' },
          observacao: { type: 'string' },
        },
        required: ['lojaId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_ocorrencia',
      description: 'Registra uma ocorrência para um funcionário: falta, atraso, advertência, atestado, elogio etc.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID do funcionário' },
          tipo: {
            type: 'string',
            enum: ['falta_justificada', 'falta_injustificada', 'atraso', 'saida_antecipada', 'advertencia_verbal', 'advertencia_escrita', 'suspensao', 'atestado_medico', 'acidente_trabalho', 'licenca_maternidade', 'licenca_paternidade', 'afastamento_inss', 'elogio', 'outros'],
          },
          data: { type: 'string', description: 'Data da ocorrência (YYYY-MM-DD). Se não informado, usa hoje.' },
          descricao: { type: 'string', description: 'Descrição detalhada da ocorrência' },
          gravidade: { type: 'string', enum: ['leve', 'media', 'grave'], description: 'Para advertências' },
          providencia: { type: 'string', description: 'Providência tomada (opcional)' },
          dataInicioAfastamento: { type: 'string', description: 'Início do afastamento YYYY-MM-DD (para atestados/afastamentos)' },
          dataFimAfastamento: { type: 'string', description: 'Fim do afastamento YYYY-MM-DD' },
        },
        required: ['funcionarioId', 'tipo', 'descricao'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_ocorrencias',
      description: 'Consulta o histórico de ocorrências de um funcionário, com resumo de faltas e advertências.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID do funcionário' },
          mes: { type: 'number', description: 'Filtrar por mês (1-12)' },
          ano: { type: 'number', description: 'Filtrar por ano' },
          tipo: { type: 'string', description: 'Filtrar por tipo de ocorrência' },
        },
        required: ['funcionarioId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_ferias',
      description: 'Registra ou atualiza o gozo de férias de um funcionário.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID do funcionário' },
          dataGozoFerias: { type: 'string', description: 'Data de início das férias (YYYY-MM-DD)' },
          diasFeriasGozados: { type: 'number', description: 'Quantidade de dias de férias gozados' },
          statusFerias: { type: 'string', enum: ['a_gozar', 'gozando', 'gozadas'], description: 'Status atual das férias' },
        },
        required: ['funcionarioId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_ferias',
      description: 'Consulta situação de férias dos funcionários — vencimentos, períodos aquisitivos e alertas.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID de um funcionário específico (opcional — se omitido, retorna todos com alertas)' },
          lojaId: { type: 'string', description: 'Filtrar por loja (opcional)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transferir_funcionario',
      description: 'Transfere um funcionário para outra loja/unidade.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID do funcionário' },
          lojaDestinoId: { type: 'string', description: 'ID da loja de destino' },
          dataTransferencia: { type: 'string', description: 'Data da transferência (YYYY-MM-DD). Se omitido, usa hoje.' },
          motivo: { type: 'string', description: 'Motivo da transferência (opcional)' },
        },
        required: ['funcionarioId', 'lojaDestinoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_bonificacao_trimestral',
      description: 'Registra uma bonificação trimestral individual para um funcionário.',
      parameters: {
        type: 'object',
        properties: {
          funcionarioId: { type: 'string', description: 'ID do funcionário' },
          valor: { type: 'number', description: 'Valor da bonificação em reais' },
          trimestre: { type: 'number', enum: [1, 2, 3, 4] },
          ano: { type: 'number' },
          dataPagamento: { type: 'string', description: 'Data de pagamento (YYYY-MM-DD)' },
          motivo: { type: 'string', description: 'Motivo/descrição da bonificação (opcional)' },
        },
        required: ['funcionarioId', 'valor', 'trimestre', 'ano', 'dataPagamento'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'criar_cargo',
      description: 'Cria um novo cargo no sistema.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome do cargo' },
          descricao: { type: 'string', description: 'Descrição do cargo (opcional)' },
          ratPct: { type: 'number', description: 'Percentual RAT para encargos (padrão: 2)' },
        },
        required: ['nome'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_quadro_ideal',
      description: 'Consulta o quadro ideal vs real de uma loja — quantos funcionários faltam ou estão em excesso por cargo/turno.',
      parameters: {
        type: 'object',
        properties: {
          lojaId: { type: 'string', description: 'ID da loja' },
        },
        required: ['lojaId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_custos_folha',
      description: 'Consulta os custos da folha de pagamento — total bruto, encargos e custo real por loja ou da rede toda.',
      parameters: {
        type: 'object',
        properties: {
          lojaId: { type: 'string', description: 'ID de uma loja específica (opcional — se omitido, retorna todas)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_aniversariantes',
      description: 'Lista os aniversariantes do mês atual ou de um mês específico.',
      parameters: {
        type: 'object',
        properties: {
          mes: { type: 'number', description: 'Mês (1-12). Se omitido, usa o mês atual.' },
          lojaId: { type: 'string', description: 'Filtrar por loja (opcional)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_alertas_trabalhistas',
      description: 'Lista alertas trabalhistas importantes: períodos de experiência vencendo, férias vencendo ou vencidas.',
      parameters: {
        type: 'object',
        properties: {
          lojaId: { type: 'string', description: 'Filtrar por loja (opcional)' },
        },
      },
    },
  },
];

// ─── Execução das ferramentas ─────────────────────────────────────────────────

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export async function executeRhTool(
  toolName: string,
  args: Record<string, any>,
  userId: string,
): Promise<string> {
  try {
    switch (toolName) {
      case 'listar_funcionarios':
        return await listarFuncionarios(args, userId);
      case 'atualizar_funcionario':
        return await atualizarFuncionario(args, userId);
      case 'gerenciar_folgas':
        return await gerenciarFolgas(args, userId);
      case 'criar_funcionario':
        return await criarFuncionario(args, userId);
      case 'listar_cargos':
        return await listarCargos(userId);
      case 'listar_lojas':
        return await listarLojas(userId);
      case 'listar_assiduidade':
        return await listarAssiduidade(args, userId);
      case 'atualizar_assiduidade':
        return await atualizarAssiduidade(args, userId);
      case 'lancar_plr':
        return await lancarPlr(args, userId);
      case 'registrar_ocorrencia':
        return await registrarOcorrencia(args, userId);
      case 'consultar_ocorrencias':
        return await consultarOcorrencias(args, userId);
      case 'registrar_ferias':
        return await registrarFerias(args, userId);
      case 'consultar_ferias':
        return await consultarFerias(args, userId);
      case 'transferir_funcionario':
        return await transferirFuncionario(args, userId);
      case 'registrar_bonificacao_trimestral':
        return await registrarBonificacaoTrimestral(args, userId);
      case 'criar_cargo':
        return await criarCargo(args, userId);
      case 'consultar_quadro_ideal':
        return await consultarQuadroIdeal(args, userId);
      case 'consultar_custos_folha':
        return await consultarCustosFolha(args, userId);
      case 'consultar_aniversariantes':
        return await consultarAniversariantes(args, userId);
      case 'listar_alertas_trabalhistas':
        return await listarAlertasTrabalhistas(args, userId);
      default:
        return JSON.stringify({ erro: `Ferramenta desconhecida: ${toolName}` });
    }
  } catch (error: any) {
    return JSON.stringify({ erro: error.message || 'Erro ao executar ferramenta' });
  }
}

async function listarFuncionarios(args: any, userId: string) {
  const where: any = { userId };
  if (args.apenasAtivos !== false) where.ativo = true;
  if (args.busca) {
    where.nome = { contains: args.busca, mode: 'insensitive' };
  }

  const funcionarios = await prisma.rhFuncionario.findMany({
    where,
    include: {
      cargo: { select: { id: true, nome: true } },
      loja: { select: { id: true, nome: true } },
    },
    orderBy: { nome: 'asc' },
  });

  return JSON.stringify(
    funcionarios.map((f) => ({
      id: f.id,
      nome: f.nome,
      cpf: f.cpf,
      email: f.email,
      telefone: f.telefone,
      cargo: f.cargo.nome,
      cargoId: f.cargoId,
      loja: f.loja.nome,
      lojaId: f.lojaId,
      ...enrichFuncionario(f),
      escala: f.escala,
      turno: f.turno,
      horarioEntrada: f.horarioEntrada,
      horarioSaida: f.horarioSaida,
      diasFolga: (f.diasFolga as number[]).map((d) => `${d} (${DIAS_SEMANA[d]})`),
      ativo: f.ativo,
    })),
  );
}

async function atualizarFuncionario(args: any, userId: string) {
  const { funcionarioId, ...campos } = args;

  const func = await prisma.rhFuncionario.findFirst({
    where: { id: funcionarioId, userId },
  });
  if (!func) return JSON.stringify({ erro: 'Funcionário não encontrado' });

  const dadosUpdate: Record<string, any> = {};
  const allowed = [
    'escala', 'turno', 'horarioEntrada', 'horarioSaida',
    'salarioBase', 'cargoResponsabilidade', 'bonificacaoAssiduidade',
    'valorAlimentacao', 'valorVT', 'cargoId', 'lojaId', 'observacoes', 'ativo',
  ];
  for (const key of allowed) {
    if (campos[key] !== undefined) dadosUpdate[key] = campos[key];
  }

  if (Object.keys(dadosUpdate).length === 0) {
    return JSON.stringify({ erro: 'Nenhum campo válido para atualizar' });
  }

  const atualizado = await prisma.rhFuncionario.update({
    where: { id: funcionarioId },
    data: dadosUpdate,
    include: { cargo: true, loja: true },
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `Funcionário ${atualizado.nome} atualizado com sucesso`,
    dadosAtualizados: dadosUpdate,
  });
}

async function gerenciarFolgas(args: any, userId: string) {
  const { funcionarioId, acao, dias } = args;

  const func = await prisma.rhFuncionario.findFirst({
    where: { id: funcionarioId, userId },
  });
  if (!func) return JSON.stringify({ erro: 'Funcionário não encontrado' });

  const folgasAtuais = (func.diasFolga as number[]) || [];
  let novasFolgas: number[];

  if (acao === 'adicionar') {
    novasFolgas = Array.from(new Set([...folgasAtuais, ...dias])).sort();
  } else if (acao === 'remover') {
    novasFolgas = folgasAtuais.filter((d) => !dias.includes(d));
  } else {
    // substituir
    novasFolgas = [...new Set(dias as number[])].sort();
  }

  await prisma.rhFuncionario.update({
    where: { id: funcionarioId },
    data: { diasFolga: novasFolgas },
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `Folgas de ${func.nome} atualizadas`,
    folgasAnteriores: folgasAtuais.map((d) => DIAS_SEMANA[d]),
    folgasAtuais: novasFolgas.map((d) => DIAS_SEMANA[d]),
  });
}

async function criarFuncionario(args: any, userId: string) {
  const {
    nome, cpf: cpfRaw, email, telefone, dataNascimento, dataAdmissao, cargoId, lojaId,
    salarioBase, cargoResponsabilidade = false, valorAlimentacao = 0, valorVT = 0,
    bonificacaoAssiduidade = 0, escala, turno,
    horarioEntrada = '08:00', horarioSaida = '17:00',
    diasFolga = [],
  } = args;

  const cpf = limparCPF(String(cpfRaw ?? ''));
  if (!validarCPF(cpf)) return JSON.stringify({ erro: 'CPF inválido' });

  const cargo = await prisma.rhCargo.findFirst({ where: { id: cargoId, userId } });
  if (!cargo) return JSON.stringify({ erro: 'Cargo não encontrado' });

  const loja = await prisma.rhLoja.findFirst({ where: { id: lojaId, userId } });
  if (!loja) return JSON.stringify({ erro: 'Loja não encontrada' });

  const func = await prisma.rhFuncionario.create({
    data: {
      userId,
      nome,
      cpf,
      email: email || null,
      telefone: telefone || null,
      dataNascimento: new Date(dataNascimento),
      dataAdmissao: new Date(dataAdmissao),
      cargoId,
      lojaId,
      salarioBase,
      cargoResponsabilidade: Boolean(cargoResponsabilidade),
      valorAlimentacao: Number(valorAlimentacao) || 0,
      valorVT: Number(valorVT) || 0,
      bonificacaoAssiduidade: Number(bonificacaoAssiduidade) || 0,
      escala,
      turno,
      horarioEntrada,
      horarioSaida,
      diasFolga,
    },
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `Funcionário ${nome} cadastrado com sucesso`,
    id: func.id,
    cargo: cargo.nome,
    loja: loja.nome,
  });
}

async function listarCargos(userId: string) {
  await ensureRhCargosPadrao(userId);
  const cargos = await prisma.rhCargo.findMany({
    where: { userId },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, descricao: true, ratPct: true },
  });
  return JSON.stringify(cargos);
}

async function listarLojas(userId: string) {
  const lojas = await prisma.rhLoja.findMany({
    where: { userId, ativo: true },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, cnpj: true },
  });
  return JSON.stringify(lojas);
}

const MESES_LABEL = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

async function listarAssiduidade(args: Record<string, unknown>, userId: string) {
  const atual = mesAnoAtual();
  const mes = Number(args.mes ?? atual.mes);
  const ano = Number(args.ano ?? atual.ano);
  const lojaId = args.lojaId as string | undefined;

  const count = await prisma.rhBonificacaoAssiduidade.count({
    where: { mes, ano, funcionario: { userId, ativo: true } },
  });
  if (count === 0) await seedAssiduidadeMes(userId, mes, ano);

  const registros = await prisma.rhBonificacaoAssiduidade.findMany({
    where: {
      mes,
      ano,
      funcionario: {
        userId,
        ativo: true,
        ...(lojaId ? { lojaId } : {}),
      },
    },
    include: {
      funcionario: {
        select: { id: true, nome: true, loja: { select: { nome: true } } },
      },
    },
    orderBy: { funcionario: { nome: 'asc' } },
  });

  return JSON.stringify({
    mes,
    ano,
    mesLabel: MESES_LABEL[mes],
    total: registros.length,
    comAssiduidade: registros.filter((r) => r.recebeu).length,
    semAssiduidade: registros.filter((r) => !r.recebeu).length,
    funcionarios: registros.map((r) => ({
      id: r.funcionarioId,
      nome: r.funcionario.nome,
      loja: r.funcionario.loja.nome,
      valorDireito: r.valorDireito,
      recebeu: r.recebeu,
      motivo: r.motivo,
    })),
  });
}

async function atualizarAssiduidade(args: Record<string, unknown>, userId: string) {
  const funcionarioIds = args.funcionarioIds as string[];
  const recebeu = Boolean(args.recebeu);
  const motivo = (args.motivo as string) || 'informado pelo gestor';
  const atual = mesAnoAtual();
  const mes = Number(args.mes ?? atual.mes);
  const ano = Number(args.ano ?? atual.ano);

  const funcionarios = await prisma.rhFuncionario.findMany({
    where: { userId, id: { in: funcionarioIds }, ativo: true },
    select: { id: true, nome: true, loja: { select: { nome: true } } },
  });

  if (funcionarios.length === 0) {
    return JSON.stringify({ erro: 'Nenhum funcionário encontrado com os IDs informados' });
  }

  await Promise.all(
    funcionarios.map((f) =>
      prisma.rhBonificacaoAssiduidade.upsert({
        where: { funcionarioId_mes_ano: { funcionarioId: f.id, mes, ano } },
        create: {
          funcionarioId: f.id,
          mes,
          ano,
          valorDireito: 200,
          recebeu,
          motivo: recebeu ? null : motivo,
          viaIA: true,
          registradoPor: 'IA Trabalhista',
        },
        update: {
          recebeu,
          motivo: recebeu ? null : motivo,
          viaIA: true,
          registradoPor: 'IA Trabalhista',
        },
      })
    )
  );

  const nomes = funcionarios.map((f) => f.nome).join(', ');
  const valorPerdido = recebeu ? 0 : funcionarios.length * 200;

  return JSON.stringify({
    sucesso: true,
    mensagem: recebeu
      ? `Assiduidade de R$200 confirmada para: ${nomes} (${MESES_LABEL[mes]}/${ano}).`
      : `${funcionarios.length} funcionário(s) não receberão R$200 de assiduidade em ${MESES_LABEL[mes]}/${ano}: ${nomes}.`,
    funcionarios: funcionarios.map((f) => ({
      nome: f.nome,
      loja: f.loja.nome,
      recebeu,
      valor: recebeu ? 200 : 0,
    })),
    valorTotalNaoPago: valorPerdido,
  });
}

// ─── Novos helpers ────────────────────────────────────────────────────────────

function diffDias(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function lancarPlr(args: Record<string, unknown>, userId: string) {
  const lojaId = args.lojaId as string;
  const trimestre = Number(args.trimestre ?? trimestreAtual());
  const ano = Number(args.ano ?? new Date().getFullYear());
  let valorTotal = Number(args.valorTotal ?? 0);
  let valorPorFuncionario = Number(args.valorPorFuncionario ?? 0);

  if (!valorTotal && !valorPorFuncionario) {
    return JSON.stringify({
      erro: 'Informe valorTotal (bolo a dividir) ou valorPorFuncionario (valor por pessoa)',
    });
  }

  const loja = await prisma.rhLoja.findFirst({
    where: { id: lojaId, userId, ativo: true },
  });
  if (!loja) return JSON.stringify({ erro: 'Loja não encontrada' });

  const existente = await prisma.rhPLRTrimestral.findFirst({
    where: { lojaId, trimestre, ano },
  });
  if (existente) {
    return JSON.stringify({ erro: `PLR Q${trimestre}/${ano} já lançado para ${loja.nome}` });
  }

  const funcionarios = await prisma.rhFuncionario.findMany({
    where: { userId, lojaId, ativo: true },
    select: { id: true, nome: true },
  });

  if (funcionarios.length === 0) {
    return JSON.stringify({ erro: 'Nenhum funcionário ativo nesta loja' });
  }

  if (valorPorFuncionario > 0 && !valorTotal) {
    valorTotal = valorPorFuncionario * funcionarios.length;
  } else {
    valorPorFuncionario = valorTotal / funcionarios.length;
  }

  const plr = await prisma.$transaction(async (tx) => {
    const p = await tx.rhPLRTrimestral.create({
      data: {
        lojaId,
        trimestre,
        ano,
        valorTotal,
        valorPorFuncionario,
        observacao: (args.observacao as string) || null,
        registradoPor: 'IA Trabalhista',
        viaIA: true,
      },
    });
    await tx.rhPLRPagamento.createMany({
      data: funcionarios.map((f) => ({
        plrId: p.id,
        funcionarioId: f.id,
        valor: valorPorFuncionario,
      })),
    });
    return p;
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `PLR Q${trimestre}/${ano} lançado para ${loja.nome}. ${funcionarios.length} funcionários receberão R$${valorPorFuncionario.toFixed(2)} cada. Total: R$${valorTotal.toFixed(2)}.`,
    plrId: plr.id,
    loja: loja.nome,
    trimestre,
    ano,
    totalFuncionarios: funcionarios.length,
    valorPorFuncionario,
    valorTotal,
    contemplados: funcionarios.map((f) => f.nome),
  });
}

// ─── Ocorrências ──────────────────────────────────────────────────────────────

const TIPO_OCORRENCIA_LABEL: Record<string, string> = {
  falta_justificada: 'Falta justificada', falta_injustificada: 'Falta injustificada',
  atraso: 'Atraso', saida_antecipada: 'Saída antecipada',
  advertencia_verbal: 'Advertência verbal', advertencia_escrita: 'Advertência escrita',
  suspensao: 'Suspensão', atestado_medico: 'Atestado médico',
  acidente_trabalho: 'Acidente de trabalho', licenca_maternidade: 'Licença maternidade',
  licenca_paternidade: 'Licença paternidade', afastamento_inss: 'Afastamento INSS',
  elogio: 'Elogio', outros: 'Outros',
};

async function registrarOcorrencia(args: any, userId: string) {
  const { funcionarioId, tipo, descricao, gravidade, providencia,
    dataInicioAfastamento, dataFimAfastamento } = args;

  const func = await prisma.rhFuncionario.findFirst({
    where: { id: funcionarioId, userId },
    select: { id: true, nome: true },
  });
  if (!func) return JSON.stringify({ erro: 'Funcionário não encontrado' });

  const data = args.data ? new Date(args.data) : new Date();

  const ocorrencia = await prisma.rhOcorrencia.create({
    data: {
      funcionarioId,
      userId,
      tipo,
      data,
      descricao,
      gravidade: gravidade || null,
      providencia: providencia || null,
      dataInicioAfastamento: dataInicioAfastamento ? new Date(dataInicioAfastamento) : null,
      dataFimAfastamento: dataFimAfastamento ? new Date(dataFimAfastamento) : null,
      registradoPor: 'IA Trabalhista',
    },
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `Ocorrência "${TIPO_OCORRENCIA_LABEL[tipo] ?? tipo}" registrada para ${func.nome}.`,
    id: ocorrencia.id,
    funcionario: func.nome,
    tipo: TIPO_OCORRENCIA_LABEL[tipo] ?? tipo,
    data: data.toLocaleDateString('pt-BR'),
  });
}

async function consultarOcorrencias(args: any, userId: string) {
  const { funcionarioId, mes, ano, tipo } = args;

  const func = await prisma.rhFuncionario.findFirst({
    where: { id: funcionarioId, userId },
    select: { id: true, nome: true },
  });
  if (!func) return JSON.stringify({ erro: 'Funcionário não encontrado' });

  const where: any = { funcionarioId, userId, ativo: true };
  if (tipo) where.tipo = tipo;
  if (mes && ano) {
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59);
    where.data = { gte: inicio, lte: fim };
  } else if (ano) {
    where.data = { gte: new Date(ano, 0, 1), lte: new Date(ano, 11, 31, 23, 59, 59) };
  }

  const ocorrencias = await prisma.rhOcorrencia.findMany({
    where,
    orderBy: { data: 'desc' },
  });

  const totalFaltas = ocorrencias.filter(o =>
    ['falta_justificada', 'falta_injustificada'].includes(o.tipo)
  ).length;
  const totalAdvertencias = ocorrencias.filter(o =>
    ['advertencia_verbal', 'advertencia_escrita', 'suspensao'].includes(o.tipo)
  ).length;
  const totalAtestados = ocorrencias.filter(o => o.tipo === 'atestado_medico').length;

  return JSON.stringify({
    funcionario: func.nome,
    total: ocorrencias.length,
    resumo: { totalFaltas, totalAdvertencias, totalAtestados },
    ocorrencias: ocorrencias.map(o => ({
      id: o.id,
      tipo: TIPO_OCORRENCIA_LABEL[o.tipo] ?? o.tipo,
      data: new Date(o.data).toLocaleDateString('pt-BR'),
      descricao: o.descricao,
      gravidade: o.gravidade,
      providencia: o.providencia,
    })),
  });
}

// ─── Férias ───────────────────────────────────────────────────────────────────

async function registrarFerias(args: any, userId: string) {
  const { funcionarioId, dataGozoFerias, diasFeriasGozados, statusFerias } = args;

  const func = await prisma.rhFuncionario.findFirst({
    where: { id: funcionarioId, userId },
    select: {
      id: true,
      nome: true,
      dataInicioFerias: true,
      dataGozoFerias: true,
      dataAdmissao: true,
    },
  });
  if (!func) return JSON.stringify({ erro: 'Funcionário não encontrado' });

  const update: Record<string, unknown> = {};
  const gozoNovo = dataGozoFerias !== undefined ? new Date(dataGozoFerias) : null;
  if (gozoNovo) update.dataGozoFerias = gozoNovo;
  if (diasFeriasGozados !== undefined) update.diasFeriasGozados = Number(diasFeriasGozados);
  if (statusFerias !== undefined) update.statusFerias = statusFerias;
  else if (gozoNovo) update.statusFerias = 'gozadas';

  if (Object.keys(update).length === 0) {
    return JSON.stringify({ erro: 'Nenhum campo de férias informado' });
  }

  if (func.dataInicioFerias && gozoNovo) {
    const avancar = deveAvancarPeriodoAoSalvarGozo(func.dataGozoFerias, gozoNovo);
    const legado = !avancar
      && func.dataGozoFerias
      && inicioAquisitivoEfetivo(func.dataInicioFerias, func.dataAdmissao, func.dataGozoFerias).getTime()
        !== new Date(func.dataInicioFerias).getTime();

    if (avancar || legado) {
      update.dataInicioFerias = legado
        ? inicioAquisitivoEfetivo(func.dataInicioFerias, func.dataAdmissao, func.dataGozoFerias)
        : proximoInicioAquisitivo(func.dataInicioFerias);
    }
  }

  const updated = await prisma.rhFuncionario.update({
    where: { id: funcionarioId },
    data: update,
  });

  const periodo = calcPeriodoAquisitivo(updated.dataInicioFerias, {
    dataAdmissao: updated.dataAdmissao,
    dataGozoFerias: updated.dataGozoFerias,
  });

  const statusLabel: Record<string, string> = { a_gozar: 'A gozar', gozando: 'Em gozo', gozadas: 'Gozadas' };
  const statusFinal = (update.statusFerias as string | undefined) ?? statusFerias;

  return JSON.stringify({
    sucesso: true,
    mensagem: `Férias de ${func.nome} atualizadas. Próximo vencimento: ${periodo?.vencimento.toLocaleDateString('pt-BR') ?? '—'}.`,
    funcionario: func.nome,
    dataGozoFerias: dataGozoFerias ?? null,
    diasFeriasGozados: diasFeriasGozados ?? null,
    status: statusFinal ? statusLabel[statusFinal] ?? statusFinal : null,
    proximoVencimento: periodo?.vencimento.toLocaleDateString('pt-BR') ?? null,
  });
}

async function consultarFerias(args: any, userId: string) {
  const { funcionarioId, lojaId } = args;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const where: any = { userId, ativo: true };
  if (funcionarioId) where.id = funcionarioId;
  if (lojaId) where.lojaId = lojaId;

  const funcionarios = await prisma.rhFuncionario.findMany({
    where,
    include: { loja: { select: { nome: true } } },
    orderBy: { nome: 'asc' },
  });

  const resultado = funcionarios.map(f => {
    if (!f.dataInicioFerias) return { nome: f.nome, loja: f.loja.nome, semDados: true };
    const periodo = calcPeriodoAquisitivo(f.dataInicioFerias, {
      dataAdmissao: f.dataAdmissao,
      dataGozoFerias: f.dataGozoFerias,
      hoje,
    })!;
    const dias = periodo.diasRestantes;
    const urgencia = dias < 0 ? 'VENCIDO' : dias <= 30 ? 'CRÍTICO' : dias <= 60 ? 'ATENÇÃO' : 'OK';
    return {
      nome: f.nome,
      loja: f.loja.nome,
      inicioAquisitivo: periodo.inicio.toLocaleDateString('pt-BR'),
      vencimento: periodo.vencimento.toLocaleDateString('pt-BR'),
      diasParaVencer: dias,
      urgencia,
      status: f.statusFerias ?? 'a_gozar',
      diasGozados: f.diasFeriasGozados ?? 0,
      dataGozo: f.dataGozoFerias ? new Date(f.dataGozoFerias).toLocaleDateString('pt-BR') : null,
    };
  });

  const vencidos = resultado.filter(r => r.urgencia === 'VENCIDO').length;
  const criticos = resultado.filter(r => r.urgencia === 'CRÍTICO').length;

  return JSON.stringify({
    total: resultado.length,
    resumo: { vencidos, criticos },
    funcionarios: resultado,
  });
}

// ─── Transferência ────────────────────────────────────────────────────────────

async function transferirFuncionario(args: any, userId: string) {
  const { funcionarioId, lojaDestinoId, motivo } = args;

  const func = await prisma.rhFuncionario.findFirst({
    where: { id: funcionarioId, userId },
    include: { loja: { select: { id: true, nome: true } } },
  });
  if (!func) return JSON.stringify({ erro: 'Funcionário não encontrado' });

  const lojaDestino = await prisma.rhLoja.findFirst({
    where: { id: lojaDestinoId, userId, ativo: true },
    select: { id: true, nome: true },
  });
  if (!lojaDestino) return JSON.stringify({ erro: 'Loja de destino não encontrada' });

  if (func.lojaId === lojaDestinoId) {
    return JSON.stringify({ erro: `${func.nome} já está na loja ${lojaDestino.nome}` });
  }

  const dataTransferencia = args.dataTransferencia ? new Date(args.dataTransferencia) : new Date();

  await prisma.$transaction(async (tx) => {
    await tx.rhFuncionario.update({
      where: { id: funcionarioId },
      data: { lojaId: lojaDestinoId },
    });
    await tx.rhTransferenciaLoja.create({
      data: {
        funcionarioId,
        userId,
        lojaOrigemId: func.lojaId,
        lojaDestinoId,
        dataTransferencia,
        motivo: motivo || null,
        aprovadoPor: 'IA Trabalhista',
      },
    });
    await tx.rhHistoricoFuncionario.create({
      data: {
        userId,
        funcionarioId,
        campo: 'loja',
        valorAnterior: func.loja.nome,
        valorNovo: lojaDestino.nome,
        alteradoPor: 'IA Trabalhista',
        motivo: motivo || null,
      },
    });
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `${func.nome} transferido de ${func.loja.nome} para ${lojaDestino.nome}.`,
    funcionario: func.nome,
    lojaOrigem: func.loja.nome,
    lojaDestino: lojaDestino.nome,
    data: dataTransferencia.toLocaleDateString('pt-BR'),
  });
}

// ─── Bonificação trimestral individual ───────────────────────────────────────

async function registrarBonificacaoTrimestral(args: any, userId: string) {
  const { funcionarioId, valor, trimestre, ano, dataPagamento, motivo } = args;

  const func = await prisma.rhFuncionario.findFirst({
    where: { id: funcionarioId, userId },
    select: { id: true, nome: true },
  });
  if (!func) return JSON.stringify({ erro: 'Funcionário não encontrado' });

  if (!valor || valor <= 0) return JSON.stringify({ erro: 'Valor deve ser maior que zero' });

  const existente = await prisma.rhBonificacaoTrimestral.findFirst({
    where: { funcionarioId, trimestre, ano, ativo: true },
  });
  if (existente) {
    return JSON.stringify({ erro: `Já existe bonificação para Q${trimestre}/${ano} de ${func.nome}. Use editar para alterar.` });
  }

  const bonif = await prisma.rhBonificacaoTrimestral.create({
    data: {
      funcionarioId,
      valor: Number(valor),
      trimestre,
      ano,
      dataPagamento: new Date(dataPagamento),
      motivo: motivo || null,
      registradoPor: 'IA Trabalhista',
    },
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `Bonificação de R$${Number(valor).toFixed(2)} registrada para ${func.nome} — Q${trimestre}/${ano}.`,
    id: bonif.id,
    funcionario: func.nome,
    valor,
    trimestre,
    ano,
  });
}

// ─── Cargo ────────────────────────────────────────────────────────────────────

async function criarCargo(args: any, userId: string) {
  const { nome, descricao, ratPct } = args;

  const existente = await prisma.rhCargo.findFirst({
    where: { userId, nome: { equals: nome, mode: 'insensitive' } },
  });
  if (existente) return JSON.stringify({ erro: `Cargo "${nome}" já existe` });

  const cargo = await prisma.rhCargo.create({
    data: {
      userId,
      nome: nome.trim(),
      descricao: descricao || null,
      ratPct: Number(ratPct ?? 2),
    },
  });

  return JSON.stringify({
    sucesso: true,
    mensagem: `Cargo "${cargo.nome}" criado com sucesso.`,
    id: cargo.id,
    nome: cargo.nome,
    ratPct: cargo.ratPct,
  });
}

// ─── Quadro ideal ─────────────────────────────────────────────────────────────

async function consultarQuadroIdeal(args: any, userId: string) {
  const { lojaId } = args;

  const loja = await prisma.rhLoja.findFirst({
    where: { id: lojaId, userId },
    select: { nome: true },
  });
  if (!loja) return JSON.stringify({ erro: 'Loja não encontrada' });

  const quadro = await prisma.rhQuadroIdeal.findFirst({
    where: { lojaId, userId },
    include: {
      setores: {
        where: { ativo: true },
        include: {
          posicoes: {
            where: { ativo: true },
            include: { cargo: { select: { id: true, nome: true } } },
          },
        },
        orderBy: { ordem: 'asc' },
      },
    },
  });

  if (!quadro) {
    return JSON.stringify({ aviso: `Nenhum quadro ideal configurado para a loja ${loja.nome}.` });
  }

  const funcionariosReais = await prisma.rhFuncionario.findMany({
    where: { lojaId, userId, ativo: true },
    include: { cargo: { select: { id: true, nome: true } } },
  });

  const setoresFormatados = quadro.setores.map(s => ({
    setor: s.nome,
    posicoes: s.posicoes.map(p => {
      const real = funcionariosReais.filter(f =>
        f.cargoId === p.cargoId && f.turno === p.turno
      ).length;
      const diff = real - p.quantidadeIdeal;
      return {
        cargo: p.cargo.nome,
        turno: p.turno,
        ideal: p.quantidadeIdeal,
        real,
        diferenca: diff,
        situacao: diff >= 0 ? 'OK' : diff === -1 ? 'ATENÇÃO' : 'CRÍTICO',
      };
    }),
  }));

  const gaps = setoresFormatados.flatMap(s => s.posicoes).filter(p => p.diferenca < 0);
  const totalIdeal = setoresFormatados.flatMap(s => s.posicoes).reduce((a, p) => a + p.ideal, 0);
  const totalReal = funcionariosReais.length;

  return JSON.stringify({
    loja: loja.nome,
    totalIdeal,
    totalReal,
    gaps: gaps.length,
    setores: setoresFormatados,
    mensagem: gaps.length === 0
      ? `Quadro completo! ${loja.nome} está com o número ideal de funcionários.`
      : `${loja.nome} tem ${gaps.length} posição(ões) com déficit de pessoal.`,
  });
}

// ─── Custos da folha ──────────────────────────────────────────────────────────

async function consultarCustosFolha(args: any, userId: string) {
  const { lojaId } = args;
  const { calcularComposicaoSalarial, calcularEncargosPatronais } = await import('./calculos-rh');

  const where: any = { userId, ativo: true };
  if (lojaId) where.id = lojaId;

  const lojas = await prisma.rhLoja.findMany({
    where,
    include: {
      funcionarios: {
        where: { userId, ativo: true },
        include: { cargo: { select: { nome: true, ratPct: true } } },
      },
    },
    orderBy: { nome: 'asc' },
  });

  const resultado = lojas.map(loja => {
    const totais = loja.funcionarios.reduce((acc, f) => {
      const comp = calcularComposicaoSalarial(f);
      const enc = calcularEncargosPatronais(comp.baseCalculoEncargos, f.cargo.ratPct, loja.fap);
      acc.folhaBruta += comp.totalBruto;
      acc.encargos += enc.totalEncargos;
      acc.custoReal += comp.baseCalculoEncargos + enc.totalEncargos + comp.valorAlimentacao + comp.valorVT;
      return acc;
    }, { folhaBruta: 0, encargos: 0, custoReal: 0 });

    return {
      loja: loja.nome,
      funcionarios: loja.funcionarios.length,
      folhaBruta: Number(totais.folhaBruta.toFixed(2)),
      encargos: Number(totais.encargos.toFixed(2)),
      custoTotalMensal: Number(totais.custoReal.toFixed(2)),
      custoAnual: Number((totais.custoReal * 14.33).toFixed(2)),
    };
  });

  const totalRede = resultado.reduce((acc, l) => {
    acc.folhaBruta += l.folhaBruta;
    acc.encargos += l.encargos;
    acc.custoTotalMensal += l.custoTotalMensal;
    return acc;
  }, { folhaBruta: 0, encargos: 0, custoTotalMensal: 0 });

  return JSON.stringify({
    lojas: resultado,
    totalRede: lojaId ? undefined : {
      folhaBruta: Number(totalRede.folhaBruta.toFixed(2)),
      encargos: Number(totalRede.encargos.toFixed(2)),
      custoTotalMensal: Number(totalRede.custoTotalMensal.toFixed(2)),
    },
  });
}

// ─── Aniversariantes ──────────────────────────────────────────────────────────

async function consultarAniversariantes(args: any, userId: string) {
  const hoje = new Date();
  const mes = Number(args.mes ?? hoje.getMonth() + 1);
  const lojaId = args.lojaId as string | undefined;

  const funcionarios = await prisma.rhFuncionario.findMany({
    where: {
      userId,
      ativo: true,
      dataNascimento: { not: null },
      ...(lojaId ? { lojaId } : {}),
    },
    include: { loja: { select: { nome: true } } },
    orderBy: { nome: 'asc' },
  });

  const aniversariantes = funcionarios
    .filter(f => {
      if (!f.dataNascimento) return false;
      return new Date(f.dataNascimento).getUTCMonth() + 1 === mes;
    })
    .map(f => {
      const nasc = new Date(f.dataNascimento!);
      const dia = nasc.getUTCDate();
      const idade = hoje.getFullYear() - nasc.getUTCFullYear();
      const dataEsteAno = new Date(hoje.getFullYear(), mes - 1, dia);
      return {
        nome: f.nome,
        loja: f.loja.nome,
        dia,
        idade,
        jaPassou: dataEsteAno < hoje,
      };
    })
    .sort((a, b) => a.dia - b.dia);

  const proximos = aniversariantes.filter(a => !a.jaPassou);

  return JSON.stringify({
    mes: MESES_LABEL[mes],
    total: aniversariantes.length,
    proximos: proximos.length,
    aniversariantes,
    mensagem: aniversariantes.length === 0
      ? `Nenhum aniversariante em ${MESES_LABEL[mes]}.`
      : `${aniversariantes.length} aniversariante(s) em ${MESES_LABEL[mes]}: ${aniversariantes.map(a => `${a.nome} (dia ${a.dia})`).join(', ')}.`,
  });
}

// ─── Alertas trabalhistas ─────────────────────────────────────────────────────

async function listarAlertasTrabalhistas(args: any, userId: string) {
  const lojaId = args.lojaId as string | undefined;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const funcionarios = await prisma.rhFuncionario.findMany({
    where: { userId, ativo: true, ...(lojaId ? { lojaId } : {}) },
    include: {
      loja: { select: { nome: true } },
      cargo: { select: { nome: true } },
    },
    orderBy: { nome: 'asc' },
  });

  const alertasExperiencia = funcionarios
    .filter(f => f.dataFimExperiencia1 || f.dataFimExperiencia2)
    .map(f => {
      const d1 = f.dataFimExperiencia1 ? diffDias(hoje, f.dataFimExperiencia1) : null;
      const d2 = f.dataFimExperiencia2 ? diffDias(hoje, f.dataFimExperiencia2) : null;
      return { f, d1, d2 };
    })
    .filter(({ d1, d2 }) =>
      (d1 !== null && d1 >= 0 && d1 <= 15) || (d2 !== null && d2 >= 0 && d2 <= 15)
    )
    .map(({ f, d1, d2 }) => ({
      nome: f.nome, loja: f.loja.nome, cargo: f.cargo.nome,
      fim1: f.dataFimExperiencia1 ? new Date(f.dataFimExperiencia1).toLocaleDateString('pt-BR') : null,
      diasParaFim1: d1,
      fim2: f.dataFimExperiencia2 ? new Date(f.dataFimExperiencia2).toLocaleDateString('pt-BR') : null,
      diasParaFim2: d2,
      urgencia: (d1 !== null && d1 <= 7) || (d2 !== null && d2 <= 7) ? 'CRÍTICO' : 'ATENÇÃO',
    }));

  const alertasFerias = funcionarios
    .filter(f => f.dataInicioFerias)
    .map(f => {
      const periodo = calcPeriodoAquisitivo(f.dataInicioFerias, {
        dataAdmissao: f.dataAdmissao,
        dataGozoFerias: f.dataGozoFerias,
        hoje,
      })!;
      return { f, venc: periodo.vencimento, dias: periodo.diasRestantes };
    })
    .filter(({ dias }) => dias <= 60)
    .map(({ f, venc, dias }) => ({
      nome: f.nome, loja: f.loja.nome,
      vencimento: venc.toLocaleDateString('pt-BR'),
      diasParaVencer: dias,
      status: f.statusFerias ?? 'a_gozar',
      urgencia: dias < 0 ? 'VENCIDO' : dias <= 30 ? 'CRÍTICO' : 'ATENÇÃO',
    }));

  const totalCriticos = [
    ...alertasExperiencia.filter(a => a.urgencia === 'CRÍTICO'),
    ...alertasFerias.filter(a => a.urgencia === 'CRÍTICO' || a.urgencia === 'VENCIDO'),
  ].length;

  const mensagens: string[] = [];
  if (alertasExperiencia.length > 0)
    mensagens.push(`${alertasExperiencia.length} funcionário(s) com período de experiência vencendo em até 15 dias.`);
  if (alertasFerias.filter(a => a.urgencia === 'VENCIDO').length > 0)
    mensagens.push(`${alertasFerias.filter(a => a.urgencia === 'VENCIDO').length} funcionário(s) com férias VENCIDAS!`);
  if (alertasFerias.filter(a => a.urgencia !== 'VENCIDO').length > 0)
    mensagens.push(`${alertasFerias.filter(a => a.urgencia !== 'VENCIDO').length} funcionário(s) com férias vencendo em breve.`);
  if (mensagens.length === 0)
    mensagens.push('Nenhum alerta trabalhista no momento.');

  return JSON.stringify({
    totalCriticos,
    resumo: mensagens.join(' '),
    experiencia: alertasExperiencia,
    ferias: alertasFerias,
  });
}
