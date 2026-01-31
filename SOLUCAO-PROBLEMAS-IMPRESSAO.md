# 🔧 Solução de Problemas - Impressão de Etiquetas

## ✅ Correções Implementadas

### **1. Problema no PC: Diálogo de Porta Serial**

**Sintoma**: Aparece o diálogo pedindo para selecionar porta, mas não imprime.

**Solução**:
1. Quando o diálogo aparecer, **NÃO clique em "Cancelar"**
2. **Selecione a porta COM** da impressora (geralmente COM1, COM3, COM4, etc.)
3. Clique em **"Conectar"**
4. A impressão deve começar automaticamente

**Melhorias implementadas**:
- ✅ Mensagens mais claras sobre o que fazer
- ✅ Suporte a múltiplos baud rates (9600, 115200, 19200, 38400)
- ✅ Melhor tratamento de erros
- ✅ Limpeza automática de recursos em caso de erro

### **2. Problema no Celular: Baixa Arquivo ao Invés de Imprimir**

**Sintoma**: A impressora aparece na lista, mas depois baixa um arquivo.

**Causa**: O Web Bluetooth está encontrando a impressora, mas a conexão está falhando silenciosamente.

**Solução**:
1. Certifique-se de que a impressora está **ligada e pareada**
2. Quando aparecer a lista de dispositivos, **selecione a impressora PT-260**
3. Aguarde a conexão (pode levar alguns segundos)
4. Se ainda baixar arquivo, tente:
   - Desligar e ligar o Bluetooth do celular
   - "Esquecer" e re-parear a impressora
   - Usar o app OpenLabel como alternativa

**Melhorias implementadas**:
- ✅ Melhor tratamento de erros do Web Bluetooth
- ✅ Mensagens de erro mais específicas
- ✅ Logs detalhados no console para debug
- ✅ Não cai no fallback se o usuário cancelar

## 📋 Instruções Passo a Passo

### **No PC (Chrome/Edge com USB)**

1. Conecte a impressora PT-260 via cabo USB
2. Abra o Chrome ou Edge
3. Vá para a página de gerar etiqueta
4. Preencha os dados e clique em "Imprimir"
5. **Um diálogo aparecerá** pedindo para selecionar a porta
6. **Selecione a porta COM** (ex: COM1, COM3, COM4)
7. Clique em **"Conectar"**
8. Aguarde a impressão

**Se não aparecer nenhuma porta**:
- Verifique se a impressora está conectada
- Verifique se os drivers estão instalados
- Tente desconectar e reconectar o cabo USB
- Reinicie o navegador

### **No Celular (Chrome/Edge com Bluetooth)**

1. Certifique-se de que a impressora está ligada
2. Pareie a impressora com o celular (via configurações do Android)
3. Abra o Chrome ou Edge no celular
4. Vá para a página de gerar etiqueta
5. Preencha os dados e clique em "Imprimir"
6. **Um diálogo aparecerá** pedindo para selecionar dispositivo
7. **Selecione a impressora PT-260** na lista
8. Aguarde a conexão e impressão

**Se a impressora não aparecer na lista**:
- Verifique se está pareada
- Tente desligar e ligar o Bluetooth
- Tente "esquecer" e re-parear a impressora
- Verifique se a impressora está em modo de pareamento

## 🔍 Debug e Logs

Para ver logs detalhados:

1. Abra o **Console do Desenvolvedor** (F12)
2. Vá para a aba **Console**
3. Tente imprimir
4. Veja as mensagens de log que começam com `[Impressão]`

**Logs úteis**:
- `Enviando X bytes para impressora` - Dados sendo enviados
- `Porta aberta com sucesso em X baud` - Conexão estabelecida
- `Dados enviados com sucesso` - Impressão concluída
- Mensagens de erro específicas

## ⚠️ Problemas Comuns

### **"Web Serial não suportado"**
- Use Chrome 89+ ou Edge 89+
- Não funciona no Safari/Firefox

### **"Nenhuma porta serial encontrada"**
- Verifique se a impressora está conectada via USB
- Verifique se os drivers estão instalados
- Tente desconectar e reconectar

### **"Permissão negada"**
- Clique em "Permitir" quando o navegador pedir permissão
- Verifique as configurações de permissões do site

### **"Impressora não encontrada" (Bluetooth)**
- Verifique se está ligada e pareada
- Tente re-parear
- Verifique se está em modo de pareamento

### **"Erro ao enviar dados"**
- Verifique se a impressora está ligada
- Verifique se há papel na impressora
- Tente reiniciar a impressora

## 🎯 Próximos Passos

Se ainda tiver problemas:

1. **Verifique os logs** no console do navegador
2. **Teste com o app OpenLabel** para confirmar que a impressora funciona
3. **Verifique a conexão** (USB ou Bluetooth)
4. **Tente em outro navegador** (Chrome/Edge)
5. **Verifique se está em HTTPS** (ou localhost)

## 📞 Suporte

Se o problema persistir, forneça:
- Plataforma (PC/Android)
- Navegador e versão
- Mensagens de erro do console
- Passos que você seguiu
