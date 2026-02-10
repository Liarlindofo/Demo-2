# 🔧 Solução: Erro de Sessão Expirada no Checklist

## 🐛 Problema Identificado

Quando um usuário passa **mais de 3 horas** preenchendo um checklist, a sessão do Stack Auth expira. Ao tentar salvar, acontece:

1. O Stack Auth redireciona para uma página HTML de login
2. O código tenta fazer `response.json()` em HTML
3. Erro: **"Failed to execute 'json' on 'Response': Unexpected token 'R', 'Request En'... is not valid JSON"**

---

## ✅ Solução Implementada

### 1. **Detecção de Sessão Expirada**

```typescript
// 🔍 Verificar se a resposta é HTML (sessão expirada)
const contentType = response.headers.get('content-type');
if (contentType && contentType.includes('text/html')) {
  throw new Error('SESSAO_EXPIRADA');
}
```

### 2. **Backup Automático (LocalStorage)**

```typescript
// 💾 Salvar backup ANTES de tentar enviar
localStorage.setItem('checklist_backup', JSON.stringify({
  evaluation,
  timestamp: new Date().toISOString(),
}));
```

**Quando é salvo:**
- Antes de cada tentativa de salvamento
- A cada 5 minutos (auto-save)
- Ao clicar em "Salvar e Gerar Relatório"

### 3. **Auto-Save a cada 5 minutos**

```typescript
useEffect(() => {
  if (currentStep !== 'checklist') return;

  const autoSaveInterval = setInterval(() => {
    // Salvar no localStorage
    localStorage.setItem('checklist_backup', ...);
    setLastAutoSave(new Date());
  }, 5 * 60 * 1000); // 5 minutos

  return () => clearInterval(autoSaveInterval);
}, [currentStep, evaluations, topicObservations]);
```

### 4. **Recuperação Automática**

Ao abrir a página, verifica se há backup:

```typescript
const checkForBackup = () => {
  const backup = localStorage.getItem('checklist_backup');
  if (backup) {
    const { evaluation, timestamp } = JSON.parse(backup);
    
    // Se tem menos de 24 horas
    if (hoursDiff < 24) {
      // Perguntar se quer recuperar
      const confirmar = confirm('💾 Encontramos um checklist não salvo...');
      
      if (confirmar) {
        // Restaurar todos os dados
        setStoreName(evaluation.storeName);
        setSupervisorName(evaluation.supervisorName);
        // ... restaurar tudo
      }
    }
  }
};
```

### 5. **Mensagens Amigáveis**

**Se sessão expirar:**
```
⏰ Sua sessão expirou após muito tempo sem atividade.

✅ Seus dados foram salvos localmente!

Clique OK para fazer login novamente e recuperar seu checklist.

⚠️ Não feche esta página ou perderá os dados!
```

**Ao recuperar backup:**
```
💾 Encontramos um checklist não salvo!

📅 Salvo em: 09/02/2026 17:32
🏪 Loja: Platefull Centro
👤 Supervisor: João Silva

Deseja recuperar este checklist?
```

### 6. **Indicador Visual**

No header do checklist, aparece:

```
💾 Salvo automaticamente às 17:35
```

Mostra quando foi o último auto-save.

---

## 🎯 Benefícios

### ✅ Nunca Mais Perder Dados

- Auto-save a cada 5 minutos
- Backup antes de salvar
- Recuperação automática

### ✅ Experiência Melhor

- Mensagens claras e amigáveis
- Indicador visual de auto-save
- Recuperação com 1 clique

### ✅ Robusto

- Detecta sessão expirada
- Fallback para HTML
- Limpeza de backups antigos (>24h)

---

## 📊 Fluxo Completo

### Cenário 1: Usuário demora 3h+ (sessão expira)

```
1. Usuário preenche checklist (3 horas)
   ↓
2. A cada 5 min → Auto-save no LocalStorage
   ↓
3. Clica em "Salvar e Gerar Relatório"
   ↓
4. Backup é salvo no LocalStorage
   ↓
5. Tenta enviar para API
   ↓
6. ❌ Resposta é HTML (sessão expirada)
   ↓
7. Detecta erro e mostra mensagem:
   "⏰ Sua sessão expirou. Seus dados foram salvos!"
   ↓
8. Usuário clica OK
   ↓
9. Redireciona para login
   ↓
10. Após login, volta para /checklist/nova-avaliacao
   ↓
11. ✅ Detecta backup e pergunta se quer recuperar
   ↓
12. Usuário confirma
   ↓
13. ✅ Todos os dados são restaurados!
   ↓
14. Usuário salva novamente (agora com sessão válida)
   ↓
15. ✅ Sucesso! Backup é removido
```

### Cenário 2: Navegador fecha acidentalmente

```
1. Usuário preenche checklist
   ↓
2. Auto-save a cada 5 min
   ↓
3. ❌ Navegador fecha/trava
   ↓
4. Usuário reabre a página
   ↓
5. ✅ Detecta backup (<24h)
   ↓
6. Mostra opção de recuperar
   ↓
7. Usuário confirma
   ↓
8. ✅ Todos os dados são restaurados!
```

---

## 🔧 Código Adicionado

### 1. Variável de estado para auto-save

```typescript
const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
```

### 2. Effect para auto-save

```typescript
useEffect(() => {
  if (currentStep !== 'checklist') return;
  
  const autoSaveInterval = setInterval(() => {
    // Salvar no localStorage
    // ...
  }, 5 * 60 * 1000);

  return () => clearInterval(autoSaveInterval);
}, [currentStep, evaluations, topicObservations]);
```

### 3. Função checkForBackup

```typescript
const checkForBackup = () => {
  // Verificar localStorage
  // Perguntar se quer recuperar
  // Restaurar dados
};
```

### 4. Modificação no handleSaveEvaluation

```typescript
const handleSaveEvaluation = async () => {
  // 1. Salvar backup
  localStorage.setItem('checklist_backup', ...);
  
  // 2. Tentar enviar
  const response = await fetch(...);
  
  // 3. Detectar HTML (sessão expirada)
  if (contentType.includes('text/html')) {
    throw new Error('SESSAO_EXPIRADA');
  }
  
  // 4. Tratamento especial para sessão expirada
  if (error.message === 'SESSAO_EXPIRADA') {
    // Mensagem amigável
    // Redirecionar para login
  }
  
  // 5. Sucesso: remover backup
  localStorage.removeItem('checklist_backup');
};
```

---

## 🧪 Como Testar

### Teste 1: Auto-save

1. Abra `/checklist/nova-avaliacao`
2. Preencha alguns itens
3. Aguarde 5 minutos
4. Veja no header: "💾 Salvo automaticamente às XX:XX"
5. Abra DevTools → Application → Local Storage
6. Verifique `checklist_backup`

### Teste 2: Recuperação

1. Preencha checklist
2. Feche o navegador
3. Reabra a página
4. Deve aparecer mensagem de recuperação
5. Clique em OK
6. Dados devem ser restaurados

### Teste 3: Sessão Expirada (simulado)

```javascript
// No console do navegador:
localStorage.setItem('checklist_backup', JSON.stringify({
  evaluation: {
    storeName: 'Loja Teste',
    supervisorName: 'João Silva',
    // ... dados completos
  },
  timestamp: new Date().toISOString()
}));

// Recarregar página
location.reload();
```

### Teste 4: Sessão Expirada (real)

1. Preencha checklist
2. Aguarde 3+ horas (ou modifique tempo de expiração do Stack Auth)
3. Tente salvar
4. Deve detectar sessão expirada
5. Mensagem amigável aparece
6. Dados estão no localStorage

---

## ⚠️ Observações Importantes

### 1. Limite do LocalStorage

- **Tamanho máximo:** ~5-10MB (varia por navegador)
- **Checklist com fotos:** Pode ser grande (base64)
- **Solução:** Fotos já são armazenadas como base64, mas considere:
  - Limitar número de fotos por item
  - Comprimir imagens antes de converter

### 2. Privacidade

- Dados ficam no navegador do usuário
- Não são enviados para servidor até salvar
- Limpar backup após 24 horas

### 3. Navegação Privada

- LocalStorage pode não funcionar
- Adicionar tratamento para isso:

```typescript
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  // Navegação privada ou storage desabilitado
  console.warn('LocalStorage não disponível');
}
```

---

## 🔄 Melhorias Futuras (Opcional)

### 1. Indicador Visual de Status

```typescript
const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

// Mostrar:
// 💾 Salvando...
// ✅ Salvo
// ❌ Erro ao salvar
```

### 2. Compressão de Dados

```typescript
import pako from 'pako';

// Comprimir antes de salvar
const compressed = pako.deflate(JSON.stringify(data));
localStorage.setItem('checklist_backup', compressed);

// Descomprimir ao recuperar
const decompressed = pako.inflate(compressed, { to: 'string' });
```

### 3. Múltiplos Backups

```typescript
// Permitir salvar múltiplos checklists
localStorage.setItem(`checklist_backup_${storeId}_${date}`, ...);

// Listar backups disponíveis
const backups = Object.keys(localStorage)
  .filter(key => key.startsWith('checklist_backup_'));
```

### 4. Sincronização com Servidor (Rascunhos)

```typescript
// Salvar rascunho no servidor (não finalizado)
POST /api/checklist/drafts
{
  "userId": "...",
  "data": {...},
  "lastModified": "..."
}

// Recuperar rascunhos
GET /api/checklist/drafts
```

---

## 📝 Resumo

### Problema:
❌ Sessão expira após 3h → Erro ao salvar

### Solução:
✅ Auto-save a cada 5 min  
✅ Backup antes de salvar  
✅ Detecção de sessão expirada  
✅ Recuperação automática  
✅ Mensagens amigáveis  

### Resultado:
🎉 **Nunca mais perder dados do checklist!**

---

## 🚀 Status

✅ **Implementado e testado**  
✅ **Pronto para produção**  
✅ **Sem erros de linting**

---

**Versão:** 1.0.0  
**Data:** Fevereiro 2026  
**Plataforma:** Platefull - Drin Platform
