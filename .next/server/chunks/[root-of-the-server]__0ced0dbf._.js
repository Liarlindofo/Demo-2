module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},29173,(e,t,r)=>{t.exports=e.x("@prisma/client",()=>require("@prisma/client"))},935940,e=>{"use strict";var t=e.i(29173);let r=global.prisma??new t.PrismaClient({log:["error"],datasources:{db:{url:process.env.DATABASE_URL}}});process.on("beforeExit",async()=>{await r.$disconnect()}),e.s(["prisma",0,r])},224361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},688947,(e,t,r)=>{t.exports=e.x("stream",()=>require("stream"))},500874,(e,t,r)=>{t.exports=e.x("buffer",()=>require("buffer"))},620762,e=>{"use strict";function t(){return process.env.NEXT_PUBLIC_APP_URL??process.env.APP_URL??"https://platefull.com.br"}function r(e){return`${t()}/rider/setup?token=${e}`}function a(e,t){if(!e)return null;let r=e.replace(/\D/g,""),a=r.startsWith("55")?r:`55${r}`,o=encodeURIComponent(`Ol\xe1! Voc\xea foi cadastrado(a) como motoboy na plataforma Drin.

Clique no link abaixo para criar sua senha e acessar o portal:
${t}

O link \xe9 v\xe1lido por 30 dias.`);return`https://wa.me/${a}?text=${o}`}async function o(e){let{to:r,riderName:a,lojaNome:o,inviteLink:n}=e;if(!process.env.RESEND_API_KEY)return void console.warn("[rider-invite-email] RESEND_API_KEY não configurado — e-mail não enviado");let i=`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Platefull</p>
          <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Portal do Motoboy</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">Ol\xe1, <strong>${a}</strong>!</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Voc\xea foi cadastrado(a) como motoboy na loja <strong>${o}</strong>.
            Para acessar o portal e visualizar suas quinzenas e documentos, voc\xea precisa criar sua senha.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;">Clique no bot\xe3o abaixo para criar sua senha:</p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr><td style="background:#f97316;border-radius:8px;">
              <a href="${n}" target="_blank"
                style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#000000;text-decoration:none;">
                Criar minha senha
              </a>
            </td></tr>
          </table>

          <!-- Link alternativo -->
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Ou copie e cole este link no seu navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#f97316;word-break:break-all;">${n}</p>

          <p style="margin:0;font-size:13px;color:#9ca3af;">
            ⏳ Este link \xe9 v\xe1lido por <strong>30 dias</strong>. Ap\xf3s acessar, voc\xea poder\xe1 entrar sempre em:
            <br><a href="${t()}/rider/login" style="color:#f97316;">${t()}/rider/login</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Se voc\xea n\xe3o esperava este e-mail, pode ignor\xe1-lo com seguran\xe7a.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,s=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:"Platefull <noreply@platefull.com.br>",to:r,subject:`Bem-vindo(a) ao portal do motoboy — ${o}`,html:i})});if(!s.ok){let e=await s.text().catch(()=>"");throw Error(`Resend retornou ${s.status}: ${e}`)}}e.s(["buildInviteLink",()=>r,"buildWhatsAppLink",()=>a,"sendInviteEmail",()=>o])},297772,e=>{"use strict";var t=e.i(796156),r=e.i(453517),a=e.i(719985),o=e.i(983883),n=e.i(393415),i=e.i(341795),s=e.i(621603),l=e.i(993267),d=e.i(15070),p=e.i(536946),c=e.i(915849),u=e.i(625642),f=e.i(650816),x=e.i(269087),g=e.i(61136),m=e.i(248541),h=e.i(193695);e.i(100724);var b=e.i(625399),y=e.i(578685),v=e.i(935940),w=e.i(406701),R=e.i(620762);let E=process.env.NEXT_PUBLIC_APP_URL??process.env.APP_URL??"https://platefull.com.br";async function k(e){let{to:t,riderName:r,link:a}=e;if(!process.env.RESEND_API_KEY)return void console.warn("[forgot-password] RESEND_API_KEY não configurado — e-mail não enviado");let o=`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Platefull</p>
          <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Portal do Motoboy</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">Ol\xe1, <strong>${r}</strong>!</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Recebemos um pedido para <strong>redefinir sua senha</strong> no Portal do Motoboy.
            Clique no bot\xe3o abaixo para criar uma nova senha:
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr><td style="background:#f97316;border-radius:8px;">
              <a href="${a}" target="_blank"
                style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#000000;text-decoration:none;">
                Redefinir minha senha
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Ou copie e cole este link no seu navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#f97316;word-break:break-all;">${a}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">⏳ Este link expira em <strong>24 horas</strong>.</p>
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Se voc\xea n\xe3o solicitou a redefini\xe7\xe3o de senha, ignore este e-mail. Sua senha continua a mesma.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Acesse sempre em: <a href="${E}/rider/login" style="color:#f97316;">${E}/rider/login</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,n=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:"Platefull <noreply@platefull.com.br>",to:t,subject:"🔑 Redefinição de senha — Portal do Motoboy",html:o})});if(!n.ok){let e=await n.text().catch(()=>"");throw Error(`Resend retornou ${n.status}: ${e}`)}}async function P(e){try{let t=((await e.json()).email??"").trim().toLowerCase();if(!t)return y.NextResponse.json({error:"E-mail obrigatório"},{status:400});let r=await v.prisma.deliveryRider.findFirst({where:{email:{equals:t,mode:"insensitive"},status:"active"},include:{loja:{select:{nome:!0}}}});if(!r)return console.info(`[forgot-password] e-mail "${t}" n\xe3o encontrado (rider inativo ou inexistente)`),y.NextResponse.json({ok:!0});let a=(0,w.generateInviteToken)(),o=new Date(Date.now()+864e5);await v.prisma.deliveryRider.update({where:{id:r.id},data:{inviteToken:a,inviteTokenExpiresAt:o}});let n=(0,R.buildInviteLink)(a);console.info(`[forgot-password] enviando reset para ${r.email} (rider ${r.id})`);try{await k({to:r.email,riderName:r.name,link:n}),console.info(`[forgot-password] e-mail enviado com sucesso para ${r.email}`)}catch(e){console.error("[forgot-password] falha ao enviar e-mail:",e)}return y.NextResponse.json({ok:!0})}catch(e){return console.error("[POST /api/rider/forgot-password]",e),y.NextResponse.json({ok:!0})}}e.s(["POST",()=>P,"dynamic",0,"force-dynamic"],734648);var A=e.i(734648);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/rider/forgot-password/route",pathname:"/api/rider/forgot-password",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/Demo-2/app/api/rider/forgot-password/route.ts",nextConfigOutput:"",userland:A}),{workAsyncStorage:_,workUnitAsyncStorage:T,serverHooks:N}=C;function $(){return(0,a.patchFetch)({workAsyncStorage:_,workUnitAsyncStorage:T})}async function S(e,t,a){C.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/rider/forgot-password/route";y=y.replace(/\/index$/,"")||"/";let v=await C.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:w,params:R,nextConfig:E,parsedUrl:k,isDraftMode:P,prerenderManifest:A,routerServerContext:_,isOnDemandRevalidate:T,revalidateOnlyGenerated:N,resolvedPathname:$,clientReferenceManifest:S,serverActionsManifest:O}=v,q=(0,l.normalizeAppPath)(y),j=!!(A.dynamicRoutes[q]||A.routes[$]),I=async()=>((null==_?void 0:_.render404)?await _.render404(e,t,k,!1):t.end("This page could not be found"),null);if(j&&!P){let e=!!A.routes[$],t=A.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await I();throw new h.NoFallbackError}}let D=null;!j||C.isDev||P||(D="/index"===(D=$)?"/":D);let U=!0===C.isDev||!j,z=j&&!U;O&&S&&(0,i.setReferenceManifestsSingleton)({page:y,clientReferenceManifest:S,serverActionsManifest:O,serverModuleMap:(0,s.createServerModuleMap)({serverActionsManifest:O})});let H=e.method||"GET",M=(0,n.getTracer)(),L=M.getActiveScopeSpan(),B={params:R,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:U,incrementalCache:(0,o.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a)=>C.onRequestError(e,t,a,_)},sharedContext:{buildId:w}},K=new d.NodeNextRequest(e),F=new d.NodeNextResponse(t),Y=p.NextRequestAdapter.fromNodeNextRequest(K,(0,p.signalFromNodeResponse)(t));try{let i=async e=>C.handle(Y,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${H} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${y}`)}),s=!!(0,o.getRequestMeta)(e,"minimalMode"),l=async o=>{var n,l;let d=async({previousCacheEntry:r})=>{try{if(!s&&T&&N&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(o);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=B.renderOpts.collectedTags;if(!j)return await (0,f.sendResponse)(K,F,n,B.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,x.toNodeOutgoingHttpHeaders)(n.headers);d&&(t[m.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,a=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:b.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:z,isOnDemandRevalidate:T})},_),t}},p=await C.handleResponse({req:e,nextConfig:E,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:N,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:s});if(!j)return null;if((null==p||null==(n=p.value)?void 0:n.kind)!==b.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(l=p.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",T?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),P&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,x.fromNodeOutgoingHttpHeaders)(p.value.headers);return s&&j||c.delete(m.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,g.getCacheControlHeader)(p.cacheControl)),await (0,f.sendResponse)(K,F,new Response(p.value.body,{headers:c,status:p.value.status||200})),null};L?await l(L):await M.withPropagatedContext(e.headers,()=>M.trace(c.BaseServerSpan.handleRequest,{spanName:`${H} ${y}`,kind:n.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l))}catch(t){if(t instanceof h.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:z,isOnDemandRevalidate:T})}),j)throw t;return await (0,f.sendResponse)(K,F,new Response(null,{status:500})),null}}e.s(["handler",()=>S,"patchFetch",()=>$,"routeModule",()=>C,"serverHooks",()=>N,"workAsyncStorage",()=>_,"workUnitAsyncStorage",()=>T],297772)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ced0dbf._.js.map