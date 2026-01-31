# 🖨️ Guia de Impressão de Etiquetas - PT-260

## 📋 Situação Atual

- ✅ **OpenLabel conectou** com sucesso no celular Android via Bluetooth
- ❌ **Site não encontra** a impressora quando tenta imprimir
- 🎯 **Necessidade**: Funcionar em Android, Notebook e PC (via cabo USB ou Bluetooth)

## 🔍 Por que o Site Não Encontra a Impressora?

O método atual (`window.print()`) **não funciona** com impressoras Bluetooth diretamente porque:

1. **Web Bluetooth API** tem limitações:
   - Funciona apenas no **Chrome/Edge** (desktop e Android)
   - Requer **HTTPS** (ou localhost)
   - Muitas impressoras usam **Bluetooth Classic** (não BLE), que não é totalmente suportado
   - Requer implementação de comandos **ESC/POS**

2. **window.print()** é genérico:
   - Abre o diálogo de impressão do sistema
   - Não detecta impressoras Bluetooth pareadas
   - Não envia comandos ESC/POS específicos para impressoras térmicas

## ✅ Melhor Alternativa: Solução Híbrida Multi-Plataforma

### **Opção 1: Web Bluetooth API + Web Serial API (Recomendada)**

Esta é a **melhor solução técnica** que funciona diretamente no navegador:

#### **Vantagens:**
- ✅ Funciona no **Chrome/Edge** (Android e Desktop)
- ✅ Suporta **Bluetooth** e **USB** (via Web Serial API)
- ✅ Não requer apps externos
- ✅ Funciona direto do site

#### **Limitações:**
- ⚠️ Requer **HTTPS** (ou localhost para desenvolvimento)
- ⚠️ Apenas **Chrome/Edge** (não funciona no Safari/Firefox)
- ⚠️ Usuário precisa **selecionar** a impressora manualmente na primeira vez

#### **Bibliotecas Recomendadas:**
- `escpos-web-bluetooth` - Para Bluetooth via Web Bluetooth API
- `escpos-usb-adapter` - Para USB via Web Serial API
- `node-thermal-printer` - Para formatação de comandos ESC/POS

### **Opção 2: Integração com Apps Nativos (Mais Simples)**

Usar apps como ponte entre o site e a impressora:

#### **Para Android:**
- **OpenLabel** (já funciona) - Compartilhar dados via Intent
- **Print Label** - Alternativa

#### **Para PC/Notebook:**
- **P-touch Editor** (Brother) - Software oficial
- **RawBT** - Serviço de impressão Bluetooth

#### **Como Funciona:**
1. Site gera dados da etiqueta (JSON ou imagem)
2. Site compartilha via **Web Share API** ou **download de arquivo**
3. App nativo recebe e imprime

### **Opção 3: Servidor Backend + Drivers (Mais Robusta)**

Criar um serviço backend que se comunica com a impressora:

#### **Vantagens:**
- ✅ Funciona em **qualquer navegador**
- ✅ Mais controle sobre a impressão
- ✅ Suporta múltiplas impressoras simultaneamente

#### **Desvantagens:**
- ⚠️ Requer servidor sempre rodando
- ⚠️ Mais complexo de implementar
- ⚠️ Para USB, precisa de drivers no servidor

## 🎯 Recomendação Final

### **Para Implementação Imediata:**

**Solução Híbrida com Detecção Automática:**

1. **Android (Chrome/Edge)**: 
   - Tentar **Web Bluetooth API** primeiro
   - Se falhar, oferecer **compartilhamento** com OpenLabel

2. **PC/Notebook (Chrome/Edge)**:
   - Tentar **Web Serial API** (USB) primeiro
   - Tentar **Web Bluetooth API** (Bluetooth) como alternativa
   - Fallback para **impressão do sistema** (window.print)

3. **Outros Navegadores**:
   - Usar **impressão do sistema** (window.print)
   - Ou oferecer **download** de arquivo para imprimir manualmente

### **Estrutura da Solução:**

```
┌─────────────────────────────────────┐
│   Site (Next.js)                    │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Detector de Plataforma     │   │
│   └─────────────────────────────┘   │
│              │                       │
│    ┌─────────┴─────────┐            │
│    │                   │            │
│ Android            Desktop          │
│    │                   │            │
│ Web Bluetooth    Web Serial/USB    │
│    │                   │            │
│ Fallback:        Fallback:         │
│ Compartilhar     window.print()    │
└─────────────────────────────────────┘
```

## 📚 Bibliotecas Necessárias

### **Para Web Bluetooth:**
```bash
npm install escpos-web-bluetooth
```

### **Para Web Serial (USB):**
```bash
npm install escpos-usb-adapter
```

### **Para Formatação ESC/POS:**
```bash
npm install node-thermal-printer
```

## 🔧 Próximos Passos

1. ✅ **Implementar detecção de plataforma**
2. ✅ **Implementar Web Bluetooth API** (Android/Chrome)
3. ✅ **Implementar Web Serial API** (PC/Chrome via USB)
4. ✅ **Implementar fallbacks** (compartilhamento/impressão sistema)
5. ✅ **Testar em todas as plataformas**

## 📝 Notas Importantes

- **PT-260** usa comandos **ESC/POS** padrão
- Tamanho de etiqueta: **50mm x 30mm** (já configurado no CSS)
- A impressora precisa estar **pareada** antes de usar Web Bluetooth
- Para USB, pode precisar de **permissões** do sistema

## 🚀 Status

- [ ] Implementação pendente
- [ ] Aguardando aprovação para implementar
