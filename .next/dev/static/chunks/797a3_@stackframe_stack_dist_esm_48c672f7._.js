(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/hooks.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/hooks.tsx
__turbopack_context__.s([
    "useStackApp",
    ()=>useStackApp,
    "useUser",
    ()=>useUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$providers$2f$stack$2d$provider$2d$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/providers/stack-provider-client.js [app-client] (ecmascript)");
;
;
function useUser(options = {}) {
    const stackApp = useStackApp(options);
    if (options.projectIdMustMatch && stackApp.projectId !== options.projectIdMustMatch) {
        throw new Error("Unexpected project ID in useStackApp: " + stackApp.projectId);
    }
    if (options.projectIdMustMatch === "internal") {
        return stackApp.useUser(options);
    } else {
        return stackApp.useUser(options);
    }
}
function useStackApp(options = {}) {
    if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"] !== "function") {
        throw new Error("useStackApp() can only be used in a React Client Component. Make sure you're not calling it from a Server Component, or any other environment.");
    }
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$providers$2f$stack$2d$provider$2d$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackContext"]);
    if (context === null) {
        throw new Error("useStackApp must be used within a StackProvider");
    }
    const stackApp = context.app;
    if (options.projectIdMustMatch && stackApp.projectId !== options.projectIdMustMatch) {
        throw new Error("Unexpected project ID in useStackApp: " + stackApp.projectId);
    }
    return stackApp;
}
;
 //# sourceMappingURL=hooks.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/common.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/common.ts
__turbopack_context__.s([
    "stackAppInternalsSymbol",
    ()=>stackAppInternalsSymbol
]);
var stackAppInternalsSymbol = Symbol.for("StackAuth--DO-NOT-USE-OR-YOU-WILL-BE-FIRED--StackAppInternals");
;
 //# sourceMappingURL=common.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/internal-api-keys/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/internal-api-keys/index.ts
__turbopack_context__.s([
    "internalApiKeyCreateOptionsToCrud",
    ()=>internalApiKeyCreateOptionsToCrud
]);
function internalApiKeyCreateOptionsToCrud(options) {
    return {
        description: options.description,
        expires_at_millis: options.expiresAt.getTime(),
        has_publishable_client_key: options.hasPublishableClientKey,
        has_secret_server_key: options.hasSecretServerKey,
        has_super_secret_admin_key: options.hasSuperSecretAdminKey
    };
}
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/permissions/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/permissions/index.ts
__turbopack_context__.s([
    "adminProjectPermissionDefinitionCreateOptionsToCrud",
    ()=>adminProjectPermissionDefinitionCreateOptionsToCrud,
    "adminProjectPermissionDefinitionUpdateOptionsToCrud",
    ()=>adminProjectPermissionDefinitionUpdateOptionsToCrud,
    "adminTeamPermissionDefinitionCreateOptionsToCrud",
    ()=>adminTeamPermissionDefinitionCreateOptionsToCrud,
    "adminTeamPermissionDefinitionUpdateOptionsToCrud",
    ()=>adminTeamPermissionDefinitionUpdateOptionsToCrud
]);
function adminTeamPermissionDefinitionCreateOptionsToCrud(options) {
    return {
        id: options.id,
        description: options.description,
        contained_permission_ids: options.containedPermissionIds
    };
}
function adminTeamPermissionDefinitionUpdateOptionsToCrud(options) {
    return {
        description: options.description,
        contained_permission_ids: options.containedPermissionIds
    };
}
function adminProjectPermissionDefinitionCreateOptionsToCrud(options) {
    return {
        id: options.id,
        description: options.description,
        contained_permission_ids: options.containedPermissionIds
    };
}
function adminProjectPermissionDefinitionUpdateOptionsToCrud(options) {
    return {
        description: options.description,
        contained_permission_ids: options.containedPermissionIds
    };
}
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/projects/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/projects/index.ts
__turbopack_context__.s([
    "adminProjectCreateOptionsToCrud",
    ()=>adminProjectCreateOptionsToCrud,
    "adminProjectUpdateOptionsToCrud",
    ()=>adminProjectUpdateOptionsToCrud
]);
function adminProjectUpdateOptionsToCrud(options) {
    return {
        display_name: options.displayName,
        description: options.description,
        is_production_mode: options.isProductionMode,
        logo_url: options.logoUrl,
        full_logo_url: options.fullLogoUrl,
        config: {
            domains: options.config?.domains?.map((d)=>({
                    domain: d.domain,
                    handler_path: d.handlerPath
                })),
            oauth_providers: options.config?.oauthProviders?.map((p)=>({
                    id: p.id,
                    type: p.type,
                    ...p.type === "standard" && {
                        client_id: p.clientId,
                        client_secret: p.clientSecret,
                        facebook_config_id: p.facebookConfigId,
                        microsoft_tenant_id: p.microsoftTenantId
                    }
                })),
            email_config: options.config?.emailConfig && (options.config.emailConfig.type === "shared" ? {
                type: "shared"
            } : {
                type: "standard",
                host: options.config.emailConfig.host,
                port: options.config.emailConfig.port,
                username: options.config.emailConfig.username,
                password: options.config.emailConfig.password,
                sender_name: options.config.emailConfig.senderName,
                sender_email: options.config.emailConfig.senderEmail
            }),
            email_theme: options.config?.emailTheme,
            sign_up_enabled: options.config?.signUpEnabled,
            credential_enabled: options.config?.credentialEnabled,
            magic_link_enabled: options.config?.magicLinkEnabled,
            passkey_enabled: options.config?.passkeyEnabled,
            allow_localhost: options.config?.allowLocalhost,
            create_team_on_sign_up: options.config?.createTeamOnSignUp,
            client_team_creation_enabled: options.config?.clientTeamCreationEnabled,
            client_user_deletion_enabled: options.config?.clientUserDeletionEnabled,
            team_creator_default_permissions: options.config?.teamCreatorDefaultPermissions,
            team_member_default_permissions: options.config?.teamMemberDefaultPermissions,
            user_default_permissions: options.config?.userDefaultPermissions,
            oauth_account_merge_strategy: options.config?.oauthAccountMergeStrategy,
            allow_user_api_keys: options.config?.allowUserApiKeys,
            allow_team_api_keys: options.config?.allowTeamApiKeys
        }
    };
}
function adminProjectCreateOptionsToCrud(options) {
    return {
        ...adminProjectUpdateOptionsToCrud(options),
        display_name: options.displayName,
        owner_team_id: options.teamId
    };
}
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/common.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/apps/implementations/common.ts
__turbopack_context__.s([
    "clientVersion",
    ()=>clientVersion,
    "createCache",
    ()=>createCache,
    "createCacheBySession",
    ()=>createCacheBySession,
    "createEmptyTokenStore",
    ()=>createEmptyTokenStore,
    "defaultBaseUrl",
    ()=>defaultBaseUrl,
    "getBaseUrl",
    ()=>getBaseUrl,
    "getDefaultExtraRequestHeaders",
    ()=>getDefaultExtraRequestHeaders,
    "getDefaultProjectId",
    ()=>getDefaultProjectId,
    "getDefaultPublishableClientKey",
    ()=>getDefaultPublishableClientKey,
    "getDefaultSecretServerKey",
    ()=>getDefaultSecretServerKey,
    "getDefaultSuperSecretAdminKey",
    ()=>getDefaultSuperSecretAdminKey,
    "getUrls",
    ()=>getUrls,
    "resolveConstructorOptions",
    ()=>resolveConstructorOptions,
    "useAsyncCache",
    ()=>useAsyncCache
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$caches$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/caches.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/env.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/globals.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/stores.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/common.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
var clientVersion = "js @stackframe/stack@2.8.47";
if (clientVersion.startsWith("STACK_COMPILE_TIME")) {
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Client version was not replaced. Something went wrong during build!");
}
var replaceStackPortPrefix = (input)=>{
    if (!input) return input;
    const prefix = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STACK_PORT_PREFIX;
    return prefix ? input.replace(/\$\{NEXT_PUBLIC_STACK_PORT_PREFIX:-81\}/g, prefix) : input;
};
var createCache = (fetcher)=>{
    return new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$caches$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AsyncCache"](async (dependencies)=>await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].fromThrowingAsync(async ()=>await fetcher(dependencies)), {});
};
var createCacheBySession = (fetcher)=>{
    return new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$caches$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AsyncCache"](async ([session, ...extraDependencies])=>await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].fromThrowingAsync(async ()=>await fetcher(session, extraDependencies)), {
        onSubscribe: ([session], refresh)=>{
            const handler = session.onInvalidate(()=>refresh());
            return ()=>handler.unsubscribe();
        }
    });
};
function resolveConstructorOptions(options) {
    return {
        ...options.inheritsFrom?.[__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]].getConstructorOptions() ?? {},
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["omit"])(options, [
            "inheritsFrom"
        ]))
    };
}
function getUrls(partial) {
    const handler = partial.handler ?? "/handler";
    const home = partial.home ?? "/";
    const afterSignIn = partial.afterSignIn ?? home;
    return {
        handler,
        signIn: `${handler}/sign-in`,
        afterSignIn: home,
        signUp: `${handler}/sign-up`,
        afterSignUp: afterSignIn,
        signOut: `${handler}/sign-out`,
        afterSignOut: home,
        emailVerification: `${handler}/email-verification`,
        passwordReset: `${handler}/password-reset`,
        forgotPassword: `${handler}/forgot-password`,
        oauthCallback: `${handler}/oauth-callback`,
        magicLinkCallback: `${handler}/magic-link-callback`,
        home,
        accountSettings: `${handler}/account-settings`,
        error: `${handler}/error`,
        teamInvitation: `${handler}/team-invitation`,
        mfa: `${handler}/mfa`,
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])(partial)
    };
}
function getDefaultProjectId() {
    return ("TURBOPACK compile-time value", "26dbad35-bdd4-497b-b94c-142f01758197") || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_PROJECT_ID || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(new Error("Welcome to Stack Auth! It seems that you haven't provided a project ID. Please create a project on the Stack dashboard at https://app.stack-auth.com and put it in the NEXT_PUBLIC_STACK_PROJECT_ID environment variable."));
}
function getDefaultPublishableClientKey() {
    return ("TURBOPACK compile-time value", "pck_1cazbav6n1k56a1q2fxre50xe5508qaneev49hzpcf390") || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_PUBLISHABLE_CLIENT_KEY || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(new Error("Welcome to Stack Auth! It seems that you haven't provided a publishable client key. Please create an API key for your project on the Stack dashboard at https://app.stack-auth.com and copy your publishable client key into the NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY environment variable."));
}
function getDefaultSecretServerKey() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_SECRET_SERVER_KEY || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(new Error("No secret server key provided. Please copy your key from the Stack dashboard and put it in the STACK_SECRET_SERVER_KEY environment variable."));
}
function getDefaultSuperSecretAdminKey() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_SUPER_SECRET_ADMIN_KEY || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(new Error("No super secret admin key provided. Please copy your key from the Stack dashboard and put it in the STACK_SUPER_SECRET_ADMIN_KEY environment variable."));
}
function getDefaultExtraRequestHeaders() {
    return JSON.parse(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STACK_EXTRA_REQUEST_HEADERS || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_EXTRA_REQUEST_HEADERS || "{}");
}
function getBaseUrl(userSpecifiedBaseUrl) {
    let url;
    if (userSpecifiedBaseUrl) {
        if (typeof userSpecifiedBaseUrl === "string") {
            url = userSpecifiedBaseUrl;
        } else {
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
                url = userSpecifiedBaseUrl.browser;
            } else {
                url = userSpecifiedBaseUrl.server;
            }
        }
    } else {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
            url = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BROWSER_STACK_API_URL || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STACK_API_URL_BROWSER || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_API_URL_BROWSER;
        } else {
            url = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SERVER_STACK_API_URL || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STACK_API_URL_SERVER || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_API_URL_SERVER;
        }
        url = url || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STACK_API_URL || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_API_URL || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STACK_URL || defaultBaseUrl;
    }
    return replaceStackPortPrefix(url.endsWith("/") ? url.slice(0, -1) : url);
}
var defaultBaseUrl = "https://api.stack-auth.com";
function createEmptyTokenStore() {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Store"]({
        refreshToken: null,
        accessToken: null
    });
}
var cachePromiseByHookId = /* @__PURE__ */ new Map();
function useAsyncCache(cache, dependencies, caller) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["suspendIfSsr"])(caller);
    const asyncCacheHooks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobal"])("use-async-cache-execution-hooks") ?? [];
    for (const hook of asyncCacheHooks){
        hook({
            cache,
            caller,
            dependencies
        });
    }
    const id = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useId();
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "useAsyncCache.useEffect": ()=>{
            cachePromiseByHookId.delete(id);
        }
    }["useAsyncCache.useEffect"], [
        ...dependencies,
        id
    ]);
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAsyncCache.useCallback[subscribe]": (cb)=>{
            const { unsubscribe } = cache.onStateChange(dependencies, {
                "useAsyncCache.useCallback[subscribe]": ()=>{
                    cachePromiseByHookId.delete(id);
                    cb();
                }
            }["useAsyncCache.useCallback[subscribe]"]);
            return unsubscribe;
        }
    }["useAsyncCache.useCallback[subscribe]"], [
        cache,
        ...dependencies
    ]);
    const getSnapshot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAsyncCache.useCallback[getSnapshot]": ()=>{
            if (!cachePromiseByHookId.has(id)) {
                cachePromiseByHookId.set(id, cache.getOrWait(dependencies, "read-write"));
            }
            return cachePromiseByHookId.get(id);
        }
    }["useAsyncCache.useCallback[getSnapshot]"], [
        cache,
        ...dependencies
    ]);
    const promise = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useSyncExternalStore(subscribe, getSnapshot, {
        "useAsyncCache.useSyncExternalStore[promise]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(new Error("getServerSnapshot should never be called in useAsyncCache because we restrict to CSR earlier"))
    }["useAsyncCache.useSyncExternalStore[promise]"]);
    const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].use(promise);
    if (result.status === "error") {
        const error = result.error;
        if (error instanceof Error && !error.__stackHasConcatenatedStacktraces) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["concatStacktraces"])(error, new Error());
            error.__stackHasConcatenatedStacktraces = true;
        }
        throw error;
    }
    return result.data;
}
;
 //# sourceMappingURL=common.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/url.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/url.ts
__turbopack_context__.s([
    "constructRedirectUrl",
    ()=>constructRedirectUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
;
function constructRedirectUrl(redirectUrl, callbackUrlName) {
    if (typeof window === "undefined" || !window.location) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`${callbackUrlName} option is required in a non-browser environment.`, {
            redirectUrl
        });
    }
    const retainedQueryParams = [
        "after_auth_return_to"
    ];
    const currentUrl = new URL(window.location.href);
    const url = redirectUrl ? new URL(redirectUrl, window.location.href) : new URL(window.location.href);
    for (const param of retainedQueryParams){
        if (currentUrl.searchParams.has(param)) {
            url.searchParams.set(param, currentUrl.searchParams.get(param));
        }
    }
    url.hash = "";
    return url.toString();
}
;
 //# sourceMappingURL=url.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/api-keys/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/api-keys/index.ts
__turbopack_context__.s([
    "apiKeyCreationOptionsToCrud",
    ()=>apiKeyCreationOptionsToCrud,
    "apiKeyUpdateOptionsToCrud",
    ()=>apiKeyUpdateOptionsToCrud
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
;
async function apiKeyCreationOptionsToCrud(type, userIdOrTeamId, options) {
    return {
        description: options.description,
        expires_at_millis: options.expiresAt == null ? options.expiresAt : options.expiresAt.getTime(),
        is_public: options.isPublic,
        ...type === "user" ? {
            user_id: userIdOrTeamId
        } : {
            team_id: userIdOrTeamId
        }
    };
}
async function apiKeyUpdateOptionsToCrud(type, options) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
        description: options.description,
        expires_at_millis: options.expiresAt == null ? options.expiresAt : options.expiresAt.getTime(),
        revoked: options.revoked
    });
}
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/contact-channels/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/contact-channels/index.ts
__turbopack_context__.s([
    "contactChannelCreateOptionsToCrud",
    ()=>contactChannelCreateOptionsToCrud,
    "contactChannelUpdateOptionsToCrud",
    ()=>contactChannelUpdateOptionsToCrud,
    "serverContactChannelCreateOptionsToCrud",
    ()=>serverContactChannelCreateOptionsToCrud,
    "serverContactChannelUpdateOptionsToCrud",
    ()=>serverContactChannelUpdateOptionsToCrud
]);
function contactChannelCreateOptionsToCrud(userId, options) {
    return {
        value: options.value,
        type: options.type,
        used_for_auth: options.usedForAuth,
        is_primary: options.isPrimary,
        user_id: userId
    };
}
function contactChannelUpdateOptionsToCrud(options) {
    return {
        value: options.value,
        used_for_auth: options.usedForAuth,
        is_primary: options.isPrimary
    };
}
function serverContactChannelUpdateOptionsToCrud(options) {
    return {
        value: options.value,
        is_verified: options.isVerified,
        used_for_auth: options.usedForAuth,
        is_primary: options.isPrimary
    };
}
function serverContactChannelCreateOptionsToCrud(userId, options) {
    return {
        type: options.type,
        value: options.value,
        is_verified: options.isVerified,
        user_id: userId,
        used_for_auth: options.usedForAuth,
        is_primary: options.isPrimary
    };
}
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/teams/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/teams/index.ts
__turbopack_context__.s([
    "serverTeamCreateOptionsToCrud",
    ()=>serverTeamCreateOptionsToCrud,
    "serverTeamUpdateOptionsToCrud",
    ()=>serverTeamUpdateOptionsToCrud,
    "teamCreateOptionsToCrud",
    ()=>teamCreateOptionsToCrud,
    "teamUpdateOptionsToCrud",
    ()=>teamUpdateOptionsToCrud
]);
function teamUpdateOptionsToCrud(options) {
    return {
        display_name: options.displayName,
        profile_image_url: options.profileImageUrl,
        client_metadata: options.clientMetadata
    };
}
function teamCreateOptionsToCrud(options, creatorUserId) {
    return {
        display_name: options.displayName,
        profile_image_url: options.profileImageUrl,
        creator_user_id: creatorUserId
    };
}
function serverTeamCreateOptionsToCrud(options) {
    return {
        display_name: options.displayName,
        profile_image_url: options.profileImageUrl,
        creator_user_id: options.creatorUserId
    };
}
function serverTeamUpdateOptionsToCrud(options) {
    return {
        display_name: options.displayName,
        profile_image_url: options.profileImageUrl,
        client_metadata: options.clientMetadata,
        client_read_only_metadata: options.clientReadOnlyMetadata,
        server_metadata: options.serverMetadata
    };
}
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/users/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/users/index.ts
__turbopack_context__.s([
    "attachUserDestructureGuard",
    ()=>attachUserDestructureGuard,
    "serverUserCreateOptionsToCrud",
    ()=>serverUserCreateOptionsToCrud,
    "serverUserUpdateOptionsToCrud",
    ()=>serverUserUpdateOptionsToCrud,
    "userUpdateOptionsToCrud",
    ()=>userUpdateOptionsToCrud
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/bytes.js [app-client] (ecmascript)");
;
var userGetterErrorMessage = "Stack Auth: useUser() already returns the user object. Use `const user = useUser()` (or `const user = await app.getUser()`) instead of destructuring it like `const { user } = ...`.";
function attachUserDestructureGuard(target) {
    const descriptor = Object.getOwnPropertyDescriptor(target, "user");
    if (descriptor?.get === guardGetter) {
        return;
    }
    Object.defineProperty(target, "user", {
        get: guardGetter,
        configurable: false,
        enumerable: false
    });
}
function guardGetter() {
    throw new Error(userGetterErrorMessage);
}
function userUpdateOptionsToCrud(options) {
    return {
        display_name: options.displayName,
        client_metadata: options.clientMetadata,
        selected_team_id: options.selectedTeamId,
        totp_secret_base64: options.totpMultiFactorSecret != null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase64"])(options.totpMultiFactorSecret) : options.totpMultiFactorSecret,
        profile_image_url: options.profileImageUrl,
        otp_auth_enabled: options.otpAuthEnabled,
        passkey_auth_enabled: options.passkeyAuthEnabled
    };
}
function serverUserUpdateOptionsToCrud(options) {
    return {
        display_name: options.displayName,
        primary_email: options.primaryEmail,
        client_metadata: options.clientMetadata,
        client_read_only_metadata: options.clientReadOnlyMetadata,
        server_metadata: options.serverMetadata,
        selected_team_id: options.selectedTeamId,
        primary_email_auth_enabled: options.primaryEmailAuthEnabled,
        primary_email_verified: options.primaryEmailVerified,
        password: options.password,
        profile_image_url: options.profileImageUrl,
        totp_secret_base64: options.totpMultiFactorSecret != null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase64"])(options.totpMultiFactorSecret) : options.totpMultiFactorSecret
    };
}
function serverUserCreateOptionsToCrud(options) {
    return {
        primary_email: options.primaryEmail,
        password: options.password,
        otp_auth_enabled: options.otpAuthEnabled,
        primary_email_auth_enabled: options.primaryEmailAuthEnabled,
        display_name: options.displayName,
        primary_email_verified: options.primaryEmailVerified,
        client_metadata: options.clientMetadata,
        client_read_only_metadata: options.clientReadOnlyMetadata,
        server_metadata: options.serverMetadata
    };
}
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/cookie.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/cookie.ts
__turbopack_context__.s([
    "consumeVerifierAndStateCookie",
    ()=>consumeVerifierAndStateCookie,
    "createBrowserCookieHelper",
    ()=>createBrowserCookieHelper,
    "createCookieHelper",
    ()=>createCookieHelper,
    "createPlaceholderCookieHelper",
    ()=>createPlaceholderCookieHelper,
    "deleteCookie",
    ()=>deleteCookie,
    "deleteCookieClient",
    ()=>deleteCookieClient,
    "getCookie",
    ()=>getCookie,
    "getCookieClient",
    ()=>getCookieClient,
    "saveVerifierAndState",
    ()=>saveVerifierAndState,
    "setCookie",
    ()=>setCookie,
    "setCookieClient",
    ()=>setCookieClient,
    "setOrDeleteCookie",
    ()=>setOrDeleteCookie,
    "setOrDeleteCookieClient",
    ()=>setOrDeleteCookieClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$sc$2f$dist$2f$index$2e$react$2d$server$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-sc/dist/index.react-server.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/env.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/js-cookie/dist/js.cookie.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/oauth4webapi/build/index.js [app-client] (ecmascript)");
;
;
;
;
;
function ensureClient() {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
        throw new Error("cookieClient functions can only be called in a browser environment, yet window is undefined");
    }
}
async function createPlaceholderCookieHelper() {
    function throwError() {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Throwing cookie helper is just a placeholder. This should never be called");
    }
    return {
        get: throwError,
        set: throwError,
        setOrDelete: throwError,
        delete: throwError
    };
}
async function createCookieHelper() {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
        return createBrowserCookieHelper();
    } else {
        return createNextCookieHelper(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$sc$2f$dist$2f$index$2e$react$2d$server$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cookies"])(), await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$sc$2f$dist$2f$index$2e$react$2d$server$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["headers"])());
    }
}
function createBrowserCookieHelper() {
    return {
        get: getCookieClient,
        set: setCookieClient,
        setOrDelete: setOrDeleteCookieClient,
        delete: deleteCookieClient
    };
}
function handleCookieError(e, options) {
    if (e instanceof Error && e.message.includes("Cookies can only be modified in")) {
        if (options.noOpIfServerComponent) {} else {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Attempted to set cookie in server component. Pass { noOpIfServerComponent: true } in the options of Stack's cookie functions if this is intentional and you want to ignore this error. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options");
        }
    } else {
        throw e;
    }
}
function createNextCookieHelper(rscCookiesAwaited, rscHeadersAwaited) {
    const cookieHelper = {
        get: (name)=>{
            try {
                rscCookiesAwaited.set("stack-is-https", "true", {
                    secure: true
                });
            } catch (e) {
                if (typeof e === "object" && e !== null && "message" in e && typeof e.message === "string" && e.message.includes("Cookies can only be modified in a Server Action or Route Handler")) {} else {
                    throw e;
                }
            }
            return rscCookiesAwaited.get(name)?.value ?? null;
        },
        set: (name, value, options)=>{
            let isSecureCookie = !!rscCookiesAwaited.get("stack-is-https");
            if (rscHeadersAwaited.get("x-forwarded-proto") === "https") {
                isSecureCookie = true;
            }
            try {
                rscCookiesAwaited.set(name, value, {
                    secure: isSecureCookie,
                    maxAge: options.maxAge
                });
            } catch (e) {
                handleCookieError(e, options);
            }
        },
        setOrDelete (name, value, options = {}) {
            if (value === null) {
                this.delete(name, options);
            } else {
                this.set(name, value, options);
            }
        },
        delete (name, options = {}) {
            try {
                rscCookiesAwaited.delete(name);
            } catch (e) {
                handleCookieError(e, options);
            }
        }
    };
    return cookieHelper;
}
function getCookieClient(name) {
    ensureClient();
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].set("stack-is-https", "true", {
        secure: true
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(name) ?? null;
}
async function getCookie(name) {
    const cookieHelper = await createCookieHelper();
    return cookieHelper.get(name);
}
function setOrDeleteCookieClient(name, value, options = {}) {
    ensureClient();
    if (value === null) {
        deleteCookieClient(name, options);
    } else {
        setCookieClient(name, value, options);
    }
}
async function setOrDeleteCookie(name, value, options = {}) {
    const cookieHelper = await createCookieHelper();
    cookieHelper.setOrDelete(name, value, options);
}
function deleteCookieClient(name, options = {}) {
    ensureClient();
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].remove(name);
}
async function deleteCookie(name, options = {}) {
    const cookieHelper = await createCookieHelper();
    cookieHelper.delete(name, options);
}
function setCookieClient(name, value, options = {}) {
    ensureClient();
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$js$2d$cookie$2f$dist$2f$js$2e$cookie$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].set(name, value, {
        expires: options.maxAge === void 0 ? void 0 : new Date(Date.now() + options.maxAge * 1e3)
    });
}
async function setCookie(name, value, options = {}) {
    const cookieHelper = await createCookieHelper();
    cookieHelper.set(name, value, options);
}
async function saveVerifierAndState() {
    const codeVerifier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomCodeVerifier"])();
    const codeChallenge = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculatePKCECodeChallenge"])(codeVerifier);
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomState"])();
    await setCookie("stack-oauth-outer-" + state, codeVerifier, {
        maxAge: 60 * 60
    });
    return {
        codeChallenge,
        state
    };
}
function consumeVerifierAndStateCookie(state) {
    ensureClient();
    const cookieName = "stack-oauth-outer-" + state;
    const codeVerifier = getCookieClient(cookieName);
    if (!codeVerifier) {
        return null;
    }
    deleteCookieClient(cookieName);
    return {
        codeVerifier
    };
}
;
 //# sourceMappingURL=cookie.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/auth.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/auth.ts
__turbopack_context__.s([
    "addNewOAuthProviderOrScope",
    ()=>addNewOAuthProviderOrScope,
    "callOAuthCallback",
    ()=>callOAuthCallback,
    "signInWithOAuth",
    ()=>signInWithOAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/url.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/cookie.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
async function signInWithOAuth(iface, options, session) {
    const { codeChallenge, state } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveVerifierAndState"])();
    const location = await iface.getOAuthUrl({
        provider: options.provider,
        redirectUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(options.redirectUrl, "redirectUrl"),
        errorRedirectUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(options.errorRedirectUrl, "errorRedirectUrl"),
        codeChallenge,
        state,
        type: "authenticate",
        providerScope: options.providerScope,
        session
    });
    window.location.assign(location);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["neverResolve"])();
}
async function addNewOAuthProviderOrScope(iface, options, session) {
    const { codeChallenge, state } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveVerifierAndState"])();
    const location = await iface.getOAuthUrl({
        provider: options.provider,
        redirectUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(options.redirectUrl, "redirectUrl"),
        errorRedirectUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(options.errorRedirectUrl, "errorRedirectUrl"),
        afterCallbackRedirectUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(window.location.href, "afterCallbackRedirectUrl"),
        codeChallenge,
        state,
        type: "link",
        session,
        providerScope: options.providerScope
    });
    window.location.assign(location);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["neverResolve"])();
}
function consumeOAuthCallbackQueryParams() {
    const requiredParams = [
        "code",
        "state"
    ];
    const originalUrl = new URL(window.location.href);
    for (const param of requiredParams){
        if (!originalUrl.searchParams.has(param)) {
            console.warn(new Error(`Missing required query parameter on OAuth callback: ${param}. Maybe you opened or reloaded the oauth-callback page from your history?`));
            return null;
        }
    }
    const expectedState = originalUrl.searchParams.get("state") ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("This should never happen; isn't state required above?");
    const cookieResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["consumeVerifierAndStateCookie"])(expectedState);
    if (!cookieResult) {
        console.warn(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      Stack found an outer OAuth callback state in the query parameters, but not in cookies.
      
      This could have multiple reasons:
        - The cookie expired, because the OAuth flow took too long.
        - The user's browser deleted the cookie, either manually or because of a very strict cookie policy.
        - The cookie was already consumed by this page, and the user already logged in.
        - You are using another OAuth client library with the same callback URL as Stack.
        - The user opened the OAuth callback page from their history.

      Either way, it is probably safe to ignore this warning unless you are debugging an OAuth issue.
    `);
        return null;
    }
    const newUrl = new URL(originalUrl);
    for (const param of requiredParams){
        newUrl.searchParams.delete(param);
    }
    window.history.replaceState({}, "", newUrl.toString());
    return {
        originalUrl,
        codeVerifier: cookieResult.codeVerifier,
        state: expectedState
    };
}
async function callOAuthCallback(iface, redirectUrl) {
    const consumed = consumeOAuthCallbackQueryParams();
    if (!consumed) return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await iface.callOAuthCallback({
            oauthParams: consumed.originalUrl.searchParams,
            redirectUri: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(redirectUrl, "redirectUri"),
            codeVerifier: consumed.codeVerifier,
            state: consumed.state
        }));
    } catch (e) {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownError"].isKnownError(e)) {
            throw e;
        }
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Error signing in during OAuth callback. Please try again.", {
            cause: e
        });
    }
}
;
 //# sourceMappingURL=auth.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/client-app-impl.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/apps/implementations/client-app-impl.ts
__turbopack_context__.s([
    "_StackClientAppImplIncomplete",
    ()=>_StackClientAppImplIncomplete
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$simplewebauthn$2f$browser$2f$dist$2f$bundle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@simplewebauthn/browser/dist/bundle/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$client$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/client-interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$sessions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/sessions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$compile$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/compile-time.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/env.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/maps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/stores.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/urls.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/uuids.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$cookie$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/cookie/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/url.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/auth.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/cookie.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/api-keys/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/common.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$contact$2d$channels$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/contact-channels/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$projects$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/projects/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$teams$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/teams/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/users/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/common.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$sc$2f$dist$2f$index$2e$default$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-sc/dist/index.default.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
var isReactServer2 = false;
isReactServer2 = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$sc$2f$dist$2f$index$2e$default$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isReactServer"];
var NextNavigation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$compile$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scrambleDuringCompileTime"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__);
var allClientApps = /* @__PURE__ */ new Map();
var __StackClientAppImplIncomplete = class __StackClientAppImplIncomplete {
    constructor(options, extraOptions){
        this._uniqueIdentifier = void 0;
        this.__DEMO_ENABLE_SLIGHT_FETCH_DELAY = false;
        this._ownedAdminApps = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DependenciesMap"]();
        this._currentUserCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            if (this.__DEMO_ENABLE_SLIGHT_FETCH_DELAY) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["wait"])(2e3);
            }
            if (session.isKnownToBeInvalid()) {
                return null;
            }
            return await this._interface.getClientUserByToken(session);
        });
        this._currentProjectCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._interface.getClientProject());
        });
        this._ownedProjectsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            return await this._interface.listProjects(session);
        });
        this._currentUserPermissionsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [teamId, recursive])=>{
            return await this._interface.listCurrentUserTeamPermissions({
                teamId,
                recursive
            }, session);
        });
        this._currentUserProjectPermissionsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [recursive])=>{
            return await this._interface.listCurrentUserProjectPermissions({
                recursive
            }, session);
        });
        this._currentUserTeamsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            return await this._interface.listCurrentUserTeams(session);
        });
        this._currentUserOAuthConnectionAccessTokensCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [providerId, scope])=>{
            try {
                const result = await this._interface.createProviderAccessToken(providerId, scope || "", session);
                return {
                    accessToken: result.access_token
                };
            } catch (err) {
                if (!(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].OAuthConnectionDoesNotHaveRequiredScope.isInstance(err) || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].OAuthConnectionNotConnectedToUser.isInstance(err))) {
                    throw err;
                }
            }
            return null;
        });
        this._currentUserOAuthConnectionCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [providerId, scope, redirect])=>{
            return await this._getUserOAuthConnectionCacheFn({
                getUser: async ()=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._currentUserCache.getOrWait([
                        session
                    ], "write-only")),
                getOrWaitOAuthToken: async ()=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._currentUserOAuthConnectionAccessTokensCache.getOrWait([
                        session,
                        providerId,
                        scope || ""
                    ], "write-only")),
                useOAuthToken: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._currentUserOAuthConnectionAccessTokensCache, [
                        session,
                        providerId,
                        scope || ""
                    ], "connection.useAccessToken()"),
                providerId,
                scope,
                redirect,
                session
            });
        });
        this._teamMemberProfilesCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [teamId])=>{
            return await this._interface.listTeamMemberProfiles({
                teamId
            }, session);
        });
        this._teamInvitationsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [teamId])=>{
            return await this._interface.listTeamInvitations({
                teamId
            }, session);
        });
        this._currentUserTeamProfileCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [teamId])=>{
            return await this._interface.getTeamMemberProfile({
                teamId,
                userId: "me"
            }, session);
        });
        this._clientContactChannelsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            return await this._interface.listClientContactChannels(session);
        });
        this._userApiKeysCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            const results = await this._interface.listProjectApiKeys({
                user_id: "me"
            }, session, "client");
            return results;
        });
        this._teamApiKeysCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [teamId])=>{
            const results = await this._interface.listProjectApiKeys({
                team_id: teamId
            }, session, "client");
            return results;
        });
        this._notificationCategoriesCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            const results = await this._interface.listNotificationCategories(session);
            return results;
        });
        this._currentUserOAuthProvidersCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            return await this._interface.listOAuthProviders({
                user_id: "me"
            }, session);
        });
        this._userItemCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [userId, itemId])=>{
            return await this._interface.getItem({
                userId,
                itemId
            }, session);
        });
        this._teamItemCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [teamId, itemId])=>{
            return await this._interface.getItem({
                teamId,
                itemId
            }, session);
        });
        this._customItemCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [customCustomerId, itemId])=>{
            return await this._interface.getItem({
                customCustomerId,
                itemId
            }, session);
        });
        this._userProductsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [userId, cursor, limit])=>{
            return await this._interface.listProducts({
                customer_type: "user",
                customer_id: userId,
                cursor: cursor ?? void 0,
                limit: limit ?? void 0
            }, session);
        });
        this._teamProductsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [teamId, cursor, limit])=>{
            return await this._interface.listProducts({
                customer_type: "team",
                customer_id: teamId,
                cursor: cursor ?? void 0,
                limit: limit ?? void 0
            }, session);
        });
        this._customProductsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session, [customCustomerId, cursor, limit])=>{
            return await this._interface.listProducts({
                customer_type: "custom",
                customer_id: customCustomerId,
                cursor: cursor ?? void 0,
                limit: limit ?? void 0
            }, session);
        });
        this._convexPartialUserCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([ctx])=>await this._getPartialUserFromConvex(ctx));
        this._anonymousSignUpInProgress = null;
        this._memoryTokenStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEmptyTokenStore"])();
        this._nextServerCookiesTokenStores = /* @__PURE__ */ new WeakMap();
        this._requestTokenStores = /* @__PURE__ */ new WeakMap();
        this._storedBrowserCookieTokenStore = null;
        /**
     * A map from token stores and session keys to sessions.
     *
     * This isn't just a map from session keys to sessions for two reasons:
     *
     * - So we can garbage-collect Session objects when the token store is garbage-collected
     * - So different token stores are separated and don't leak information between each other, eg. if the same user sends two requests to the same server they should get a different session object
     */ this._sessionsByTokenStoreAndSessionKey = /* @__PURE__ */ new WeakMap();
        const resolvedOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveConstructorOptions"])(options);
        if (!__StackClientAppImplIncomplete.LazyStackAdminAppImpl.value) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Admin app implementation not initialized. Did you import the _StackClientApp from stack-app/apps/implementations/index.ts? You can't import it directly from ./apps/implementations/client-app-impl.ts as that causes a circular dependency (see the comment at _LazyStackAdminAppImpl for more details).");
        }
        this._options = resolvedOptions;
        this._extraOptions = extraOptions;
        if (extraOptions && extraOptions.interface) {
            this._interface = extraOptions.interface;
        } else {
            this._interface = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$client$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackClientInterface"]({
                getBaseUrl: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBaseUrl"])(resolvedOptions.baseUrl),
                extraRequestHeaders: resolvedOptions.extraRequestHeaders ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultExtraRequestHeaders"])(),
                projectId: resolvedOptions.projectId ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultProjectId"])(),
                clientVersion: __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientVersion"],
                publishableClientKey: resolvedOptions.publishableClientKey ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultPublishableClientKey"])(),
                prepareRequest: async ()=>{
                    await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$sc$2f$dist$2f$index$2e$default$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cookies"]?.();
                }
            });
        }
        this._tokenStoreInit = resolvedOptions.tokenStore;
        this._redirectMethod = resolvedOptions.redirectMethod || "none";
        this._redirectMethod = resolvedOptions.redirectMethod || "nextjs";
        this._urlOptions = resolvedOptions.urls ?? {};
        this._oauthScopesOnSignIn = resolvedOptions.oauthScopesOnSignIn ?? {};
        if (extraOptions && extraOptions.uniqueIdentifier) {
            this._uniqueIdentifier = extraOptions.uniqueIdentifier;
            this._initUniqueIdentifier();
        }
    }
    async _createCookieHelper() {
        if (this._tokenStoreInit === "nextjs-cookie" || this._tokenStoreInit === "cookie") {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCookieHelper"])();
        } else {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPlaceholderCookieHelper"])();
        }
    }
    async _getUserOAuthConnectionCacheFn(options) {
        const user = await options.getUser();
        let hasConnection = true;
        if (!user || !user.oauth_providers.find((p)=>p.id === options.providerId)) {
            hasConnection = false;
        }
        const token = await options.getOrWaitOAuthToken();
        if (!token) {
            hasConnection = false;
        }
        if (!hasConnection && options.redirect) {
            if (!options.session) {
                throw new Error(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
          Cannot add new scopes to a user that is not a CurrentUser. Please ensure that you are calling this function on a CurrentUser object, or remove the 'or: redirect' option.

          Often, you can solve this by calling this function in the browser instead, or by removing the 'or: redirect' option and dealing with the case where the user doesn't have enough permissions.
        `);
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addNewOAuthProviderOrScope"])(this._interface, {
                provider: options.providerId,
                redirectUrl: this.urls.oauthCallback,
                errorRedirectUrl: this.urls.error,
                providerScope: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeScopeStrings"])(options.scope || "", (this._oauthScopesOnSignIn[options.providerId] ?? []).join(" "))
            }, options.session);
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["neverResolve"])();
        } else if (!hasConnection) {
            return null;
        }
        return {
            id: options.providerId,
            async getAccessToken () {
                const result = await options.getOrWaitOAuthToken();
                if (!result) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("No access token available");
                }
                return result;
            },
            useAccessToken () {
                const result = options.useOAuthToken();
                if (!result) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("No access token available");
                }
                return result;
            }
        };
    }
    _initUniqueIdentifier() {
        if (!this._uniqueIdentifier) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Unique identifier not initialized");
        }
        if (allClientApps.has(this._uniqueIdentifier)) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("A Stack client app with the same unique identifier already exists");
        }
        allClientApps.set(this._uniqueIdentifier, [
            this._extraOptions?.checkString ?? void 0,
            this
        ]);
    }
    /**
   * Cloudflare workers does not allow use of randomness on the global scope (on which the Stack app is probably
   * initialized). For that reason, we generate the unique identifier lazily when it is first needed instead of in the
   * constructor.
   */ _getUniqueIdentifier() {
        if (!this._uniqueIdentifier) {
            this._uniqueIdentifier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateUuid"])();
            this._initUniqueIdentifier();
        }
        return this._uniqueIdentifier;
    }
    async _checkFeatureSupport(name, options) {
        return await this._interface.checkFeatureSupport({
            ...options,
            name
        });
    }
    _useCheckFeatureSupport(name, options) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(this._checkFeatureSupport(name, options));
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`${name} is not currently supported. Please reach out to Stack support for more information.`);
    }
    get _refreshTokenCookieName() {
        return `stack-refresh-${this.projectId}`;
    }
    _getTokensFromCookies(cookies2) {
        const refreshToken = cookies2.refreshTokenCookie;
        const accessTokenObject = cookies2.accessTokenCookie?.startsWith('["') ? JSON.parse(cookies2.accessTokenCookie) : null;
        const accessToken = accessTokenObject && refreshToken === accessTokenObject[0] ? accessTokenObject[1] : null;
        return {
            refreshToken,
            accessToken
        };
    }
    get _accessTokenCookieName() {
        return `stack-access`;
    }
    _getBrowserCookieTokenStore() {
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
            throw new Error("Cannot use cookie token store on the server!");
        }
        if (this._storedBrowserCookieTokenStore === null) {
            const getCurrentValue = (old)=>{
                const tokens = this._getTokensFromCookies({
                    refreshTokenCookie: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCookieClient"])(this._refreshTokenCookieName) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCookieClient"])("stack-refresh"),
                    // keep old cookie name for backwards-compatibility
                    accessTokenCookie: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCookieClient"])(this._accessTokenCookieName)
                });
                return {
                    refreshToken: tokens.refreshToken,
                    accessToken: tokens.accessToken ?? (old?.refreshToken === tokens.refreshToken ? old.accessToken : null)
                };
            };
            this._storedBrowserCookieTokenStore = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Store"](getCurrentValue(null));
            let hasSucceededInWriting = true;
            setInterval(()=>{
                if (hasSucceededInWriting) {
                    const oldValue = this._storedBrowserCookieTokenStore.get();
                    const currentValue = getCurrentValue(oldValue);
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deepPlainEquals"])(currentValue, oldValue)) {
                        this._storedBrowserCookieTokenStore.set(currentValue);
                    }
                }
            }, 100);
            this._storedBrowserCookieTokenStore.onChange((value)=>{
                try {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setOrDeleteCookieClient"])(this._refreshTokenCookieName, value.refreshToken, {
                        maxAge: 60 * 60 * 24 * 365
                    });
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setOrDeleteCookieClient"])(this._accessTokenCookieName, value.accessToken ? JSON.stringify([
                        value.refreshToken,
                        value.accessToken
                    ]) : null, {
                        maxAge: 60 * 60 * 24
                    });
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteCookieClient"])("stack-refresh");
                    hasSucceededInWriting = true;
                } catch (e) {
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
                        hasSucceededInWriting = false;
                    } else {
                        throw e;
                    }
                }
            });
        }
        return this._storedBrowserCookieTokenStore;
    }
    _getOrCreateTokenStore(cookieHelper, overrideTokenStoreInit) {
        const tokenStoreInit = overrideTokenStoreInit === void 0 ? this._tokenStoreInit : overrideTokenStoreInit;
        switch(tokenStoreInit){
            case "cookie":
                {
                    return this._getBrowserCookieTokenStore();
                }
            case "nextjs-cookie":
                {
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
                        return this._getBrowserCookieTokenStore();
                    } else {
                        const tokens = this._getTokensFromCookies({
                            refreshTokenCookie: cookieHelper.get(this._refreshTokenCookieName) ?? cookieHelper.get("stack-refresh"),
                            // keep old cookie name for backwards-compatibility
                            accessTokenCookie: cookieHelper.get(this._accessTokenCookieName)
                        });
                        const store = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Store"](tokens);
                        store.onChange((value)=>{
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(async ()=>{
                                await Promise.all([
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setOrDeleteCookie"])(this._refreshTokenCookieName, value.refreshToken, {
                                        maxAge: 60 * 60 * 24 * 365,
                                        noOpIfServerComponent: true
                                    }),
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setOrDeleteCookie"])(this._accessTokenCookieName, value.accessToken ? JSON.stringify([
                                        value.refreshToken,
                                        value.accessToken
                                    ]) : null, {
                                        maxAge: 60 * 60 * 24,
                                        noOpIfServerComponent: true
                                    })
                                ]);
                            });
                        });
                        return store;
                    }
                }
            case "memory":
                {
                    return this._memoryTokenStore;
                }
            default:
                {
                    if (tokenStoreInit === null) {
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEmptyTokenStore"])();
                    } else if (typeof tokenStoreInit === "object" && "headers" in tokenStoreInit) {
                        if (this._requestTokenStores.has(tokenStoreInit)) return this._requestTokenStores.get(tokenStoreInit);
                        const stackAuthHeader = tokenStoreInit.headers.get("x-stack-auth");
                        if (stackAuthHeader) {
                            let parsed2;
                            try {
                                parsed2 = JSON.parse(stackAuthHeader);
                                if (typeof parsed2 !== "object") throw new Error("x-stack-auth header must be a JSON object");
                                if (parsed2 === null) throw new Error("x-stack-auth header must not be null");
                            } catch (e) {
                                throw new Error(`Invalid x-stack-auth header: ${stackAuthHeader}`, {
                                    cause: e
                                });
                            }
                            return this._getOrCreateTokenStore(cookieHelper, {
                                accessToken: parsed2.accessToken ?? null,
                                refreshToken: parsed2.refreshToken ?? null
                            });
                        }
                        const cookieHeader = tokenStoreInit.headers.get("cookie");
                        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$cookie$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parse"](cookieHeader || "");
                        const res = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Store"]({
                            refreshToken: parsed[this._refreshTokenCookieName] || parsed["stack-refresh"] || null,
                            // keep old cookie name for backwards-compatibility
                            accessToken: parsed[this._accessTokenCookieName] || null
                        });
                        this._requestTokenStores.set(tokenStoreInit, res);
                        return res;
                    } else if ("accessToken" in tokenStoreInit || "refreshToken" in tokenStoreInit) {
                        return new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Store"]({
                            refreshToken: tokenStoreInit.refreshToken,
                            accessToken: tokenStoreInit.accessToken
                        });
                    }
                    throw new Error(`Invalid token store ${tokenStoreInit}`);
                }
        }
    }
    _useTokenStore(overrideTokenStoreInit) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["suspendIfSsr"])();
        const cookieHelper = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserCookieHelper"])();
        const tokenStore = this._getOrCreateTokenStore(cookieHelper, overrideTokenStoreInit);
        return tokenStore;
    }
    _getSessionFromTokenStore(tokenStore) {
        const tokenObj = tokenStore.get();
        const sessionKey = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$sessions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InternalSession"].calculateSessionKey(tokenObj);
        const existing = sessionKey ? this._sessionsByTokenStoreAndSessionKey.get(tokenStore)?.get(sessionKey) : null;
        if (existing) return existing;
        const session = this._interface.createSession({
            refreshToken: tokenObj.refreshToken,
            accessToken: tokenObj.accessToken
        });
        session.onAccessTokenChange((newAccessToken)=>{
            tokenStore.update((old)=>({
                    ...old,
                    accessToken: newAccessToken?.token ?? null
                }));
        });
        session.onInvalidate(()=>{
            tokenStore.update((old)=>({
                    ...old,
                    accessToken: null,
                    refreshToken: null
                }));
        });
        let sessionsBySessionKey = this._sessionsByTokenStoreAndSessionKey.get(tokenStore) ?? /* @__PURE__ */ new Map();
        this._sessionsByTokenStoreAndSessionKey.set(tokenStore, sessionsBySessionKey);
        sessionsBySessionKey.set(sessionKey, session);
        return session;
    }
    async _getSession(overrideTokenStoreInit) {
        const tokenStore = this._getOrCreateTokenStore(await this._createCookieHelper(), overrideTokenStoreInit);
        const session = this._getSessionFromTokenStore(tokenStore);
        return session;
    }
    _useSession(overrideTokenStoreInit) {
        const tokenStore = this._useTokenStore(overrideTokenStoreInit);
        const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
            "useCallback[subscribe]": (cb)=>{
                const { unsubscribe } = tokenStore.onChange({
                    "useCallback[subscribe]": ()=>{
                        cb();
                    }
                }["useCallback[subscribe]"]);
                return unsubscribe;
            }
        }["useCallback[subscribe]"], [
            tokenStore
        ]);
        const getSnapshot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
            "useCallback[getSnapshot]": ()=>this._getSessionFromTokenStore(tokenStore)
        }["useCallback[getSnapshot]"], [
            tokenStore
        ]);
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    }
    async _signInToAccountWithTokens(tokens) {
        if (!("accessToken" in tokens) || !("refreshToken" in tokens)) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid tokens object; can't sign in with this", {
                tokens
            });
        }
        const tokenStore = this._getOrCreateTokenStore(await this._createCookieHelper());
        tokenStore.set(tokens);
    }
    _hasPersistentTokenStore(overrideTokenStoreInit) {
        return (overrideTokenStoreInit !== void 0 ? overrideTokenStoreInit : this._tokenStoreInit) !== null;
    }
    _ensurePersistentTokenStore(overrideTokenStoreInit) {
        if (!this._hasPersistentTokenStore(overrideTokenStoreInit)) {
            throw new Error("Cannot call this function on a Stack app without a persistent token store. Make sure the tokenStore option on the constructor is set to a non-null value when initializing Stack.\n\nStack uses token stores to access access tokens of the current user. For example, on web frontends it is commonly the string value 'cookies' for cookie storage.");
        }
    }
    _isInternalProject() {
        return this.projectId === "internal";
    }
    _ensureInternalProject() {
        if (!this._isInternalProject()) {
            throw new Error("Cannot call this function on a Stack app with a project ID other than 'internal'.");
        }
    }
    _clientProjectFromCrud(crud) {
        return {
            id: crud.id,
            displayName: crud.display_name,
            config: {
                signUpEnabled: crud.config.sign_up_enabled,
                credentialEnabled: crud.config.credential_enabled,
                magicLinkEnabled: crud.config.magic_link_enabled,
                passkeyEnabled: crud.config.passkey_enabled,
                clientTeamCreationEnabled: crud.config.client_team_creation_enabled,
                clientUserDeletionEnabled: crud.config.client_user_deletion_enabled,
                allowTeamApiKeys: crud.config.allow_team_api_keys,
                allowUserApiKeys: crud.config.allow_user_api_keys,
                oauthProviders: crud.config.enabled_oauth_providers.map((p)=>({
                        id: p.id
                    }))
            }
        };
    }
    _clientPermissionFromCrud(crud) {
        return {
            id: crud.id
        };
    }
    _clientTeamUserFromCrud(crud) {
        return {
            id: crud.user_id,
            teamProfile: {
                displayName: crud.display_name,
                profileImageUrl: crud.profile_image_url
            }
        };
    }
    _clientTeamInvitationFromCrud(session, crud) {
        return {
            id: crud.id,
            recipientEmail: crud.recipient_email,
            expiresAt: new Date(crud.expires_at_millis),
            revoke: async ()=>{
                await this._interface.revokeTeamInvitation(crud.id, crud.team_id, session);
                await this._teamInvitationsCache.refresh([
                    session,
                    crud.team_id
                ]);
            }
        };
    }
    _baseApiKeyFromCrud(crud) {
        return {
            id: crud.id,
            description: crud.description,
            expiresAt: crud.expires_at_millis ? new Date(crud.expires_at_millis) : void 0,
            manuallyRevokedAt: crud.manually_revoked_at_millis ? new Date(crud.manually_revoked_at_millis) : null,
            createdAt: new Date(crud.created_at_millis),
            ...crud.type === "team" ? {
                type: "team",
                teamId: crud.team_id
            } : {
                type: "user",
                userId: crud.user_id
            },
            value: typeof crud.value === "string" ? crud.value : {
                lastFour: crud.value.last_four
            },
            isValid: function() {
                return this.whyInvalid() === null;
            },
            whyInvalid: function() {
                if (this.manuallyRevokedAt) {
                    return "manually-revoked";
                }
                if (this.expiresAt && this.expiresAt < /* @__PURE__ */ new Date()) {
                    return "expired";
                }
                return null;
            }
        };
    }
    _clientApiKeyFromCrud(session, crud) {
        return {
            ...this._baseApiKeyFromCrud(crud),
            async revoke () {
                await this.update({
                    revoked: true
                });
            },
            update: async (options)=>{
                await this._interface.updateProjectApiKey(crud.type === "team" ? {
                    team_id: crud.team_id
                } : {
                    user_id: crud.user_id
                }, crud.id, options, session, "client");
                if (crud.type === "team") {
                    await this._teamApiKeysCache.refresh([
                        session,
                        crud.team_id
                    ]);
                } else {
                    await this._userApiKeysCache.refresh([
                        session
                    ]);
                }
            }
        };
    }
    _clientTeamFromCrud(crud, session) {
        const app = this;
        return {
            id: crud.id,
            displayName: crud.display_name,
            profileImageUrl: crud.profile_image_url,
            clientMetadata: crud.client_metadata,
            clientReadOnlyMetadata: crud.client_read_only_metadata,
            ...this._createCustomer(crud.id, "team", session),
            async inviteUser (options) {
                await app._interface.sendTeamInvitation({
                    teamId: crud.id,
                    email: options.email,
                    session,
                    callbackUrl: options.callbackUrl ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(app.urls.teamInvitation, "callbackUrl")
                });
                await app._teamInvitationsCache.refresh([
                    session,
                    crud.id
                ]);
            },
            async listUsers () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._teamMemberProfilesCache.getOrWait([
                    session,
                    crud.id
                ], "write-only"));
                return result.map((crud2)=>app._clientTeamUserFromCrud(crud2));
            },
            useUsers () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._teamMemberProfilesCache, [
                    session,
                    crud.id
                ], "team.useUsers()");
                return result.map((crud2)=>app._clientTeamUserFromCrud(crud2));
            },
            async listInvitations () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._teamInvitationsCache.getOrWait([
                    session,
                    crud.id
                ], "write-only"));
                return result.map((crud2)=>app._clientTeamInvitationFromCrud(session, crud2));
            },
            useInvitations () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._teamInvitationsCache, [
                    session,
                    crud.id
                ], "team.useInvitations()");
                return result.map((crud2)=>app._clientTeamInvitationFromCrud(session, crud2));
            },
            async update (data) {
                await app._interface.updateTeam({
                    data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$teams$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["teamUpdateOptionsToCrud"])(data),
                    teamId: crud.id
                }, session);
                await app._currentUserTeamsCache.refresh([
                    session
                ]);
            },
            async delete () {
                await app._interface.deleteTeam(crud.id, session);
                await app._currentUserTeamsCache.refresh([
                    session
                ]);
            },
            useApiKeys () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._teamApiKeysCache, [
                    session,
                    crud.id
                ], "team.useApiKeys()");
                return result.map((crud2)=>app._clientApiKeyFromCrud(session, crud2));
            },
            async listApiKeys () {
                const results = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._teamApiKeysCache.getOrWait([
                    session,
                    crud.id
                ], "write-only"));
                return results.map((crud2)=>app._clientApiKeyFromCrud(session, crud2));
            },
            async createApiKey (options) {
                const result = await app._interface.createProjectApiKey(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiKeyCreationOptionsToCrud"])("team", crud.id, options), session, "client");
                await app._teamApiKeysCache.refresh([
                    session,
                    crud.id
                ]);
                return app._clientApiKeyFromCrud(session, result);
            }
        };
    }
    _clientContactChannelFromCrud(crud, session) {
        const app = this;
        return {
            id: crud.id,
            value: crud.value,
            type: crud.type,
            isVerified: crud.is_verified,
            isPrimary: crud.is_primary,
            usedForAuth: crud.used_for_auth,
            async sendVerificationEmail (options) {
                await app._interface.sendCurrentUserContactChannelVerificationEmail(crud.id, options?.callbackUrl || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(app.urls.emailVerification, "callbackUrl"), session);
            },
            async update (data) {
                await app._interface.updateClientContactChannel(crud.id, (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$contact$2d$channels$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["contactChannelUpdateOptionsToCrud"])(data), session);
                await app._clientContactChannelsCache.refresh([
                    session
                ]);
            },
            async delete () {
                await app._interface.deleteClientContactChannel(crud.id, session);
                await app._clientContactChannelsCache.refresh([
                    session
                ]);
            }
        };
    }
    _clientNotificationCategoryFromCrud(crud, session) {
        const app = this;
        return {
            id: crud.notification_category_id,
            name: crud.notification_category_name,
            enabled: crud.enabled,
            canDisable: crud.can_disable,
            async setEnabled (enabled) {
                await app._interface.setNotificationsEnabled(crud.notification_category_id, enabled, session);
                await app._notificationCategoriesCache.refresh([
                    session
                ]);
            }
        };
    }
    _clientOAuthProviderFromCrud(crud, session) {
        const app = this;
        return {
            id: crud.id,
            type: crud.type,
            userId: crud.user_id,
            email: crud.email,
            allowSignIn: crud.allow_sign_in,
            allowConnectedAccounts: crud.allow_connected_accounts,
            async update (data) {
                try {
                    await app._interface.updateOAuthProvider(crud.user_id, crud.id, {
                        allow_sign_in: data.allowSignIn,
                        allow_connected_accounts: data.allowConnectedAccounts
                    }, session);
                    await app._currentUserOAuthProvidersCache.refresh([
                        session
                    ]);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
                } catch (error) {
                    if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].OAuthProviderAccountIdAlreadyUsedForSignIn.isInstance(error)) {
                        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(error);
                    }
                    throw error;
                }
            },
            async delete () {
                await app._interface.deleteOAuthProvider(crud.user_id, crud.id, session);
                await app._currentUserOAuthProvidersCache.refresh([
                    session
                ]);
            }
        };
    }
    _clientItemFromCrud(crud) {
        const app = this;
        return {
            displayName: crud.display_name,
            quantity: crud.quantity,
            nonNegativeQuantity: Math.max(0, crud.quantity)
        };
    }
    _customerProductsFromResponse(response) {
        const products = response.items.map((item)=>({
                id: item.id,
                quantity: item.quantity,
                displayName: item.product.display_name,
                customerType: item.product.customer_type,
                isServerOnly: item.product.server_only,
                stackable: item.product.stackable
            }));
        return Object.assign(products, {
            nextCursor: response.pagination.next_cursor ?? null
        });
    }
    _createAuth(session) {
        const app = this;
        return {
            _internalSession: session,
            currentSession: {
                async getTokens () {
                    const tokens = await session.getOrFetchLikelyValidTokens(2e4);
                    return {
                        accessToken: tokens?.accessToken.token ?? null,
                        refreshToken: tokens?.refreshToken?.token ?? null
                    };
                }
            },
            async getAuthHeaders () {
                return {
                    "x-stack-auth": JSON.stringify(await this.getAuthJson())
                };
            },
            async getAuthJson () {
                const tokens = await this.currentSession.getTokens();
                return tokens;
            },
            async registerPasskey (options) {
                const hostname = (await app._getCurrentUrl())?.hostname;
                if (!hostname) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("hostname must be provided if the Stack App does not have a redirect method");
                }
                const initiationResult = await app._interface.initiatePasskeyRegistration({}, session);
                if (initiationResult.status !== "ok") {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyRegistrationFailed("Failed to get initiation options for passkey registration"));
                }
                const { options_json, code } = initiationResult.data;
                if (options_json.rp.id !== "THIS_VALUE_WILL_BE_REPLACED.example.com") {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Expected returned RP ID from server to equal sentinel, but found ${options_json.rp.id}`);
                }
                options_json.rp.id = hostname;
                let attResp;
                try {
                    attResp = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$simplewebauthn$2f$browser$2f$dist$2f$bundle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startRegistration"])({
                        optionsJSON: options_json
                    });
                } catch (error) {
                    if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$simplewebauthn$2f$browser$2f$dist$2f$bundle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebAuthnError"]) {
                        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyWebAuthnError(error.message, error.name));
                    } else {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureError"])("passkey-registration-failed", error);
                        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyRegistrationFailed("Failed to start passkey registration due to unknown error"));
                    }
                }
                const registrationResult = await app._interface.registerPasskey({
                    credential: attResp,
                    code
                }, session);
                await app._refreshUser(session);
                return registrationResult;
            },
            signOut (options) {
                return app._signOut(session, options);
            }
        };
    }
    _editableTeamProfileFromCrud(crud, session) {
        const app = this;
        return {
            displayName: crud.display_name,
            profileImageUrl: crud.profile_image_url,
            async update (update) {
                await app._interface.updateTeamMemberProfile({
                    teamId: crud.team_id,
                    userId: crud.user_id,
                    profile: {
                        display_name: update.displayName,
                        profile_image_url: update.profileImageUrl
                    }
                }, session);
                await app._currentUserTeamProfileCache.refresh([
                    session,
                    crud.team_id
                ]);
            }
        };
    }
    _createBaseUser(crud) {
        return {
            id: crud.id,
            displayName: crud.display_name,
            primaryEmail: crud.primary_email,
            primaryEmailVerified: crud.primary_email_verified,
            profileImageUrl: crud.profile_image_url,
            signedUpAt: new Date(crud.signed_up_at_millis),
            clientMetadata: crud.client_metadata,
            clientReadOnlyMetadata: crud.client_read_only_metadata,
            hasPassword: crud.has_password,
            emailAuthEnabled: crud.auth_with_email,
            otpAuthEnabled: crud.otp_auth_enabled,
            oauthProviders: crud.oauth_providers,
            passkeyAuthEnabled: crud.passkey_auth_enabled,
            isMultiFactorRequired: crud.requires_totp_mfa,
            isAnonymous: crud.is_anonymous,
            toClientJson () {
                return crud;
            }
        };
    }
    _createUserExtraFromCurrent(crud, session) {
        const app = this;
        async function getConnectedAccount(id, options) {
            const scopeString = options?.scopes?.join(" ");
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._currentUserOAuthConnectionCache.getOrWait([
                session,
                id,
                scopeString || "",
                options?.or === "redirect"
            ], "write-only"));
        }
        function useConnectedAccount(id, options) {
            const scopeString = options?.scopes?.join(" ");
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._currentUserOAuthConnectionCache, [
                session,
                id,
                scopeString || "",
                options?.or === "redirect"
            ], "user.useConnectedAccount()");
        }
        return {
            async getActiveSessions () {
                const sessions = await app._interface.listSessions(session);
                return sessions.items.map((crud2)=>app._clientSessionFromCrud(crud2));
            },
            async revokeSession (sessionId) {
                await app._interface.deleteSession(sessionId, session);
            },
            setDisplayName (displayName) {
                return this.update({
                    displayName
                });
            },
            setClientMetadata (metadata) {
                return this.update({
                    clientMetadata: metadata
                });
            },
            async setSelectedTeam (team) {
                await this.update({
                    selectedTeamId: team?.id ?? null
                });
            },
            getConnectedAccount,
            useConnectedAccount,
            // THIS_LINE_PLATFORM react-like
            async getTeam (teamId) {
                const teams = await this.listTeams();
                return teams.find((t)=>t.id === teamId) ?? null;
            },
            useTeam (teamId) {
                const teams = this.useTeams();
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
                    return teams.find((t)=>t.id === teamId) ?? null;
                }, [
                    teams,
                    teamId
                ]);
            },
            async listTeams () {
                const teams = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._currentUserTeamsCache.getOrWait([
                    session
                ], "write-only"));
                return teams.map((crud2)=>app._clientTeamFromCrud(crud2, session));
            },
            useTeams () {
                const teams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._currentUserTeamsCache, [
                    session
                ], "user.useTeams()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>teams.map((crud2)=>app._clientTeamFromCrud(crud2, session)), [
                    teams
                ]);
            },
            async createTeam (data) {
                const crud2 = await app._interface.createClientTeam((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$teams$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["teamCreateOptionsToCrud"])(data, "me"), session);
                await app._currentUserTeamsCache.refresh([
                    session
                ]);
                await this.update({
                    selectedTeamId: crud2.id
                });
                return app._clientTeamFromCrud(crud2, session);
            },
            async leaveTeam (team) {
                await app._interface.leaveTeam(team.id, session);
            },
            async listPermissions (scopeOrOptions, options) {
                if (scopeOrOptions && "id" in scopeOrOptions) {
                    const scope = scopeOrOptions;
                    const recursive = options?.recursive ?? true;
                    const permissions = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._currentUserPermissionsCache.getOrWait([
                        session,
                        scope.id,
                        recursive
                    ], "write-only"));
                    return permissions.map((crud2)=>app._clientPermissionFromCrud(crud2));
                } else {
                    const opts = scopeOrOptions;
                    const recursive = opts?.recursive ?? true;
                    const permissions = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._currentUserProjectPermissionsCache.getOrWait([
                        session,
                        recursive
                    ], "write-only"));
                    return permissions.map((crud2)=>app._clientPermissionFromCrud(crud2));
                }
            },
            usePermissions (scopeOrOptions, options) {
                if (scopeOrOptions && "id" in scopeOrOptions) {
                    const scope = scopeOrOptions;
                    const recursive = options?.recursive ?? true;
                    const permissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._currentUserPermissionsCache, [
                        session,
                        scope.id,
                        recursive
                    ], "user.usePermissions()");
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.map((crud2)=>app._clientPermissionFromCrud(crud2)), [
                        permissions
                    ]);
                } else {
                    const opts = scopeOrOptions;
                    const recursive = opts?.recursive ?? true;
                    const permissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._currentUserProjectPermissionsCache, [
                        session,
                        recursive
                    ], "user.usePermissions()");
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.map((crud2)=>app._clientPermissionFromCrud(crud2)), [
                        permissions
                    ]);
                }
            },
            usePermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string") {
                    const scope = scopeOrPermissionId;
                    const permissions = this.usePermissions(scope);
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.find((p)=>p.id === permissionId) ?? null, [
                        permissions,
                        permissionId
                    ]);
                } else {
                    const pid = scopeOrPermissionId;
                    const permissions = this.usePermissions();
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.find((p)=>p.id === pid) ?? null, [
                        permissions,
                        pid
                    ]);
                }
            },
            async getPermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string") {
                    const scope = scopeOrPermissionId;
                    const permissions = await this.listPermissions(scope);
                    return permissions.find((p)=>p.id === permissionId) ?? null;
                } else {
                    const pid = scopeOrPermissionId;
                    const permissions = await this.listPermissions();
                    return permissions.find((p)=>p.id === pid) ?? null;
                }
            },
            async hasPermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string") {
                    const scope = scopeOrPermissionId;
                    return await this.getPermission(scope, permissionId) !== null;
                } else {
                    const pid = scopeOrPermissionId;
                    return await this.getPermission(pid) !== null;
                }
            },
            async update (update) {
                return await app._updateClientUser(update, session);
            },
            async sendVerificationEmail (options) {
                if (!crud.primary_email) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("User does not have a primary email");
                }
                return await app._interface.sendVerificationEmail(crud.primary_email, options?.callbackUrl ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(app.urls.emailVerification, "callbackUrl"), session);
            },
            async updatePassword (options) {
                const result = await app._interface.updatePassword(options, session);
                await app._currentUserCache.refresh([
                    session
                ]);
                return result;
            },
            async setPassword (options) {
                const result = await app._interface.setPassword(options, session);
                await app._currentUserCache.refresh([
                    session
                ]);
                return result;
            },
            selectedTeam: crud.selected_team && this._clientTeamFromCrud(crud.selected_team, session),
            async getTeamProfile (team) {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._currentUserTeamProfileCache.getOrWait([
                    session,
                    team.id
                ], "write-only"));
                return app._editableTeamProfileFromCrud(result, session);
            },
            useTeamProfile (team) {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._currentUserTeamProfileCache, [
                    session,
                    team.id
                ], "user.useTeamProfile()");
                return app._editableTeamProfileFromCrud(result, session);
            },
            async delete () {
                await app._interface.deleteCurrentUser(session);
                session.markInvalid();
            },
            async listContactChannels () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._clientContactChannelsCache.getOrWait([
                    session
                ], "write-only"));
                return result.map((crud2)=>app._clientContactChannelFromCrud(crud2, session));
            },
            useContactChannels () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._clientContactChannelsCache, [
                    session
                ], "user.useContactChannels()");
                return result.map((crud2)=>app._clientContactChannelFromCrud(crud2, session));
            },
            async createContactChannel (data) {
                const crud2 = await app._interface.createClientContactChannel((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$contact$2d$channels$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["contactChannelCreateOptionsToCrud"])("me", data), session);
                await app._clientContactChannelsCache.refresh([
                    session
                ]);
                return app._clientContactChannelFromCrud(crud2, session);
            },
            useNotificationCategories () {
                const results = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._notificationCategoriesCache, [
                    session
                ], "user.useNotificationCategories()");
                return results.map((crud2)=>app._clientNotificationCategoryFromCrud(crud2, session));
            },
            async listNotificationCategories () {
                const results = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._notificationCategoriesCache.getOrWait([
                    session
                ], "write-only"));
                return results.map((crud2)=>app._clientNotificationCategoryFromCrud(crud2, session));
            },
            useApiKeys () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._userApiKeysCache, [
                    session
                ], "user.useApiKeys()");
                return result.map((crud2)=>app._clientApiKeyFromCrud(session, crud2));
            },
            async listApiKeys () {
                const results = await app._interface.listProjectApiKeys({
                    user_id: "me"
                }, session, "client");
                return results.map((crud2)=>app._clientApiKeyFromCrud(session, crud2));
            },
            async createApiKey (options) {
                const result = await app._interface.createProjectApiKey(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiKeyCreationOptionsToCrud"])("user", "me", options), session, "client");
                await app._userApiKeysCache.refresh([
                    session
                ]);
                return app._clientApiKeyFromCrud(session, result);
            },
            useOAuthProviders () {
                const results = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._currentUserOAuthProvidersCache, [
                    session
                ], "user.useOAuthProviders()");
                return results.map((crud2)=>app._clientOAuthProviderFromCrud(crud2, session));
            },
            async listOAuthProviders () {
                const results = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._currentUserOAuthProvidersCache.getOrWait([
                    session
                ], "write-only"));
                return results.map((crud2)=>app._clientOAuthProviderFromCrud(crud2, session));
            },
            useOAuthProvider (id) {
                const providers = this.useOAuthProviders();
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>providers.find((p)=>p.id === id) ?? null, [
                    providers,
                    id
                ]);
            },
            async getOAuthProvider (id) {
                const providers = await this.listOAuthProviders();
                return providers.find((p)=>p.id === id) ?? null;
            }
        };
    }
    _createInternalUserExtra(session) {
        const app = this;
        this._ensureInternalProject();
        return {
            createProject (newProject) {
                return app._createProject(session, newProject);
            },
            async transferProject (projectIdToTransfer, newTeamId) {
                await app._interface.transferProject(session, projectIdToTransfer, newTeamId);
                await app._refreshProject();
            },
            listOwnedProjects () {
                return app._listOwnedProjects(session);
            },
            useOwnedProjects () {
                return app._useOwnedProjects(session);
            }
        };
    }
    _createCustomer(userIdOrTeamId, type, session) {
        const app = this;
        const customerOptions = type === "user" ? {
            userId: userIdOrTeamId
        } : {
            teamId: userIdOrTeamId
        };
        return {
            async getItem (itemId) {
                return await app.getItem({
                    itemId,
                    ...customerOptions
                });
            },
            useItem (itemId) {
                return app.useItem({
                    itemId,
                    ...customerOptions
                });
            },
            async listProducts (options) {
                return await app.listProducts({
                    ...options,
                    ...customerOptions
                });
            },
            useProducts (options) {
                return app.useProducts({
                    ...options,
                    ...customerOptions
                });
            },
            async createCheckoutUrl (options) {
                return await app._interface.createCheckoutUrl(type, userIdOrTeamId, options.productId, session, options.returnUrl);
            }
        };
    }
    async getItem(options) {
        const session = await this._getSession();
        let crud;
        if ("userId" in options) {
            crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._userItemCache.getOrWait([
                session,
                options.userId,
                options.itemId
            ], "write-only"));
        } else if ("teamId" in options) {
            crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._teamItemCache.getOrWait([
                session,
                options.teamId,
                options.itemId
            ], "write-only"));
        } else {
            crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._customItemCache.getOrWait([
                session,
                options.customCustomerId,
                options.itemId
            ], "write-only"));
        }
        return this._clientItemFromCrud(crud);
    }
    useItem(options) {
        const session = this._useSession();
        const [cache, ownerId] = "userId" in options ? [
            this._userItemCache,
            options.userId
        ] : "teamId" in options ? [
            this._teamItemCache,
            options.teamId
        ] : [
            this._customItemCache,
            options.customCustomerId
        ];
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(cache, [
            session,
            ownerId,
            options.itemId
        ], "app.useItem()");
        return this._clientItemFromCrud(crud);
    }
    async listProducts(options) {
        const session = await this._getSession();
        if ("userId" in options) {
            const response2 = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._userProductsCache.getOrWait([
                session,
                options.userId,
                options.cursor ?? null,
                options.limit ?? null
            ], "write-only"));
            return this._customerProductsFromResponse(response2);
        } else if ("teamId" in options) {
            const response2 = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._teamProductsCache.getOrWait([
                session,
                options.teamId,
                options.cursor ?? null,
                options.limit ?? null
            ], "write-only"));
            return this._customerProductsFromResponse(response2);
        }
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._customProductsCache.getOrWait([
            session,
            options.customCustomerId,
            options.cursor ?? null,
            options.limit ?? null
        ], "write-only"));
        return this._customerProductsFromResponse(response);
    }
    useProducts(options) {
        const session = this._useSession();
        const cache = "userId" in options ? this._userProductsCache : "teamId" in options ? this._teamProductsCache : this._customProductsCache;
        const debugLabel = "clientApp.useProducts()";
        const customerId = "userId" in options ? options.userId : "teamId" in options ? options.teamId : options.customCustomerId;
        const response = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(cache, [
            session,
            customerId,
            options.cursor ?? null,
            options.limit ?? null
        ], debugLabel);
        return this._customerProductsFromResponse(response);
    }
    _currentUserFromCrud(crud, session) {
        const currentUser = {
            ...this._createBaseUser(crud),
            ...this._createAuth(session),
            ...this._createUserExtraFromCurrent(crud, session),
            ...this._isInternalProject() ? this._createInternalUserExtra(session) : {},
            ...this._createCustomer(crud.id, "user", session)
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attachUserDestructureGuard"])(currentUser);
        Object.freeze(currentUser);
        return currentUser;
    }
    _clientSessionFromCrud(crud) {
        return {
            id: crud.id,
            userId: crud.user_id,
            createdAt: new Date(crud.created_at),
            isImpersonation: crud.is_impersonation,
            lastUsedAt: crud.last_used_at ? new Date(crud.last_used_at) : void 0,
            isCurrentSession: crud.is_current_session ?? false,
            geoInfo: crud.last_used_at_end_user_ip_info
        };
    }
    _getOwnedAdminApp(forProjectId, session) {
        if (!this._ownedAdminApps.has([
            session,
            forProjectId
        ])) {
            this._ownedAdminApps.set([
                session,
                forProjectId
            ], new __StackClientAppImplIncomplete.LazyStackAdminAppImpl.value({
                baseUrl: this._interface.options.getBaseUrl(),
                projectId: forProjectId,
                tokenStore: null,
                projectOwnerSession: session,
                noAutomaticPrefetch: true
            }));
        }
        return this._ownedAdminApps.get([
            session,
            forProjectId
        ]);
    }
    get projectId() {
        return this._interface.projectId;
    }
    async _isTrusted(url) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isRelative"])(url);
    }
    get urls() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUrls"])(this._urlOptions);
    }
    async _getCurrentUrl() {
        if (this._redirectMethod === "none") {
            return null;
        }
        return new URL(window.location.href);
    }
    async _redirectTo(options) {
        if (this._redirectMethod === "none") {
            return;
        } else if (isReactServer2 && this._redirectMethod === "nextjs") {
            NextNavigation.redirect(options.url.toString(), options.replace ? NextNavigation.RedirectType.replace : NextNavigation.RedirectType.push);
        } else if (typeof this._redirectMethod === "object" && this._redirectMethod.navigate) {
            this._redirectMethod.navigate(options.url.toString());
        } else {
            if (options.replace) {
                window.location.replace(options.url);
            } else {
                window.location.assign(options.url);
            }
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["wait"])(2e3);
    }
    useNavigate() {
        if (typeof this._redirectMethod === "object") {
            return this._redirectMethod.useNavigate();
        } else if (this._redirectMethod === "window") {
            return (to)=>window.location.assign(to);
        } else if (this._redirectMethod === "nextjs") {
            const router = NextNavigation.useRouter();
            return (to)=>router.push(to);
        } else {
            return (to)=>{};
        }
    }
    async _redirectIfTrusted(url, options) {
        if (!await this._isTrusted(url)) {
            throw new Error(`Redirect URL ${url} is not trusted; should be relative.`);
        }
        return await this._redirectTo({
            url,
            ...options
        });
    }
    async _redirectToHandler(handlerName, options) {
        let url = this.urls[handlerName];
        if (!url) {
            throw new Error(`No URL for handler name ${handlerName}`);
        }
        if (!options?.noRedirectBack) {
            if (handlerName === "afterSignIn" || handlerName === "afterSignUp") {
                if (isReactServer2 || typeof window === "undefined") {} else {
                    const queryParams = new URLSearchParams(window.location.search);
                    url = queryParams.get("after_auth_return_to") || url;
                }
            } else if (handlerName === "signIn" || handlerName === "signUp") {
                if (isReactServer2 || typeof window === "undefined") {} else {
                    const currentUrl = new URL(window.location.href);
                    const nextUrl = new URL(url, currentUrl);
                    if (currentUrl.searchParams.has("after_auth_return_to")) {
                        nextUrl.searchParams.set("after_auth_return_to", currentUrl.searchParams.get("after_auth_return_to"));
                    } else if (currentUrl.protocol === nextUrl.protocol && currentUrl.host === nextUrl.host) {
                        nextUrl.searchParams.set("after_auth_return_to", (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRelativePart"])(currentUrl));
                    }
                    url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRelativePart"])(nextUrl);
                }
            }
        }
        await this._redirectIfTrusted(url, options);
    }
    async redirectToSignIn(options) {
        return await this._redirectToHandler("signIn", options);
    }
    async redirectToSignUp(options) {
        return await this._redirectToHandler("signUp", options);
    }
    async redirectToSignOut(options) {
        return await this._redirectToHandler("signOut", options);
    }
    async redirectToEmailVerification(options) {
        return await this._redirectToHandler("emailVerification", options);
    }
    async redirectToPasswordReset(options) {
        return await this._redirectToHandler("passwordReset", options);
    }
    async redirectToForgotPassword(options) {
        return await this._redirectToHandler("forgotPassword", options);
    }
    async redirectToHome(options) {
        return await this._redirectToHandler("home", options);
    }
    async redirectToOAuthCallback(options) {
        return await this._redirectToHandler("oauthCallback", options);
    }
    async redirectToMagicLinkCallback(options) {
        return await this._redirectToHandler("magicLinkCallback", options);
    }
    async redirectToAfterSignIn(options) {
        return await this._redirectToHandler("afterSignIn", options);
    }
    async redirectToAfterSignUp(options) {
        return await this._redirectToHandler("afterSignUp", options);
    }
    async redirectToAfterSignOut(options) {
        return await this._redirectToHandler("afterSignOut", options);
    }
    async redirectToAccountSettings(options) {
        return await this._redirectToHandler("accountSettings", options);
    }
    async redirectToError(options) {
        return await this._redirectToHandler("error", options);
    }
    async redirectToTeamInvitation(options) {
        return await this._redirectToHandler("teamInvitation", options);
    }
    async redirectToMfa(options) {
        return await this._redirectToHandler("mfa", options);
    }
    async sendForgotPasswordEmail(email, options) {
        return await this._interface.sendForgotPasswordEmail(email, options?.callbackUrl ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(this.urls.passwordReset, "callbackUrl"));
    }
    async sendMagicLinkEmail(email, options) {
        return await this._interface.sendMagicLinkEmail(email, options?.callbackUrl ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(this.urls.magicLinkCallback, "callbackUrl"));
    }
    async resetPassword(options) {
        return await this._interface.resetPassword(options);
    }
    async verifyPasswordResetCode(code) {
        return await this._interface.verifyPasswordResetCode(code);
    }
    async verifyTeamInvitationCode(code) {
        return await this._interface.acceptTeamInvitation({
            type: "check",
            code,
            session: await this._getSession()
        });
    }
    async acceptTeamInvitation(code) {
        const result = await this._interface.acceptTeamInvitation({
            type: "use",
            code,
            session: await this._getSession()
        });
        if (result.status === "ok") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(result.error);
        }
    }
    async getTeamInvitationDetails(code) {
        const result = await this._interface.acceptTeamInvitation({
            type: "details",
            code,
            session: await this._getSession()
        });
        if (result.status === "ok") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok({
                teamDisplayName: result.data.team_display_name
            });
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(result.error);
        }
    }
    async verifyEmail(code) {
        const result = await this._interface.verifyEmail(code);
        await this._currentUserCache.refresh([
            await this._getSession()
        ]);
        await this._clientContactChannelsCache.refresh([
            await this._getSession()
        ]);
        return result;
    }
    async getUser(options) {
        this._ensurePersistentTokenStore(options?.tokenStore);
        const session = await this._getSession(options?.tokenStore);
        let crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._currentUserCache.getOrWait([
            session
        ], "write-only"));
        if (crud?.is_anonymous && options?.or !== "anonymous" && options?.or !== "anonymous-if-exists[deprecated]") {
            crud = null;
        }
        if (crud === null) {
            switch(options?.or){
                case "redirect":
                    {
                        await this.redirectToSignIn({
                            replace: true
                        });
                        break;
                    }
                case "throw":
                    {
                        throw new Error("User is not signed in but getUser was called with { or: 'throw' }");
                    }
                case "anonymous":
                    {
                        const tokens = await this._signUpAnonymously();
                        return await this.getUser({
                            tokenStore: tokens,
                            or: "anonymous-if-exists[deprecated]"
                        }) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Something went wrong while signing up anonymously");
                    }
                case void 0:
                case "anonymous-if-exists[deprecated]":
                case "return-null":
                    {
                        return null;
                    }
            }
        }
        return crud && this._currentUserFromCrud(crud, session);
    }
    useUser(options) {
        this._ensurePersistentTokenStore(options?.tokenStore);
        const session = this._useSession(options?.tokenStore);
        let crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._currentUserCache, [
            session
        ], "clientApp.useUser()");
        if (crud?.is_anonymous && options?.or !== "anonymous" && options?.or !== "anonymous-if-exists[deprecated]") {
            crud = null;
        }
        if (crud === null) {
            switch(options?.or){
                case "redirect":
                    {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(this.redirectToSignIn({
                            replace: true
                        }));
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["suspend"])();
                        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("suspend should never return");
                    }
                case "throw":
                    {
                        throw new Error("User is not signed in but useUser was called with { or: 'throw' }");
                    }
                case "anonymous":
                    {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(async ()=>{
                            await this._signUpAnonymously();
                            if (typeof window !== "undefined") {
                                window.location.reload();
                            }
                        });
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["suspend"])();
                        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("suspend should never return");
                    }
                case void 0:
                case "anonymous-if-exists[deprecated]":
                case "return-null":
                    {}
            }
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud && this._currentUserFromCrud(crud, session);
        }, [
            crud,
            session,
            options?.or
        ]);
    }
    _getTokenPartialUserFromSession(session, options) {
        const accessToken = session.getAccessTokenIfNotExpiredYet(0);
        if (!accessToken) {
            return null;
        }
        const isAnonymous = accessToken.payload.is_anonymous;
        if (isAnonymous && options.or !== "anonymous") {
            return null;
        }
        return {
            id: accessToken.payload.sub,
            primaryEmail: accessToken.payload.email,
            displayName: accessToken.payload.name,
            primaryEmailVerified: accessToken.payload.email_verified,
            isAnonymous
        };
    }
    async _getPartialUserFromConvex(ctx) {
        const auth = await ctx.auth.getUserIdentity();
        if (!auth) {
            return null;
        }
        return {
            id: auth.subject,
            displayName: auth.name ?? null,
            primaryEmail: auth.email ?? null,
            primaryEmailVerified: auth.email_verified,
            isAnonymous: auth.is_anonymous
        };
    }
    async getPartialUser(options) {
        switch(options.from){
            case "token":
                {
                    this._ensurePersistentTokenStore(options.tokenStore ?? this._tokenStoreInit);
                    const session = await this._getSession(options.tokenStore);
                    return this._getTokenPartialUserFromSession(session, options);
                }
            case "convex":
                {
                    return await this._getPartialUserFromConvex(options.ctx);
                }
            default:
                {
                    throw new Error(`Invalid 'from' option: ${options.from}`);
                }
        }
    }
    usePartialUser(options) {
        switch(options.from){
            case "token":
                {
                    this._ensurePersistentTokenStore(options.tokenStore ?? this._tokenStoreInit);
                    const session = this._useSession(options.tokenStore);
                    return this._getTokenPartialUserFromSession(session, options);
                }
            case "convex":
                {
                    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._convexPartialUserCache, [
                        options.ctx
                    ], "clientApp.usePartialUser()");
                    return result;
                }
            default:
                {
                    throw new Error(`Invalid 'from' option: ${options.from}`);
                }
        }
    }
    getConvexClientAuth(options) {
        return async (args)=>{
            const session = await this._getSession(options.tokenStore ?? this._tokenStoreInit);
            if (!args.forceRefreshToken) {
                const tokens2 = await session.getOrFetchLikelyValidTokens(2e4);
                return tokens2?.accessToken.token ?? null;
            }
            const tokens = await session.fetchNewTokens();
            return tokens?.accessToken.token ?? null;
        };
    }
    async getConvexHttpClientAuth(options) {
        const session = await this._getSession(options.tokenStore);
        const tokens = await session.getOrFetchLikelyValidTokens(2e4);
        return tokens?.accessToken.token ?? "";
    }
    async _updateClientUser(update, session) {
        const res = await this._interface.updateClientUser((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["userUpdateOptionsToCrud"])(update), session);
        await this._refreshUser(session);
        return res;
    }
    async signInWithOAuth(provider, options) {
        if (typeof window === "undefined") {
            throw new Error("signInWithOAuth can currently only be called in a browser environment");
        }
        this._ensurePersistentTokenStore();
        const session = await this._getSession();
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signInWithOAuth"])(this._interface, {
            provider,
            redirectUrl: options?.returnTo ?? this.urls.oauthCallback,
            errorRedirectUrl: this.urls.error,
            providerScope: this._oauthScopesOnSignIn[provider]?.join(" ")
        }, session);
    }
    /**
   * Handles MFA verification by redirecting to the OTP page
   */ async _experimentalMfa(error, session) {
        if (typeof window !== "undefined") {
            window.sessionStorage.setItem("stack_mfa_attempt_code", error.details?.attempt_code ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("attempt code missing"));
        }
        await this.redirectToMfa();
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("we should have redirected in redirectToMfa()");
    }
    /**
   * @deprecated
   * TODO remove
   */ async _catchMfaRequiredError(callback) {
        try {
            return await callback();
        } catch (e) {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].MultiFactorAuthenticationRequired.isInstance(e)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await this._experimentalMfa(e, await this._getSession()));
            }
            throw e;
        }
    }
    async signInWithCredential(options) {
        this._ensurePersistentTokenStore();
        const session = await this._getSession();
        let result;
        try {
            result = await this._catchMfaRequiredError(async ()=>{
                return await this._interface.signInWithCredential(options.email, options.password, session);
            });
        } catch (e) {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].InvalidTotpCode.isInstance(e)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(e);
            }
            throw e;
        }
        if (result.status === "ok") {
            await this._signInToAccountWithTokens(result.data);
            if (!options.noRedirect) {
                await this.redirectToAfterSignIn({
                    replace: true
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(result.error);
        }
    }
    async signUpWithCredential(options) {
        this._ensurePersistentTokenStore();
        const session = await this._getSession();
        const emailVerificationRedirectUrl = options.verificationCallbackUrl ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(this.urls.emailVerification, "verificationCallbackUrl");
        const result = await this._interface.signUpWithCredential(options.email, options.password, emailVerificationRedirectUrl, session);
        if (result.status === "ok") {
            await this._signInToAccountWithTokens(result.data);
            if (!options.noRedirect) {
                await this.redirectToAfterSignUp({
                    replace: true
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(result.error);
        }
    }
    async _signUpAnonymously() {
        this._ensurePersistentTokenStore();
        if (!this._anonymousSignUpInProgress) {
            this._anonymousSignUpInProgress = (async ()=>{
                this._ensurePersistentTokenStore();
                const session = await this._getSession();
                const result = await this._interface.signUpAnonymously(session);
                if (result.status === "ok") {
                    await this._signInToAccountWithTokens(result.data);
                } else {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("signUpAnonymously() should never return an error");
                }
                this._anonymousSignUpInProgress = null;
                return result.data;
            })();
        }
        return await this._anonymousSignUpInProgress;
    }
    async signInWithMagicLink(code, options) {
        this._ensurePersistentTokenStore();
        const session = await this._getSession();
        let result;
        try {
            result = await this._catchMfaRequiredError(async ()=>{
                return await this._interface.signInWithMagicLink(code, session);
            });
        } catch (e) {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].InvalidTotpCode.isInstance(e)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(e);
            }
            throw e;
        }
        if (result.status === "ok") {
            await this._signInToAccountWithTokens(result.data);
            if (!options?.noRedirect) {
                if (result.data.newUser) {
                    await this.redirectToAfterSignUp({
                        replace: true
                    });
                } else {
                    await this.redirectToAfterSignIn({
                        replace: true
                    });
                }
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(result.error);
        }
    }
    /**
   * Initiates a CLI authentication process that allows a command line application
   * to get a refresh token for a user's account.
   *
   * This process works as follows:
   * 1. The CLI app calls this method, which initiates the auth process with the server
   * 2. The server returns a polling code and a login code
   * 3. The CLI app opens a browser window to the appUrl with the login code as a parameter
   * 4. The user logs in through the browser and confirms the authorization
   * 5. The CLI app polls for the refresh token using the polling code
   *
   * @param options Options for the CLI login
   * @param options.appUrl The URL of the app that will handle the CLI auth confirmation
   * @param options.expiresInMillis Optional duration in milliseconds before the auth attempt expires (default: 2 hours)
   * @param options.maxAttempts Optional maximum number of polling attempts (default: Infinity)
   * @param options.waitTimeMillis Optional time to wait between polling attempts (default: 2 seconds)
   * @param options.promptLink Optional function to call with the login URL to prompt the user to open the browser
   * @returns Result containing either the refresh token or an error
   */ async promptCliLogin(options) {
        const response = await this._interface.sendClientRequest("/auth/cli", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                expires_in_millis: options.expiresInMillis
            })
        }, null);
        if (!response.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CliAuthError(`Failed to initiate CLI auth: ${response.status} ${await response.text()}`));
        }
        const initResult = await response.json();
        const pollingCode = initResult.polling_code;
        const loginCode = initResult.login_code;
        const url = `${options.appUrl}/handler/cli-auth-confirm?login_code=${encodeURIComponent(loginCode)}`;
        if (options.promptLink) {
            options.promptLink(url);
        } else {
            console.log(`Please visit the following URL to authenticate:
${url}`);
        }
        let attempts = 0;
        while(attempts < (options.maxAttempts ?? Infinity)){
            attempts++;
            const pollResponse = await this._interface.sendClientRequest("/auth/cli/poll", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    polling_code: pollingCode
                })
            }, null);
            if (!pollResponse.ok) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CliAuthError(`Failed to initiate CLI auth: ${pollResponse.status} ${await pollResponse.text()}`));
            }
            const pollResult = await pollResponse.json();
            if (pollResponse.status === 201 && pollResult.status === "success") {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(pollResult.refresh_token);
            }
            if (pollResult.status === "waiting") {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["wait"])(options.waitTimeMillis ?? 2e3);
                continue;
            }
            if (pollResult.status === "expired") {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CliAuthExpiredError("CLI authentication request expired. Please try again."));
            }
            if (pollResult.status === "used") {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CliAuthUsedError("This authentication token has already been used."));
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CliAuthError(`Unexpected status from CLI auth polling: ${pollResult.status}`));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CliAuthError("Timed out waiting for CLI authentication."));
    }
    /*
   * Completes the MFA sign-in process by verifying the provided OTP code
   * @param totp The TOTP (Time-based One-Time Password) provided by the user
   * @param code The Attempt code provided by the user
   * @param options Additional options for the sign-in process
   * @returns A Result indicating success or failure
   */ async signInWithMfa(totp, code, options) {
        this._ensurePersistentTokenStore();
        const session = await this._getSession();
        let result;
        try {
            result = await this._catchMfaRequiredError(async ()=>{
                return await this._interface.signInWithMfa(totp, code, session);
            });
        } catch (e) {
            if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].InvalidTotpCode) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(e);
            }
            throw e;
        }
        if (result.status === "ok") {
            await this._signInToAccountWithTokens(result.data);
            if (!options?.noRedirect) {
                if (result.data.newUser) {
                    await this.redirectToAfterSignUp({
                        replace: true
                    });
                } else {
                    await this.redirectToAfterSignIn({
                        replace: true
                    });
                }
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(result.error);
    }
    async signInWithPasskey() {
        this._ensurePersistentTokenStore();
        const session = await this._getSession();
        let result;
        try {
            result = await this._catchMfaRequiredError(async ()=>{
                const initiationResult = await this._interface.initiatePasskeyAuthentication({}, session);
                if (initiationResult.status !== "ok") {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyAuthenticationFailed("Failed to get initiation options for passkey authentication"));
                }
                const { options_json, code } = initiationResult.data;
                if (options_json.rpId !== "THIS_VALUE_WILL_BE_REPLACED.example.com") {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Expected returned RP ID from server to equal sentinel, but found ${options_json.rpId}`);
                }
                options_json.rpId = window.location.hostname;
                const authentication_response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$simplewebauthn$2f$browser$2f$dist$2f$bundle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startAuthentication"])({
                    optionsJSON: options_json
                });
                return await this._interface.signInWithPasskey({
                    authentication_response,
                    code
                }, session);
            });
        } catch (error) {
            if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$simplewebauthn$2f$browser$2f$dist$2f$bundle$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebAuthnError"]) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyWebAuthnError(error.message, error.name));
            } else {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyAuthenticationFailed("Failed to sign in with passkey"));
            }
        }
        if (result.status === "ok") {
            await this._signInToAccountWithTokens(result.data);
            await this.redirectToAfterSignIn({
                replace: true
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(result.error);
        }
    }
    async callOAuthCallback() {
        if (typeof window === "undefined") {
            throw new Error("callOAuthCallback can currently only be called in a browser environment");
        }
        this._ensurePersistentTokenStore();
        let result;
        try {
            result = await this._catchMfaRequiredError(async ()=>{
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$auth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callOAuthCallback"])(this._interface, this.urls.oauthCallback);
            });
        } catch (e) {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].InvalidTotpCode.isInstance(e)) {
                alert("Invalid TOTP code. Please try signing in again.");
                return false;
            } else {
                throw e;
            }
        }
        if (result.status === "ok" && result.data) {
            await this._signInToAccountWithTokens(result.data);
            if ("afterCallbackRedirectUrl" in result.data && result.data.afterCallbackRedirectUrl) {
                await this._redirectTo({
                    url: result.data.afterCallbackRedirectUrl,
                    replace: true
                });
                return true;
            } else if (result.data.newUser) {
                await this.redirectToAfterSignUp({
                    replace: true
                });
                return true;
            } else {
                await this.redirectToAfterSignIn({
                    replace: true
                });
                return true;
            }
        }
        return false;
    }
    async _signOut(session, options) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeLock"].withWriteLock(async ()=>{
            await this._interface.signOut(session);
            if (options?.redirectUrl) {
                await this._redirectTo({
                    url: options.redirectUrl,
                    replace: true
                });
            } else {
                await this.redirectToAfterSignOut();
            }
        });
    }
    async signOut(options) {
        const user = await this.getUser();
        if (user) {
            await user.signOut(options);
        }
    }
    async getProject() {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._currentProjectCache.getOrWait([], "write-only"));
        return this._clientProjectFromCrud(crud);
    }
    useProject() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._currentProjectCache, [], "clientApp.useProject()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>this._clientProjectFromCrud(crud), [
            crud
        ]);
    }
    async _listOwnedProjects(session) {
        this._ensureInternalProject();
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._ownedProjectsCache.getOrWait([
            session
        ], "write-only"));
        return crud.map((j)=>this._getOwnedAdminApp(j.id, session)._adminOwnedProjectFromCrud(j, ()=>this._refreshOwnedProjects(session)));
    }
    _useOwnedProjects(session) {
        this._ensureInternalProject();
        const projects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._ownedProjectsCache, [
            session
        ], "clientApp.useOwnedProjects()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>projects.map((j)=>this._getOwnedAdminApp(j.id, session)._adminOwnedProjectFromCrud(j, ()=>this._refreshOwnedProjects(session))), [
            projects
        ]);
    }
    async _createProject(session, newProject) {
        this._ensureInternalProject();
        const crud = await this._interface.createProject((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$projects$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adminProjectCreateOptionsToCrud"])(newProject), session);
        const res = this._getOwnedAdminApp(crud.id, session)._adminOwnedProjectFromCrud(crud, ()=>this._refreshOwnedProjects(session));
        await this._refreshOwnedProjects(session);
        return res;
    }
    async _refreshUser(session) {
        await this._refreshSession(session);
    }
    async _refreshSession(session) {
        await this._currentUserCache.refresh([
            session
        ]);
    }
    async _refreshUsers() {}
    async _refreshProject() {
        await this._currentProjectCache.refresh([]);
    }
    async _refreshOwnedProjects(session) {
        await this._ownedProjectsCache.refresh([
            session
        ]);
    }
    static get [__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]]() {
        return {
            fromClientJson: (json)=>{
                const providedCheckString = JSON.stringify((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["omit"])(json, []));
                const existing = allClientApps.get(json.uniqueIdentifier);
                if (existing) {
                    const [existingCheckString, clientApp] = existing;
                    if (existingCheckString !== void 0 && existingCheckString !== providedCheckString) {
                        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("The provided app JSON does not match the configuration of the existing client app with the same unique identifier", {
                            providedObj: json,
                            existingString: existingCheckString
                        });
                    }
                    return clientApp;
                }
                return new __StackClientAppImplIncomplete({
                    ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["omit"])(json, [
                        "uniqueIdentifier"
                    ])
                }, {
                    uniqueIdentifier: json.uniqueIdentifier,
                    checkString: providedCheckString
                });
            }
        };
    }
    get [__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]]() {
        return {
            toClientJson: ()=>{
                if (!("publishableClientKey" in this._interface.options)) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Cannot serialize to JSON from an application without a publishable client key");
                }
                if (typeof this._redirectMethod !== "string") {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Cannot serialize to JSON from an application with a non-string redirect method");
                }
                return {
                    baseUrl: this._options.baseUrl,
                    projectId: this.projectId,
                    publishableClientKey: this._interface.options.publishableClientKey,
                    tokenStore: this._tokenStoreInit,
                    urls: this._urlOptions,
                    oauthScopesOnSignIn: this._oauthScopesOnSignIn,
                    uniqueIdentifier: this._getUniqueIdentifier(),
                    redirectMethod: this._redirectMethod,
                    extraRequestHeaders: this._options.extraRequestHeaders
                };
            },
            setCurrentUser: (userJsonPromise)=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(async ()=>{
                    await this._currentUserCache.forceSetCachedValueAsync([
                        await this._getSession()
                    ], __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].fromPromise(userJsonPromise));
                });
            },
            getConstructorOptions: ()=>this._options,
            sendRequest: async (path, requestOptions, requestType = "client")=>{
                return await this._interface.sendClientRequest(path, requestOptions, await this._getSession(), requestType);
            }
        };
    }
};
/**
 * There is a circular dependency between the admin app and the client app, as the former inherits from the latter and
 * the latter needs to use the former when creating a new instance of an internal project.
 *
 * To break it, we set the admin app here lazily instead of importing it directly. This variable is set by ./index.ts,
 * which imports both this file and ./admin-app-impl.ts.
 */ __StackClientAppImplIncomplete.LazyStackAdminAppImpl = {
    value: void 0
};
var _StackClientAppImplIncomplete = __StackClientAppImplIncomplete;
;
 //# sourceMappingURL=client-app-impl.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/server-app-impl.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/apps/implementations/server-app-impl.ts
__turbopack_context__.s([
    "_StackServerAppImplIncomplete",
    ()=>_StackServerAppImplIncomplete
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$server$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/server-interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/url.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/api-keys/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$contact$2d$channels$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/contact-channels/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$teams$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/teams/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/users/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$client$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/client-app-impl.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/common.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
var _StackServerAppImplIncomplete = class extends __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$client$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackClientAppImplIncomplete"] {
    constructor(options, extraOptions){
        const resolvedOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveConstructorOptions"])(options);
        super(resolvedOptions, {
            ...extraOptions,
            interface: extraOptions?.interface ?? new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$server$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackServerInterface"]({
                getBaseUrl: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBaseUrl"])(resolvedOptions.baseUrl),
                projectId: resolvedOptions.projectId ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultProjectId"])(),
                extraRequestHeaders: resolvedOptions.extraRequestHeaders ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultExtraRequestHeaders"])(),
                clientVersion: __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientVersion"],
                publishableClientKey: resolvedOptions.publishableClientKey ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultPublishableClientKey"])(),
                secretServerKey: resolvedOptions.secretServerKey ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultSecretServerKey"])()
            })
        });
        // TODO override the client user cache to use the server user cache, so we save some requests
        this._currentServerUserCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCacheBySession"])(async (session)=>{
            if (session.isKnownToBeInvalid()) {
                return null;
            }
            return await this._interface.getServerUserByToken(session);
        });
        this._serverUsersCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([cursor, limit, orderBy, desc, query, includeAnonymous])=>{
            return await this._interface.listServerUsers({
                cursor,
                limit,
                orderBy,
                desc,
                query,
                includeAnonymous
            });
        });
        this._serverUserCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId])=>{
            const user = await this._interface.getServerUserById(userId);
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].or(user, null);
        });
        this._serverTeamsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId])=>{
            return await this._interface.listServerTeams({
                userId
            });
        });
        this._serverTeamUserPermissionsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([teamId, userId, recursive])=>{
            return await this._interface.listServerTeamPermissions({
                teamId,
                userId,
                recursive
            }, null);
        });
        this._serverUserProjectPermissionsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId, recursive])=>{
            return await this._interface.listServerProjectPermissions({
                userId,
                recursive
            }, null);
        });
        this._serverUserOAuthConnectionAccessTokensCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId, providerId, scope])=>{
            try {
                const result = await this._interface.createServerProviderAccessToken(userId, providerId, scope || "");
                return {
                    accessToken: result.access_token
                };
            } catch (err) {
                if (!(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].OAuthConnectionDoesNotHaveRequiredScope.isInstance(err) || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].OAuthConnectionNotConnectedToUser.isInstance(err))) {
                    throw err;
                }
            }
            return null;
        });
        this._serverUserOAuthConnectionCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId, providerId, scope, redirect])=>{
            return await this._getUserOAuthConnectionCacheFn({
                getUser: async ()=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverUserCache.getOrWait([
                        userId
                    ], "write-only")),
                getOrWaitOAuthToken: async ()=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverUserOAuthConnectionAccessTokensCache.getOrWait([
                        userId,
                        providerId,
                        scope || ""
                    ], "write-only")),
                useOAuthToken: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._serverUserOAuthConnectionAccessTokensCache, [
                        userId,
                        providerId,
                        scope || ""
                    ], "user.useConnectedAccount()"),
                providerId,
                scope,
                redirect,
                session: null
            });
        });
        this._serverTeamMemberProfilesCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([teamId])=>{
            return await this._interface.listServerTeamMemberProfiles({
                teamId
            });
        });
        this._serverTeamInvitationsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([teamId])=>{
            return await this._interface.listServerTeamInvitations({
                teamId
            });
        });
        this._serverUserTeamProfileCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([teamId, userId])=>{
            return await this._interface.getServerTeamMemberProfile({
                teamId,
                userId
            });
        });
        this._serverContactChannelsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId])=>{
            return await this._interface.listServerContactChannels(userId);
        });
        this._serverNotificationCategoriesCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId])=>{
            return await this._interface.listServerNotificationCategories(userId);
        });
        this._serverDataVaultStoreValueCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([storeId, key, secret])=>{
            return await this._interface.getDataVaultStoreValue(secret, storeId, key);
        });
        this._serverUserApiKeysCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId])=>{
            const result = await this._interface.listProjectApiKeys({
                user_id: userId
            }, null, "server");
            return result;
        });
        this._serverTeamApiKeysCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([teamId])=>{
            const result = await this._interface.listProjectApiKeys({
                team_id: teamId
            }, null, "server");
            return result;
        });
        this._convexIdentitySubjectCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([ctx])=>{
            const identity = await ctx.auth.getUserIdentity();
            return identity ? identity.subject : null;
        });
        this._serverCheckApiKeyCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([type, apiKey])=>{
            const result = await this._interface.checkProjectApiKey(type, apiKey, null, "server");
            return result;
        });
        this._serverOAuthProvidersCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId])=>{
            return await this._interface.listServerOAuthProviders({
                user_id: userId
            });
        });
        this._serverTeamItemsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([teamId, itemId])=>{
            return await this._interface.getItem({
                teamId,
                itemId
            }, null);
        });
        this._serverUserItemsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId, itemId])=>{
            return await this._interface.getItem({
                userId,
                itemId
            }, null);
        });
        this._serverCustomItemsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([customCustomerId, itemId])=>{
            return await this._interface.getItem({
                customCustomerId,
                itemId
            }, null);
        });
        this._serverUserProductsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([userId, cursor, limit])=>{
            return await this._interface.listProducts({
                customer_type: "user",
                customer_id: userId,
                cursor: cursor ?? void 0,
                limit: limit ?? void 0
            }, null);
        });
        this._serverTeamProductsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([teamId, cursor, limit])=>{
            return await this._interface.listProducts({
                customer_type: "team",
                customer_id: teamId,
                cursor: cursor ?? void 0,
                limit: limit ?? void 0
            }, null);
        });
        this._serverCustomProductsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([customCustomerId, cursor, limit])=>{
            return await this._interface.listProducts({
                customer_type: "custom",
                customer_id: customCustomerId,
                cursor: cursor ?? void 0,
                limit: limit ?? void 0
            }, null);
        });
    }
    _createServerCustomer(userIdOrTeamId, type) {
        const app = this;
        const productsCache = type === "user" ? app._serverUserProductsCache : app._serverTeamProductsCache;
        const customerOptions = type === "user" ? {
            userId: userIdOrTeamId
        } : {
            teamId: userIdOrTeamId
        };
        return {
            ...this._createCustomer(userIdOrTeamId, type, null),
            async getItem (itemId) {
                return await app.getItem({
                    itemId,
                    ...customerOptions
                });
            },
            useItem (itemId) {
                return app.useItem({
                    itemId,
                    ...customerOptions
                });
            },
            async grantProduct (productOptions) {
                if (type === "user") {
                    if ("productId" in productOptions) {
                        await app.grantProduct({
                            userId: userIdOrTeamId,
                            productId: productOptions.productId,
                            quantity: productOptions.quantity
                        });
                    } else {
                        await app.grantProduct({
                            userId: userIdOrTeamId,
                            product: productOptions.product,
                            quantity: productOptions.quantity
                        });
                    }
                } else {
                    if ("productId" in productOptions) {
                        await app.grantProduct({
                            teamId: userIdOrTeamId,
                            productId: productOptions.productId,
                            quantity: productOptions.quantity
                        });
                    } else {
                        await app.grantProduct({
                            teamId: userIdOrTeamId,
                            product: productOptions.product,
                            quantity: productOptions.quantity
                        });
                    }
                }
                await productsCache.refresh([
                    userIdOrTeamId,
                    null,
                    null
                ]);
            },
            async createCheckoutUrl (options) {
                const productIdOrInline = "productId" in options ? options.productId : options.product;
                return await app._interface.createCheckoutUrl(type, userIdOrTeamId, productIdOrInline, null, options.returnUrl);
            }
        };
    }
    async _updateServerUser(userId, update) {
        const result = await this._interface.updateServerUser(userId, (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverUserUpdateOptionsToCrud"])(update));
        await this._refreshUsers();
        return result;
    }
    _serverEditableTeamProfileFromCrud(crud) {
        const app = this;
        return {
            displayName: crud.display_name,
            profileImageUrl: crud.profile_image_url,
            async update (update) {
                await app._interface.updateServerTeamMemberProfile({
                    teamId: crud.team_id,
                    userId: crud.user_id,
                    profile: {
                        display_name: update.displayName,
                        profile_image_url: update.profileImageUrl
                    }
                });
                await app._serverUserTeamProfileCache.refresh([
                    crud.team_id,
                    crud.user_id
                ]);
            }
        };
    }
    _serverContactChannelFromCrud(userId, crud) {
        const app = this;
        return {
            id: crud.id,
            value: crud.value,
            type: crud.type,
            isVerified: crud.is_verified,
            isPrimary: crud.is_primary,
            usedForAuth: crud.used_for_auth,
            async sendVerificationEmail (options) {
                await app._interface.sendServerContactChannelVerificationEmail(userId, crud.id, options?.callbackUrl ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(app.urls.emailVerification, "callbackUrl"));
            },
            async update (data) {
                await app._interface.updateServerContactChannel(userId, crud.id, (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$contact$2d$channels$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverContactChannelUpdateOptionsToCrud"])(data));
                await Promise.all([
                    app._serverContactChannelsCache.refresh([
                        userId
                    ]),
                    app._serverUserCache.refresh([
                        userId
                    ])
                ]);
            },
            async delete () {
                await app._interface.deleteServerContactChannel(userId, crud.id);
                await Promise.all([
                    app._serverContactChannelsCache.refresh([
                        userId
                    ]),
                    app._serverUserCache.refresh([
                        userId
                    ])
                ]);
            }
        };
    }
    _serverNotificationCategoryFromCrud(userId, crud) {
        const app = this;
        return {
            id: crud.notification_category_id,
            name: crud.notification_category_name,
            enabled: crud.enabled,
            canDisable: crud.can_disable,
            async setEnabled (enabled) {
                await app._interface.setServerNotificationsEnabled(userId, crud.notification_category_id, enabled);
                await app._serverNotificationCategoriesCache.refresh([
                    userId
                ]);
            }
        };
    }
    _serverOAuthProviderFromCrud(crud) {
        const app = this;
        return {
            id: crud.id,
            type: crud.type,
            userId: crud.user_id,
            accountId: crud.account_id,
            email: crud.email,
            allowSignIn: crud.allow_sign_in,
            allowConnectedAccounts: crud.allow_connected_accounts,
            async update (data) {
                try {
                    await app._interface.updateServerOAuthProvider(crud.user_id, crud.id, {
                        account_id: data.accountId,
                        email: data.email,
                        allow_sign_in: data.allowSignIn,
                        allow_connected_accounts: data.allowConnectedAccounts
                    });
                    await app._serverOAuthProvidersCache.refresh([
                        crud.user_id
                    ]);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
                } catch (error) {
                    if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].OAuthProviderAccountIdAlreadyUsedForSignIn.isInstance(error)) {
                        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(error);
                    }
                    throw error;
                }
            },
            async delete () {
                await app._interface.deleteServerOAuthProvider(crud.user_id, crud.id);
                await app._serverOAuthProvidersCache.refresh([
                    crud.user_id
                ]);
            }
        };
    }
    _serverApiKeyFromCrud(crud) {
        return {
            ...this._baseApiKeyFromCrud(crud),
            async revoke () {
                await this.update({
                    revoked: true
                });
            },
            update: async (options)=>{
                await this._interface.updateProjectApiKey(crud.type === "team" ? {
                    team_id: crud.team_id
                } : {
                    user_id: crud.user_id
                }, crud.id, await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiKeyUpdateOptionsToCrud"])(crud.type, options), null, "server");
                if (crud.type === "team") {
                    await this._serverTeamApiKeysCache.refresh([
                        crud.team_id
                    ]);
                } else {
                    await this._serverUserApiKeysCache.refresh([
                        crud.user_id
                    ]);
                }
            }
        };
    }
    _serverUserFromCrud(crud) {
        const app = this;
        async function getConnectedAccount(id, options) {
            const scopeString = options?.scopes?.join(" ");
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverUserOAuthConnectionCache.getOrWait([
                crud.id,
                id,
                scopeString || "",
                options?.or === "redirect"
            ], "write-only"));
        }
        function useConnectedAccount(id, options) {
            const scopeString = options?.scopes?.join(" ");
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverUserOAuthConnectionCache, [
                crud.id,
                id,
                scopeString || "",
                options?.or === "redirect"
            ], "user.useConnectedAccount()");
        }
        const serverUser = {
            ...super._createBaseUser(crud),
            lastActiveAt: new Date(crud.last_active_at_millis),
            serverMetadata: crud.server_metadata,
            async setPrimaryEmail (email, options) {
                await app._updateServerUser(crud.id, {
                    primaryEmail: email,
                    primaryEmailVerified: options?.verified
                });
            },
            async grantPermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string" && permissionId) {
                    const scope = scopeOrPermissionId;
                    await app._interface.grantServerTeamUserPermission(scope.id, crud.id, permissionId);
                    for (const recursive of [
                        true,
                        false
                    ]){
                        await app._serverTeamUserPermissionsCache.refresh([
                            scope.id,
                            crud.id,
                            recursive
                        ]);
                    }
                } else {
                    const pId = scopeOrPermissionId;
                    await app._interface.grantServerProjectPermission(crud.id, pId);
                    for (const recursive of [
                        true,
                        false
                    ]){
                        await app._serverUserProjectPermissionsCache.refresh([
                            crud.id,
                            recursive
                        ]);
                    }
                }
            },
            async revokePermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string" && permissionId) {
                    const scope = scopeOrPermissionId;
                    await app._interface.revokeServerTeamUserPermission(scope.id, crud.id, permissionId);
                    for (const recursive of [
                        true,
                        false
                    ]){
                        await app._serverTeamUserPermissionsCache.refresh([
                            scope.id,
                            crud.id,
                            recursive
                        ]);
                    }
                } else {
                    const pId = scopeOrPermissionId;
                    await app._interface.revokeServerProjectPermission(crud.id, pId);
                    for (const recursive of [
                        true,
                        false
                    ]){
                        await app._serverUserProjectPermissionsCache.refresh([
                            crud.id,
                            recursive
                        ]);
                    }
                }
            },
            async delete () {
                const res = await app._interface.deleteServerUser(crud.id);
                await app._refreshUsers();
                return res;
            },
            async createSession (options) {
                const tokens = await app._interface.createServerUserSession(crud.id, options.expiresInMillis ?? 1e3 * 60 * 60 * 24 * 365, options.isImpersonation ?? false);
                return {
                    async getTokens () {
                        return tokens;
                    }
                };
            },
            async getActiveSessions () {
                const sessions = await app._interface.listServerSessions(crud.id);
                return sessions.map((session)=>app._clientSessionFromCrud(session));
            },
            async revokeSession (sessionId) {
                await app._interface.deleteServerSession(sessionId);
            },
            async setDisplayName (displayName) {
                return await this.update({
                    displayName
                });
            },
            async setClientMetadata (metadata) {
                return await this.update({
                    clientMetadata: metadata
                });
            },
            async setClientReadOnlyMetadata (metadata) {
                return await this.update({
                    clientReadOnlyMetadata: metadata
                });
            },
            async setServerMetadata (metadata) {
                return await this.update({
                    serverMetadata: metadata
                });
            },
            async setSelectedTeam (team) {
                return await this.update({
                    selectedTeamId: team?.id ?? null
                });
            },
            getConnectedAccount,
            useConnectedAccount,
            // THIS_LINE_PLATFORM react-like
            selectedTeam: crud.selected_team ? app._serverTeamFromCrud(crud.selected_team) : null,
            async getTeam (teamId) {
                const teams = await this.listTeams();
                return teams.find((t)=>t.id === teamId) ?? null;
            },
            useTeam (teamId) {
                const teams = this.useTeams();
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
                    return teams.find((t)=>t.id === teamId) ?? null;
                }, [
                    teams,
                    teamId
                ]);
            },
            async listTeams () {
                const teams = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverTeamsCache.getOrWait([
                    crud.id
                ], "write-only"));
                return teams.map((t)=>app._serverTeamFromCrud(t));
            },
            useTeams () {
                const teams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverTeamsCache, [
                    crud.id
                ], "user.useTeams()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>teams.map((t)=>app._serverTeamFromCrud(t)), [
                    teams
                ]);
            },
            createTeam: async (data)=>{
                const team = await app._interface.createServerTeam((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$teams$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTeamCreateOptionsToCrud"])({
                    creatorUserId: crud.id,
                    ...data
                }));
                await app._serverTeamsCache.refresh([
                    void 0
                ]);
                await app._updateServerUser(crud.id, {
                    selectedTeamId: team.id
                });
                return app._serverTeamFromCrud(team);
            },
            leaveTeam: async (team)=>{
                await app._interface.leaveServerTeam({
                    teamId: team.id,
                    userId: crud.id
                });
            },
            async listPermissions (scopeOrOptions, options) {
                if (scopeOrOptions && "id" in scopeOrOptions) {
                    const scope = scopeOrOptions;
                    const recursive = options?.recursive ?? true;
                    const permissions = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverTeamUserPermissionsCache.getOrWait([
                        scope.id,
                        crud.id,
                        recursive
                    ], "write-only"));
                    return permissions.map((crud2)=>app._serverPermissionFromCrud(crud2));
                } else {
                    const opts = scopeOrOptions;
                    const recursive = opts?.recursive ?? true;
                    const permissions = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverUserProjectPermissionsCache.getOrWait([
                        crud.id,
                        recursive
                    ], "write-only"));
                    return permissions.map((crud2)=>app._serverPermissionFromCrud(crud2));
                }
            },
            usePermissions (scopeOrOptions, options) {
                if (scopeOrOptions && "id" in scopeOrOptions) {
                    const scope = scopeOrOptions;
                    const recursive = options?.recursive ?? true;
                    const permissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverTeamUserPermissionsCache, [
                        scope.id,
                        crud.id,
                        recursive
                    ], "user.usePermissions()");
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.map((crud2)=>app._serverPermissionFromCrud(crud2)), [
                        permissions
                    ]);
                } else {
                    const opts = scopeOrOptions;
                    const recursive = opts?.recursive ?? true;
                    const permissions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverUserProjectPermissionsCache, [
                        crud.id,
                        recursive
                    ], "user.usePermissions()");
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.map((crud2)=>app._serverPermissionFromCrud(crud2)), [
                        permissions
                    ]);
                }
            },
            async getPermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string") {
                    const scope = scopeOrPermissionId;
                    const permissions = await this.listPermissions(scope);
                    return permissions.find((p)=>p.id === permissionId) ?? null;
                } else {
                    const pid = scopeOrPermissionId;
                    const permissions = await this.listPermissions();
                    return permissions.find((p)=>p.id === pid) ?? null;
                }
            },
            usePermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string") {
                    const scope = scopeOrPermissionId;
                    const permissions = this.usePermissions(scope);
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.find((p)=>p.id === permissionId) ?? null, [
                        permissions,
                        permissionId
                    ]);
                } else {
                    const pid = scopeOrPermissionId;
                    const permissions = this.usePermissions();
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>permissions.find((p)=>p.id === pid) ?? null, [
                        permissions,
                        pid
                    ]);
                }
            },
            async hasPermission (scopeOrPermissionId, permissionId) {
                if (scopeOrPermissionId && typeof scopeOrPermissionId !== "string") {
                    const scope = scopeOrPermissionId;
                    return await this.getPermission(scope, permissionId) !== null;
                } else {
                    const pid = scopeOrPermissionId;
                    return await this.getPermission(pid) !== null;
                }
            },
            async update (update) {
                await app._updateServerUser(crud.id, update);
            },
            async sendVerificationEmail () {
                return await app._checkFeatureSupport("sendVerificationEmail() on ServerUser", {});
            },
            async updatePassword (options) {
                const result = await app._interface.updatePassword(options);
                await app._serverUserCache.refresh([
                    crud.id
                ]);
                return result;
            },
            async setPassword (options) {
                const result = await this.update(options);
                await app._serverUserCache.refresh([
                    crud.id
                ]);
                return result;
            },
            async getTeamProfile (team) {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverUserTeamProfileCache.getOrWait([
                    team.id,
                    crud.id
                ], "write-only"));
                return app._serverEditableTeamProfileFromCrud(result);
            },
            useTeamProfile (team) {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverUserTeamProfileCache, [
                    team.id,
                    crud.id
                ], "user.useTeamProfile()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>app._serverEditableTeamProfileFromCrud(result), [
                    result
                ]);
            },
            async listContactChannels () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverContactChannelsCache.getOrWait([
                    crud.id
                ], "write-only"));
                return result.map((data)=>app._serverContactChannelFromCrud(crud.id, data));
            },
            useContactChannels () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverContactChannelsCache, [
                    crud.id
                ], "user.useContactChannels()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>result.map((data)=>app._serverContactChannelFromCrud(crud.id, data)), [
                    result
                ]);
            },
            createContactChannel: async (data)=>{
                const contactChannel = await app._interface.createServerContactChannel((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$contact$2d$channels$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverContactChannelCreateOptionsToCrud"])(crud.id, data));
                await Promise.all([
                    app._serverContactChannelsCache.refresh([
                        crud.id
                    ]),
                    app._serverUserCache.refresh([
                        crud.id
                    ])
                ]);
                return app._serverContactChannelFromCrud(crud.id, contactChannel);
            },
            useNotificationCategories () {
                const results = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverNotificationCategoriesCache, [
                    crud.id
                ], "user.useNotificationCategories()");
                return results.map((category)=>app._serverNotificationCategoryFromCrud(crud.id, category));
            },
            async listNotificationCategories () {
                const results = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverNotificationCategoriesCache.getOrWait([
                    crud.id
                ], "write-only"));
                return results.map((category)=>app._serverNotificationCategoryFromCrud(crud.id, category));
            },
            useApiKeys () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverUserApiKeysCache, [
                    crud.id
                ], "user.useApiKeys()");
                return result.map((apiKey)=>app._serverApiKeyFromCrud(apiKey));
            },
            async listApiKeys () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverUserApiKeysCache.getOrWait([
                    crud.id
                ], "write-only"));
                return result.map((apiKey)=>app._serverApiKeyFromCrud(apiKey));
            },
            async createApiKey (options) {
                const result = await app._interface.createProjectApiKey(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiKeyCreationOptionsToCrud"])("user", crud.id, options), null, "server");
                await app._serverUserApiKeysCache.refresh([
                    crud.id
                ]);
                return app._serverApiKeyFromCrud(result);
            },
            useOAuthProviders () {
                const results = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverOAuthProvidersCache, [
                    crud.id
                ], "user.useOAuthProviders()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>results.map((oauthCrud)=>app._serverOAuthProviderFromCrud(oauthCrud)), [
                    results
                ]);
            },
            async listOAuthProviders () {
                const results = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverOAuthProvidersCache.getOrWait([
                    crud.id
                ], "write-only"));
                return results.map((oauthCrud)=>app._serverOAuthProviderFromCrud(oauthCrud));
            },
            useOAuthProvider (id) {
                const providers = this.useOAuthProviders();
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>providers.find((p)=>p.id === id) ?? null, [
                    providers,
                    id
                ]);
            },
            async getOAuthProvider (id) {
                const providers = await this.listOAuthProviders();
                return providers.find((p)=>p.id === id) ?? null;
            },
            ...app._createServerCustomer(crud.id, "user")
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attachUserDestructureGuard"])(serverUser);
        return serverUser;
    }
    _serverTeamUserFromCrud(crud) {
        const teamUser = {
            ...this._serverUserFromCrud(crud.user),
            teamProfile: {
                displayName: crud.display_name,
                profileImageUrl: crud.profile_image_url
            }
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attachUserDestructureGuard"])(teamUser);
        return teamUser;
    }
    _serverTeamInvitationFromCrud(crud) {
        return {
            id: crud.id,
            recipientEmail: crud.recipient_email,
            expiresAt: new Date(crud.expires_at_millis),
            revoke: async ()=>{
                await this._interface.revokeServerTeamInvitation(crud.id, crud.team_id);
                await this._serverTeamInvitationsCache.refresh([
                    crud.team_id
                ]);
            }
        };
    }
    _currentUserFromCrud(crud, session) {
        const currentUser = {
            ...this._serverUserFromCrud(crud),
            ...this._createAuth(session),
            ...this._isInternalProject() ? this._createInternalUserExtra(session) : {}
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attachUserDestructureGuard"])(currentUser);
        Object.freeze(currentUser);
        return currentUser;
    }
    _serverTeamFromCrud(crud) {
        const app = this;
        return {
            id: crud.id,
            displayName: crud.display_name,
            profileImageUrl: crud.profile_image_url,
            createdAt: new Date(crud.created_at_millis),
            clientMetadata: crud.client_metadata,
            clientReadOnlyMetadata: crud.client_read_only_metadata,
            serverMetadata: crud.server_metadata,
            async update (update) {
                await app._interface.updateServerTeam(crud.id, (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$teams$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTeamUpdateOptionsToCrud"])(update));
                await app._serverTeamsCache.refresh([
                    void 0
                ]);
            },
            async delete () {
                await app._interface.deleteServerTeam(crud.id);
                await app._serverTeamsCache.refresh([
                    void 0
                ]);
            },
            async listUsers () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverTeamMemberProfilesCache.getOrWait([
                    crud.id
                ], "write-only"));
                return result.map((u)=>app._serverTeamUserFromCrud(u));
            },
            useUsers () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverTeamMemberProfilesCache, [
                    crud.id
                ], "team.useUsers()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>result.map((u)=>app._serverTeamUserFromCrud(u)), [
                    result
                ]);
            },
            async addUser (userId) {
                await app._interface.addServerUserToTeam({
                    teamId: crud.id,
                    userId
                });
                await app._serverTeamMemberProfilesCache.refresh([
                    crud.id
                ]);
            },
            async removeUser (userId) {
                await app._interface.removeServerUserFromTeam({
                    teamId: crud.id,
                    userId
                });
                await app._serverTeamMemberProfilesCache.refresh([
                    crud.id
                ]);
            },
            async inviteUser (options) {
                await app._interface.sendServerTeamInvitation({
                    teamId: crud.id,
                    email: options.email,
                    callbackUrl: options.callbackUrl ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["constructRedirectUrl"])(app.urls.teamInvitation, "callbackUrl")
                });
                await app._serverTeamInvitationsCache.refresh([
                    crud.id
                ]);
            },
            async listInvitations () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverTeamInvitationsCache.getOrWait([
                    crud.id
                ], "write-only"));
                return result.map((crud2)=>app._serverTeamInvitationFromCrud(crud2));
            },
            useInvitations () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverTeamInvitationsCache, [
                    crud.id
                ], "team.useInvitations()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>result.map((crud2)=>app._serverTeamInvitationFromCrud(crud2)), [
                    result
                ]);
            },
            useApiKeys () {
                const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._serverTeamApiKeysCache, [
                    crud.id
                ], "team.useApiKeys()");
                return result.map((apiKey)=>app._serverApiKeyFromCrud(apiKey));
            },
            async listApiKeys () {
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await app._serverTeamApiKeysCache.getOrWait([
                    crud.id
                ], "write-only"));
                return result.map((apiKey)=>app._serverApiKeyFromCrud(apiKey));
            },
            async createApiKey (options) {
                const result = await app._interface.createProjectApiKey(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiKeyCreationOptionsToCrud"])("team", crud.id, options), null, "server");
                await app._serverTeamApiKeysCache.refresh([
                    crud.id
                ]);
                return app._serverApiKeyFromCrud(result);
            },
            ...app._createServerCustomer(crud.id, "team")
        };
    }
    _serverItemFromCrud(customer, crud) {
        const app = this;
        return {
            displayName: crud.display_name,
            quantity: crud.quantity,
            nonNegativeQuantity: Math.max(0, crud.quantity),
            increaseQuantity: async (delta)=>{
                const updateOptions = customer.type === "user" ? {
                    itemId: crud.id,
                    userId: customer.id
                } : customer.type === "team" ? {
                    itemId: crud.id,
                    teamId: customer.id
                } : {
                    itemId: crud.id,
                    customCustomerId: customer.id
                };
                await app._interface.updateItemQuantity(updateOptions, {
                    delta
                });
                if (customer.type === "user") await app._serverUserItemsCache.refresh([
                    customer.id,
                    crud.id
                ]);
                else if (customer.type === "team") await app._serverTeamItemsCache.refresh([
                    customer.id,
                    crud.id
                ]);
                else await app._serverCustomItemsCache.refresh([
                    customer.id,
                    crud.id
                ]);
            },
            decreaseQuantity: async (delta)=>{
                const updateOptions = customer.type === "user" ? {
                    itemId: crud.id,
                    userId: customer.id
                } : customer.type === "team" ? {
                    itemId: crud.id,
                    teamId: customer.id
                } : {
                    itemId: crud.id,
                    customCustomerId: customer.id
                };
                await app._interface.updateItemQuantity(updateOptions, {
                    delta: -delta,
                    allow_negative: true
                });
                if (customer.type === "user") await app._serverUserItemsCache.refresh([
                    customer.id,
                    crud.id
                ]);
                else if (customer.type === "team") await app._serverTeamItemsCache.refresh([
                    customer.id,
                    crud.id
                ]);
                else await app._serverCustomItemsCache.refresh([
                    customer.id,
                    crud.id
                ]);
            },
            tryDecreaseQuantity: async (delta)=>{
                try {
                    const updateOptions = customer.type === "user" ? {
                        itemId: crud.id,
                        userId: customer.id
                    } : customer.type === "team" ? {
                        itemId: crud.id,
                        teamId: customer.id
                    } : {
                        itemId: crud.id,
                        customCustomerId: customer.id
                    };
                    await app._interface.updateItemQuantity(updateOptions, {
                        delta: -delta
                    });
                    if (customer.type === "user") await app._serverUserItemsCache.refresh([
                        customer.id,
                        crud.id
                    ]);
                    else if (customer.type === "team") await app._serverTeamItemsCache.refresh([
                        customer.id,
                        crud.id
                    ]);
                    else await app._serverCustomItemsCache.refresh([
                        customer.id,
                        crud.id
                    ]);
                    return true;
                } catch (error) {
                    if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].ItemQuantityInsufficientAmount) {
                        return false;
                    }
                    throw error;
                }
            }
        };
    }
    async _getUserApiKey(options) {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverCheckApiKeyCache.getOrWait([
            "user",
            options.apiKey
        ], "write-only"));
        return crud ? this._serverApiKeyFromCrud(crud) : null;
    }
    async _getTeamApiKey(options) {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverCheckApiKeyCache.getOrWait([
            "team",
            options.apiKey
        ], "write-only"));
        return crud ? this._serverApiKeyFromCrud(crud) : null;
    }
    _useUserApiKey(options) {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._serverCheckApiKeyCache, [
            "user",
            options.apiKey
        ], "serverApp.useUserApiKey()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>crud ? this._serverApiKeyFromCrud(crud) : null, [
            crud
        ]);
    }
    _useTeamApiKey(options) {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._serverCheckApiKeyCache, [
            "team",
            options.apiKey
        ], "serverApp.useTeamApiKey()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>crud ? this._serverApiKeyFromCrud(crud) : null, [
            crud
        ]);
    }
    async _getUserByApiKey(apiKey) {
        const apiKeyObject = await this._getUserApiKey({
            apiKey
        });
        if (apiKeyObject === null) {
            return null;
        }
        return await this.getServerUserById(apiKeyObject.userId);
    }
    async _getUserByConvex(ctx, includeAnonymous) {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            return null;
        }
        const user = await this.getServerUserById(identity.subject);
        if (user?.isAnonymous && !includeAnonymous) {
            return null;
        }
        return user;
    }
    _useUserByConvex(ctx, includeAnonymous) {
        const subject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._convexIdentitySubjectCache, [
            ctx
        ], "serverApp.useUserByConvex()");
        if (subject === null) {
            return null;
        }
        const user = this.useUserById(subject);
        if (user?.isAnonymous && !includeAnonymous) {
            return null;
        }
        return user;
    }
    _useUserByApiKey(apiKey) {
        const apiKeyObject = this._useUserApiKey({
            apiKey
        });
        if (apiKeyObject === null) {
            return null;
        }
        return this.useUserById(apiKeyObject.userId);
    }
    async _getTeamByApiKey(apiKey) {
        const apiKeyObject = await this._getTeamApiKey({
            apiKey
        });
        if (apiKeyObject === null) {
            return null;
        }
        return await this.getTeam(apiKeyObject.teamId);
    }
    _useTeamByApiKey(apiKey) {
        const apiKeyObject = this._useTeamApiKey({
            apiKey
        });
        if (apiKeyObject === null) {
            return null;
        }
        return this.useTeam(apiKeyObject.teamId);
    }
    async createUser(options) {
        const crud = await this._interface.createServerUser((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$users$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverUserCreateOptionsToCrud"])(options));
        await this._refreshUsers();
        return this._serverUserFromCrud(crud);
    }
    async getUser(options) {
        if (typeof options === "string") {
            return await this.getServerUserById(options);
        } else if (typeof options === "object" && "apiKey" in options) {
            return await this._getUserByApiKey(options.apiKey);
        } else if (typeof options === "object" && "from" in options && options.from === "convex") {
            return await this._getUserByConvex(options.ctx, "or" in options && options.or === "anonymous");
        } else {
            options = options;
            this._ensurePersistentTokenStore(options?.tokenStore);
            const session = await this._getSession(options?.tokenStore);
            let crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._currentServerUserCache.getOrWait([
                session
            ], "write-only"));
            if (crud?.is_anonymous && options?.or !== "anonymous" && options?.or !== "anonymous-if-exists[deprecated]") {
                crud = null;
            }
            if (crud === null) {
                switch(options?.or){
                    case "redirect":
                        {
                            await this.redirectToSignIn({
                                replace: true
                            });
                            break;
                        }
                    case "throw":
                        {
                            throw new Error("User is not signed in but getUser was called with { or: 'throw' }");
                        }
                    case "anonymous":
                        {
                            const tokens = await this._signUpAnonymously();
                            return await this.getUser({
                                tokenStore: tokens,
                                or: "anonymous-if-exists[deprecated]"
                            }) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Something went wrong while signing up anonymously");
                        }
                    case void 0:
                    case "anonymous-if-exists[deprecated]":
                    case "return-null":
                        {
                            return null;
                        }
                }
            }
            return crud && this._currentUserFromCrud(crud, session);
        }
    }
    async getServerUser() {
        console.warn("stackServerApp.getServerUser is deprecated; use stackServerApp.getUser instead");
        return await this.getUser();
    }
    async getServerUserById(userId) {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverUserCache.getOrWait([
            userId
        ], "write-only"));
        return crud && this._serverUserFromCrud(crud);
    }
    useUser(options) {
        if (typeof options === "string") {
            return this.useUserById(options);
        } else if (typeof options === "object" && "apiKey" in options) {
            return this._useUserByApiKey(options.apiKey);
        } else if (typeof options === "object" && "from" in options && options.from === "convex") {
            return this._useUserByConvex(options.ctx, "or" in options && options.or === "anonymous");
        } else {
            options = options;
            this._ensurePersistentTokenStore(options?.tokenStore);
            const session = this._useSession(options?.tokenStore);
            let crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._currentServerUserCache, [
                session
            ], "serverApp.useUser()");
            if (crud?.is_anonymous && options?.or !== "anonymous" && options?.or !== "anonymous-if-exists[deprecated]") {
                crud = null;
            }
            if (crud === null) {
                switch(options?.or){
                    case "redirect":
                        {
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(this.redirectToSignIn({
                                replace: true
                            }));
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["suspend"])();
                            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("suspend should never return");
                        }
                    case "throw":
                        {
                            throw new Error("User is not signed in but useUser was called with { or: 'throw' }");
                        }
                    case "anonymous":
                        {
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(async ()=>{
                                await this._signUpAnonymously();
                                if (typeof window !== "undefined") {
                                    window.location.reload();
                                }
                            });
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["suspend"])();
                            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("suspend should never return");
                        }
                    case void 0:
                    case "anonymous-if-exists[deprecated]":
                    case "return-null":
                        {}
                }
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
                return crud && this._currentUserFromCrud(crud, session);
            }, [
                crud,
                session,
                options?.or
            ]);
        }
    }
    useUserById(userId) {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._serverUserCache, [
            userId
        ], "serverApp.useUserById()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud && this._serverUserFromCrud(crud);
        }, [
            crud
        ]);
    }
    async listUsers(options) {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverUsersCache.getOrWait([
            options?.cursor,
            options?.limit,
            options?.orderBy,
            options?.desc,
            options?.query,
            options?.includeAnonymous
        ], "write-only"));
        const result = crud.items.map((j)=>this._serverUserFromCrud(j));
        result.nextCursor = crud.pagination?.next_cursor ?? null;
        return result;
    }
    useUsers(options) {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._serverUsersCache, [
            options?.cursor,
            options?.limit,
            options?.orderBy,
            options?.desc,
            options?.query
        ], "serverApp.useUsers()");
        const result = crud.items.map((j)=>this._serverUserFromCrud(j));
        result.nextCursor = crud.pagination?.next_cursor ?? null;
        return result;
    }
    _serverPermissionFromCrud(crud) {
        return {
            id: crud.id
        };
    }
    _serverTeamPermissionDefinitionFromCrud(crud) {
        return {
            id: crud.id,
            description: crud.description,
            containedPermissionIds: crud.contained_permission_ids
        };
    }
    _serverProjectPermissionDefinitionFromCrud(crud) {
        return {
            id: crud.id,
            description: crud.description,
            containedPermissionIds: crud.contained_permission_ids
        };
    }
    async listTeams() {
        const teams = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverTeamsCache.getOrWait([
            void 0
        ], "write-only"));
        return teams.map((t)=>this._serverTeamFromCrud(t));
    }
    async getItem(options) {
        if ("userId" in options) {
            const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverUserItemsCache.getOrWait([
                options.userId,
                options.itemId
            ], "write-only"));
            return this._serverItemFromCrud({
                type: "user",
                id: options.userId
            }, result);
        } else if ("teamId" in options) {
            const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverTeamItemsCache.getOrWait([
                options.teamId,
                options.itemId
            ], "write-only"));
            return this._serverItemFromCrud({
                type: "team",
                id: options.teamId
            }, result);
        } else {
            const result = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverCustomItemsCache.getOrWait([
                options.customCustomerId,
                options.itemId
            ], "write-only"));
            return this._serverItemFromCrud({
                type: "custom",
                id: options.customCustomerId
            }, result);
        }
    }
    useItem(options) {
        let type;
        let id;
        let cache;
        if ("userId" in options) {
            type = "user";
            id = options.userId;
            cache = this._serverUserItemsCache;
        } else if ("teamId" in options) {
            type = "team";
            id = options.teamId;
            cache = this._serverTeamItemsCache;
        } else {
            type = "custom";
            id = options.customCustomerId;
            cache = this._serverCustomItemsCache;
        }
        const cacheKey = [
            id,
            options.itemId
        ];
        const debugLabel = "serverApp.useItem()";
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(cache, cacheKey, debugLabel);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>this._serverItemFromCrud({
                type,
                id
            }, result), [
            result
        ]);
    }
    async grantProduct(options) {
        let customerType;
        let customerId;
        if ("userId" in options) {
            customerType = "user";
            customerId = options.userId;
        } else if ("teamId" in options) {
            customerType = "team";
            customerId = options.teamId;
        } else {
            customerType = "custom";
            customerId = options.customCustomerId;
        }
        await this._interface.grantProduct({
            customerType,
            customerId,
            productId: "productId" in options ? options.productId : void 0,
            product: "product" in options ? options.product : void 0,
            quantity: options.quantity
        });
        const cache = customerType === "user" ? this._serverUserProductsCache : customerType === "team" ? this._serverTeamProductsCache : this._serverCustomProductsCache;
        await cache.refresh([
            customerId,
            null,
            null
        ]);
    }
    async createTeam(data) {
        const team = await this._interface.createServerTeam((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$teams$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTeamCreateOptionsToCrud"])(data));
        await this._serverTeamsCache.refresh([
            void 0
        ]);
        return this._serverTeamFromCrud(team);
    }
    useTeams() {
        const teams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._serverTeamsCache, [
            void 0
        ], "serverApp.useTeams()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return teams.map((t)=>this._serverTeamFromCrud(t));
        }, [
            teams
        ]);
    }
    async getTeam(options) {
        if (typeof options === "object" && "apiKey" in options) {
            return await this._getTeamByApiKey(options.apiKey);
        } else {
            const teamId = options;
            const teams = await this.listTeams();
            return teams.find((t)=>t.id === teamId) ?? null;
        }
    }
    useTeam(options) {
        if (typeof options === "object" && "apiKey" in options) {
            return this._useTeamByApiKey(options.apiKey);
        } else {
            const teamId = options;
            const teams = this.useTeams();
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
                return teams.find((t)=>t.id === teamId) ?? null;
            }, [
                teams,
                teamId
            ]);
        }
    }
    _createServerDataVaultStore(id) {
        const validateOptions = (options)=>{
            if (typeof options.secret !== "string") throw new Error("secret must be a string, got " + typeof options.secret);
        };
        return {
            id,
            setValue: async (key, value, options)=>{
                validateOptions(options);
                await this._interface.setDataVaultStoreValue(options.secret, id, key, value);
            },
            getValue: async (key, options)=>{
                validateOptions(options);
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._serverDataVaultStoreValueCache.getOrWait([
                    id,
                    key,
                    options.secret
                ], "write-only"));
            },
            useValue: (key, options)=>{
                validateOptions(options);
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._serverDataVaultStoreValueCache, [
                    id,
                    key,
                    options.secret
                ], "store.useValue()");
            }
        };
    }
    async getDataVaultStore(id) {
        return this._createServerDataVaultStore(id);
    }
    useDataVaultStore(id) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>this._createServerDataVaultStore(id), [
            id
        ]);
    }
    async sendEmail(options) {
        await this._interface.sendEmail(options);
    }
    async _refreshSession(session) {
        await Promise.all([
            super._refreshUser(session),
            this._currentServerUserCache.refresh([
                session
            ])
        ]);
    }
    async _refreshUsers() {
        await Promise.all([
            super._refreshUsers(),
            this._serverUserCache.refreshWhere(()=>true),
            this._serverUsersCache.refreshWhere(()=>true),
            this._serverContactChannelsCache.refreshWhere(()=>true),
            this._serverOAuthProvidersCache.refreshWhere(()=>true)
        ]);
    }
    async createOAuthProvider(options) {
        try {
            const crud = await this._interface.createServerOAuthProvider({
                user_id: options.userId,
                provider_config_id: options.providerConfigId,
                account_id: options.accountId,
                email: options.email,
                allow_sign_in: options.allowSignIn,
                allow_connected_accounts: options.allowConnectedAccounts
            });
            await this._serverOAuthProvidersCache.refresh([
                options.userId
            ]);
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(this._serverOAuthProviderFromCrud(crud));
        } catch (error) {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].OAuthProviderAccountIdAlreadyUsedForSignIn.isInstance(error)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(error);
            }
            throw error;
        }
    }
};
;
 //# sourceMappingURL=server-app-impl.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/admin-app-impl.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/apps/implementations/admin-app-impl.ts
__turbopack_context__.s([
    "_StackAdminAppImplIncomplete",
    ()=>_StackAdminAppImplIncomplete
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$admin$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/admin-interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$production$2d$mode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/helpers/production-mode.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/common.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$internal$2d$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/internal-api-keys/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$permissions$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/permissions/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$projects$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/projects/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/common.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$server$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/server-app-impl.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
var _StackAdminAppImplIncomplete = class extends __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$server$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackServerAppImplIncomplete"] {
    constructor(options, extraOptions){
        const resolvedOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveConstructorOptions"])(options);
        super(resolvedOptions, {
            ...extraOptions,
            interface: extraOptions?.interface ?? new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$admin$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAdminInterface"]({
                getBaseUrl: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBaseUrl"])(resolvedOptions.baseUrl),
                projectId: resolvedOptions.projectId ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultProjectId"])(),
                extraRequestHeaders: resolvedOptions.extraRequestHeaders ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultExtraRequestHeaders"])(),
                clientVersion: __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clientVersion"],
                ...resolvedOptions.projectOwnerSession ? {
                    projectOwnerSession: resolvedOptions.projectOwnerSession
                } : {
                    publishableClientKey: resolvedOptions.publishableClientKey ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultPublishableClientKey"])(),
                    secretServerKey: resolvedOptions.secretServerKey ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultSecretServerKey"])(),
                    superSecretAdminKey: resolvedOptions.superSecretAdminKey ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultSuperSecretAdminKey"])()
                }
            })
        });
        this._adminProjectCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.getProject();
        });
        this._internalApiKeysCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            const res = await this._interface.listInternalApiKeys();
            return res;
        });
        this._adminEmailThemeCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([id])=>{
            return await this._interface.getEmailTheme(id);
        });
        this._adminEmailThemesCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.listEmailThemes();
        });
        this._adminEmailTemplatesCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.listInternalEmailTemplates();
        });
        this._adminEmailDraftsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.listInternalEmailDrafts();
        });
        this._adminTeamPermissionDefinitionsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.listTeamPermissionDefinitions();
        });
        this._adminProjectPermissionDefinitionsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.listProjectPermissionDefinitions();
        });
        this._svixTokenCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.getSvixToken();
        });
        this._metricsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([includeAnonymous])=>{
            return await this._interface.getMetrics(includeAnonymous);
        });
        this._emailPreviewCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([themeId, themeTsxSource, templateId, templateTsxSource])=>{
            return await this._interface.renderEmailPreview({
                themeId,
                themeTsxSource,
                templateId,
                templateTsxSource
            });
        });
        this._configOverridesCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            return await this._interface.getConfig();
        });
        this._stripeAccountInfoCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ()=>{
            try {
                return await this._interface.getStripeAccountInfo();
            } catch (error) {
                if (error?.status === 404) {
                    return null;
                }
                throw error;
            }
        });
        this._transactionsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCache"])(async ([cursor, limit, type, customerType])=>{
            return await this._interface.listTransactions({
                cursor,
                limit,
                type,
                customerType
            });
        });
    }
    _adminConfigFromCrud(data) {
        return JSON.parse(data.config_string);
    }
    _adminOwnedProjectFromCrud(data, onRefresh) {
        if (this._tokenStoreInit !== null) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Owned apps must always have tokenStore === null \u2014 did you not create this project with app._createOwnedApp()?");
        }
        return {
            ...this._adminProjectFromCrud(data, onRefresh),
            app: this
        };
    }
    _adminProjectFromCrud(data, onRefresh) {
        if (data.id !== this.projectId) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`The project ID of the provided project JSON (${data.id}) does not match the project ID of the app (${this.projectId})!`);
        }
        const app = this;
        return {
            id: data.id,
            displayName: data.display_name,
            description: data.description,
            createdAt: new Date(data.created_at_millis),
            isProductionMode: data.is_production_mode,
            ownerTeamId: data.owner_team_id,
            logoUrl: data.logo_url,
            fullLogoUrl: data.full_logo_url,
            config: {
                signUpEnabled: data.config.sign_up_enabled,
                credentialEnabled: data.config.credential_enabled,
                magicLinkEnabled: data.config.magic_link_enabled,
                passkeyEnabled: data.config.passkey_enabled,
                clientTeamCreationEnabled: data.config.client_team_creation_enabled,
                clientUserDeletionEnabled: data.config.client_user_deletion_enabled,
                allowLocalhost: data.config.allow_localhost,
                oauthAccountMergeStrategy: data.config.oauth_account_merge_strategy,
                allowUserApiKeys: data.config.allow_user_api_keys,
                allowTeamApiKeys: data.config.allow_team_api_keys,
                oauthProviders: data.config.oauth_providers.map((p)=>p.type === "shared" ? {
                        id: p.id,
                        type: "shared"
                    } : {
                        id: p.id,
                        type: "standard",
                        clientId: p.client_id ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Client ID is missing"),
                        clientSecret: p.client_secret ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Client secret is missing"),
                        facebookConfigId: p.facebook_config_id,
                        microsoftTenantId: p.microsoft_tenant_id
                    }),
                emailConfig: data.config.email_config.type === "shared" ? {
                    type: "shared"
                } : {
                    type: "standard",
                    host: data.config.email_config.host ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Email host is missing"),
                    port: data.config.email_config.port ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Email port is missing"),
                    username: data.config.email_config.username ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Email username is missing"),
                    password: data.config.email_config.password ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Email password is missing"),
                    senderName: data.config.email_config.sender_name ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Email sender name is missing"),
                    senderEmail: data.config.email_config.sender_email ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Email sender email is missing")
                },
                emailTheme: data.config.email_theme,
                domains: data.config.domains.map((d)=>({
                        domain: d.domain,
                        handlerPath: d.handler_path
                    })),
                createTeamOnSignUp: data.config.create_team_on_sign_up,
                teamCreatorDefaultPermissions: data.config.team_creator_default_permissions,
                teamMemberDefaultPermissions: data.config.team_member_default_permissions,
                userDefaultPermissions: data.config.user_default_permissions
            },
            async getConfig () {
                return app._adminConfigFromCrud(await app._interface.getConfig());
            },
            useConfig () {
                const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(app._configOverridesCache, [], "project.useConfig()");
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>app._adminConfigFromCrud(config), [
                    config
                ]);
            },
            async updateConfig (configOverride) {
                await app._interface.updateConfig({
                    configOverride
                });
                await app._configOverridesCache.refresh([]);
            },
            async update (update) {
                const updateOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$projects$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adminProjectUpdateOptionsToCrud"])(update);
                await app._interface.updateProject(updateOptions);
                await onRefresh();
            },
            async delete () {
                await app._interface.deleteProject();
            },
            async getProductionModeErrors () {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$production$2d$mode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProductionModeErrors"])(data);
            },
            useProductionModeErrors () {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$production$2d$mode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProductionModeErrors"])(data);
            }
        };
    }
    _adminEmailTemplateFromCrud(data) {
        return {
            type: data.type,
            subject: data.subject,
            content: data.content,
            isDefault: data.is_default
        };
    }
    async getProject() {
        return this._adminProjectFromCrud(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._adminProjectCache.getOrWait([], "write-only")), ()=>this._refreshProject());
    }
    useProject() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._adminProjectCache, [], "adminApp.useProject()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>this._adminProjectFromCrud(crud, ()=>this._refreshProject()), [
            crud
        ]);
    }
    _createInternalApiKeyBaseFromCrud(data) {
        const app = this;
        return {
            id: data.id,
            description: data.description,
            expiresAt: new Date(data.expires_at_millis),
            manuallyRevokedAt: data.manually_revoked_at_millis ? new Date(data.manually_revoked_at_millis) : null,
            createdAt: new Date(data.created_at_millis),
            isValid () {
                return this.whyInvalid() === null;
            },
            whyInvalid () {
                if (this.expiresAt.getTime() < Date.now()) return "expired";
                if (this.manuallyRevokedAt) return "manually-revoked";
                return null;
            },
            async revoke () {
                const res = await app._interface.revokeInternalApiKeyById(data.id);
                await app._refreshInternalApiKeys();
                return res;
            }
        };
    }
    _createInternalApiKeyFromCrud(data) {
        return {
            ...this._createInternalApiKeyBaseFromCrud(data),
            publishableClientKey: data.publishable_client_key ? {
                lastFour: data.publishable_client_key.last_four
            } : null,
            secretServerKey: data.secret_server_key ? {
                lastFour: data.secret_server_key.last_four
            } : null,
            superSecretAdminKey: data.super_secret_admin_key ? {
                lastFour: data.super_secret_admin_key.last_four
            } : null
        };
    }
    _createInternalApiKeyFirstViewFromCrud(data) {
        return {
            ...this._createInternalApiKeyBaseFromCrud(data),
            publishableClientKey: data.publishable_client_key,
            secretServerKey: data.secret_server_key,
            superSecretAdminKey: data.super_secret_admin_key
        };
    }
    async listInternalApiKeys() {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._internalApiKeysCache.getOrWait([], "write-only"));
        return crud.map((j)=>this._createInternalApiKeyFromCrud(j));
    }
    useInternalApiKeys() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._internalApiKeysCache, [], "adminApp.useInternalApiKeys()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud.map((j)=>this._createInternalApiKeyFromCrud(j));
        }, [
            crud
        ]);
    }
    async createInternalApiKey(options) {
        const crud = await this._interface.createInternalApiKey((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$internal$2d$api$2d$keys$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["internalApiKeyCreateOptionsToCrud"])(options));
        await this._refreshInternalApiKeys();
        return this._createInternalApiKeyFirstViewFromCrud(crud);
    }
    useEmailThemes() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._adminEmailThemesCache, [], "adminApp.useEmailThemes()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud.map((theme)=>({
                    id: theme.id,
                    displayName: theme.display_name
                }));
        }, [
            crud
        ]);
    }
    useEmailTemplates() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._adminEmailTemplatesCache, [], "adminApp.useEmailTemplates()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud.map((template)=>({
                    id: template.id,
                    displayName: template.display_name,
                    themeId: template.theme_id,
                    tsxSource: template.tsx_source
                }));
        }, [
            crud
        ]);
    }
    useEmailDrafts() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._adminEmailDraftsCache, [], "adminApp.useEmailDrafts()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud.map((draft)=>({
                    id: draft.id,
                    displayName: draft.display_name,
                    themeId: draft.theme_id,
                    tsxSource: draft.tsx_source,
                    sentAt: draft.sent_at_millis ? new Date(draft.sent_at_millis) : null
                }));
        }, [
            crud
        ]);
    }
    async listEmailThemes() {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._adminEmailThemesCache.getOrWait([], "write-only"));
        return crud.map((theme)=>({
                id: theme.id,
                displayName: theme.display_name
            }));
    }
    async listEmailTemplates() {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._adminEmailTemplatesCache.getOrWait([], "write-only"));
        return crud.map((template)=>({
                id: template.id,
                displayName: template.display_name,
                themeId: template.theme_id,
                tsxSource: template.tsx_source
            }));
    }
    async listEmailDrafts() {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._adminEmailDraftsCache.getOrWait([], "write-only"));
        return crud.map((draft)=>({
                id: draft.id,
                displayName: draft.display_name,
                themeId: draft.theme_id,
                tsxSource: draft.tsx_source,
                sentAt: draft.sent_at_millis ? new Date(draft.sent_at_millis) : null
            }));
    }
    async createTeamPermissionDefinition(data) {
        const crud = await this._interface.createTeamPermissionDefinition((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$permissions$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adminTeamPermissionDefinitionCreateOptionsToCrud"])(data));
        await this._adminTeamPermissionDefinitionsCache.refresh([]);
        return this._serverTeamPermissionDefinitionFromCrud(crud);
    }
    async updateTeamPermissionDefinition(permissionId, data) {
        await this._interface.updateTeamPermissionDefinition(permissionId, (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$permissions$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adminTeamPermissionDefinitionUpdateOptionsToCrud"])(data));
        await this._adminTeamPermissionDefinitionsCache.refresh([]);
    }
    async deleteTeamPermissionDefinition(permissionId) {
        await this._interface.deleteTeamPermissionDefinition(permissionId);
        await this._adminTeamPermissionDefinitionsCache.refresh([]);
    }
    async listTeamPermissionDefinitions() {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._adminTeamPermissionDefinitionsCache.getOrWait([], "write-only"));
        return crud.map((p)=>this._serverTeamPermissionDefinitionFromCrud(p));
    }
    useTeamPermissionDefinitions() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._adminTeamPermissionDefinitionsCache, [], "adminApp.useTeamPermissionDefinitions()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud.map((p)=>this._serverTeamPermissionDefinitionFromCrud(p));
        }, [
            crud
        ]);
    }
    async createProjectPermissionDefinition(data) {
        const crud = await this._interface.createProjectPermissionDefinition((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$permissions$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adminProjectPermissionDefinitionCreateOptionsToCrud"])(data));
        await this._adminProjectPermissionDefinitionsCache.refresh([]);
        return this._serverProjectPermissionDefinitionFromCrud(crud);
    }
    async updateProjectPermissionDefinition(permissionId, data) {
        await this._interface.updateProjectPermissionDefinition(permissionId, (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$permissions$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["adminProjectPermissionDefinitionUpdateOptionsToCrud"])(data));
        await this._adminProjectPermissionDefinitionsCache.refresh([]);
    }
    async deleteProjectPermissionDefinition(permissionId) {
        await this._interface.deleteProjectPermissionDefinition(permissionId);
        await this._adminProjectPermissionDefinitionsCache.refresh([]);
    }
    async listProjectPermissionDefinitions() {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._adminProjectPermissionDefinitionsCache.getOrWait([], "write-only"));
        return crud.map((p)=>this._serverProjectPermissionDefinitionFromCrud(p));
    }
    useProjectPermissionDefinitions() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._adminProjectPermissionDefinitionsCache, [], "adminApp.useProjectPermissionDefinitions()");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
            return crud.map((p)=>this._serverProjectPermissionDefinitionFromCrud(p));
        }, [
            crud
        ]);
    }
    useSvixToken() {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._svixTokenCache, [], "adminApp.useSvixToken()");
        return crud.token;
    }
    async _refreshProject() {
        await Promise.all([
            super._refreshProject(),
            this._adminProjectCache.refresh([])
        ]);
    }
    async _refreshInternalApiKeys() {
        await this._internalApiKeysCache.refresh([]);
    }
    get [__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]]() {
        return {
            ...super[__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]],
            useMetrics: (includeAnonymous = false)=>{
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._metricsCache, [
                    includeAnonymous
                ], "adminApp.useMetrics()");
            }
        };
    }
    async sendTestEmail(options) {
        const response = await this._interface.sendTestEmail({
            recipient_email: options.recipientEmail,
            email_config: {
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pick"])(options.emailConfig, [
                    "host",
                    "port",
                    "username",
                    "password"
                ]),
                sender_email: options.emailConfig.senderEmail,
                sender_name: options.emailConfig.senderName
            }
        });
        if (response.success) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error({
                errorMessage: response.error_message ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Email test error not specified")
            });
        }
    }
    async listSentEmails() {
        const response = await this._interface.listSentEmails();
        return response.items.map((email)=>({
                id: email.id,
                to: email.to ?? [],
                subject: email.subject,
                recipient: email.to?.[0] ?? "",
                sentAt: new Date(email.sent_at_millis),
                error: email.error
            }));
    }
    async sendSignInInvitationEmail(email, callbackUrl) {
        await this._interface.sendSignInInvitationEmail(email, callbackUrl);
    }
    async createEmailTemplate(displayName) {
        const result = await this._interface.createEmailTemplate(displayName);
        await this._adminEmailTemplatesCache.refresh([]);
        return result;
    }
    async createEmailDraft(options) {
        const result = await this._interface.createEmailDraft({
            display_name: options.displayName,
            theme_id: options.themeId,
            tsx_source: options.tsxSource
        });
        await this._adminEmailDraftsCache.refresh([]);
        return result;
    }
    async updateEmailDraft(id, data) {
        await this._interface.updateEmailDraft(id, {
            display_name: data.displayName,
            theme_id: data.themeId,
            tsx_source: data.tsxSource
        });
        await this._adminEmailDraftsCache.refresh([]);
    }
    async sendChatMessage(threadId, contextType, messages, abortSignal) {
        return await this._interface.sendChatMessage(threadId, contextType, messages, abortSignal);
    }
    async saveChatMessage(threadId, message) {
        await this._interface.saveChatMessage(threadId, message);
    }
    async listChatMessages(threadId) {
        return await this._interface.listChatMessages(threadId);
    }
    async createEmailTheme(displayName) {
        const result = await this._interface.createEmailTheme(displayName);
        await this._adminEmailThemesCache.refresh([]);
        return result;
    }
    async getEmailPreview(options) {
        return (await this._interface.renderEmailPreview(options)).html;
    }
    useEmailPreview(options) {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._emailPreviewCache, [
            options.themeId,
            options.themeTsxSource,
            options.templateId,
            options.templateTsxSource
        ], "adminApp.useEmailPreview()");
        return crud.html;
    }
    useEmailTheme(id) {
        const crud = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._adminEmailThemeCache, [
            id
        ], "adminApp.useEmailTheme()");
        return {
            displayName: crud.display_name,
            tsxSource: crud.tsx_source
        };
    }
    async updateEmailTheme(id, tsxSource) {
        await this._interface.updateEmailTheme(id, tsxSource);
    }
    async updateEmailTemplate(id, tsxSource, themeId) {
        const result = await this._interface.updateEmailTemplate(id, tsxSource, themeId);
        await this._adminEmailTemplatesCache.refresh([]);
        return {
            renderedHtml: result.rendered_html
        };
    }
    async setupPayments() {
        return await this._interface.setupPayments();
    }
    async createStripeWidgetAccountSession() {
        return await this._interface.createStripeWidgetAccountSession();
    }
    async createItemQuantityChange(options) {
        await this._interface.updateItemQuantity({
            itemId: options.itemId,
            ..."userId" in options ? {
                userId: options.userId
            } : "teamId" in options ? {
                teamId: options.teamId
            } : {
                customCustomerId: options.customCustomerId
            }
        }, {
            delta: options.quantity,
            expires_at: options.expiresAt,
            description: options.description,
            allow_negative: true
        });
    }
    async listTransactions(params) {
        const crud = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await this._transactionsCache.getOrWait([
            params.cursor,
            params.limit,
            params.type,
            params.customerType
        ], "write-only"));
        return crud;
    }
    useTransactions(params) {
        const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._transactionsCache, [
            params.cursor,
            params.limit,
            params.type,
            params.customerType
        ], "adminApp.useTransactions()");
        return data;
    }
    async getStripeAccountInfo() {
        return await this._interface.getStripeAccountInfo();
    }
    useStripeAccountInfo() {
        const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAsyncCache"])(this._stripeAccountInfoCache, [], "adminApp.useStripeAccountInfo()");
        return data;
    }
};
;
 //# sourceMappingURL=admin-app-impl.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/apps/implementations/index.ts
__turbopack_context__.s([
    "_StackAdminAppImpl",
    ()=>_StackAdminAppImpl,
    "_StackClientAppImpl",
    ()=>_StackClientAppImpl,
    "_StackServerAppImpl",
    ()=>_StackServerAppImpl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$compile$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/compile-time.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$admin$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/admin-app-impl.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$client$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/client-app-impl.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$server$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/server-app-impl.js [app-client] (ecmascript)");
;
;
;
;
function complete() {
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$client$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackClientAppImplIncomplete"].LazyStackAdminAppImpl.value = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$admin$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackAdminAppImplIncomplete"];
    return {
        _StackAdminAppImpl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$compile$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scrambleDuringCompileTime"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$admin$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackAdminAppImplIncomplete"]),
        _StackClientAppImpl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$compile$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scrambleDuringCompileTime"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$client$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackClientAppImplIncomplete"]),
        _StackServerAppImpl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$compile$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scrambleDuringCompileTime"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$server$2d$app$2d$impl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackServerAppImplIncomplete"])
    };
}
var { _StackAdminAppImpl, _StackClientAppImpl, _StackServerAppImpl } = complete();
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/interfaces/client-app.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/stack-app/apps/interfaces/client-app.ts
__turbopack_context__.s([
    "StackClientApp",
    ()=>StackClientApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/index.js [app-client] (ecmascript)");
;
var StackClientApp = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_StackClientAppImpl"];
;
 //# sourceMappingURL=client-app.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/providers/stack-provider-client.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StackContext",
    ()=>StackContext,
    "StackProviderClient",
    ()=>StackProviderClient,
    "UserSetter",
    ()=>UserSetter
]);
// src/providers/stack-provider-client.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/globals.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$interfaces$2f$client$2d$app$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/interfaces/client-app.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/lib/stack-app/common.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
"use client";
"use client";
;
;
;
;
;
var StackContext = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createContext(null);
function StackProviderClient(props) {
    const app = props.serialized ? __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$interfaces$2f$client$2d$app$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackClientApp"][__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]].fromClientJson(props.app) : props.app;
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].__STACK_AUTH__ = {
        app
    };
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(StackContext.Provider, {
        value: {
            app
        },
        children: props.children
    });
}
function UserSetter(props) {
    const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStackApp"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserSetter.useEffect": ()=>{
            const promise = ({
                "UserSetter.useEffect.promise": async ()=>await props.userJsonPromise
            })["UserSetter.useEffect.promise"]();
            app[__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]].setCurrentUser(promise);
        }
    }["UserSetter.useEffect"], []);
    return null;
}
;
 //# sourceMappingURL=stack-provider-client.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/providers/translation-provider-client.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TranslationContext",
    ()=>TranslationContext,
    "TranslationProviderClient",
    ()=>TranslationProviderClient
]);
// src/providers/translation-provider-client.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
"use client";
"use client";
;
;
var TranslationContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function TranslationProviderClient(props) {
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(TranslationContext.Provider, {
        value: {
            quetzalKeys: props.quetzalKeys,
            quetzalLocale: props.quetzalLocale
        },
        children: props.children
    });
}
;
 //# sourceMappingURL=translation-provider-client.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/generated/global-css.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/generated/global-css.ts
__turbopack_context__.s([
    "globalCSS",
    ()=>globalCSS
]);
var globalCSS = ':where(.stack-scope) *, :where(.stack-scope) ::before, :where(.stack-scope) ::after, *:where(.stack-scope), :where(.stack-scope)::before, :where(.stack-scope)::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-gradient-from-position:  ;\n  --tw-gradient-via-position:  ;\n  --tw-gradient-to-position:  ;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n  --tw-contain-size:  ;\n  --tw-contain-layout:  ;\n  --tw-contain-paint:  ;\n  --tw-contain-style:  ;\n}\n:where(.stack-scope) ::backdrop, :where(.stack-scope)::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-gradient-from-position:  ;\n  --tw-gradient-via-position:  ;\n  --tw-gradient-to-position:  ;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n  --tw-contain-size:  ;\n  --tw-contain-layout:  ;\n  --tw-contain-paint:  ;\n  --tw-contain-style:  ;\n}\n/*\n! tailwindcss v3.4.14 | MIT License | https://tailwindcss.com\n*/\n/*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n:where(.stack-scope) *,\n:where(.stack-scope) ::before,\n:where(.stack-scope) ::after,\n*:where(.stack-scope),\n:where(.stack-scope)::before,\n:where(.stack-scope)::after {\n  box-sizing: border-box;\n  /* 1 */\n  border-width: 0;\n  /* 2 */\n  border-style: solid;\n  /* 2 */\n  border-color: #e5e7eb;\n  /* 2 */\n}\n:where(.stack-scope) ::before,\n:where(.stack-scope) ::after,\n:where(.stack-scope)::before,\n:where(.stack-scope)::after {\n  --tw-content: \'\';\n}\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user\'s configured `sans` font-family by default.\n5. Use the user\'s configured `sans` font-feature-settings by default.\n6. Use the user\'s configured `sans` font-variation-settings by default.\n7. Disable tap highlights on iOS\n*/\n:where(.stack-scope) html,\n:where(.stack-scope) :host,\nhtml:where(.stack-scope),\n:where(.stack-scope):host {\n  line-height: 1.5;\n  /* 1 */\n  -webkit-text-size-adjust: 100%;\n  /* 2 */\n  -moz-tab-size: 4;\n  /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4;\n  /* 3 */\n  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";\n  /* 4 */\n  font-feature-settings: normal;\n  /* 5 */\n  font-variation-settings: normal;\n  /* 6 */\n  -webkit-tap-highlight-color: transparent;\n  /* 7 */\n}\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n:where(.stack-scope) body, body:where(.stack-scope) {\n  margin: 0;\n  /* 1 */\n  line-height: inherit;\n  /* 2 */\n}\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n:where(.stack-scope) hr, hr:where(.stack-scope) {\n  height: 0;\n  /* 1 */\n  color: inherit;\n  /* 2 */\n  border-top-width: 1px;\n  /* 3 */\n}\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n:where(.stack-scope) abbr:where([title]), abbr:where(.stack-scope):where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n/*\nRemove the default font size and weight for headings.\n*/\n:where(.stack-scope) h1,\n:where(.stack-scope) h2,\n:where(.stack-scope) h3,\n:where(.stack-scope) h4,\n:where(.stack-scope) h5,\n:where(.stack-scope) h6,\nh1:where(.stack-scope),\nh2:where(.stack-scope),\nh3:where(.stack-scope),\nh4:where(.stack-scope),\nh5:where(.stack-scope),\nh6:where(.stack-scope) {\n  font-size: inherit;\n  font-weight: inherit;\n}\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n:where(.stack-scope) a, a:where(.stack-scope) {\n  color: inherit;\n  text-decoration: inherit;\n}\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n:where(.stack-scope) b,\n:where(.stack-scope) strong,\nb:where(.stack-scope),\nstrong:where(.stack-scope) {\n  font-weight: bolder;\n}\n/*\n1. Use the user\'s configured `mono` font-family by default.\n2. Use the user\'s configured `mono` font-feature-settings by default.\n3. Use the user\'s configured `mono` font-variation-settings by default.\n4. Correct the odd `em` font sizing in all browsers.\n*/\n:where(.stack-scope) code,\n:where(.stack-scope) kbd,\n:where(.stack-scope) samp,\n:where(.stack-scope) pre,\ncode:where(.stack-scope),\nkbd:where(.stack-scope),\nsamp:where(.stack-scope),\npre:where(.stack-scope) {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;\n  /* 1 */\n  font-feature-settings: normal;\n  /* 2 */\n  font-variation-settings: normal;\n  /* 3 */\n  font-size: 1em;\n  /* 4 */\n}\n/*\nAdd the correct font size in all browsers.\n*/\n:where(.stack-scope) small, small:where(.stack-scope) {\n  font-size: 80%;\n}\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n:where(.stack-scope) sub,\n:where(.stack-scope) sup,\nsub:where(.stack-scope),\nsup:where(.stack-scope) {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n:where(.stack-scope) sub, sub:where(.stack-scope) {\n  bottom: -0.25em;\n}\n:where(.stack-scope) sup, sup:where(.stack-scope) {\n  top: -0.5em;\n}\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n:where(.stack-scope) table, table:where(.stack-scope) {\n  text-indent: 0;\n  /* 1 */\n  border-color: inherit;\n  /* 2 */\n  border-collapse: collapse;\n  /* 3 */\n}\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n:where(.stack-scope) button,\n:where(.stack-scope) input,\n:where(.stack-scope) optgroup,\n:where(.stack-scope) select,\n:where(.stack-scope) textarea,\nbutton:where(.stack-scope),\ninput:where(.stack-scope),\noptgroup:where(.stack-scope),\nselect:where(.stack-scope),\ntextarea:where(.stack-scope) {\n  font-family: inherit;\n  /* 1 */\n  font-feature-settings: inherit;\n  /* 1 */\n  font-variation-settings: inherit;\n  /* 1 */\n  font-size: 100%;\n  /* 1 */\n  font-weight: inherit;\n  /* 1 */\n  line-height: inherit;\n  /* 1 */\n  letter-spacing: inherit;\n  /* 1 */\n  color: inherit;\n  /* 1 */\n  margin: 0;\n  /* 2 */\n  padding: 0;\n  /* 3 */\n}\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n:where(.stack-scope) button,\n:where(.stack-scope) select,\nbutton:where(.stack-scope),\nselect:where(.stack-scope) {\n  text-transform: none;\n}\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n:where(.stack-scope) button,\n:where(.stack-scope) input:where([type=\'button\']),\n:where(.stack-scope) input:where([type=\'reset\']),\n:where(.stack-scope) input:where([type=\'submit\']),\nbutton:where(.stack-scope),\ninput:where(.stack-scope):where([type=\'button\']),\ninput:where(.stack-scope):where([type=\'reset\']),\ninput:where(.stack-scope):where([type=\'submit\']) {\n  -webkit-appearance: button;\n  /* 1 */\n  background-color: transparent;\n  /* 2 */\n  background-image: none;\n  /* 2 */\n}\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n:where(.stack-scope) :-moz-focusring, :where(.stack-scope):-moz-focusring {\n  outline: auto;\n}\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n:where(.stack-scope) :-moz-ui-invalid, :where(.stack-scope):-moz-ui-invalid {\n  box-shadow: none;\n}\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n:where(.stack-scope) progress, progress:where(.stack-scope) {\n  vertical-align: baseline;\n}\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n:where(.stack-scope) ::-webkit-inner-spin-button,\n:where(.stack-scope) ::-webkit-outer-spin-button,\n:where(.stack-scope)::-webkit-inner-spin-button,\n:where(.stack-scope)::-webkit-outer-spin-button {\n  height: auto;\n}\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n:where(.stack-scope) [type=\'search\'], [type=\'search\'] :where(.stack-scope) {\n  -webkit-appearance: textfield;\n  /* 1 */\n  outline-offset: -2px;\n  /* 2 */\n}\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n:where(.stack-scope) ::-webkit-search-decoration, :where(.stack-scope)::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n:where(.stack-scope) ::-webkit-file-upload-button, :where(.stack-scope)::-webkit-file-upload-button {\n  -webkit-appearance: button;\n  /* 1 */\n  font: inherit;\n  /* 2 */\n}\n/*\nAdd the correct display in Chrome and Safari.\n*/\n:where(.stack-scope) summary, summary:where(.stack-scope) {\n  display: list-item;\n}\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n:where(.stack-scope) blockquote,\n:where(.stack-scope) dl,\n:where(.stack-scope) dd,\n:where(.stack-scope) h1,\n:where(.stack-scope) h2,\n:where(.stack-scope) h3,\n:where(.stack-scope) h4,\n:where(.stack-scope) h5,\n:where(.stack-scope) h6,\n:where(.stack-scope) hr,\n:where(.stack-scope) figure,\n:where(.stack-scope) p,\n:where(.stack-scope) pre,\nblockquote:where(.stack-scope),\ndl:where(.stack-scope),\ndd:where(.stack-scope),\nh1:where(.stack-scope),\nh2:where(.stack-scope),\nh3:where(.stack-scope),\nh4:where(.stack-scope),\nh5:where(.stack-scope),\nh6:where(.stack-scope),\nhr:where(.stack-scope),\nfigure:where(.stack-scope),\np:where(.stack-scope),\npre:where(.stack-scope) {\n  margin: 0;\n}\n:where(.stack-scope) fieldset, fieldset:where(.stack-scope) {\n  margin: 0;\n  padding: 0;\n}\n:where(.stack-scope) legend, legend:where(.stack-scope) {\n  padding: 0;\n}\n:where(.stack-scope) ol,\n:where(.stack-scope) ul,\n:where(.stack-scope) menu,\nol:where(.stack-scope),\nul:where(.stack-scope),\nmenu:where(.stack-scope) {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n/*\nReset default styling for dialogs.\n*/\n:where(.stack-scope) dialog, dialog:where(.stack-scope) {\n  padding: 0;\n}\n/*\nPrevent resizing textareas horizontally by default.\n*/\n:where(.stack-scope) textarea, textarea:where(.stack-scope) {\n  resize: vertical;\n}\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user\'s configured gray 400 color.\n*/\n:where(.stack-scope) input::-moz-placeholder, :where(.stack-scope) textarea::-moz-placeholder, input:where(.stack-scope)::-moz-placeholder, textarea:where(.stack-scope)::-moz-placeholder {\n  opacity: 1;\n  /* 1 */\n  color: #9ca3af;\n  /* 2 */\n}\n:where(.stack-scope) input::placeholder,\n:where(.stack-scope) textarea::placeholder,\ninput:where(.stack-scope)::placeholder,\ntextarea:where(.stack-scope)::placeholder {\n  opacity: 1;\n  /* 1 */\n  color: #9ca3af;\n  /* 2 */\n}\n/*\nSet the default cursor for buttons.\n*/\n:where(.stack-scope) button,\n:where(.stack-scope) [role="button"],\nbutton:where(.stack-scope),\n[role="button"] :where(.stack-scope) {\n  cursor: pointer;\n}\n/*\nMake sure disabled buttons don\'t get the pointer cursor.\n*/\n:where(.stack-scope) :disabled, :where(.stack-scope):disabled {\n  cursor: default;\n}\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n:where(.stack-scope) img,\n:where(.stack-scope) svg,\n:where(.stack-scope) video,\n:where(.stack-scope) canvas,\n:where(.stack-scope) audio,\n:where(.stack-scope) iframe,\n:where(.stack-scope) embed,\n:where(.stack-scope) object,\nimg:where(.stack-scope),\nsvg:where(.stack-scope),\nvideo:where(.stack-scope),\ncanvas:where(.stack-scope),\naudio:where(.stack-scope),\niframe:where(.stack-scope),\nembed:where(.stack-scope),\nobject:where(.stack-scope) {\n  display: block;\n  /* 1 */\n  vertical-align: middle;\n  /* 2 */\n}\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n:where(.stack-scope) img,\n:where(.stack-scope) video,\nimg:where(.stack-scope),\nvideo:where(.stack-scope) {\n  max-width: 100%;\n  height: auto;\n}\n/* Make elements with the HTML hidden attribute stay hidden by default */\n:where(.stack-scope) [hidden]:where(:not([hidden="until-found"])), [hidden] :where(.stack-scope):where(:not([hidden="until-found"])) {\n  display: none;\n}\n:where(.stack-scope) .container, :where(.stack-scope).container {\n  width: 100%;\n  margin-right: auto;\n  margin-left: auto;\n  padding-right: 2rem;\n  padding-left: 2rem;\n}\n@media (min-width: 1400px) {\n  :where(.stack-scope) .container, :where(.stack-scope).container {\n    max-width: 1400px;\n  }\n}\n:where(.stack-scope) .sr-only, :where(.stack-scope).sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border-width: 0;\n}\n:where(.stack-scope) .pointer-events-none, :where(.stack-scope).pointer-events-none {\n  pointer-events: none;\n}\n:where(.stack-scope) .pointer-events-auto, :where(.stack-scope).pointer-events-auto {\n  pointer-events: auto;\n}\n:where(.stack-scope) .visible, :where(.stack-scope).visible {\n  visibility: visible;\n}\n:where(.stack-scope) .invisible, :where(.stack-scope).invisible {\n  visibility: hidden;\n}\n:where(.stack-scope) .collapse, :where(.stack-scope).collapse {\n  visibility: collapse;\n}\n:where(.stack-scope) .static, :where(.stack-scope).static {\n  position: static;\n}\n:where(.stack-scope) .fixed, :where(.stack-scope).fixed {\n  position: fixed;\n}\n:where(.stack-scope) .absolute, :where(.stack-scope).absolute {\n  position: absolute;\n}\n:where(.stack-scope) .relative, :where(.stack-scope).relative {\n  position: relative;\n}\n:where(.stack-scope) .inset-0, :where(.stack-scope).inset-0 {\n  inset: 0px;\n}\n:where(.stack-scope) .inset-x-0, :where(.stack-scope).inset-x-0 {\n  left: 0px;\n  right: 0px;\n}\n:where(.stack-scope) .inset-y-0, :where(.stack-scope).inset-y-0 {\n  top: 0px;\n  bottom: 0px;\n}\n:where(.stack-scope) .-right-2, :where(.stack-scope).-right-2 {\n  right: -0.5rem;\n}\n:where(.stack-scope) .-top-2, :where(.stack-scope).-top-2 {\n  top: -0.5rem;\n}\n:where(.stack-scope) .bottom-0, :where(.stack-scope).bottom-0 {\n  bottom: 0px;\n}\n:where(.stack-scope) .left-0, :where(.stack-scope).left-0 {\n  left: 0px;\n}\n:where(.stack-scope) .left-1, :where(.stack-scope).left-1 {\n  left: 0.25rem;\n}\n:where(.stack-scope) .left-2, :where(.stack-scope).left-2 {\n  left: 0.5rem;\n}\n:where(.stack-scope) .left-3, :where(.stack-scope).left-3 {\n  left: 0.75rem;\n}\n:where(.stack-scope) .left-4, :where(.stack-scope).left-4 {\n  left: 1rem;\n}\n:where(.stack-scope) .left-\\[50\\%\\], :where(.stack-scope).left-\\[50\\%\\] {\n  left: 50%;\n}\n:where(.stack-scope) .right-0, :where(.stack-scope).right-0 {\n  right: 0px;\n}\n:where(.stack-scope) .right-1, :where(.stack-scope).right-1 {\n  right: 0.25rem;\n}\n:where(.stack-scope) .right-2, :where(.stack-scope).right-2 {\n  right: 0.5rem;\n}\n:where(.stack-scope) .right-3, :where(.stack-scope).right-3 {\n  right: 0.75rem;\n}\n:where(.stack-scope) .right-4, :where(.stack-scope).right-4 {\n  right: 1rem;\n}\n:where(.stack-scope) .top-0, :where(.stack-scope).top-0 {\n  top: 0px;\n}\n:where(.stack-scope) .top-1, :where(.stack-scope).top-1 {\n  top: 0.25rem;\n}\n:where(.stack-scope) .top-2, :where(.stack-scope).top-2 {\n  top: 0.5rem;\n}\n:where(.stack-scope) .top-4, :where(.stack-scope).top-4 {\n  top: 1rem;\n}\n:where(.stack-scope) .top-\\[1px\\], :where(.stack-scope).top-\\[1px\\] {\n  top: 1px;\n}\n:where(.stack-scope) .top-\\[50\\%\\], :where(.stack-scope).top-\\[50\\%\\] {\n  top: 50%;\n}\n:where(.stack-scope) .top-\\[60\\%\\], :where(.stack-scope).top-\\[60\\%\\] {\n  top: 60%;\n}\n:where(.stack-scope) .top-auto, :where(.stack-scope).top-auto {\n  top: auto;\n}\n:where(.stack-scope) .top-full, :where(.stack-scope).top-full {\n  top: 100%;\n}\n:where(.stack-scope) .z-10, :where(.stack-scope).z-10 {\n  z-index: 10;\n}\n:where(.stack-scope) .z-30, :where(.stack-scope).z-30 {\n  z-index: 30;\n}\n:where(.stack-scope) .z-50, :where(.stack-scope).z-50 {\n  z-index: 50;\n}\n:where(.stack-scope) .z-\\[100\\], :where(.stack-scope).z-\\[100\\] {\n  z-index: 100;\n}\n:where(.stack-scope) .z-\\[1\\], :where(.stack-scope).z-\\[1\\] {\n  z-index: 1;\n}\n:where(.stack-scope) .-mx-1, :where(.stack-scope).-mx-1 {\n  margin-left: -0.25rem;\n  margin-right: -0.25rem;\n}\n:where(.stack-scope) .-mx-6, :where(.stack-scope).-mx-6 {\n  margin-left: -1.5rem;\n  margin-right: -1.5rem;\n}\n:where(.stack-scope) .mx-2, :where(.stack-scope).mx-2 {\n  margin-left: 0.5rem;\n  margin-right: 0.5rem;\n}\n:where(.stack-scope) .my-1, :where(.stack-scope).my-1 {\n  margin-top: 0.25rem;\n  margin-bottom: 0.25rem;\n}\n:where(.stack-scope) .my-2, :where(.stack-scope).my-2 {\n  margin-top: 0.5rem;\n  margin-bottom: 0.5rem;\n}\n:where(.stack-scope) .my-5, :where(.stack-scope).my-5 {\n  margin-top: 1.25rem;\n  margin-bottom: 1.25rem;\n}\n:where(.stack-scope) .my-6, :where(.stack-scope).my-6 {\n  margin-top: 1.5rem;\n  margin-bottom: 1.5rem;\n}\n:where(.stack-scope) .-ml-3, :where(.stack-scope).-ml-3 {\n  margin-left: -0.75rem;\n}\n:where(.stack-scope) .mb-1, :where(.stack-scope).mb-1 {\n  margin-bottom: 0.25rem;\n}\n:where(.stack-scope) .mb-2, :where(.stack-scope).mb-2 {\n  margin-bottom: 0.5rem;\n}\n:where(.stack-scope) .mb-4, :where(.stack-scope).mb-4 {\n  margin-bottom: 1rem;\n}\n:where(.stack-scope) .mb-6, :where(.stack-scope).mb-6 {\n  margin-bottom: 1.5rem;\n}\n:where(.stack-scope) .ml-1, :where(.stack-scope).ml-1 {\n  margin-left: 0.25rem;\n}\n:where(.stack-scope) .ml-2, :where(.stack-scope).ml-2 {\n  margin-left: 0.5rem;\n}\n:where(.stack-scope) .ml-auto, :where(.stack-scope).ml-auto {\n  margin-left: auto;\n}\n:where(.stack-scope) .mr-1, :where(.stack-scope).mr-1 {\n  margin-right: 0.25rem;\n}\n:where(.stack-scope) .mr-1\\.5, :where(.stack-scope).mr-1\\.5 {\n  margin-right: 0.375rem;\n}\n:where(.stack-scope) .mr-2, :where(.stack-scope).mr-2 {\n  margin-right: 0.5rem;\n}\n:where(.stack-scope) .mr-4, :where(.stack-scope).mr-4 {\n  margin-right: 1rem;\n}\n:where(.stack-scope) .mt-1, :where(.stack-scope).mt-1 {\n  margin-top: 0.25rem;\n}\n:where(.stack-scope) .mt-1\\.5, :where(.stack-scope).mt-1\\.5 {\n  margin-top: 0.375rem;\n}\n:where(.stack-scope) .mt-2, :where(.stack-scope).mt-2 {\n  margin-top: 0.5rem;\n}\n:where(.stack-scope) .mt-4, :where(.stack-scope).mt-4 {\n  margin-top: 1rem;\n}\n:where(.stack-scope) .mt-6, :where(.stack-scope).mt-6 {\n  margin-top: 1.5rem;\n}\n:where(.stack-scope) .mt-8, :where(.stack-scope).mt-8 {\n  margin-top: 2rem;\n}\n:where(.stack-scope) .box-border, :where(.stack-scope).box-border {\n  box-sizing: border-box;\n}\n:where(.stack-scope) .line-clamp-1, :where(.stack-scope).line-clamp-1 {\n  overflow: hidden;\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 1;\n}\n:where(.stack-scope) .block, :where(.stack-scope).block {\n  display: block;\n}\n:where(.stack-scope) .inline, :where(.stack-scope).inline {\n  display: inline;\n}\n:where(.stack-scope) .flex, :where(.stack-scope).flex {\n  display: flex;\n}\n:where(.stack-scope) .inline-flex, :where(.stack-scope).inline-flex {\n  display: inline-flex;\n}\n:where(.stack-scope) .\\!table, :where(.stack-scope).\\!table {\n  display: table !important;\n}\n:where(.stack-scope) .table, :where(.stack-scope).table {\n  display: table;\n}\n:where(.stack-scope) .grid, :where(.stack-scope).grid {\n  display: grid;\n}\n:where(.stack-scope) .contents, :where(.stack-scope).contents {\n  display: contents;\n}\n:where(.stack-scope) .hidden, :where(.stack-scope).hidden {\n  display: none;\n}\n:where(.stack-scope) .aspect-square, :where(.stack-scope).aspect-square {\n  aspect-ratio: 1 / 1;\n}\n:where(.stack-scope) .size-3, :where(.stack-scope).size-3 {\n  width: 0.75rem;\n  height: 0.75rem;\n}\n:where(.stack-scope) .h-0, :where(.stack-scope).h-0 {\n  height: 0px;\n}\n:where(.stack-scope) .h-0\\.5, :where(.stack-scope).h-0\\.5 {\n  height: 0.125rem;\n}\n:where(.stack-scope) .h-1, :where(.stack-scope).h-1 {\n  height: 0.25rem;\n}\n:where(.stack-scope) .h-1\\.5, :where(.stack-scope).h-1\\.5 {\n  height: 0.375rem;\n}\n:where(.stack-scope) .h-10, :where(.stack-scope).h-10 {\n  height: 2.5rem;\n}\n:where(.stack-scope) .h-12, :where(.stack-scope).h-12 {\n  height: 3rem;\n}\n:where(.stack-scope) .h-2, :where(.stack-scope).h-2 {\n  height: 0.5rem;\n}\n:where(.stack-scope) .h-2\\.5, :where(.stack-scope).h-2\\.5 {\n  height: 0.625rem;\n}\n:where(.stack-scope) .h-24, :where(.stack-scope).h-24 {\n  height: 6rem;\n}\n:where(.stack-scope) .h-3, :where(.stack-scope).h-3 {\n  height: 0.75rem;\n}\n:where(.stack-scope) .h-3\\.5, :where(.stack-scope).h-3\\.5 {\n  height: 0.875rem;\n}\n:where(.stack-scope) .h-4, :where(.stack-scope).h-4 {\n  height: 1rem;\n}\n:where(.stack-scope) .h-5, :where(.stack-scope).h-5 {\n  height: 1.25rem;\n}\n:where(.stack-scope) .h-6, :where(.stack-scope).h-6 {\n  height: 1.5rem;\n}\n:where(.stack-scope) .h-64, :where(.stack-scope).h-64 {\n  height: 16rem;\n}\n:where(.stack-scope) .h-7, :where(.stack-scope).h-7 {\n  height: 1.75rem;\n}\n:where(.stack-scope) .h-8, :where(.stack-scope).h-8 {\n  height: 2rem;\n}\n:where(.stack-scope) .h-9, :where(.stack-scope).h-9 {\n  height: 2.25rem;\n}\n:where(.stack-scope) .h-\\[1px\\], :where(.stack-scope).h-\\[1px\\] {\n  height: 1px;\n}\n:where(.stack-scope) .h-\\[200px\\], :where(.stack-scope).h-\\[200px\\] {\n  height: 200px;\n}\n:where(.stack-scope) .h-\\[300px\\], :where(.stack-scope).h-\\[300px\\] {\n  height: 300px;\n}\n:where(.stack-scope) .h-\\[34px\\], :where(.stack-scope).h-\\[34px\\] {\n  height: 34px;\n}\n:where(.stack-scope) .h-\\[60px\\], :where(.stack-scope).h-\\[60px\\] {\n  height: 60px;\n}\n:where(.stack-scope) .h-\\[var\\(--radix-navigation-menu-viewport-height\\)\\], :where(.stack-scope).h-\\[var\\(--radix-navigation-menu-viewport-height\\)\\] {\n  height: var(--radix-navigation-menu-viewport-height);\n}\n:where(.stack-scope) .h-\\[var\\(--radix-select-trigger-height\\)\\], :where(.stack-scope).h-\\[var\\(--radix-select-trigger-height\\)\\] {\n  height: var(--radix-select-trigger-height);\n}\n:where(.stack-scope) .h-full, :where(.stack-scope).h-full {\n  height: 100%;\n}\n:where(.stack-scope) .h-px, :where(.stack-scope).h-px {\n  height: 1px;\n}\n:where(.stack-scope) .max-h-6, :where(.stack-scope).max-h-6 {\n  max-height: 1.5rem;\n}\n:where(.stack-scope) .max-h-96, :where(.stack-scope).max-h-96 {\n  max-height: 24rem;\n}\n:where(.stack-scope) .max-h-\\[300px\\], :where(.stack-scope).max-h-\\[300px\\] {\n  max-height: 300px;\n}\n:where(.stack-scope) .max-h-screen, :where(.stack-scope).max-h-screen {\n  max-height: 100vh;\n}\n:where(.stack-scope) .min-h-6, :where(.stack-scope).min-h-6 {\n  min-height: 1.5rem;\n}\n:where(.stack-scope) .min-h-\\[60px\\], :where(.stack-scope).min-h-\\[60px\\] {\n  min-height: 60px;\n}\n:where(.stack-scope) .w-0, :where(.stack-scope).w-0 {\n  width: 0px;\n}\n:where(.stack-scope) .w-1, :where(.stack-scope).w-1 {\n  width: 0.25rem;\n}\n:where(.stack-scope) .w-10, :where(.stack-scope).w-10 {\n  width: 2.5rem;\n}\n:where(.stack-scope) .w-12, :where(.stack-scope).w-12 {\n  width: 3rem;\n}\n:where(.stack-scope) .w-16, :where(.stack-scope).w-16 {\n  width: 4rem;\n}\n:where(.stack-scope) .w-2, :where(.stack-scope).w-2 {\n  width: 0.5rem;\n}\n:where(.stack-scope) .w-2\\.5, :where(.stack-scope).w-2\\.5 {\n  width: 0.625rem;\n}\n:where(.stack-scope) .w-2\\/3, :where(.stack-scope).w-2\\/3 {\n  width: 66.666667%;\n}\n:where(.stack-scope) .w-24, :where(.stack-scope).w-24 {\n  width: 6rem;\n}\n:where(.stack-scope) .w-3, :where(.stack-scope).w-3 {\n  width: 0.75rem;\n}\n:where(.stack-scope) .w-3\\.5, :where(.stack-scope).w-3\\.5 {\n  width: 0.875rem;\n}\n:where(.stack-scope) .w-3\\/4, :where(.stack-scope).w-3\\/4 {\n  width: 75%;\n}\n:where(.stack-scope) .w-4, :where(.stack-scope).w-4 {\n  width: 1rem;\n}\n:where(.stack-scope) .w-48, :where(.stack-scope).w-48 {\n  width: 12rem;\n}\n:where(.stack-scope) .w-5, :where(.stack-scope).w-5 {\n  width: 1.25rem;\n}\n:where(.stack-scope) .w-6, :where(.stack-scope).w-6 {\n  width: 1.5rem;\n}\n:where(.stack-scope) .w-64, :where(.stack-scope).w-64 {\n  width: 16rem;\n}\n:where(.stack-scope) .w-7, :where(.stack-scope).w-7 {\n  width: 1.75rem;\n}\n:where(.stack-scope) .w-72, :where(.stack-scope).w-72 {\n  width: 18rem;\n}\n:where(.stack-scope) .w-8, :where(.stack-scope).w-8 {\n  width: 2rem;\n}\n:where(.stack-scope) .w-9, :where(.stack-scope).w-9 {\n  width: 2.25rem;\n}\n:where(.stack-scope) .w-\\[100px\\], :where(.stack-scope).w-\\[100px\\] {\n  width: 100px;\n}\n:where(.stack-scope) .w-\\[150px\\], :where(.stack-scope).w-\\[150px\\] {\n  width: 150px;\n}\n:where(.stack-scope) .w-\\[1px\\], :where(.stack-scope).w-\\[1px\\] {\n  width: 1px;\n}\n:where(.stack-scope) .w-\\[200px\\], :where(.stack-scope).w-\\[200px\\] {\n  width: 200px;\n}\n:where(.stack-scope) .w-\\[250px\\], :where(.stack-scope).w-\\[250px\\] {\n  width: 250px;\n}\n:where(.stack-scope) .w-\\[34px\\], :where(.stack-scope).w-\\[34px\\] {\n  width: 34px;\n}\n:where(.stack-scope) .w-\\[36px\\], :where(.stack-scope).w-\\[36px\\] {\n  width: 36px;\n}\n:where(.stack-scope) .w-\\[60px\\], :where(.stack-scope).w-\\[60px\\] {\n  width: 60px;\n}\n:where(.stack-scope) .w-\\[70px\\], :where(.stack-scope).w-\\[70px\\] {\n  width: 70px;\n}\n:where(.stack-scope) .w-\\[800px\\], :where(.stack-scope).w-\\[800px\\] {\n  width: 800px;\n}\n:where(.stack-scope) .w-\\[80px\\], :where(.stack-scope).w-\\[80px\\] {\n  width: 80px;\n}\n:where(.stack-scope) .w-\\[calc\\(100\\%\\+3rem\\)\\], :where(.stack-scope).w-\\[calc\\(100\\%\\+3rem\\)\\] {\n  width: calc(100% + 3rem);\n}\n:where(.stack-scope) .w-auto, :where(.stack-scope).w-auto {\n  width: auto;\n}\n:where(.stack-scope) .w-fit, :where(.stack-scope).w-fit {\n  width: -moz-fit-content;\n  width: fit-content;\n}\n:where(.stack-scope) .w-full, :where(.stack-scope).w-full {\n  width: 100%;\n}\n:where(.stack-scope) .w-max, :where(.stack-scope).w-max {\n  width: -moz-max-content;\n  width: max-content;\n}\n:where(.stack-scope) .w-px, :where(.stack-scope).w-px {\n  width: 1px;\n}\n:where(.stack-scope) .min-w-6, :where(.stack-scope).min-w-6 {\n  min-width: 1.5rem;\n}\n:where(.stack-scope) .min-w-\\[12rem\\], :where(.stack-scope).min-w-\\[12rem\\] {\n  min-width: 12rem;\n}\n:where(.stack-scope) .min-w-\\[150px\\], :where(.stack-scope).min-w-\\[150px\\] {\n  min-width: 150px;\n}\n:where(.stack-scope) .min-w-\\[200px\\], :where(.stack-scope).min-w-\\[200px\\] {\n  min-width: 200px;\n}\n:where(.stack-scope) .min-w-\\[8rem\\], :where(.stack-scope).min-w-\\[8rem\\] {\n  min-width: 8rem;\n}\n:where(.stack-scope) .min-w-\\[var\\(--radix-select-trigger-width\\)\\], :where(.stack-scope).min-w-\\[var\\(--radix-select-trigger-width\\)\\] {\n  min-width: var(--radix-select-trigger-width);\n}\n:where(.stack-scope) .max-w-40, :where(.stack-scope).max-w-40 {\n  max-width: 10rem;\n}\n:where(.stack-scope) .max-w-6, :where(.stack-scope).max-w-6 {\n  max-width: 1.5rem;\n}\n:where(.stack-scope) .max-w-60, :where(.stack-scope).max-w-60 {\n  max-width: 15rem;\n}\n:where(.stack-scope) .max-w-64, :where(.stack-scope).max-w-64 {\n  max-width: 16rem;\n}\n:where(.stack-scope) .max-w-\\[200px\\], :where(.stack-scope).max-w-\\[200px\\] {\n  max-width: 200px;\n}\n:where(.stack-scope) .max-w-\\[300px\\], :where(.stack-scope).max-w-\\[300px\\] {\n  max-width: 300px;\n}\n:where(.stack-scope) .max-w-\\[320px\\], :where(.stack-scope).max-w-\\[320px\\] {\n  max-width: 320px;\n}\n:where(.stack-scope) .max-w-\\[36px\\], :where(.stack-scope).max-w-\\[36px\\] {\n  max-width: 36px;\n}\n:where(.stack-scope) .max-w-\\[380px\\], :where(.stack-scope).max-w-\\[380px\\] {\n  max-width: 380px;\n}\n:where(.stack-scope) .max-w-\\[800px\\], :where(.stack-scope).max-w-\\[800px\\] {\n  max-width: 800px;\n}\n:where(.stack-scope) .max-w-full, :where(.stack-scope).max-w-full {\n  max-width: 100%;\n}\n:where(.stack-scope) .max-w-lg, :where(.stack-scope).max-w-lg {\n  max-width: 32rem;\n}\n:where(.stack-scope) .max-w-max, :where(.stack-scope).max-w-max {\n  max-width: -moz-max-content;\n  max-width: max-content;\n}\n:where(.stack-scope) .max-w-sm, :where(.stack-scope).max-w-sm {\n  max-width: 24rem;\n}\n:where(.stack-scope) .flex-1, :where(.stack-scope).flex-1 {\n  flex: 1 1 0%;\n}\n:where(.stack-scope) .flex-shrink, :where(.stack-scope).flex-shrink {\n  flex-shrink: 1;\n}\n:where(.stack-scope) .flex-shrink-0, :where(.stack-scope).flex-shrink-0 {\n  flex-shrink: 0;\n}\n:where(.stack-scope) .shrink-0, :where(.stack-scope).shrink-0 {\n  flex-shrink: 0;\n}\n:where(.stack-scope) .flex-grow, :where(.stack-scope).flex-grow {\n  flex-grow: 1;\n}\n:where(.stack-scope) .grow, :where(.stack-scope).grow {\n  flex-grow: 1;\n}\n:where(.stack-scope) .caption-bottom, :where(.stack-scope).caption-bottom {\n  caption-side: bottom;\n}\n:where(.stack-scope) .border-collapse, :where(.stack-scope).border-collapse {\n  border-collapse: collapse;\n}\n:where(.stack-scope) .-translate-x-1, :where(.stack-scope).-translate-x-1 {\n  --tw-translate-x: -0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .-translate-y-1, :where(.stack-scope).-translate-y-1 {\n  --tw-translate-y: -0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .translate-x-1, :where(.stack-scope).translate-x-1 {\n  --tw-translate-x: 0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .translate-x-\\[-50\\%\\], :where(.stack-scope).translate-x-\\[-50\\%\\] {\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .translate-y-1, :where(.stack-scope).translate-y-1 {\n  --tw-translate-y: 0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .translate-y-\\[-50\\%\\], :where(.stack-scope).translate-y-\\[-50\\%\\] {\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .rotate-180, :where(.stack-scope).rotate-180 {\n  --tw-rotate: 180deg;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .rotate-45, :where(.stack-scope).rotate-45 {\n  --tw-rotate: 45deg;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .transform, :where(.stack-scope).transform {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n@keyframes pulse {\n  50% {\n    opacity: .5;\n  }\n}\n:where(.stack-scope) .animate-pulse, :where(.stack-scope).animate-pulse {\n  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n}\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n:where(.stack-scope) .animate-spin, :where(.stack-scope).animate-spin {\n  animation: spin 1s linear infinite;\n}\n:where(.stack-scope) .cursor-col-resize, :where(.stack-scope).cursor-col-resize {\n  cursor: col-resize;\n}\n:where(.stack-scope) .cursor-default, :where(.stack-scope).cursor-default {\n  cursor: default;\n}\n:where(.stack-scope) .cursor-grab, :where(.stack-scope).cursor-grab {\n  cursor: grab;\n}\n:where(.stack-scope) .cursor-grabbing, :where(.stack-scope).cursor-grabbing {\n  cursor: grabbing;\n}\n:where(.stack-scope) .cursor-not-allowed, :where(.stack-scope).cursor-not-allowed {\n  cursor: not-allowed;\n}\n:where(.stack-scope) .cursor-pointer, :where(.stack-scope).cursor-pointer {\n  cursor: pointer;\n}\n:where(.stack-scope) .cursor-row-resize, :where(.stack-scope).cursor-row-resize {\n  cursor: row-resize;\n}\n:where(.stack-scope) .cursor-wait, :where(.stack-scope).cursor-wait {\n  cursor: wait;\n}\n:where(.stack-scope) .touch-none, :where(.stack-scope).touch-none {\n  touch-action: none;\n}\n:where(.stack-scope) .select-none, :where(.stack-scope).select-none {\n  -webkit-user-select: none;\n     -moz-user-select: none;\n          user-select: none;\n}\n:where(.stack-scope) .resize, :where(.stack-scope).resize {\n  resize: both;\n}\n:where(.stack-scope) .list-none, :where(.stack-scope).list-none {\n  list-style-type: none;\n}\n:where(.stack-scope) .flex-row, :where(.stack-scope).flex-row {\n  flex-direction: row;\n}\n:where(.stack-scope) .flex-row-reverse, :where(.stack-scope).flex-row-reverse {\n  flex-direction: row-reverse;\n}\n:where(.stack-scope) .flex-col, :where(.stack-scope).flex-col {\n  flex-direction: column;\n}\n:where(.stack-scope) .flex-col-reverse, :where(.stack-scope).flex-col-reverse {\n  flex-direction: column-reverse;\n}\n:where(.stack-scope) .flex-wrap, :where(.stack-scope).flex-wrap {\n  flex-wrap: wrap;\n}\n:where(.stack-scope) .items-end, :where(.stack-scope).items-end {\n  align-items: flex-end;\n}\n:where(.stack-scope) .items-center, :where(.stack-scope).items-center {\n  align-items: center;\n}\n:where(.stack-scope) .items-stretch, :where(.stack-scope).items-stretch {\n  align-items: stretch;\n}\n:where(.stack-scope) .justify-start, :where(.stack-scope).justify-start {\n  justify-content: flex-start;\n}\n:where(.stack-scope) .justify-end, :where(.stack-scope).justify-end {\n  justify-content: flex-end;\n}\n:where(.stack-scope) .justify-center, :where(.stack-scope).justify-center {\n  justify-content: center;\n}\n:where(.stack-scope) .justify-between, :where(.stack-scope).justify-between {\n  justify-content: space-between;\n}\n:where(.stack-scope) .justify-evenly, :where(.stack-scope).justify-evenly {\n  justify-content: space-evenly;\n}\n:where(.stack-scope) .gap-1, :where(.stack-scope).gap-1 {\n  gap: 0.25rem;\n}\n:where(.stack-scope) .gap-1\\.5, :where(.stack-scope).gap-1\\.5 {\n  gap: 0.375rem;\n}\n:where(.stack-scope) .gap-2, :where(.stack-scope).gap-2 {\n  gap: 0.5rem;\n}\n:where(.stack-scope) .gap-3, :where(.stack-scope).gap-3 {\n  gap: 0.75rem;\n}\n:where(.stack-scope) .gap-4, :where(.stack-scope).gap-4 {\n  gap: 1rem;\n}\n:where(.stack-scope) .gap-6, :where(.stack-scope).gap-6 {\n  gap: 1.5rem;\n}\n:where(.stack-scope) .gap-x-6, :where(.stack-scope).gap-x-6 {\n  -moz-column-gap: 1.5rem;\n       column-gap: 1.5rem;\n}\n:where(.stack-scope) .gap-x-8, :where(.stack-scope).gap-x-8 {\n  -moz-column-gap: 2rem;\n       column-gap: 2rem;\n}\n:where(.stack-scope) .gap-y-0, :where(.stack-scope).gap-y-0 {\n  row-gap: 0px;\n}\n:where(.stack-scope) .gap-y-4, :where(.stack-scope).gap-y-4 {\n  row-gap: 1rem;\n}\n:where(.stack-scope) .space-x-0 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-x-0 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-x-reverse: 0;\n  margin-right: calc(0px * var(--tw-space-x-reverse));\n  margin-left: calc(0px * calc(1 - var(--tw-space-x-reverse)));\n}\n:where(.stack-scope) .space-x-1 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-x-1 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-x-reverse: 0;\n  margin-right: calc(0.25rem * var(--tw-space-x-reverse));\n  margin-left: calc(0.25rem * calc(1 - var(--tw-space-x-reverse)));\n}\n:where(.stack-scope) .space-x-2 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-x-2 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-x-reverse: 0;\n  margin-right: calc(0.5rem * var(--tw-space-x-reverse));\n  margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));\n}\n:where(.stack-scope) .space-x-4 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-x-4 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-x-reverse: 0;\n  margin-right: calc(1rem * var(--tw-space-x-reverse));\n  margin-left: calc(1rem * calc(1 - var(--tw-space-x-reverse)));\n}\n:where(.stack-scope) .space-y-0 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-y-0 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(0px * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(0px * var(--tw-space-y-reverse));\n}\n:where(.stack-scope) .space-y-1 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-y-1 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(0.25rem * var(--tw-space-y-reverse));\n}\n:where(.stack-scope) .space-y-1\\.5 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-y-1\\.5 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(0.375rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(0.375rem * var(--tw-space-y-reverse));\n}\n:where(.stack-scope) .space-y-2 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-y-2 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(0.5rem * var(--tw-space-y-reverse));\n}\n:where(.stack-scope) .space-y-4 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).space-y-4 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(1rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(1rem * var(--tw-space-y-reverse));\n}\n:where(.stack-scope) .self-center, :where(.stack-scope).self-center {\n  align-self: center;\n}\n:where(.stack-scope) .self-stretch, :where(.stack-scope).self-stretch {\n  align-self: stretch;\n}\n:where(.stack-scope) .overflow-auto, :where(.stack-scope).overflow-auto {\n  overflow: auto;\n}\n:where(.stack-scope) .overflow-hidden, :where(.stack-scope).overflow-hidden {\n  overflow: hidden;\n}\n:where(.stack-scope) .overflow-y-auto, :where(.stack-scope).overflow-y-auto {\n  overflow-y: auto;\n}\n:where(.stack-scope) .overflow-x-hidden, :where(.stack-scope).overflow-x-hidden {\n  overflow-x: hidden;\n}\n:where(.stack-scope) .truncate, :where(.stack-scope).truncate {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n:where(.stack-scope) .overflow-ellipsis, :where(.stack-scope).overflow-ellipsis {\n  text-overflow: ellipsis;\n}\n:where(.stack-scope) .text-ellipsis, :where(.stack-scope).text-ellipsis {\n  text-overflow: ellipsis;\n}\n:where(.stack-scope) .whitespace-nowrap, :where(.stack-scope).whitespace-nowrap {\n  white-space: nowrap;\n}\n:where(.stack-scope) .whitespace-pre-wrap, :where(.stack-scope).whitespace-pre-wrap {\n  white-space: pre-wrap;\n}\n:where(.stack-scope) .text-wrap, :where(.stack-scope).text-wrap {\n  text-wrap: wrap;\n}\n:where(.stack-scope) .text-nowrap, :where(.stack-scope).text-nowrap {\n  text-wrap: nowrap;\n}\n:where(.stack-scope) .break-words, :where(.stack-scope).break-words {\n  overflow-wrap: break-word;\n}\n:where(.stack-scope) .rounded, :where(.stack-scope).rounded {\n  border-radius: 0.25rem;\n}\n:where(.stack-scope) .rounded-\\[inherit\\], :where(.stack-scope).rounded-\\[inherit\\] {\n  border-radius: inherit;\n}\n:where(.stack-scope) .rounded-full, :where(.stack-scope).rounded-full {\n  border-radius: 9999px;\n}\n:where(.stack-scope) .rounded-lg, :where(.stack-scope).rounded-lg {\n  border-radius: var(--radius);\n}\n:where(.stack-scope) .rounded-md, :where(.stack-scope).rounded-md {\n  border-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .rounded-sm, :where(.stack-scope).rounded-sm {\n  border-radius: calc(var(--radius) - 4px);\n}\n:where(.stack-scope) .rounded-xl, :where(.stack-scope).rounded-xl {\n  border-radius: 0.75rem;\n}\n:where(.stack-scope) .rounded-b-md, :where(.stack-scope).rounded-b-md {\n  border-bottom-right-radius: calc(var(--radius) - 2px);\n  border-bottom-left-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .rounded-l-md, :where(.stack-scope).rounded-l-md {\n  border-top-left-radius: calc(var(--radius) - 2px);\n  border-bottom-left-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .rounded-l-none, :where(.stack-scope).rounded-l-none {\n  border-top-left-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\n:where(.stack-scope) .rounded-t-lg, :where(.stack-scope).rounded-t-lg {\n  border-top-left-radius: var(--radius);\n  border-top-right-radius: var(--radius);\n}\n:where(.stack-scope) .rounded-tl-sm, :where(.stack-scope).rounded-tl-sm {\n  border-top-left-radius: calc(var(--radius) - 4px);\n}\n:where(.stack-scope) .border, :where(.stack-scope).border {\n  border-width: 1px;\n}\n:where(.stack-scope) .border-0, :where(.stack-scope).border-0 {\n  border-width: 0px;\n}\n:where(.stack-scope) .border-2, :where(.stack-scope).border-2 {\n  border-width: 2px;\n}\n:where(.stack-scope) .border-b, :where(.stack-scope).border-b {\n  border-bottom-width: 1px;\n}\n:where(.stack-scope) .border-l, :where(.stack-scope).border-l {\n  border-left-width: 1px;\n}\n:where(.stack-scope) .border-r, :where(.stack-scope).border-r {\n  border-right-width: 1px;\n}\n:where(.stack-scope) .border-t, :where(.stack-scope).border-t {\n  border-top-width: 1px;\n}\n:where(.stack-scope) .border-blue-600, :where(.stack-scope).border-blue-600 {\n  --tw-border-opacity: 1;\n  border-color: rgb(37 99 235 / var(--tw-border-opacity));\n}\n:where(.stack-scope) .border-border, :where(.stack-scope).border-border {\n  border-color: hsl(var(--border));\n}\n:where(.stack-scope) .border-current, :where(.stack-scope).border-current {\n  border-color: currentColor;\n}\n:where(.stack-scope) .border-destructive, :where(.stack-scope).border-destructive {\n  border-color: hsl(var(--destructive));\n}\n:where(.stack-scope) .border-destructive\\/50, :where(.stack-scope).border-destructive\\/50 {\n  border-color: hsl(var(--destructive) / 0.5);\n}\n:where(.stack-scope) .border-gray-700, :where(.stack-scope).border-gray-700 {\n  --tw-border-opacity: 1;\n  border-color: rgb(55 65 81 / var(--tw-border-opacity));\n}\n:where(.stack-scope) .border-input, :where(.stack-scope).border-input {\n  border-color: hsl(var(--input));\n}\n:where(.stack-scope) .border-muted, :where(.stack-scope).border-muted {\n  border-color: hsl(var(--muted));\n}\n:where(.stack-scope) .border-primary, :where(.stack-scope).border-primary {\n  border-color: hsl(var(--primary));\n}\n:where(.stack-scope) .border-primary\\/50, :where(.stack-scope).border-primary\\/50 {\n  border-color: hsl(var(--primary) / 0.5);\n}\n:where(.stack-scope) .border-red-500, :where(.stack-scope).border-red-500 {\n  --tw-border-opacity: 1;\n  border-color: rgb(239 68 68 / var(--tw-border-opacity));\n}\n:where(.stack-scope) .border-success, :where(.stack-scope).border-success {\n  border-color: hsl(var(--success));\n}\n:where(.stack-scope) .border-success\\/50, :where(.stack-scope).border-success\\/50 {\n  border-color: hsl(var(--success) / 0.5);\n}\n:where(.stack-scope) .border-transparent, :where(.stack-scope).border-transparent {\n  border-color: transparent;\n}\n:where(.stack-scope) .border-white, :where(.stack-scope).border-white {\n  --tw-border-opacity: 1;\n  border-color: rgb(255 255 255 / var(--tw-border-opacity));\n}\n:where(.stack-scope) .border-l-transparent, :where(.stack-scope).border-l-transparent {\n  border-left-color: transparent;\n}\n:where(.stack-scope) .border-t-transparent, :where(.stack-scope).border-t-transparent {\n  border-top-color: transparent;\n}\n:where(.stack-scope) .bg-accent, :where(.stack-scope).bg-accent {\n  background-color: hsl(var(--accent));\n}\n:where(.stack-scope) .bg-background, :where(.stack-scope).bg-background {\n  background-color: hsl(var(--background));\n}\n:where(.stack-scope) .bg-black, :where(.stack-scope).bg-black {\n  --tw-bg-opacity: 1;\n  background-color: rgb(0 0 0 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-black\\/80, :where(.stack-scope).bg-black\\/80 {\n  background-color: rgb(0 0 0 / 0.8);\n}\n:where(.stack-scope) .bg-blue-500, :where(.stack-scope).bg-blue-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(59 130 246 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-blue-600, :where(.stack-scope).bg-blue-600 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(37 99 235 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-border, :where(.stack-scope).bg-border {\n  background-color: hsl(var(--border));\n}\n:where(.stack-scope) .bg-card, :where(.stack-scope).bg-card {\n  background-color: hsl(var(--card));\n}\n:where(.stack-scope) .bg-destructive, :where(.stack-scope).bg-destructive {\n  background-color: hsl(var(--destructive));\n}\n:where(.stack-scope) .bg-destructive\\/5, :where(.stack-scope).bg-destructive\\/5 {\n  background-color: hsl(var(--destructive) / 0.05);\n}\n:where(.stack-scope) .bg-foreground, :where(.stack-scope).bg-foreground {\n  background-color: hsl(var(--foreground));\n}\n:where(.stack-scope) .bg-gray-200, :where(.stack-scope).bg-gray-200 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(229 231 235 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-gray-400, :where(.stack-scope).bg-gray-400 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(156 163 175 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-gray-500, :where(.stack-scope).bg-gray-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(107 114 128 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-gray-500\\/20, :where(.stack-scope).bg-gray-500\\/20 {\n  background-color: rgb(107 114 128 / 0.2);\n}\n:where(.stack-scope) .bg-gray-700, :where(.stack-scope).bg-gray-700 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(55 65 81 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-green-500, :where(.stack-scope).bg-green-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(34 197 94 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-muted, :where(.stack-scope).bg-muted {\n  background-color: hsl(var(--muted));\n}\n:where(.stack-scope) .bg-muted\\/50, :where(.stack-scope).bg-muted\\/50 {\n  background-color: hsl(var(--muted) / 0.5);\n}\n:where(.stack-scope) .bg-muted\\/70, :where(.stack-scope).bg-muted\\/70 {\n  background-color: hsl(var(--muted) / 0.7);\n}\n:where(.stack-scope) .bg-popover, :where(.stack-scope).bg-popover {\n  background-color: hsl(var(--popover));\n}\n:where(.stack-scope) .bg-primary, :where(.stack-scope).bg-primary {\n  background-color: hsl(var(--primary));\n}\n:where(.stack-scope) .bg-primary\\/10, :where(.stack-scope).bg-primary\\/10 {\n  background-color: hsl(var(--primary) / 0.1);\n}\n:where(.stack-scope) .bg-primary\\/20, :where(.stack-scope).bg-primary\\/20 {\n  background-color: hsl(var(--primary) / 0.2);\n}\n:where(.stack-scope) .bg-red-500, :where(.stack-scope).bg-red-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(239 68 68 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-secondary, :where(.stack-scope).bg-secondary {\n  background-color: hsl(var(--secondary));\n}\n:where(.stack-scope) .bg-success, :where(.stack-scope).bg-success {\n  background-color: hsl(var(--success));\n}\n:where(.stack-scope) .bg-success\\/5, :where(.stack-scope).bg-success\\/5 {\n  background-color: hsl(var(--success) / 0.05);\n}\n:where(.stack-scope) .bg-transparent, :where(.stack-scope).bg-transparent {\n  background-color: transparent;\n}\n:where(.stack-scope) .bg-white, :where(.stack-scope).bg-white {\n  --tw-bg-opacity: 1;\n  background-color: rgb(255 255 255 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-white\\/20, :where(.stack-scope).bg-white\\/20 {\n  background-color: rgb(255 255 255 / 0.2);\n}\n:where(.stack-scope) .bg-yellow-500, :where(.stack-scope).bg-yellow-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(234 179 8 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .bg-zinc-200, :where(.stack-scope).bg-zinc-200 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(228 228 231 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .fill-current, :where(.stack-scope).fill-current {\n  fill: currentColor;\n}\n:where(.stack-scope) .fill-primary, :where(.stack-scope).fill-primary {\n  fill: hsl(var(--primary));\n}\n:where(.stack-scope) .p-0, :where(.stack-scope).p-0 {\n  padding: 0px;\n}\n:where(.stack-scope) .p-1, :where(.stack-scope).p-1 {\n  padding: 0.25rem;\n}\n:where(.stack-scope) .p-2, :where(.stack-scope).p-2 {\n  padding: 0.5rem;\n}\n:where(.stack-scope) .p-3, :where(.stack-scope).p-3 {\n  padding: 0.75rem;\n}\n:where(.stack-scope) .p-4, :where(.stack-scope).p-4 {\n  padding: 1rem;\n}\n:where(.stack-scope) .p-5, :where(.stack-scope).p-5 {\n  padding: 1.25rem;\n}\n:where(.stack-scope) .p-6, :where(.stack-scope).p-6 {\n  padding: 1.5rem;\n}\n:where(.stack-scope) .p-\\[1px\\], :where(.stack-scope).p-\\[1px\\] {\n  padding: 1px;\n}\n:where(.stack-scope) .px-1, :where(.stack-scope).px-1 {\n  padding-left: 0.25rem;\n  padding-right: 0.25rem;\n}\n:where(.stack-scope) .px-2, :where(.stack-scope).px-2 {\n  padding-left: 0.5rem;\n  padding-right: 0.5rem;\n}\n:where(.stack-scope) .px-2\\.5, :where(.stack-scope).px-2\\.5 {\n  padding-left: 0.625rem;\n  padding-right: 0.625rem;\n}\n:where(.stack-scope) .px-3, :where(.stack-scope).px-3 {\n  padding-left: 0.75rem;\n  padding-right: 0.75rem;\n}\n:where(.stack-scope) .px-4, :where(.stack-scope).px-4 {\n  padding-left: 1rem;\n  padding-right: 1rem;\n}\n:where(.stack-scope) .px-6, :where(.stack-scope).px-6 {\n  padding-left: 1.5rem;\n  padding-right: 1.5rem;\n}\n:where(.stack-scope) .px-8, :where(.stack-scope).px-8 {\n  padding-left: 2rem;\n  padding-right: 2rem;\n}\n:where(.stack-scope) .py-0, :where(.stack-scope).py-0 {\n  padding-top: 0px;\n  padding-bottom: 0px;\n}\n:where(.stack-scope) .py-0\\.5, :where(.stack-scope).py-0\\.5 {\n  padding-top: 0.125rem;\n  padding-bottom: 0.125rem;\n}\n:where(.stack-scope) .py-1, :where(.stack-scope).py-1 {\n  padding-top: 0.25rem;\n  padding-bottom: 0.25rem;\n}\n:where(.stack-scope) .py-1\\.5, :where(.stack-scope).py-1\\.5 {\n  padding-top: 0.375rem;\n  padding-bottom: 0.375rem;\n}\n:where(.stack-scope) .py-2, :where(.stack-scope).py-2 {\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n}\n:where(.stack-scope) .py-3, :where(.stack-scope).py-3 {\n  padding-top: 0.75rem;\n  padding-bottom: 0.75rem;\n}\n:where(.stack-scope) .py-4, :where(.stack-scope).py-4 {\n  padding-top: 1rem;\n  padding-bottom: 1rem;\n}\n:where(.stack-scope) .py-6, :where(.stack-scope).py-6 {\n  padding-top: 1.5rem;\n  padding-bottom: 1.5rem;\n}\n:where(.stack-scope) .pb-0, :where(.stack-scope).pb-0 {\n  padding-bottom: 0px;\n}\n:where(.stack-scope) .pb-2, :where(.stack-scope).pb-2 {\n  padding-bottom: 0.5rem;\n}\n:where(.stack-scope) .pb-4, :where(.stack-scope).pb-4 {\n  padding-bottom: 1rem;\n}\n:where(.stack-scope) .pl-2, :where(.stack-scope).pl-2 {\n  padding-left: 0.5rem;\n}\n:where(.stack-scope) .pl-3, :where(.stack-scope).pl-3 {\n  padding-left: 0.75rem;\n}\n:where(.stack-scope) .pl-7, :where(.stack-scope).pl-7 {\n  padding-left: 1.75rem;\n}\n:where(.stack-scope) .pl-8, :where(.stack-scope).pl-8 {\n  padding-left: 2rem;\n}\n:where(.stack-scope) .pr-10, :where(.stack-scope).pr-10 {\n  padding-right: 2.5rem;\n}\n:where(.stack-scope) .pr-2, :where(.stack-scope).pr-2 {\n  padding-right: 0.5rem;\n}\n:where(.stack-scope) .pr-3, :where(.stack-scope).pr-3 {\n  padding-right: 0.75rem;\n}\n:where(.stack-scope) .pr-6, :where(.stack-scope).pr-6 {\n  padding-right: 1.5rem;\n}\n:where(.stack-scope) .pr-8, :where(.stack-scope).pr-8 {\n  padding-right: 2rem;\n}\n:where(.stack-scope) .pt-0, :where(.stack-scope).pt-0 {\n  padding-top: 0px;\n}\n:where(.stack-scope) .pt-1, :where(.stack-scope).pt-1 {\n  padding-top: 0.25rem;\n}\n:where(.stack-scope) .pt-4, :where(.stack-scope).pt-4 {\n  padding-top: 1rem;\n}\n:where(.stack-scope) .text-left, :where(.stack-scope).text-left {\n  text-align: left;\n}\n:where(.stack-scope) .text-center, :where(.stack-scope).text-center {\n  text-align: center;\n}\n:where(.stack-scope) .align-middle, :where(.stack-scope).align-middle {\n  vertical-align: middle;\n}\n:where(.stack-scope) .text-2xl, :where(.stack-scope).text-2xl {\n  font-size: 1.5rem;\n  line-height: 2rem;\n}\n:where(.stack-scope) .text-3xl, :where(.stack-scope).text-3xl {\n  font-size: 1.875rem;\n  line-height: 2.25rem;\n}\n:where(.stack-scope) .text-\\[0\\.8rem\\], :where(.stack-scope).text-\\[0\\.8rem\\] {\n  font-size: 0.8rem;\n}\n:where(.stack-scope) .text-lg, :where(.stack-scope).text-lg {\n  font-size: 1.125rem;\n  line-height: 1.75rem;\n}\n:where(.stack-scope) .text-sm, :where(.stack-scope).text-sm {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\n:where(.stack-scope) .text-xl, :where(.stack-scope).text-xl {\n  font-size: 1.25rem;\n  line-height: 1.75rem;\n}\n:where(.stack-scope) .text-xs, :where(.stack-scope).text-xs {\n  font-size: 0.75rem;\n  line-height: 1rem;\n}\n:where(.stack-scope) .font-bold, :where(.stack-scope).font-bold {\n  font-weight: 700;\n}\n:where(.stack-scope) .font-medium, :where(.stack-scope).font-medium {\n  font-weight: 500;\n}\n:where(.stack-scope) .font-normal, :where(.stack-scope).font-normal {\n  font-weight: 400;\n}\n:where(.stack-scope) .font-semibold, :where(.stack-scope).font-semibold {\n  font-weight: 600;\n}\n:where(.stack-scope) .uppercase, :where(.stack-scope).uppercase {\n  text-transform: uppercase;\n}\n:where(.stack-scope) .capitalize, :where(.stack-scope).capitalize {\n  text-transform: capitalize;\n}\n:where(.stack-scope) .italic, :where(.stack-scope).italic {\n  font-style: italic;\n}\n:where(.stack-scope) .leading-6, :where(.stack-scope).leading-6 {\n  line-height: 1.5rem;\n}\n:where(.stack-scope) .leading-\\[0\\], :where(.stack-scope).leading-\\[0\\] {\n  line-height: 0;\n}\n:where(.stack-scope) .leading-none, :where(.stack-scope).leading-none {\n  line-height: 1;\n}\n:where(.stack-scope) .leading-relaxed, :where(.stack-scope).leading-relaxed {\n  line-height: 1.625;\n}\n:where(.stack-scope) .tracking-tight, :where(.stack-scope).tracking-tight {\n  letter-spacing: -0.025em;\n}\n:where(.stack-scope) .tracking-widest, :where(.stack-scope).tracking-widest {\n  letter-spacing: 0.1em;\n}\n:where(.stack-scope) .text-accent-foreground, :where(.stack-scope).text-accent-foreground {\n  color: hsl(var(--accent-foreground));\n}\n:where(.stack-scope) .text-black, :where(.stack-scope).text-black {\n  --tw-text-opacity: 1;\n  color: rgb(0 0 0 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-card-foreground, :where(.stack-scope).text-card-foreground {\n  color: hsl(var(--card-foreground));\n}\n:where(.stack-scope) .text-current, :where(.stack-scope).text-current {\n  color: currentColor;\n}\n:where(.stack-scope) .text-destructive, :where(.stack-scope).text-destructive {\n  color: hsl(var(--destructive));\n}\n:where(.stack-scope) .text-destructive-foreground, :where(.stack-scope).text-destructive-foreground {\n  color: hsl(var(--destructive-foreground));\n}\n:where(.stack-scope) .text-foreground, :where(.stack-scope).text-foreground {\n  color: hsl(var(--foreground));\n}\n:where(.stack-scope) .text-foreground\\/50, :where(.stack-scope).text-foreground\\/50 {\n  color: hsl(var(--foreground) / 0.5);\n}\n:where(.stack-scope) .text-gray-500, :where(.stack-scope).text-gray-500 {\n  --tw-text-opacity: 1;\n  color: rgb(107 114 128 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-gray-600, :where(.stack-scope).text-gray-600 {\n  --tw-text-opacity: 1;\n  color: rgb(75 85 99 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-gray-700, :where(.stack-scope).text-gray-700 {\n  --tw-text-opacity: 1;\n  color: rgb(55 65 81 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-green-300, :where(.stack-scope).text-green-300 {\n  --tw-text-opacity: 1;\n  color: rgb(134 239 172 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-green-500, :where(.stack-scope).text-green-500 {\n  --tw-text-opacity: 1;\n  color: rgb(34 197 94 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-green-600, :where(.stack-scope).text-green-600 {\n  --tw-text-opacity: 1;\n  color: rgb(22 163 74 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-muted-foreground, :where(.stack-scope).text-muted-foreground {\n  color: hsl(var(--muted-foreground));\n}\n:where(.stack-scope) .text-muted-foreground\\/70, :where(.stack-scope).text-muted-foreground\\/70 {\n  color: hsl(var(--muted-foreground) / 0.7);\n}\n:where(.stack-scope) .text-popover-foreground, :where(.stack-scope).text-popover-foreground {\n  color: hsl(var(--popover-foreground));\n}\n:where(.stack-scope) .text-primary, :where(.stack-scope).text-primary {\n  color: hsl(var(--primary));\n}\n:where(.stack-scope) .text-primary-foreground, :where(.stack-scope).text-primary-foreground {\n  color: hsl(var(--primary-foreground));\n}\n:where(.stack-scope) .text-red-300, :where(.stack-scope).text-red-300 {\n  --tw-text-opacity: 1;\n  color: rgb(252 165 165 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-red-500, :where(.stack-scope).text-red-500 {\n  --tw-text-opacity: 1;\n  color: rgb(239 68 68 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-red-600, :where(.stack-scope).text-red-600 {\n  --tw-text-opacity: 1;\n  color: rgb(220 38 38 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-secondary-foreground, :where(.stack-scope).text-secondary-foreground {\n  color: hsl(var(--secondary-foreground));\n}\n:where(.stack-scope) .text-success, :where(.stack-scope).text-success {\n  color: hsl(var(--success));\n}\n:where(.stack-scope) .text-success-foreground, :where(.stack-scope).text-success-foreground {\n  color: hsl(var(--success-foreground));\n}\n:where(.stack-scope) .text-white, :where(.stack-scope).text-white {\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-zinc-400, :where(.stack-scope).text-zinc-400 {\n  --tw-text-opacity: 1;\n  color: rgb(161 161 170 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-zinc-500, :where(.stack-scope).text-zinc-500 {\n  --tw-text-opacity: 1;\n  color: rgb(113 113 122 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-zinc-600, :where(.stack-scope).text-zinc-600 {\n  --tw-text-opacity: 1;\n  color: rgb(82 82 91 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-zinc-700, :where(.stack-scope).text-zinc-700 {\n  --tw-text-opacity: 1;\n  color: rgb(63 63 70 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .text-zinc-800, :where(.stack-scope).text-zinc-800 {\n  --tw-text-opacity: 1;\n  color: rgb(39 39 42 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .underline, :where(.stack-scope).underline {\n  text-decoration-line: underline;\n}\n:where(.stack-scope) .underline-offset-4, :where(.stack-scope).underline-offset-4 {\n  text-underline-offset: 4px;\n}\n:where(.stack-scope) .opacity-0, :where(.stack-scope).opacity-0 {\n  opacity: 0;\n}\n:where(.stack-scope) .opacity-100, :where(.stack-scope).opacity-100 {\n  opacity: 1;\n}\n:where(.stack-scope) .opacity-50, :where(.stack-scope).opacity-50 {\n  opacity: 0.5;\n}\n:where(.stack-scope) .opacity-60, :where(.stack-scope).opacity-60 {\n  opacity: 0.6;\n}\n:where(.stack-scope) .opacity-70, :where(.stack-scope).opacity-70 {\n  opacity: 0.7;\n}\n:where(.stack-scope) .opacity-85, :where(.stack-scope).opacity-85 {\n  opacity: 0.85;\n}\n:where(.stack-scope) .opacity-90, :where(.stack-scope).opacity-90 {\n  opacity: 0.9;\n}\n:where(.stack-scope) .shadow, :where(.stack-scope).shadow {\n  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n:where(.stack-scope) .shadow-2xl, :where(.stack-scope).shadow-2xl {\n  --tw-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);\n  --tw-shadow-colored: 0 25px 50px -12px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n:where(.stack-scope) .shadow-lg, :where(.stack-scope).shadow-lg {\n  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n:where(.stack-scope) .shadow-md, :where(.stack-scope).shadow-md {\n  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n:where(.stack-scope) .shadow-sm, :where(.stack-scope).shadow-sm {\n  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);\n  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n:where(.stack-scope) .outline-none, :where(.stack-scope).outline-none {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\n:where(.stack-scope) .outline, :where(.stack-scope).outline {\n  outline-style: solid;\n}\n:where(.stack-scope) .ring, :where(.stack-scope).ring {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n:where(.stack-scope) .ring-0, :where(.stack-scope).ring-0 {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n:where(.stack-scope) .ring-1, :where(.stack-scope).ring-1 {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n:where(.stack-scope) .ring-primary, :where(.stack-scope).ring-primary {\n  --tw-ring-color: hsl(var(--primary));\n}\n:where(.stack-scope) .ring-red-500, :where(.stack-scope).ring-red-500 {\n  --tw-ring-opacity: 1;\n  --tw-ring-color: rgb(239 68 68 / var(--tw-ring-opacity));\n}\n:where(.stack-scope) .ring-ring, :where(.stack-scope).ring-ring {\n  --tw-ring-color: hsl(var(--ring));\n}\n:where(.stack-scope) .ring-offset-background, :where(.stack-scope).ring-offset-background {\n  --tw-ring-offset-color: hsl(var(--background));\n}\n:where(.stack-scope) .blur, :where(.stack-scope).blur {\n  --tw-blur: blur(8px);\n  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);\n}\n:where(.stack-scope) .filter, :where(.stack-scope).filter {\n  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);\n}\n:where(.stack-scope) .backdrop-blur-md, :where(.stack-scope).backdrop-blur-md {\n  --tw-backdrop-blur: blur(12px);\n  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n}\n:where(.stack-scope) .backdrop-blur-sm, :where(.stack-scope).backdrop-blur-sm {\n  --tw-backdrop-blur: blur(4px);\n  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n}\n:where(.stack-scope) .backdrop-blur-xl, :where(.stack-scope).backdrop-blur-xl {\n  --tw-backdrop-blur: blur(24px);\n  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n}\n:where(.stack-scope) .backdrop-filter, :where(.stack-scope).backdrop-filter {\n  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);\n}\n:where(.stack-scope) .transition, :where(.stack-scope).transition {\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n:where(.stack-scope) .transition-all, :where(.stack-scope).transition-all {\n  transition-property: all;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n:where(.stack-scope) .transition-colors, :where(.stack-scope).transition-colors {\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n:where(.stack-scope) .transition-opacity, :where(.stack-scope).transition-opacity {\n  transition-property: opacity;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n:where(.stack-scope) .transition-transform, :where(.stack-scope).transition-transform {\n  transition-property: transform;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n:where(.stack-scope) .duration-100, :where(.stack-scope).duration-100 {\n  transition-duration: 100ms;\n}\n:where(.stack-scope) .duration-1000, :where(.stack-scope).duration-1000 {\n  transition-duration: 1000ms;\n}\n:where(.stack-scope) .duration-200, :where(.stack-scope).duration-200 {\n  transition-duration: 200ms;\n}\n:where(.stack-scope) .duration-300, :where(.stack-scope).duration-300 {\n  transition-duration: 300ms;\n}\n:where(.stack-scope) .ease-in-out, :where(.stack-scope).ease-in-out {\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n}\n@keyframes enter {\n  from {\n    opacity: var(--tw-enter-opacity, 1);\n    transform: translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0));\n  }\n}\n@keyframes exit {\n  to {\n    opacity: var(--tw-exit-opacity, 1);\n    transform: translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0));\n  }\n}\n:where(.stack-scope) .animate-in, :where(.stack-scope).animate-in {\n  animation-name: enter;\n  animation-duration: 150ms;\n  --tw-enter-opacity: initial;\n  --tw-enter-scale: initial;\n  --tw-enter-rotate: initial;\n  --tw-enter-translate-x: initial;\n  --tw-enter-translate-y: initial;\n}\n:where(.stack-scope) .fade-in, :where(.stack-scope).fade-in {\n  --tw-enter-opacity: 0;\n}\n:where(.stack-scope) .fade-in-0, :where(.stack-scope).fade-in-0 {\n  --tw-enter-opacity: 0;\n}\n:where(.stack-scope) .zoom-in, :where(.stack-scope).zoom-in {\n  --tw-enter-scale: 0;\n}\n:where(.stack-scope) .zoom-in-95, :where(.stack-scope).zoom-in-95 {\n  --tw-enter-scale: .95;\n}\n:where(.stack-scope) .slide-in-from-bottom-2, :where(.stack-scope).slide-in-from-bottom-2 {\n  --tw-enter-translate-y: 0.5rem;\n}\n:where(.stack-scope) .slide-in-from-left-1, :where(.stack-scope).slide-in-from-left-1 {\n  --tw-enter-translate-x: -0.25rem;\n}\n:where(.stack-scope) .slide-out-to-left-1, :where(.stack-scope).slide-out-to-left-1 {\n  --tw-exit-translate-x: -0.25rem;\n}\n:where(.stack-scope) .duration-100, :where(.stack-scope).duration-100 {\n  animation-duration: 100ms;\n}\n:where(.stack-scope) .duration-1000, :where(.stack-scope).duration-1000 {\n  animation-duration: 1000ms;\n}\n:where(.stack-scope) .duration-200, :where(.stack-scope).duration-200 {\n  animation-duration: 200ms;\n}\n:where(.stack-scope) .duration-300, :where(.stack-scope).duration-300 {\n  animation-duration: 300ms;\n}\n:where(.stack-scope) .ease-in-out, :where(.stack-scope).ease-in-out {\n  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n}\n:where(.stack-scope) .running, :where(.stack-scope).running {\n  animation-play-state: running;\n}\n:where(.stack-scope) *, *:where(.stack-scope) {\n  border-color: hsl(var(--border));\n}\n:where(.stack-scope) * .hide-password-toggle::-ms-reveal,\n  :where(.stack-scope) * .hide-password-toggle::-ms-clear,\n  *:where(.stack-scope) .hide-password-toggle::-ms-reveal,\n  *:where(.stack-scope) .hide-password-toggle::-ms-clear {\n    visibility: hidden;\n    pointer-events: none;\n    display: none;\n  }\n:where(.stack-scope) .file\\:border-0::file-selector-button, :where(.stack-scope).file\\:border-0::file-selector-button {\n  border-width: 0px;\n}\n:where(.stack-scope) .file\\:bg-transparent::file-selector-button, :where(.stack-scope).file\\:bg-transparent::file-selector-button {\n  background-color: transparent;\n}\n:where(.stack-scope) .file\\:text-sm::file-selector-button, :where(.stack-scope).file\\:text-sm::file-selector-button {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\n:where(.stack-scope) .file\\:font-medium::file-selector-button, :where(.stack-scope).file\\:font-medium::file-selector-button {\n  font-weight: 500;\n}\n:where(.stack-scope) .placeholder\\:text-muted-foreground::-moz-placeholder, :where(.stack-scope).placeholder\\:text-muted-foreground::-moz-placeholder {\n  color: hsl(var(--muted-foreground));\n}\n:where(.stack-scope) .placeholder\\:text-muted-foreground::placeholder, :where(.stack-scope).placeholder\\:text-muted-foreground::placeholder {\n  color: hsl(var(--muted-foreground));\n}\n:where(.stack-scope) .after\\:absolute::after, :where(.stack-scope).after\\:absolute::after {\n  content: var(--tw-content);\n  position: absolute;\n}\n:where(.stack-scope) .after\\:inset-y-0::after, :where(.stack-scope).after\\:inset-y-0::after {\n  content: var(--tw-content);\n  top: 0px;\n  bottom: 0px;\n}\n:where(.stack-scope) .after\\:left-1\\/2::after, :where(.stack-scope).after\\:left-1\\/2::after {\n  content: var(--tw-content);\n  left: 50%;\n}\n:where(.stack-scope) .after\\:w-1::after, :where(.stack-scope).after\\:w-1::after {\n  content: var(--tw-content);\n  width: 0.25rem;\n}\n:where(.stack-scope) .after\\:-translate-x-1\\/2::after, :where(.stack-scope).after\\:-translate-x-1\\/2::after {\n  content: var(--tw-content);\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .focus-within\\:relative:focus-within, :where(.stack-scope).focus-within\\:relative:focus-within {\n  position: relative;\n}\n:where(.stack-scope) .focus-within\\:z-20:focus-within, :where(.stack-scope).focus-within\\:z-20:focus-within {\n  z-index: 20;\n}\n:where(.stack-scope) .hover\\:bg-accent:hover, :where(.stack-scope).hover\\:bg-accent:hover {\n  background-color: hsl(var(--accent));\n}\n:where(.stack-scope) .hover\\:bg-destructive\\/90:hover, :where(.stack-scope).hover\\:bg-destructive\\/90:hover {\n  background-color: hsl(var(--destructive) / 0.9);\n}\n:where(.stack-scope) .hover\\:bg-muted:hover, :where(.stack-scope).hover\\:bg-muted:hover {\n  background-color: hsl(var(--muted));\n}\n:where(.stack-scope) .hover\\:bg-muted\\/50:hover, :where(.stack-scope).hover\\:bg-muted\\/50:hover {\n  background-color: hsl(var(--muted) / 0.5);\n}\n:where(.stack-scope) .hover\\:bg-primary:hover, :where(.stack-scope).hover\\:bg-primary:hover {\n  background-color: hsl(var(--primary));\n}\n:where(.stack-scope) .hover\\:bg-primary\\/90:hover, :where(.stack-scope).hover\\:bg-primary\\/90:hover {\n  background-color: hsl(var(--primary) / 0.9);\n}\n:where(.stack-scope) .hover\\:bg-secondary:hover, :where(.stack-scope).hover\\:bg-secondary:hover {\n  background-color: hsl(var(--secondary));\n}\n:where(.stack-scope) .hover\\:bg-secondary\\/80:hover, :where(.stack-scope).hover\\:bg-secondary\\/80:hover {\n  background-color: hsl(var(--secondary) / 0.8);\n}\n:where(.stack-scope) .hover\\:bg-transparent:hover, :where(.stack-scope).hover\\:bg-transparent:hover {\n  background-color: transparent;\n}\n:where(.stack-scope) .hover\\:text-accent-foreground:hover, :where(.stack-scope).hover\\:text-accent-foreground:hover {\n  color: hsl(var(--accent-foreground));\n}\n:where(.stack-scope) .hover\\:text-foreground:hover, :where(.stack-scope).hover\\:text-foreground:hover {\n  color: hsl(var(--foreground));\n}\n:where(.stack-scope) .hover\\:text-muted-foreground:hover, :where(.stack-scope).hover\\:text-muted-foreground:hover {\n  color: hsl(var(--muted-foreground));\n}\n:where(.stack-scope) .hover\\:text-primary-foreground:hover, :where(.stack-scope).hover\\:text-primary-foreground:hover {\n  color: hsl(var(--primary-foreground));\n}\n:where(.stack-scope) .hover\\:underline:hover, :where(.stack-scope).hover\\:underline:hover {\n  text-decoration-line: underline;\n}\n:where(.stack-scope) .hover\\:opacity-100:hover, :where(.stack-scope).hover\\:opacity-100:hover {\n  opacity: 1;\n}\n:where(.stack-scope) .focus\\:bg-accent:focus, :where(.stack-scope).focus\\:bg-accent:focus {\n  background-color: hsl(var(--accent));\n}\n:where(.stack-scope) .focus\\:bg-primary:focus, :where(.stack-scope).focus\\:bg-primary:focus {\n  background-color: hsl(var(--primary));\n}\n:where(.stack-scope) .focus\\:text-accent-foreground:focus, :where(.stack-scope).focus\\:text-accent-foreground:focus {\n  color: hsl(var(--accent-foreground));\n}\n:where(.stack-scope) .focus\\:text-primary-foreground:focus, :where(.stack-scope).focus\\:text-primary-foreground:focus {\n  color: hsl(var(--primary-foreground));\n}\n:where(.stack-scope) .focus\\:opacity-100:focus, :where(.stack-scope).focus\\:opacity-100:focus {\n  opacity: 1;\n}\n:where(.stack-scope) .focus\\:outline-none:focus, :where(.stack-scope).focus\\:outline-none:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\n:where(.stack-scope) .focus\\:ring-1:focus, :where(.stack-scope).focus\\:ring-1:focus {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n:where(.stack-scope) .focus\\:ring-2:focus, :where(.stack-scope).focus\\:ring-2:focus {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n:where(.stack-scope) .focus\\:ring-primary\\/50:focus, :where(.stack-scope).focus\\:ring-primary\\/50:focus {\n  --tw-ring-color: hsl(var(--primary) / 0.5);\n}\n:where(.stack-scope) .focus\\:ring-ring:focus, :where(.stack-scope).focus\\:ring-ring:focus {\n  --tw-ring-color: hsl(var(--ring));\n}\n:where(.stack-scope) .focus\\:ring-offset-2:focus, :where(.stack-scope).focus\\:ring-offset-2:focus {\n  --tw-ring-offset-width: 2px;\n}\n:where(.stack-scope) .focus-visible\\:outline-none:focus-visible, :where(.stack-scope).focus-visible\\:outline-none:focus-visible {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\n:where(.stack-scope) .focus-visible\\:ring-1:focus-visible, :where(.stack-scope).focus-visible\\:ring-1:focus-visible {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n:where(.stack-scope) .focus-visible\\:ring-2:focus-visible, :where(.stack-scope).focus-visible\\:ring-2:focus-visible {\n  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);\n  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\n}\n:where(.stack-scope) .focus-visible\\:ring-ring:focus-visible, :where(.stack-scope).focus-visible\\:ring-ring:focus-visible {\n  --tw-ring-color: hsl(var(--ring));\n}\n:where(.stack-scope) .focus-visible\\:ring-offset-1:focus-visible, :where(.stack-scope).focus-visible\\:ring-offset-1:focus-visible {\n  --tw-ring-offset-width: 1px;\n}\n:where(.stack-scope) .focus-visible\\:ring-offset-2:focus-visible, :where(.stack-scope).focus-visible\\:ring-offset-2:focus-visible {\n  --tw-ring-offset-width: 2px;\n}\n:where(.stack-scope) .focus-visible\\:ring-offset-background:focus-visible, :where(.stack-scope).focus-visible\\:ring-offset-background:focus-visible {\n  --tw-ring-offset-color: hsl(var(--background));\n}\n:where(.stack-scope) .disabled\\:pointer-events-none:disabled, :where(.stack-scope).disabled\\:pointer-events-none:disabled {\n  pointer-events: none;\n}\n:where(.stack-scope) .disabled\\:cursor-not-allowed:disabled, :where(.stack-scope).disabled\\:cursor-not-allowed:disabled {\n  cursor: not-allowed;\n}\n:where(.stack-scope) .disabled\\:opacity-50:disabled, :where(.stack-scope).disabled\\:opacity-50:disabled {\n  opacity: 0.5;\n}\n:where(.stack-scope) .group:hover .group-hover\\:opacity-100, :where(.stack-scope).group:hover .group-hover\\:opacity-100 {\n  opacity: 1;\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:border-muted\\/40, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:border-muted\\/40 {\n  border-color: hsl(var(--muted) / 0.4);\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:text-red-300, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:text-red-300 {\n  --tw-text-opacity: 1;\n  color: rgb(252 165 165 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .group.success .group-\\[\\.success\\]\\:text-green-300, :where(.stack-scope).group.success .group-\\[\\.success\\]\\:text-green-300 {\n  --tw-text-opacity: 1;\n  color: rgb(134 239 172 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:hover\\:border-destructive\\/30:hover, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:hover\\:border-destructive\\/30:hover {\n  border-color: hsl(var(--destructive) / 0.3);\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:hover\\:bg-destructive:hover, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:hover\\:bg-destructive:hover {\n  background-color: hsl(var(--destructive));\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:hover\\:text-destructive-foreground:hover, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:hover\\:text-destructive-foreground:hover {\n  color: hsl(var(--destructive-foreground));\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:hover\\:text-red-50:hover, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:hover\\:text-red-50:hover {\n  --tw-text-opacity: 1;\n  color: rgb(254 242 242 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .group.success .group-\\[\\.success\\]\\:hover\\:text-green-50:hover, :where(.stack-scope).group.success .group-\\[\\.success\\]\\:hover\\:text-green-50:hover {\n  --tw-text-opacity: 1;\n  color: rgb(240 253 244 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:focus\\:ring-destructive:focus, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:focus\\:ring-destructive:focus {\n  --tw-ring-color: hsl(var(--destructive));\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:focus\\:ring-red-400:focus, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:focus\\:ring-red-400:focus {\n  --tw-ring-opacity: 1;\n  --tw-ring-color: rgb(248 113 113 / var(--tw-ring-opacity));\n}\n:where(.stack-scope) .group.success .group-\\[\\.success\\]\\:focus\\:ring-green-400:focus, :where(.stack-scope).group.success .group-\\[\\.success\\]\\:focus\\:ring-green-400:focus {\n  --tw-ring-opacity: 1;\n  --tw-ring-color: rgb(74 222 128 / var(--tw-ring-opacity));\n}\n:where(.stack-scope) .group.destructive .group-\\[\\.destructive\\]\\:focus\\:ring-offset-red-600:focus, :where(.stack-scope).group.destructive .group-\\[\\.destructive\\]\\:focus\\:ring-offset-red-600:focus {\n  --tw-ring-offset-color: #dc2626;\n}\n:where(.stack-scope) .group.success .group-\\[\\.success\\]\\:focus\\:ring-offset-green-600:focus, :where(.stack-scope).group.success .group-\\[\\.success\\]\\:focus\\:ring-offset-green-600:focus {\n  --tw-ring-offset-color: #16a34a;\n}\n:where(.stack-scope) .peer:disabled ~ .peer-disabled\\:cursor-not-allowed, :where(.stack-scope).peer:disabled ~ .peer-disabled\\:cursor-not-allowed {\n  cursor: not-allowed;\n}\n:where(.stack-scope) .peer:disabled ~ .peer-disabled\\:opacity-70, :where(.stack-scope).peer:disabled ~ .peer-disabled\\:opacity-70 {\n  opacity: 0.7;\n}\n:where(.stack-scope) .has-\\[\\:disabled\\]\\:opacity-50:has(:disabled), :where(.stack-scope).has-\\[\\:disabled\\]\\:opacity-50:has(:disabled) {\n  opacity: 0.5;\n}\n:where(.stack-scope) .aria-selected\\:bg-accent[aria-selected="true"], :where(.stack-scope).aria-selected\\:bg-accent[aria-selected="true"] {\n  background-color: hsl(var(--accent));\n}\n:where(.stack-scope) .aria-selected\\:text-accent-foreground[aria-selected="true"], :where(.stack-scope).aria-selected\\:text-accent-foreground[aria-selected="true"] {\n  color: hsl(var(--accent-foreground));\n}\n:where(.stack-scope) .aria-selected\\:opacity-100[aria-selected="true"], :where(.stack-scope).aria-selected\\:opacity-100[aria-selected="true"] {\n  opacity: 1;\n}\n:where(.stack-scope) .data-\\[disabled\\=true\\]\\:pointer-events-none[data-disabled="true"], :where(.stack-scope).data-\\[disabled\\=true\\]\\:pointer-events-none[data-disabled="true"] {\n  pointer-events: none;\n}\n:where(.stack-scope) .data-\\[disabled\\]\\:pointer-events-none[data-disabled], :where(.stack-scope).data-\\[disabled\\]\\:pointer-events-none[data-disabled] {\n  pointer-events: none;\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:h-px[data-panel-group-direction="vertical"], :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:h-px[data-panel-group-direction="vertical"] {\n  height: 1px;\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:w-full[data-panel-group-direction="vertical"], :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:w-full[data-panel-group-direction="vertical"] {\n  width: 100%;\n}\n:where(.stack-scope) .data-\\[side\\=bottom\\]\\:translate-y-1[data-side="bottom"], :where(.stack-scope).data-\\[side\\=bottom\\]\\:translate-y-1[data-side="bottom"] {\n  --tw-translate-y: 0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[side\\=left\\]\\:-translate-x-1[data-side="left"], :where(.stack-scope).data-\\[side\\=left\\]\\:-translate-x-1[data-side="left"] {\n  --tw-translate-x: -0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[side\\=right\\]\\:translate-x-1[data-side="right"], :where(.stack-scope).data-\\[side\\=right\\]\\:translate-x-1[data-side="right"] {\n  --tw-translate-x: 0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[side\\=top\\]\\:-translate-y-1[data-side="top"], :where(.stack-scope).data-\\[side\\=top\\]\\:-translate-y-1[data-side="top"] {\n  --tw-translate-y: -0.25rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[state\\=checked\\]\\:translate-x-4[data-state="checked"], :where(.stack-scope).data-\\[state\\=checked\\]\\:translate-x-4[data-state="checked"] {\n  --tw-translate-x: 1rem;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[state\\=unchecked\\]\\:translate-x-0[data-state="unchecked"], :where(.stack-scope).data-\\[state\\=unchecked\\]\\:translate-x-0[data-state="unchecked"] {\n  --tw-translate-x: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[swipe\\=cancel\\]\\:translate-x-0[data-swipe="cancel"], :where(.stack-scope).data-\\[swipe\\=cancel\\]\\:translate-x-0[data-swipe="cancel"] {\n  --tw-translate-x: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[swipe\\=end\\]\\:translate-x-\\[var\\(--radix-toast-swipe-end-x\\)\\][data-swipe="end"], :where(.stack-scope).data-\\[swipe\\=end\\]\\:translate-x-\\[var\\(--radix-toast-swipe-end-x\\)\\][data-swipe="end"] {\n  --tw-translate-x: var(--radix-toast-swipe-end-x);\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[swipe\\=move\\]\\:translate-x-\\[var\\(--radix-toast-swipe-move-x\\)\\][data-swipe="move"], :where(.stack-scope).data-\\[swipe\\=move\\]\\:translate-x-\\[var\\(--radix-toast-swipe-move-x\\)\\][data-swipe="move"] {\n  --tw-translate-x: var(--radix-toast-swipe-move-x);\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n@keyframes accordion-up {\n  from {\n    height: var(--radix-accordion-content-height);\n  }\n\n  to {\n    height: 0;\n  }\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:animate-accordion-up[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:animate-accordion-up[data-state="closed"] {\n  animation: accordion-up 0.2s ease-out;\n}\n@keyframes accordion-down {\n  from {\n    height: 0;\n  }\n\n  to {\n    height: var(--radix-accordion-content-height);\n  }\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:animate-accordion-down[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:animate-accordion-down[data-state="open"] {\n  animation: accordion-down 0.2s ease-out;\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:flex-col[data-panel-group-direction="vertical"], :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:flex-col[data-panel-group-direction="vertical"] {\n  flex-direction: column;\n}\n:where(.stack-scope) .data-\\[active\\]\\:bg-accent\\/50[data-active], :where(.stack-scope).data-\\[active\\]\\:bg-accent\\/50[data-active] {\n  background-color: hsl(var(--accent) / 0.5);\n}\n:where(.stack-scope) .data-\\[state\\=active\\]\\:bg-background[data-state="active"], :where(.stack-scope).data-\\[state\\=active\\]\\:bg-background[data-state="active"] {\n  background-color: hsl(var(--background));\n}\n:where(.stack-scope) .data-\\[state\\=checked\\]\\:bg-primary[data-state="checked"], :where(.stack-scope).data-\\[state\\=checked\\]\\:bg-primary[data-state="checked"] {\n  background-color: hsl(var(--primary));\n}\n:where(.stack-scope) .data-\\[state\\=on\\]\\:bg-accent[data-state="on"], :where(.stack-scope).data-\\[state\\=on\\]\\:bg-accent[data-state="on"] {\n  background-color: hsl(var(--accent));\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:bg-accent[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:bg-accent[data-state="open"] {\n  background-color: hsl(var(--accent));\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:bg-accent\\/50[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:bg-accent\\/50[data-state="open"] {\n  background-color: hsl(var(--accent) / 0.5);\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:bg-muted[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:bg-muted[data-state="open"] {\n  background-color: hsl(var(--muted));\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:bg-secondary[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:bg-secondary[data-state="open"] {\n  background-color: hsl(var(--secondary));\n}\n:where(.stack-scope) .data-\\[state\\=selected\\]\\:bg-muted[data-state="selected"], :where(.stack-scope).data-\\[state\\=selected\\]\\:bg-muted[data-state="selected"] {\n  background-color: hsl(var(--muted));\n}\n:where(.stack-scope) .data-\\[state\\=unchecked\\]\\:bg-input[data-state="unchecked"], :where(.stack-scope).data-\\[state\\=unchecked\\]\\:bg-input[data-state="unchecked"] {\n  background-color: hsl(var(--input));\n}\n:where(.stack-scope) .data-\\[state\\=active\\]\\:text-foreground[data-state="active"], :where(.stack-scope).data-\\[state\\=active\\]\\:text-foreground[data-state="active"] {\n  color: hsl(var(--foreground));\n}\n:where(.stack-scope) .data-\\[state\\=checked\\]\\:text-primary-foreground[data-state="checked"], :where(.stack-scope).data-\\[state\\=checked\\]\\:text-primary-foreground[data-state="checked"] {\n  color: hsl(var(--primary-foreground));\n}\n:where(.stack-scope) .data-\\[state\\=on\\]\\:text-accent-foreground[data-state="on"], :where(.stack-scope).data-\\[state\\=on\\]\\:text-accent-foreground[data-state="on"] {\n  color: hsl(var(--accent-foreground));\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:text-accent-foreground[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:text-accent-foreground[data-state="open"] {\n  color: hsl(var(--accent-foreground));\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:text-muted-foreground[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:text-muted-foreground[data-state="open"] {\n  color: hsl(var(--muted-foreground));\n}\n:where(.stack-scope) .data-\\[disabled\\=true\\]\\:opacity-50[data-disabled="true"], :where(.stack-scope).data-\\[disabled\\=true\\]\\:opacity-50[data-disabled="true"] {\n  opacity: 0.5;\n}\n:where(.stack-scope) .data-\\[disabled\\]\\:opacity-50[data-disabled], :where(.stack-scope).data-\\[disabled\\]\\:opacity-50[data-disabled] {\n  opacity: 0.5;\n}\n:where(.stack-scope) .data-\\[state\\=active\\]\\:shadow-sm[data-state="active"], :where(.stack-scope).data-\\[state\\=active\\]\\:shadow-sm[data-state="active"] {\n  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);\n  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n:where(.stack-scope) .data-\\[swipe\\=move\\]\\:transition-none[data-swipe="move"], :where(.stack-scope).data-\\[swipe\\=move\\]\\:transition-none[data-swipe="move"] {\n  transition-property: none;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:duration-100[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:duration-100[data-state="closed"] {\n  transition-duration: 100ms;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:duration-100[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:duration-100[data-state="open"] {\n  transition-duration: 100ms;\n}\n:where(.stack-scope) .data-\\[motion\\^\\=from-\\]\\:animate-in[data-motion^="from-"], :where(.stack-scope).data-\\[motion\\^\\=from-\\]\\:animate-in[data-motion^="from-"] {\n  animation-name: enter;\n  animation-duration: 150ms;\n  --tw-enter-opacity: initial;\n  --tw-enter-scale: initial;\n  --tw-enter-rotate: initial;\n  --tw-enter-translate-x: initial;\n  --tw-enter-translate-y: initial;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:animate-in[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:animate-in[data-state="open"] {\n  animation-name: enter;\n  animation-duration: 150ms;\n  --tw-enter-opacity: initial;\n  --tw-enter-scale: initial;\n  --tw-enter-rotate: initial;\n  --tw-enter-translate-x: initial;\n  --tw-enter-translate-y: initial;\n}\n:where(.stack-scope) .data-\\[state\\=visible\\]\\:animate-in[data-state="visible"], :where(.stack-scope).data-\\[state\\=visible\\]\\:animate-in[data-state="visible"] {\n  animation-name: enter;\n  animation-duration: 150ms;\n  --tw-enter-opacity: initial;\n  --tw-enter-scale: initial;\n  --tw-enter-rotate: initial;\n  --tw-enter-translate-x: initial;\n  --tw-enter-translate-y: initial;\n}\n:where(.stack-scope) .data-\\[motion\\^\\=to-\\]\\:animate-out[data-motion^="to-"], :where(.stack-scope).data-\\[motion\\^\\=to-\\]\\:animate-out[data-motion^="to-"] {\n  animation-name: exit;\n  animation-duration: 150ms;\n  --tw-exit-opacity: initial;\n  --tw-exit-scale: initial;\n  --tw-exit-rotate: initial;\n  --tw-exit-translate-x: initial;\n  --tw-exit-translate-y: initial;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:animate-out[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:animate-out[data-state="closed"] {\n  animation-name: exit;\n  animation-duration: 150ms;\n  --tw-exit-opacity: initial;\n  --tw-exit-scale: initial;\n  --tw-exit-rotate: initial;\n  --tw-exit-translate-x: initial;\n  --tw-exit-translate-y: initial;\n}\n:where(.stack-scope) .data-\\[state\\=hidden\\]\\:animate-out[data-state="hidden"], :where(.stack-scope).data-\\[state\\=hidden\\]\\:animate-out[data-state="hidden"] {\n  animation-name: exit;\n  animation-duration: 150ms;\n  --tw-exit-opacity: initial;\n  --tw-exit-scale: initial;\n  --tw-exit-rotate: initial;\n  --tw-exit-translate-x: initial;\n  --tw-exit-translate-y: initial;\n}\n:where(.stack-scope) .data-\\[swipe\\=end\\]\\:animate-out[data-swipe="end"], :where(.stack-scope).data-\\[swipe\\=end\\]\\:animate-out[data-swipe="end"] {\n  animation-name: exit;\n  animation-duration: 150ms;\n  --tw-exit-opacity: initial;\n  --tw-exit-scale: initial;\n  --tw-exit-rotate: initial;\n  --tw-exit-translate-x: initial;\n  --tw-exit-translate-y: initial;\n}\n:where(.stack-scope) .data-\\[motion\\^\\=from-\\]\\:fade-in[data-motion^="from-"], :where(.stack-scope).data-\\[motion\\^\\=from-\\]\\:fade-in[data-motion^="from-"] {\n  --tw-enter-opacity: 0;\n}\n:where(.stack-scope) .data-\\[motion\\^\\=to-\\]\\:fade-out[data-motion^="to-"], :where(.stack-scope).data-\\[motion\\^\\=to-\\]\\:fade-out[data-motion^="to-"] {\n  --tw-exit-opacity: 0;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:fade-out[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:fade-out[data-state="closed"] {\n  --tw-exit-opacity: 0;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:fade-out-0[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:fade-out-0[data-state="closed"] {\n  --tw-exit-opacity: 0;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:fade-out-80[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:fade-out-80[data-state="closed"] {\n  --tw-exit-opacity: 0.8;\n}\n:where(.stack-scope) .data-\\[state\\=hidden\\]\\:fade-out[data-state="hidden"], :where(.stack-scope).data-\\[state\\=hidden\\]\\:fade-out[data-state="hidden"] {\n  --tw-exit-opacity: 0;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:fade-in[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:fade-in[data-state="open"] {\n  --tw-enter-opacity: 0;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:fade-in-0[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:fade-in-0[data-state="open"] {\n  --tw-enter-opacity: 0;\n}\n:where(.stack-scope) .data-\\[state\\=visible\\]\\:fade-in[data-state="visible"], :where(.stack-scope).data-\\[state\\=visible\\]\\:fade-in[data-state="visible"] {\n  --tw-enter-opacity: 0;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:zoom-out-95[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:zoom-out-95[data-state="closed"] {\n  --tw-exit-scale: .95;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:zoom-in-90[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:zoom-in-90[data-state="open"] {\n  --tw-enter-scale: .9;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:zoom-in-95[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:zoom-in-95[data-state="open"] {\n  --tw-enter-scale: .95;\n}\n:where(.stack-scope) .data-\\[motion\\=from-end\\]\\:slide-in-from-right-52[data-motion="from-end"], :where(.stack-scope).data-\\[motion\\=from-end\\]\\:slide-in-from-right-52[data-motion="from-end"] {\n  --tw-enter-translate-x: 13rem;\n}\n:where(.stack-scope) .data-\\[motion\\=from-start\\]\\:slide-in-from-left-52[data-motion="from-start"], :where(.stack-scope).data-\\[motion\\=from-start\\]\\:slide-in-from-left-52[data-motion="from-start"] {\n  --tw-enter-translate-x: -13rem;\n}\n:where(.stack-scope) .data-\\[motion\\=to-end\\]\\:slide-out-to-right-52[data-motion="to-end"], :where(.stack-scope).data-\\[motion\\=to-end\\]\\:slide-out-to-right-52[data-motion="to-end"] {\n  --tw-exit-translate-x: 13rem;\n}\n:where(.stack-scope) .data-\\[motion\\=to-start\\]\\:slide-out-to-left-52[data-motion="to-start"], :where(.stack-scope).data-\\[motion\\=to-start\\]\\:slide-out-to-left-52[data-motion="to-start"] {\n  --tw-exit-translate-x: -13rem;\n}\n:where(.stack-scope) .data-\\[side\\=bottom\\]\\:slide-in-from-top-2[data-side="bottom"], :where(.stack-scope).data-\\[side\\=bottom\\]\\:slide-in-from-top-2[data-side="bottom"] {\n  --tw-enter-translate-y: -0.5rem;\n}\n:where(.stack-scope) .data-\\[side\\=left\\]\\:slide-in-from-right-2[data-side="left"], :where(.stack-scope).data-\\[side\\=left\\]\\:slide-in-from-right-2[data-side="left"] {\n  --tw-enter-translate-x: 0.5rem;\n}\n:where(.stack-scope) .data-\\[side\\=right\\]\\:slide-in-from-left-2[data-side="right"], :where(.stack-scope).data-\\[side\\=right\\]\\:slide-in-from-left-2[data-side="right"] {\n  --tw-enter-translate-x: -0.5rem;\n}\n:where(.stack-scope) .data-\\[side\\=top\\]\\:slide-in-from-bottom-2[data-side="top"], :where(.stack-scope).data-\\[side\\=top\\]\\:slide-in-from-bottom-2[data-side="top"] {\n  --tw-enter-translate-y: 0.5rem;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:slide-out-to-bottom[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:slide-out-to-bottom[data-state="closed"] {\n  --tw-exit-translate-y: 100%;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:slide-out-to-left[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:slide-out-to-left[data-state="closed"] {\n  --tw-exit-translate-x: -100%;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:slide-out-to-left-1\\/2[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:slide-out-to-left-1\\/2[data-state="closed"] {\n  --tw-exit-translate-x: -50%;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:slide-out-to-right[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:slide-out-to-right[data-state="closed"] {\n  --tw-exit-translate-x: 100%;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:slide-out-to-right-full[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:slide-out-to-right-full[data-state="closed"] {\n  --tw-exit-translate-x: 100%;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:slide-out-to-top[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:slide-out-to-top[data-state="closed"] {\n  --tw-exit-translate-y: -100%;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:slide-out-to-top-\\[48\\%\\][data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:slide-out-to-top-\\[48\\%\\][data-state="closed"] {\n  --tw-exit-translate-y: -48%;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:slide-in-from-bottom[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:slide-in-from-bottom[data-state="open"] {\n  --tw-enter-translate-y: 100%;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:slide-in-from-left[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:slide-in-from-left[data-state="open"] {\n  --tw-enter-translate-x: -100%;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:slide-in-from-left-1\\/2[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:slide-in-from-left-1\\/2[data-state="open"] {\n  --tw-enter-translate-x: -50%;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:slide-in-from-right[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:slide-in-from-right[data-state="open"] {\n  --tw-enter-translate-x: 100%;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:slide-in-from-top[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:slide-in-from-top[data-state="open"] {\n  --tw-enter-translate-y: -100%;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:slide-in-from-top-\\[48\\%\\][data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:slide-in-from-top-\\[48\\%\\][data-state="open"] {\n  --tw-enter-translate-y: -48%;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:slide-in-from-top-full[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:slide-in-from-top-full[data-state="open"] {\n  --tw-enter-translate-y: -100%;\n}\n:where(.stack-scope) .data-\\[state\\=closed\\]\\:duration-100[data-state="closed"], :where(.stack-scope).data-\\[state\\=closed\\]\\:duration-100[data-state="closed"] {\n  animation-duration: 100ms;\n}\n:where(.stack-scope) .data-\\[state\\=open\\]\\:duration-100[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:duration-100[data-state="open"] {\n  animation-duration: 100ms;\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:after\\:left-0[data-panel-group-direction="vertical"]::after, :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:after\\:left-0[data-panel-group-direction="vertical"]::after {\n  content: var(--tw-content);\n  left: 0px;\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:after\\:h-1[data-panel-group-direction="vertical"]::after, :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:after\\:h-1[data-panel-group-direction="vertical"]::after {\n  content: var(--tw-content);\n  height: 0.25rem;\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:after\\:w-full[data-panel-group-direction="vertical"]::after, :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:after\\:w-full[data-panel-group-direction="vertical"]::after {\n  content: var(--tw-content);\n  width: 100%;\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:after\\:-translate-y-1\\/2[data-panel-group-direction="vertical"]::after, :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:after\\:-translate-y-1\\/2[data-panel-group-direction="vertical"]::after {\n  content: var(--tw-content);\n  --tw-translate-y: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .data-\\[panel-group-direction\\=vertical\\]\\:after\\:translate-x-0[data-panel-group-direction="vertical"]::after, :where(.stack-scope).data-\\[panel-group-direction\\=vertical\\]\\:after\\:translate-x-0[data-panel-group-direction="vertical"]::after {\n  content: var(--tw-content);\n  --tw-translate-x: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .group[data-state="open"] .group-data-\\[state\\=open\\]\\:rotate-180, :where(.stack-scope).group[data-state="open"] .group-data-\\[state\\=open\\]\\:rotate-180 {\n  --tw-rotate: 180deg;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n@media (min-width: 640px) {\n  :where(.stack-scope) .sm\\:bottom-0, :where(.stack-scope).sm\\:bottom-0 {\n    bottom: 0px;\n  }\n\n  :where(.stack-scope) .sm\\:right-0, :where(.stack-scope).sm\\:right-0 {\n    right: 0px;\n  }\n\n  :where(.stack-scope) .sm\\:top-auto, :where(.stack-scope).sm\\:top-auto {\n    top: auto;\n  }\n\n  :where(.stack-scope) .sm\\:flex, :where(.stack-scope).sm\\:flex {\n    display: flex;\n  }\n\n  :where(.stack-scope) .sm\\:hidden, :where(.stack-scope).sm\\:hidden {\n    display: none;\n  }\n\n  :where(.stack-scope) .sm\\:max-w-sm, :where(.stack-scope).sm\\:max-w-sm {\n    max-width: 24rem;\n  }\n\n  :where(.stack-scope) .sm\\:flex-1, :where(.stack-scope).sm\\:flex-1 {\n    flex: 1 1 0%;\n  }\n\n  :where(.stack-scope) .sm\\:flex-row, :where(.stack-scope).sm\\:flex-row {\n    flex-direction: row;\n  }\n\n  :where(.stack-scope) .sm\\:flex-col, :where(.stack-scope).sm\\:flex-col {\n    flex-direction: column;\n  }\n\n  :where(.stack-scope) .sm\\:items-end, :where(.stack-scope).sm\\:items-end {\n    align-items: flex-end;\n  }\n\n  :where(.stack-scope) .sm\\:justify-end, :where(.stack-scope).sm\\:justify-end {\n    justify-content: flex-end;\n  }\n\n  :where(.stack-scope) .sm\\:gap-2\\.5, :where(.stack-scope).sm\\:gap-2\\.5 {\n    gap: 0.625rem;\n  }\n\n  :where(.stack-scope) .sm\\:gap-y-0, :where(.stack-scope).sm\\:gap-y-0 {\n    row-gap: 0px;\n  }\n\n  :where(.stack-scope) .sm\\:space-x-2 > :not([hidden]) ~ :not([hidden]), :where(.stack-scope).sm\\:space-x-2 > :not([hidden]) ~ :not([hidden]) {\n    --tw-space-x-reverse: 0;\n    margin-right: calc(0.5rem * var(--tw-space-x-reverse));\n    margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));\n  }\n\n  :where(.stack-scope) .sm\\:rounded-lg, :where(.stack-scope).sm\\:rounded-lg {\n    border-radius: var(--radius);\n  }\n\n  :where(.stack-scope) .sm\\:bg-muted, :where(.stack-scope).sm\\:bg-muted {\n    background-color: hsl(var(--muted));\n  }\n\n  :where(.stack-scope) .sm\\:text-left, :where(.stack-scope).sm\\:text-left {\n    text-align: left;\n  }\n\n  :where(.stack-scope) .data-\\[state\\=open\\]\\:sm\\:slide-in-from-bottom-full[data-state="open"], :where(.stack-scope).data-\\[state\\=open\\]\\:sm\\:slide-in-from-bottom-full[data-state="open"] {\n    --tw-enter-translate-y: 100%;\n  }\n}\n@media (min-width: 768px) {\n  :where(.stack-scope) .md\\:absolute, :where(.stack-scope).md\\:absolute {\n    position: absolute;\n  }\n\n  :where(.stack-scope) .md\\:w-\\[90\\%\\], :where(.stack-scope).md\\:w-\\[90\\%\\] {\n    width: 90%;\n  }\n\n  :where(.stack-scope) .md\\:w-\\[var\\(--radix-navigation-menu-viewport-width\\)\\], :where(.stack-scope).md\\:w-\\[var\\(--radix-navigation-menu-viewport-width\\)\\] {\n    width: var(--radix-navigation-menu-viewport-width);\n  }\n\n  :where(.stack-scope) .md\\:w-auto, :where(.stack-scope).md\\:w-auto {\n    width: auto;\n  }\n\n  :where(.stack-scope) .md\\:max-w-\\[420px\\], :where(.stack-scope).md\\:max-w-\\[420px\\] {\n    max-width: 420px;\n  }\n\n  :where(.stack-scope) .md\\:flex-row, :where(.stack-scope).md\\:flex-row {\n    flex-direction: row;\n  }\n\n  :where(.stack-scope) .md\\:justify-end, :where(.stack-scope).md\\:justify-end {\n    justify-content: flex-end;\n  }\n\n  :where(.stack-scope) .md\\:gap-4, :where(.stack-scope).md\\:gap-4 {\n    gap: 1rem;\n  }\n}\n@media (min-width: 1024px) {\n  :where(.stack-scope) .lg\\:flex, :where(.stack-scope).lg\\:flex {\n    display: flex;\n  }\n\n  :where(.stack-scope) .lg\\:hidden, :where(.stack-scope).lg\\:hidden {\n    display: none;\n  }\n\n  :where(.stack-scope) .lg\\:gap-x-8, :where(.stack-scope).lg\\:gap-x-8 {\n    -moz-column-gap: 2rem;\n         column-gap: 2rem;\n  }\n\n  :where(.stack-scope) .lg\\:px-3, :where(.stack-scope).lg\\:px-3 {\n    padding-left: 0.75rem;\n    padding-right: 0.75rem;\n  }\n}\n:where(.stack-scope) .dark\\:border-destructive:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:border-destructive:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  border-color: hsl(var(--destructive));\n}\n:where(.stack-scope) .dark\\:border-gray-600:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:border-gray-600:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-border-opacity: 1;\n  border-color: rgb(75 85 99 / var(--tw-border-opacity));\n}\n:where(.stack-scope) .dark\\:border-success:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:border-success:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  border-color: hsl(var(--success));\n}\n:where(.stack-scope) .dark\\:bg-black:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:bg-black:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-bg-opacity: 1;\n  background-color: rgb(0 0 0 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .dark\\:bg-black\\/20:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:bg-black\\/20:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  background-color: rgb(0 0 0 / 0.2);\n}\n:where(.stack-scope) .dark\\:bg-gray-500:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:bg-gray-500:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-bg-opacity: 1;\n  background-color: rgb(107 114 128 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .dark\\:bg-gray-700:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:bg-gray-700:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-bg-opacity: 1;\n  background-color: rgb(55 65 81 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .dark\\:bg-gray-800:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:bg-gray-800:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-bg-opacity: 1;\n  background-color: rgb(31 41 55 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .dark\\:bg-zinc-800:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:bg-zinc-800:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-bg-opacity: 1;\n  background-color: rgb(39 39 42 / var(--tw-bg-opacity));\n}\n:where(.stack-scope) .dark\\:text-foreground:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:text-foreground:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  color: hsl(var(--foreground));\n}\n:where(.stack-scope) .dark\\:text-gray-300:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:text-gray-300:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-text-opacity: 1;\n  color: rgb(209 213 219 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .dark\\:text-gray-400:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:text-gray-400:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-text-opacity: 1;\n  color: rgb(156 163 175 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .dark\\:text-white:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:text-white:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .dark\\:text-zinc-300:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:text-zinc-300:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-text-opacity: 1;\n  color: rgb(212 212 216 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .dark\\:text-zinc-400:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:text-zinc-400:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-text-opacity: 1;\n  color: rgb(161 161 170 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .dark\\:text-zinc-800:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *), :where(.stack-scope).dark\\:text-zinc-800:where(html:has(head > [data-stack-theme="dark"]), html:has(head > [data-stack-theme="dark"]) *) {\n  --tw-text-opacity: 1;\n  color: rgb(39 39 42 / var(--tw-text-opacity));\n}\n:where(.stack-scope) .\\[\\&\\+div\\]\\:text-xs+div, :where(.stack-scope).\\[\\&\\+div\\]\\:text-xs+div {\n  font-size: 0.75rem;\n  line-height: 1rem;\n}\n:where(.stack-scope) .\\[\\&\\:has\\(\\>\\.range_end\\)\\]\\:rounded-r-md:has(>.range end), :where(.stack-scope).\\[\\&\\:has\\(\\>\\.range_end\\)\\]\\:rounded-r-md:has(>.range end) {\n  border-top-right-radius: calc(var(--radius) - 2px);\n  border-bottom-right-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .\\[\\&\\:has\\(\\>\\.range_start\\)\\]\\:rounded-l-md:has(>.range start), :where(.stack-scope).\\[\\&\\:has\\(\\>\\.range_start\\)\\]\\:rounded-l-md:has(>.range start) {\n  border-top-left-radius: calc(var(--radius) - 2px);\n  border-bottom-left-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:rounded-md:has([aria-selected]), :where(.stack-scope).\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:rounded-md:has([aria-selected]) {\n  border-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:bg-accent:has([aria-selected]), :where(.stack-scope).\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:bg-accent:has([aria-selected]) {\n  background-color: hsl(var(--accent));\n}\n:where(.stack-scope) .first\\:\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:rounded-l-md:has([aria-selected]):first-child, :where(.stack-scope).first\\:\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:rounded-l-md:has([aria-selected]):first-child {\n  border-top-left-radius: calc(var(--radius) - 2px);\n  border-bottom-left-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .last\\:\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:rounded-r-md:has([aria-selected]):last-child, :where(.stack-scope).last\\:\\[\\&\\:has\\(\\[aria-selected\\]\\)\\]\\:rounded-r-md:has([aria-selected]):last-child {\n  border-top-right-radius: calc(var(--radius) - 2px);\n  border-bottom-right-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .\\[\\&\\:has\\(\\[aria-selected\\]\\.outside\\)\\]\\:bg-accent\\/50:has([aria-selected].outside), :where(.stack-scope).\\[\\&\\:has\\(\\[aria-selected\\]\\.outside\\)\\]\\:bg-accent\\/50:has([aria-selected].outside) {\n  background-color: hsl(var(--accent) / 0.5);\n}\n:where(.stack-scope) .\\[\\&\\:has\\(\\[aria-selected\\]\\.range_end\\)\\]\\:rounded-r-md:has([aria-selected].range end), :where(.stack-scope).\\[\\&\\:has\\(\\[aria-selected\\]\\.range_end\\)\\]\\:rounded-r-md:has([aria-selected].range end) {\n  border-top-right-radius: calc(var(--radius) - 2px);\n  border-bottom-right-radius: calc(var(--radius) - 2px);\n}\n:where(.stack-scope) .\\[\\&\\:has\\(\\[role\\=checkbox\\]\\)\\]\\:pr-0:has([role=checkbox]), :where(.stack-scope).\\[\\&\\:has\\(\\[role\\=checkbox\\]\\)\\]\\:pr-0:has([role=checkbox]) {\n  padding-right: 0px;\n}\n:where(.stack-scope) .\\[\\&\\>\\:not\\(\\.stack-button-do-not-hide-when-siblings-are\\)\\]\\:invisible>:not(.stack-button-do-not-hide-when-siblings-are), :where(.stack-scope).\\[\\&\\>\\:not\\(\\.stack-button-do-not-hide-when-siblings-are\\)\\]\\:invisible>:not(.stack-button-do-not-hide-when-siblings-are) {\n  visibility: hidden;\n}\n:where(.stack-scope) .\\[\\&\\>\\[role\\=checkbox\\]\\]\\:translate-y-\\[2px\\]>[role=checkbox], :where(.stack-scope).\\[\\&\\>\\[role\\=checkbox\\]\\]\\:translate-y-\\[2px\\]>[role=checkbox] {\n  --tw-translate-y: 2px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .\\[\\&\\>button\\]\\:hidden>button, :where(.stack-scope).\\[\\&\\>button\\]\\:hidden>button {\n  display: none;\n}\n:where(.stack-scope) .\\[\\&\\>span\\]\\:line-clamp-1>span, :where(.stack-scope).\\[\\&\\>span\\]\\:line-clamp-1>span {\n  overflow: hidden;\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 1;\n}\n:where(.stack-scope) .\\[\\&\\>svg\\+div\\]\\:translate-y-\\[-3px\\]>svg+div, :where(.stack-scope).\\[\\&\\>svg\\+div\\]\\:translate-y-\\[-3px\\]>svg+div {\n  --tw-translate-y: -3px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .\\[\\&\\>svg\\]\\:absolute>svg, :where(.stack-scope).\\[\\&\\>svg\\]\\:absolute>svg {\n  position: absolute;\n}\n:where(.stack-scope) .\\[\\&\\>svg\\]\\:left-4>svg, :where(.stack-scope).\\[\\&\\>svg\\]\\:left-4>svg {\n  left: 1rem;\n}\n:where(.stack-scope) .\\[\\&\\>svg\\]\\:top-4>svg, :where(.stack-scope).\\[\\&\\>svg\\]\\:top-4>svg {\n  top: 1rem;\n}\n:where(.stack-scope) .\\[\\&\\>svg\\]\\:size-3\\.5>svg, :where(.stack-scope).\\[\\&\\>svg\\]\\:size-3\\.5>svg {\n  width: 0.875rem;\n  height: 0.875rem;\n}\n:where(.stack-scope) .\\[\\&\\>svg\\]\\:text-destructive>svg, :where(.stack-scope).\\[\\&\\>svg\\]\\:text-destructive>svg {\n  color: hsl(var(--destructive));\n}\n:where(.stack-scope) .\\[\\&\\>svg\\]\\:text-foreground>svg, :where(.stack-scope).\\[\\&\\>svg\\]\\:text-foreground>svg {\n  color: hsl(var(--foreground));\n}\n:where(.stack-scope) .\\[\\&\\>svg\\]\\:text-success>svg, :where(.stack-scope).\\[\\&\\>svg\\]\\:text-success>svg {\n  color: hsl(var(--success));\n}\n:where(.stack-scope) .\\[\\&\\>svg\\~\\*\\]\\:pl-7>svg~*, :where(.stack-scope).\\[\\&\\>svg\\~\\*\\]\\:pl-7>svg~* {\n  padding-left: 1.75rem;\n}\n:where(.stack-scope) .\\[\\&\\>tr\\]\\:last\\:border-b-0:last-child>tr, :where(.stack-scope).\\[\\&\\>tr\\]\\:last\\:border-b-0:last-child>tr {\n  border-bottom-width: 0px;\n}\n:where(.stack-scope) .\\[\\&\\[data-panel-group-direction\\=vertical\\]\\>div\\]\\:rotate-90[data-panel-group-direction=vertical]>div, :where(.stack-scope).\\[\\&\\[data-panel-group-direction\\=vertical\\]\\>div\\]\\:rotate-90[data-panel-group-direction=vertical]>div {\n  --tw-rotate: 90deg;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .\\[\\&\\[data-state\\=open\\]\\>svg\\]\\:rotate-180[data-state=open]>svg, :where(.stack-scope).\\[\\&\\[data-state\\=open\\]\\>svg\\]\\:rotate-180[data-state=open]>svg {\n  --tw-rotate: 180deg;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-group-heading\\]\\]\\:px-2 [cmdk-group-heading], :where(.stack-scope).\\[\\&_\\[cmdk-group-heading\\]\\]\\:px-2 [cmdk-group-heading] {\n  padding-left: 0.5rem;\n  padding-right: 0.5rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-group-heading\\]\\]\\:py-1\\.5 [cmdk-group-heading], :where(.stack-scope).\\[\\&_\\[cmdk-group-heading\\]\\]\\:py-1\\.5 [cmdk-group-heading] {\n  padding-top: 0.375rem;\n  padding-bottom: 0.375rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-group-heading\\]\\]\\:text-xs [cmdk-group-heading], :where(.stack-scope).\\[\\&_\\[cmdk-group-heading\\]\\]\\:text-xs [cmdk-group-heading] {\n  font-size: 0.75rem;\n  line-height: 1rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-group-heading\\]\\]\\:font-medium [cmdk-group-heading], :where(.stack-scope).\\[\\&_\\[cmdk-group-heading\\]\\]\\:font-medium [cmdk-group-heading] {\n  font-weight: 500;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-group-heading\\]\\]\\:text-muted-foreground [cmdk-group-heading], :where(.stack-scope).\\[\\&_\\[cmdk-group-heading\\]\\]\\:text-muted-foreground [cmdk-group-heading] {\n  color: hsl(var(--muted-foreground));\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-group\\]\\:not\\(\\[hidden\\]\\)_\\~\\[cmdk-group\\]\\]\\:pt-0 [cmdk-group]:not([hidden]) ~[cmdk-group], :where(.stack-scope).\\[\\&_\\[cmdk-group\\]\\:not\\(\\[hidden\\]\\)_\\~\\[cmdk-group\\]\\]\\:pt-0 [cmdk-group]:not([hidden]) ~[cmdk-group] {\n  padding-top: 0px;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-group\\]\\]\\:px-2 [cmdk-group], :where(.stack-scope).\\[\\&_\\[cmdk-group\\]\\]\\:px-2 [cmdk-group] {\n  padding-left: 0.5rem;\n  padding-right: 0.5rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-input-wrapper\\]_svg\\]\\:h-5 [cmdk-input-wrapper] svg, :where(.stack-scope).\\[\\&_\\[cmdk-input-wrapper\\]_svg\\]\\:h-5 [cmdk-input-wrapper] svg {\n  height: 1.25rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-input-wrapper\\]_svg\\]\\:w-5 [cmdk-input-wrapper] svg, :where(.stack-scope).\\[\\&_\\[cmdk-input-wrapper\\]_svg\\]\\:w-5 [cmdk-input-wrapper] svg {\n  width: 1.25rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-input\\]\\]\\:h-12 [cmdk-input], :where(.stack-scope).\\[\\&_\\[cmdk-input\\]\\]\\:h-12 [cmdk-input] {\n  height: 3rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-item\\]\\]\\:px-2 [cmdk-item], :where(.stack-scope).\\[\\&_\\[cmdk-item\\]\\]\\:px-2 [cmdk-item] {\n  padding-left: 0.5rem;\n  padding-right: 0.5rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-item\\]\\]\\:py-3 [cmdk-item], :where(.stack-scope).\\[\\&_\\[cmdk-item\\]\\]\\:py-3 [cmdk-item] {\n  padding-top: 0.75rem;\n  padding-bottom: 0.75rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-item\\]_svg\\]\\:h-5 [cmdk-item] svg, :where(.stack-scope).\\[\\&_\\[cmdk-item\\]_svg\\]\\:h-5 [cmdk-item] svg {\n  height: 1.25rem;\n}\n:where(.stack-scope) .\\[\\&_\\[cmdk-item\\]_svg\\]\\:w-5 [cmdk-item] svg, :where(.stack-scope).\\[\\&_\\[cmdk-item\\]_svg\\]\\:w-5 [cmdk-item] svg {\n  width: 1.25rem;\n}\n:where(.stack-scope) .\\[\\&_p\\]\\:leading-relaxed p, :where(.stack-scope).\\[\\&_p\\]\\:leading-relaxed p {\n  line-height: 1.625;\n}\n:where(.stack-scope) .\\[\\&_svg\\]\\:invisible svg, :where(.stack-scope).\\[\\&_svg\\]\\:invisible svg {\n  visibility: hidden;\n}\n:where(.stack-scope) .\\[\\&_tr\\:last-child\\]\\:border-0 tr:last-child, :where(.stack-scope).\\[\\&_tr\\:last-child\\]\\:border-0 tr:last-child {\n  border-width: 0px;\n}\n:where(.stack-scope) .\\[\\&_tr\\]\\:border-b tr, :where(.stack-scope).\\[\\&_tr\\]\\:border-b tr {\n  border-bottom-width: 1px;\n}';
;
 //# sourceMappingURL=global-css.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/components/elements/ssr-layout-effect.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SsrScript",
    ()=>SsrScript
]);
// src/components/elements/ssr-layout-effect.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
"use client";
"use client";
;
;
function SsrScript(props) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SsrScript.useLayoutEffect": ()=>{
            (0, eval)(props.script);
        }
    }["SsrScript.useLayoutEffect"], []);
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])("script", {
        suppressHydrationWarning: true,
        nonce: props.nonce,
        dangerouslySetInnerHTML: {
            __html: props.script
        }
    });
}
;
 //# sourceMappingURL=ssr-layout-effect.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/browser-script.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/browser-script.tsx
__turbopack_context__.s([
    "BrowserScript",
    ()=>BrowserScript
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$components$2f$elements$2f$ssr$2d$layout$2d$effect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/components/elements/ssr-layout-effect.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
;
;
var script = ()=>{
    const attributes = [
        "data-joy-color-scheme",
        "data-mui-color-scheme",
        "data-theme",
        "data-color-scheme",
        "class"
    ];
    const getColorMode = (value)=>{
        if (value.includes("dark")) {
            return "dark";
        }
        if (value.includes("light")) {
            return "light";
        }
        return null;
    };
    const setTheme = (mode)=>{
        let el = document.getElementById(`--stack-theme-mode`);
        if (!el) {
            el = document.createElement("style");
            el.id = `--stack-theme-mode`;
            el.innerHTML = `/* This tag is used by Stack Auth to set the theme in the browser without causing a hydration error (since React ignores additional tags in the <head>). We later use the \`html:has(head > [data-stack-theme=XYZ])\` selector to apply styles based on the theme. */`;
            document.head.appendChild(el);
        }
        el.setAttribute("data-stack-theme", mode);
    };
    const colorToRGB = (color)=>{
        const temp = document.createElement("div");
        temp.style.color = color;
        document.body.appendChild(temp);
        const computedColor = getComputedStyle(temp).color;
        document.body.removeChild(temp);
        const match = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (match) {
            return [
                parseInt(match[1]),
                parseInt(match[2]),
                parseInt(match[3])
            ];
        }
        return null;
    };
    const rgbToLuma = (rgb)=>{
        return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1e3;
    };
    const copyFromColorScheme = ()=>{
        const colorScheme = getComputedStyle(document.documentElement).getPropertyValue("color-scheme");
        if (colorScheme) {
            const mode = getColorMode(colorScheme);
            if (mode) {
                setTheme(mode);
                return true;
            }
        }
        return false;
    };
    const copyFromVariables = ()=>{
        let backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--background");
        if (backgroundColor) {
            if (/^\d+\s\d+%\s\d+(\.\d+)?%$/.test(backgroundColor)) {
                backgroundColor = `hsl(${backgroundColor})`;
            }
            const rgb = colorToRGB(backgroundColor);
            if (rgb) {
                const luma = rgbToLuma(rgb);
                if (luma < 128) {
                    setTheme("dark");
                } else {
                    setTheme("light");
                }
                return true;
            }
        }
        return false;
    };
    const copyFromAttributes = ()=>{
        for (const attributeName of attributes){
            const colorTheme = document.documentElement.getAttribute(attributeName);
            if (colorTheme) {
                const mode = getColorMode(colorTheme);
                if (mode) {
                    setTheme(mode);
                    return true;
                }
            }
        }
        return false;
    };
    const observer = new MutationObserver((mutations)=>{
        mutations.forEach((mutation)=>{
            if (copyFromColorScheme()) {
                return;
            }
            if (mutation.attributeName && attributes.includes(mutation.attributeName) && copyFromAttributes()) {
                return;
            }
            if (copyFromVariables()) {
                return;
            }
        });
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: attributes
    });
    if (!copyFromColorScheme()) {
        if (!copyFromAttributes()) {
            copyFromVariables();
        }
    }
};
function BrowserScript(props) {
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$components$2f$elements$2f$ssr$2d$layout$2d$effect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SsrScript"], {
        nonce: props.nonce,
        script: `(${script.toString()})()`
    });
}
;
 //# sourceMappingURL=browser-script.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/constants.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/constants.tsx
__turbopack_context__.s([
    "DEFAULT_THEME",
    ()=>DEFAULT_THEME,
    "FONT_FAMILY",
    ()=>FONT_FAMILY,
    "FONT_SIZES",
    ()=>FONT_SIZES,
    "LINE_HEIGHTS",
    ()=>LINE_HEIGHTS,
    "LINK_COLORS",
    ()=>LINK_COLORS,
    "PRIMARY_FONT_COLORS",
    ()=>PRIMARY_FONT_COLORS,
    "SECONDARY_FONT_COLORS",
    ()=>SECONDARY_FONT_COLORS,
    "SELECTED_BACKGROUND_COLORS",
    ()=>SELECTED_BACKGROUND_COLORS,
    "SHADOW",
    ()=>SHADOW
]);
var FONT_SIZES = {
    "xs": "0.75rem",
    "sm": "0.875rem",
    "md": "1rem",
    "lg": "1.125rem",
    "xl": "1.25rem"
};
var LINE_HEIGHTS = {
    "xs": "1rem",
    "sm": "1.25rem",
    "md": "1.5rem",
    "lg": "1.75rem",
    "xl": "2rem"
};
var FONT_FAMILY = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
var PRIMARY_FONT_COLORS = {
    "dark": "white",
    "light": "black"
};
var SECONDARY_FONT_COLORS = {
    "dark": "#a8a8a8",
    "light": "#737373"
};
var SELECTED_BACKGROUND_COLORS = {
    "dark": "rgba(255, 255, 255, 0.1)",
    "light": "rgba(0, 0, 0, 0.04)"
};
var LINK_COLORS = {
    "dark": "#fff",
    "light": "#000"
};
var SHADOW = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
var DEFAULT_THEME = {
    light: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(240 10% 3.9%)",
        card: "hsl(0 0% 100%)",
        cardForeground: "hsl(240 10% 3.9%)",
        popover: "hsl(0 0% 100%)",
        popoverForeground: "hsl(240 10% 3.9%)",
        primary: "hsl(240 5.9% 10%)",
        primaryForeground: "hsl(0 0% 98%)",
        secondary: "hsl(240 4.8% 95.9%)",
        secondaryForeground: "hsl(240 5.9% 10%)",
        muted: "hsl(240 4.8% 95.9%)",
        mutedForeground: "hsl(240 3.8% 46.1%)",
        accent: "hsl(240 4.8% 95.9%)",
        accentForeground: "hsl(240 5.9% 10%)",
        destructive: "hsl(0 84.2% 60.2%)",
        destructiveForeground: "hsl(0 0% 98%)",
        border: "hsl(240 5.9% 90%)",
        input: "hsl(240 5.9% 90%)",
        ring: "hsl(240 10% 3.9%)"
    },
    dark: {
        background: "hsl(240 10% 3.9%)",
        foreground: "hsl(0 0% 98%)",
        card: "hsl(240 10% 3.9%)",
        cardForeground: "hsl(0 0% 98%)",
        popover: "hsl(240 10% 3.9%)",
        popoverForeground: "hsl(0 0% 98%)",
        primary: "hsl(0 0% 98%)",
        primaryForeground: "hsl(240 5.9% 10%)",
        secondary: "hsl(240 3.7% 15.9%)",
        secondaryForeground: "hsl(0 0% 98%)",
        muted: "hsl(240 3.7% 15.9%)",
        mutedForeground: "hsl(240 5% 64.9%)",
        accent: "hsl(240 3.7% 15.9%)",
        accentForeground: "hsl(0 0% 98%)",
        destructive: "hsl(0 62.8% 50%)",
        destructiveForeground: "hsl(0 0% 98%)",
        border: "hsl(240 3.7% 15.9%)",
        input: "hsl(240 3.7% 15.9%)",
        ring: "hsl(240 4.9% 83.9%)"
    },
    radius: "0.5rem"
};
;
 //# sourceMappingURL=constants.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/providers/theme-provider.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StackTheme",
    ()=>StackTheme
]);
// src/providers/theme-provider.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$ui$2f$dist$2f$components$2f$ui$2f$tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-ui/dist/components/ui/tooltip.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$color$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/color/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$generated$2f$global$2d$css$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/generated/global-css.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$browser$2d$script$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/browser-script.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack/dist/esm/utils/constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
"use client";
"use client";
;
;
;
;
;
;
;
function convertColorToCSSVars(obj) {
    return Object.fromEntries(Object.entries(obj).map(([key, value])=>{
        const color = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$color$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(value).hsl().array();
        return [
            // Convert camelCase key to dash-case
            key.replace(/[A-Z]/g, (m)=>`-${m.toLowerCase()}`),
            // Convert color to CSS HSL string
            `${color[0]} ${color[1]}% ${color[2]}%`
        ];
    }));
}
function convertColorsToCSS(theme) {
    const { dark, light, ...rest } = theme;
    const colors = {
        light: {
            ...convertColorToCSSVars(light),
            ...rest
        },
        dark: convertColorToCSSVars(dark)
    };
    function colorsToCSSVars(colors2) {
        return Object.entries(colors2).map((params)=>{
            return `--${params[0]}: ${params[1]};
`;
        }).join("");
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
    .stack-scope {
      ${colorsToCSSVars(colors.light)}
    }
    html:has(head > [data-stack-theme="dark"]) .stack-scope { 
      ${colorsToCSSVars(colors.dark)}
    }
  `;
}
function StackTheme({ theme, children, nonce }) {
    const themeValue = {
        ...__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_THEME"],
        ...theme,
        dark: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_THEME"].dark,
            ...theme?.dark
        },
        light: {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_THEME"].light,
            ...theme?.light
        }
    };
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxs"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$utils$2f$browser$2d$script$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BrowserScript"], {
                nonce
            }),
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])("style", {
                suppressHydrationWarning: true,
                nonce,
                dangerouslySetInnerHTML: {
                    __html: __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$generated$2f$global$2d$css$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalCSS"] + "\n" + convertColorsToCSS(themeValue)
                }
            }),
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$ui$2f$dist$2f$components$2f$ui$2f$tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TooltipProvider"], {
                children
            })
        ]
    });
}
;
 //# sourceMappingURL=theme-provider.js.map
}),
]);

//# sourceMappingURL=797a3_%40stackframe_stack_dist_esm_48c672f7._.js.map