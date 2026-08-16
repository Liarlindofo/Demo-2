module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/drin-platform/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const prisma = global.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        'error',
        'warn'
    ] : "TURBOPACK unreachable",
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
// Garantir que apenas uma instância do Prisma existe
if ("TURBOPACK compile-time truthy", 1) {
    global.prisma = prisma;
}
// Graceful shutdown - desconectar quando o processo terminar
if ("TURBOPACK compile-time truthy", 1) {
    process.on('beforeExit', async ()=>{
        await prisma.$disconnect();
    });
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/drin-platform/src/lib/auth/service-api-key.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hashApiKey",
    ()=>hashApiKey,
    "requireServiceApiKey",
    ()=>requireServiceApiKey
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/src/lib/prisma.ts [app-route] (ecmascript)");
;
;
;
function hashApiKey(rawKey) {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha256').update(rawKey).digest('hex');
}
async function requireServiceApiKey(req) {
    const rawKey = req.headers.get('x-api-key');
    if (!rawKey) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Não autorizado.'
        }, {
            status: 401
        });
    }
    let record;
    try {
        record = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].serviceApiKey.findUnique({
            where: {
                key: hashApiKey(rawKey),
                ativo: true
            },
            select: {
                id: true,
                userId: true
            }
        });
    } catch (err) {
        console.error('[service-api-key] Erro ao verificar key:', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Erro interno.'
        }, {
            status: 500
        });
    }
    if (!record) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Não autorizado.'
        }, {
            status: 401
        });
    }
    return {
        userId: record.userId,
        keyId: record.id
    };
}
}),
"[project]/drin-platform/src/lib/whatsapp-sessions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "findWhatsAppBotForTenant",
    ()=>findWhatsAppBotForTenant,
    "getTenantStackUserId",
    ()=>getTenantStackUserId,
    "listSessionsForActor",
    ()=>listSessionsForActor,
    "listSessionsForStackUser",
    ()=>listSessionsForStackUser,
    "mapBotToDto",
    ()=>mapBotToDto,
    "nextAvailableSlot",
    ()=>nextAvailableSlot,
    "realPhoneNumber",
    ()=>realPhoneNumber,
    "resolveStackUserIdsForTenant",
    ()=>resolveStackUserIdsForTenant
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/src/lib/prisma.ts [app-route] (ecmascript)");
;
function realPhoneNumber(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    return digits.length >= 8 ? digits : null;
}
function mapBotToDto(bot) {
    const qrCode = bot.qrCode ?? null;
    const isConnected = Boolean(bot.isConnected);
    let status = 'DISCONNECTED';
    if (isConnected) status = 'CONNECTED';
    else if (qrCode) status = 'QRCODE';
    else status = 'CONNECTING';
    return {
        slot: bot.slot,
        label: bot.label && bot.label.trim() || `Sessão ${bot.slot}`,
        status,
        isConnected,
        isActive: isConnected || Boolean(qrCode),
        connectedNumber: realPhoneNumber(bot.connectedNumber),
        qrCode,
        iaAtiva: bot.iaAtiva === true,
        iaPrompt: bot.iaPrompt ?? null,
        monitorarReclamacoes: bot.monitorarReclamacoes === true,
        updatedAt: bot.updatedAt.toISOString()
    };
}
async function listSessionsForStackUser(stackUserId) {
    const bots = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].whatsAppBot.findMany({
        where: {
            userId: stackUserId
        },
        orderBy: {
            slot: 'asc'
        }
    });
    return bots.map(mapBotToDto);
}
async function resolveStackUserIdsForTenant(tenantUserId) {
    const ids = new Set();
    if (!tenantUserId) return [];
    const asStack = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].stackUser.findUnique({
        where: {
            id: tenantUserId
        },
        select: {
            id: true
        }
    });
    if (asStack) ids.add(asStack.id);
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: tenantUserId
        },
        select: {
            stackUserId: true,
            email: true
        }
    });
    if (user?.stackUserId) ids.add(user.stackUserId);
    const linked = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].stackUser.findMany({
        where: {
            userId: tenantUserId
        },
        select: {
            id: true
        }
    });
    for (const row of linked)ids.add(row.id);
    if (user?.email) {
        const byEmail = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].stackUser.findMany({
            where: {
                primaryEmail: {
                    equals: user.email,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true
            }
        });
        for (const row of byEmail)ids.add(row.id);
    }
    return [
        ...ids
    ];
}
async function getTenantStackUserId(tenantUserId) {
    const ids = await resolveStackUserIdsForTenant(tenantUserId);
    return ids[0] ?? null;
}
async function findWhatsAppBotForTenant(tenantUserId, slot) {
    const stackIds = await resolveStackUserIdsForTenant(tenantUserId);
    if (stackIds.length === 0) return null;
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].whatsAppBot.findFirst({
        where: {
            userId: {
                in: stackIds
            },
            slot
        },
        select: {
            userId: true,
            slot: true,
            isConnected: true,
            label: true
        }
    });
}
async function listSessionsForActor(params) {
    const ids = [
        ...new Set([
            params.stackUserId,
            ...await resolveStackUserIdsForTenant(params.tenantUserId)
        ].filter((id)=>Boolean(id)))
    ];
    const bySlot = new Map();
    for (const id of ids){
        const list = await listSessionsForStackUser(id);
        for (const session of list){
            if (!bySlot.has(session.slot)) bySlot.set(session.slot, session);
        }
    }
    return [
        ...bySlot.values()
    ].sort((a, b)=>a.slot - b.slot);
}
async function nextAvailableSlot(stackUserId) {
    const bots = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].whatsAppBot.findMany({
        where: {
            userId: stackUserId
        },
        select: {
            slot: true
        },
        orderBy: {
            slot: 'asc'
        }
    });
    const used = new Set(bots.map((b)=>b.slot));
    let slot = 1;
    while(used.has(slot))slot += 1;
    return slot;
}
}),
"[project]/drin-platform/src/lib/complaints/classify.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Classificação de conversas WhatsApp como reclamação via OpenRouter.
 * Critério principal: julgamento de contexto (igual revisão humana).
 * palavrasChaveReclamacao = reforço opcional, nunca filtro rígido.
 */ __turbopack_context__.s([
    "buildTranscript",
    ()=>buildTranscript,
    "classifyConversation",
    ()=>classifyConversation
]);
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
function speakerLabel(msg) {
    if (msg.direction === 'IN') return 'CLIENTE';
    if (msg.sentByAgent) return 'ATENDENTE';
    return 'IA';
}
function formatTs(d) {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).format(d);
}
function bodyForTranscript(msg) {
    const raw = msg.textContent?.trim() || '';
    // Evita despejar base64 de imagem no prompt
    if (raw.length > 500 || /^\/9j\//.test(raw) || raw.startsWith('data:')) {
        return msg.messageType !== 'text' ? `[mídia: ${msg.messageType}]` : '[conteúdo longo omitido]';
    }
    if (raw) return raw;
    return msg.messageType !== 'text' ? `[mídia: ${msg.messageType}]` : '[sem texto]';
}
function buildTranscript(messages) {
    return messages.map((m)=>{
        const speaker = speakerLabel(m);
        const body = bodyForTranscript(m);
        return `[id=${m.id}] [${formatTs(m.timestamp)}] ${speaker} (${m.messageType}): ${body}`;
    }).join('\n');
}
function buildSystemPrompt(palavrasChave) {
    const reforco = palavrasChave.length > 0 ? `\n\nReforço opcional desta conta (NÃO é lista exclusiva — use só como pista de atenção extra quando aparecerem): ${palavrasChave.map((p)=>`"${p}"`).join(', ')}.` : '';
    return `Você revisa conversas de atendimento (WhatsApp) de um restaurante/delivery e decide se há RECLAMAÇÃO do cliente — com o mesmo julgamento de contexto que um humano experiente usaria. Não existe lista fixa de palavras-chave da empresa; a decisão é por contexto.

Considere RECLAMAÇÃO quando o cliente:
- expressa insatisfação ou frustração explícita;
- relata problema com o pedido (errado, atrasado, com defeito, item faltando, qualidade ruim, etc.);
- aponta cobrança incorreta;
- pede reembolso, cancelamento ou troca por causa de problema no pedido/atendimento.

NÃO conte como reclamação:
- perguntas neutras;
- elogios;
- dúvidas comuns sobre cardápio, horário, entrega, status do pedido sem tom de insatisfação;
- conversas puramente operacionais sem queixa.

Se for reclamação, resuma em 1–2 frases objetivas e indique a data aproximada do problema relatado (YYYY-MM-DD), se identificável no transcript; senão use a data da mensagem de evidência principal.
Liste evidenciaMessageIds com os IDs reais das mensagens (campo id=...) que comprovam a reclamação — priorize imagens/mídia do cliente e trechos de texto relevantes do cliente.

Responda APENAS JSON válido, sem markdown:
{"eReclamacao":true|false,"resumo":string|null,"dataOcorrencia":"YYYY-MM-DD"|null,"evidenciaMessageIds":string[]}${reforco}`;
}
function extractJson(raw) {
    const trimmed = raw.trim();
    try {
        return JSON.parse(trimmed);
    } catch  {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Resposta da IA sem JSON.');
        return JSON.parse(match[0]);
    }
}
function parseOccurrenceDate(value, fallback) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return fallback;
    }
    const d = new Date(`${value}T12:00:00.000-03:00`);
    return Number.isNaN(d.getTime()) ? fallback : d;
}
async function classifyConversation(params) {
    const { messages, palavrasChave } = params;
    const primaryKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const fallbackKey = (process.env.RH_OPENROUTER_API_KEY || '').trim();
    const apiKey = primaryKey || fallbackKey;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY não configurada.');
    }
    const validIds = new Set(messages.map((m)=>m.id));
    const transcript = buildTranscript(messages);
    // chatgpt-4o-latest no .env costuma 404 em várias contas; classificação usa mini por padrão.
    const model = (process.env.COMPLAINTS_OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim();
    async function callOpenRouter(key) {
        return fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'Platefull - Reclamações'
            },
            body: JSON.stringify({
                model,
                temperature: 0.1,
                max_tokens: 600,
                messages: [
                    {
                        role: 'system',
                        content: buildSystemPrompt(palavrasChave)
                    },
                    {
                        role: 'user',
                        content: `Classifique a conversa abaixo.\n\n${transcript}`
                    }
                ]
            })
        });
    }
    let res = await callOpenRouter(apiKey);
    // Conta OpenRouter principal às vezes lista models mas falha no chat — tenta RH.
    if ((res.status === 401 || res.status === 403) && fallbackKey && fallbackKey !== apiKey) {
        res = await callOpenRouter(fallbackKey);
    }
    if (!res.ok) {
        const errText = await res.text().catch(()=>'');
        throw new Error(`OpenRouter HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('OpenRouter retornou resposta vazia.');
    }
    const parsed = extractJson(content);
    const eReclamacao = parsed.eReclamacao === true;
    if (!eReclamacao) {
        return {
            eReclamacao: false,
            resumo: null,
            dataOcorrencia: null,
            evidenciaMessageIds: []
        };
    }
    const rawIds = Array.isArray(parsed.evidenciaMessageIds) ? parsed.evidenciaMessageIds.filter((id)=>typeof id === 'string') : [];
    const evidenciaMessageIds = [
        ...new Set(rawIds.filter((id)=>validIds.has(id)))
    ];
    // Se a IA não apontou IDs válidos, usa mensagens IN (texto/imagem) como fallback mínimo
    if (evidenciaMessageIds.length === 0) {
        const fallback = messages.filter((m)=>m.direction === 'IN').slice(-5).map((m)=>m.id);
        evidenciaMessageIds.push(...fallback);
    }
    const resumo = typeof parsed.resumo === 'string' && parsed.resumo.trim() ? parsed.resumo.trim().slice(0, 2000) : 'Reclamação identificada (sem resumo detalhado da IA).';
    const anchor = messages.find((m)=>evidenciaMessageIds.includes(m.id))?.timestamp ?? messages[messages.length - 1]?.timestamp ?? new Date();
    return {
        eReclamacao: true,
        resumo,
        dataOcorrencia: parseOccurrenceDate(parsed.dataOcorrencia, anchor),
        evidenciaMessageIds
    };
}
}),
"[project]/drin-platform/src/lib/complaints/period.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Fuso fixo America/Sao_Paulo (UTC−3; Brasil sem horário de verão desde 2019). */ __turbopack_context__.s([
    "currentMonthPeriod",
    ()=>currentMonthPeriod,
    "monthPeriod",
    ()=>monthPeriod,
    "previousMonthPeriod",
    ()=>previousMonthPeriod,
    "saoPauloYmd",
    ()=>saoPauloYmd
]);
const SP_OFFSET = '-03:00';
function saoPauloYmd(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const get = (type)=>Number(parts.find((p)=>p.type === type)?.value);
    return {
        year: get('year'),
        month: get('month'),
        day: get('day')
    };
}
function monthPeriod(year, month) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new Error('year inválido.');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error('month inválido (1–12).');
    }
    const mm = String(month).padStart(2, '0');
    const start = new Date(`${year}-${mm}-01T00:00:00.000${SP_OFFSET}`);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nm = String(nextMonth).padStart(2, '0');
    const end = new Date(new Date(`${nextYear}-${nm}-01T00:00:00.000${SP_OFFSET}`).getTime() - 1);
    return {
        year,
        month,
        start,
        end
    };
}
function previousMonthPeriod(now = new Date()) {
    const { year, month } = saoPauloYmd(now);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return monthPeriod(prevYear, prevMonth);
}
function currentMonthPeriod(now = new Date()) {
    const { year, month } = saoPauloYmd(now);
    return monthPeriod(year, month);
}
}),
"[project]/drin-platform/app/api/reports/complaints/run/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "maxDuration",
    ()=>maxDuration,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$auth$2f$service$2d$api$2d$key$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/src/lib/auth/service-api-key.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$whatsapp$2d$sessions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/src/lib/whatsapp-sessions.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$complaints$2f$classify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/src/lib/complaints/classify.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$complaints$2f$period$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/src/lib/complaints/period.ts [app-route] (ecmascript)");
const dynamic = 'force-dynamic';
const runtime = 'nodejs';
const maxDuration = 300;
;
;
;
;
;
;
function resolvePeriod(body) {
    if (typeof body.year === 'number' && typeof body.month === 'number' && Number.isFinite(body.year) && Number.isFinite(body.month)) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$complaints$2f$period$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["monthPeriod"])(Math.trunc(body.year), Math.trunc(body.month));
    }
    const period = (body.period || 'previous').toLowerCase();
    if (period === 'current') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$complaints$2f$period$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["currentMonthPeriod"])();
    if (period === 'previous') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$complaints$2f$period$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["previousMonthPeriod"])();
    throw new Error('period deve ser "previous" ou "current" (ou informe year+month).');
}
async function POST(req) {
    const auth = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$auth$2f$service$2d$api$2d$key$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireServiceApiKey"])(req);
    if (auth instanceof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]) return auth;
    const { userId } = auth;
    let body = {};
    try {
        const text = await req.text();
        if (text.trim()) body = JSON.parse(text);
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Body JSON inválido.'
        }, {
            status: 400
        });
    }
    let period;
    try {
        period = resolvePeriod(body);
    } catch (err) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: err instanceof Error ? err.message : 'Período inválido.'
        }, {
            status: 400
        });
    }
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            palavrasChaveReclamacao: true
        }
    });
    if (!user) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Tenant não encontrado.'
        }, {
            status: 404
        });
    }
    const stackIds = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$whatsapp$2d$sessions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveStackUserIdsForTenant"])(userId);
    const monitoredBots = stackIds.length > 0 ? await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].whatsAppBot.findMany({
        where: {
            userId: {
                in: stackIds
            },
            monitorarReclamacoes: true
        },
        select: {
            slot: true
        }
    }) : [];
    const monitoredSlots = [
        ...new Set(monitoredBots.map((b)=>b.slot))
    ];
    const run = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].complaintReviewRun.create({
        data: {
            userId,
            periodStart: period.start,
            periodEnd: period.end,
            status: 'PROCESSANDO'
        }
    });
    if (monitoredSlots.length === 0) {
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].complaintReviewRun.update({
            where: {
                id: run.id
            },
            data: {
                status: 'CONCLUIDO',
                totalConversas: 0,
                totalReclamacoes: 0
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            reviewRunId: updated.id,
            status: updated.status,
            periodStart: updated.periodStart,
            periodEnd: updated.periodEnd,
            totalConversas: 0,
            totalReclamacoes: 0,
            mensagem: 'Nenhuma sessão com monitorarReclamacoes=true.'
        });
    }
    const messages = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].whatsAppMessage.findMany({
        where: {
            userId,
            sessionSlot: {
                in: monitoredSlots
            },
            timestamp: {
                gte: period.start,
                lte: period.end
            }
        },
        select: {
            id: true,
            contactId: true,
            contactName: true,
            direction: true,
            messageType: true,
            textContent: true,
            sentByAgent: true,
            timestamp: true
        },
        orderBy: {
            timestamp: 'asc'
        }
    });
    /** Agrupa por contactId (uma conversa = um contato). */ const byContact = new Map();
    for (const msg of messages){
        const existing = byContact.get(msg.contactId);
        const entry = {
            id: msg.id,
            direction: msg.direction,
            messageType: msg.messageType,
            textContent: msg.textContent,
            sentByAgent: msg.sentByAgent,
            timestamp: msg.timestamp
        };
        if (existing) {
            existing.messages.push(entry);
            if (!existing.contactName && msg.contactName) {
                existing.contactName = msg.contactName;
            }
        } else {
            byContact.set(msg.contactId, {
                contactName: msg.contactName,
                messages: [
                    entry
                ]
            });
        }
    }
    const palavrasChave = user.palavrasChaveReclamacao ?? [];
    let totalReclamacoes = 0;
    const totalConversas = byContact.size;
    try {
        for (const [contactId, conv] of byContact){
            // Pula conversas sem mensagem do cliente
            if (!conv.messages.some((m)=>m.direction === 'IN')) continue;
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$complaints$2f$classify$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["classifyConversation"])({
                messages: conv.messages,
                palavrasChave
            });
            if (!result.eReclamacao || !result.resumo || !result.dataOcorrencia) {
                continue;
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].complaint.create({
                data: {
                    reviewRunId: run.id,
                    userId,
                    contactId,
                    contactName: conv.contactName,
                    resumo: result.resumo,
                    dataOcorrencia: result.dataOcorrencia,
                    evidenciaMessageIds: result.evidenciaMessageIds
                }
            });
            totalReclamacoes += 1;
        }
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].complaintReviewRun.update({
            where: {
                id: run.id
            },
            data: {
                status: 'CONCLUIDO',
                totalConversas,
                totalReclamacoes
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            reviewRunId: updated.id,
            status: updated.status,
            periodStart: updated.periodStart,
            periodEnd: updated.periodEnd,
            totalConversas: updated.totalConversas,
            totalReclamacoes: updated.totalReclamacoes
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[complaints/run] Falha no meio do processamento:', message);
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].complaintReviewRun.update({
            where: {
                id: run.id
            },
            data: {
                status: 'ERRO',
                totalConversas,
                totalReclamacoes,
                erro: message.slice(0, 2000)
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            reviewRunId: updated.id,
            status: updated.status,
            periodStart: updated.periodStart,
            periodEnd: updated.periodEnd,
            totalConversas: updated.totalConversas,
            totalReclamacoes: updated.totalReclamacoes,
            erro: updated.erro
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__afa231c9._.js.map