import { prisma } from './prisma';
import { ensureRhCargosPadrao } from './rh-cargos-padrao';
import { enrichFuncionario } from './rh-funcionario';
import { limparCPF, validarCPF } from './validacoes';

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
