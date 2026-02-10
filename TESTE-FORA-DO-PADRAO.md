# 🧪 Guia de Debug: Itens "FORA DO PADRÃO"

## 🎯 Teste para Identificar o Problema

### Passo 1: Limpar Backup Anterior
1. Abra o checklist
2. Clique no botão **"🧪 Debug: Ver Backup Salvo"**
3. Se aparecer um backup, **limpe o navegador** ou **abra em aba anônima**

### Passo 2: Criar um Novo Checklist com "FORA DO PADRÃO"
1. Preencha Loja e Supervisor
2. Clique em "Iniciar Checklist"
3. No primeiro tópico, escolha um item:
   - **Clique no botão vermelho "FORA DO PADRÃO"** ← Importante clicar!
   - Adicione um comentário: `"Teste de comentário fora do padrão"`
   - Tire 1 foto (qualquer uma)
4. Marque mais 1-2 itens como "DE ACORDO" para comparação
5. **Aguarde 5 segundos** (para o auto-save)

### Passo 3: Verificar o Backup
1. Clique no botão **"🧪 Debug: Ver Backup Salvo"**
2. Veja na mensagem:
   ```
   🔴 Itens "FORA DO PADRÃO" com dados: X
   
   Exemplos:
   - Nome do item
     Comentário: Teste de comentário...
     Fotos: 1
   ```
3. **Abra o console** (F12) e veja os logs detalhados

### Passo 4: Testar a Recuperação
1. Feche o navegador
2. Abra novamente
3. Clique em "OK" na mensagem de recuperação
4. **Verifique se:**
   - ✅ O botão "FORA DO PADRÃO" está vermelho (marcado)
   - ✅ O comentário apareceu
   - ✅ A foto está lá

## 🔍 O Que Observar

### No Console (F12)
Procure por logs como:
```
✅ Item restaurado: Nome do Item
{
  status: "FORA DO PADRÃO",
  fotos: 1,
  comentario: "sim"
}
```

### Possíveis Problemas

#### ❌ Problema 1: Item não está sendo salvo
Se no debug você ver `🔴 Itens "FORA DO PADRÃO" com dados: 0`, então:
- **Causa**: O botão "FORA DO PADRÃO" não está salvando no Map
- **Solução**: Verificar função `setItemEvaluation`

#### ❌ Problema 2: Item está salvo mas não restaura
Se no debug você ver itens salvos, mas após recuperar eles não aparecem:
- **Causa**: Problema na função `checkForBackup`
- **Logs no console** vão mostrar onde está falhando

#### ❌ Problema 3: Visual não atualiza
Se o item está no Map mas o botão não fica vermelho:
- **Causa**: Problema de renderização
- **Solução**: Verificar o className condicional

## 📸 Screenshot Esperado

Após clicar no debug, você deve ver algo como:

```
📦 Backup encontrado!

Loja: Uberaba
Salvo: 09/02/2026 22:30:00

🔴 Itens "FORA DO PADRÃO" com dados: 1

Exemplos:
- Balcão limpo e higienizado
  Comentário: Teste de comentário fora d...
  Fotos: 1
```

## 🚀 Próximo Passo

Depois de fazer esse teste completo:
1. **Tire screenshots** do que aparecer no debug
2. **Copie os logs do console** (F12)
3. Me envie para eu identificar exatamente onde está o problema

---

**Data**: 09/02/2026 23:00
**Status**: Aguardando teste do usuário
