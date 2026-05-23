import { prisma } from './prisma';
import { ensureRhCargosPadrao } from './rh-cargos-padrao';
import { enrichFuncionario } from './rh-funcionario';
import { limparCPF, validarCPF } from './validacoes';
import { seedAssiduidadeMes, mesAnoAtual, trimestreAtual } from './seed-assiduidade';

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
