# 🔧 Correção: Auto-Save no Android (Checklist)

## 🐛 Problema Relatado

**Situação:**
- Usuário no **Android**
- Começou o checklist
- Fechou o navegador após **10 minutos**
- Reabriu: **Mensagem de recuperação NÃO apareceu**

---

## 🔍 Causas Identificadas

### 1. Auto-save só salvava após 5 minutos
```
Tempo    | Ação
---------|------------------
0 min    | Inicia checklist
5 min    | ✅ Primeiro auto-save
10 min   | ❌ Fecha navegador
```

**Problema:** Se fechar antes dos 5 minutos, nada é salvo.

### 2. Recuperação usava IDs errados
```typescript
// ❌ ERRADO (antes):
topicEvals.set(item.itemName, {...});  // Salvava com NOME
restoredEvaluations.set(topic.topicName, topicEvals);

// Mas o código esperava:
evaluations.get(topicId).get(itemId)  // Buscava com ID
```

### 3. Android pode limpar localStorage
- Android em modo "Economizar Bateria"
- Limpeza agressiva de cache
- Private/Incognito mode

---

## ✅ Soluções Implementadas

### 1. **Salvamento Imediato ao Iniciar Checklist**

```typescript
// Agora salva IMEDIATAMENTE ao entrar no checklist
const saveNow = () => { /* salvar */ };

// Salvar logo ao entrar
saveNow();
console.log('💾 Primeiro auto-save realizado');

// Depois continua salvando a cada 5 min
const interval = setInterval(saveNow, 5 * 60 * 1000);
```

**Timeline agora:**
```
Tempo    | Ação
---------|------------------
0 min    | ✅ SALVA IMEDIATAMENTE
2 min    | (tem backup)
5 min    | ✅ Auto-save periódico
10 min   | ✅ Fecha navegador (backup existe!)
```

### 2. **Salvamento Após Cada Mudança**

```typescript
const setItemEvaluation = (...) => {
  // Marcar item
  setEvaluations(newEvaluations);

  // 💾 Salvar após 2 segundos (debounce)
  setTimeout(() => {
    localStorage.setItem('checklist_backup', ...);
  }, 2000);
};
```

**Benefício:** Cada item marcado → backup atualizado.

### 3. **Correção da Recuperação (IDs Corretos)**

```typescript
// ✅ CORRETO (agora):
evaluation.topics.forEach((topic: any) => {
  // Buscar tópico pelo nome
  const topicDef = CHECKLIST_TOPICS.find(t => t.name === topic.topicName);
  
  if (topicDef) {
    const topicEvals = new Map();
    
    topic.items.forEach((item: any) => {
      // Buscar item pelo nome
      const itemDef = topicDef.items.find(i => i.name === item.itemName);
      
      if (itemDef) {
        // Usar ID correto!
        topicEvals.set(itemDef.id, {
          status: item.status,
          observations: item.observations,
          photoUrls: item.photoUrls || [],
        });
      }
    });
    
    // Usar ID correto do tópico!
    restoredEvaluations.set(topicDef.id, topicEvals);
  }
});
```

### 4. **Restauração de Observações dos Tópicos**

```typescript
// Restaurar observações gerais dos tópicos
if (topic.observations) {
  restoredTopicObservations.set(topicDefinition.id, topic.observations);
}

setTopicObservations(restoredTopicObservations);
```

### 5. **Ir Direto para o Checklist**

```typescript
// Se já havia itens marcados, voltar direto para o checklist
if (restoredEvaluations.size > 0) {
  setCurrentStep('checklist');
}
```

---

## 🧪 Como Testar (Android)

### Teste 1: Salvamento Imediato

1. Abra `/checklist/nova-avaliacao`
2. Preencha loja e supervisor
3. Clique em "Iniciar Checklist"
4. **IMEDIATAMENTE** abra DevTools (Chrome Android):
   - Menu → Mais Ferramentas → DevTools Remoto
   - Ou use `chrome://inspect` no desktop
5. No console, digite:
```javascript
JSON.parse(localStorage.getItem('checklist_backup'))
```
6. Deve mostrar o backup mesmo sem marcar nada!

### Teste 2: Recuperação

1. Inicie checklist
2. Marque 2-3 itens
3. Feche o navegador **completamente** (não apenas a aba)
4. Aguarde 30 segundos
5. Reabra `/checklist/nova-avaliacao`
6. Deve aparecer: **"💾 Encontramos um checklist não salvo!"**

### Teste 3: Salvamento por Item

1. Inicie checklist
2. Marque um item
3. Aguarde 3 segundos
4. No console:
```javascript
const backup = JSON.parse(localStorage.getItem('checklist_backup'));
console.log('Itens marcados:', backup.evaluation.topics[0].items.filter(i => i.status !== 'FORA DO PADRÃO'));
```
5. Deve mostrar o item que você marcou!

---

## 📱 Específico para Android

### Verificar se LocalStorage Funciona

```javascript
// No console do Chrome Android:
try {
  localStorage.setItem('test', 'abc');
  console.log('✅ LocalStorage funciona:', localStorage.getItem('test'));
  localStorage.removeItem('test');
} catch (e) {
  console.error('❌ LocalStorage bloqueado:', e);
}
```

### Se LocalStorage Não Funcionar

**Possíveis causas:**
1. **Private/Incognito Mode**
2. **Configuração de privacidade**
3. **Modo Economizar Bateria**
4. **Limpeza automática**

**Soluções alternativas:**

#### Opção 1: IndexedDB (mais robusto)

```typescript
// Usar IndexedDB ao invés de localStorage
import { openDB } from 'idb';

const db = await openDB('checklist', 1, {
  upgrade(db) {
    db.createObjectStore('backups');
  },
});

// Salvar
await db.put('backups', evaluation, 'current');

// Recuperar
const backup = await db.get('backups', 'current');
```

#### Opção 2: SessionStorage (temporário)

```typescript
// Usar sessionStorage (dura enquanto aba estiver aberta)
sessionStorage.setItem('checklist_backup', JSON.stringify(data));
```

#### Opção 3: Cookie (mais compatível)

```typescript
// Salvar em cookie (limite de 4KB)
document.cookie = `checklist_backup=${encodeURIComponent(JSON.stringify(data))}; max-age=86400`;
```

---

## 🔧 Debug no Android

### 1. Habilitar Logs Detalhados

Adicione no início do `checkForBackup`:

```typescript
const checkForBackup = () => {
  console.log('🔍 Verificando backup...');
  console.log('📦 LocalStorage disponível:', typeof localStorage !== 'undefined');
  
  try {
    const backup = localStorage.getItem('checklist_backup');
    console.log('💾 Backup encontrado:', backup ? 'SIM' : 'NÃO');
    
    if (backup) {
      console.log('📄 Tamanho do backup:', backup.length, 'caracteres');
      const parsed = JSON.parse(backup);
      console.log('📊 Dados:', parsed);
      // ... resto do código
    }
  } catch (e) {
    console.error('❌ Erro:', e);
  }
};
```

### 2. Testar Persistência

```javascript
// Salvar timestamp
localStorage.setItem('test_timestamp', new Date().toISOString());

// Fechar e reabrir navegador

// Verificar
console.log('Salvou:', localStorage.getItem('test_timestamp'));
```

### 3. Ver Todos os Dados Salvos

```javascript
// Listar tudo no localStorage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key).substring(0, 100));
}
```

---

## 📊 Melhorias Implementadas

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Primeiro save** | Após 5 min | ✅ Imediato (0 seg) |
| **Save por item** | Não | ✅ Sim (2s debounce) |
| **Recuperação** | Bugada (IDs errados) | ✅ Corrigida |
| **Observações tópico** | Não recuperava | ✅ Recupera |
| **Voltar ao checklist** | Ficava na info | ✅ Vai direto |

---

## 🎯 Resumo das Mudanças

### Arquivo: `app/checklist/nova-avaliacao/page.tsx`

**1. Salvamento imediato ao iniciar:**
```typescript
// Salva assim que entra no checklist
saveNow();
```

**2. Salvamento após cada mudança:**
```typescript
// Em setItemEvaluation(), adiciona:
setTimeout(() => {
  localStorage.setItem('checklist_backup', ...);
}, 2000);
```

**3. Recuperação corrigida:**
```typescript
// Usa CHECKLIST_TOPICS.find() para mapear nomes → IDs
const topicDef = CHECKLIST_TOPICS.find(t => t.name === topic.topicName);
topicEvals.set(itemDef.id, {...});
```

---

## ✅ Checklist de Teste (Android)

- [ ] Inicia checklist → Verifica backup imediato
- [ ] Marca 1 item → Aguarda 3s → Verifica backup
- [ ] Fecha navegador após 2 min → Reabre → Recupera
- [ ] Marca 5 itens → Fecha → Reabre → Todos recuperados
- [ ] Adiciona observação → Fecha → Reabre → Observação mantida
- [ ] Adiciona foto → Fecha → Reabre → Foto mantida
- [ ] Passa 10 min → Fecha → Reabre → Tudo OK

---

## 🚀 Status

✅ **Salvamento imediato implementado**  
✅ **Salvamento por item implementado**  
✅ **Recuperação corrigida (IDs)**  
✅ **Observações de tópico recuperadas**  
✅ **Retorno direto ao checklist**  
✅ **Sem erros de linting**  
✅ **Pronto para Android**  

**Agora deve funcionar perfeitamente no Android! 📱✨**
