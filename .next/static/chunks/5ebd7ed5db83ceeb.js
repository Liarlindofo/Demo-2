(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,189351,e=>{"use strict";var t=e.i(440184),a=e.i(370558),s=e.i(860495),i=e.i(819431),r=e.i(22703),l=e.i(912152);let n=(0,l.default)("scale",[["path",{d:"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"7g6ntu"}],["path",{d:"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"ijws7r"}],["path",{d:"M7 21h10",key:"1b0cd5"}],["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",key:"3gwbw2"}]]),o=(0,l.default)("cog",[["path",{d:"M11 10.27 7 3.34",key:"16pf9h"}],["path",{d:"m11 13.73-4 6.93",key:"794ttg"}],["path",{d:"M12 22v-2",key:"1osdcq"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M14 12h8",key:"4f43i9"}],["path",{d:"m17 20.66-1-1.73",key:"eq3orb"}],["path",{d:"m17 3.34-1 1.73",key:"2wel8s"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"m20.66 17-1.73-1",key:"sg0v6f"}],["path",{d:"m20.66 7-1.73 1",key:"1ow05n"}],["path",{d:"m3.34 17 1.73-1",key:"nuk764"}],["path",{d:"m3.34 7 1.73 1",key:"1ulond"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["circle",{cx:"12",cy:"12",r:"8",key:"46899m"}]]);var d=e.i(652307),m=e.i(971034),c=e.i(529283),p=e.i(484204),x=e.i(124921),h=e.i(263215),g=e.i(331197),b=e.i(22475),u=e.i(961788);let v={CONGELADO:[30,60,90],RESFRIADO:[3,4,5,7,15,20],"TEMPERATURA AMBIENTE":[7,15,20,30]};function f(){let e,l,f=(0,s.useRouter)(),j=(0,s.useSearchParams)().get("unidade"),[N,y]=(0,a.useState)("produto"),[w,k]=(0,a.useState)(!0),[C,S]=(0,a.useState)(!1),[q,E]=(0,a.useState)(""),[z,P]=(0,a.useState)(null),[$,D]=(0,a.useState)([]),[I,F]=(0,a.useState)([]),[R,T]=(0,a.useState)(""),[A,M]=(0,a.useState)(null),[B,O]=(0,a.useState)(""),[V,L]=(0,a.useState)(""),[U,G]=(0,a.useState)(""),[Q,H]=(0,a.useState)(""),[K,W]=(0,a.useState)(""),[Z,Y]=(0,a.useState)(0),[J,X]=(0,a.useState)(1),[_,ee]=(0,a.useState)({isOpen:!1,nomeId:null,nomeCompleto:""}),[et,ea]=(0,a.useState)(!1),[es,ei]=(0,a.useState)(""),[er,el]=(0,a.useState)(""),[en,eo]=(0,a.useState)(null),[ed,em]=(0,a.useState)(!1);(0,a.useEffect)(()=>{let e,t,a,s,i,r,l,n,o;j?(ec(),eo((e=navigator.userAgent||navigator.vendor||window.opera,t=/android/i.test(e),a=/iPad|iPhone|iPod/.test(e)&&!window.MSStream,s=!t&&!a,i=/Chrome/.test(e)&&/Google Inc/.test(navigator.vendor),r=/Edg/.test(e),l="bluetooth"in navigator&&(i||r)&&(t||s),n="serial"in navigator&&(i||r)&&s,{webBluetooth:(o={isAndroid:t,isIOS:a,isDesktop:s,isChrome:i,isEdge:r,supportsWebBluetooth:l,supportsWebSerial:n}).supportsWebBluetooth,webSerial:o.supportsWebSerial,webShare:"share"in navigator,download:!0,platform:o.isAndroid?"Android":o.isIOS?"iOS":"Desktop"}))):f.push("/etiquetagem")},[j]),(0,a.useEffect)(()=>{"preview"===N&&em(!0)},[N]),(0,a.useEffect)(()=>{"responsavel"===N&&I.length>0&&""===(B||"").trim()&&O(I[0].nomeCompleto)},[N,I,B]);let ec=async()=>{try{k(!0);let e=await fetch("/api/etiquetagem/unidades");if(!e.ok)throw Error("Erro ao carregar unidade");let t=(await e.json()).find(e=>e.id===j);if(!t)return void f.push("/etiquetagem");P(t);let[a,s]=await Promise.all([fetch("/api/etiquetagem/produtos"),fetch(`/api/etiquetagem/unidades/${j}/nomes`)]);if(!a.ok||!s.ok)throw Error("Erro ao carregar dados");let i=await a.json(),r=await s.json();D(i),F(r)}catch(e){console.error("Erro ao carregar dados:",e),E("Erro ao carregar dados. Tente novamente.")}finally{k(!1)}},ep=async(e,t)=>{ee({isOpen:!0,nomeId:e,nomeCompleto:t})},ex=async()=>{if(_.nomeId)try{if(!(await fetch(`/api/etiquetagem/nomes/${_.nomeId}`,{method:"DELETE"})).ok)throw Error("Erro ao excluir nome");F(I.filter(e=>e.id!==_.nomeId)),ee({isOpen:!1,nomeId:null,nomeCompleto:""})}catch(e){console.error("Erro ao excluir nome:",e)}},eh=()=>{if(!Z)return"";let e=new Date;e.setDate(e.getDate()+Z);let t=String(e.getDate()).padStart(2,"0"),a=String(e.getMonth()+1).padStart(2,"0");return`${t}/${a}`},eg=()=>{let e=new Date,t=String(e.getDate()).padStart(2,"0"),a=String(e.getMonth()+1).padStart(2,"0");return`${t}/${a}`},eb=()=>`${Z} dias`,eu=()=>`
      <table class="etiqueta-coluna" cellspacing="0" cellpadding="0">
        <tbody>
          <!-- Respons\xe1vel -->
          <tr>
            <td colspan="2" style="text-align: center; padding: 0.4mm 0.3mm;">
              <div style="font-size: 5.5pt; line-height: 1.1;">
                <span style="font-weight: normal;">Respons\xe1vel:</span><br>
                <span style="font-weight: bold; font-size: 6.5pt;">${B}</span>
              </div>
            </td>
          </tr>
          
          <!-- Divisor -->
          <tr>
            <td colspan="2" style="border-top: 1px solid black; height: 0.2mm; padding: 0;"></td>
          </tr>
          
          <!-- Cabe\xe7alho do Produto -->
          <tr>
            <td colspan="2" class="header" style="padding: 0.4mm 0.3mm;">
              <div style="text-align: center; font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.0;">
                ${A.nome} ${K}
              </div>
            </td>
          </tr>
          
          <!-- Divisor -->
          <tr>
            <td colspan="2" style="border-top: 1px solid black; height: 0.2mm; padding: 0;"></td>
          </tr>
          
          <!-- Peso/Qtd e Produzido -->
          <tr>
            <td style="width: 50%; padding: 0.4mm 0.3mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.2;">
                <span style="font-weight: normal;">Peso/Qtd:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${U} ${Q}</span>
              </div>
            </td>
            <td style="width: 50%; border-left: 1px solid black; padding: 0.4mm 0.3mm 0.4mm 0.5mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.2;">
                <span style="font-weight: normal;">Produzido:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${eg()}</span>
              </div>
            </td>
          </tr>
          
          <!-- Divisor -->
          <tr>
            <td colspan="2" style="border-top: 1px solid black; height: 0.2mm; padding: 0;"></td>
          </tr>
          
          <!-- Validade e Vence -->
          <tr>
            <td style="width: 50%; padding: 0.4mm 0.3mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.2;">
                <span style="font-weight: normal;">Validade:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${eb()}</span>
              </div>
            </td>
            <td style="width: 50%; border-left: 1px solid black; padding: 0.4mm 0.3mm 0.4mm 0.5mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.2;">
                <span style="font-weight: normal;">Vence:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${eh()}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    `,ev=$.filter(e=>e.nome.toLowerCase().includes(R.toLowerCase()));return w?(0,t.jsx)("div",{className:"min-h-screen bg-black text-white flex items-center justify-center",children:(0,t.jsx)("div",{className:"inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"})}):z?(0,t.jsx)("div",{className:"min-h-screen bg-black text-white",children:(0,t.jsxs)("div",{className:"container mx-auto px-4 py-8 max-w-4xl",children:[(0,t.jsxs)(h.Button,{onClick:()=>f.push("/etiquetagem"),variant:"ghost",className:"mb-6 text-gray-400 hover:text-white",children:[(0,t.jsx)(p.ArrowLeft,{className:"w-4 h-4 mr-2"}),"Voltar"]}),(0,t.jsx)("h1",{className:"text-3xl font-bold mb-8",children:"Gerar Etiqueta"}),(l=(e=[{key:"produto",label:"Produto"},{key:"responsavel",label:"Responsável"},{key:"peso",label:"Peso"},{key:"armazenamento",label:"Armazenamento"},{key:"dias",label:"Validade"},{key:"preview",label:"Pré-Visualização"}]).findIndex(e=>e.key===N),(0,t.jsx)("div",{className:"flex items-center justify-between mb-6 overflow-x-auto",children:e.map((a,s)=>(0,t.jsxs)("div",{className:"flex items-center flex-1 min-w-0",children:[(0,t.jsxs)("div",{className:"flex flex-col items-center min-w-0",children:[(0,t.jsx)("div",{className:`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${s<=l?"bg-[#001F05] text-white":"bg-[#374151] text-gray-400"}`,children:s+1}),(0,t.jsx)("span",{className:"text-xs mt-1 text-gray-400 hidden sm:block truncate",children:a.label})]}),s<e.length-1&&(0,t.jsx)("div",{className:`h-1 flex-1 mx-2 rounded ${s<l?"bg-[#001F05]":"bg-[#374151]"}`})]},a.key))})),q&&(0,t.jsx)("div",{className:"bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6",children:q}),"produto"===N&&(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)(i.Search,{className:"absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"}),(0,t.jsx)(g.Input,{type:"text",placeholder:"Buscar produto...",value:R,onChange:e=>T(e.target.value),className:"w-full pl-12 pr-4 py-3 bg-[#141415] border-[#374151] text-white"})]}),(0,t.jsx)("div",{className:"grid gap-3",children:ev.map(e=>(0,t.jsxs)("div",{onClick:()=>{M(e),G(e.pesoPadrao&&e.pesoPadrao>.01?e.pesoPadrao.toString():""),H(e.unidadeMedida&&""!==e.unidadeMedida.trim()?e.unidadeMedida:""),y("responsavel")},className:"bg-[#141415] border border-[#374151] rounded-xl p-4 hover:bg-[#374151] transition-colors cursor-pointer",children:[(0,t.jsx)("h3",{className:"font-semibold text-white mb-1",children:e.nome}),(0,t.jsx)("p",{className:"text-sm text-gray-400",children:e.categoria?.nome})]},e.id))})]}),"responsavel"===N&&(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(b.Label,{htmlFor:"nomeResponsavel",className:"text-gray-300 mb-2 block",children:"Nome completo do responsável"}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)(r.User,{className:"absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"}),(0,t.jsx)(g.Input,{id:"nomeResponsavel",type:"text",placeholder:"Digite nome e sobrenome",value:B,onChange:e=>{O(e.target.value),L("")},className:`w-full pl-12 pr-4 py-3 bg-[#0f0f10] border-[#374151] text-white ${V?"border-red-500":""}`})]}),V&&(0,t.jsx)("p",{className:"text-sm text-red-400 mt-2",children:V}),(0,t.jsx)("p",{className:"text-xs text-gray-400 mt-2",children:"Mínimo 2 palavras (nome + sobrenome)"})]}),(0,t.jsxs)("div",{className:"flex gap-3",children:[(0,t.jsx)(h.Button,{type:"button",variant:"outline",onClick:()=>y("produto"),className:"flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"}),(0,t.jsx)(h.Button,{onClick:()=>{let e=function(e){let t=e.trim();if(!t)return{valido:!1,erro:"Nome não pode estar vazio"};let a=t.split(/\s+/).filter(e=>e.length>0);return a.length<2?{valido:!1,erro:"Nome deve ter pelo menos nome e sobrenome (2 palavras)"}:{valido:!0,nomeFormatado:a.map(e=>e.charAt(0).toUpperCase()+e.slice(1).toLowerCase()).join(" ")}}(B);e.valido?(O(e.nomeFormatado),L(""),y("peso")):L(e.erro||"Nome inválido")},className:"flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white",children:"Continuar"})]})]})}),I.length>0&&(0,t.jsxs)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:[(0,t.jsx)("h3",{className:"text-sm font-medium text-gray-300 mb-4",children:"Últimos Responsáveis"}),(0,t.jsx)("div",{className:"grid gap-2",children:I.map(e=>(0,t.jsx)("div",{onClick:()=>{O(e.nomeCompleto),L(""),setTimeout(()=>{let e=document.getElementById("nomeResponsavel");e&&(e.focus(),e instanceof HTMLInputElement&&e.setSelectionRange(e.value.length,e.value.length))},100)},className:`bg-[#0f0f10] border rounded-xl p-4 hover:bg-[#374151] transition-colors cursor-pointer ${B===e.nomeCompleto?"border-[#001F05] bg-[#001F05]/20":"border-[#374151]"}`,children:(0,t.jsxs)("div",{className:"flex items-center justify-between",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("div",{className:"bg-[#001F05] p-2 rounded-lg",children:(0,t.jsx)(r.User,{className:"w-4 h-4 text-white"})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"font-medium text-white",children:e.nomeCompleto}),(0,t.jsxs)("p",{className:"text-xs text-gray-400",children:[e.totalUsos," ",1===e.totalUsos?"uso":"usos"]})]})]}),(0,t.jsx)("button",{onClick:t=>{t.stopPropagation(),ep(e.id,e.nomeCompleto)},className:"p-2 hover:bg-red-500/20 rounded-lg transition-colors",children:(0,t.jsx)(m.Trash2,{className:"w-4 h-4 text-red-400"})})]})},e.id))})]})]}),"peso"===N&&(0,t.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(b.Label,{htmlFor:"peso",className:"text-gray-300 mb-2 block",children:"Peso / Quantidade"}),(0,t.jsxs)("div",{className:"flex gap-3",children:[(0,t.jsxs)("div",{className:"relative flex-1",children:[(0,t.jsx)(n,{className:"absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"}),(0,t.jsx)(g.Input,{id:"peso",type:"number",step:"0.01",min:"0.01",value:U,onChange:e=>G(e.target.value),className:"w-full pl-12 pr-4 py-3 bg-[#0f0f10] border-[#374151] text-white"})]}),(0,t.jsxs)("select",{value:Q,onChange:e=>H(e.target.value),className:"w-32 px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05]",children:[(0,t.jsx)("option",{value:"",children:"Selecione"}),(0,t.jsx)("option",{value:"kg",children:"kg"}),(0,t.jsx)("option",{value:"g",children:"g"}),(0,t.jsx)("option",{value:"L",children:"L"}),(0,t.jsx)("option",{value:"un",children:"un"})]})]})]}),(0,t.jsxs)("div",{className:"flex gap-3",children:[(0,t.jsx)(h.Button,{type:"button",variant:"outline",onClick:()=>y("responsavel"),className:"flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"}),(0,t.jsx)(h.Button,{onClick:()=>y("armazenamento"),disabled:!U||!Q||0>=parseFloat(U),className:"flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white disabled:opacity-50",children:"Continuar"})]})]})}),"armazenamento"===N&&(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsx)("p",{className:"text-sm text-gray-400",children:"Selecione a forma de armazenamento"}),(0,t.jsx)("div",{className:"grid gap-3",children:["CONGELADO","RESFRIADO","TEMPERATURA AMBIENTE"].map(e=>(0,t.jsx)("div",{onClick:()=>{W(e),Y(0),y("dias")},className:`bg-[#141415] border rounded-xl p-4 cursor-pointer transition-colors ${K===e?"border-[#001F05] bg-[#001F05]/20":"border-[#374151] hover:bg-[#374151]"}`,children:(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)(o,{className:"w-5 h-5 text-gray-400"}),(0,t.jsx)("span",{className:"font-medium text-white",children:e})]})},e))}),(0,t.jsx)(h.Button,{type:"button",variant:"outline",onClick:()=>y("peso"),className:"w-full border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"})]}),"dias"===N&&K&&(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsx)("p",{className:"text-sm text-gray-400",children:"Selecione a quantidade de dias de validade"}),(0,t.jsx)("div",{className:"grid gap-3",children:v[K]?.map(e=>(0,t.jsx)("div",{onClick:()=>{Y(e),y("preview")},className:`bg-[#141415] border rounded-xl p-4 cursor-pointer transition-colors ${Z===e?"border-[#001F05] bg-[#001F05]/20":"border-[#374151] hover:bg-[#374151]"}`,children:(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)(c.Calendar,{className:"w-5 h-5 text-gray-400"}),(0,t.jsxs)("span",{className:"font-medium text-white",children:[e," DIAS"]})]})},e))}),(0,t.jsx)(h.Button,{type:"button",variant:"outline",onClick:()=>y("armazenamento"),className:"w-full border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"})]}),"preview"===N&&A&&K&&Z&&(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,t.jsx)("div",{className:"space-y-4",children:(0,t.jsxs)("div",{children:[(0,t.jsx)(b.Label,{htmlFor:"copias",className:"text-lg font-bold text-white mb-3 block",children:"Número de cópias"}),(0,t.jsx)(g.Input,{id:"copias",type:"number",min:"1",max:"10",value:J,onChange:e=>X(parseInt(e.target.value)||1),className:"w-full px-6 py-4 bg-[#0f0f10] border-[#374151] text-white text-2xl font-bold text-center"}),(0,t.jsx)("p",{className:"text-sm text-gray-400 mt-2 text-center",children:1===J?"1 etiqueta será impressa":`${J} etiquetas ser\xe3o impressas`})]})})}),(0,t.jsxs)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:[(0,t.jsx)("h3",{className:"text-lg font-bold text-white mb-4",children:"Pré-visualização da Etiqueta (104x30mm - Duas Colunas)"}),(0,t.jsx)("div",{className:"flex justify-center",children:(0,t.jsx)("div",{id:"etiqueta-preview",className:"bg-white border-2 border-gray-400 shadow-lg",style:{width:"832px",height:"240px"},children:(0,t.jsxs)("div",{className:"h-full flex flex-row gap-4",children:[(0,t.jsxs)("div",{className:"w-1/2 h-full flex flex-col text-black p-2 text-xs leading-tight",children:[(0,t.jsxs)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Responsável:"}),(0,t.jsx)("p",{className:"font-bold text-[10px] mt-0.5",children:B})]}),(0,t.jsx)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:(0,t.jsxs)("p",{className:"font-bold text-sm leading-tight",children:[A.nome.toUpperCase()," ",K]})}),(0,t.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Peso/Qtd:"}),(0,t.jsxs)("p",{className:"font-bold text-xs mt-0.5",children:[U," ",Q]})]}),(0,t.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Produzido:"}),(0,t.jsx)("p",{className:"font-bold text-xs mt-0.5",children:eg()})]})]})}),(0,t.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Validade:"}),(0,t.jsx)("p",{className:"font-bold text-xs mt-0.5",children:eb()})]}),(0,t.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Vence:"}),(0,t.jsx)("p",{className:"font-bold text-xs mt-0.5",children:eh()})]})]})})]}),(0,t.jsxs)("div",{className:"w-1/2 h-full flex flex-col text-black p-2 text-xs leading-tight",children:[(0,t.jsxs)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Responsável:"}),(0,t.jsx)("p",{className:"font-bold text-[10px] mt-0.5",children:B})]}),(0,t.jsx)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:(0,t.jsxs)("p",{className:"font-bold text-sm leading-tight",children:[A.nome.toUpperCase()," ",K]})}),(0,t.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Peso/Qtd:"}),(0,t.jsxs)("p",{className:"font-bold text-xs mt-0.5",children:[U," ",Q]})]}),(0,t.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Produzido:"}),(0,t.jsx)("p",{className:"font-bold text-xs mt-0.5",children:eg()})]})]})}),(0,t.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Validade:"}),(0,t.jsx)("p",{className:"font-bold text-xs mt-0.5",children:eb()})]}),(0,t.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,t.jsx)("span",{className:"font-normal text-[9px]",children:"Vence:"}),(0,t.jsx)("p",{className:"font-bold text-xs mt-0.5",children:eh()})]})]})})]})]})})}),(0,t.jsx)("p",{className:"text-xs text-gray-400 text-center mt-3",children:"Dimensões: 104x30mm (duas etiquetas de 50x30mm cada com 4mm de espaçamento). Não se esqueça de revisar a impressão manual."})]}),(0,t.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,t.jsxs)("div",{className:"space-y-4",children:[(es||er)&&(0,t.jsx)("div",{className:`bg-[#0f0f10] border rounded-lg p-3 ${er?"border-red-500/50 bg-red-500/10":"border-[#374151]"}`,children:(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[et&&!er&&(0,t.jsx)(x.Loader2,{className:"w-4 h-4 animate-spin text-green-500"}),er&&(0,t.jsx)("span",{className:"text-red-500",children:"⚠️"}),(0,t.jsx)("div",{className:"flex-1",children:(0,t.jsx)("p",{className:`text-sm ${er?"text-red-400":"text-gray-300"}`,children:er||es})})]})}),(0,t.jsxs)("div",{className:"space-y-3",children:[(0,t.jsxs)(h.Button,{onClick:()=>{if(!A||!z||!K||!Z)return;let e=window.open("","","width=800,height=600");if(!e)return void alert("Por favor, permita pop-ups para imprimir");let t="",a=Math.ceil(J/2);for(let e=0;e<a;e++){let s=2*e+1,i=eu(),r=s<J?eu():i;t+=`
        <table class="linha-bobina" cellspacing="0" cellpadding="0" style="width: 104mm; min-height: 30mm; height: auto; overflow: visible;">
          <tr style="height: auto;">
            <td class="coluna-etiqueta" style="width: 50mm; min-height: 30mm; height: auto; overflow: visible;">
              ${i}
            </td>
            <td class="coluna-espaco" style="width: 4mm; min-height: 30mm; height: 30mm;"></td>
            <td class="coluna-etiqueta" style="width: 50mm; min-height: 30mm; height: auto; overflow: visible;">
              ${r}
            </td>
          </tr>
        </table>
        ${e<a-1?'<div style="page-break-after: always;"></div>':""}
      `}e.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta - ${A.nome} (${J} ${1===J?"cópia":"cópias"})</title>
        <style>
          /* Reset */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          /* P\xe1gina para duas etiquetas: 50mm + 4mm + 50mm = 104mm x 30mm */
          @page {
            size: 104mm 30mm;
            margin: 0mm;
            padding: 0mm;
          }

          body {
            width: 104mm;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
            overflow: visible !important;
          }

          /* Linha da bobina cont\xe9m duas colunas */
          table.linha-bobina {
            width: 104mm !important;
            min-height: 30mm !important;
            height: auto !important;
            border-collapse: collapse;
            table-layout: fixed;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          /* Cada coluna de etiqueta (50mm x 30mm) */
          .coluna-etiqueta {
            width: 50mm !important;
            min-height: 30mm !important;
            height: auto !important;
            padding: 0.5mm !important;
            vertical-align: top !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
          }
          
          /* Coluna de espa\xe7amento de 4mm */
          .coluna-espaco {
            width: 4mm !important;
            height: 30mm !important;
            padding: 0;
            margin: 0;
          }

          /* Tabela da etiqueta dentro de cada coluna */
          table.etiqueta-coluna {
            width: 100%;
            min-height: 100%;
            height: auto;
            border-collapse: collapse;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
            font-size: 7pt;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
          }

          table.etiqueta-coluna td {
            padding: 0;
            vertical-align: top;
            overflow: visible !important;
          }

          .info-label {
            font-weight: normal;
            font-size: 6pt;
            width: auto;
          }

          .info-value {
            font-weight: bold;
            font-size: 7pt;
            text-align: left;
            width: auto;
          }

          .header {
            text-align: center;
            padding: 0.5mm;
          }
          
          /* Garantir que c\xe9lulas da etiqueta n\xe3o cortem conte\xfado */
          table.etiqueta-coluna tr td {
            padding: 0.3mm 0.5mm !important;
            line-height: 1.2 !important;
          }

          @media print {
            @page {
              size: 104mm 30mm;
              margin: 0mm !important;
              padding: 0mm !important;
            }
            
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            html, body {
              width: 104mm !important;
              height: auto !important;
              min-height: 30mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            table.linha-bobina {
              width: 104mm !important;
              min-height: 30mm !important;
              height: auto !important;
              max-width: 104mm !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            
            table.linha-bobina tr {
              width: 104mm !important;
              min-height: 30mm !important;
              height: auto !important;
            }

            .coluna-etiqueta {
              width: 50mm !important;
              max-width: 50mm !important;
              min-height: 30mm !important;
              height: auto !important;
              vertical-align: top !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: visible !important;
              padding: 0.5mm !important;
            }
            
            .coluna-espaco {
              width: 4mm !important;
              max-width: 4mm !important;
              height: 30mm !important;
              min-height: 30mm !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            table.etiqueta-coluna {
              width: 100% !important;
              min-height: 100% !important;
              height: auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: visible !important;
            }
            
            table.etiqueta-coluna td {
              overflow: visible !important;
            }
          }
        </style>
      </head>
      <body>
        <div style="width: 104mm; min-height: 30mm; height: auto; margin: 0; padding: 0; overflow: visible;">
          ${t}
        </div>
      </body>
      </html>
    `),e.document.close(),e.onload=()=>{setTimeout(()=>{e.focus(),e.print(),setTimeout(()=>{e.close()},500)},250)}},disabled:et,className:"w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg",children:[(0,t.jsx)(d.Printer,{className:"w-6 h-6 mr-2"}),"Imprimir Etiqueta"]}),(0,t.jsx)(h.Button,{onClick:()=>{M(null),O(""),L(""),G(""),H(""),W(""),Y(0),X(1),ei(""),el(""),y("produto")},disabled:et,variant:"outline",className:"w-full border-[#374151] text-gray-300 hover:bg-[#374151] py-6 text-lg",children:"Criar Nova Etiqueta"}),(0,t.jsx)("button",{onClick:()=>em(!0),className:"w-full text-xs text-gray-500 hover:text-blue-400 underline",children:"Ver instruções novamente"})]})]})})]}),(0,t.jsx)(u.Dialog,{open:_.isOpen,onOpenChange:e=>!e&&ee({isOpen:!1,nomeId:null,nomeCompleto:""}),children:(0,t.jsxs)(u.DialogContent,{className:"bg-[#141415] border-[#374151] text-white",children:[(0,t.jsx)(u.DialogHeader,{children:(0,t.jsx)(u.DialogTitle,{children:"Remover Nome"})}),(0,t.jsxs)("p",{className:"text-gray-300 mb-4",children:["Tem certeza que deseja remover ",(0,t.jsx)("strong",{children:_.nomeCompleto})," da lista de nomes recentes?"]}),(0,t.jsxs)("div",{className:"flex gap-3",children:[(0,t.jsx)(h.Button,{variant:"outline",onClick:()=>ee({isOpen:!1,nomeId:null,nomeCompleto:""}),className:"flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Cancelar"}),(0,t.jsx)(h.Button,{onClick:ex,className:"flex-1 bg-red-600 hover:bg-red-700 text-white",children:"Remover"})]})]})}),(0,t.jsx)(u.Dialog,{open:ed,onOpenChange:em,children:(0,t.jsxs)(u.DialogContent,{className:"bg-[#141415] border-[#374151] text-white max-w-2xl",children:[(0,t.jsx)(u.DialogHeader,{children:(0,t.jsx)(u.DialogTitle,{className:"text-2xl",children:"📋 Instruções para a Impressão"})}),(0,t.jsxs)("div",{className:"space-y-6 py-4",children:[(0,t.jsxs)("div",{className:"bg-blue-500/10 border border-blue-500/30 rounded-xl p-6",children:[(0,t.jsx)("h3",{className:"text-lg font-bold text-blue-300 mb-4",children:"🖨️ No painel de impressão:"}),(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{className:"flex items-start gap-3",children:[(0,t.jsx)("div",{className:"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold",children:"1"}),(0,t.jsxs)("div",{className:"flex-1",children:[(0,t.jsx)("p",{className:"font-semibold text-white mb-1",children:"Tamanho do papel"}),(0,t.jsxs)("p",{className:"text-sm text-gray-300",children:["Configurar: ",(0,t.jsx)("span",{className:"font-bold text-green-400",children:"104mm x 30mm"})]}),(0,t.jsxs)("p",{className:"text-sm text-gray-300",children:["Ou: ",(0,t.jsx)("span",{className:"font-bold text-green-400",children:"Personalizado - 104mm x 30mm"})]})]})]}),(0,t.jsxs)("div",{className:"flex items-start gap-3",children:[(0,t.jsx)("div",{className:"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold",children:"2"}),(0,t.jsxs)("div",{className:"flex-1",children:[(0,t.jsx)("p",{className:"font-semibold text-white mb-1",children:"Escala"}),(0,t.jsxs)("p",{className:"text-sm text-gray-300",children:["Deixar em: ",(0,t.jsx)("span",{className:"font-bold text-green-400",children:"100%"})," (tamanho real)"]})]})]}),(0,t.jsxs)("div",{className:"flex items-start gap-3",children:[(0,t.jsx)("div",{className:"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold",children:"3"}),(0,t.jsxs)("div",{className:"flex-1",children:[(0,t.jsx)("p",{className:"font-semibold text-white mb-1",children:"Margens"}),(0,t.jsxs)("p",{className:"text-sm text-gray-300",children:["Configurar: ",(0,t.jsx)("span",{className:"font-bold text-green-400",children:"0mm"})," (sem margens)"]})]})]})]})]}),(0,t.jsx)("div",{className:"bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4",children:(0,t.jsxs)("p",{className:"text-sm text-yellow-300",children:["💡 ",(0,t.jsx)("strong",{children:"Dica:"})," A página tem 104mm x 30mm com duas etiquetas de 50mm x 30mm cada, separadas por 4mm de espaçamento. Certifique-se de configurar o tamanho correto no painel de impressão."]})}),(0,t.jsx)("div",{className:"bg-[#0f0f10] border border-[#374151] rounded-xl p-4",children:(0,t.jsxs)("p",{className:"text-xs text-gray-400",children:[(0,t.jsx)("strong",{children:"Resumo:"}),(0,t.jsx)("br",{}),'• Ao clicar em "Imprimir Etiqueta", a janela de impressão abrirá',(0,t.jsx)("br",{}),"• Configure as opções conforme indicado acima",(0,t.jsx)("br",{}),'• Clique em "Imprimir" para finalizar']})})]}),(0,t.jsx)("div",{className:"flex justify-end",children:(0,t.jsx)(h.Button,{onClick:()=>em(!1),className:"bg-green-600 hover:bg-green-700 text-white",children:"OK, Entendi"})})]})})]})}):(0,t.jsx)("div",{className:"min-h-screen bg-black text-white flex items-center justify-center",children:(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)("p",{className:"text-gray-400 mb-4",children:"Unidade não encontrada"}),(0,t.jsx)(h.Button,{onClick:()=>f.push("/etiquetagem"),className:"bg-[#001F05] hover:bg-[#001F05]/80",children:"Voltar"})]})})}e.s(["default",()=>f],189351)}]);