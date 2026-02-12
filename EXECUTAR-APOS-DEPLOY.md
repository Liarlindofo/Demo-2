# ✅ CHECKLIST DE DEPLOY - Executar Após Build

## 🎯 **VOCÊ ESTÁ AQUI:**
✅ Código enviado para Vercel  
⏳ Aguardando deploy terminar...

---

## 📋 **EXECUTE ESTES 2 COMANDOS (NESTA ORDEM):**

### **1️⃣ AGUARDE O DEPLOY TERMINAR** ⏳
Acesse: https://vercel.com/seu-projeto/deployments  
Aguarde até aparecer: **✅ Ready** (2-3 minutos)

---

### **2️⃣ EXECUTE A MIGRAÇÃO DO BANCO** 🔧

**Abra no navegador:**
```
https://platefull.com.br/api/checklist/drafts/migrate
```

**OU via Console (F12):**
```javascript
fetch('https://platefull.com.br/api/checklist/drafts/migrate')
  .then(r => r.json())
  .then(d => {
    console.log('✅ Resultado:', d);
    alert(d.message);
  });
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Migração executada com sucesso! Banco atualizado.",
  "removedConstraints": 1
}
```

---

### **3️⃣ (OPCIONAL) LIMPAR RASCUNHOS ANTIGOS** 🧹

**Se continuar com erro 500, execute:**
```javascript
fetch('https://platefull.com.br/api/checklist/drafts/clean', { 
  method: 'POST' 
})
.then(r => r.json())
.then(d => {
  console.log('✅ Limpeza:', d);
  alert(`${d.deletedCount} rascunho(s) deletado(s)`);
});
```

---

## 🧪 **TESTE COMPLETO:**

### **No Android:**
1. Abra o checklist
2. **NÃO selecione loja**
3. Adicione 5+ fotos
4. Adicione comentários
5. Aguarde 2 segundos
6. ✅ Deve aparecer: **"✅ Salvo às HH:MM"**
7. Feche e reabra
8. ✅ Deve restaurar tudo

### **No PC:**
1. Abra o checklist
2. Adicione 10+ fotos
3. ✅ Não deve dar erro 413
4. ✅ Todas as fotos devem salvar

---

## ❌ **SE DER ERRO:**

### **Erro 500 ainda aparece:**
1. Execute o passo 3 (limpar rascunhos)
2. Tente novamente

### **Erro 413 ainda aparece:**
1. Verifique se o deploy terminou
2. Force refresh (Ctrl+Shift+R)
3. Limpe cache do navegador

### **"Tabela não existe":**
```bash
# Execute localmente:
npx prisma db push
```

---

## 📊 **O QUE FOI CORRIGIDO:**

| Erro | Antes | Depois |
|------|-------|--------|
| **PC - Erro 413** | ❌ Limite 4MB | ✅ Limite 50MB |
| **Android - Erro 500** | ❌ Constraint UNIQUE | ✅ Índice simples |
| **2º checklist sem loja** | ❌ Falha | ✅ Funciona |
| **Múltiplas fotos** | ❌ Salva 2 | ✅ Salva todas |

---

## 🎉 **APÓS TUDO FUNCIONAR:**

✅ Erro 413 resolvido permanentemente  
✅ Erro 500 resolvido permanentemente  
✅ Auto-save confiável (PC e Android)  
✅ Sem limite de fotos (até 50MB)  
✅ Múltiplos checklists por usuário  

---

**Boa sorte! 🚀**

**Qualquer dúvida, me chame novamente.**
