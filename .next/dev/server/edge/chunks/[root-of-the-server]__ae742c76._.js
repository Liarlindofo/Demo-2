(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__ae742c76._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/drin-platform/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/jose/dist/webapi/jwt/verify.js [middleware-edge] (ecmascript)");
;
;
const RIDER_COOKIE = 'rider_token';
async function getRiderSession(request) {
    try {
        const token = request.cookies.get(RIDER_COOKIE)?.value;
        if (!token) return null;
        const secret = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
        if (!secret) return null;
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["jwtVerify"])(token, new TextEncoder().encode(secret));
        return payload;
    } catch  {
        return null;
    }
}
async function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;
    // ── Proteção de /rh/usuarios — apenas usuários Stack Auth autenticados ─────
    // A verificação de role Admin é feita no server-side (API retorna 403 para membros RH)
    if (pathname.startsWith('/rh/usuarios')) {
    // Stack Auth usa cookies — verificação granular fica no server component/API
    // Aqui apenas garantimos que a rota existe no matcher
    }
    // ── Proteção do portal /rider ──────────────────────────────────────────────
    if (pathname.startsWith('/rider')) {
        const publicRiderPaths = [
            '/rider/login',
            '/rider/setup'
        ];
        const isPublic = publicRiderPaths.some((p)=>pathname.startsWith(p));
        if (!isPublic) {
            const session = await getRiderSession(request);
            if (!session) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/rider/login', request.url));
            }
        }
    }
    // Limpar parâmetros de URL após autenticação OAuth
    if (pathname.startsWith('/handler')) {
        const code = searchParams.get('code');
        const afterAuthReturnTo = searchParams.get('after_auth_return_to');
        if (code || afterAuthReturnTo) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        }
    }
    // Limpar parâmetros do dashboard
    if (pathname.startsWith('/dashboard')) {
        const code = searchParams.get('code');
        if (code) {
            const url = request.nextUrl.clone();
            url.search = '';
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        '/handler/:path*',
        '/dashboard/:path*',
        '/rider/:path*',
        '/rh/usuarios/:path*'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ae742c76._.js.map