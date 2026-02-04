# 🔧 Solução de Problemas - Impressão Térmica

## ❌ Problema: "Impressão concluída" mas não imprime

Se aparecer a mensagem de sucesso mas a impressora não imprimiu nada:

### **1. Verificar Console do Navegador (F12)**

1. Abra as ferramentas do desenvolvedor (F12)
2. Vá na aba "Console"
3. Procure por mensagens como:
   - ✅ `Porta aberta em 9600 baud` - Conexão OK
   - 📤 `Enviado: 450/450 bytes (100%)` - Dados enviados
   - ❌ Erros em vermelho - Problema na comunicação

### **2. Verificar Impressora**

#### **A. Impressora está ligada e pronta?**
- ✅ LED aceso/piscando
- ✅ Tampa fechada corretamente
- ✅ Papel carregado
- ✅ Sem mensagens de erro na impressora

#### **B. Cabo USB conectado corretamente?**
- ✅ Cabo bem conectado em ambas as pontas
- ✅ Testar outra porta USB do computador
- ✅ Testar outro cabo USB (se possível)

#### **C. Driver instalado?**
- Algumas impressoras precisam de driver
- Verifique no Gerenciador de Dispositivos (Windows)
- A impressora deve aparecer como porta COM (ex: COM3, COM4)

### **3. Testar com Página de Teste**

1. Na tela de pré-visualização da etiqueta
2. Clique em **"Testar Impressora"**
3. Verifique se imprime uma etiqueta de teste
4. Se não imprimir, veja os logs no console (F12)

### **4. Velocidade de Comunicação (Baud Rate)**

A impressora i9 geralmente usa **9600 baud**. O sistema tenta automaticamente:
- 9600 baud (padrão i9)
- 115200 baud
- 19200 baud
- 38400 baud
- 57600 baud

Se continuar sem imprimir, pode ser necessário configurar manualmente na impressora.

### **5. Resetar e Reconectar**

1. Clique em **"Trocar Impressora"**
2. Desligue a impressora
3. Desconecte o cabo USB
4. Aguarde 10 segundos
5. Conecte o cabo USB
6. Ligue a impressora
7. Tente imprimir novamente

### **6. Verificar Configurações da Impressora**

A impressora i9 precisa estar configurada para:
- ✅ Modo ESC/POS (não modo CPCL)
- ✅ Velocidade: 9600 baud
- ✅ Bits de dados: 8
- ✅ Paridade: None
- ✅ Stop bits: 1

Consulte o manual da i9 para acessar as configurações.

### **7. Testar com Outro Software**

Para verificar se é problema da impressora ou do site:

1. Baixe um software de teste ESC/POS (ex: "ESC/POS Print Test")
2. Tente imprimir com o software de teste
3. Se funcionar: o problema está no site/navegador
4. Se não funcionar: o problema está na impressora/cabo/driver

## 🐛 Logs de Debug

O sistema agora mostra logs detalhados no console:

```
✅ Porta aberta em 9600 baud
📄 Enviando 450 bytes para impressora
📤 Enviado: 32/450 bytes (7%)
📤 Enviado: 64/450 bytes (14%)
...
📤 Enviado: 450/450 bytes (100%)
✅ Todos os dados enviados
⏳ Aguardando impressora processar...
🔓 Liberando writer
✅ Impressão enviada - porta mantida aberta
```

Se houver erro, aparecerá:
```
❌ Erro detalhado USB: [mensagem de erro]
```

## 💡 Dicas Adicionais

### **Impressora não aparece na lista?**
- Verifique se o driver está instalado
- A impressora precisa estar ligada ANTES de abrir o navegador
- Tente reiniciar o navegador

### **Erro "Failed to open serial port"?**
- Outra aplicação pode estar usando a porta
- Feche outros programas que possam estar usando a impressora
- Reinicie o computador

### **Impressão lenta?**
- Normal: cada etiqueta leva 2-3 segundos
- O sistema envia dados em pequenos blocos para maior confiabilidade
- Aguarde até ver a mensagem de conclusão

## 📞 Suporte Técnico

Se nenhuma solução funcionou:

1. Copie os logs do console (F12 > Console)
2. Anote o modelo exato da impressora
3. Anote a mensagem de erro (se houver)
4. Entre em contato com o suporte

## ✅ Checklist Rápido

Antes de reportar problema, verifique:

- [ ] Impressora ligada e pronta
- [ ] Cabo USB conectado
- [ ] Driver instalado (aparece no Gerenciador de Dispositivos)
- [ ] Tampa fechada e papel carregado
- [ ] Testou com botão "Testar Impressora"
- [ ] Verificou os logs no console (F12)
- [ ] Tentou desligar/ligar a impressora
- [ ] Tentou outro cabo USB (se possível)
- [ ] Tentou outra porta USB do computador
