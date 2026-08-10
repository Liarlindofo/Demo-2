// prisma/seeds/seedSaiposFieldCatalog.ts
//
// Chame seedSaiposFieldCatalog(prisma) a partir do seed.ts principal.
// Baseado nos campos visíveis no painel Saipos (relatório de vendas).
// grupo: "geral" | "cupons" | "ticket_medio" | "canal"

import { PrismaClient } from '@prisma/client';

const CATALOGO = [
  // geral
  { key: 'qtde_pedidos',               label: 'Qtde total de pedidos',                         grupo: 'geral',        ordem: 1  },
  { key: 'pedidos_cancelados',          label: 'Qtde de pedidos cancelados',                    grupo: 'geral',        ordem: 2  },
  { key: 'total_pedidos',               label: 'Total dos pedidos',                             grupo: 'geral',        ordem: 3  },
  { key: 'total_pedidos_cancelados',    label: 'Total dos pedidos cancelados',                  grupo: 'geral',        ordem: 4  },
  { key: 'total_itens',                 label: 'Total dos itens',                               grupo: 'geral',        ordem: 5  },
  { key: 'total_taxas_entrega',         label: 'Total das taxas de entrega',                    grupo: 'geral',        ordem: 6  },
  { key: 'total_taxas_servico',         label: 'Total das taxas de serviço',                    grupo: 'geral',        ordem: 7  },
  { key: 'total_acrescimos',            label: 'Total de acréscimos',                           grupo: 'geral',        ordem: 8  },
  { key: 'total_descontos',             label: 'Total de descontos',                            grupo: 'geral',        ordem: 9  },
  { key: 'qtde_entrega',               label: 'Qtde Entrega',                                  grupo: 'geral',        ordem: 10 },
  { key: 'qtde_balcao',                label: 'Qtde Balcão',                                   grupo: 'geral',        ordem: 11 },
  { key: 'qtde_ficha',                 label: 'Qtde Ficha',                                    grupo: 'geral',        ordem: 12 },
  { key: 'qtde_salao_clientes',        label: 'Qtde Salão / Clientes atendidos',               grupo: 'geral',        ordem: 13 },

  // cupons
  { key: 'qtde_cupons_emitidos',           label: 'Quantidade de cupons emitidos',                    grupo: 'cupons', ordem: 1 },
  { key: 'cupons_a_emitir',                label: 'Cupons a emitir',                                  grupo: 'cupons', ordem: 2 },
  { key: 'valor_total_cupons_emitidos',    label: 'Valor total dos cupons emitidos',                  grupo: 'cupons', ordem: 3 },
  { key: 'valor_cupons_vendas_canceladas', label: 'Valor cupons emitidos em vendas canceladas',       grupo: 'cupons', ordem: 4 },
  { key: 'qtde_cupons_vendas_canceladas',  label: 'Qtde cupons emitidos em vendas canceladas',        grupo: 'cupons', ordem: 5 },

  // ticket médio
  { key: 'ticket_medio_entrega', label: 'Ticket médio - Entrega', grupo: 'ticket_medio', ordem: 1 },
  { key: 'ticket_medio_balcao',  label: 'Ticket médio - Balcão',  grupo: 'ticket_medio', ordem: 2 },
  { key: 'ticket_medio_mesa',    label: 'Ticket médio - Mesa',    grupo: 'ticket_medio', ordem: 3 },
  { key: 'ticket_medio_ficha',   label: 'Ticket médio - Ficha',   grupo: 'ticket_medio', ordem: 4 },

  // canais (qtde + valor)
  { key: 'canal_anota_ai_qtde',           label: 'Anota.ai — Qtde',             grupo: 'canal', ordem: 1  },
  { key: 'canal_anota_ai_valor',          label: 'Anota.ai — Valor',            grupo: 'canal', ordem: 2  },
  { key: 'canal_central_pedidos_qtde',    label: 'Central de Pedidos — Qtde',   grupo: 'canal', ordem: 3  },
  { key: 'canal_central_pedidos_valor',   label: 'Central de Pedidos — Valor',  grupo: 'canal', ordem: 4  },
  { key: 'canal_delivery_direto_qtde',    label: 'Delivery Direto — Qtde',      grupo: 'canal', ordem: 5  },
  { key: 'canal_delivery_direto_valor',   label: 'Delivery Direto — Valor',     grupo: 'canal', ordem: 6  },
  { key: 'canal_facebook_qtde',           label: 'Facebook — Qtde',             grupo: 'canal', ordem: 7  },
  { key: 'canal_facebook_valor',          label: 'Facebook — Valor',            grupo: 'canal', ordem: 8  },
  { key: 'canal_ifood_qtde',              label: 'iFood — Qtde',                grupo: 'canal', ordem: 9  },
  { key: 'canal_ifood_valor',             label: 'iFood — Valor',               grupo: 'canal', ordem: 10 },
  { key: 'canal_telefone_qtde',           label: 'Telefone — Qtde',             grupo: 'canal', ordem: 11 },
  { key: 'canal_telefone_valor',          label: 'Telefone — Valor',            grupo: 'canal', ordem: 12 },
  { key: 'canal_whatsapp_qtde',           label: 'WhatsApp — Qtde',             grupo: 'canal', ordem: 13 },
  { key: 'canal_whatsapp_valor',          label: 'WhatsApp — Valor',            grupo: 'canal', ordem: 14 },
];

export async function seedSaiposFieldCatalog(prisma: PrismaClient) {
  for (const campo of CATALOGO) {
    await prisma.saiposFieldCatalog.upsert({
      where: { key: campo.key },
      update: { label: campo.label, grupo: campo.grupo, ordem: campo.ordem },
      create: campo,
    });
  }
  console.log(`✅ SaiposFieldCatalog: ${CATALOGO.length} campos seedados.`);
}

// Execução standalone opcional: npx tsx prisma/seeds/seedSaiposFieldCatalog.ts
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const prisma = new PrismaClient();
  seedSaiposFieldCatalog(prisma)
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
