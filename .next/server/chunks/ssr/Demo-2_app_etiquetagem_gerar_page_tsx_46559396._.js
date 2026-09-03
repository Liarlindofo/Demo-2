module.exports=[157700,a=>{"use strict";var b=a.i(322230),c=a.i(27648),d=a.i(232048),e=a.i(702515),f=a.i(171477),g=a.i(295849);let h=(0,g.default)("scale",[["path",{d:"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"7g6ntu"}],["path",{d:"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"ijws7r"}],["path",{d:"M7 21h10",key:"1b0cd5"}],["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",key:"3gwbw2"}]]),i=(0,g.default)("cog",[["path",{d:"M11 10.27 7 3.34",key:"16pf9h"}],["path",{d:"m11 13.73-4 6.93",key:"794ttg"}],["path",{d:"M12 22v-2",key:"1osdcq"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M14 12h8",key:"4f43i9"}],["path",{d:"m17 20.66-1-1.73",key:"eq3orb"}],["path",{d:"m17 3.34-1 1.73",key:"2wel8s"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"m20.66 17-1.73-1",key:"sg0v6f"}],["path",{d:"m20.66 7-1.73 1",key:"1ow05n"}],["path",{d:"m3.34 17 1.73-1",key:"nuk764"}],["path",{d:"m3.34 7 1.73 1",key:"1ulond"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["circle",{cx:"12",cy:"12",r:"8",key:"46899m"}]]);var j=a.i(189285),k=a.i(704191),l=a.i(614080),m=a.i(516498),n=a.i(439049),o=a.i(159192),p=a.i(754071),q=a.i(816024),r=a.i(262833);let s={CONGELADO:[30,60,90],RESFRIADO:[1,3,4,5,7,15,20],"TEMPERATURA AMBIENTE":[7,15,20,30]};function t(){let a,g,t=(0,d.useRouter)(),u=(0,d.useSearchParams)().get("unidade"),[v,w]=(0,c.useState)("produto"),[x,y]=(0,c.useState)(!0),[z,A]=(0,c.useState)(!1),[B,C]=(0,c.useState)(""),[D,E]=(0,c.useState)(null),[F,G]=(0,c.useState)([]),[H,I]=(0,c.useState)([]),[J,K]=(0,c.useState)(""),[L,M]=(0,c.useState)(null),[N,O]=(0,c.useState)(""),[P,Q]=(0,c.useState)(""),[R,S]=(0,c.useState)(""),[T,U]=(0,c.useState)(""),[V,W]=(0,c.useState)(""),[X,Y]=(0,c.useState)(0),[Z,$]=(0,c.useState)(1),[_,aa]=(0,c.useState)({isOpen:!1,nomeId:null,nomeCompleto:""}),[ab,ac]=(0,c.useState)(!1),[ad,ae]=(0,c.useState)(""),[af,ag]=(0,c.useState)(""),[ah,ai]=(0,c.useState)(null),[aj,ak]=(0,c.useState)(!1);(0,c.useEffect)(()=>{u?al():t.push("/etiquetagem")},[u]),(0,c.useEffect)(()=>{"preview"===v&&ak(!0)},[v]),(0,c.useEffect)(()=>{"responsavel"===v&&H.length>0&&""===(N||"").trim()&&O(H[0].nomeCompleto)},[v,H,N]);let al=async()=>{try{y(!0);let a=await fetch("/api/etiquetagem/unidades");if(!a.ok)throw Error("Erro ao carregar unidade");let b=(await a.json()).find(a=>a.id===u);if(!b)return void t.push("/etiquetagem");E(b);let[c,d]=await Promise.all([fetch("/api/etiquetagem/produtos"),fetch(`/api/etiquetagem/unidades/${u}/nomes`)]);if(!c.ok||!d.ok)throw Error("Erro ao carregar dados");let e=await c.json(),f=await d.json();G(e),I(f)}catch(a){console.error("Erro ao carregar dados:",a),C("Erro ao carregar dados. Tente novamente.")}finally{y(!1)}},am=async(a,b)=>{aa({isOpen:!0,nomeId:a,nomeCompleto:b})},an=async()=>{if(_.nomeId)try{if(!(await fetch(`/api/etiquetagem/nomes/${_.nomeId}`,{method:"DELETE"})).ok)throw Error("Erro ao excluir nome");I(H.filter(a=>a.id!==_.nomeId)),aa({isOpen:!1,nomeId:null,nomeCompleto:""})}catch(a){console.error("Erro ao excluir nome:",a)}},ao=()=>{if(!X)return"";let a=new Date;a.setDate(a.getDate()+X);let b=String(a.getDate()).padStart(2,"0"),c=String(a.getMonth()+1).padStart(2,"0");return`${b}/${c}`},ap=()=>{let a=new Date,b=String(a.getDate()).padStart(2,"0"),c=String(a.getMonth()+1).padStart(2,"0");return`${b}/${c}`},aq=()=>`${X} dias`,ar=()=>`
      <table class="etiqueta-coluna" cellspacing="0" cellpadding="0">
        <tbody>
          <!-- Respons\xe1vel -->
          <tr>
            <td colspan="2" style="text-align: center; padding: 0.4mm 0.3mm;">
              <div style="font-size: 5.5pt; line-height: 1.1;">
                <span style="font-weight: normal;">Respons\xe1vel:</span><br>
                <span style="font-weight: bold; font-size: 6.5pt;">${N}</span>
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
                ${L.nome} ${V}
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
                <span style="font-weight: bold; font-size: 7pt;">${R} ${T}</span>
              </div>
            </td>
            <td style="width: 50%; border-left: 1px solid black; padding: 0.4mm 0.3mm 0.4mm 0.5mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.2;">
                <span style="font-weight: normal;">Produzido:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${ap()}</span>
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
                <span style="font-weight: bold; font-size: 7pt;">${aq()}</span>
              </div>
            </td>
            <td style="width: 50%; border-left: 1px solid black; padding: 0.4mm 0.3mm 0.4mm 0.5mm; vertical-align: top;">
              <div style="font-size: 6pt; line-height: 1.2;">
                <span style="font-weight: normal;">Vence:</span><br>
                <span style="font-weight: bold; font-size: 7pt;">${ao()}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    `,as=F.filter(a=>a.nome.toLowerCase().includes(J.toLowerCase()));return x?(0,b.jsx)("div",{className:"min-h-screen bg-black text-white flex items-center justify-center",children:(0,b.jsx)("div",{className:"inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#001F05] border-t-transparent"})}):D?(0,b.jsx)("div",{className:"min-h-screen bg-black text-white",children:(0,b.jsxs)("div",{className:"container mx-auto px-4 py-8 max-w-4xl",children:[(0,b.jsxs)(o.Button,{onClick:()=>t.push("/etiquetagem"),variant:"ghost",className:"mb-6 text-gray-400 hover:text-white",children:[(0,b.jsx)(m.ArrowLeft,{className:"w-4 h-4 mr-2"}),"Voltar"]}),(0,b.jsx)("h1",{className:"text-3xl font-bold mb-8",children:"Gerar Etiqueta"}),(g=(a=[{key:"produto",label:"Produto"},{key:"responsavel",label:"Responsável"},{key:"peso",label:"Peso"},{key:"armazenamento",label:"Armazenamento"},{key:"dias",label:"Validade"},{key:"preview",label:"Pré-Visualização"}]).findIndex(a=>a.key===v),(0,b.jsx)("div",{className:"flex items-center justify-between mb-6 overflow-x-auto",children:a.map((c,d)=>(0,b.jsxs)("div",{className:"flex items-center flex-1 min-w-0",children:[(0,b.jsxs)("div",{className:"flex flex-col items-center min-w-0",children:[(0,b.jsx)("div",{className:`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${d<=g?"bg-[#001F05] text-white":"bg-[#374151] text-gray-400"}`,children:d+1}),(0,b.jsx)("span",{className:"text-xs mt-1 text-gray-400 hidden sm:block truncate",children:c.label})]}),d<a.length-1&&(0,b.jsx)("div",{className:`h-1 flex-1 mx-2 rounded ${d<g?"bg-[#001F05]":"bg-[#374151]"}`})]},c.key))})),B&&(0,b.jsx)("div",{className:"bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6",children:B}),"produto"===v&&(0,b.jsxs)("div",{className:"space-y-4",children:[(0,b.jsxs)("div",{className:"relative",children:[(0,b.jsx)(e.Search,{className:"absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"}),(0,b.jsx)(p.Input,{type:"text",placeholder:"Buscar produto...",value:J,onChange:a=>K(a.target.value),className:"w-full pl-12 pr-4 py-3 bg-[#141415] border-[#374151] text-white"})]}),(0,b.jsx)("div",{className:"grid gap-3",children:as.map(a=>(0,b.jsxs)("div",{onClick:()=>{M(a),S(a.pesoPadrao&&a.pesoPadrao>.01?a.pesoPadrao.toString():""),U(a.unidadeMedida&&""!==a.unidadeMedida.trim()?a.unidadeMedida:""),w("responsavel")},className:"bg-[#141415] border border-[#374151] rounded-xl p-4 hover:bg-[#374151] transition-colors cursor-pointer",children:[(0,b.jsx)("h3",{className:"font-semibold text-white mb-1",children:a.nome}),(0,b.jsx)("p",{className:"text-sm text-gray-400",children:a.categoria?.nome})]},a.id))})]}),"responsavel"===v&&(0,b.jsxs)("div",{className:"space-y-6",children:[(0,b.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,b.jsxs)("div",{className:"space-y-4",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)(q.Label,{htmlFor:"nomeResponsavel",className:"text-gray-300 mb-2 block",children:"Nome completo do responsável"}),(0,b.jsxs)("div",{className:"relative",children:[(0,b.jsx)(f.User,{className:"absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"}),(0,b.jsx)(p.Input,{id:"nomeResponsavel",type:"text",placeholder:"Digite nome e sobrenome",value:N,onChange:a=>{O(a.target.value),Q("")},className:`w-full pl-12 pr-4 py-3 bg-[#0f0f10] border-[#374151] text-white ${P?"border-red-500":""}`})]}),P&&(0,b.jsx)("p",{className:"text-sm text-red-400 mt-2",children:P}),(0,b.jsx)("p",{className:"text-xs text-gray-400 mt-2",children:"Mínimo 2 palavras (nome + sobrenome)"})]}),(0,b.jsxs)("div",{className:"flex gap-3",children:[(0,b.jsx)(o.Button,{type:"button",variant:"outline",onClick:()=>w("produto"),className:"flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"}),(0,b.jsx)(o.Button,{onClick:()=>{let a=function(a){let b=a.trim();if(!b)return{valido:!1,erro:"Nome não pode estar vazio"};let c=b.split(/\s+/).filter(a=>a.length>0);return c.length<2?{valido:!1,erro:"Nome deve ter pelo menos nome e sobrenome (2 palavras)"}:{valido:!0,nomeFormatado:c.map(a=>a.charAt(0).toUpperCase()+a.slice(1).toLowerCase()).join(" ")}}(N);a.valido?(O(a.nomeFormatado),Q(""),w("peso")):Q(a.erro||"Nome inválido")},className:"flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white",children:"Continuar"})]})]})}),H.length>0&&(0,b.jsxs)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:[(0,b.jsx)("h3",{className:"text-sm font-medium text-gray-300 mb-4",children:"Últimos Responsáveis"}),(0,b.jsx)("div",{className:"grid gap-2",children:H.map(a=>(0,b.jsx)("div",{onClick:()=>{O(a.nomeCompleto),Q(""),setTimeout(()=>{let a=document.getElementById("nomeResponsavel");a&&(a.focus(),a instanceof HTMLInputElement&&a.setSelectionRange(a.value.length,a.value.length))},100)},className:`bg-[#0f0f10] border rounded-xl p-4 hover:bg-[#374151] transition-colors cursor-pointer ${N===a.nomeCompleto?"border-[#001F05] bg-[#001F05]/20":"border-[#374151]"}`,children:(0,b.jsxs)("div",{className:"flex items-center justify-between",children:[(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsx)("div",{className:"bg-[#001F05] p-2 rounded-lg",children:(0,b.jsx)(f.User,{className:"w-4 h-4 text-white"})}),(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"font-medium text-white",children:a.nomeCompleto}),(0,b.jsxs)("p",{className:"text-xs text-gray-400",children:[a.totalUsos," ",1===a.totalUsos?"uso":"usos"]})]})]}),(0,b.jsx)("button",{onClick:b=>{b.stopPropagation(),am(a.id,a.nomeCompleto)},className:"p-2 hover:bg-red-500/20 rounded-lg transition-colors",children:(0,b.jsx)(k.Trash2,{className:"w-4 h-4 text-red-400"})})]})},a.id))})]})]}),"peso"===v&&(0,b.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,b.jsxs)("div",{className:"space-y-4",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)(q.Label,{htmlFor:"peso",className:"text-gray-300 mb-2 block",children:"Peso / Quantidade"}),(0,b.jsxs)("div",{className:"flex gap-3",children:[(0,b.jsxs)("div",{className:"relative flex-1",children:[(0,b.jsx)(h,{className:"absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"}),(0,b.jsx)(p.Input,{id:"peso",type:"number",step:"0.01",min:"0.01",value:R,onChange:a=>S(a.target.value),className:"w-full pl-12 pr-4 py-3 bg-[#0f0f10] border-[#374151] text-white"})]}),(0,b.jsxs)("select",{value:T,onChange:a=>U(a.target.value),className:"w-32 px-4 py-3 rounded-lg border border-[#374151] bg-[#0f0f10] text-white focus:outline-none focus:ring-2 focus:ring-[#001F05]",children:[(0,b.jsx)("option",{value:"",children:"Selecione"}),(0,b.jsx)("option",{value:"kg",children:"kg"}),(0,b.jsx)("option",{value:"g",children:"g"}),(0,b.jsx)("option",{value:"L",children:"L"}),(0,b.jsx)("option",{value:"un",children:"un"})]})]})]}),(0,b.jsxs)("div",{className:"flex gap-3",children:[(0,b.jsx)(o.Button,{type:"button",variant:"outline",onClick:()=>w("responsavel"),className:"flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"}),(0,b.jsx)(o.Button,{onClick:()=>w("armazenamento"),disabled:!R||!T||0>=parseFloat(R),className:"flex-1 bg-[#001F05] hover:bg-[#001F05]/80 text-white disabled:opacity-50",children:"Continuar"})]})]})}),"armazenamento"===v&&(0,b.jsxs)("div",{className:"space-y-4",children:[(0,b.jsx)("p",{className:"text-sm text-gray-400",children:"Selecione a forma de armazenamento"}),(0,b.jsx)("div",{className:"grid gap-3",children:["CONGELADO","RESFRIADO","TEMPERATURA AMBIENTE"].map(a=>(0,b.jsx)("div",{onClick:()=>{W(a),Y(0),w("dias")},className:`bg-[#141415] border rounded-xl p-4 cursor-pointer transition-colors ${V===a?"border-[#001F05] bg-[#001F05]/20":"border-[#374151] hover:bg-[#374151]"}`,children:(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsx)(i,{className:"w-5 h-5 text-gray-400"}),(0,b.jsx)("span",{className:"font-medium text-white",children:a})]})},a))}),(0,b.jsx)(o.Button,{type:"button",variant:"outline",onClick:()=>w("peso"),className:"w-full border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"})]}),"dias"===v&&V&&(0,b.jsxs)("div",{className:"space-y-4",children:[(0,b.jsx)("p",{className:"text-sm text-gray-400",children:"Selecione a quantidade de dias de validade"}),(0,b.jsx)("div",{className:"grid gap-3",children:s[V]?.map(a=>(0,b.jsx)("div",{onClick:()=>{Y(a),w("preview")},className:`bg-[#141415] border rounded-xl p-4 cursor-pointer transition-colors ${X===a?"border-[#001F05] bg-[#001F05]/20":"border-[#374151] hover:bg-[#374151]"}`,children:(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsx)(l.Calendar,{className:"w-5 h-5 text-gray-400"}),(0,b.jsxs)("span",{className:"font-medium text-white",children:[a," DIAS"]})]})},a))}),(0,b.jsx)(o.Button,{type:"button",variant:"outline",onClick:()=>w("armazenamento"),className:"w-full border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Voltar"})]}),"preview"===v&&L&&V&&X&&(0,b.jsxs)("div",{className:"space-y-6",children:[(0,b.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,b.jsx)("div",{className:"space-y-4",children:(0,b.jsxs)("div",{children:[(0,b.jsx)(q.Label,{htmlFor:"copias",className:"text-lg font-bold text-white mb-3 block",children:"Número de cópias"}),(0,b.jsx)(p.Input,{id:"copias",type:"number",min:"1",max:"10",value:Z,onChange:a=>$(parseInt(a.target.value)||1),className:"w-full px-6 py-4 bg-[#0f0f10] border-[#374151] text-white text-2xl font-bold text-center"}),(0,b.jsx)("p",{className:"text-sm text-gray-400 mt-2 text-center",children:1===Z?"1 etiqueta será impressa":`${Z} etiquetas ser\xe3o impressas`})]})})}),(0,b.jsxs)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:[(0,b.jsx)("h3",{className:"text-lg font-bold text-white mb-4",children:"Pré-visualização da Etiqueta (104x30mm - Duas Colunas)"}),(0,b.jsx)("div",{className:"flex justify-center",children:(0,b.jsx)("div",{id:"etiqueta-preview",className:"bg-white border-2 border-gray-400 shadow-lg",style:{width:"832px",height:"240px"},children:(0,b.jsxs)("div",{className:"h-full flex flex-row gap-4",children:[(0,b.jsxs)("div",{className:"w-1/2 h-full flex flex-col text-black p-2 text-xs leading-tight",children:[(0,b.jsxs)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Responsável:"}),(0,b.jsx)("p",{className:"font-bold text-[10px] mt-0.5",children:N})]}),(0,b.jsx)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:(0,b.jsxs)("p",{className:"font-bold text-sm leading-tight",children:[L.nome.toUpperCase()," ",V]})}),(0,b.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,b.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Peso/Qtd:"}),(0,b.jsxs)("p",{className:"font-bold text-xs mt-0.5",children:[R," ",T]})]}),(0,b.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Produzido:"}),(0,b.jsx)("p",{className:"font-bold text-xs mt-0.5",children:ap()})]})]})}),(0,b.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,b.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Validade:"}),(0,b.jsx)("p",{className:"font-bold text-xs mt-0.5",children:aq()})]}),(0,b.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Vence:"}),(0,b.jsx)("p",{className:"font-bold text-xs mt-0.5",children:ao()})]})]})})]}),(0,b.jsxs)("div",{className:"w-1/2 h-full flex flex-col text-black p-2 text-xs leading-tight",children:[(0,b.jsxs)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Responsável:"}),(0,b.jsx)("p",{className:"font-bold text-[10px] mt-0.5",children:N})]}),(0,b.jsx)("div",{className:"text-center border-b border-gray-800 pb-1 mb-1",children:(0,b.jsxs)("p",{className:"font-bold text-sm leading-tight",children:[L.nome.toUpperCase()," ",V]})}),(0,b.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,b.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Peso/Qtd:"}),(0,b.jsxs)("p",{className:"font-bold text-xs mt-0.5",children:[R," ",T]})]}),(0,b.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Produzido:"}),(0,b.jsx)("p",{className:"font-bold text-xs mt-0.5",children:ap()})]})]})}),(0,b.jsx)("div",{className:"border-b border-gray-800 pb-1 mb-1",children:(0,b.jsxs)("div",{className:"grid grid-cols-2 gap-1",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Validade:"}),(0,b.jsx)("p",{className:"font-bold text-xs mt-0.5",children:aq()})]}),(0,b.jsxs)("div",{className:"border-l border-gray-800 pl-1",children:[(0,b.jsx)("span",{className:"font-normal text-[9px]",children:"Vence:"}),(0,b.jsx)("p",{className:"font-bold text-xs mt-0.5",children:ao()})]})]})})]})]})})}),(0,b.jsx)("p",{className:"text-xs text-gray-400 text-center mt-3",children:"Dimensões: 104x30mm (duas etiquetas de 50x30mm cada com 4mm de espaçamento). Não se esqueça de revisar a impressão manual."})]}),(0,b.jsx)("div",{className:"bg-[#141415] border border-[#374151] rounded-xl p-6",children:(0,b.jsxs)("div",{className:"space-y-4",children:[(ad||af)&&(0,b.jsx)("div",{className:`bg-[#0f0f10] border rounded-lg p-3 ${af?"border-red-500/50 bg-red-500/10":"border-[#374151]"}`,children:(0,b.jsxs)("div",{className:"flex items-center gap-2",children:[ab&&!af&&(0,b.jsx)(n.Loader2,{className:"w-4 h-4 animate-spin text-green-500"}),af&&(0,b.jsx)("span",{className:"text-red-500",children:"⚠️"}),(0,b.jsx)("div",{className:"flex-1",children:(0,b.jsx)("p",{className:`text-sm ${af?"text-red-400":"text-gray-300"}`,children:af||ad})})]})}),(0,b.jsxs)("div",{className:"space-y-3",children:[(0,b.jsxs)(o.Button,{onClick:()=>{if(!L||!D||!V||!X)return;let a=window.open("","","width=800,height=600");if(!a)return void alert("Por favor, permita pop-ups para imprimir");let b="",c=Math.ceil(Z/2);for(let a=0;a<c;a++){let d=2*a+1,e=ar(),f=d<Z?ar():e;b+=`
        <table class="linha-bobina" cellspacing="0" cellpadding="0" style="width: 104mm; min-height: 30mm; height: auto; overflow: visible;">
          <tr style="height: auto;">
            <td class="coluna-etiqueta" style="width: 50mm; min-height: 30mm; height: auto; overflow: visible;">
              ${e}
            </td>
            <td class="coluna-espaco" style="width: 4mm; min-height: 30mm; height: 30mm;"></td>
            <td class="coluna-etiqueta" style="width: 50mm; min-height: 30mm; height: auto; overflow: visible;">
              ${f}
            </td>
          </tr>
        </table>
        ${a<c-1?'<div style="page-break-after: always;"></div>':""}
      `}a.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiqueta - ${L.nome} (${Z} ${1===Z?"cópia":"cópias"})</title>
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
          ${b}
        </div>
      </body>
      </html>
    `),a.document.close(),a.onload=()=>{setTimeout(()=>{a.focus(),a.print(),setTimeout(()=>{a.close()},500)},250)}},disabled:ab,className:"w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg",children:[(0,b.jsx)(j.Printer,{className:"w-6 h-6 mr-2"}),"Imprimir Etiqueta"]}),(0,b.jsx)(o.Button,{onClick:()=>{M(null),O(""),Q(""),S(""),U(""),W(""),Y(0),$(1),ae(""),ag(""),w("produto")},disabled:ab,variant:"outline",className:"w-full border-[#374151] text-gray-300 hover:bg-[#374151] py-6 text-lg",children:"Criar Nova Etiqueta"}),(0,b.jsx)("button",{onClick:()=>ak(!0),className:"w-full text-xs text-gray-500 hover:text-blue-400 underline",children:"Ver instruções novamente"})]})]})})]}),(0,b.jsx)(r.Dialog,{open:_.isOpen,onOpenChange:a=>!a&&aa({isOpen:!1,nomeId:null,nomeCompleto:""}),children:(0,b.jsxs)(r.DialogContent,{className:"bg-[#141415] border-[#374151] text-white",children:[(0,b.jsx)(r.DialogHeader,{children:(0,b.jsx)(r.DialogTitle,{children:"Remover Nome"})}),(0,b.jsxs)("p",{className:"text-gray-300 mb-4",children:["Tem certeza que deseja remover ",(0,b.jsx)("strong",{children:_.nomeCompleto})," da lista de nomes recentes?"]}),(0,b.jsxs)("div",{className:"flex gap-3",children:[(0,b.jsx)(o.Button,{variant:"outline",onClick:()=>aa({isOpen:!1,nomeId:null,nomeCompleto:""}),className:"flex-1 border-[#374151] text-gray-300 hover:bg-[#374151]",children:"Cancelar"}),(0,b.jsx)(o.Button,{onClick:an,className:"flex-1 bg-red-600 hover:bg-red-700 text-white",children:"Remover"})]})]})}),(0,b.jsx)(r.Dialog,{open:aj,onOpenChange:ak,children:(0,b.jsxs)(r.DialogContent,{className:"bg-[#141415] border-[#374151] text-white max-w-2xl",children:[(0,b.jsx)(r.DialogHeader,{children:(0,b.jsx)(r.DialogTitle,{className:"text-2xl",children:"📋 Instruções para a Impressão"})}),(0,b.jsxs)("div",{className:"space-y-6 py-4",children:[(0,b.jsxs)("div",{className:"bg-blue-500/10 border border-blue-500/30 rounded-xl p-6",children:[(0,b.jsx)("h3",{className:"text-lg font-bold text-blue-300 mb-4",children:"🖨️ No painel de impressão:"}),(0,b.jsxs)("div",{className:"space-y-4",children:[(0,b.jsxs)("div",{className:"flex items-start gap-3",children:[(0,b.jsx)("div",{className:"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold",children:"1"}),(0,b.jsxs)("div",{className:"flex-1",children:[(0,b.jsx)("p",{className:"font-semibold text-white mb-1",children:"Tamanho do papel"}),(0,b.jsxs)("p",{className:"text-sm text-gray-300",children:["Configurar: ",(0,b.jsx)("span",{className:"font-bold text-green-400",children:"104mm x 30mm"})]}),(0,b.jsxs)("p",{className:"text-sm text-gray-300",children:["Ou: ",(0,b.jsx)("span",{className:"font-bold text-green-400",children:"Personalizado - 104mm x 30mm"})]})]})]}),(0,b.jsxs)("div",{className:"flex items-start gap-3",children:[(0,b.jsx)("div",{className:"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold",children:"2"}),(0,b.jsxs)("div",{className:"flex-1",children:[(0,b.jsx)("p",{className:"font-semibold text-white mb-1",children:"Escala"}),(0,b.jsxs)("p",{className:"text-sm text-gray-300",children:["Deixar em: ",(0,b.jsx)("span",{className:"font-bold text-green-400",children:"100%"})," (tamanho real)"]})]})]}),(0,b.jsxs)("div",{className:"flex items-start gap-3",children:[(0,b.jsx)("div",{className:"w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold",children:"3"}),(0,b.jsxs)("div",{className:"flex-1",children:[(0,b.jsx)("p",{className:"font-semibold text-white mb-1",children:"Margens"}),(0,b.jsxs)("p",{className:"text-sm text-gray-300",children:["Configurar: ",(0,b.jsx)("span",{className:"font-bold text-green-400",children:"0mm"})," (sem margens)"]})]})]})]})]}),(0,b.jsx)("div",{className:"bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4",children:(0,b.jsxs)("p",{className:"text-sm text-yellow-300",children:["💡 ",(0,b.jsx)("strong",{children:"Dica:"})," A página tem 104mm x 30mm com duas etiquetas de 50mm x 30mm cada, separadas por 4mm de espaçamento. Certifique-se de configurar o tamanho correto no painel de impressão."]})}),(0,b.jsx)("div",{className:"bg-[#0f0f10] border border-[#374151] rounded-xl p-4",children:(0,b.jsxs)("p",{className:"text-xs text-gray-400",children:[(0,b.jsx)("strong",{children:"Resumo:"}),(0,b.jsx)("br",{}),'• Ao clicar em "Imprimir Etiqueta", a janela de impressão abrirá',(0,b.jsx)("br",{}),"• Configure as opções conforme indicado acima",(0,b.jsx)("br",{}),'• Clique em "Imprimir" para finalizar']})})]}),(0,b.jsx)("div",{className:"flex justify-end",children:(0,b.jsx)(o.Button,{onClick:()=>ak(!1),className:"bg-green-600 hover:bg-green-700 text-white",children:"OK, Entendi"})})]})})]})}):(0,b.jsx)("div",{className:"min-h-screen bg-black text-white flex items-center justify-center",children:(0,b.jsxs)("div",{className:"text-center",children:[(0,b.jsx)("p",{className:"text-gray-400 mb-4",children:"Unidade não encontrada"}),(0,b.jsx)(o.Button,{onClick:()=>t.push("/etiquetagem"),className:"bg-[#001F05] hover:bg-[#001F05]/80",children:"Voltar"})]})})}a.s(["default",()=>t],157700)}];

//# sourceMappingURL=Demo-2_app_etiquetagem_gerar_page_tsx_46559396._.js.map